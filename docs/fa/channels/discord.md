---
read_when:
    - کار روی ویژگی‌های کانال Discord
summary: وضعیت پشتیبانی بات Discord، قابلیت‌ها و پیکربندی
title: Discord
x-i18n:
    generated_at: "2026-05-06T17:52:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

برای پیام‌های مستقیم و کانال‌های guild از طریق Gateway رسمی Discord آماده است.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و فهرست دستورها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی بین‌کانالی و روند تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با یک بات بسازید، بات را به سرور خود اضافه کنید و آن را به OpenClaw جفت کنید. توصیه می‌کنیم بات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="Create a Discord application and bot">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را به هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="Enable privileged intents">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و موارد زیر را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام با شناسه الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="Copy your bot token">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    با وجود نامش، این کار نخستین توکن شما را ایجاد می‌کند؛ چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی و جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز دارید.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن بات به سرورتان ایجاد می‌کنید.

    به پایین تا **OAuth2 URL Generator** بروید و موارد زیر را فعال کنید:

    - `bot`
    - `applications.commands`

    یک بخش **Bot Permissions** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در رشته‌های Discord پیام بفرستید، از جمله گردش‌کارهای کانال‌های forum یا media که یک رشته ایجاد یا ادامه می‌دهند، **Send Messages in Threads** را هم فعال کنید.
    URL ایجادشده در پایین را کپی کنید، آن را در مرورگر خود بچسبانید، سرور خود را انتخاب کنید و برای اتصال روی **Continue** کلیک کنید. اکنون باید بات خود را در سرور Discord ببینید.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتار شما) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. در نوار کناری روی **server icon** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **own avatar** خود راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید؛ در گام بعدی هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="Allow DMs from server members">
    برای اینکه جفت‌سازی کار کند، Discord باید به بات شما اجازه دهد به شما پیام مستقیم بدهد. روی **server icon** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله بات‌ها) اجازه می‌دهد برای شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های guild استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    توکن بات Discord شما یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی دستگاهی که OpenClaw را اجرا می‌کند تنظیم کنید.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    اگر OpenClaw از قبل به‌صورت سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac مربوط به OpenClaw یا با توقف و شروع دوباره فرایند `openclaw gateway run` راه‌اندازی مجدد کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از پوسته‌ای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس پس از راه‌اندازی مجدد بتواند SecretRef محیطی را resolve کند.
    اگر میزبان شما توسط lookup برنامه در زمان شروع Discord مسدود یا rate-limit شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند بات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        با عامل OpenClaw خود در هر کانال موجودی (مثلاً Telegram) گفتگو کنید و به آن بگویید. اگر Discord نخستین کانال شماست، به‌جای آن از زبانه CLI / config استفاده کنید.

        > «من توکن بات Discord خود را از قبل در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
      </Tab>
      <Tab title="CLI / config">
        اگر پیکربندی مبتنی بر فایل را ترجیح می‌دهید، این را تنظیم کنید:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        جایگزین محیطی برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقادیر متن ساده `token` پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در ارائه‌دهندگان env/file/exec پشتیبانی می‌شوند. [مدیریت اسرار](/fa/gateway/secrets) را ببینید.

        برای چند بات Discord، هر توکن بات و شناسه برنامه را زیر حساب خودش نگه دارید. یک `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، بنابراین فقط وقتی آن را آنجا تنظیم کنید که همه حساب‌ها باید از همان شناسه برنامه استفاده کنند.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approve first DM pairing">
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به بات خود پیام مستقیم بدهید. بات با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="Ask your agent">
        کد جفت‌سازی را در کانال موجود خود برای عاملتان بفرستید:

        > «این کد جفت‌سازی Discord را تأیید کن: `<CODE>`»
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

    اکنون باید بتوانید از طریق پیام مستقیم در Discord با عامل خود گفتگو کنید.

  </Step>
</Steps>

<Note>
resolve کردن توکن نسبت به حساب آگاه است. مقادیر توکن پیکربندی بر جایگزین محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب Discord فعال به یک توکن بات resolve شوند، OpenClaw فقط یک پایشگر Gateway برای آن توکن شروع می‌کند. توکنِ منبع‌گرفته از پیکربندی بر جایگزین محیطی پیش‌فرض اولویت دارد؛ در غیر این صورت، نخستین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار message/کنش‌های کانال)، یک `token` صریحِ مختص هر فراخوانی برای همان فراخوانی استفاده می‌شود. این موضوع برای کنش‌های send و read/probe-style اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش دوباره همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آیند.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری guild

پس از اینکه پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل خودش را با زمینه خودش دارد. این برای سرورهای خصوصی که فقط شما و باتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="Add your server to the guild allowlist">
    این کار به عامل شما اجازه می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="Ask your agent">
        > «Discord Server ID `<server_id>` من را به فهرست مجاز guild اضافه کن»
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Allow responses without @mention">
    به‌طور پیش‌فرض، عامل شما در کانال‌های guild فقط وقتی @mention شود پاسخ می‌دهد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های guild، پاسخ‌های نهایی عادی دستیار به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل مشاهده Discord باید صریحاً با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض در پس‌زمینه بماند و فقط وقتی تشخیص داد پاسخ کانالی مفید است پیام بفرستد.

    این یعنی مدل انتخاب‌شده باید به‌طور قابل اعتماد ابزارها را فراخوانی کند. اگر Discord نشان می‌دهد در حال تایپ است و لاگ‌ها مصرف توکن را نشان می‌دهند اما هیچ پیامی ارسال نشده، لاگ نشست را برای متن دستیار با `didSendViaMessagingTool: false` بررسی کنید. این یعنی مدل به‌جای فراخوانی `message(action=send)` یک پاسخ نهایی خصوصی تولید کرده است. به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا از پیکربندی زیر استفاده کنید تا پاسخ‌های نهایی خودکار قدیمی را برگردانید.

    <Tabs>
      <Tab title="Ask your agent">
        > «به عامل من اجازه بده بدون اینکه لازم باشد @mention شود، روی این سرور پاسخ دهد»
      </Tab>
      <Tab title="Config">
        در پیکربندی guild خود `requireMention: false` را تنظیم کنید:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروه/کانال، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های guild به‌صورت خودکار MEMORY.md را بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="Ask your agent">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر برای زمینه بلندمدت از MEMORY.md به آن نیاز داری از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="Manual">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورهای پایدار را در `AGENTS.md` یا `USER.md` بگذارید (برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال روی سرور Discord خود بسازید و گفتگو را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست جداافتاده خودش را می‌گیرد؛ بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با گردش‌کارتان سازگار است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ guild/channel در Discord به‌عنوان context غیرقابل‌اعتماد به prompt مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن envelope را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از context بازپخش آینده حذف می‌کند.
- به‌صورت پیش‌فرض (`session.dmScope=main`)، چت‌های مستقیم session اصلی agent را به اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های guild کلیدهای session ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌صورت پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های slash بومی در sessionهای فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به session گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان‌های cron/heartbeat فقط‌متنی به Discord، پاسخ نهایی قابل‌مشاهده برای assistant را یک‌بار استفاده می‌کند. payloadهای رسانه‌ای و componentهای ساختاریافته، وقتی agent چند payload قابل‌تحویل منتشر می‌کند، همچنان چندپیامی می‌مانند.

## کانال‌های Forum

کانال‌های forum و media در Discord فقط پست‌های thread را می‌پذیرند. OpenClaw از دو روش برای ساخت آن‌ها پشتیبانی می‌کند:

- به والد forum (`channel:<forumId>`) پیام بفرستید تا یک thread خودکار ساخته شود. عنوان thread از اولین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ساخت مستقیم thread استفاده کنید. برای کانال‌های forum، `--message-id` را پاس ندهید.

مثال: ارسال به والد forum برای ساخت thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ساخت صریح thread در forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای forum componentهای Discord را نمی‌پذیرند. اگر به component نیاز دارید، به خود thread ارسال کنید (`channel:<threadId>`).

## componentهای تعاملی

OpenClaw از containerهای components v2 در Discord برای پیام‌های agent پشتیبانی می‌کند. از ابزار message با payload `components` استفاده کنید. نتیجه‌های interaction به‌عنوان پیام‌های ورودی عادی به agent برگردانده می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های action تا ۵ button یا یک select menu تکی را مجاز می‌کنند
- نوع‌های select: `string`, `user`, `role`, `mentionable`, `channel`

به‌صورت پیش‌فرض، componentها یک‌بارمصرف هستند. برای اینکه buttonها، selectها و formها تا زمان انقضا چند بار قابل‌استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی یک button کلیک کند، `allowedUsers` را روی همان button تنظیم کنید (شناسه‌های کاربری Discord، tagها، یا `*`). وقتی پیکربندی شود، کاربران نامنطبق یک رد ephemeral دریافت می‌کنند.

فرمان‌های slash مربوط به `/model` و `/models` یک model picker تعاملی باز می‌کنند که شامل dropdownهای provider، model و runtime سازگار به‌همراه مرحلهٔ Submit است. `/models add` منسوخ شده و اکنون به‌جای ثبت modelها از chat، یک پیام deprecation برمی‌گرداند. پاسخ picker به‌صورت ephemeral است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند.

پیوست‌های file:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (تک file)؛ برای چند file از `media-gallery` استفاده کنید
- وقتی نام upload باید با مرجع پیوست مطابق باشد، برای override کردن نام از `filename` استفاده کنید

formهای modal:

- `components.modal` را با حداکثر ۵ field اضافه کنید
- نوع‌های field: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw به‌صورت خودکار یک trigger button اضافه می‌کند

مثال:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` allowlist رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر policy مربوط به DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای pairing راهنمایی می‌شوند).

    اولویت در چند حساب:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب target مربوط به DM برای تحویل:

    - `user:<id>`
    - mention به‌شکل `<@id>`

    شناسه‌های عددی خام معمولا وقتی یک channel default فعال باشد به‌عنوان شناسه‌های channel resolve می‌شوند، اما شناسه‌های فهرست‌شده در DM مؤثر حساب `allowFrom` برای سازگاری به‌عنوان targetهای DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="DM access groups">
    DMهای Discord می‌توانند از entryهای پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های access group بین کانال‌های message مشترک هستند. برای یک گروه static که اعضای آن در syntax عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی audience فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک access-group اینجا مستند شده است: [Access groups](/fa/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    یک کانال text در Discord فهرست عضو جداگانه ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو guild پیکربندی‌شده است و در حال حاضر پس از اعمال roleها و overwriteهای channel، مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    مثال: به هر کسی که می‌تواند `#maintainers` را ببیند اجازه دهید به bot در DM پیام بدهد، در حالی که DMها برای همهٔ افراد دیگر بسته می‌مانند.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    می‌توانید entryهای پویا و static را ترکیب کنید:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    lookupها در حالت شکست بسته عمل می‌کنند. اگر Discord مقدار `Missing Access` برگرداند، lookup عضو شکست بخورد، یا کانال متعلق به guild دیگری باشد، فرستندهٔ DM غیرمجاز تلقی می‌شود.

    هنگام استفاده از access groupهای channel-audience، در Discord Developer Portal گزینهٔ **Server Members Intent** را برای bot فعال کنید. DMها state عضویت در guild را شامل نمی‌شوند، بنابراین OpenClaw عضو را هنگام authorization از طریق Discord REST resolve می‌کند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت guild توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    baseline امن وقتی `channels.discord` وجود دارد `allowlist` است.

    رفتار `allowlist`:

    - guild باید با `channels.discord.guilds` منطبق باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - allowlistهای اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های role)؛ اگر هرکدام پیکربندی شده باشد، فرستنده‌ها وقتی با `users` یا `roles` منطبق شوند مجاز هستند
    - تطبیق مستقیم name/tag به‌صورت پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - name/tag برای `users` پشتیبانی می‌شود، اما شناسه‌ها امن‌تر هستند؛ `openclaw security audit` هنگام استفاده از entryهای name/tag هشدار می‌دهد
    - اگر یک guild دارای `channels` پیکربندی‌شده باشد، channelهای فهرست‌نشده رد می‌شوند
    - اگر یک guild بلوک `channels` نداشته باشد، همهٔ channelهای آن guild موجود در allowlist مجاز هستند

    مثال:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` است (با یک هشدار در logها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های guild به‌صورت پیش‌فرض با mention محدود می‌شوند.

    تشخیص mention شامل موارد زیر است:

    - mention صریح bot
    - الگوهای mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback برابر `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی reply-to-bot در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از syntax رسمی mention استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای channelها، و `<@&ROLE_ID>` برای roleها. از شکل mention nickname قدیمی `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر guild/channel پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/role دیگری mention می‌کنند اما bot را mention نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - allowlist اختیاری از طریق `dm.groupChannels` (شناسه‌های channel یا slugها)

  </Tab>
</Tabs>

### مسیریابی agent بر اساس role

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به agentهای متفاوت بر اساس شناسهٔ role استفاده کنید. bindingهای مبتنی بر role فقط شناسه‌های role را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط-guild ارزیابی می‌شوند. اگر یک binding fieldهای match دیگری نیز تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ fieldهای پیکربندی‌شده باید منطبق باشند.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## فرمان‌های بومی و auth فرمان

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` هنگام راه‌اندازی، ثبت و پاک‌سازی دستورهای اسلش Discord را رد می‌کند. دستورهایی که قبلا ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت دستورهای بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش معمول پیام استفاده می‌کند.
- دستورها ممکن است همچنان در UI Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای کاتالوگ دستورها و رفتار، [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض دستور اسلش:

- `ephemeral: true`

## جزئیات ویژگی

<AccordionGroup>
  <Accordion title="برچسب‌های پاسخ و پاسخ‌های بومی">
    Discord از برچسب‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    با `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌سازی ضمنی پاسخ را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به اولین پیام خروجی Discord برای آن نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    نوبت ورودی یک دسته debounce‌شده از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتا برای چت‌های مبهم و ناگهانی می‌خواهید، نه هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایش داده می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming` یکی از `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش را نگه می‌دارد و تا تحویل نهایی آن را با پیشرفت ابزار به‌روزرسانی می‌کند؛ `streamMode` یک نام مستعار قدیمی زمان اجرا است. برای بازنویسی پیکربندی ماندگار به کلید متعارف، `openclaw doctor --fix` را اجرا کنید.

    مقدار پیش‌فرض `off` می‌ماند، زیرا ویرایش‌های پیش‌نمایش Discord وقتی چند بات یا Gateway یک حساب را به اشتراک می‌گذارند، به‌سرعت به محدودیت نرخ برخورد می‌کنند.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` هنگام رسیدن توکن‌ها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی به اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، با محدودسازی به `textChunkLimit`).
    - رسانه، خطا، و پایان‌های پاسخ صریح، ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات دستور/اجرا را در خطوط پیشرفت فشرده کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام دستور/اجرا را پنهان کنید، در حالی که خطوط پیشرفت فشرده حفظ می‌شوند:

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل معمول برمی‌گردند. وقتی پخش `block` به‌صراحت فعال شده باشد، OpenClaw برای جلوگیری از پخش دوباره، جریان پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، زمینه، و رفتار رشته">
    زمینه تاریخچه guild:

    - مقدار پیش‌فرض `channels.discord.historyLimit` برابر `20` است
    - بازگشت جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند، مگر اینکه بازنویسی شده باشد.
    - نشست‌های رشته، انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان بازگشت جایگزین مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی رشته همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه ارث‌بری رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای بذرگیری از رونوشت والد فعال می‌کند. بازنویسی‌های به‌ازای هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند هدف‌های DM از نوع `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام بازگشت جایگزین فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوع‌های کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل حذف زمینه تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های وابسته به رشته برای عامل‌های فرعی">
    Discord می‌تواند یک رشته را به هدف نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست مسیریابی شوند (از جمله نشست‌های عامل فرعی).

    دستورها:

    - `/focus <target>` رشته فعلی/جدید را به هدف عامل فرعی/نشست متصل می‌کند
    - `/unfocus` اتصال رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت اتصال را نشان می‌دهد
    - `/session idle <duration|off>` لغو تمرکز خودکار به دلیل عدم فعالیت را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر سن قطعی را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند

    پیکربندی:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    نکته‌ها:

    - `session.threadBindings.*` پیش‌فرض‌های سراسری را تنظیم می‌کند.
    - `channels.discord.threadBindings.*` رفتار Discord را بازنویسی می‌کند.
    - `spawnSessions` ایجاد/اتصال خودکار رشته‌ها را برای `sessions_spawn({ thread: true })` و ایجاد رشته‌های ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه بومی عامل فرعی را برای ایجادهای وابسته به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` توسط `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با اتصال رشته در دسترس نیستند.

    [عامل‌های فرعی](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="اتصال‌های کانال ACP پایدار">
    برای فضاهای کاری ACP پایدار و "همیشه روشن"، اتصال‌های ACP تایپ‌شده سطح بالا را پیکربندی کنید که مکالمات Discord را هدف می‌گیرند.

    مسیر پیکربندی:

    - `bindings[]` با `type: "acp"` و `match.channel: "discord"`

    نمونه:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    نکته‌ها:

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان‌جا متصل می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را در همان‌جا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند هنگام فعال بودن، حل هدف را بازنویسی کنند.
    - `spawnSessions` ایجاد/اتصال رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش به‌ازای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده متصل می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` وقتی OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - بازگشت جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های پیکربندی">
    نوشتن‌های پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال هستند.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی ویژگی‌های دستور فعال باشند).

    غیرفعال کردن:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="پراکسی Gateway">
    ترافیک WebSocket Gateway مربوط به Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل فهرست مجاز) را با `channels.discord.proxy` از طریق یک پراکسی HTTP(S) مسیریابی کنید.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    بازنویسی به‌ازای هر حساب:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="پشتیبانی PluralKit">
    حل PluralKit را فعال کنید تا پیام‌های proxied به هویت عضو سیستم نگاشت شوند:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    نکته‌ها:

    - فهرست‌های مجاز می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی عضو فقط زمانی بر اساس نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به پنجره زمانی محدود هستند
    - اگر جست‌وجو ناموفق باشد، پیام‌های proxied به‌عنوان پیام بات در نظر گرفته می‌شوند و حذف می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها به منشن‌های خروجی قطعی برای کاربران شناخته‌شده Discord نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handle بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و منشن‌های داخل code spanهای Markdown بدون تغییر می‌مانند.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="پیکربندی حضور">
    به‌روزرسانی‌های حضور وقتی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت را تنظیم کنید، یا وقتی حضور خودکار را فعال کنید.

    نمونه فقط وضعیت:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    نمونه فعالیت (وضعیت سفارشی نوع فعالیت پیش‌فرض است):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    نمونه پخش:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    نگاشت نوع فعالیت:

    - 0: در حال بازی
    - 1: در حال پخش (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان وضعیت status استفاده می‌کند؛ ایموجی اختیاری است)
    - 5: در حال رقابت

    نمونه حضور خودکار (سیگنال سلامت زمان اجرا):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "توکن تمام شده است",
      },
    },
  },
}
```

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، تنزل‌یافته یا نامعلوم => بیکار، تمام‌شده یا ناموجود => مزاحم نشوید. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در پیام‌های مستقیم پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری اعلان‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل حل باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، Discord تأییدهای اجرای بومی را به‌طور خودکار فعال می‌کند. Discord تأییدکننده‌های اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس مخصوص مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw اعلان‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده یک مسیر مالک Discord داشته باشد، ابتدا پیام مستقیم Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک در دسترس از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، اعلان تأیید در کانال قابل مشاهده است. فقط تأییدکننده‌های حل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقتی دریافت می‌کنند. اعلان‌های تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل پیام مستقیم برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند نمایش می‌دهد. آداپتور بومی Discord عمدتاً مسیریابی پیام مستقیم تأییدکننده و انتشار در کانال را اضافه می‌کند.
    وقتی این دکمه‌ها وجود داشته باشند، تجربه کاربری اصلی تأیید همان‌ها هستند؛ OpenClaw
    فقط زمانی باید فرمان دستی `/approve` را وارد کند که نتیجه ابزار بگوید
    تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید بومی Discord فعال نباشد، OpenClaw اعلان
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت بومی به هیچ هدفی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و گیت‌های کنش

کنش‌های پیام Discord شامل کنش‌های پیام‌رسانی، مدیریت کانال، تعدیل، حضور و فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- تعدیل: `timeout`، `kick`، `ban`
- حضور: `setPresence`

کنش `event-create` یک پارامتر اختیاری `image` (نشانی URL یا مسیر فایل محلی) می‌پذیرد تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

گیت‌های کنش زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض گیت:

| گروه کنش                                                                                                                                                                 | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال     |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## رابط کاربری Components v2

OpenClaw برای تأییدهای اجرا و نشانگرهای میان‌زمینه‌ای از مؤلفه‌های v2 در Discord استفاده می‌کند. کنش‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` را بپذیرند (پیشرفته؛ نیازمند ساختن payload مؤلفه از طریق ابزار discord)، درحالی‌که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی مورد استفاده کانتینرهای مؤلفه Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی مؤلفه‌های v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.

