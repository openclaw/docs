---
read_when:
    - در حال کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی بات Discord
title: Discord
x-i18n:
    generated_at: "2026-04-29T22:24:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d374742a097682f33529f93709978f21b63a94cd4da803ff78ff8dfcb1f9b81
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های سرور از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌صورت پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار بومی دستور و کاتالوگ دستورها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامهٔ جدید همراه با یک ربات بسازید، ربات را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. پیشنهاد می‌کنیم ربات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینهٔ **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="Create a Discord application and bot">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را به هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="Enable privileged intents">
    همچنان در صفحهٔ **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (پیشنهادی؛ برای فهرست‌های مجاز نقش و تطبیق نام با ID لازم است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="Copy your bot token">
    در صفحهٔ **Bot** دوباره به بالا بروید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار اولین توکن شما را تولید می‌کند؛ هیچ‌چیز در حال «بازنشانی» نیست.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **توکن ربات** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای مناسب برای افزودن ربات به سرور خود تولید خواهید کرد.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخشی با عنوان **Bot Permissions** در پایین ظاهر می‌شود. حداقل این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهدهٔ کانال‌ها
    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچهٔ پیام‌ها
      - درج لینک‌ها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعهٔ پایه برای کانال‌های متنی عادی است. اگر قصد دارید در رشته‌های Discord پست بفرستید، از جمله جریان‌های کاری کانال انجمن یا رسانه که یک رشته می‌سازند یا ادامه می‌دهند، **Send Messages in Threads** را هم فعال کنید.
    URL تولیدشده در پایین را کپی کنید، در مرورگر خود جای‌گذاری کنید، سرور خود را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید ربات خود را در سرور Discord ببینید.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    در برنامهٔ Discord، باید Developer Mode را فعال کنید تا بتوانید IDهای داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتار شما) کلیک کنید ← **Advanced** ← **Developer Mode** را فعال کنید
    2. روی **آیکون سرور** خود در نوار کناری راست‌کلیک کنید ← **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید ← **Copy User ID**

    **Server ID** و **User ID** خود را کنار توکن ربات ذخیره کنید؛ در گام بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="Allow DMs from server members">
    برای اینکه جفت‌سازی کار کند، Discord باید اجازه دهد رباتتان به شما پیام مستقیم بدهد. روی **آیکون سرور** خود راست‌کلیک کنید ← **Privacy Settings** ← **Direct Messages** را فعال کنید.

    این کار اجازه می‌دهد اعضای سرور (از جمله ربات‌ها) برای شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد استفاده از کانال‌های سرور را دارید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    توکن ربات Discord شما یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی دستگاهی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان یک سرویس پس‌زمینه اجرا می‌شود، آن را از طریق برنامهٔ Mac OpenClaw یا با متوقف کردن و راه‌اندازی دوبارهٔ فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از شلی اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند پس از بازراه‌اندازی SecretRef محیط را resolve کند.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        در هر کانال موجود (مثلاً Telegram) با عامل OpenClaw خود چت کنید و به آن بگویید. اگر Discord اولین کانال شماست، به‌جای آن از تب CLI / پیکربندی استفاده کنید.

        > «من از قبل توکن ربات Discord خود را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` تمام کن.»
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

        fallback محیط برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقادیر `token` به‌صورت متن ساده پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت Secrets](/fa/gateway/secrets) را ببینید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approve first DM pairing">
    صبر کنید تا Gateway اجرا شود، سپس در Discord به ربات خود پیام مستقیم بدهید. با یک کد جفت‌سازی پاسخ می‌دهد.

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

    اکنون باید بتوانید در Discord از طریق پیام مستقیم با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
حل‌وفصل توکن نسبت به حساب آگاه است. مقادیر توکن پیکربندی بر fallback محیط اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن ربات یکسان resolve شوند، OpenClaw فقط یک پایشگر Gateway برای آن توکن راه‌اندازی می‌کند. توکنی که از پیکربندی آمده باشد بر fallback محیط پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/کنش‌های کانال)، یک `token` صریح برای همان فراخوانی استفاده می‌شود. این موضوع برای کنش‌های ارسال و خواندن/پروب کاربرد دارد (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش دوباره همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آیند.
</Note>

## پیشنهادی: راه‌اندازی یک فضای کاری سرور

پس از اینکه پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل خودش را با زمینهٔ خودش دریافت می‌کند. این کار برای سرورهای خصوصی که فقط شما و رباتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="Add your server to the guild allowlist">
    این کار به عامل شما اجازه می‌دهد در هر کانال روی سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="Ask your agent">
        > «Discord Server ID من، `<server_id>`، را به فهرست مجاز سرور اضافه کن»
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
    به‌صورت پیش‌فرض، عامل شما در کانال‌های سرور فقط وقتی @mention شود پاسخ می‌دهد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های سرور، پاسخ‌های نهایی معمول دستیار به‌صورت پیش‌فرض خصوصی می‌مانند. خروجی قابل‌مشاهدهٔ Discord باید صریحاً با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌صورت پیش‌فرض در پس‌زمینه بماند و فقط وقتی تشخیص داد پاسخ کانالی مفید است پست کند.

    <Tabs>
      <Tab title="Ask your agent">
        > «اجازه بده عاملم در این سرور بدون اینکه لازم باشد @mention شود پاسخ دهد»
      </Tab>
      <Tab title="Config">
        در پیکربندی سرور خود `requireMention: false` را تنظیم کنید:

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
    به‌صورت پیش‌فرض، حافظهٔ بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های سرور MEMORY.md را به‌صورت خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="Ask your agent">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به زمینهٔ بلندمدت از MEMORY.md نیاز داری از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="Manual">
        اگر در هر کانال به زمینهٔ مشترک نیاز دارید، دستورهای پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (آن‌ها برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال روی سرور Discord خود بسازید و شروع به چت کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست ایزولهٔ خودش را دریافت می‌کند؛ بنابراین می‌توانید `#coding`، `#home`، `#research`، یا هر چیزی که با جریان کاری شما سازگار است تنظیم کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ سرور/کانال Discord به‌عنوان زمینهٔ غیرقابل‌اعتماد به prompt مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن بسته را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌صورت پیش‌فرض (`session.dmScope=main`)، چت‌های مستقیم نشست اصلی عامل را مشترک استفاده می‌کنند (`agent:main:main`).
