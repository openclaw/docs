---
read_when:
    - راه‌اندازی کانال BlueBubbles
    - عیب‌یابی جفت‌سازی Webhook
    - پیکربندی iMessage در macOS
sidebarTitle: BlueBubbles
summary: iMessage از طریق سرور macOS BlueBubbles (ارسال/دریافت REST، تایپ، واکنش‌ها، جفت‌سازی، اقدام‌های پیشرفته).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

وضعیت: Plugin بسته‌بندی‌شده که از طریق HTTP با سرور BlueBubbles در macOS ارتباط برقرار می‌کند. **برای یکپارچه‌سازی iMessage توصیه می‌شود**، چون در مقایسه با کانال قدیمی imsg API غنی‌تر و راه‌اندازی آسان‌تری دارد.

<Note>
نسخه‌های فعلی OpenClaw شامل BlueBubbles هستند، بنابراین بیلدهای بسته‌بندی‌شده عادی به مرحله جداگانه `openclaw plugins install` نیاز ندارند.
</Note>

## مرور کلی

- از طریق برنامه کمکی BlueBubbles روی macOS اجرا می‌شود ([bluebubbles.app](https://bluebubbles.app)).
- توصیه‌شده/آزمایش‌شده: macOS Sequoia (15). macOS Tahoe (26) کار می‌کند؛ ویرایش در حال حاضر روی Tahoe خراب است، و به‌روزرسانی‌های آیکون گروه ممکن است موفقیت گزارش کنند اما همگام نشوند.
- OpenClaw از طریق REST API آن با آن ارتباط می‌گیرد (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- پیام‌های ورودی از طریق webhooks می‌رسند؛ پاسخ‌های خروجی، نشانگرهای تایپ، رسیدهای خوانده‌شدن و tapbackها فراخوانی‌های REST هستند.
- پیوست‌ها و استیکرها به‌عنوان رسانه ورودی دریافت می‌شوند (و در صورت امکان در اختیار عامل قرار می‌گیرند).
- پاسخ‌های Auto-TTS که صدای MP3 یا CAF می‌سازند، به‌جای پیوست فایل ساده به‌صورت حباب‌های یادداشت صوتی iMessage تحویل داده می‌شوند.
- جفت‌سازی/فهرست مجاز مانند سایر کانال‌ها کار می‌کند (`/channels/pairing` و غیره) با `channels.bluebubbles.allowFrom` + کدهای جفت‌سازی.
- واکنش‌ها درست مانند Slack/Telegram به‌صورت رویدادهای سیستمی نمایش داده می‌شوند تا عامل‌ها بتوانند پیش از پاسخ‌دادن آن‌ها را «ذکر» کنند.
- قابلیت‌های پیشرفته: ویرایش، لغو ارسال، رشته‌سازی پاسخ، جلوه‌های پیام، مدیریت گروه.

## شروع سریع

<Steps>
  <Step title="نصب BlueBubbles">
    سرور BlueBubbles را روی Mac خود نصب کنید (دستورالعمل‌های [bluebubbles.app/install](https://bluebubbles.app/install) را دنبال کنید).
  </Step>
  <Step title="فعال‌سازی API وب">
    در پیکربندی BlueBubbles، API وب را فعال کنید و یک رمز عبور تنظیم کنید.
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
    webhooks مربوط به BlueBubbles را به gateway خود هدایت کنید (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="راه‌اندازی gateway">
    gateway را راه‌اندازی کنید؛ کنترل‌گر webhook را ثبت می‌کند و جفت‌سازی را آغاز می‌کند.
  </Step>
</Steps>

<Warning>
**امنیت**

- همیشه یک رمز عبور webhook تنظیم کنید.
- احراز هویت Webhook همیشه الزامی است. OpenClaw درخواست‌های webhook مربوط به BlueBubbles را رد می‌کند مگر اینکه شامل password/guid باشند که با `channels.bluebubbles.password` مطابقت دارد (برای مثال `?password=<password>` یا `x-password`)، صرف‌نظر از توپولوژی loopback/proxy.
- احراز هویت رمز عبور پیش از خواندن/تجزیه کامل بدنه‌های webhook بررسی می‌شود.

</Warning>

## زنده نگه داشتن Messages.app (VM / راه‌اندازی‌های بدون نمایشگر)

برخی راه‌اندازی‌های macOS VM / همیشه‌روشن ممکن است باعث شوند Messages.app «بیکار» شود (رویدادهای ورودی تا زمانی که برنامه باز/در پیش‌زمینه شود متوقف می‌شوند). یک راهکار ساده این است که با استفاده از AppleScript + LaunchAgent هر ۵ دقیقه **Messages را تحریک کنید**.

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

    این کار **هر ۳۰۰ ثانیه** و **هنگام ورود** اجرا می‌شود. اجرای نخست ممکن است اعلان‌های **Automation** در macOS را فعال کند (`osascript` → Messages). آن‌ها را در همان نشست کاربری که LaunchAgent را اجرا می‌کند تأیید کنید.

  </Step>
  <Step title="بارگذاری آن">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## راه‌اندازی اولیه

BlueBubbles در راه‌اندازی تعاملی اولیه در دسترس است:

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
  مسیر endpoint مربوط به Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`، `allowlist`، `open`، یا `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  شماره‌های تلفن، ایمیل‌ها، یا اهداف گفتگو.
</ParamField>

همچنین می‌توانید BlueBubbles را از طریق CLI اضافه کنید:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## کنترل دسترسی (DMها + گروه‌ها)

<Tabs>
  <Tab title="DMها">
    - پیش‌فرض: `channels.bluebubbles.dmPolicy = "pairing"`.
    - فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
    - تأیید از طریق:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - جفت‌سازی تبادل توکن پیش‌فرض است. جزئیات: [جفت‌سازی](/fa/channels/pairing)

  </Tab>
  <Tab title="گروه‌ها">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` کنترل می‌کند چه کسی می‌تواند هنگام تنظیم `allowlist` در گروه‌ها فعال‌سازی انجام دهد.

  </Tab>
</Tabs>

### غنی‌سازی نام مخاطب (macOS، اختیاری)

webhooks گروهی BlueBubbles اغلب فقط نشانی‌های خام شرکت‌کنندگان را شامل می‌شوند. اگر می‌خواهید زمینه `GroupMembers` به‌جای آن نام‌های مخاطبان محلی را نشان دهد، می‌توانید غنی‌سازی محلی Contacts را در macOS فعال کنید:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` جستجو را فعال می‌کند. پیش‌فرض: `false`.
- جستجوها فقط پس از آن اجرا می‌شوند که دسترسی گروه، مجوز فرمان و gating ذکر اجازه عبور پیام را داده باشند.
- فقط شرکت‌کنندگان تلفنی بدون نام غنی‌سازی می‌شوند.
- وقتی تطابق محلی پیدا نشود، شماره‌های تلفن خام به‌عنوان fallback باقی می‌مانند.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Gating ذکر (گروه‌ها)

BlueBubbles از gating ذکر برای گفتگوهای گروهی پشتیبانی می‌کند و با رفتار iMessage/WhatsApp مطابقت دارد:

- از `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`) برای تشخیص ذکرها استفاده می‌کند.
- وقتی `requireMention` برای یک گروه فعال باشد، عامل فقط هنگام ذکر شدن پاسخ می‌دهد.
- فرمان‌های کنترلی از فرستندگان مجاز از gating ذکر عبور می‌کنند.

پیکربندی هر گروه:

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

### Gating فرمان

- فرمان‌های کنترلی (مثلاً `/config`، `/model`) به مجوز نیاز دارند.
- از `allowFrom` و `groupAllowFrom` برای تعیین مجوز فرمان استفاده می‌کند.
- فرستندگان مجاز می‌توانند حتی بدون ذکر کردن در گروه‌ها فرمان‌های کنترلی را اجرا کنند.

### اعلان سیستمی هر گروه

هر ورودی زیر `channels.bluebubbles.groups.*` یک رشته اختیاری `systemPrompt` می‌پذیرد. این مقدار در هر نوبتی که پیامی را در آن گروه پردازش می‌کند، به اعلان سیستمی عامل تزریق می‌شود، بنابراین می‌توانید بدون ویرایش اعلان‌های عامل، پرسونا یا قواعد رفتاری هر گروه را تنظیم کنید:

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

کلید با هر چیزی که BlueBubbles برای گروه به‌عنوان `chatGuid` / `chatIdentifier` / عددی `chatId` گزارش می‌کند مطابقت دارد، و یک ورودی wildcard با `"*"` برای هر گروهی که تطابق دقیق ندارد پیش‌فرض فراهم می‌کند (همان الگوی استفاده‌شده توسط `requireMention` و سیاست‌های ابزار هر گروه). تطابق‌های دقیق همیشه بر wildcard مقدم هستند. DMها این فیلد را نادیده می‌گیرند؛ به‌جای آن از سفارشی‌سازی اعلان در سطح عامل یا حساب استفاده کنید.

#### مثال عملی: پاسخ‌های رشته‌ای و واکنش‌های tapback (Private API)

با فعال بودن BlueBubbles Private API، پیام‌های ورودی با شناسه‌های پیام کوتاه می‌رسند (برای مثال `[[reply_to:5]]`) و عامل می‌تواند `action=reply` را فراخوانی کند تا در یک پیام مشخص رشته بسازد یا `action=react` را برای گذاشتن یک tapback اجرا کند. یک `systemPrompt` در سطح گروه راهی قابل اعتماد برای این است که عامل ابزار درست را انتخاب کند:

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

واکنش‌های Tapback و پاسخ‌های رشته‌ای هر دو به BlueBubbles Private API نیاز دارند؛ برای سازوکارهای زیربنایی، [کنش‌های پیشرفته](#advanced-actions) و [شناسه‌های پیام](#message-ids-short-vs-full) را ببینید.

## پیوندهای گفتگوی ACP

گفتگوهای BlueBubbles می‌توانند بدون تغییر لایه انتقال به فضاهای کاری پایدار ACP تبدیل شوند.

جریان سریع اپراتور:

- `/acp spawn codex --bind here` را داخل DM یا گفتگوی گروهی مجاز اجرا کنید.
- پیام‌های آینده در همان گفتگوی BlueBubbles به نشست ACP ایجادشده هدایت می‌شوند.
- `/new` و `/reset` همان نشست ACP پیوندخورده را درجا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و پیوند را حذف می‌کند.

پیوندهای پایدار پیکربندی‌شده نیز از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "bluebubbles"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از هر شکل هدف پشتیبانی‌شده BlueBubbles استفاده کند:

- دسته DM نرمال‌شده مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

برای پیوندهای گروهی پایدار، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.

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

برای رفتار مشترک پیوند ACP، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## تایپ + رسیدهای خوانده‌شدن

- **نشانگرهای تایپ**: پیش و هنگام تولید پاسخ به‌صورت خودکار ارسال می‌شوند.
- **رسیدهای خوانده‌شدن**: توسط `channels.bluebubbles.sendReadReceipts` کنترل می‌شود (پیش‌فرض: `true`).
- **نشانگرهای تایپ**: OpenClaw رویدادهای شروع تایپ را ارسال می‌کند؛ BlueBubbles هنگام ارسال یا timeout تایپ را به‌صورت خودکار پاک می‌کند (توقف دستی از طریق DELETE قابل اعتماد نیست).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## اقدامات پیشرفته

BlueBubbles وقتی در پیکربندی فعال شود، از اقدامات پیشرفتهٔ پیام پشتیبانی می‌کند:

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
    - **react**: واکنش‌های tapback را اضافه/حذف می‌کند (`messageId`, `emoji`, `remove`). مجموعهٔ tapback بومی iMessage شامل `love`، `like`، `dislike`، `laugh`، `emphasize` و `question` است. وقتی عامل یک ایموجی خارج از این مجموعه انتخاب کند (برای مثال `👀`)، ابزار واکنش به `love` برمی‌گردد تا tapback همچنان نمایش داده شود، به‌جای اینکه کل درخواست شکست بخورد. واکنش‌های تأیید پیکربندی‌شده همچنان به‌صورت سخت‌گیرانه اعتبارسنجی می‌شوند و برای مقدارهای ناشناخته خطا می‌دهند.
    - **edit**: یک پیام ارسال‌شده را ویرایش می‌کند (`messageId`, `text`).
    - **unsend**: ارسال یک پیام را لغو می‌کند (`messageId`).
    - **reply**: به یک پیام مشخص پاسخ می‌دهد (`messageId`, `text`, `to`).
    - **sendWithEffect**: با جلوهٔ iMessage ارسال می‌کند (`text`, `to`, `effectId`).
    - **renameGroup**: نام یک گفت‌وگوی گروهی را تغییر می‌دهد (`chatGuid`, `displayName`).
    - **setGroupIcon**: آیکن/عکس یک گفت‌وگوی گروهی را تنظیم می‌کند (`chatGuid`, `media`) — در macOS 26 Tahoe ناپایدار است (API ممکن است موفقیت برگرداند، اما آیکن همگام‌سازی نشود).
    - **addParticipant**: کسی را به یک گروه اضافه می‌کند (`chatGuid`, `address`).
    - **removeParticipant**: کسی را از یک گروه حذف می‌کند (`chatGuid`, `address`).
    - **leaveGroup**: یک گفت‌وگوی گروهی را ترک می‌کند (`chatGuid`).
    - **upload-file**: رسانه/فایل‌ها را ارسال می‌کند (`to`, `buffer`, `filename`, `asVoice`).
      - یادداشت‌های صوتی: برای ارسال به‌عنوان پیام صوتی iMessage، `asVoice: true` را همراه با صدای **MP3** یا **CAF** تنظیم کنید. BlueBubbles هنگام ارسال یادداشت‌های صوتی، MP3 → CAF را تبدیل می‌کند.
    - نام مستعار قدیمی: `sendAttachment` همچنان کار می‌کند، اما `upload-file` نام اقدام استاندارد است.

  </Accordion>
</AccordionGroup>

### شناسه‌های پیام (کوتاه در برابر کامل)

OpenClaw ممکن است برای صرفه‌جویی در توکن‌ها شناسه‌های پیام _کوتاه_ (مثلاً `1`، `2`) نمایش دهد.

- `MessageSid` / `ReplyToId` می‌توانند شناسه‌های کوتاه باشند.
- `MessageSidFull` / `ReplyToIdFull` شامل شناسه‌های کامل ارائه‌دهنده هستند.
- شناسه‌های کوتاه در حافظه نگه‌داری می‌شوند؛ ممکن است با راه‌اندازی دوباره یا پاک‌سازی کش منقضی شوند.
- اقدامات، `messageId` کوتاه یا کامل را می‌پذیرند، اما اگر شناسه‌های کوتاه دیگر در دسترس نباشند خطا می‌دهند.

برای خودکارسازی‌ها و ذخیره‌سازی پایدار، از شناسه‌های کامل استفاده کنید:

- قالب‌ها: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- زمینه: `MessageSidFull` / `ReplyToIdFull` در payloadهای ورودی

برای متغیرهای قالب، [پیکربندی](/fa/gateway/configuration) را ببینید.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## ادغام DMهای split-send (دستور + URL در یک ترکیب)

وقتی کاربر یک دستور و یک URL را با هم در iMessage تایپ می‌کند — مثلاً `Dump https://example.com/article` — Apple ارسال را به **دو تحویل Webhook جداگانه** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک بالون پیش‌نمایش URL (`"https://..."`) همراه با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

در بیشتر راه‌اندازی‌ها، این دو Webhook با فاصلهٔ حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت 1 فقط دستور را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست»)، و URL را فقط در نوبت 2 می‌بیند — در این نقطه زمینهٔ دستور از قبل از دست رفته است.

`channels.bluebubbles.coalesceSameSenderDms` باعث می‌شود یک DM، Webhookهای پیاپی از همان فرستنده را در یک نوبت عامل ادغام کند. گفت‌وگوهای گروهی همچنان بر اساس هر پیام کلیدگذاری می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="When to enable">
    فعال کنید وقتی:

    - Skillsی ارسال می‌کنید که انتظار `command + payload` را در یک پیام دارند (dump، paste، save، queue و غیره).
    - کاربران شما URLها، تصاویر یا محتوای طولانی را کنار دستورها paste می‌کنند.
    - می‌توانید تأخیر اضافه‌شده به نوبت DM را بپذیرید (پایین را ببینید).

    غیرفعال بگذارید وقتی:

    - برای triggerهای تک‌کلمه‌ای DM به کمترین تأخیر دستور نیاز دارید.
    - همهٔ جریان‌های شما دستورهای یک‌مرحله‌ای بدون payloadهای بعدی هستند.

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

    با روشن بودن این flag و نبود `messages.inbound.byChannel.bluebubbles` صریح، پنجرهٔ debounce به **2500 ms** افزایش می‌یابد (پیش‌فرض حالت بدون ادغام 500 ms است). این پنجرهٔ بزرگ‌تر لازم است — آهنگ split-send در Apple، یعنی 0.8 تا 2.0 ثانیه، در پیش‌فرض فشرده‌تر جا نمی‌گیرد.

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
    - **تأخیر اضافه برای دستورهای کنترلی DM.** با روشن بودن این flag، پیام‌های دستور کنترلی DM (مانند `Dump`، `Save` و غیره) اکنون تا پایان پنجرهٔ debounce پیش از dispatch شدن منتظر می‌مانند، در صورتی که Webhook مربوط به payload در راه باشد. دستورهای گفت‌وگوی گروهی dispatch فوری را حفظ می‌کنند.
    - **خروجی ادغام‌شده محدود است** — متن ادغام‌شده با نشانگر صریح `…[truncated]` تا 4000 نویسه محدود می‌شود؛ پیوست‌ها تا 20 محدود می‌شوند؛ ورودی‌های منبع تا 10 محدود می‌شوند (فراتر از آن، نخستین و تازه‌ترین مورد حفظ می‌شوند). هر `messageId` منبع همچنان به inbound-dedupe می‌رسد، بنابراین بازپخش بعدی هر رویداد منفرد توسط MessagePoller به‌عنوان تکراری شناخته می‌شود.
    - **اختیاری، برای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| کاربر ترکیب می‌کند                                                | Apple تحویل می‌دهد        | flag خاموش (پیش‌فرض)                    | flag روشن + پنجرهٔ 2500 ms                                             |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 Webhook با فاصلهٔ ~1 s  | دو نوبت عامل: فقط "Dump"، سپس URL       | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (پیوست + متن)                      | 2 Webhook                 | دو نوبت                                | یک نوبت: متن + تصویر                                                    |
| `/status` (دستور مستقل)                                            | 1 Webhook                 | dispatch فوری                          | **تا پایان پنجره صبر می‌کند، سپس dispatch می‌کند**                     |
| URL به‌تنهایی paste شده                                            | 1 Webhook                 | dispatch فوری                          | dispatch فوری (فقط یک ورودی در bucket)                                  |
| متن + URL به‌عنوان دو پیام جداگانهٔ عمدی، با فاصلهٔ چند دقیقه     | 2 Webhook خارج از پنجره   | دو نوبت                                | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                  |
| سیل سریع (>10 DM کوچک داخل پنجره)                                  | N Webhook                 | N نوبت                                 | یک نوبت، خروجی محدود (نخستین + تازه‌ترین، سقف‌های متن/پیوست اعمال شده) |

### عیب‌یابی ادغام split-send

اگر flag روشن است و split-sendها همچنان به‌صورت دو نوبت می‌رسند، هر لایه را بررسی کنید:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    سپس `openclaw gateway restart` — این flag هنگام ایجاد debouncer-registry خوانده می‌شود.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    به لاگ سرور BlueBubbles در `~/Library/Logs/bluebubbles-server/main.log` نگاه کنید:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    فاصلهٔ بین dispatch متن به سبک `"Dump"` و dispatch بعدی `"https://..."; Attachments:` را اندازه بگیرید. `messages.inbound.byChannel.bluebubbles` را آن‌قدر افزایش دهید که آن فاصله را با حاشیهٔ کافی پوشش دهد.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    timestampهای رویداد جلسه (`~/.openclaw/agents/<id>/sessions/*.jsonl`) نشان می‌دهند Gateway چه زمانی یک پیام را به عامل تحویل داده است، **نه** اینکه Webhook چه زمانی رسیده است. پیام دومِ در صف که با `[Queued messages while agent was busy]` برچسب خورده یعنی نوبت اول هنوز هنگام رسیدن Webhook دوم در حال اجرا بوده است — bucket ادغام از قبل flush شده بود. پنجره را بر اساس لاگ سرور BB تنظیم کنید، نه لاگ جلسه.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    روی ماشین‌های کوچک‌تر (8 GB)، نوبت‌های عامل ممکن است آن‌قدر طول بکشند که bucket ادغام پیش از کامل شدن پاسخ flush شود و URL به‌عنوان نوبت دومِ در صف وارد شود. `memory_pressure` و `ps -o rss -p $(pgrep openclaw-gateway)` را بررسی کنید؛ اگر Gateway بیش از حدود 500 MB RSS مصرف می‌کند و compressor فعال است، فرایندهای سنگین دیگر را ببندید یا به میزبان بزرگ‌تری ارتقا دهید.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    اگر کاربر `Dump` را به‌عنوان **پاسخ** به یک URL-balloon موجود زده باشد (iMessage روی حباب Dump نشان «1 Reply» را نمایش می‌دهد)، URL در `replyToBody` قرار دارد، نه در Webhook دوم. ادغام اعمال نمی‌شود — این موضوع مربوط به skill/prompt است، نه debouncer.
  </Accordion>
</AccordionGroup>

## block streaming

کنترل می‌کند پاسخ‌ها به‌صورت یک پیام واحد ارسال شوند یا به شکل بلوک‌ها stream شوند:

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
- سقف رسانه از طریق `channels.bluebubbles.mediaMaxMb` برای رسانهٔ ورودی و خروجی (پیش‌فرض: 8 MB).
- متن خروجی به `channels.bluebubbles.textChunkLimit` بخش‌بندی می‌شود (پیش‌فرض: 4000 نویسه).

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: کانال را فعال/غیرفعال می‌کند.
    - `channels.bluebubbles.serverUrl`: URL پایهٔ API REST BlueBubbles.
    - `channels.bluebubbles.password`: گذرواژهٔ API.
    - `channels.bluebubbles.webhookPath`: مسیر endpoint وبهوک (پیش‌فرض: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).
    - `channels.bluebubbles.allowFrom`: allowlist پیام مستقیم (handles، ایمیل‌ها، شماره‌های E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: allowlist فرستندهٔ گروه.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: در macOS، پس از عبور از gating، شرکت‌کنندگان بی‌نام گروه را به‌صورت اختیاری از Contacts محلی غنی می‌کند. پیش‌فرض: `false`.
    - `channels.bluebubbles.groups`: پیکربندی برای هر گروه (`requireMention` و غیره).

  </Accordion>
  <Accordion title="تحویل و قطعه‌بندی">
    - `channels.bluebubbles.sendReadReceipts`: ارسال رسیدهای خواندن (پیش‌فرض: `true`).
    - `channels.bluebubbles.blockStreaming`: فعال‌سازی پخش بلوکی (پیش‌فرض: `false`؛ برای پاسخ‌های جریانی الزامی است).
    - `channels.bluebubbles.textChunkLimit`: اندازه قطعه خروجی بر حسب نویسه (پیش‌فرض: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلت زمانی هر درخواست بر حسب ms برای ارسال‌های متن خروجی از طریق `/api/v1/message/text` (پیش‌فرض: 30000). در راه‌اندازی‌های macOS 26 که ارسال‌های iMessage با Private API می‌توانند درون چارچوب iMessage برای بیش از 60 ثانیه متوقف بمانند، آن را افزایش دهید؛ برای مثال `45000` یا `60000`. پروب‌ها، جست‌وجوهای چت، واکنش‌ها، ویرایش‌ها، و بررسی‌های سلامت فعلاً پیش‌فرض کوتاه‌تر 10s را نگه می‌دارند؛ گسترش پوشش به واکنش‌ها و ویرایش‌ها به‌عنوان پیگیری بعدی برنامه‌ریزی شده است. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (پیش‌فرض) فقط هنگام عبور از `textChunkLimit` قطعه‌بندی می‌کند؛ `newline` پیش از قطعه‌بندی بر اساس طول، روی خطوط خالی (مرزهای پاراگراف) قطعه‌بندی می‌کند.

  </Accordion>
  <Accordion title="رسانه و تاریخچه">
    - `channels.bluebubbles.mediaMaxMb`: سقف رسانه ورودی/خروجی بر حسب MB (پیش‌فرض: 8).
    - `channels.bluebubbles.mediaLocalRoots`: فهرست مجاز صریح از دایرکتوری‌های محلی مطلق که برای مسیرهای رسانه محلی خروجی مجازند. ارسال مسیر محلی به‌طور پیش‌فرض رد می‌شود مگر این‌که این گزینه پیکربندی شده باشد. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Webhookهای پیاپی DM از یک فرستنده را در یک نوبت عامل ادغام کنید تا ارسال جداگانه متن+URL توسط Apple به‌صورت یک پیام واحد برسد (پیش‌فرض: `false`). برای سناریوها، تنظیم پنجره، و مصالحه‌ها، [ادغام DMهای ارسال جداگانه](#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. وقتی بدون `messages.inbound.byChannel.bluebubbles` صریح فعال شود، پنجره debounce ورودی پیش‌فرض را از 500 ms به 2500 ms افزایش می‌دهد.
    - `channels.bluebubbles.historyLimit`: بیشینه پیام‌های گروه برای زمینه (0 غیرفعال می‌کند).
    - `channels.bluebubbles.dmHistoryLimit`: حد تاریخچه DM.
    - `channels.bluebubbles.replyContextApiFallback`: وقتی یک پاسخ ورودی بدون `replyToBody`/`replyToSender` می‌رسد و کش درون‌حافظه‌ای زمینه پاسخ miss می‌شود، پیام اصلی را از HTTP API BlueBubbles به‌عنوان جایگزین best-effort دریافت کنید (پیش‌فرض: `false`). برای استقرارهای چندنمونه‌ای که یک حساب BlueBubbles مشترک دارند، پس از راه‌اندازی دوباره فرایند، یا پس از تخلیه کش TTL/LRU طولانی‌عمر مفید است. این دریافت با همان سیاستی که برای هر درخواست دیگر کلاینت BlueBubbles اعمال می‌شود در برابر SSRF محافظت می‌شود، هرگز throw نمی‌کند، و کش را پر می‌کند تا پاسخ‌های بعدی سرشکن شوند. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. تنظیم در سطح کانال به حساب‌هایی که این پرچم را حذف کرده‌اند منتقل می‌شود.

  </Accordion>
  <Accordion title="اقدام‌ها و حساب‌ها">
    - `channels.bluebubbles.actions`: فعال/غیرفعال‌سازی اقدام‌های مشخص.
    - `channels.bluebubbles.accounts`: پیکربندی چندحسابی.

  </Accordion>
</AccordionGroup>

گزینه‌های سراسری مرتبط:

- `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## نشانی‌دهی / اهداف تحویل

برای مسیریابی پایدار، `chat_guid` را ترجیح دهید:

- `chat_guid:iMessage;-;+15555550123` (ترجیحی برای گروه‌ها)
- `chat_id:123`
- `chat_identifier:...`
- شناسه‌های مستقیم: `+15555550123`, `user@example.com`
  - اگر یک شناسه مستقیم چت DM موجود نداشته باشد، OpenClaw از طریق `POST /api/v1/chat/new` یکی ایجاد می‌کند. این به فعال بودن BlueBubbles Private API نیاز دارد.

### مسیریابی iMessage در برابر SMS

وقتی همان شناسه روی Mac هم چت iMessage و هم چت SMS داشته باشد (برای مثال شماره تلفنی که در iMessage ثبت شده اما fallbackهای حباب سبز نیز دریافت کرده است)، OpenClaw چت iMessage را ترجیح می‌دهد و هرگز بی‌صدا به SMS تنزل نمی‌دهد. برای اجبار به استفاده از چت SMS، از پیشوند هدف صریح `sms:` استفاده کنید (برای مثال `sms:+15555550123`). شناسه‌هایی که چت iMessage مطابق ندارند همچنان از طریق هر چتی که BlueBubbles گزارش می‌کند ارسال می‌شوند.

## امنیت

- درخواست‌های Webhook با مقایسه پارامترهای query یا headerهای `guid`/`password` با `channels.bluebubbles.password` احراز هویت می‌شوند.
- گذرواژه API و endpoint Webhook را محرمانه نگه دارید (با آن‌ها مانند اعتبارنامه‌ها رفتار کنید).
- برای احراز هویت Webhookهای BlueBubbles هیچ میان‌بری برای localhost وجود ندارد. اگر ترافیک Webhook را proxy می‌کنید، گذرواژه BlueBubbles را در کل مسیر درخواست نگه دارید. `gateway.trustedProxies` در اینجا جایگزین `channels.bluebubbles.password` نمی‌شود. [امنیت Gateway](/fa/gateway/security#reverse-proxy-configuration) را ببینید.
- اگر سرور BlueBubbles را خارج از LAN خود در دسترس قرار می‌دهید، HTTPS + قواعد firewall را فعال کنید.

## عیب‌یابی

- اگر رویدادهای typing/read از کار افتادند، logهای Webhook در BlueBubbles را بررسی کنید و مطمئن شوید مسیر Gateway با `channels.bluebubbles.webhookPath` مطابق است.
- کدهای جفت‌سازی پس از یک ساعت منقضی می‌شوند؛ از `openclaw pairing list bluebubbles` و `openclaw pairing approve bluebubbles <code>` استفاده کنید.
- واکنش‌ها به BlueBubbles private API نیاز دارند (`POST /api/v1/message/react`)؛ مطمئن شوید نسخه سرور آن را ارائه می‌کند.
- ویرایش/لغو ارسال به macOS 13+ و نسخه سازگار سرور BlueBubbles نیاز دارد. روی macOS 26 (Tahoe)، ویرایش در حال حاضر به‌دلیل تغییرات private API خراب است.
- به‌روزرسانی‌های آیکون گروه روی macOS 26 (Tahoe) ممکن است ناپایدار باشند: API ممکن است موفقیت برگرداند اما آیکون جدید همگام‌سازی نشود.
- OpenClaw اقدام‌های شناخته‌شده خراب را بر اساس نسخه macOS سرور BlueBubbles به‌طور خودکار پنهان می‌کند. اگر ویرایش همچنان روی macOS 26 (Tahoe) ظاهر می‌شود، آن را به‌صورت دستی با `channels.bluebubbles.actions.edit=false` غیرفعال کنید.
- `coalesceSameSenderDms` فعال است اما ارسال‌های جداگانه (مثلاً `Dump` + URL) همچنان به‌صورت دو نوبت می‌رسند: چک‌لیست [عیب‌یابی ادغام ارسال جداگانه](#split-send-coalescing-troubleshooting) را ببینید — علت‌های رایج شامل پنجره debounce بیش از حد تنگ، برداشت اشتباه از timestampهای session-log به‌عنوان زمان رسیدن Webhook، یا ارسال نقل‌قول پاسخ است (که از `replyToBody` استفاده می‌کند، نه Webhook دوم).
- برای اطلاعات وضعیت/سلامت: `openclaw status --all` یا `openclaw status --deep`.

برای مرجع عمومی گردش‌کار کانال، [کانال‌ها](/fa/channels) و راهنمای [Plugins](/fa/tools/plugin) را ببینید.

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی جلسه برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری mention
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