نمونه:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## صدا

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موج). gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست بررسی راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی allowlistهای نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی هدف، مجوزهای Connect، Speak، Send Messages و Read Message History را اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قواعد allowlist و خط‌مشی گروهی دیگر فرمان‌های Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

نمونه پیوستن خودکار:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

نکته‌ها:

- `voice.tts` فقط برای پخش صوتی، `messages.tts` را بازنویسی می‌کند.
- `voice.model` فقط LLM مورد استفاده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` بر رونویسی اثر ندارد.
- بازنویسی‌های `systemPrompt` در هر کانال Discord برای نوبت‌های رونوشت صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونوشت صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) استخراج می‌کنند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای مخصوص مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال کردن فرمان‌های `/vc`، زمان اجرای صدا، و intent مربوط به gateway به نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صدا را صریحاً بازنویسی کند. آن را تنظیم‌نشده بگذارید تا intent از فعال‌سازی مؤثر صدا پیروی کند.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های پیوستن `@discordjs/voice` منتقل می‌شوند.
- اگر تنظیم نشده باشند، پیش‌فرض‌های `@discordjs/voice` برابر `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع اتصال یک نشست صوتی، چه مدت منتظر شروع اتصال مجدد بماند پیش از آنکه آن را نابود کند. پیش‌فرض: `15000`.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را زیر نظر می‌گیرد و پس از خطاهای تکراری در یک بازه کوتاه، با خروج و پیوستن دوباره به کانال صوتی، به‌طور خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، گزارش‌های دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و گزارش‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR شماره #11449 در discord.js است که issue شماره #11419 در discord.js را بست.

