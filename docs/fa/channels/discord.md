---
read_when:
    - کار روی ویژگی‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها، و پیکربندی بات Discord
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های خصوصی و کانال‌های سرور از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های خصوصی Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و کاتالوگ دستورها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید با یک بات بسازید، بات را به سرور خود اضافه کنید و آن را با OpenClaw جفت کنید. توصیه می‌کنیم بات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="Create a Discord application and bot">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مانند «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را روی هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="Enable privileged intents">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** پیمایش کنید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست مجاز نقش‌ها و تطبیق نام با شناسه الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="Copy your bot token">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار اولین توکن شما را تولید می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و کمی بعد به آن نیاز دارید.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    در نوار کناری روی **OAuth2** کلیک کنید. یک نشانی دعوت با مجوزهای درست برای اضافه کردن بات به سرورتان تولید خواهید کرد.

    به پایین تا **OAuth2 URL Generator** پیمایش کنید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخشی با عنوان **Bot Permissions** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها
    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی پیوندها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله جریان‌های کاری کانال انجمن یا رسانه که یک رشته ایجاد می‌کنند یا ادامه می‌دهند، **Send Messages in Threads** را نیز فعال کنید.
    نشانی تولیدشده در پایین را کپی کنید، آن را در مرورگر خود بچسبانید، سرور خود را انتخاب کنید و برای اتصال روی **Continue** کلیک کنید. اکنون باید بات خود را در سرور Discord ببینید.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (نماد چرخ‌دنده کنار آواتار شما) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. در نوار کناری روی **نماد سرور** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="Allow DMs from server members">
    برای کار کردن جفت‌سازی، Discord باید به بات شما اجازه دهد به شما پیام خصوصی بفرستد. روی **نماد سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار اجازه می‌دهد اعضای سرور (از جمله بات‌ها) برای شما پیام خصوصی بفرستند. اگر می‌خواهید از پیام‌های خصوصی Discord با OpenClaw استفاده کنید، این گزینه را روشن نگه دارید. اگر فقط قصد دارید از کانال‌های سرور استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های خصوصی را غیرفعال کنید.

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

    اگر OpenClaw از قبل به‌عنوان یک سرویس پس‌زمینه اجرا می‌شود، آن را از طریق برنامه OpenClaw Mac یا با متوقف کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از شلی اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند پس از بازراه‌اندازی SecretRef محیطی را resolve کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام شروع Discord مسدود شده یا با محدودیت نرخ روبه‌رو شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا شروع بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند بات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        در هر کانال موجود (مثلاً Telegram) با عامل OpenClaw خود گفت‌وگو کنید و به او بگویید. اگر Discord اولین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > «من از قبل توکن بات Discord خود را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
      </Tab>
      <Tab title="CLI / config">
        اگر پیکربندی مبتنی بر فایل را ترجیح می‌دهید، تنظیم کنید:

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

        پشتیبان محیطی برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقدارهای متن ساده `token` پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند بات Discord، توکن و شناسه برنامه هر بات را زیر حساب خودش نگه دارید. یک `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، پس فقط وقتی آن را آنجا تنظیم کنید که همه حساب‌ها باید از همان شناسه برنامه استفاده کنند.

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
    صبر کنید تا gateway اجرا شود، سپس در Discord به بات خود پیام خصوصی بدهید. بات با یک کد جفت‌سازی پاسخ می‌دهد.

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

    اکنون باید بتوانید از طریق پیام خصوصی در Discord با عامل خود گفت‌وگو کنید.

  </Step>
</Steps>

<Note>
resolve کردن توکن نسبت به حساب آگاه است. مقدارهای توکن در پیکربندی بر پشتیبان محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب Discord فعال به یک توکن بات resolve شوند، OpenClaw فقط یک پایشگر gateway برای آن توکن شروع می‌کند. توکنی که از پیکربندی آمده باشد بر پشتیبان محیطی پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری به‌صورت غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/کنش‌های کانال)، یک `token` صریحِ مخصوص همان فراخوانی برای آن فراخوانی استفاده می‌شود. این موضوع برای کنش‌های ارسال و خواندن/کاوش اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش دوباره همچنان از حساب انتخاب‌شده در snapshot فعال runtime می‌آیند.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری سرور

پس از کار کردن پیام‌های خصوصی، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال session عامل خودش را با context خودش دریافت می‌کند. این کار برای سرورهای خصوصی که فقط شما و باتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="Add your server to the guild allowlist">
    این کار به عامل شما اجازه می‌دهد در هر کانال سرورتان پاسخ دهد، نه فقط در پیام‌های خصوصی.

    <Tabs>
      <Tab title="Ask your agent">
        > «Discord Server ID `<server_id>` من را به فهرست مجاز سرور اضافه کن»
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
    به‌طور پیش‌فرض، عامل شما در کانال‌های سرور فقط وقتی پاسخ می‌دهد که با @mention خطاب شود. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های سرور، پاسخ‌های عادی به‌طور پیش‌فرض خودکار پست می‌شوند. برای اتاق‌های مشترک همیشه‌روشن، `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید تا عامل بتواند در پس‌زمینه بماند و فقط وقتی تشخیص می‌دهد پاسخ کانالی مفید است پست کند. این با مدل‌های نسل جدید و قابل‌اعتماد برای ابزار، مانند GPT 5.5، بهترین نتیجه را می‌دهد. رویدادهای محیطی اتاق ساکت می‌مانند مگر اینکه ابزار ارسال کند. برای پیکربندی کامل حالت حضور خاموش، [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) را ببینید.

    اگر Discord حالت تایپ را نشان می‌دهد و لاگ‌ها مصرف توکن را نشان می‌دهند اما پیامی پست نمی‌شود، بررسی کنید که آیا turn به‌عنوان رویداد محیطی اتاق پیکربندی شده یا در پاسخ‌های قابل‌مشاهده message-tool فعال شده است.

    <Tabs>
      <Tab title="Ask your agent">
        > «به عامل من اجازه بده بدون اینکه لازم باشد @mention شود، روی این سرور پاسخ دهد»
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

        برای الزام ارسال‌های message-tool برای پاسخ‌های قابل‌مشاهده گروه/کانال، `messages.groupChat.visibleReplies: "message_tool"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در sessionهای پیام خصوصی بارگذاری می‌شود. کانال‌های سرور MEMORY.md را خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="Ask your agent">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به context بلندمدت از MEMORY.md نیاز داری از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="Manual">
        اگر در هر کانال به context مشترک نیاز دارید، دستورهای پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (آن‌ها برای هر session تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و هنگام نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود بسازید و گفت‌وگو را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال session جداافتاده خودش را دریافت می‌کند — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی که با جریان کاری شما سازگار است راه‌اندازی کنید.

## مدل runtime

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ گیلد/کانال Discord به‌عنوان زمینهٔ غیرقابل‌اعتماد به پرامپت مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن پاکت را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل را به‌اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های گیلد کلیدهای نشست جداگانه دارند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در نشست‌های فرمان جداگانه اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان Cron/Heartbeat فقط‌متنی به Discord، پاسخ نهایی قابل‌مشاهده برای دستیار را یک‌بار استفاده می‌کند. بارهای رسانه‌ای و کامپوننت‌های ساختاریافته وقتی عامل چندین بار قابل‌تحویل منتشر می‌کند، همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های ترد را می‌پذیرند. OpenClaw دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی را به والد انجمن بفرستید (`channel:<forumId>`) تا یک ترد به‌صورت خودکار ایجاد شود. عنوان ترد از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم یک ترد استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

مثال: ارسال به والد انجمن برای ایجاد یک ترد

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ایجاد صریح یک ترد انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن کامپوننت‌های Discord را نمی‌پذیرند. اگر به کامپوننت‌ها نیاز دارید، به خود ترد بفرستید (`channel:<threadId>`).

## کامپوننت‌های تعاملی

OpenClaw از کانتینرهای کامپوننت Discord نسخهٔ ۲ برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با بار `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب واحد را مجاز می‌کنند
- نوع‌های انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

