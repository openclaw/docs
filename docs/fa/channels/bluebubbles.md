---
read_when:
    - راه‌اندازی کانال BlueBubbles
    - عیب‌یابی جفت‌سازی Webhook
    - پیکربندی iMessage در macOS
sidebarTitle: BlueBubbles
summary: پشتیبانی قدیمی از iMessage از طریق سرور macOS BlueBubbles (ارسال/دریافت REST، تایپ، واکنش‌ها، جفت‌سازی، کنش‌های پیشرفته).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: Plugin قدیمیِ همراه‌شده که از طریق HTTP با سرور BlueBubbles در macOS صحبت می‌کند. راه‌اندازی‌های موجود BlueBubbles همچنان کار می‌کنند، اما استقرارهای جدید OpenClaw iMessage باید وقتی الزامات Plugin بومی [iMessage](/fa/channels/imessage) با میزبان شما سازگار است، آن را ترجیح دهند.

<Warning>
BlueBubbles برای راه‌اندازی‌های جدید OpenClaw منسوخ شده است.

اکوسیستم بالادستی BlueBubbles همچنان فعال است، اما OpenClaw به API سرور BlueBubbles در macOS وابسته است. تا ۶ مه ۲۰۲۶، آخرین تغییر شاخه توسعه رسمی [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) در [۲۲ ژانویه ۲۰۲۶](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037) بوده، و آخرین انتشار سرور ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) در ۱۶ مه ۲۰۲۵ منتشر شده است. اپلیکیشن کلاینت و مخازن کمکی فعالیت جدیدتری دارند، بنابراین این ادعای رهاشدگی نیست؛ این منسوخ‌سازی درباره کاهش وابستگی OpenClaw به یک سرور HTTP خارجی، Webhookها، و سطح سازگاری API خصوصی است، وقتی مسیر بومی `imsg` یکپارچه‌سازی را روی یک قرارداد stdio محلی نگه می‌دارد.
</Warning>

<Note>
انتشارهای فعلی OpenClaw شامل BlueBubbles هستند، بنابراین بیلدهای بسته‌بندی‌شده معمولی به مرحله جداگانه `openclaw plugins install` نیاز ندارند.
</Note>

## نمای کلی