زنجیره کانال صوتی:

- دریافت PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` مدیریت STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از طریق ورودی و مسیریابی Discord ارسال می‌شود، درحالی‌که LLM پاسخ با خط‌مشی خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگشتی می‌خواهد، چون صدای Discord مالک پخش نهایی TTS است.
- وقتی `voice.model` تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صدای حاصل در کانال پیوسته پخش می‌شود.

اعتبارنامه‌ها برای هر مؤلفه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord یک پیش‌نمایش موج نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw موج را به‌طور خودکار تولید می‌کند، اما برای بررسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (نشانی‌های URL رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در یک payload واحد رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا ربات هیچ پیام guild نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را راه‌اندازی مجدد کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - allowlist مربوط به guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` در guild وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false است اما همچنان مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون allowlist منطبق برای guild/channel
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist مربوط به `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    گزارش‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    knobهای صف gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار شنونده gateway در Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord یک timeout تحت مالکیت کانال را روی نوبت‌های عامل صف‌شده اعمال نمی‌کند. شنونده‌های پیام بلافاصله واگذار می‌کنند و اجراهای صف‌شده Discord ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/زمان اجرا کار را کامل یا لغو کند، حفظ می‌کنند.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="هشدارهای مهلت زمانی جست‌وجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده Discord `/gateway/bot` را دریافت می‌کند. خطاهای گذرا به نشانی پیش‌فرض Gateway در Discord بازمی‌گردند و در گزارش‌ها محدودسازی نرخ می‌شوند.

    تنظیمات مهلت زمانی فراداده:

    - حساب تکی: `channels.discord.gatewayInfoTimeoutMs`
    - چندحسابی: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - جایگزین env وقتی پیکربندی تنظیم نشده است: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی مجدد به‌دلیل مهلت زمانی READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد زمان اجرا، منتظر رویداد `READY` در Gateway مربوط به Discord می‌ماند. راه‌اندازی‌های چندحسابی با فاصله‌گذاری در شروع ممکن است نسبت به مقدار پیش‌فرض، به پنجره READY طولانی‌تری برای راه‌اندازی نیاز داشته باشند.

    تنظیمات مهلت زمانی READY:

    - راه‌اندازی حساب تکی: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحسابی: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - جایگزین env راه‌اندازی وقتی پیکربندی تنظیم نشده است: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - زمان اجرای حساب تکی: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - زمان اجرای چندحسابی: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - جایگزین env زمان اجرا وقتی پیکربندی تنظیم نشده است: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض زمان اجرا: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناسازگاری‌های ممیزی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق در زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال شده: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال شده: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در انتظار تأیید جفت‌سازی در حالت `pairing`

  </Accordion>

  <Accordion title="حلقه‌های بات به بات">
    به‌طور پیش‌فرض پیام‌های نوشته‌شده توسط بات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه mention و allowlist استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که به بات mention می‌کنند.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="افت Voice STT با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیمش کنید
    - گزارش‌ها را برای موارد زیر بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خطاها پس از پیوستن مجدد خودکار ادامه داشتند، گزارش‌ها را جمع‌آوری کنید و با تاریخچه دریافت DAVE در upstream در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای مهم Discord">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- پخش جریانی: `streaming` (نام مستعار قدیمی: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (بارگذاری‌های خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- اقدامات: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`، `bindings[]` سطح بالا (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های بات را محرمانه در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح داده می‌شود).
- مجوزهای Discord را با کمترین سطح دسترسی لازم اعطا کنید.
- اگر وضعیت/استقرار فرمان قدیمی است، Gateway را راه‌اندازی مجدد کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار گفت‌وگوی گروهی و allowlist.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها هدایت کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعامله" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به agentها نگاشت کنید.
  </Card>
  <Card title="دستورهای Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