- کانال‌های سرور کلیدهای نشست ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌صورت پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- دستورهای اسلش بومی در نشست‌های دستور ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به نشست مکالمهٔ مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان Cron/Heartbeat فقط متنی به Discord یک بار از پاسخ نهایی قابل‌مشاهده برای دستیار استفاده می‌کند. محموله‌های رسانه‌ای و مؤلفهٔ ساختاریافته وقتی عامل چند محمولهٔ قابل‌تحویل emit می‌کند همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته‌ای را می‌پذیرند. OpenClaw از دو روش برای ساخت آن‌ها پشتیبانی می‌کند:

- یک پیام به والد انجمن (`channel:<forumId>`) بفرستید تا یک رشته به‌صورت خودکار ساخته شود. عنوان رشته از اولین خط غیرخالی پیام شما استفاده می‌کند.
- برای ساخت مستقیم یک رشته از `openclaw message thread create` استفاده کنید. برای کانال‌های انجمن `--message-id` را پاس ندهید.

نمونه: ارسال به والد انجمن برای ساخت یک رشته

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

نمونه: ساخت صریح یک رشتهٔ انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته (`channel:<threadId>`) ارسال کنید.

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای Discord components v2 برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با یک بارِ `components` استفاده کنید. نتایج تعامل به‌صورت پیام‌های ورودی عادی دوباره به عامل هدایت می‌شوند و از تنظیمات موجود Discord `replyToMode` پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های کنش حداکثر ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌کنند
- انواع انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضا چندین بار قابل استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی یک دکمه کلیک کند، روی آن دکمه `allowedUsers` را تنظیم کنید (شناسه‌های کاربر Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شود، کاربران نامطابق یک رد موقتی دریافت می‌کنند.

فرمان‌های اسلش `/model` و `/models` یک انتخاب‌گر تعاملی مدل با فهرست‌های کشویی ارائه‌دهنده، مدل، و runtime سازگار به‌همراه یک مرحله Submit باز می‌کنند. `/models add` منسوخ شده است و اکنون به‌جای ثبت مدل‌ها از چت، یک پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخاب‌گر موقتی است و فقط کاربری که آن را فراخوانی کرده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (فایل تکی)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست منطبق باشد، برای بازنویسی آن از `filename` استفاده کنید

فرم‌های Modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- انواع فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw به‌طور خودکار یک دکمه محرک اضافه می‌کند

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
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز متعارف DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    اولویت‌بندی چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب مقصد DM برای تحویل:

    - `user:<id>`
    - اشاره `<@id>`

    شناسه‌های عددی بدون پیشوند معمولاً وقتی یک پیش‌فرض کانال فعال باشد به‌عنوان شناسه کانال حل می‌شوند، اما شناسه‌های فهرست‌شده در DM مؤثر حساب `allowFrom` برای سازگاری به‌عنوان مقصدهای DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت guild توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط مبنای امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - guild باید با `channels.discord.guilds` منطبق باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` منطبق شوند مجاز هستند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها ایمن‌تر هستند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر یک guild دارای `channels` پیکربندی‌شده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک guild بلوک `channels` نداشته باشد، همه کانال‌ها در آن guild مجازشده مجاز هستند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` ایجاد نکنید، fallback زمان اجرا `groupPolicy="allowlist"` خواهد بود (با هشداری در گزارش‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های guild به‌طور پیش‌فرض با اشاره کنترل می‌شوند.

    تشخیص اشاره شامل موارد زیر است:

    - اشاره صریح به ربات
    - الگوهای اشاره پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به ربات در موارد پشتیبانی‌شده

    `requireMention` برای هر guild/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقش دیگری اشاره می‌کنند اما به ربات اشاره نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی عامل بر پایه نقش

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به عامل‌های مختلف بر اساس شناسه نقش استفاده کنید. bindingهای مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از bindingهای همتا یا والد-همتا و پیش از bindingهای فقط guild ارزیابی می‌شوند. اگر یک binding فیلدهای تطبیق دیگری را هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همه فیلدهای پیکربندی‌شده باید منطبق باشند.

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

## فرمان‌های بومی و احراز مجوز فرمان

- `commands.native` به‌طور پیش‌فرض `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` فرمان‌های بومی Discord را که قبلاً ثبت شده‌اند به‌صراحت پاک می‌کند.
- احراز مجوز فرمان بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که مدیریت پیام عادی استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز مجوز OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای فهرست فرمان‌ها و رفتار آن‌ها، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض فرمان اسلش:

- `ephemeral: true`

## جزئیات قابلیت

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord از برچسب‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    توسط `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه مرجع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای نوبت پیوست می‌کند.
    `batched` فقط زمانی مرجع پاسخ بومی ضمنی Discord را پیوست می‌کند که
    نوبت ورودی یک دسته debounce‌شده از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتاً برای چت‌های مبهم و پشت‌سرهم می‌خواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایان می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های پیش‌نویس را stream کند. `channels.discord.streaming` مقدارهای `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌پذیرد. `progress` در Discord به `partial` نگاشت می‌شود؛ `streamMode` یک alias قدیمی است و به‌صورت خودکار مهاجرت می‌شود.

    پیش‌فرض `off` باقی می‌ماند، زیرا ویرایش‌های پیش‌نمایش Discord وقتی چند ربات یا Gateway یک حساب را به اشتراک می‌گذارند به‌سرعت به محدودیت نرخ می‌خورند.

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

    - `partial` با رسیدن توکن‌ها یک پیام پیش‌نمایش تکی را ویرایش می‌کند.
    - `block` قطعه‌هایی به‌اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست، از `draftChunk` استفاده کنید؛ به `textChunkLimit` محدود می‌شود).
    - رسانه، خطا، و نهایی‌های پاسخ صریح ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.

    stream پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی fallback می‌کنند. وقتی stream نوع `block` به‌صراحت فعال شود، OpenClaw برای جلوگیری از دوبار stream کردن، stream پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    زمینه تاریخچه guild:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار thread:

    - threadهای Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند مگر اینکه بازنویسی شده باشند.
    - نشست‌های thread انتخاب `/model` سطح نشست کانال والد را به‌عنوان fallback فقط مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی thread همچنان اولویت دارند و تاریخچه transcript والد کپی نمی‌شود مگر اینکه ارث‌بری transcript فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) threadهای خودکار جدید را برای seed شدن از transcript والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند مقصدهای DM نوع `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام fallback فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز کنترل می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه اینکه یک مرز کامل حذف زمینه مکمل باشند.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord می‌تواند یک thread را به یک مقصد نشست bind کند تا پیام‌های بعدی در آن thread همچنان به همان نشست مسیریابی شوند (از جمله نشست‌های subagent).

    فرمان‌ها:

    - `/focus <target>` thread فعلی/جدید را به یک مقصد subagent/نشست bind می‌کند
    - `/unfocus` binding thread فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت binding را نشان می‌دهد
    - `/session idle <duration|off>` auto-unfocus غیرفعالی را برای bindingهای متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر سن سخت را برای bindingهای متمرکز بررسی/به‌روزرسانی می‌کند

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    یادداشت‌ها:

    - `session.threadBindings.*` پیش‌فرض‌های سراسری را تنظیم می‌کند.
    - `channels.discord.threadBindings.*` رفتار Discord را بازنویسی می‌کند.
    - `spawnSubagentSessions` باید true باشد تا رشته‌ها برای `sessions_spawn({ thread: true })` به‌طور خودکار ایجاد/متصل شوند.
    - `spawnAcpSessions` باید true باشد تا رشته‌ها برای ACP (`/acp spawn ... --thread ...` یا `sessions_spawn({ runtime: "acp", thread: true })`) به‌طور خودکار ایجاد/متصل شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط اتصال رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    برای فضاهای کاری ACP پایدار و «همیشه روشن»، اتصال‌های ACP تایپ‌شده سطح بالا را که مکالمات Discord را هدف می‌گیرند پیکربندی کنید.

    مسیر پیکربندی:

    - `bindings[]` با `type: "acp"` و `match.channel: "discord"`

    مثال:

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

    یادداشت‌ها:

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان‌جا متصل می‌کند و پیام‌های آینده را در همان نشست ACP نگه می‌دارد. پیام‌های رشته اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را در همان‌جا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند تا زمانی که فعال هستند، حل هدف را بازنویسی کنند.
    - `spawnAcpSessions` فقط زمانی لازم است که OpenClaw نیاز داشته باشد یک رشته فرزند را از طریق `--thread auto|here` ایجاد/متصل کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="Reaction notifications">
    حالت اعلان واکنش برای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده پیوست می‌شوند.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` زمانی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید دریافت ارسال می‌کند.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    یادداشت‌ها:

    - Discord ایموجی یونیکد یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="Config writes">
    نوشتن پیکربندیِ آغازشده از کانال به‌طور پیش‌فرض فعال است.

    این بر جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های فرمان فعال باشند).

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

  <Accordion title="Gateway proxy">
    ترافیک WebSocket مربوط به Discord Gateway و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل allowlist) را با `channels.discord.proxy` از طریق یک پروکسی HTTP(S) مسیریابی کنید.

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

  <Accordion title="PluralKit support">
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

    یادداشت‌ها:

    - allowlistها می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی اعضا فقط زمانی بر اساس نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به پنجره زمانی محدود هستند
    - اگر جست‌وجو شکست بخورد، پیام‌های proxied به‌عنوان پیام‌های بات در نظر گرفته می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="Presence configuration">
    به‌روزرسانی‌های حضور زمانی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت را تنظیم کنید، یا وقتی حضور خودکار را فعال کنید.

    مثال فقط وضعیت:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    مثال فعالیت (وضعیت سفارشی نوع فعالیت پیش‌فرض است):

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

    مثال پخش زنده:

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
    - 1: در حال پخش زنده (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان وضعیت state استفاده می‌کند؛ ایموجی اختیاری است)
    - 5: در حال رقابت

    مثال حضور خودکار (سیگنال سلامت زمان اجرا):

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

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، تنزل‌یافته یا ناشناخته => idle، تمام‌شده یا دردسترس‌نبودن => dnd. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در DMها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptهای تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    Discord زمانی تأییدهای native exec را به‌طور خودکار فعال می‌کند که `enabled` تنظیم نشده یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل حل باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`. Discord تأییدکننده‌های exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان یک کلاینت تأیید native، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw promptهای تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده یک مسیر مالک Discord داشته باشد، ابتدا Discord DM را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، prompt تأیید در کانال قابل مشاهده است. فقط تأییدکننده‌های حل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. promptهای تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل DM برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که کانال‌های چت دیگر استفاده می‌کنند رندر می‌کند. آداپتور native Discord عمدتاً مسیریابی DM تأییدکننده و fanout کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود دارند، UX اصلی تأیید همان‌ها هستند؛ OpenClaw
    فقط زمانی باید یک فرمان دستی `/approve` را شامل کند که نتیجه ابزار بگوید
    تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید native در Discord فعال نباشد، OpenClaw
    prompt قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما یک کارت native نتواند به هیچ هدفی تحویل داده شود،
    OpenClaw یک اعلان جایگزین در همان چت با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد کلاینت مشترک Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و گیت‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، تعدیل، حضور، و اقدام‌های فراداده هستند.

مثال‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- تعدیل: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

گیت‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض گیت:

| گروه اقدام                                                                                                                                                              | پیش‌فرض    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال       |
| roles                                                                                                                                                                    | غیرفعال    |
| moderation                                                                                                                                                               | غیرفعال    |
| presence                                                                                                                                                                 | غیرفعال    |

## رابط کاربری Components v2

OpenClaw از components v2 در Discord برای تأییدهای exec و نشانگرهای میان‌بافتی استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند `components` را برای رابط کاربری سفارشی بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ accent استفاده‌شده توسط کانتینرهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی components v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.

مثال:

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

Discord دو سطح صدای متمایز دارد: **کانال‌های صوتی** بلادرنگ (مکالمات پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موج‌نما). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست بررسی راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی از فهرست‌های مجاز نقش/کاربر استفاده می‌شود، Server Members Intent را فعال کنید.
3. بات را با دامنه‌های `bot` و `applications.commands` دعوت کنید.
4. مجوزهای Connect، Speak، Send Messages و Read Message History را در کانال صوتی مقصد اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قوانین فهرست مجاز و سیاست گروهی سایر فرمان‌های Discord را دنبال می‌کند.

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
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند. برای به ارث بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر ندارد.
- نوبت‌های رونوشت صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) به دست می‌آورند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدا به‌صورت پیش‌فرض فعال است؛ برای غیرفعال کردن زمان اجرای صوتی و intent مربوط به `GuildVoiceStates` در Gateway، مقدار `channels.discord.voice.enabled=false` را تنظیم کنید.
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را به‌صراحت بازنویسی کند. برای اینکه intent از `voice.enabled` پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های پیوستن `@discordjs/voice` منتقل می‌شوند.
- پیش‌فرض‌های `@discordjs/voice` در صورت تنظیم‌نشدن، `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از خطاهای تکراری در یک بازه کوتاه، با ترک و پیوستن دوباره به کانال صوتی، بازیابی خودکار انجام می‌دهد.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت مکررا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR شماره #11449 در discord.js است که issue شماره #11419 در discord.js را بست.