به‌طور پیش‌فرض، کامپوننت‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضا چندین بار استفاده شوند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی یک دکمه کلیک کند، `allowedUsers` را روی همان دکمه تنظیم کنید (شناسه‌های کاربر Discord، تگ‌ها، یا `*`). وقتی پیکربندی شود، کاربران نامطابق یک رد موقت دریافت می‌کنند.

بازخوانی‌های کامپوننت به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند. برای تغییر عمر رجیستری بازخوانی برای حساب پیش‌فرض Discord، `channels.discord.agentComponents.ttlMs` را تنظیم کنید، یا برای بازنویسی یک حساب در راه‌اندازی چندحسابی، `channels.discord.accounts.<accountId>.agentComponents.ttlMs` را تنظیم کنید. مقدار برحسب میلی‌ثانیه است، باید عدد صحیح مثبت باشد، و در `86400000` (۲۴ ساعت) محدود می‌شود. TTLهای طولانی‌تر برای گردش‌کارهای بازبینی یا تأیید که نیاز دارند دکمه‌ها قابل‌استفاده بمانند مفیدند، اما بازه‌ای را هم طولانی‌تر می‌کنند که در آن یک پیام قدیمی Discord هنوز می‌تواند کنشی را فعال کند. کوتاه‌ترین TTL متناسب با گردش‌کار را ترجیح دهید، و وقتی بازخوانی‌های مانده غافلگیرکننده خواهند بود، پیش‌فرض را نگه دارید.

