---
read_when:
    - راه‌اندازی کانال BlueBubbles
    - عیب‌یابی جفت‌سازی Webhook
    - پیکربندی iMessage در macOS
sidebarTitle: BlueBubbles
summary: iMessage از طریق سرور macOS BlueBubbles (ارسال/دریافت REST، نشانگر تایپ، واکنش‌ها، جفت‌سازی، اقدامات پیشرفته).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T11:42:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

وضعیت: Plugin باندل‌شده‌ای که از طریق HTTP با سرور macOS BlueBubbles صحبت می‌کند. **برای یکپارچه‌سازی iMessage توصیه می‌شود** چون در مقایسه با کانال قدیمی imsg، API غنی‌تر و راه‌اندازی آسان‌تری دارد.

<Note>
انتشارهای فعلی OpenClaw، BlueBubbles را باندل می‌کنند، بنابراین بیلدهای بسته‌بندی‌شدهٔ معمولی به مرحلهٔ جداگانهٔ `openclaw plugins install` نیاز ندارند.
</Note>

## نمای کلی

- از طریق برنامهٔ کمکی BlueBubbles روی macOS اجرا می‌شود ([bluebubbles.app](https://bluebubbles.app)).
- توصیه‌شده/آزمایش‌شده: macOS Sequoia (15). macOS Tahoe (26) کار می‌کند؛ ویرایش در حال حاضر روی Tahoe خراب است، و به‌روزرسانی‌های آیکون گروه ممکن است موفقیت گزارش کنند اما همگام‌سازی نشوند.
- OpenClaw از طریق REST API آن با آن صحبت می‌کند (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- پیام‌های ورودی از طریق Webhookها می‌رسند؛ پاسخ‌های خروجی، نشانگرهای تایپ، رسیدهای خوانده‌شدن، و تپ‌بک‌ها فراخوانی‌های REST هستند.
- پیوست‌ها و استیکرها به‌عنوان رسانهٔ ورودی دریافت می‌شوند (و در صورت امکان به agent ارائه می‌شوند).
- پاسخ‌های خودکار TTS که صدای MP3 یا CAF تولید می‌کنند، به‌جای پیوست فایل ساده، به‌صورت حباب‌های یادداشت صوتی iMessage تحویل داده می‌شوند.
- جفت‌سازی/فهرست مجاز همانند کانال‌های دیگر کار می‌کند (`/channels/pairing` و غیره) با `channels.bluebubbles.allowFrom` + کدهای جفت‌سازی.
- واکنش‌ها مانند Slack/Telegram به‌صورت رویدادهای سیستمی ارائه می‌شوند تا agentها بتوانند پیش از پاسخ دادن آن‌ها را «ذکر» کنند.
- ویژگی‌های پیشرفته: ویرایش، لغو ارسال، رشته‌بندی پاسخ، جلوه‌های پیام، مدیریت گروه.

## شروع سریع

<Steps>
  <Step title="نصب BlueBubbles">
    سرور BlueBubbles را روی Mac خود نصب کنید (دستورالعمل‌های [bluebubbles.app/install](https://bluebubbles.app/install) را دنبال کنید).
  </Step>
  <Step title="فعال‌سازی API وب">
    در پیکربندی BlueBubbles، API وب را فعال کنید و یک گذرواژه تنظیم کنید.
  </Step>
  <Step title="پیکربندی OpenClaw">
    `openclaw onboard` را اجرا کنید و BlueBubbles را انتخاب کنید، یا دستی پیکربندی کنید:

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
  <Step title="هدایت Webhookها به Gateway">
    Webhookهای BlueBubbles را به Gateway خود هدایت کنید (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="راه‌اندازی Gateway">
    Gateway را شروع کنید؛ هندلر Webhook را ثبت می‌کند و جفت‌سازی را آغاز می‌کند.
  </Step>
</Steps>

<Warning>
**امنیت**

- همیشه یک گذرواژهٔ Webhook تنظیم کنید.
- احراز هویت Webhook همیشه الزامی است. OpenClaw درخواست‌های Webhook مربوط به BlueBubbles را رد می‌کند مگر اینکه شامل گذرواژه/guid مطابق با `channels.bluebubbles.password` باشند (برای مثال `?password=<password>` یا `x-password`)، صرف‌نظر از توپولوژی loopback/proxy.
- احراز هویت گذرواژه پیش از خواندن/تجزیهٔ کامل بدنه‌های Webhook بررسی می‌شود.

</Warning>

## زنده نگه داشتن Messages.app (راه‌اندازی‌های VM / بدون نمایشگر)

برخی راه‌اندازی‌های VM macOS / همیشه‌روشن ممکن است باعث شوند Messages.app «بی‌کار» شود (رویدادهای ورودی تا وقتی برنامه باز/در پیش‌زمینه نشود متوقف می‌شوند). یک راه‌حل ساده این است که با استفاده از AppleScript + LaunchAgent، **هر ۵ دقیقه Messages را تحریک کنید**.

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

    این **هر ۳۰۰ ثانیه** و **هنگام ورود** اجرا می‌شود. اجرای اول ممکن است اعلان‌های **Automation** در macOS را فعال کند (`osascript` → Messages). آن‌ها را در همان نشست کاربری که LaunchAgent را اجرا می‌کند تأیید کنید.

  </Step>
  <Step title="بارگذاری آن">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## راه‌اندازی اولیه

BlueBubbles در راه‌اندازی اولیهٔ تعاملی در دسترس است:

```
openclaw onboard
```

ویزارد این موارد را درخواست می‌کند:

<ParamField path="URL سرور" type="string" required>
  نشانی سرور BlueBubbles (مانند `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="گذرواژه" type="string" required>
  گذرواژهٔ API از تنظیمات سرور BlueBubbles.
</ParamField>
<ParamField path="مسیر Webhook" type="string" default="/bluebubbles-webhook">
  مسیر نقطهٔ پایانی Webhook.
</ParamField>
<ParamField path="سیاست پیام مستقیم" type="string">
  `pairing`، `allowlist`، `open`، یا `disabled`.
</ParamField>
<ParamField path="فهرست مجاز" type="string[]">
  شماره‌های تلفن، ایمیل‌ها، یا هدف‌های چت.
</ParamField>

همچنین می‌توانید BlueBubbles را از طریق CLI اضافه کنید:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## کنترل دسترسی (پیام‌های مستقیم + گروه‌ها)

<Tabs>
  <Tab title="پیام‌های مستقیم">
    - پیش‌فرض: `channels.bluebubbles.dmPolicy = "pairing"`.
    - فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند؛ پیام‌ها تا زمان تأیید نادیده گرفته می‌شوند (کدها پس از ۱ ساعت منقضی می‌شوند).
    - تأیید از طریق:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - جفت‌سازی تبادل توکن پیش‌فرض است. جزئیات: [جفت‌سازی](/fa/channels/pairing)

  </Tab>
  <Tab title="گروه‌ها">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` کنترل می‌کند چه کسی می‌تواند در گروه‌ها هنگام تنظیم `allowlist` فعال‌سازی کند.

  </Tab>
</Tabs>

### غنی‌سازی نام مخاطب (macOS، اختیاری)

Webhookهای گروه BlueBubbles اغلب فقط نشانی‌های خام شرکت‌کنندگان را شامل می‌شوند. اگر می‌خواهید زمینهٔ `GroupMembers` به‌جای آن نام مخاطبان محلی را نشان دهد، می‌توانید در macOS غنی‌سازی محلی Contacts را فعال کنید:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` جست‌وجو را فعال می‌کند. پیش‌فرض: `false`.
- جست‌وجوها فقط پس از آن اجرا می‌شوند که دسترسی گروه، مجوز فرمان، و دروازه‌گذاری ذکر اجازهٔ عبور پیام را داده باشند.
- فقط شرکت‌کنندگان تلفنی بی‌نام غنی‌سازی می‌شوند.
- وقتی تطابق محلی پیدا نشود، شماره‌های تلفن خام به‌عنوان جایگزین باقی می‌مانند.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### دروازه‌گذاری ذکر (گروه‌ها)

BlueBubbles از دروازه‌گذاری ذکر برای چت‌های گروهی پشتیبانی می‌کند و با رفتار iMessage/WhatsApp همخوان است:

- از `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`) برای تشخیص ذکرها استفاده می‌کند.
- وقتی `requireMention` برای یک گروه فعال باشد، agent فقط هنگام ذکر شدن پاسخ می‌دهد.
- فرمان‌های کنترلی از فرستندگان مجاز، دروازه‌گذاری ذکر را دور می‌زنند.

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

### دروازه‌گذاری فرمان

- فرمان‌های کنترلی (مانند `/config`، `/model`) به مجوز نیاز دارند.
- برای تعیین مجوز فرمان از `allowFrom` و `groupAllowFrom` استفاده می‌کند.
- فرستندگان مجاز می‌توانند حتی بدون ذکر کردن در گروه‌ها فرمان‌های کنترلی را اجرا کنند.

### پرامپت سیستمی برای هر گروه

هر ورودی زیر `channels.bluebubbles.groups.*` یک رشتهٔ اختیاری `systemPrompt` می‌پذیرد. مقدار آن در هر نوبتی که پیامی در آن گروه را مدیریت می‌کند، به پرامپت سیستمی agent تزریق می‌شود، بنابراین می‌توانید بدون ویرایش پرامپت‌های agent، شخصیت یا قواعد رفتاری مخصوص هر گروه را تنظیم کنید:

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

کلید با هر چیزی که BlueBubbles برای گروه به‌عنوان `chatGuid` / `chatIdentifier` / عددی `chatId` گزارش می‌کند مطابقت دارد، و یک ورودی wildcard با `"*"` برای هر گروهی که تطابق دقیق ندارد پیش‌فرض فراهم می‌کند (همان الگویی که `requireMention` و سیاست‌های ابزار برای هر گروه استفاده می‌کنند). تطابق‌های دقیق همیشه بر wildcard برتری دارند. پیام‌های مستقیم این فیلد را نادیده می‌گیرند؛ به‌جای آن از سفارشی‌سازی پرامپت در سطح agent یا سطح حساب استفاده کنید.

#### مثال عملی: پاسخ‌های رشته‌ای و واکنش‌های تپ‌بک (API خصوصی)

با فعال بودن API خصوصی BlueBubbles، پیام‌های ورودی با شناسه‌های کوتاه پیام می‌رسند (برای مثال `[[reply_to:5]]`) و agent می‌تواند `action=reply` را برای رشته‌کردن پاسخ زیر یک پیام مشخص فراخوانی کند یا `action=react` را برای گذاشتن یک تپ‌بک استفاده کند. یک `systemPrompt` مخصوص گروه روش قابل‌اعتمادی است تا agent را به انتخاب ابزار درست وادار کند:

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

واکنش‌های تپ‌بک و پاسخ‌های رشته‌ای هر دو به API خصوصی BlueBubbles نیاز دارند؛ برای سازوکارهای زیربنایی، [اقدام‌های پیشرفته](#advanced-actions) و [شناسه‌های پیام](#message-ids-short-vs-full) را ببینید.

## اتصال‌های گفت‌وگوی ACP

چت‌های BlueBubbles می‌توانند بدون تغییر لایهٔ انتقال، به workspaceهای پایدار ACP تبدیل شوند.

جریان سریع اپراتور:

- داخل پیام مستقیم یا چت گروهی مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های آینده در همان گفت‌وگوی BlueBubbles به نشست ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان نشست ACP متصل را درجا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده نیز از طریق ورودی‌های سطح‌بالای `bindings[]` با `type: "acp"` و `match.channel: "bluebubbles"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از هر فرم هدف پشتیبانی‌شدهٔ BlueBubbles استفاده کند:

- شناسهٔ نرمال‌شدهٔ پیام مستقیم مانند `+15555550123` یا `user@example.com`
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

## تایپ + رسیدهای خوانده‌شدن

- **نشانگرهای تایپ**: به‌طور خودکار پیش و هنگام تولید پاسخ ارسال می‌شوند.
- **رسیدهای خواندن**: توسط `channels.bluebubbles.sendReadReceipts` کنترل می‌شود (پیش‌فرض: `true`).
- **نشانگرهای تایپ**: OpenClaw رویدادهای شروع تایپ را ارسال می‌کند؛ BlueBubbles هنگام ارسال یا پایان مهلت، تایپ را به‌طور خودکار پاک می‌کند (توقف دستی از طریق DELETE قابل اتکا نیست).

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

BlueBubbles از کنش‌های پیشرفتهٔ پیام در صورت فعال بودن در پیکربندی پشتیبانی می‌کند:

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
    - **react**: افزودن/حذف واکنش‌های tapback (`messageId`, `emoji`, `remove`). مجموعهٔ tapback بومی iMessage شامل `love`، `like`، `dislike`، `laugh`، `emphasize` و `question` است. وقتی یک عامل ایموجی‌ای بیرون از آن مجموعه انتخاب کند (برای نمونه `👀`)، ابزار واکنش به `love` برمی‌گردد تا tapback همچنان نمایش داده شود، به‌جای اینکه کل درخواست شکست بخورد. واکنش‌های تأیید پیکربندی‌شده همچنان سخت‌گیرانه اعتبارسنجی می‌شوند و برای مقادیر ناشناخته خطا می‌دهند.
    - **edit**: ویرایش یک پیام ارسال‌شده (`messageId`, `text`).
    - **unsend**: لغو ارسال یک پیام (`messageId`).
    - **reply**: پاسخ به یک پیام مشخص (`messageId`, `text`, `to`).
    - **sendWithEffect**: ارسال با افکت iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: تغییر نام یک گفت‌وگوی گروهی (`chatGuid`, `displayName`).
    - **setGroupIcon**: تنظیم آیکن/عکس گفت‌وگوی گروهی (`chatGuid`, `media`) — روی macOS 26 Tahoe ناپایدار است (API ممکن است موفقیت برگرداند اما آیکن همگام نشود).
    - **addParticipant**: افزودن یک نفر به گروه (`chatGuid`, `address`).
    - **removeParticipant**: حذف یک نفر از گروه (`chatGuid`, `address`).
    - **leaveGroup**: ترک گفت‌وگوی گروهی (`chatGuid`).
    - **upload-file**: ارسال رسانه/فایل‌ها (`to`, `buffer`, `filename`, `asVoice`).
      - یادداشت‌های صوتی: `asVoice: true` را همراه با صدای **MP3** یا **CAF** تنظیم کنید تا به‌عنوان پیام صوتی iMessage ارسال شود. BlueBubbles هنگام ارسال یادداشت‌های صوتی، MP3 → CAF را تبدیل می‌کند.
    - نام مستعار قدیمی: `sendAttachment` همچنان کار می‌کند، اما `upload-file` نام کنش متعارف است.

  </Accordion>
</AccordionGroup>

### شناسه‌های پیام (کوتاه در برابر کامل)

OpenClaw ممکن است برای صرفه‌جویی در توکن‌ها شناسه‌های پیام _کوتاه_ (مثلاً `1`، `2`) را نمایش دهد.

- `MessageSid` / `ReplyToId` می‌توانند شناسه‌های کوتاه باشند.
- `MessageSidFull` / `ReplyToIdFull` شامل شناسه‌های کامل ارائه‌دهنده هستند.
- شناسه‌های کوتاه در حافظه‌اند؛ ممکن است با راه‌اندازی مجدد یا پاک‌سازی حافظهٔ نهان منقضی شوند.
- کنش‌ها `messageId` کوتاه یا کامل را می‌پذیرند، اما اگر شناسه‌های کوتاه دیگر در دسترس نباشند خطا می‌دهند.

برای خودکارسازی‌ها و ذخیره‌سازی پایدار از شناسه‌های کامل استفاده کنید:

- قالب‌ها: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- زمینه: `MessageSidFull` / `ReplyToIdFull` در payloadهای ورودی

برای متغیرهای قالب، [پیکربندی](/fa/gateway/configuration) را ببینید.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## ادغام DMهای split-send (فرمان + URL در یک ترکیب)

وقتی کاربر یک فرمان و یک URL را با هم در iMessage تایپ می‌کند — مثلاً `Dump https://example.com/article` — Apple ارسال را به **دو تحویل Webhook جداگانه** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک بالن پیش‌نمایش URL (`"https://..."`) با تصویرهای پیش‌نمایش OG به‌عنوان پیوست.

در بیشتر چیدمان‌ها، این دو Webhook با فاصلهٔ حدود ۰٫۸ تا ۲٫۰ ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت ۱ فقط فرمان را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست») و URL را فقط در نوبت ۲ می‌بیند — در آن زمان زمینهٔ فرمان از قبل از دست رفته است.

`channels.bluebubbles.coalesceSameSenderDms` یک DM را وارد ادغام Webhookهای پشت‌سرهم از همان فرستنده در یک نوبت عامل می‌کند. گفت‌وگوهای گروهی همچنان بر اساس هر پیام کلیدگذاری می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="When to enable">
    زمانی فعال کنید که:

    - Skillsی ارسال می‌کنید که انتظار `command + payload` را در یک پیام دارند (dump، paste، save، queue و غیره).
    - کاربران شما URLها، تصویرها یا محتوای طولانی را کنار فرمان‌ها جای‌گذاری می‌کنند.
    - می‌توانید تأخیر اضافه‌شده به نوبت DM را بپذیرید (پایین را ببینید).

    زمانی غیرفعال بگذارید که:

    - برای محرک‌های DM تک‌کلمه‌ای به کمترین تأخیر فرمان نیاز دارید.
    - همهٔ جریان‌های شما فرمان‌های تک‌مرحله‌ای بدون payloadهای دنبال‌کننده هستند.

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

    با روشن بودن این flag و بدون `messages.inbound.byChannel.bluebubbles` صریح، پنجرهٔ debounce به **2500 ms** گسترده می‌شود (پیش‌فرض برای حالت بدون ادغام 500 ms است). این پنجرهٔ گسترده‌تر لازم است — آهنگ split-send در Apple با فاصلهٔ ۰٫۸ تا ۲٫۰ ثانیه در پیش‌فرض تنگ‌تر جا نمی‌شود.

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
    - **تأخیر اضافه برای فرمان‌های کنترلی DM.** با روشن بودن این flag، پیام‌های فرمان کنترلی DM (مثل `Dump`، `Save` و غیره) اکنون پیش از dispatch تا اندازهٔ پنجرهٔ debounce منتظر می‌مانند، شاید Webhook مربوط به payload در راه باشد. فرمان‌های گفت‌وگوی گروهی dispatch فوری را حفظ می‌کنند.
    - **خروجی ادغام‌شده محدود است** — متن ادغام‌شده با نشانگر صریح `…[truncated]` حداکثر ۴۰۰۰ نویسه دارد؛ پیوست‌ها حداکثر ۲۰ هستند؛ ورودی‌های منبع حداکثر ۱۰ هستند (بعد از آن، نخستین به‌علاوهٔ تازه‌ترین حفظ می‌شوند). هر `messageId` منبع همچنان به حذف تکرار ورودی می‌رسد، بنابراین بازپخش بعدی MessagePoller از هر رویداد منفرد به‌عنوان تکراری تشخیص داده می‌شود.
    - **اختیاری و مخصوص هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| کاربر می‌نویسد                                                     | Apple تحویل می‌دهد        | flag خاموش (پیش‌فرض)                   | flag روشن + پنجرهٔ 2500 ms                                             |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | ۲ Webhook با فاصلهٔ حدود ۱ ثانیه | دو نوبت عامل: فقط "Dump"، سپس URL      | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (پیوست + متن)                      | ۲ Webhook                 | دو نوبت                                | یک نوبت: متن + تصویر                                                   |
| `/status` (فرمان مستقل)                                            | ۱ Webhook                 | dispatch فوری                          | **تا پنجره منتظر می‌ماند، سپس dispatch می‌کند**                       |
| URL به‌تنهایی جای‌گذاری شده                                        | ۱ Webhook                 | dispatch فوری                          | dispatch فوری (فقط یک ورودی در bucket)                                |
| متن + URL که عمداً به‌صورت دو پیام جدا، با فاصلهٔ چند دقیقه ارسال شده‌اند | ۲ Webhook بیرون از پنجره | دو نوبت                                | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                |
| سیل سریع (>10 DM کوچک داخل پنجره)                                  | N Webhook                 | N نوبت                                  | یک نوبت، خروجی محدود (اولی + تازه‌ترین، سقف‌های متن/پیوست اعمال شده‌اند) |

### عیب‌یابی ادغام split-send

اگر flag روشن است و split-sendها همچنان به‌صورت دو نوبت می‌رسند، هر لایه را بررسی کنید:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    سپس `openclaw gateway restart` — این flag هنگام ساخت رجیستری debounce خوانده می‌شود.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    به گزارش سرور BlueBubbles زیر `~/Library/Logs/bluebubbles-server/main.log` نگاه کنید:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    فاصلهٔ بین dispatch متن به سبک `"Dump"` و dispatch بعدی `"https://..."; Attachments:` را اندازه بگیرید. `messages.inbound.byChannel.bluebubbles` را طوری افزایش دهید که با حاشیهٔ کافی آن فاصله را پوشش دهد.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    زمان‌برچسب‌های رویداد نشست (`~/.openclaw/agents/<id>/sessions/*.jsonl`) نشان می‌دهند چه زمانی Gateway پیام را به عامل می‌دهد، **نه** اینکه Webhook چه زمانی رسیده است. پیام دومِ صف‌شده که برچسب `[Queued messages while agent was busy]` دارد یعنی نوبت اول هنوز در حال اجرا بوده که Webhook دوم رسیده است — bucket ادغام از قبل تخلیه شده بود. پنجره را بر اساس گزارش سرور BB تنظیم کنید، نه گزارش نشست.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    روی ماشین‌های کوچک‌تر (۸ GB)، نوبت‌های عامل ممکن است آن‌قدر طول بکشند که bucket ادغام پیش از کامل شدن پاسخ تخلیه شود و URL به‌عنوان نوبت دوم صف‌شده فرود بیاید. `memory_pressure` و `ps -o rss -p $(pgrep openclaw-gateway)` را بررسی کنید؛ اگر Gateway بیش از حدود ۵۰۰ MB RSS مصرف می‌کند و فشرده‌ساز فعال است، فرایندهای سنگین دیگر را ببندید یا به میزبان بزرگ‌تری ارتقا دهید.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    اگر کاربر روی `Dump` به‌عنوان **پاسخ** به یک بالن URL موجود زده باشد (iMessage روی حباب Dump نشان «1 Reply» را نشان می‌دهد)، URL در `replyToBody` زندگی می‌کند، نه در Webhook دوم. ادغام اعمال نمی‌شود — این دغدغهٔ skill/prompt است، نه دغدغهٔ debouncer.
  </Accordion>
</AccordionGroup>

## پخش بلوکی

کنترل کنید پاسخ‌ها به‌صورت یک پیام واحد ارسال شوند یا در بلوک‌ها پخش شوند:

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

- پیوست‌های ورودی دانلود و در حافظهٔ نهان رسانه ذخیره می‌شوند.
- سقف رسانه از طریق `channels.bluebubbles.mediaMaxMb` برای رسانهٔ ورودی و خروجی (پیش‌فرض: 8 MB).
- متن خروجی بر اساس `channels.bluebubbles.textChunkLimit` به قطعه‌ها تقسیم می‌شود (پیش‌فرض: ۴۰۰۰ نویسه).

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: فعال/غیرفعال کردن کانال.
    - `channels.bluebubbles.serverUrl`: URL پایهٔ REST API برای BlueBubbles.
    - `channels.bluebubbles.password`: گذرواژهٔ API.
    - `channels.bluebubbles.webhookPath`: مسیر endpoint برای Webhook (پیش‌فرض: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).
    - `channels.bluebubbles.allowFrom`: فهرست مجاز DM (شناسه‌ها، ایمیل‌ها، شماره‌های E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: فهرست مجاز فرستندهٔ گروه.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: در macOS، پس از عبور از gating، مشارکت‌کنندگان بی‌نام گروه را به‌صورت اختیاری از Contacts محلی غنی می‌کند. پیش‌فرض: `false`.
    - `channels.bluebubbles.groups`: پیکربندی مخصوص هر گروه (`requireMention` و غیره).

  </Accordion>
  <Accordion title="تحویل و قطعه‌بندی">
    - `channels.bluebubbles.sendReadReceipts`: ارسال رسیدهای خواندن (پیش‌فرض: `true`).
    - `channels.bluebubbles.blockStreaming`: فعال‌سازی پخش جریانی بلوکی (پیش‌فرض: `false`؛ برای پاسخ‌های جریانی لازم است).
    - `channels.bluebubbles.textChunkLimit`: اندازه قطعه خروجی بر حسب نویسه (پیش‌فرض: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلت زمانی هر درخواست بر حسب میلی‌ثانیه برای ارسال متن خروجی از طریق `/api/v1/message/text` (پیش‌فرض: 30000). در تنظیمات macOS 26 که ارسال‌های Private API iMessage ممکن است داخل چارچوب iMessage برای بیش از 60 ثانیه متوقف بمانند، آن را افزایش دهید؛ برای نمونه `45000` یا `60000`. کاوش‌ها، جست‌وجوی چت، واکنش‌ها، ویرایش‌ها و بررسی‌های سلامت فعلا پیش‌فرض کوتاه‌تر 10 ثانیه‌ای را نگه می‌دارند؛ گسترش پوشش به واکنش‌ها و ویرایش‌ها به‌عنوان پیگیری بعدی برنامه‌ریزی شده است. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (پیش‌فرض) فقط هنگام عبور از `textChunkLimit` تقسیم می‌کند؛ `newline` پیش از قطعه‌بندی بر اساس طول، روی خط‌های خالی (مرزهای پاراگراف) تقسیم می‌کند.

  </Accordion>
  <Accordion title="رسانه و تاریخچه">
    - `channels.bluebubbles.mediaMaxMb`: سقف رسانه ورودی/خروجی بر حسب مگابایت (پیش‌فرض: 8).
    - `channels.bluebubbles.mediaLocalRoots`: فهرست مجاز صریح از پوشه‌های محلی مطلق که برای مسیرهای رسانه محلی خروجی مجازند. ارسال مسیر محلی به‌طور پیش‌فرض رد می‌شود مگر اینکه این مورد پیکربندی شده باشد. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Webhookهای DM پیاپی از همان فرستنده را در یک نوبت عامل ادغام می‌کند تا ارسال جداشده متن+URL توسط Apple به‌صورت یک پیام واحد برسد (پیش‌فرض: `false`). برای سناریوها، تنظیم پنجره و بده‌بستان‌ها، [ادغام DMهای ارسال جداشده](#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. وقتی بدون `messages.inbound.byChannel.bluebubbles` صریح فعال شود، پنجره debounce پیش‌فرض ورودی را از 500 میلی‌ثانیه به 2500 میلی‌ثانیه گسترش می‌دهد.
    - `channels.bluebubbles.historyLimit`: حداکثر پیام‌های گروه برای زمینه (0 غیرفعال می‌کند).
    - `channels.bluebubbles.dmHistoryLimit`: محدودیت تاریخچه DM.
    - `channels.bluebubbles.replyContextApiFallback`: وقتی یک پاسخ ورودی بدون `replyToBody`/`replyToSender` می‌رسد و cache زمینه پاسخ در حافظه پیدا نمی‌شود، پیام اصلی را از BlueBubbles HTTP API به‌عنوان fallback در حد بهترین تلاش دریافت کن (پیش‌فرض: `false`). برای استقرارهای چندنمونه‌ای که یک حساب BlueBubbles را به اشتراک می‌گذارند، پس از راه‌اندازی دوباره فرایند، یا پس از بیرون‌افتادن از cache طولانی‌عمر TTL/LRU مفید است. این دریافت با همان سیاست همه درخواست‌های دیگر کارخواه BlueBubbles در برابر SSRF محافظت می‌شود، هرگز خطا پرتاب نمی‌کند، و cache را پر می‌کند تا پاسخ‌های بعدی سرشکن شوند. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. یک تنظیم در سطح کانال به حساب‌هایی که این پرچم را حذف کرده‌اند منتقل می‌شود.

  </Accordion>
  <Accordion title="اقدام‌ها و حساب‌ها">
    - `channels.bluebubbles.actions`: فعال/غیرفعال کردن اقدام‌های مشخص.
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
- شناسه‌های مستقیم: `+15555550123`، `user@example.com`
  - اگر یک شناسه مستقیم چت DM موجود نداشته باشد، OpenClaw از طریق `POST /api/v1/chat/new` یکی ایجاد می‌کند. این کار نیاز دارد BlueBubbles Private API فعال باشد.

### مسیریابی iMessage در برابر SMS

وقتی همان شناسه هم چت iMessage و هم چت SMS روی Mac دارد (برای مثال شماره تلفنی که در iMessage ثبت شده اما fallbackهای حباب سبز را نیز دریافت کرده است)، OpenClaw چت iMessage را ترجیح می‌دهد و هرگز بی‌صدا به SMS تنزل نمی‌دهد. برای اجبار به چت SMS، از پیشوند مقصد صریح `sms:` استفاده کنید (برای مثال `sms:+15555550123`). شناسه‌هایی که چت iMessage مطابق ندارند، همچنان از هر چتی که BlueBubbles گزارش می‌کند ارسال می‌شوند.

## امنیت

- درخواست‌های Webhook با مقایسه پارامترهای query یا headerهای `guid`/`password` با `channels.bluebubbles.password` احراز هویت می‌شوند.
- گذرواژه API و endpoint وب‌هوک را محرمانه نگه دارید (با آن‌ها مثل credentials رفتار کنید).
- برای احراز هویت Webhookهای BlueBubbles هیچ میان‌بری برای localhost وجود ندارد. اگر ترافیک Webhook را proxy می‌کنید، گذرواژه BlueBubbles را از ابتدا تا انتهای درخواست نگه دارید. `gateway.trustedProxies` در اینجا جایگزین `channels.bluebubbles.password` نمی‌شود. [امنیت Gateway](/fa/gateway/security#reverse-proxy-configuration) را ببینید.
- اگر سرور BlueBubbles را بیرون از LAN خود در معرض دسترس قرار می‌دهید، HTTPS و قوانین firewall را فعال کنید.

## عیب‌یابی

- اگر رویدادهای تایپ/خواندن از کار افتادند، لاگ‌های Webhookهای BlueBubbles را بررسی کنید و مطمئن شوید مسیر Gateway با `channels.bluebubbles.webhookPath` مطابقت دارد.
- کدهای pairing پس از یک ساعت منقضی می‌شوند؛ از `openclaw pairing list bluebubbles` و `openclaw pairing approve bluebubbles <code>` استفاده کنید.
- واکنش‌ها به BlueBubbles private API (`POST /api/v1/message/react`) نیاز دارند؛ مطمئن شوید نسخه سرور آن را ارائه می‌کند.
- ویرایش/لغو ارسال به macOS 13+ و نسخه سازگار سرور BlueBubbles نیاز دارد. در macOS 26 (Tahoe)، ویرایش در حال حاضر به‌دلیل تغییرات private API خراب است.
- به‌روزرسانی‌های آیکون گروه ممکن است در macOS 26 (Tahoe) ناپایدار باشند: API ممکن است موفقیت برگرداند اما آیکون جدید همگام‌سازی نشود.
- OpenClaw اقدام‌هایی را که بر اساس نسخه macOS سرور BlueBubbles خراب شناخته شده‌اند، به‌طور خودکار پنهان می‌کند. اگر ویرایش همچنان در macOS 26 (Tahoe) ظاهر می‌شود، آن را با `channels.bluebubbles.actions.edit=false` به‌صورت دستی غیرفعال کنید.
- `coalesceSameSenderDms` فعال است اما ارسال‌های جداشده (مثلا `Dump` + URL) همچنان به‌صورت دو نوبت می‌رسند: چک‌لیست [عیب‌یابی ادغام ارسال جداشده](#split-send-coalescing-troubleshooting) را ببینید — علت‌های رایج شامل پنجره debounce بیش از حد تنگ، زمان‌مهرهای لاگ نشست که به‌اشتباه به‌عنوان زمان رسیدن Webhook خوانده شده‌اند، یا ارسال نقل‌قول پاسخ است (که از `replyToBody` استفاده می‌کند، نه Webhook دوم).
- برای اطلاعات وضعیت/سلامت: `openclaw status --all` یا `openclaw status --deep`.

برای مرجع عمومی گردش‌کار کانال، [کانال‌ها](/fa/channels) و راهنمای [Plugins](/fa/tools/plugin) را ببینید.

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و کنترل اشاره‌ها
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
