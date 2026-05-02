---
read_when:
    - در حال کار روی ویژگی‌های کانال Discord
summary: وضعیت پشتیبانی ربات Discord، قابلیت‌ها و پیکربندی
title: Discord
x-i18n:
    generated_at: "2026-05-02T11:34:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42223982a8bfd288d29a1f402b37141557718a407537011956b878b91b894e62
    source_path: channels/discord.md
    workflow: 16
---

آماده برای DMها و کانال‌های guild از طریق Discord gateway رسمی.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    DMهای Discord به‌طور پیش‌فرض روی حالت جفت‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان‌های بومی و کاتالوگ فرمان‌ها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی بین‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید با یک bot بسازید، bot را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. توصیه می‌کنیم bot خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز یکی ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="Create a Discord application and bot">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را روی هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="Enable privileged intents">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (توصیه‌شده؛ برای allowlistهای نقش و تطبیق نام با ID الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های presence لازم است)

  </Step>

  <Step title="Copy your bot token">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار اولین token شما را تولید می‌کند — چیزی «reset» نمی‌شود.
    </Note>

    token را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز دارید.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    در نوار کناری روی **OAuth2** کلیک کنید. یک invite URL با مجوزهای درست تولید می‌کنید تا bot را به سرور خود اضافه کنید.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخش **Bot Permissions** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **General Permissions**
      - مشاهده کانال‌ها
    **Text Permissions**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام
      - جاسازی پیوندها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در threadهای Discord پست بگذارید، از جمله گردش‌کارهای کانال forum یا media که یک thread می‌سازند یا ادامه می‌دهند، **Send Messages in Threads** را نیز فعال کنید.
    URL تولیدشده در پایین را کپی کنید، آن را در مرورگر خود paste کنید، سرور خود را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید bot خود را در سرور Discord ببینید.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید IDهای داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار avatar شما) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. در نوار کناری روی **server icon** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **own avatar** خود راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="Allow DMs from server members">
    برای اینکه جفت‌سازی کار کند، Discord باید به bot شما اجازه دهد به شما DM بدهد. روی **server icon** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله botها) اجازه می‌دهد به شما DM بفرستند. اگر می‌خواهید از DMهای Discord با OpenClaw استفاده کنید، این را فعال نگه دارید. اگر فقط قصد استفاده از کانال‌های guild را دارید، می‌توانید بعد از جفت‌سازی DMها را غیرفعال کنید.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    token bot Discord شما یک secret است (مثل رمز عبور). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac OpenClaw یا با متوقف کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` restart کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از shellای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید، تا سرویس بتواند پس از restart، env SecretRef را resolve کند.
    اگر host شما توسط lookup برنامه startup در Discord مسدود یا rate-limited شده است، application/client ID مربوط به Discord را از Developer Portal تنظیم کنید تا startup بتواند آن REST call را رد کند. برای account پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند bot Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) chat کنید و به آن بگویید. اگر Discord اولین کانال شماست، به‌جای آن از تب CLI / config استفاده کنید.

        > «من از قبل token bot Discord خود را در config تنظیم کرده‌ام. لطفاً setup Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
      </Tab>
      <Tab title="CLI / config">
        اگر config مبتنی بر فایل را ترجیح می‌دهید، این را تنظیم کنید:

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

        fallback متغیر محیطی برای account پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای setup اسکریپتی یا remote، همان بلاک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقادیر plaintext برای `token` پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت secretها](/fa/gateway/secrets) را ببینید.

        برای چند bot Discord، هر token bot و application ID را زیر account خودش نگه دارید. یک `channels.discord.applicationId` سطح بالا توسط accountها به ارث برده می‌شود، پس فقط وقتی آن را آنجا تنظیم کنید که همه accountها باید از همان application ID استفاده کنند.

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
    صبر کنید تا gateway اجرا شود، سپس در Discord به bot خود DM بدهید. با یک کد جفت‌سازی پاسخ می‌دهد.

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

    کدهای جفت‌سازی پس از 1 ساعت منقضی می‌شوند.

    اکنون باید بتوانید از طریق DM در Discord با عامل خود chat کنید.

  </Step>
</Steps>

<Note>
resolve کردن token به account آگاه است. مقادیر token در config بر fallback متغیر محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای account پیش‌فرض استفاده می‌شود.
اگر دو account فعال Discord به token bot یکسان resolve شوند، OpenClaw فقط یک gateway monitor برای آن token شروع می‌کند. token با منبع config بر fallback متغیر محیطی پیش‌فرض اولویت دارد؛ در غیر این صورت اولین account فعال برنده می‌شود و account تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای callهای outbound پیشرفته (message tool/channel actions)، یک `token` صریح per-call برای همان call استفاده می‌شود. این مورد برای actionهای send و read/probe-style اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات policy/retry مربوط به account همچنان از account انتخاب‌شده در snapshot فعال runtime می‌آید.
</Note>

## توصیه‌شده: راه‌اندازی workspace guild

وقتی DMها کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک workspace کامل تنظیم کنید که در آن هر کانال session عامل خودش را با context خودش دارد. این برای سرورهای خصوصی که فقط شما و bot شما در آن هستید توصیه می‌شود.

<Steps>
  <Step title="Add your server to the guild allowlist">
    این کار عامل شما را قادر می‌کند در هر کانالی روی سرور شما پاسخ دهد، نه فقط DMها.

    <Tabs>
      <Tab title="Ask your agent">
        > «Discord Server ID من یعنی `<server_id>` را به guild allowlist اضافه کن»
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
    به‌طور پیش‌فرض، عامل شما در کانال‌های guild فقط وقتی @mentioned شود پاسخ می‌دهد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های guild، پاسخ‌های نهایی عادی assistant به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل مشاهده Discord باید صریحاً با ابزار `message` فرستاده شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض بی‌صدا بماند و فقط وقتی تصمیم گرفت پاسخ کانالی مفید است، پست کند.

    <Tabs>
      <Tab title="Ask your agent">
        > «به عامل من اجازه بده بدون نیاز به @mentioned شدن، در این سرور پاسخ دهد»
      </Tab>
      <Tab title="Config">
        در config مربوط به guild خود `requireMention: false` را تنظیم کنید:

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

        برای بازگرداندن پاسخ‌های نهایی خودکار legacy برای اتاق‌های group/channel، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در sessionهای DM بارگذاری می‌شود. کانال‌های guild به‌طور خودکار MEMORY.md را بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="Ask your agent">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به context بلندمدت از MEMORY.md نیاز داری از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="Manual">
        اگر در هر کانال به context مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (آن‌ها برای هر session تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای memory به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود بسازید و chat را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال session ایزوله خودش را می‌گیرد — بنابراین می‌توانید `#coding`، `#home`، `#research`، یا هر چیزی را که مناسب workflow شماست تنظیم کنید.