فرمان‌های اسلش `/model` و `/models` یک انتخابگر مدل تعاملی با فهرست‌های کشویی ارائه‌دهنده، مدل، و زمان‌اجرای سازگار به‌همراه یک مرحلهٔ ارسال باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، یک پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخابگر موقت است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند. منوهای انتخاب Discord به ۲۵ گزینه محدودند، بنابراین وقتی می‌خواهید انتخابگر مدل‌های کشف‌شدهٔ پویا را فقط برای ارائه‌دهندگان انتخاب‌شده‌ای مانند `openai` یا `vllm` نشان دهد، ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک ارجاع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (تک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با ارجاع پیوست مطابقت داشته باشد، از `filename` برای بازنویسی نام استفاده کنید

فرم‌های مودال:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw یک دکمهٔ فعال‌ساز را خودکار اضافه می‌کند

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
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند آن است که `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناخته مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    تقدم چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط روی حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی تقدم دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشد، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - منشن `<@id>`

    شناسه‌های عددی تنها معمولاً وقتی پیش‌فرض کانال فعال باشد به‌عنوان شناسهٔ کانال حل می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان هدف‌های DM کاربر درنظر گرفته می‌شوند.

  </Tab>

  <Tab title="Access groups">
    DMهای Discord و مجوزدهی فرمان متنی می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی میان کانال‌های پیام مشترک‌اند. برای یک گروه ایستا که اعضایش در نحو عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups)

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

    یک کانال متنی Discord فهرست عضو جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو گیلد پیکربندی‌شده است و پس از اعمال نقش‌ها و بازنویسی‌های کانال، درحال‌حاضر روی کانال پیکربندی‌شده مجوز مؤثر `ViewChannel` دارد.

    مثال: به هرکسی که می‌تواند `#maintainers` را ببیند اجازه دهید به ربات DM بدهد، درحالی‌که DMها برای همهٔ افراد دیگر بسته می‌مانند.

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

    جست‌وجوها در حالت شکست بسته می‌مانند. اگر Discord مقدار `Missing Access` برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال به گیلد دیگری تعلق داشته باشد، فرستندهٔ DM غیرمجاز تلقی می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را در Discord Developer Portal برای ربات فعال کنید. DMها وضعیت عضو گیلد را شامل نمی‌شوند، بنابراین OpenClaw عضو را هنگام مجوزدهی از طریق Discord REST حل می‌کند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت گیلد با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط پایهٔ امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - گیلد باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستنده‌ها وقتی با `users` یا `roles` مطابقت داشته باشند مجازند
    - تطبیق مستقیم نام/تگ به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/تگ‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/تگ هشدار می‌دهد
    - اگر گیلدی `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر گیلدی بلوک `channels` نداشته باشد، همهٔ کانال‌های آن گیلدِ فهرست‌مجاز مجازند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` ایجاد نکنید، fallback زمان اجرا `groupPolicy="allowlist"` است (با یک هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های گیلد به‌طور پیش‌فرض با منشن محدود می‌شوند.

    تشخیص منشن شامل موارد زیر است:

    - منشن صریح ربات
    - الگوهای منشن پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به ربات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو رسمی منشن استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از فرم قدیمی منشن نام مستعار `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر گیلد/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقشی دیگر منشن می‌دهند اما ربات را منشن نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا slugهای کانال)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر نقش

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به عامل‌های مختلف بر اساس شناسهٔ نقش استفاده کنید. اتصال‌های مبتنی بر نقش فقط شناسهٔ نقش را می‌پذیرند و پس از اتصال‌های peer یا parent-peer و پیش از اتصال‌های فقط guild ارزیابی می‌شوند. اگر یک اتصال فیلدهای match دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

## دستورهای بومی و مجوزدهی دستور

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی دستورهای slash در Discord را هنگام راه‌اندازی رد می‌کند. دستورهایی که قبلاً ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامهٔ Discord حذف کنید، در Discord قابل مشاهده بمانند.
- مجوزدهی دستور بومی از همان allowlistها/سیاست‌های Discord استفاده می‌کند که پردازش پیام عادی استفاده می‌کند.
- دستورها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان مجوزدهی OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای فهرست دستورها و رفتار، [دستورهای Slash](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض دستور slash:

- `ephemeral: true`

## جزئیات قابلیت

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

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای آن نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    رویداد ورودی یک دستهٔ debounced از چند پیام بوده باشد. این برای زمانی مفید است
    که پاسخ‌های بومی را عمدتاً برای گفت‌وگوهای انفجاری و مبهم می‌خواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در context/history نمایش داده می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش لینک‌ها">
    Discord به‌صورت پیش‌فرض برای URLها embedهای غنی لینک تولید می‌کند. OpenClaw به‌صورت پیش‌فرض آن embedهای تولیدشده را در پیام‌های خروجی Discord سرکوب می‌کند، بنابراین URLهای ارسال‌شده توسط عامل به‌صورت لینک ساده می‌مانند مگر اینکه آن را فعال کنید:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    برای بازنویسی یک حساب، `channels.discord.accounts.<id>.suppressEmbeds` را تنظیم کنید. ارسال‌های ابزار پیام عامل نیز می‌توانند برای یک پیام تکی `suppressEmbeds: false` را پاس بدهند. payloadهای صریح `embeds` در Discord توسط تنظیم پیش‌فرض پیش‌نمایش لینک سرکوب نمی‌شوند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های پیش‌نویس را stream کند. `channels.discord.streaming` یکی از `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش نگه می‌دارد و آن را تا تحویل نهایی با پیشرفت ابزار به‌روزرسانی می‌کند؛ برچسب آغازین مشترک یک خط چرخان است، بنابراین پس از ظاهر شدن کار کافی، مانند بقیهٔ محتوا از دید خارج می‌شود. `streamMode` یک alias قدیمی runtime است. برای بازنویسی پیکربندی ذخیره‌شده به کلید canonical، `openclaw doctor --fix` را اجرا کنید.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` بگذارید. اگر streaming بلوکی Discord به‌صورت صریح فعال باشد، OpenClaw برای جلوگیری از double-streaming از stream پیش‌نمایش رد می‌شود.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` هنگام رسیدن tokenها یک پیام پیش‌نمایش تکی را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازهٔ پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، با سقف `textChunkLimit`).
    - نهایی‌های رسانه، خطا، و explicit-reply ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - ردیف‌های ابزار/پیشرفت، در صورت وجود، به‌صورت emoji فشرده + عنوان + جزئیات render می‌شوند، برای مثال `🛠️ Bash: run tests` یا `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (پیش‌فرض `false`) متن commentary/preamble دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند. Commentary پیش از نمایش پاک‌سازی می‌شود، گذرا می‌ماند، و تحویل پاسخ نهایی را تغییر نمی‌دهد.
    - `streaming.progress.maxLineChars` بودجهٔ پیش‌نمایش پیشرفت برای هر خط را کنترل می‌کند. نثر روی مرزهای واژه کوتاه می‌شود؛ جزئیات دستور و مسیر پسوندهای مفید را نگه می‌دارند.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات دستور/exec را در خطوط فشردهٔ پیشرفت کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام دستور/exec را پنهان کنید و خطوط فشردهٔ پیشرفت را نگه دارید:

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

    Streaming پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی streaming از نوع `block` به‌صورت صریح فعال باشد، OpenClaw برای جلوگیری از double-streaming از stream پیش‌نمایش رد می‌شود.

  </Accordion>

  <Accordion title="تاریخچه، context، و رفتار thread">
    context تاریخچهٔ guild:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچهٔ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار thread:

    - Threadهای Discord به‌صورت نشست‌های کانال مسیریابی می‌شوند و مگر اینکه بازنویسی شوند، پیکربندی کانال والد را به ارث می‌برند.
    - نشست‌های thread انتخاب `/model` سطح نشست کانال والد را فقط به‌عنوان fallback مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی thread همچنان اولویت دارند و تاریخچهٔ transcript والد کپی نمی‌شود مگر اینکه ارث‌بری transcript فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) auto-threadهای جدید را به seed شدن از transcript والد وارد می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند هدف‌های DM از نوع `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام fallback فعال‌سازی مرحلهٔ پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان context **غیرقابل اعتماد** تزریق می‌شوند. Allowlists مشخص می‌کنند چه کسی می‌تواند عامل را فعال کند، نه اینکه یک مرز کامل redaction برای context مکمل باشند.

  </Accordion>

  <Accordion title="نشست‌های وابسته به thread برای subagentها">
    Discord می‌تواند یک thread را به هدف نشست bind کند تا پیام‌های بعدی در آن thread همچنان به همان نشست (از جمله نشست‌های subagent) مسیریابی شوند.

    دستورها:

    - `/focus <target>` اتصال thread فعلی/جدید به هدف subagent/نشست
    - `/unfocus` حذف اتصال thread فعلی
    - `/agents` نمایش اجراهای فعال و وضعیت اتصال
    - `/session idle <duration|off>` بررسی/به‌روزرسانی auto-unfocus ناشی از عدم فعالیت برای اتصال‌های focused
    - `/session max-age <duration|off>` بررسی/به‌روزرسانی حداکثر عمر سخت برای اتصال‌های focused

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
    - `spawnSessions` ایجاد/اتصال خودکار threadها را برای `sessions_spawn({ thread: true })` و spawnهای thread در ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` context بومی subagent را برای spawnهای وابسته به thread کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` توسط `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر اتصال‌های thread برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با اتصال thread در دسترس نیستند.

    [Sub-agentها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="اتصال‌های پایدار کانال ACP">
    برای workspaceهای ACP پایدار و «همیشه روشن»، اتصال‌های ACP تایپ‌شده در سطح بالا را پیکربندی کنید که گفت‌وگوهای Discord را هدف می‌گیرند.

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

    نکته‌ها:

    - `/acp spawn codex --bind here` کانال یا thread فعلی را درجا bind می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های thread اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا thread متصل، `/new` و `/reset` همان نشست ACP را درجا reset می‌کنند. اتصال‌های موقت thread می‌توانند resolution هدف را هنگام فعال بودن بازنویسی کنند.
    - `spawnSessions` ایجاد/اتصال thread فرزند را از طریق `--thread auto|here` gate می‌کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک emoji تأیید ارسال می‌کند.

    ترتیب resolution:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Discord emoji یونیکد یا نام‌های emoji سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های پیکربندی">
    نوشتن‌های پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال هستند.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های دستور فعال باشند).

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
    ترافیک WebSocket مربوط به Gateway در Discord و lookupهای REST هنگام راه‌اندازی (application ID + resolution مربوط به allowlist) را با `channels.discord.proxy` از طریق یک پراکسی HTTP(S) مسیریابی کنید.

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
    resolution مربوط به PluralKit را فعال کنید تا پیام‌های proxied به هویت عضو سیستم map شوند:

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
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به بازه زمانی محدود هستند
    - اگر جست‌وجو ناموفق باشد، پیام‌های proxied به‌عنوان پیام‌های bot در نظر گرفته می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها برای کاربران شناخته‌شده Discord به منشن‌های خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handleهای بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربری Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و منشن‌های داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

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
    به‌روزرسانی‌های حضور زمانی اعمال می‌شوند که یک فیلد status یا activity تنظیم کنید، یا زمانی که حضور خودکار را فعال کنید.

    نمونه فقط status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    نمونه activity؛ status سفارشی نوع activity پیش‌فرض است:

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

    نمونه پخش زنده:

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

    نگاشت نوع activity:

    - 0: بازی کردن
    - 1: پخش زنده؛ به `activityUrl` نیاز دارد
    - 2: گوش دادن
    - 3: تماشا کردن
    - 4: سفارشی؛ متن activity را به‌عنوان وضعیت status استفاده می‌کند؛ emoji اختیاری است
    - 5: رقابت کردن

    نمونه حضور خودکار؛ سیگنال سلامت زمان اجرا:

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

    حضور خودکار، در دسترس بودن زمان اجرا را به status در Discord نگاشت می‌کند: healthy => online، degraded یا unknown => idle، exhausted یا unavailable => dnd. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`؛ از placeholder `{reason}` پشتیبانی می‌کند

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در DMها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری اعلان‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`؛ اختیاری است و در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد
    - `channels.discord.execApprovals.target`؛ (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    Discord زمانی تأییدهای native exec را به‌صورت خودکار فعال می‌کند که `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل resolve باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`. Discord تأییدکنندگان exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال‌سازی صریح Discord به‌عنوان کلاینت تأیید native، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط ویژه owner مانند `/diagnostics` و `/export-trajectory`، OpenClaw اعلان‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی owner فراخواننده یک مسیر owner در Discord داشته باشد، ابتدا Discord DM را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر owner موجود از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، اعلان تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان resolveشده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد ephemeral دریافت می‌کنند. اعلان‌های تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید session قابل استخراج نباشد، OpenClaw به تحویل DM برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را render می‌کند که دیگر کانال‌های چت استفاده می‌کنند. آداپتر native Discord عمدتاً مسیریابی DM تأییدکننده و fanout کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها حاضر باشند، تجربه کاربری اصلی تأیید همان‌ها هستند؛ OpenClaw
    باید فقط زمانی یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید
    تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید native در Discord فعال نباشد، OpenClaw اعلان
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت native به هیچ مقصدی قابل تحویل نباشد،
    OpenClaw یک اعلان fallback در همان چت با فرمان دقیق `/approve`
    از تأیید pending ارسال می‌کند.

    Gateway auth و حل‌وفصل تأیید طبق قرارداد مشترک کلاینت Gateway انجام می‌شود (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    به [تأییدهای Exec](/fa/tools/exec-approvals) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور و اقدام‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- واکنش‌ها: `react`, `reactions`, `emojiList`
- نظارت: `timeout`, `kick`, `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` می‌پذیرد (URL یا مسیر فایل محلی) تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه اقدام                                                                                                                                                               | پیش‌فرض    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال       |
| roles                                                                                                                                                                    | غیرفعال    |
| moderation                                                                                                                                                               | غیرفعال    |
| presence                                                                                                                                                                 | غیرفعال    |

## رابط کاربری Components v2

OpenClaw برای تأییدهای exec و نشانگرهای میان‌بافتاری از components v2 در Discord استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی استفاده‌شده توسط کانتینرهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- `channels.discord.agentComponents.ttlMs` کنترل می‌کند callbackهای کامپوننت Discord ارسال‌شده چه مدت ثبت بمانند (پیش‌فرض `1800000`، حداکثر `86400000`). برای هر حساب با `channels.discord.accounts.<id>.agentComponents.ttlMs` تنظیم کنید.
- وقتی components v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.
- پیش‌نمایش‌های URL ساده به‌طور پیش‌فرض سرکوب می‌شوند. وقتی یک پیوند خروجی واحد باید باز شود، روی اقدام پیام `suppressEmbeds: false` را تنظیم کنید.

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

## صوت

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بی‌درنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موج). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

چک‌لیست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی allowlistهای نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. مجوزهای Connect، Speak، Send Messages و Read Message History را در کانال صوتی هدف اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از agent پیش‌فرض حساب استفاده می‌کند و همان قواعد allowlist و سیاست گروهی سایر فرمان‌های Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

برای بررسی مجوزهای مؤثر ربات پیش از پیوستن، اجرا کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

نمونه پیوستن خودکار:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

یادداشت‌ها:

- `voice.tts` فقط برای پخش صوتی `stt-tts`، `messages.tts` را بازنویسی می‌کند. حالت‌های بی‌درنگ از `voice.realtime.speakerVoice` استفاده می‌کنند.
- `voice.mode` مسیر گفت‌وگو را کنترل می‌کند. پیش‌فرض `agent-proxy` است: یک رابط صوتی بی‌درنگ زمان‌بندی نوبت، وقفه و پخش را مدیریت می‌کند، کارهای محتوایی را از طریق `openclaw_agent_consult` به عامل مسیردهی‌شده OpenClaw واگذار می‌کند، و نتیجه را مانند یک درخواست تایپ‌شده Discord از همان گوینده پردازش می‌کند. `stt-tts` جریان قدیمی‌تر STT دسته‌ای به‌همراه TTS را نگه می‌دارد. `bidi` به مدل بی‌درنگ اجازه می‌دهد مستقیما گفت‌وگو کند و در عین حال `openclaw_agent_consult` را برای مغز OpenClaw در دسترس بگذارد.
- `voice.agentSession` کنترل می‌کند کدام گفت‌وگوی OpenClaw نوبت‌های صوتی را دریافت کند. برای جلسه خود کانال صوتی آن را تنظیم‌نشده بگذارید، یا آن را روی `{ mode: "target", target: "channel:<text-channel-id>" }` بگذارید تا کانال صوتی به‌عنوان افزونه میکروفون/بلندگوی یک جلسه موجود کانال متنی Discord مانند `#maintainers` عمل کند.
- `voice.model` مغز عامل OpenClaw را برای پاسخ‌های صوتی Discord و مشاوره‌های بی‌درنگ بازنویسی می‌کند. برای ارث‌بری مدل عامل مسیردهی‌شده، آن را تنظیم‌نشده بگذارید. این گزینه از `voice.realtime.model` جدا است.
- `voice.followUsers` به ربات اجازه می‌دهد همراه کاربران منتخب به صدای Discord بپیوندد، جابه‌جا شود و خارج شود. برای قواعد رفتار و نمونه‌ها، [دنبال کردن کاربران در صدا](#follow-users-in-voice) را ببینید.
- `agent-proxy` گفتار را از طریق `discord-voice` مسیردهی می‌کند؛ این مسیر مجوزدهی عادی مالک/ابزار را برای گوینده و جلسه هدف حفظ می‌کند، اما ابزار `tts` عامل را پنهان می‌کند، چون صدای Discord مالک پخش است. به‌طور پیش‌فرض، `agent-proxy` برای گویندگان مالک دسترسی کامل ابزار هم‌ارز مالک را به مشاوره می‌دهد (`voice.realtime.toolPolicy: "owner"`) و قویا ترجیح می‌دهد پیش از پاسخ‌های محتوایی با عامل OpenClaw مشورت کند (`voice.realtime.consultPolicy: "always"`). در حالت پیش‌فرض `always`، لایه بی‌درنگ پیش از پاسخ مشاوره، محتوای پرکننده را خودکار به گفتار تبدیل نمی‌کند؛ گفتار را ضبط و رونویسی می‌کند، سپس پاسخ مسیردهی‌شده OpenClaw را پخش می‌کند. اگر چند پاسخ مشاوره اجباری در حالی تمام شوند که Discord هنوز پاسخ اول را پخش می‌کند، پاسخ‌های گفتار دقیق بعدی به‌جای جایگزین‌کردن گفتار در میانه جمله، تا بیکار شدن پخش در صف می‌مانند.
- در حالت `stt-tts`، STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` بر رونویسی اثر نمی‌گذارد.
- در حالت‌های بی‌درنگ، `voice.realtime.provider`، `voice.realtime.model` و `voice.realtime.speakerVoice` جلسه صوتی بی‌درنگ را پیکربندی می‌کنند. برای OpenAI Realtime 2 به‌همراه مغز Codex، از `voice.realtime.model: "gpt-realtime-2"` و `voice.model: "openai/gpt-5.5"` استفاده کنید.
- حالت‌های صوتی بی‌درنگ به‌طور پیش‌فرض فایل‌های پروفایل کوچک `IDENTITY.md`، `USER.md` و `SOUL.md` را در دستورالعمل‌های ارائه‌دهنده بی‌درنگ قرار می‌دهند تا نوبت‌های مستقیم سریع همان هویت، زمینه کاربر و پرسونای عامل مسیردهی‌شده OpenClaw را حفظ کنند. برای سفارشی‌سازی این رفتار، `voice.realtime.bootstrapContextFiles` را روی یک زیرمجموعه بگذارید، یا برای غیرفعال‌کردن آن از `[]` استفاده کنید. فایل‌های بوت‌استرپ بی‌درنگ پشتیبانی‌شده به همین فایل‌های پروفایل محدودند؛ `AGENTS.md` در زمینه عادی عامل باقی می‌ماند. زمینه پروفایل تزریق‌شده برای کارهای فضای کاری، واقعیت‌های جاری، جست‌وجوی حافظه یا کنش‌های متکی به ابزار، جایگزین `openclaw_agent_consult` نمی‌شود.
- در حالت بی‌درنگ OpenAI `agent-proxy`، `voice.realtime.requireWakeName: true` را تنظیم کنید تا صدای بی‌درنگ Discord تا زمانی که یک رونوشت با نام بیدارساز شروع یا تمام نشده، ساکت بماند. نام‌های بیدارساز پیکربندی‌شده باید یک یا دو کلمه باشند. اگر `voice.realtime.wakeNames` تنظیم نشده باشد، OpenClaw از `name` عامل مسیردهی‌شده به‌همراه `OpenClaw` استفاده می‌کند، و در صورت نبود آن به شناسه عامل به‌همراه `OpenClaw` برمی‌گردد. دروازه‌گذاری با نام بیدارساز پاسخ خودکار ارائه‌دهنده بی‌درنگ را غیرفعال می‌کند، نوبت‌های پذیرفته‌شده را از مسیر مشاوره عامل OpenClaw عبور می‌دهد، و وقتی یک نام بیدارساز ابتدایی پیش از رسیدن رونوشت نهایی از رونویسی جزئی تشخیص داده شود، یک تأیید گفتاری کوتاه می‌دهد.
- ارائه‌دهنده بی‌درنگ OpenAI نام‌های رویداد فعلی Realtime 2 و نام‌های مستعار قدیمی سازگار با Codex را برای رویدادهای صوت خروجی و رونوشت می‌پذیرد، بنابراین اسنپ‌شات‌های سازگار ارائه‌دهنده می‌توانند بدون از دست‌دادن صدای دستیار تغییر کنند.
- `voice.realtime.bargeIn` کنترل می‌کند که آیا رویدادهای شروع گفتار Discord پخش بی‌درنگ فعال را قطع کنند یا نه. اگر تنظیم نشده باشد، از تنظیم وقفه صوت ورودی ارائه‌دهنده بی‌درنگ پیروی می‌کند.
- `voice.realtime.minBargeInAudioEndMs` حداقل مدت پخش دستیار را پیش از آن‌که مداخله بی‌درنگ OpenAI صدا را قطع کند کنترل می‌کند. پیش‌فرض: `250`. برای وقفه فوری در اتاق‌های کم‌اکو آن را روی `0` بگذارید، یا برای تنظیمات بلندگوی پر‌اکو آن را افزایش دهید.
- برای یک صدای OpenAI روی پخش Discord، `voice.tts.provider: "openai"` را تنظیم کنید و یک صدای تبدیل متن به گفتار را زیر `voice.tts.providers.openai.speakerVoice` انتخاب کنید. `cedar` روی مدل فعلی TTS OpenAI یک گزینه خوب با صدای مردانه است.
- بازنویسی‌های `systemPrompt` مخصوص هر کانال Discord روی نوبت‌های رونوشت صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونوشت صوتی وضعیت مالک را برای فرمان‌های محدود به مالک و کنش‌های کانال از `allowFrom` مربوط به Discord (یا `dm.allowFrom`) استخراج می‌کنند. دیدپذیری ابزار عامل از خط‌مشی ابزار پیکربندی‌شده برای جلسه مسیردهی‌شده پیروی می‌کند.
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال‌کردن فرمان‌های `/vc`، زمان‌اجرای صوتی و intent مربوط به Gateway با نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحا بازنویسی کند. برای آن‌که intent از فعال‌سازی مؤثر صدا پیروی کند، آن را تنظیم‌نشده بگذارید.
- اگر `voice.autoJoin` چند ورودی برای یک guild یکسان داشته باشد، OpenClaw به آخرین کانال پیکربندی‌شده برای آن guild می‌پیوندد.
- `voice.allowedChannels` یک فهرست مجاز اقامت اختیاری است. برای اجازه‌دادن به `/vc join` در هر کانال صوتی مجاز Discord، آن را تنظیم‌نشده بگذارید. وقتی تنظیم شود، `/vc join`، پیوستن خودکار هنگام راه‌اندازی، و جابه‌جایی‌های وضعیت صوتی ربات به ورودی‌های فهرست‌شده `{ guildId, channelId }` محدود می‌شوند. برای رد همه پیوستن‌های صوتی Discord، آن را روی یک آرایه خالی بگذارید. اگر Discord ربات را به بیرون از فهرست مجاز منتقل کند، OpenClaw آن کانال را ترک می‌کند و وقتی هدف پیوستن خودکار پیکربندی‌شده‌ای در دسترس باشد دوباره به آن می‌پیوندد.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` مستقیما به گزینه‌های پیوستن `@discordjs/voice` پاس داده می‌شوند.
- اگر تنظیم نشده باشند، پیش‌فرض‌های `@discordjs/voice` برابرند با `daveEncryption=true` و `decryptionFailureTolerance=24`.
- OpenClaw برای دریافت صدای Discord و پخش PCM خام بی‌درنگ از کدک همراه `libopus-wasm` استفاده می‌کند. این کدک یک ساخت WebAssembly سنجاق‌شده از libopus را همراه دارد و به افزونه‌های بومی opus نیاز ندارد.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع یک جلسه صوتی، پیش از نابودکردن آن، چه مدت برای شروع اتصال مجدد صبر کند. پیش‌فرض: `15000`.
- در حالت `stt-tts`، پخش صوتی صرفا به این دلیل که کاربر دیگری شروع به صحبت می‌کند متوقف نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوتی جدید را نادیده می‌گیرد؛ برای نوبت بعدی پس از پایان پخش صحبت کنید. حالت‌های بی‌درنگ شروع گفتار را به‌عنوان سیگنال‌های مداخله به ارائه‌دهنده بی‌درنگ ارسال می‌کنند.
- در حالت‌های بی‌درنگ، اکو از بلندگوها به میکروفون باز می‌تواند شبیه مداخله به نظر برسد و پخش را قطع کند. برای اتاق‌های Discord پر‌اکو، `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید تا OpenAI روی صوت ورودی خودکار وقفه ایجاد نکند. اگر همچنان می‌خواهید رویدادهای شروع گفتار Discord پخش فعال را قطع کنند، `voice.realtime.bargeIn: true` را اضافه کنید. پل بی‌درنگ OpenAI قطع‌های پخشی کوتاه‌تر از `voice.realtime.minBargeInAudioEndMs` را به‌عنوان اکو/نویز محتمل نادیده می‌گیرد و به‌جای پاک‌کردن پخش Discord، آن‌ها را به‌عنوان ردشده ثبت می‌کند.
- `voice.captureSilenceGraceMs` کنترل می‌کند OpenClaw پس از آن‌که Discord گزارش می‌دهد گوینده‌ای متوقف شده، چه مدت پیش از نهایی‌کردن آن قطعه صوتی برای STT صبر کند. پیش‌فرض: `2000`؛ اگر Discord مکث‌های عادی را به رونوشت‌های جزئی و بریده تقسیم می‌کند، این مقدار را افزایش دهید.
- وقتی ElevenLabs ارائه‌دهنده TTS انتخاب‌شده باشد، پخش صوتی Discord از TTS جریانی استفاده می‌کند و از جریان پاسخ ارائه‌دهنده شروع می‌شود. ارائه‌دهندگان بدون پشتیبانی جریانی به مسیر فایل موقت سنتزشده برمی‌گردند.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از خطاهای تکرارشونده در یک بازه کوتاه، با ترک و پیوستن دوباره به کانال صوتی به‌طور خودکار بازیابی می‌شود.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت مکررا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان دادند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 مربوط به discord.js است که issue #11419 مربوط به discord.js را بست.
- رویدادهای دریافت `The operation was aborted` زمانی که OpenClaw یک قطعه گوینده ضبط‌شده را نهایی می‌کند مورد انتظارند؛ آن‌ها عیب‌یابی پرجزئیات هستند، نه هشدار.
- لاگ‌های پرجزئیات صدای Discord برای هر قطعه گوینده پذیرفته‌شده یک پیش‌نمایش محدود یک‌خطی از رونوشت STT دارند، بنابراین اشکال‌زدایی هم سمت کاربر و هم سمت پاسخ عامل را بدون ریختن متن نامحدود رونوشت نشان می‌دهد.
- در حالت `agent-proxy`، fallback مشاوره اجباری قطعه‌های رونوشت احتمالا ناقص را رد می‌کند، مانند متنی که به `...` ختم می‌شود یا یک رابط انتهایی مثل `and` دارد، به‌علاوه پایان‌بندی‌های آشکارا غیرقابل‌اقدام مانند “be right back” یا “bye”. وقتی این کار از یک پاسخ صف‌شده کهنه جلوگیری کند، لاگ‌ها `forced agent consult skipped reason=...` را نشان می‌دهند.

### دنبال کردن کاربران در صدا

وقتی می‌خواهید ربات صوتی Discord به‌جای پیوستن به یک کانال ثابت هنگام راه‌اندازی یا انتظار برای `/vc join`، همراه یک یا چند کاربر شناخته‌شده Discord بماند، از `voice.followUsers` استفاده کنید.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

رفتار:

- `followUsers` شناسه‌های خام کاربر Discord و مقادیر `discord:<id>` را می‌پذیرد. OpenClaw پیش از تطبیق رویدادهای وضعیت صوتی، هر دو شکل را نرمال‌سازی می‌کند.
- وقتی `followUsers` پیکربندی شده باشد، مقدار پیش‌فرض `followUsersEnabled` برابر `true` است. برای نگه‌داشتن فهرست ذخیره‌شده اما توقف دنبال‌کردن خودکار صدا، آن را روی `false` بگذارید.
- وقتی یک کاربر دنبال‌شده به یک کانال صوتی مجاز می‌پیوندد، OpenClaw به آن کانال می‌پیوندد. وقتی کاربر جابه‌جا می‌شود، OpenClaw همراه او جابه‌جا می‌شود. وقتی کاربر دنبال‌شده فعال قطع می‌شود، OpenClaw خارج می‌شود.
- اگر چند کاربر دنبال‌شده در یک guild باشند و کاربر دنبال‌شده فعال خارج شود، OpenClaw پیش از ترک guild به کانال کاربر دنبال‌شده ردیابی‌شده دیگری می‌رود. اگر چند کاربر دنبال‌شده هم‌زمان جابه‌جا شوند، آخرین رویداد وضعیت صوتی مشاهده‌شده برنده است.
- `allowedChannels` همچنان اعمال می‌شود. کاربر دنبال‌شده در یک کانال غیرمجاز نادیده گرفته می‌شود، و جلسه تحت مالکیت دنبال‌کردن به کاربر دنبال‌شده دیگری منتقل می‌شود یا خارج می‌شود.
- OpenClaw رویدادهای وضعیت صوتی ازدست‌رفته را هنگام راه‌اندازی و در یک بازه محدود همگام‌سازی می‌کند. همگام‌سازی از guildهای پیکربندی‌شده نمونه‌برداری می‌کند و تعداد جست‌وجوهای REST در هر اجرا را محدود می‌کند، بنابراین فهرست‌های بسیار بزرگ `followUsers` ممکن است برای همگراشدن به بیش از یک بازه نیاز داشته باشند.
- اگر Discord یا یک مدیر ربات را زمانی که در حال دنبال‌کردن کاربری است جابه‌جا کند، OpenClaw جلسه صوتی را بازسازی می‌کند و وقتی مقصد مجاز باشد مالکیت دنبال‌کردن را حفظ می‌کند. اگر ربات به بیرون از `allowedChannels` منتقل شود، OpenClaw خارج می‌شود و وقتی هدف پیکربندی‌شده‌ای وجود داشته باشد دوباره به آن می‌پیوندد.
- بازیابی دریافت DAVE ممکن است پس از خطاهای تکرارشونده رمزگشایی، همان کانال را ترک کند و دوباره به آن بپیوندد. جلسه‌های تحت مالکیت دنبال‌کردن، مالکیت دنبال‌کردن خود را در این مسیر بازیابی حفظ می‌کنند، بنابراین قطع‌شدن بعدی کاربر دنبال‌شده همچنان کانال را ترک می‌کند.

بین حالت‌های پیوستن انتخاب کنید:

- برای راه‌اندازی‌های شخصی یا اپراتوری که ربات باید وقتی شما در صدا هستید به‌طور خودکار در صدا باشد، از `followUsers` استفاده کنید.
- برای ربات‌های اتاق ثابت که حتی وقتی هیچ کاربر ردیابی‌شده‌ای در صدا نیست باید حاضر باشند، از `autoJoin` استفاده کنید.
- برای پیوستن‌های یک‌باره یا اتاق‌هایی که حضور صوتی خودکار در آن‌ها غیرمنتظره خواهد بود، از `/vc join` استفاده کنید.

کدک صوتی Discord:

- لاگ‌های دریافت صوت نشان می‌دهند `discord voice: opus decoder: libopus-wasm`.
- پخش بلادرنگ، PCM استریوی خام 48 kHz را پیش از تحویل بسته‌ها به `@discordjs/voice` با همان بسته‌ی همراه `libopus-wasm` به Opus کدگذاری می‌کند.
- پخش فایل و جریانِ ارائه‌دهنده با ffmpeg به PCM استریوی خام 48 kHz ترنسکد می‌شود، سپس از `libopus-wasm` برای جریان بسته‌ی Opus ارسالی به Discord استفاده می‌کند.

خط لوله‌ی STT به‌همراه TTS:

- ضبط PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` کار STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از مسیر ورودی و مسیریابی Discord فرستاده می‌شود، در حالی‌که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و درخواست متن برگشتی می‌دهد، چون صوت Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ ارائه‌دهندگان دارای قابلیت جریان‌دهی مستقیماً پخش‌کننده را تغذیه می‌کنند، وگرنه فایل صوتی حاصل در کانال پیوسته‌شده پخش می‌شود.

نمونه‌ی نشست کانال صوتی پیش‌فرض agent-proxy:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

بدون بلوک `voice.agentSession`، هر کانال صوتی نشست OpenClaw مسیریابی‌شده‌ی خودش را می‌گیرد. برای مثال، `/vc join channel:234567890123456789` با نشست همان کانال صوتی Discord صحبت می‌کند. مدل بلادرنگ فقط رابط جلویی صوت است؛ درخواست‌های محتوایی به عامل پیکربندی‌شده‌ی OpenClaw سپرده می‌شوند. اگر مدل بلادرنگ بدون فراخوانی ابزار مشورت، رونوشت نهایی تولید کند، OpenClaw به‌عنوان مسیر جایگزین مشورت را اجباری می‌کند تا پیش‌فرض همچنان مانند صحبت‌کردن با عامل رفتار کند.

نمونه‌ی قدیمی STT به‌همراه TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

نمونه‌ی بلادرنگ دوسویه:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

صوت به‌عنوان امتداد یک نشست موجود کانال Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

در حالت `agent-proxy` ربات به کانال صوتی پیکربندی‌شده می‌پیوندد، اما نوبت‌های عامل OpenClaw از نشست و عامل مسیریابی‌شده‌ی عادی کانال هدف استفاده می‌کنند. نشست صوتی بلادرنگ نتیجه‌ی برگشتی را دوباره در کانال صوتی بیان می‌کند. عامل ناظر همچنان می‌تواند مطابق سیاست ابزار خود از ابزارهای پیام عادی استفاده کند، از جمله ارسال یک پیام جداگانه‌ی Discord اگر اقدام درست همین باشد.

هنگامی که یک اجرای تفویض‌شده‌ی OpenClaw فعال است، رونوشت‌های صوتی جدید Discord پیش از شروع نوبت عامل دیگر، به‌عنوان کنترل اجرای زنده در نظر گرفته می‌شوند. عباراتی مانند "status"،‏ "cancel that"،‏ "use the smaller fix"، یا "when you're done also check tests" به‌عنوان ورودی وضعیت، لغو، هدایت، یا پیگیری برای نشست فعال طبقه‌بندی می‌شوند. پیامدهای وضعیت، لغو، هدایت پذیرفته‌شده، و پیگیری در کانال صوتی بازگو می‌شوند تا تماس‌گیرنده بداند آیا OpenClaw درخواست را انجام داده است یا نه.

شکل‌های هدف مفید:

- `target: "channel:123456789012345678"` از مسیر نشست کانال متنی Discord عبور می‌کند.
- `target: "123456789012345678"` به‌عنوان هدف کانال در نظر گرفته می‌شود.
- `target: "dm:123456789012345678"` یا `target: "user:123456789012345678"` از مسیر همان نشست پیام مستقیم عبور می‌کند.

نمونه‌ی OpenAI Realtime با اکو زیاد:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

وقتی مدل پخش خودِ Discord را از طریق میکروفون باز می‌شنود، اما همچنان می‌خواهید با صحبت‌کردن آن را قطع کنید، از این استفاده کنید. OpenClaw جلوی قطع خودکار OpenAI بر اساس صوت ورودی خام را می‌گیرد، در حالی‌که `bargeIn: true` اجازه می‌دهد رویدادهای شروع سخن‌گفتن Discord و صوت گوینده‌ی ازقبل‌فعال، پاسخ‌های بلادرنگ فعال را پیش از رسیدن نوبت ضبط‌شده‌ی بعدی به OpenAI لغو کنند. سیگنال‌های بسیار زودهنگام ورود به صحبت با `audioEndMs` کمتر از `minBargeInAudioEndMs` احتمالاً اکو/نویز در نظر گرفته و نادیده گرفته می‌شوند تا مدل در نخستین فریم پخش قطع نشود.

لاگ‌های صوتی مورد انتظار:

- هنگام پیوستن: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- هنگام شروع بلادرنگ: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- هنگام صوت گوینده: `discord voice: realtime speaker turn opened ...`،‏ `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- هنگام گفتار کهنه‌ی ردشده: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` یا `reason=non-actionable-closing ...`
- هنگام تکمیل پاسخ بلادرنگ: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- هنگام توقف/بازنشانی پخش: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- هنگام مشورت بلادرنگ: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- هنگام پاسخ عامل: `discord voice: agent turn answer ...`
- هنگام گفتار دقیق صف‌شده: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، سپس `discord voice: realtime exact speech dequeued reason=player-idle ...`
- هنگام تشخیص ورود به صحبت: `discord voice: realtime barge-in detected source=speaker-start ...` یا `discord voice: realtime barge-in detected source=active-speaker-audio ...`، سپس `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- هنگام وقفه‌ی بلادرنگ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، سپس یا `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` یا `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- هنگام اکو/نویز نادیده‌گرفته‌شده: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- هنگام غیرفعال بودن ورود به صحبت: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- هنگام پخش بیکار: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

برای اشکال‌زدایی صوت قطع‌شده، لاگ‌های صوت بلادرنگ را به‌صورت خط زمانی بخوانید:

1. `realtime audio playback started` یعنی Discord پخش صوت دستیار را آغاز کرده است. پل از همین نقطه شروع به شمردن قطعه‌های خروجی دستیار، بایت‌های PCM مربوط به Discord، بایت‌های بلادرنگ ارائه‌دهنده، و مدت صوت سنتزشده می‌کند.
2. `realtime speaker turn opened` فعال‌شدن یک گوینده‌ی Discord را مشخص می‌کند. اگر پخش از قبل فعال باشد و `bargeIn` فعال شده باشد، ممکن است پس از آن `barge-in detected source=speaker-start` بیاید.
3. `realtime input audio started` نخستین فریم صوتی واقعی دریافت‌شده برای آن نوبت گوینده را مشخص می‌کند. `outputActive=true` یا `outputAudioMs` غیرصفر در اینجا یعنی میکروفون در حالی ورودی می‌فرستد که پخش دستیار هنوز فعال است.
4. `barge-in detected source=active-speaker-audio` یعنی OpenClaw هنگام فعال‌بودن پخش دستیار، صوت زنده‌ی گوینده را دیده است. این برای تمایز یک وقفه‌ی واقعی از رویداد شروع گوینده در Discord بدون صوت مفید، کاربردی است.
5. `barge-in requested reason=...` یعنی OpenClaw از ارائه‌دهنده‌ی بلادرنگ خواسته پاسخ فعال را لغو یا کوتاه کند. این شامل `outputAudioMs`،‏ `outputActive`، و `playbackChunks` است تا ببینید پیش از وقفه واقعاً چه مقدار صوت دستیار پخش شده بود.
6. `realtime audio playback stopped reason=...` نقطه‌ی بازنشانی پخش محلی Discord است. دلیل می‌گوید چه کسی پخش را متوقف کرده است: `barge-in`،‏ `player-idle`،‏ `provider-clear-audio`،‏ `forced-agent-consult`،‏ `stream-close`، یا `session-close`.
7. `realtime speaker turn closed` نوبت ورودی ضبط‌شده را خلاصه می‌کند. `chunks=0` یا `hasAudio=false` یعنی نوبت گوینده باز شد اما هیچ صوت قابل استفاده‌ای به پل بلادرنگ نرسید. `interruptedPlayback=true` یعنی آن نوبت ورودی با خروجی دستیار همپوشانی داشت و منطق ورود به صحبت را فعال کرد.

فیلدهای مفید:

- `outputAudioMs`: مدت صوت دستیار که ارائه‌دهنده‌ی بلادرنگ پیش از خط لاگ تولید کرده است.
- `audioMs`: مدت صوت دستیار که OpenClaw پیش از توقف پخش شمرده است.
- `elapsedMs`: زمان ساعت دیواری بین باز و بسته‌شدن جریان پخش یا نوبت گوینده.
- `discordBytes`: بایت‌های PCM استریوی 48 kHz ارسال‌شده به صوت Discord یا دریافت‌شده از آن.
- `realtimeBytes`: بایت‌های PCM با قالب ارائه‌دهنده که به ارائه‌دهنده‌ی بلادرنگ ارسال یا از آن دریافت شده‌اند.
- `playbackChunks`: قطعه‌های صوت دستیار که برای پاسخ فعال به Discord فرستاده شده‌اند.
- `sinceLastAudioMs`: فاصله بین آخرین فریم صوتی ضبط‌شده‌ی گوینده و بسته‌شدن نوبت گوینده.

الگوهای رایج:

- قطع فوری با `source=active-speaker-audio`، مقدار کم `outputAudioMs`، و همان کاربر در نزدیکی آن معمولاً به اکو از بلندگو که وارد میکروفون شده اشاره دارد. `voice.realtime.minBargeInAudioEndMs` را افزایش دهید، صدای بلندگو را کم کنید، از هدفون استفاده کنید، یا `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید.
- `source=speaker-start` به‌دنبال `speaker turn closed ... hasAudio=false` یعنی Discord شروع گوینده را گزارش کرده اما هیچ صوتی به OpenClaw نرسیده است. این می‌تواند یک رویداد گذرای صوتی Discord، رفتار noise gate، یا فعال‌شدن بسیار کوتاه میکروفون توسط کلاینت باشد.
- `audio playback stopped reason=stream-close` بدون ورود به صحبت نزدیک یا `provider-clear-audio` یعنی جریان پخش محلی Discord به‌طور غیرمنتظره پایان یافته است. لاگ‌های پیشین ارائه‌دهنده و پخش‌کننده‌ی Discord را بررسی کنید.
- `capture ignored during playback (barge-in disabled)` یعنی OpenClaw عمداً هنگام فعال‌بودن صوت دستیار، ورودی را کنار گذاشته است. اگر می‌خواهید گفتار پخش را قطع کند، `voice.realtime.bargeIn` را فعال کنید.
- `barge-in ignored ... outputActive=false` یعنی Discord یا VAD ارائه‌دهنده گفتار را گزارش کرده، اما OpenClaw پخش فعالی برای قطع‌کردن نداشته است. این نباید صوت را قطع کند.

اعتبارنامه‌ها برای هر مؤلفه جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، احراز هویت TTS برای `messages.tts`/`voice.tts`، و احراز هویت ارائه‌دهنده‌ی بلادرنگ برای `voice.realtime.providers` یا پیکربندی عادی احراز هویت ارائه‌دهنده.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش موج صوتی نشان می‌دهند و به صوت OGG/Opus نیاز دارند. OpenClaw موج صوتی را به‌صورت خودکار تولید می‌کند، اما برای بررسی و تبدیل، روی میزبان Gateway به `ffmpeg` و `ffprobe` نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در یک payload واحد رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent را فعال کنید
    - وقتی به تشخیص کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را بازراه‌اندازی کنید

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` را بررسی کنید
    - allowlist گیلد را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` گیلد وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
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

    - `groupPolicy="allowlist"` بدون allowlist مطابق برای گیلد/کانال
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist کاربران `users` گیلد/کانال مسدود شده است

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    تنظیمات صف gateway در Discord:

    - تک‌حسابی: `channels.discord.eventQueue.listenerTimeout`
    - چندحسابی: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Discord gateway را کنترل می‌کند، نه طول عمر turn عامل را

    Discord برای turnهای عاملِ صف‌شده timeout متعلق به کانال اعمال نمی‌کند. listenerهای پیام بلافاصله واگذار می‌کنند، و اجرای‌های صف‌شده Discord ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/runtime کامل شود یا کار را متوقف کند حفظ می‌کنند.

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
    OpenClaw پیش از اتصال، فراداده Discord `/gateway/bot` را دریافت می‌کند. خرابی‌های گذرا به URL پیش‌فرض gateway در Discord بازمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    تنظیمات timeout فراداده:

    - تک‌حسابی: `channels.discord.gatewayInfoTimeoutMs`
    - چندحسابی: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw هنگام راه‌اندازی و پس از اتصال مجدد runtime منتظر رویداد `READY` در gateway مربوط به Discord می‌ماند. تنظیمات چندحسابی با stagger راه‌اندازی ممکن است به بازه READY طولانی‌تری نسبت به پیش‌فرض نیاز داشته باشند.

    تنظیمات timeout مربوط به READY:

    - راه‌اندازی تک‌حسابی: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحسابی: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback محیطی راه‌اندازی وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - runtime تک‌حسابی: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime چندحسابی: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback محیطی runtime وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض runtime: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده کنید، تطبیق runtime همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را کامل تأیید کند.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` منتظر تأیید جفت‌سازی است

  </Accordion>

  <Accordion title="Bot to bot loops">
    به‌طور پیش‌فرض پیام‌های نوشته‌شده توسط ربات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قواعد سخت‌گیرانه mention و allowlist استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های رباتی که ربات را mention می‌کنند پذیرفته شوند.

    OpenClaw همچنین [محافظت حلقه ربات](/fa/channels/bot-loop-protection) مشترک را ارائه می‌کند. هرگاه `allowBots` اجازه دهد پیام‌های نوشته‌شده توسط ربات به dispatch برسند، Discord رویداد ورودی را به واقعیت‌های `(account, channel, bot pair)` نگاشت می‌کند و guard عمومی جفت، پس از عبور جفت از بودجه رویداد پیکربندی‌شده، آن جفت را سرکوب می‌کند. این guard از حلقه‌های دو رباتی مهارنشده جلوگیری می‌کند که پیش‌تر باید با rate limitهای Discord متوقف می‌شدند؛ روی استقرارهای تک‌رباتی یا پاسخ‌های یک‌باره ربات که زیر بودجه می‌مانند اثری ندارد.

    تنظیمات پیش‌فرض (فعال وقتی `allowBots` تنظیم شده باشد):

    - `maxEventsPerWindow: 20` -- جفت ربات می‌تواند در پنجره لغزان ۲۰ پیام ردوبدل کند
    - `windowSeconds: 60` -- طول پنجره لغزان
    - `cooldownSeconds: 60` -- پس از فعال شدن بودجه، هر پیام bot-to-bot اضافی در هر جهت به مدت یک دقیقه حذف می‌شود

    پیش‌فرض مشترک را یک بار زیر `channels.defaults.botLoopProtection` پیکربندی کنید، سپس زمانی که یک workflow مشروع به ظرفیت بیشتری نیاز دارد Discord را override کنید. اولویت به این صورت است:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - پیش‌فرض‌های داخلی

    Discord از کلیدهای عمومی `maxEventsPerWindow`، `windowSeconds` و `cooldownSeconds` استفاده می‌کند.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord وجود داشته باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - لاگ‌ها را برای این موارد بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خرابی‌ها پس از اتصال مجدد خودکار ادامه یافتند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه دریافت DAVE در upstream در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- راه‌اندازی/auth: `enabled`، `token`، `accounts.*`، `allowBots`
- سیاست: `groupPolicy`، `dm.*`، `guilds.*`، `guilds.*.channels.*`
- فرمان: `commands.native`، `commands.useAccessGroups`، `configWrites`، `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`، `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`، `gatewayReadyTimeoutMs`، `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- تحویل: `textChunkLimit`، `chunkMode`، `maxLinesPerMessage`
- streaming: `streaming` (alias قدیمی: `streamMode`)، `streaming.preview.toolProgress`، `draftChunk`، `blockStreaming`، `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (آپلودهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- کنش‌ها: `actions.*`
- حضور: `activity`، `status`، `activityType`، `activityUrl`
- UI: `ui.components.accentColor`
- ویژگی‌ها: `threadBindings`، `bindings[]` سطح بالا (`type: "acp"`)، `pluralkit`، `execApprovals`، `intents`، `agentComponents.enabled`، `agentComponents.ttlMs`، `heartbeat`، `responsePrefix`

</Accordion>

## ایمنی و عملیات

- با توکن‌های ربات مانند secrets برخورد کنید (`DISCORD_BOT_TOKEN` در محیط‌های نظارت‌شده ترجیح داده می‌شود).
- مجوزهای Discord را با حداقل امتیاز لازم اعطا کنید.
- اگر deploy/وضعیت فرمان کهنه است، gateway را بازراه‌اندازی کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را به gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار گفت‌وگوی گروهی و allowlist.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/fa/concepts/multi-agent">
    گیلدها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