- از طریق اپلیکیشن کمکی BlueBubbles روی macOS اجرا می‌شود ([bluebubbles.app](https://bluebubbles.app)).
- جایگزین قدیمی برای نصب‌هایی که از قبل به شناسه‌های کانال BlueBubbles، وضعیت Webhook، اهداف گروهی، تحویل Cron، یا مسیریابی workspace متکی هستند.
- توصیه‌شده/آزمایش‌شده: macOS Sequoia (15). macOS Tahoe (26) کار می‌کند؛ ویرایش در حال حاضر روی Tahoe خراب است، و به‌روزرسانی‌های آیکن گروه ممکن است موفقیت گزارش کنند اما همگام‌سازی نشوند.
- OpenClaw از طریق REST API آن با آن صحبت می‌کند (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- پیام‌های ورودی از طریق Webhookها می‌رسند؛ پاسخ‌های خروجی، نشانگرهای تایپ، رسیدهای خواندن، و tapbackها فراخوانی‌های REST هستند.
- پیوست‌ها و برچسب‌ها به‌عنوان رسانه ورودی دریافت می‌شوند (و هرجا ممکن باشد به agent نمایش داده می‌شوند).
- پاسخ‌های Auto-TTS که صدای MP3 یا CAF تولید می‌کنند، به‌جای پیوست فایل ساده، به‌صورت حباب‌های یادداشت صوتی iMessage تحویل داده می‌شوند.
- جفت‌سازی/allowlist مانند کانال‌های دیگر کار می‌کند (`/channels/pairing` و غیره) با `channels.bluebubbles.allowFrom` + کدهای جفت‌سازی.
- واکنش‌ها درست مانند Slack/Telegram به‌عنوان رویدادهای سیستمی نمایش داده می‌شوند تا agentها بتوانند پیش از پاسخ دادن به آن‌ها «اشاره» کنند.
- قابلیت‌های پیشرفته: ویرایش، لغو ارسال، thread کردن پاسخ، افکت‌های پیام، مدیریت گروه.

## شروع سریع

<Steps>
  <Step title="نصب BlueBubbles">
    سرور BlueBubbles را روی Mac خود نصب کنید (دستورالعمل‌های [bluebubbles.app/install](https://bluebubbles.app/install) را دنبال کنید).
  </Step>
  <Step title="فعال کردن web API">
    در پیکربندی BlueBubbles، web API را فعال کنید و یک رمز عبور تنظیم کنید.
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
  <Step title="هدایت Webhookها به Gateway">
    Webhookهای BlueBubbles را به Gateway خود هدایت کنید (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="شروع Gateway">
    Gateway را شروع کنید؛ handler مربوط به Webhook را ثبت می‌کند و جفت‌سازی را آغاز می‌کند.
  </Step>
</Steps>

<Warning>
**امنیت**

- همیشه یک رمز عبور Webhook تنظیم کنید.
- احراز هویت Webhook همیشه لازم است. OpenClaw درخواست‌های Webhook مربوط به BlueBubbles را رد می‌کند مگر اینکه شامل یک password/guid مطابق با `channels.bluebubbles.password` باشند (برای مثال `?password=<password>` یا `x-password`)، مستقل از توپولوژی loopback/proxy.
- احراز هویت با رمز عبور پیش از خواندن/تجزیه کامل بدنه‌های Webhook بررسی می‌شود.

</Warning>

## زنده نگه داشتن Messages.app (راه‌اندازی‌های VM / بدون نمایشگر)

برخی راه‌اندازی‌های macOS VM / همیشه روشن ممکن است باعث شوند Messages.app «idle» شود (رویدادهای ورودی تا زمان باز شدن/foreground شدن اپلیکیشن متوقف می‌شوند). یک راه‌حل ساده این است که با استفاده از AppleScript + LaunchAgent هر ۵ دقیقه یک‌بار **Messages را poke کنید**.

<Steps>
  <Step title="ذخیره AppleScript">
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
  <Step title="نصب یک LaunchAgent">
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

    این **هر ۳۰۰ ثانیه** و **هنگام ورود** اجرا می‌شود. اجرای نخست ممکن است promptهای **Automation** در macOS را فعال کند (`osascript` → Messages). آن‌ها را در همان نشست کاربری که LaunchAgent را اجرا می‌کند تأیید کنید.

  </Step>
  <Step title="بارگذاری آن">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## راه‌اندازی اولیه

BlueBubbles در راه‌اندازی تعاملی موجود است:

```
openclaw onboard
```

wizard موارد زیر را درخواست می‌کند:

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
  شماره‌های تلفن، ایمیل‌ها، یا اهداف چت.
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
    - جفت‌سازی تبادل token پیش‌فرض است. جزئیات: [جفت‌سازی](/fa/channels/pairing)

  </Tab>
  <Tab title="گروه‌ها">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` کنترل می‌کند وقتی `allowlist` تنظیم شده است چه کسی می‌تواند در گروه‌ها trigger کند.

  </Tab>
</Tabs>

### غنی‌سازی نام مخاطب (macOS، اختیاری)

Webhookهای گروهی BlueBubbles اغلب فقط نشانی‌های خام شرکت‌کنندگان را شامل می‌شوند. اگر می‌خواهید context مربوط به `GroupMembers` به‌جای آن نام‌های مخاطبان محلی را نشان دهد، می‌توانید در macOS غنی‌سازی از Contacts محلی را فعال کنید:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` lookup را فعال می‌کند. پیش‌فرض: `false`.
- lookupها فقط پس از آن اجرا می‌شوند که دسترسی گروه، مجوز فرمان، و mention gating اجازه عبور پیام را داده باشند.
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

### Mention gating (گروه‌ها)

BlueBubbles از mention gating برای چت‌های گروهی پشتیبانی می‌کند و با رفتار iMessage/WhatsApp همخوان است:

- از `agents.list[].groupChat.mentionPatterns` (یا `messages.groupChat.mentionPatterns`) برای تشخیص mentionها استفاده می‌کند.
- وقتی `requireMention` برای یک گروه فعال باشد، agent فقط هنگام mention شدن پاسخ می‌دهد.
- فرمان‌های کنترلی از فرستندگان مجاز mention gating را دور می‌زنند.

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

### Command gating

- فرمان‌های کنترلی (مثلاً `/config`، `/model`) به مجوز نیاز دارند.
- از `allowFrom` و `groupAllowFrom` برای تعیین مجوز فرمان استفاده می‌کند.
- فرستندگان مجاز می‌توانند فرمان‌های کنترلی را حتی بدون mention کردن در گروه‌ها اجرا کنند.

### system prompt برای هر گروه

هر ورودی زیر `channels.bluebubbles.groups.*` یک رشته اختیاری `systemPrompt` می‌پذیرد. مقدار آن در هر turn که پیامی را در آن گروه پردازش می‌کند، به system prompt مربوط به agent تزریق می‌شود، بنابراین می‌توانید بدون ویرایش promptهای agent، persona یا قواعد رفتاری مخصوص هر گروه را تنظیم کنید:

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

کلید با هر چیزی که BlueBubbles به‌عنوان `chatGuid` / `chatIdentifier` / `chatId` عددی برای گروه گزارش می‌کند مطابقت دارد، و یک ورودی wildcard با `"*"` پیش‌فرضی برای هر گروه بدون تطابق دقیق فراهم می‌کند (همان الگویی که توسط `requireMention` و سیاست‌های ابزار برای هر گروه استفاده می‌شود). تطابق‌های دقیق همیشه بر wildcard اولویت دارند. DMها این فیلد را نادیده می‌گیرند؛ به‌جای آن از سفارشی‌سازی prompt در سطح agent یا حساب استفاده کنید.

#### مثال عملی: پاسخ‌های thread شده و واکنش‌های tapback (API خصوصی)

با فعال بودن API خصوصی BlueBubbles، پیام‌های ورودی با شناسه‌های کوتاه پیام می‌رسند (برای مثال `[[reply_to:5]]`) و agent می‌تواند `action=reply` را فراخوانی کند تا وارد thread یک پیام مشخص شود یا `action=react` را برای گذاشتن یک tapback فراخوانی کند. یک `systemPrompt` برای هر گروه راهی قابل اعتماد برای نگه داشتن agent روی انتخاب ابزار درست است:

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

واکنش‌های tapback و پاسخ‌های thread شده هر دو به API خصوصی BlueBubbles نیاز دارند؛ برای سازوکارهای زیرین، [اقدام‌های پیشرفته](#advanced-actions) و [شناسه‌های پیام](#message-ids-short-vs-full) را ببینید.

## اتصال‌های گفت‌وگوی ACP

چت‌های BlueBubbles می‌توانند بدون تغییر لایه انتقال به workspaceهای پایدار ACP تبدیل شوند.

جریان سریع operator:

- داخل DM یا چت گروهی مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های آینده در همان گفت‌وگوی BlueBubbles به نشست ACP ایجادشده route می‌شوند.
- `/new` و `/reset` همان نشست ACP متصل را درجا reset می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده نیز از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "bluebubbles"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از هر فرم هدف پشتیبانی‌شده BlueBubbles استفاده کند:

- شناسهٔ عادی‌شدهٔ DM مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

برای اتصال‌های پایدار گروهی، `chat_id:*` یا `chat_identifier:*` را ترجیح دهید.

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

## نشانگرهای تایپ + رسیدهای خواندن

- **نشانگرهای تایپ**: پیش از تولید پاسخ و هنگام آن به‌صورت خودکار ارسال می‌شوند.
- **رسیدهای خواندن**: با `channels.bluebubbles.sendReadReceipts` کنترل می‌شود (پیش‌فرض: `true`).
- **نشانگرهای تایپ**: OpenClaw رویدادهای شروع تایپ را ارسال می‌کند؛ BlueBubbles هنگام ارسال یا پایان مهلت، تایپ را به‌صورت خودکار پاک می‌کند (توقف دستی از طریق DELETE قابل اتکا نیست).

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

BlueBubbles وقتی در پیکربندی فعال شده باشد، از کنش‌های پیشرفتهٔ پیام پشتیبانی می‌کند:

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
    - **react**: واکنش‌های tapback را اضافه/حذف کنید (`messageId`, `emoji`, `remove`). مجموعهٔ tapback بومی iMessage شامل `love`، `like`، `dislike`، `laugh`، `emphasize` و `question` است. وقتی یک عامل ایموجی‌ای خارج از آن مجموعه انتخاب می‌کند (برای مثال `👀`)، ابزار واکنش به `love` برمی‌گردد تا tapback همچنان نمایش داده شود، نه اینکه کل درخواست شکست بخورد. واکنش‌های تأیید پیکربندی‌شده همچنان با سخت‌گیری اعتبارسنجی می‌شوند و برای مقادیر ناشناخته خطا می‌دهند.
    - **edit**: یک پیام ارسال‌شده را ویرایش کنید (`messageId`, `text`).
    - **unsend**: ارسال یک پیام را لغو کنید (`messageId`).
    - **reply**: به یک پیام مشخص پاسخ دهید (`messageId`, `text`, `to`).
    - **sendWithEffect**: با جلوهٔ iMessage ارسال کنید (`text`, `to`, `effectId`).
    - **renameGroup**: نام یک گفت‌وگوی گروهی را تغییر دهید (`chatGuid`, `displayName`).
    - **setGroupIcon**: آیکن/عکس یک گفت‌وگوی گروهی را تنظیم کنید (`chatGuid`, `media`) - در macOS 26 Tahoe ناپایدار است (ممکن است API موفقیت برگرداند اما آیکن همگام‌سازی نشود).
    - **addParticipant**: فردی را به یک گروه اضافه کنید (`chatGuid`, `address`).
    - **removeParticipant**: فردی را از یک گروه حذف کنید (`chatGuid`, `address`).
    - **leaveGroup**: یک گفت‌وگوی گروهی را ترک کنید (`chatGuid`).
    - **upload-file**: رسانه/فایل‌ها را ارسال کنید (`to`, `buffer`, `filename`, `asVoice`).
      - یادداشت‌های صوتی: برای ارسال به‌عنوان پیام صوتی iMessage، `asVoice: true` را با صدای **MP3** یا **CAF** تنظیم کنید. BlueBubbles هنگام ارسال یادداشت‌های صوتی، MP3 → CAF را تبدیل می‌کند.
    - نام مستعار قدیمی: `sendAttachment` همچنان کار می‌کند، اما `upload-file` نام کنش رسمی است.

  </Accordion>
</AccordionGroup>

### شناسه‌های پیام (کوتاه در برابر کامل)

OpenClaw ممکن است برای صرفه‌جویی در توکن‌ها، شناسه‌های پیام _کوتاه_ (مثلاً `1`، `2`) را نمایش دهد.

- `MessageSid` / `ReplyToId` می‌توانند شناسه‌های کوتاه باشند.
- `MessageSidFull` / `ReplyToIdFull` شامل شناسه‌های کامل ارائه‌دهنده هستند.
- شناسه‌های کوتاه در حافظه نگهداری می‌شوند؛ ممکن است هنگام راه‌اندازی مجدد یا حذف از کش منقضی شوند.
- کنش‌ها `messageId` کوتاه یا کامل را می‌پذیرند، اما اگر شناسه‌های کوتاه دیگر در دسترس نباشند خطا می‌دهند.

برای خودکارسازی‌ها و ذخیره‌سازی ماندگار، از شناسه‌های کامل استفاده کنید:

- الگوها: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- زمینه: `MessageSidFull` / `ReplyToIdFull` در payloadهای ورودی

برای متغیرهای الگو، [پیکربندی](/fa/gateway/configuration) را ببینید.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## ادغام DMهای split-send (فرمان + URL در یک ترکیب)

وقتی کاربر در iMessage یک فرمان و یک URL را با هم تایپ می‌کند - مثلاً `Dump https://example.com/article` - Apple ارسال را به **دو تحویل Webhook جداگانه** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک حباب پیش‌نمایش URL (`"https://..."`) با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

در بیشتر راه‌اندازی‌ها، دو Webhook با فاصلهٔ حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت 1 فقط فرمان را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست»)، و URL را فقط در نوبت 2 می‌بیند - در آن نقطه زمینهٔ فرمان از قبل از دست رفته است.

`channels.bluebubbles.coalesceSameSenderDms` یک DM را وارد ادغام Webhookهای متوالی از همان فرستنده در یک نوبت عامل می‌کند. گفت‌وگوهای گروهی همچنان بر اساس هر پیام کلیدگذاری می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="زمان فعال‌سازی">
    زمانی فعال کنید که:

    - Skillsای منتشر می‌کنید که انتظار `command + payload` را در یک پیام دارند (dump، paste، save، queue و غیره).
    - کاربران شما URLها، تصاویر یا محتوای طولانی را کنار فرمان‌ها paste می‌کنند.
    - می‌توانید تأخیر اضافه‌شده به نوبت DM را بپذیرید (پایین‌تر را ببینید).

    غیرفعال بگذارید وقتی که:

    - برای triggerهای DM تک‌کلمه‌ای به کمینهٔ تأخیر فرمان نیاز دارید.
    - همهٔ جریان‌های شما فرمان‌های یک‌مرحله‌ای بدون پیگیری payload هستند.

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

    وقتی این پرچم روشن باشد و `messages.inbound.byChannel.bluebubbles` صریحی وجود نداشته باشد، پنجرهٔ debounce به **2500 ms** گسترش می‌یابد (پیش‌فرض برای حالت بدون ادغام 500 ms است). پنجرهٔ گسترده‌تر لازم است - cadence ارسال split-send اپل با فاصلهٔ 0.8 تا 2.0 ثانیه در پیش‌فرض تنگ‌تر جا نمی‌شود.

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
  <Tab title="مصالحه‌ها">
    - **تأخیر اضافه برای فرمان‌های کنترلی DM.** وقتی پرچم روشن باشد، پیام‌های فرمان کنترلی DM (مانند `Dump`، `Save` و غیره) اکنون پیش از dispatch تا سقف پنجرهٔ debounce منتظر می‌مانند، برای زمانی که Webhook مربوط به payload در راه است. فرمان‌های گفت‌وگوی گروهی همچنان dispatch فوری دارند.
    - **خروجی ادغام‌شده محدود است** - متن ادغام‌شده با نشانگر صریح `…[truncated]` حداکثر 4000 نویسه دارد؛ پیوست‌ها حداکثر 20 هستند؛ ورودی‌های منبع حداکثر 10 هستند (فراتر از آن، اولین و آخرین نگه داشته می‌شوند). هر `messageId` منبع همچنان به حذف تکراری ورودی می‌رسد، بنابراین replay بعدی MessagePoller از هر رویداد منفرد به‌عنوان تکراری شناسایی می‌شود.
    - **اختیاری، برای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| کاربر می‌نویسد                                                     | Apple تحویل می‌دهد        | پرچم خاموش (پیش‌فرض)                   | پرچم روشن + پنجرهٔ 2500 ms                                             |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 Webhook با فاصلهٔ حدود 1 s | دو نوبت عامل: فقط "Dump"، سپس URL       | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (پیوست + متن)                      | 2 Webhook                 | دو نوبت                                | یک نوبت: متن + تصویر                                                   |
| `/status` (فرمان مستقل)                                           | 1 Webhook                 | dispatch فوری                          | **تا سقف پنجره منتظر بمان، سپس dispatch کن**                           |
| URL به‌تنهایی paste شده                                           | 1 Webhook                 | dispatch فوری                          | dispatch فوری (فقط یک ورودی در bucket)                                 |
| متن + URL که عمداً به‌صورت دو پیام جداگانه و با فاصلهٔ چند دقیقه ارسال شده‌اند | 2 Webhook بیرون از پنجره | دو نوبت                                | دو نوبت (پنجره میان آن‌ها منقضی می‌شود)                                |
| سیل سریع (>10 DM کوچک داخل پنجره)                                 | N Webhook                 | N نوبت                                 | یک نوبت، خروجی محدودشده (اولین + آخرین، سقف‌های متن/پیوست اعمال شده‌اند) |

### عیب‌یابی ادغام split-send

اگر پرچم روشن است و split-sendها همچنان به‌صورت دو نوبت می‌رسند، هر لایه را بررسی کنید:

<AccordionGroup>
  <Accordion title="پیکربندی واقعاً بارگذاری شده است">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    سپس `openclaw gateway restart` - پرچم هنگام ایجاد debouncer-registry خوانده می‌شود.

  </Accordion>
  <Accordion title="پنجرهٔ debounce برای راه‌اندازی شما به‌اندازهٔ کافی گسترده است">
    به گزارش سرور BlueBubbles در `~/Library/Logs/bluebubbles-server/main.log` نگاه کنید:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    فاصلهٔ بین dispatch متن به سبک `"Dump"` و dispatch بعدی `"https://..."; Attachments:` را اندازه بگیرید. `messages.inbound.byChannel.bluebubbles` را آن‌قدر افزایش دهید که با خیال راحت آن فاصله را پوشش دهد.

  </Accordion>
  <Accordion title="مهرهای زمانی JSONL نشست ≠ رسیدن Webhook">
    مهرهای زمانی رویداد نشست (`~/.openclaw/agents/<id>/sessions/*.jsonl`) نشان می‌دهند Gateway چه زمانی پیام را به عامل تحویل می‌دهد، **نه** اینکه Webhook چه زمانی رسیده است. پیام دومِ صف‌شده با برچسب `[Queued messages while agent was busy]` یعنی نوبت اول هنگام رسیدن Webhook دوم هنوز در حال اجرا بوده است - bucket ادغام از قبل flush شده بود. پنجره را بر اساس گزارش سرور BB تنظیم کنید، نه گزارش نشست.
  </Accordion>
  <Accordion title="فشار حافظه dispatch پاسخ را کند می‌کند">
    روی ماشین‌های کوچک‌تر (8 GB)، نوبت‌های عامل ممکن است آن‌قدر طول بکشند که bucket ادغام پیش از کامل‌شدن پاسخ flush شود و URL به‌عنوان نوبت دوم صف‌شده وارد شود. `memory_pressure` و `ps -o rss -p $(pgrep openclaw-gateway)` را بررسی کنید؛ اگر Gateway بیش از حدود 500 MB RSS مصرف می‌کند و compressor فعال است، فرایندهای سنگین دیگر را ببندید یا به میزبان بزرگ‌تری ارتقا دهید.
  </Accordion>
  <Accordion title="ارسال‌های reply-quote مسیر متفاوتی هستند">
    اگر کاربر `Dump` را به‌عنوان **پاسخ** به یک حباب URL موجود لمس کرده باشد (iMessage نشان «1 Reply» را روی حباب Dump نشان می‌دهد)، URL در `replyToBody` قرار دارد، نه در Webhook دوم. ادغام اعمال نمی‌شود - این مسئله به skill/prompt مربوط است، نه به debouncer.
  </Accordion>
</AccordionGroup>

## استریم بلوکی

کنترل کنید پاسخ‌ها به‌صورت یک پیام واحد ارسال شوند یا به‌شکل بلوک‌ها استریم شوند:

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

- پیوست‌های ورودی دانلود می‌شوند و در کش رسانه ذخیره می‌شوند.
- سقف رسانه از طریق `channels.bluebubbles.mediaMaxMb` برای رسانهٔ ورودی و خروجی (پیش‌فرض: 8 MB).
- متن خروجی به `channels.bluebubbles.textChunkLimit` بخش‌بندی می‌شود (پیش‌فرض: 4000 نویسه).

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

<AccordionGroup>
  <Accordion title="اتصال و Webhook">
    - `channels.bluebubbles.enabled`: فعال/غیرفعال کردن کانال.
    - `channels.bluebubbles.serverUrl`: نشانی پایه API از نوع REST برای BlueBubbles.
    - `channels.bluebubbles.password`: گذرواژه API.
    - `channels.bluebubbles.webhookPath`: مسیر نقطه پایانی Webhook (پیش‌فرض: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="سیاست دسترسی">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).
    - `channels.bluebubbles.allowFrom`: فهرست مجاز پیام مستقیم (شناسه‌ها، ایمیل‌ها، شماره‌های E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (پیش‌فرض: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: فهرست مجاز فرستندگان گروه.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: در macOS، پس از عبور از دروازه‌گذاری، در صورت نیاز شرکت‌کنندگان بی‌نام گروه را از مخاطبان محلی کامل می‌کند. پیش‌فرض: `false`.
    - `channels.bluebubbles.groups`: پیکربندی برای هر گروه (`requireMention` و غیره).

  </Accordion>
  <Accordion title="تحویل و بخش‌بندی">
    - `channels.bluebubbles.sendReadReceipts`: ارسال رسیدهای خوانده‌شدن (پیش‌فرض: `true`).
    - `channels.bluebubbles.blockStreaming`: فعال کردن پخش جریانی بلوکی (پیش‌فرض: `false`؛ برای پاسخ‌های جریانی الزامی است).
    - `channels.bluebubbles.textChunkLimit`: اندازه بخش خروجی بر حسب نویسه (پیش‌فرض: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلت زمانی هر درخواست بر حسب میلی‌ثانیه برای ارسال متن خروجی از طریق `/api/v1/message/text` (پیش‌فرض: 30000). در راه‌اندازی‌های macOS 26 که ارسال‌های iMessage با Private API می‌توانند درون چارچوب iMessage بیش از ۶۰ ثانیه متوقف بمانند، آن را افزایش دهید؛ برای مثال `45000` یا `60000`. کاوش‌ها، جست‌وجوهای چت، واکنش‌ها، ویرایش‌ها و بررسی‌های سلامت فعلا همان پیش‌فرض کوتاه‌تر ۱۰ ثانیه‌ای را نگه می‌دارند؛ گسترش پوشش به واکنش‌ها و ویرایش‌ها به‌عنوان پیگیری بعدی برنامه‌ریزی شده است. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (پیش‌فرض) فقط هنگام عبور از `textChunkLimit` جدا می‌کند؛ `newline` پیش از بخش‌بندی بر اساس طول، روی خط‌های خالی (مرزهای پاراگراف) جدا می‌کند.

  </Accordion>
  <Accordion title="رسانه و تاریخچه">
    - `channels.bluebubbles.mediaMaxMb`: سقف رسانه ورودی/خروجی بر حسب MB (پیش‌فرض: 8).
    - `channels.bluebubbles.mediaLocalRoots`: فهرست مجاز صریح از دایرکتوری‌های محلی مطلق که برای مسیرهای رسانه محلی خروجی مجاز هستند. ارسال مسیر محلی به‌طور پیش‌فرض رد می‌شود مگر اینکه این گزینه پیکربندی شده باشد. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Webhookهای پیام مستقیم پیاپی از همان فرستنده را در یک نوبت عامل ادغام می‌کند تا ارسال جداشده متن+URL از Apple به‌صورت یک پیام واحد برسد (پیش‌فرض: `false`). برای سناریوها، تنظیم پنجره و بده‌بستان‌ها، [ادغام پیام‌های مستقیم ارسال‌شده به‌صورت جداشده](#coalescing-split-send-dms-command--url-in-one-composition) را ببینید. وقتی بدون `messages.inbound.byChannel.bluebubbles` صریح فعال شود، پنجره پیش‌فرض تأخیرزدایی ورودی را از 500 ms به 2500 ms افزایش می‌دهد.
    - `channels.bluebubbles.historyLimit`: حداکثر پیام‌های گروه برای زمینه (0 غیرفعال می‌کند).
    - `channels.bluebubbles.dmHistoryLimit`: محدودیت تاریخچه پیام مستقیم.
    - `channels.bluebubbles.replyContextApiFallback`: وقتی یک پاسخ ورودی بدون `replyToBody`/`replyToSender` می‌رسد و کش درون‌حافظه‌ای زمینه پاسخ پیدا نمی‌شود، پیام اصلی را از API HTTP BlueBubbles به‌عنوان جایگزین در حد بهترین تلاش دریافت می‌کند (پیش‌فرض: `false`). برای استقرارهای چندنمونه‌ای که یک حساب BlueBubbles را به اشتراک می‌گذارند، پس از راه‌اندازی مجدد فرایند، یا پس از تخلیه کش TTL/LRU بلندمدت مفید است. دریافت با همان سیاستی که برای هر درخواست دیگر کلاینت BlueBubbles استفاده می‌شود در برابر SSRF محافظت می‌شود، هرگز خطا پرتاب نمی‌کند، و کش را پر می‌کند تا پاسخ‌های بعدی سرشکن شوند. بازنویسی برای هر حساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. تنظیم در سطح کانال به حساب‌هایی که این پرچم را حذف کرده‌اند منتقل می‌شود.

  </Accordion>
  <Accordion title="کنش‌ها و حساب‌ها">
    - `channels.bluebubbles.actions`: فعال/غیرفعال کردن کنش‌های مشخص.
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
- شناسه‌های مستقیم: `+15555550123`، `user@example.com`
  - اگر یک شناسه مستقیم چت پیام مستقیم موجود نداشته باشد، OpenClaw از طریق `POST /api/v1/chat/new` یکی ایجاد می‌کند. این کار نیازمند فعال بودن BlueBubbles Private API است.

### مسیریابی iMessage در برابر SMS

وقتی همان شناسه روی Mac هم چت iMessage و هم چت SMS داشته باشد (برای مثال شماره تلفنی که در iMessage ثبت شده اما پیام‌های جایگزین حباب سبز را هم دریافت کرده است)، OpenClaw چت iMessage را ترجیح می‌دهد و هرگز بی‌صدا به SMS تنزل نمی‌دهد. برای اجبار به استفاده از چت SMS، از پیشوند هدف صریح `sms:` استفاده کنید (برای مثال `sms:+15555550123`). شناسه‌هایی که چت iMessage منطبق ندارند همچنان از طریق هر چتی که BlueBubbles گزارش می‌کند ارسال می‌شوند.

## امنیت

- درخواست‌های Webhook با مقایسه پارامترهای پرس‌وجوی `guid`/`password` یا سرآیندها با `channels.bluebubbles.password` احراز هویت می‌شوند.
- گذرواژه API و نقطه پایانی Webhook را محرمانه نگه دارید (با آن‌ها مانند اعتبارنامه برخورد کنید).
- برای احراز هویت Webhook در BlueBubbles هیچ میان‌بری برای localhost وجود ندارد. اگر ترافیک Webhook را پراکسی می‌کنید، گذرواژه BlueBubbles را از ابتدا تا انتهای درخواست نگه دارید. `gateway.trustedProxies` در اینجا جایگزین `channels.bluebubbles.password` نمی‌شود. [امنیت Gateway](/fa/gateway/security#reverse-proxy-configuration) را ببینید.
- اگر سرور BlueBubbles را بیرون از LAN خود در معرض دسترس قرار می‌دهید، HTTPS و قوانین دیواره آتش را فعال کنید.

## عیب‌یابی

- اگر رویدادهای تایپ/خواندن از کار افتادند، لاگ‌های Webhook در BlueBubbles را بررسی کنید و مطمئن شوید مسیر Gateway با `channels.bluebubbles.webhookPath` منطبق است.
- کدهای جفت‌سازی پس از یک ساعت منقضی می‌شوند؛ از `openclaw pairing list bluebubbles` و `openclaw pairing approve bluebubbles <code>` استفاده کنید.
- واکنش‌ها به API خصوصی BlueBubbles (`POST /api/v1/message/react`) نیاز دارند؛ مطمئن شوید نسخه سرور آن را ارائه می‌کند.
- ویرایش/لغو ارسال به macOS 13+ و نسخه سازگار سرور BlueBubbles نیاز دارد. در macOS 26 (Tahoe)، ویرایش فعلا به‌دلیل تغییرات API خصوصی خراب است.
- به‌روزرسانی آیکون گروه در macOS 26 (Tahoe) می‌تواند ناپایدار باشد: API ممکن است موفقیت برگرداند اما آیکون جدید همگام نشود.
- OpenClaw کنش‌های شناخته‌شده خراب را بر اساس نسخه macOS سرور BlueBubbles به‌طور خودکار پنهان می‌کند. اگر ویرایش همچنان در macOS 26 (Tahoe) ظاهر می‌شود، آن را به‌صورت دستی با `channels.bluebubbles.actions.edit=false` غیرفعال کنید.
- `coalesceSameSenderDms` فعال است اما ارسال‌های جداشده (مثلا `Dump` + URL) همچنان به‌صورت دو نوبت می‌رسند: چک‌لیست [عیب‌یابی ادغام ارسال جداشده](#split-send-coalescing-troubleshooting) را ببینید - علت‌های رایج شامل پنجره تأخیرزدایی بیش از حد تنگ، برداشت نادرست مهرهای زمانی لاگ نشست به‌عنوان زمان رسیدن Webhook، یا ارسال نقل‌قول پاسخ (که از `replyToBody` استفاده می‌کند، نه Webhook دوم) هستند.
- برای اطلاعات وضعیت/سلامت: `openclaw status --all` یا `openclaw status --deep`.

برای مرجع کلی گردش‌کار کانال، راهنمای [کانال‌ها](/fa/channels) و [Plugins](/fa/tools/plugin) را ببینید.

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) - رفتار چت گروهی و دروازه‌گذاری ذکر نام
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