## مدل runtime

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord دوباره به Discord برمی‌گردند.
- فرادادهٔ سرور/کانال Discord به‌عنوان زمینهٔ غیرقابل‌اعتماد به اعلان مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدل آن پوشش را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفتگوهای مستقیم نشست اصلی agent را به‌اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های سرور کلیدهای نشست ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- دستورهای بومی اسلش در نشست‌های فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به نشست گفتگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان cron/heartbeat فقط‌متنی به Discord یک‌بار از پاسخ نهایی قابل‌مشاهده برای دستیار استفاده می‌کند. رسانه و payloadهای مؤلفهٔ ساختاریافته، وقتی agent چند payload قابل‌تحویل تولید می‌کند، همچنان چندپیامه می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته را می‌پذیرند. OpenClaw از دو روش برای ساخت آن‌ها پشتیبانی می‌کند:

- به والد انجمن (`channel:<forumId>`) پیام بفرستید تا یک رشته به‌صورت خودکار ساخته شود. عنوان رشته از اولین خط غیرخالی پیام شما استفاده می‌کند.
- برای ساخت مستقیم یک رشته از `openclaw message thread create` استفاده کنید. برای کانال‌های انجمن `--message-id` را پاس ندهید.

مثال: ارسال به والد انجمن برای ساخت یک رشته

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ساخت صریح یک رشتهٔ انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته ارسال کنید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفه‌های v2 Discord برای پیام‌های agent پشتیبانی می‌کند. از ابزار پیام با payload `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به agent مسیریابی می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌کنند
- نوع‌های انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌گرها و فرم‌ها تا زمان انقضا چند بار استفاده شوند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی یک دکمه کلیک کند، روی آن دکمه `allowedUsers` را تنظیم کنید (شناسه‌های کاربران Discord، تگ‌ها، یا `*`). وقتی پیکربندی شده باشد، کاربران نامطابق یک رد موقت دریافت می‌کنند.

دستورهای اسلش `/model` و `/models` یک انتخاب‌گر مدل تعاملی با provider، مدل، و فهرست‌های کشویی runtime سازگار به‌همراه یک مرحلهٔ Submit باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، یک پیام منسوخ‌بودن برمی‌گرداند. پاسخ انتخاب‌گر موقت است و فقط کاربری که آن را فراخوانده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` فراهم کنید (تک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابقت داشته باشد، برای بازنویسی نام از `filename` استفاده کنید

فرم‌های modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw به‌صورت خودکار یک دکمهٔ trigger اضافه می‌کند

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
  <Tab title="سیاست DM">
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز canonical برای DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    اولویت چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط روی حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - اشارهٔ `<@id>`

    شناسه‌های عددی بدون پیشوند معمولاً وقتی یک پیش‌فرض کانال فعال باشد به‌عنوان شناسهٔ کانال resolve می‌شوند، اما شناسه‌هایی که در `allowFrom` مؤثر DM حساب فهرست شده‌اند، برای سازگاری به‌عنوان هدف‌های DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="گروه‌های دسترسی DM">
    DMهای Discord می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی میان کانال‌های پیام مشترک هستند. برای یک گروه ایستا که اعضای آن با نحو عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه‌های دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست اعضای جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو سرور پیکربندی‌شده است و درحال‌حاضر پس از اعمال نقش‌ها و بازنویسی‌های کانال، مجوز مؤثر `ViewChannel` را روی کانال پیکربندی‌شده دارد.

    مثال: اجازه دهید هر کسی که می‌تواند `#maintainers` را ببیند به bot پیام DM بدهد، درحالی‌که DMها برای همهٔ افراد دیگر بسته می‌مانند.

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

    می‌توانید ورودی‌های پویا و ایستا را ترکیب کنید:

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

    جستجوها در حالت شکست بسته می‌شوند. اگر Discord مقدار `Missing Access` برگرداند، جستجوی عضو شکست بخورد، یا کانال متعلق به سرور دیگری باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را در Discord Developer Portal برای bot فعال کنید. DMها وضعیت عضو سرور را شامل نمی‌شوند، بنابراین OpenClaw در زمان مجوزدهی عضو را از طریق REST Discord resolve می‌کند.

  </Tab>

  <Tab title="سیاست سرور">
    مدیریت سرور توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط پایهٔ امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - سرور باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح دارد، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستنده‌ها وقتی با `users` یا `roles` مطابقت داشته باشند مجاز هستند
    - تطبیق مستقیم نام/تگ به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/تگ‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌تر هستند؛ وقتی ورودی‌های نام/تگ استفاده شوند، `openclaw security audit` هشدار می‌دهد
    - اگر یک سرور `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک سرور بلوک `channels` نداشته باشد، همهٔ کانال‌های آن سرور فهرست‌مجاز مجاز هستند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` خواهد بود (با یک هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="اشاره‌ها و DMهای گروهی">
    پیام‌های سرور به‌طور پیش‌فرض پشت شرط اشاره هستند.

    تشخیص اشاره شامل این موارد است:

    - اشارهٔ صریح به bot
    - الگوهای اشارهٔ پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به bot در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو canonical اشاره استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از فرم اشارهٔ nickname قدیمی `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر سرور/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقش دیگری اشاره می‌کنند اما به bot اشاره نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی agent مبتنی بر نقش

برای مسیریابی اعضای سرور Discord به agentهای مختلف بر اساس شناسهٔ نقش، از `bindings[].match.roles` استفاده کنید. bindingهای مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط سرور ارزیابی می‌شوند. اگر یک binding فیلدهای match دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

## دستورهای بومی و احراز مجوز فرمان

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` فرمان‌های بومی Discord را که قبلا ثبت شده‌اند، صراحتا پاک می‌کند.
- احراز هویت فرمان‌های بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش عادی پیام استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند دیده شوند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و «مجاز نیست» برمی‌گرداند.

برای فهرست فرمان‌ها و رفتار، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض فرمان اسلش:

- `ephemeral: true`

## جزئیات ویژگی

<AccordionGroup>
  <Accordion title="تگ‌های پاسخ و پاسخ‌های بومی">
    Discord از تگ‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    با `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌بندی ضمنی پاسخ را غیرفعال می‌کند. تگ‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    نوبت ورودی یک دسته دیبانس‌شده از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتا برای گفت‌وگوهای جهشی مبهم می‌خواهید، نه هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایش داده می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هم‌زمان با رسیدن متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming` مقادیر `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌پذیرد. `progress` در Discord به `partial` نگاشت می‌شود؛ `streamMode` یک نام مستعار قدیمی است و به‌طور خودکار مهاجرت داده می‌شود.

    مقدار پیش‌فرض `off` باقی می‌ماند چون ویرایش‌های پیش‌نمایش Discord وقتی چند ربات یا Gateway یک حساب را به اشتراک می‌گذارند، به‌سرعت به محدودیت نرخ برخورد می‌کنند.

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

    - `partial` با رسیدن توکن‌ها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` تکه‌هایی با اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، که به `textChunkLimit` محدود می‌شود).
    - رسانه، خطا، و نهایی‌های پاسخ صریح، ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی پخش `block` صراحتا فعال باشد، OpenClaw برای جلوگیری از پخش دوگانه، جریان پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، زمینه، و رفتار رشته">
    زمینه تاریخچه انجمن:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه پیام مستقیم:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند مگر اینکه بازنویسی شده باشد.
    - نشست‌های رشته، انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان جایگزین مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی رشته همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه ارث‌بری رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای مقداردهی اولیه از رونوشت والد انتخاب می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند هدف‌های پیام مستقیم `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام جایگزین‌سازی فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه اینکه یک مرز کامل حذف زمینه تکمیلی باشند.

  </Accordion>

  <Accordion title="نشست‌های مقید به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به هدف نشست bind کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست (از جمله نشست‌های زیرعامل) مسیریابی شوند.

    فرمان‌ها:

    - `/focus <target>` رشته فعلی/جدید را به هدف زیرعامل/نشست bind می‌کند
    - `/unfocus` binding رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت binding را نشان می‌دهد
    - `/session idle <duration|off>` عدم تمرکز خودکار به‌دلیل بی‌فعالیتی را برای bindingهای متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر سن سخت‌گیرانه را برای bindingهای متمرکز بررسی/به‌روزرسانی می‌کند

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
    - `spawnSessions` ساخت/اتصال خودکار رشته‌ها را برای `sessions_spawn({ thread: true })` و spawnهای رشته ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه بومی زیرعامل را برای spawnهای مقید به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` با `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر bindingهای رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با binding رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="Bindingهای پایدار کانال ACP">
    برای فضاهای کاری ACP پایدار و «همیشه روشن»، bindingهای ACP نوع‌دار سطح بالا را که مکالمات Discord را هدف می‌گیرند پیکربندی کنید.

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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان‌جا bind می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته binding کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته bind شده، `/new` و `/reset` همان نشست ACP را در همان‌جا بازنشانی می‌کنند. bindingهای موقت رشته می‌توانند هنگام فعال بودن، resolve کردن هدف را بازنویسی کنند.
    - `spawnSessions` ساخت/binding رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار binding، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر انجمن:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستم تبدیل و به نشست Discord مسیریابی‌شده متصل می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw، یک ایموجی تأیید دریافت ارسال می‌کند.

    ترتیب resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های پیکربندی">
    نوشتن‌های پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال هستند.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی ویژگی‌های فرمان فعال باشند).

    غیرفعال‌سازی:

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
    ترافیک WebSocket مربوط به Gateway در Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + resolve کردن فهرست مجاز) را با `channels.discord.proxy` از طریق یک پراکسی HTTP(S) مسیریابی کنید.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    بازنویسی برای هر حساب:

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
    برای نگاشت پیام‌های proxied به هویت عضو سیستم، resolve کردن PluralKit را فعال کنید:

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
    - نام‌های نمایشی عضو فقط زمانی با نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true`
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به پنجره زمانی محدود هستند
    - اگر جست‌وجو شکست بخورد، پیام‌های proxied به‌عنوان پیام ربات در نظر گرفته می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار mention خروجی">
    وقتی عامل‌ها برای کاربران شناخته‌شده Discord به mentionهای خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handleهایی بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و mentionهای داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

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
    به‌روزرسانی‌های حضور زمانی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت تنظیم کنید، یا وقتی حضور خودکار را فعال کنید.

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

    نمونه فعالیت (وضعیت سفارشی نوع پیش‌فرض فعالیت است):

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
    - 4: سفارشی (از متن فعالیت به‌عنوان وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
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
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    حضور خودکار دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، تنزل‌یافته یا ناشناخته => بی‌کار، تمام‌شده یا در دسترس نبودن => مزاحم نشوید. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از placeholder `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از پردازش تأیید مبتنی بر دکمه در پیام‌های مستقیم پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptهای تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل تشخیص باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، Discord تأییدهای بومی exec را به‌صورت خودکار فعال می‌کند. Discord تأییدکننده‌های exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک، مانند `/diagnostics` و `/export-trajectory`، OpenClaw اعلان‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده یک مسیر مالک Discord داشته باشد، ابتدا DM در Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، بازمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، اعلان تأیید در کانال دیده می‌شود. فقط تأییدکننده‌های تشخیص‌داده‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. اعلان‌های تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال نتواند از کلید نشست استخراج شود، OpenClaw به تحویل DM بازمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند نمایش می‌دهد. آداپتر بومی Discord عمدتاً مسیریابی DM تأییدکننده و پخش در کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود دارند، تجربه کاربری اصلی تأیید همان‌ها هستند؛ OpenClaw
    باید فرمان دستی `/approve` را فقط زمانی اضافه کند که نتیجه ابزار بگوید
    تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان‌اجرای تأیید بومی Discord فعال نباشد، OpenClaw اعلان
    محلی و قطعی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان‌اجرا فعال باشد اما کارت بومی نتواند به هیچ مقصدی تحویل داده شود،
    OpenClaw یک اعلان جایگزین در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و گیت‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور و اقدام‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- نظارت: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

گیت‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض گیت:

| گروه اقدام                                                                                                                                                              | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions، messages، threads، pins، polls، search، memberInfo، roleInfo، channelInfo، channels، voiceStatus، events، stickers، emojiUploads، stickerUploads، permissions | فعال     |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## رابط کاربری کامپوننت‌های v2

OpenClaw برای تأییدهای exec و نشانگرهای میان‌بافتی از کامپوننت‌های v2 Discord استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی استفاده‌شده توسط کانتینرهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی کامپوننت‌های v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.

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

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موج). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

چک‌لیست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی allowlistهای نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. مجوزهای Connect، Speak، Send Messages، و Read Message History را در کانال صوتی هدف اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قواعد allowlist و سیاست گروهی فرمان‌های دیگر Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

نمونه اتصال خودکار:

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

نکات:

- `voice.tts` فقط برای پخش صوتی، `messages.tts` را بازنویسی می‌کند.
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند. آن را تنظیم‌نشده بگذارید تا مدل عامل مسیریابی‌شده را به ارث ببرد.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر نمی‌گذارد.
- بازنویسی‌های `systemPrompt` هر کانال Discord روی نوبت‌های رونوشت صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونوشت صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) به‌دست می‌آورند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال کردن فرمان‌های `/vc`، زمان‌اجرای صدا، و intent مربوط به Gateway با نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحاً بازنویسی کند. آن را تنظیم‌نشده بگذارید تا intent از فعال‌سازی مؤثر صدا پیروی کند.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های اتصال `@discordjs/voice` منتقل می‌شوند.
- پیش‌فرض‌های `@discordjs/voice` در صورت تنظیم‌نشدن، `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و اتصال خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw چه مدت منتظر می‌ماند تا یک نشست صوتی قطع‌شده پیش از نابود شدن، شروع به اتصال مجدد کند. پیش‌فرض: `15000`.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را زیر نظر می‌گیرد و پس از خطاهای تکراری در یک بازه کوتاه، با ترک و پیوستن دوباره به کانال صوتی به‌صورت خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت بارها `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان دادند، گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل رفع upstream مربوط به padding از PR شماره #11449 در discord.js است که issue شماره #11419 در discord.js را بست.

خط لوله کانال صوتی:

- ضبط PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` پردازش STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از طریق ورود و مسیریابی Discord ارسال می‌شود، در حالی که LLM پاسخ با یک سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن برگشتی می‌خواهد، چون صدای Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صدای حاصل در کانال پیوسته پخش می‌شود.

اعتبارنامه‌ها برای هر کامپوننت جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش موج نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw موج را به‌صورت خودکار تولید می‌کند، اما برای بررسی و تبدیل به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در یک payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، Gateway را راه‌اندازی مجدد کنید

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` را بررسی کنید
    - allowlist guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` برای guild وجود دارد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون allowlist منطبق guild/channel
    - `requireMention` در جای نادرست پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist مربوط به `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    پیچ‌های تنظیم صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Gateway مربوط به Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord مهلت زمانی مالک کانال را روی نوبت‌های عامل صف‌شده اعمال نمی‌کند. Listenerهای پیام بلافاصله واگذار می‌کنند، و اجراهای صف‌شده Discord ترتیب هر نشست را تا کامل شدن چرخه عمر نشست/ابزار/زمان‌اجرا یا لغو کار حفظ می‌کنند.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` در Discord را دریافت می‌کند. خطاهای گذرا به URL پیش‌فرض Gateway در Discord بازمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    پیچ‌های تنظیم مهلت زمانی فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - جایگزین env وقتی پیکربندی تنظیم نشده است: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، بیشینه: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های مجدد پس از پایان مهلت READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد در زمان اجرا، منتظر رویداد `READY` در Gateway مربوط به Discord می‌ماند. پیکربندی‌های چندحسابی با فاصله‌گذاری هنگام راه‌اندازی ممکن است به بازه READY طولانی‌تری در زمان راه‌اندازی نسبت به مقدار پیش‌فرض نیاز داشته باشند.

    تنظیمات پایان مهلت READY:

    - تک‌حسابی هنگام راه‌اندازی: `channels.discord.gatewayReadyTimeoutMs`
    - چندحسابی هنگام راه‌اندازی: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - جایگزین env هنگام راه‌اندازی وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض هنگام راه‌اندازی: `15000` (15 ثانیه)، حداکثر: `120000`
    - تک‌حسابی در زمان اجرا: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - چندحسابی در زمان اجرا: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - جایگزین env در زمان اجرا وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض در زمان اجرا: `30000` (30 ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناسازگاری‌های حسابرسی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق در زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - خط‌مشی DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در انتظار تأیید جفت‌سازی در حالت `pairing`

  </Accordion>

  <Accordion title="حلقه‌های bot به bot">
    به‌طور پیش‌فرض پیام‌هایی که توسط bot نوشته شده‌اند نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه mention و allowlist استفاده کنید.
    بهتر است از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های bot که به bot اشاره می‌کنند پذیرفته شوند.

  </Accordion>

  <Accordion title="افت‌های STT صوتی با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صوتی Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - گزارش‌ها را برای موارد زیر بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر پس از پیوستن مجدد خودکار خطاها ادامه داشتند، گزارش‌ها را جمع‌آوری کنید و با تاریخچه دریافت upstream DAVE در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای مهم Discord">

- راه‌اندازی/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- خط‌مشی: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (نام مستعار قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (آپلودهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`), `retry`
- اقدامات: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`, سطح بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های bot را به‌عنوان اسرار در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح داده می‌شود).
- مجوزهای Discord را با کمترین سطح دسترسی لازم اعطا کنید.
- اگر وضعیت/استقرار فرمان قدیمی است، Gateway را دوباره راه‌اندازی کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار گفت‌وگوی گروهی و allowlist.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="فرمان‌های Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