خط لوله کانال صوتی:

- ضبط PCM در Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` پردازش STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از مسیر ورودی و مسیریابی عادی Discord ارسال می‌شود.
- وقتی `voice.model` تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صوت حاصل در کانال پیوسته‌شده پخش می‌شود.

اعتبارنامه‌ها برای هر مؤلفه جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش شکل موج نشان می‌دهند و به صوت OGG/Opus نیاز دارند. OpenClaw شکل موج را خودکار تولید می‌کند، اما برای بازرسی و تبدیل، روی میزبان Gateway به `ffmpeg` و `ffprobe` نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در یک payload مشترک رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا بات هیچ پیام guild را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را دوباره راه‌اندازی کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - فهرست مجاز guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` برای guild وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="require mention برابر false است اما همچنان مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون فهرست مجاز guild/channel مطابق
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط فهرست مجاز `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    پیچ‌های تنظیم صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Gateway مربوط به Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord یک timeout متعلق به کانال را روی نوبت‌های عامل صف‌شده اعمال نمی‌کند. listenerهای پیام بلافاصله واگذار می‌کنند، و اجراهای صف‌شده Discord ترتیب هر نشست را تا تکمیل چرخه عمر نشست/ابزار/زمان اجرا یا لغو کار حفظ می‌کنند.

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

  <Accordion title="هشدارهای timeout در جست‌وجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` در Discord را دریافت می‌کند. خرابی‌های گذرا به URL پیش‌فرض Gateway در Discord بازمی‌گردند و در لاگ‌ها محدودسازی نرخ می‌شوند.

    پیچ‌های تنظیم timeout فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، بیشینه: `120000`

  </Accordion>

  <Accordion title="عدم‌تطابق‌های ممیزی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده کنید، تطبیق زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` در انتظار تأیید جفت‌سازی است

  </Accordion>

  <Accordion title="حلقه‌های بات به بات">
    به‌صورت پیش‌فرض، پیام‌های نوشته‌شده توسط بات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه mention و فهرست مجاز استفاده کنید.
    ترجیحا از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که بات را mention می‌کنند.

  </Accordion>

  <Accordion title="افت STT صوتی با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صوتی Discord حاضر باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` باشد (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض بالادستی) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - لاگ‌ها را برای موارد زیر پایش کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خطاها پس از پیوستن دوباره خودکار ادامه داشتند، لاگ‌ها را جمع‌آوری کنید و با سابقه دریافت DAVE بالادستی در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای پرارزش Discord">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- فراداده Gateway: `gatewayInfoTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (نام مستعار قدیمی: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (آپلودهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- کنش‌ها: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`، `bindings[]` سطح بالا (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های بات را به‌عنوان راز در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح داده می‌شود).
- کمترین مجوزهای لازم Discord را اعطا کنید.
- اگر وضعیت/استقرار فرمان کهنه است، gateway را دوباره راه‌اندازی کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار گفت‌وگوی گروهی و فهرست مجاز.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="فرمان‌های اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
