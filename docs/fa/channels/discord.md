---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی بات Discord
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های guild از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و فهرست دستورها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با یک بات بسازید، بات را به سرور خود اضافه کنید و آن را با OpenClaw جفت کنید. پیشنهاد می‌کنیم بات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="Create a Discord application and bot">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را به هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="Enable privileged intents">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (پیشنهادی؛ برای فهرست‌های مجاز نقش و تطبیق نام به شناسه الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="Copy your bot token">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار نخستین توکن شما را ایجاد می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و کمی بعد به آن نیاز دارید.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن بات به سرور خود ایجاد می‌کنید.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخش **Bot Permissions** پایین‌تر ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختیاری)

    این مجموعه پایه برای کانال‌های متنی معمولی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله جریان‌های کاری کانال forum یا media که یک رشته ایجاد یا ادامه می‌دهند، **Send Messages in Threads** را هم فعال کنید.
    URL ایجادشده در پایین را کپی کنید، در مرورگر خود جای‌گذاری کنید، سرور خود را انتخاب کنید و برای اتصال روی **Continue** کلیک کنید. اکنون باید بات خود را در سرور Discord ببینید.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتار خود) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. روی **آیکون سرور** خود در نوار کناری راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را همراه با Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="Allow DMs from server members">
    برای اینکه جفت‌سازی کار کند، Discord باید اجازه دهد باتتان برای شما پیام مستقیم بفرستد. روی **آیکون سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله بات‌ها) اجازه می‌دهد برای شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های guild استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    توکن بات Discord شما یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac مربوط به OpenClaw یا با توقف و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از شلی اجرا کنید که `DISCORD_BOT_TOKEN` در آن موجود است، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس پس از بازراه‌اندازی بتواند SecretRef محیط را resolve کند.
    اگر میزبان شما توسط lookup برنامه هنگام startup در Discord مسدود یا rate-limit شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا startup بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند بات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و به آن بگویید. اگر Discord نخستین کانال شماست، به‌جای آن از زبانه CLI / config استفاده کنید.

        > «من قبلاً توکن بات Discord خود را در config تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
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

        fallback محیط برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقدارهای `token` به‌صورت متن ساده پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند بات Discord، توکن و شناسه برنامه هر بات را زیر حساب خودش نگه دارید. `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، بنابراین فقط وقتی آن را آنجا تنظیم کنید که همه حساب‌ها باید از یک شناسه برنامه استفاده کنند.

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

    اکنون باید بتوانید از طریق پیام مستقیم در Discord با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
resolve کردن توکن نسبت به حساب آگاه است. مقدارهای توکن در config بر fallback محیط اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن بات resolve شوند، OpenClaw فقط یک پایشگر Gateway برای آن توکن شروع می‌کند. توکنی که از config آمده باشد بر fallback پیش‌فرض محیط اولویت دارد؛ در غیر این صورت نخستین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های outbound پیشرفته (ابزار message/اقدام‌های کانال)، یک `token` صریح برای همان فراخوانی استفاده می‌شود. این موضوع برای اقدام‌های send و read/probe-style اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات policy/retry حساب همچنان از حساب انتخاب‌شده در snapshot فعال runtime می‌آید.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری guild

پس از کار کردن پیام‌های مستقیم، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل خودش را با context خودش دارد. این کار برای سرورهای خصوصی که فقط شما و باتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="Add your server to the guild allowlist">
    این کار به عامل شما اجازه می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="Ask your agent">
        > «Discord Server ID من یعنی `<server_id>` را به allowlist مربوط به guild اضافه کن»
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
    به‌طور پیش‌فرض، عامل شما در کانال‌های guild فقط زمانی پاسخ می‌دهد که @mention شده باشد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های guild، پاسخ‌های نهایی معمول دستیار به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل‌مشاهده Discord باید صریحاً با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض در پس‌زمینه بماند و فقط وقتی تصمیم می‌گیرد پاسخ کانال مفید است پست کند.

    این یعنی مدل انتخاب‌شده باید بتواند ابزارها را به‌صورت قابل‌اعتماد فراخوانی کند. اگر Discord حالت تایپ کردن را نشان می‌دهد و لاگ‌ها مصرف توکن را نشان می‌دهند اما هیچ پیامی پست نمی‌شود، لاگ نشست را برای متن دستیار با `didSendViaMessagingTool: false` بررسی کنید. این یعنی مدل به‌جای فراخوانی `message(action=send)` یک پاسخ نهایی خصوصی تولید کرده است. به یک مدل قوی‌تر در tool-calling تغییر دهید، یا از config زیر استفاده کنید تا پاسخ‌های نهایی خودکار legacy را بازیابی کنید.

    <Tabs>
      <Tab title="Ask your agent">
        > «به عامل من اجازه بده در این سرور بدون نیاز به @mention شدن پاسخ دهد»
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

        برای بازیابی پاسخ‌های نهایی خودکار legacy برای اتاق‌های گروه/کانال، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های guild به‌صورت خودکار MEMORY.md را بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="Ask your agent">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به context بلندمدت از MEMORY.md نیاز داشتی از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="Manual">
        اگر در هر کانال به context مشترک نیاز دارید، دستورهای پایدار را در `AGENTS.md` یا `USER.md` بگذارید (آن‌ها برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای memory به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال روی سرور Discord خود بسازید و چت را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست جداگانه خودش را می‌گیرد — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با جریان کاری شما سازگار است راه‌اندازی کنید.

## مدل runtime

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ گیلد/کانال Discord به‌عنوان زمینهٔ غیرقابل‌اعتماد به اعلان مدل اضافه می‌شود،
  نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن پوشش را دوباره کپی کند،
  OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل (`agent:main:main`) را به‌اشتراک می‌گذارند.
- کانال‌های گیلد کلیدهای نشست ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- دستورهای اسلش بومی در نشست‌های دستور ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان‌های Cron/Heartbeat فقط متنی به Discord از پاسخ نهایی
  قابل‌مشاهده برای دستیار یک‌بار استفاده می‌کند. بارهای رسانه‌ای و مؤلفه‌های ساختاریافته
  وقتی عامل چند بار قابل‌تحویل تولید می‌کند همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته‌ای را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- برای ایجاد خودکار یک رشته، پیامی به والد انجمن (`channel:<forumId>`) بفرستید. عنوان رشته از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- برای ایجاد مستقیم یک رشته از `openclaw message thread create` استفاده کنید. برای کانال‌های انجمن `--message-id` را پاس ندهید.

مثال: ارسال به والد انجمن برای ایجاد یک رشته

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ایجاد صریح یک رشتهٔ انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته (`channel:<threadId>`) ارسال کنید.

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفهٔ Discord نسخهٔ ۲ برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با بار `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب واحد را مجاز می‌کنند
- نوع‌های انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضا چندبار استفاده شوند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی دکمه کلیک کند، `allowedUsers` را روی همان دکمه تنظیم کنید (شناسه‌های کاربری Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شده باشد، کاربران نامطابق یک رد موقت دریافت می‌کنند.

دستورهای اسلش `/model` و `/models` یک انتخابگر مدل تعاملی با فهرست‌های کشویی ارائه‌دهنده، مدل و زمان‌اجرای سازگار به‌همراه مرحلهٔ ارسال باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخابگر موقت است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند. منوهای انتخاب Discord به ۲۵ گزینه محدودند، بنابراین وقتی می‌خواهید انتخابگر فقط مدل‌های کشف‌شدهٔ پویا را برای ارائه‌دهندگان منتخب مانند `openai-codex` یا `vllm` نشان دهد، ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` فراهم کنید (یک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابق باشد، برای بازنویسی نام بارگذاری از `filename` استفاده کنید

فرم‌های مودال:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw یک دکمهٔ راه‌انداز را به‌طور خودکار اضافه می‌کند

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
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    اولویت چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - منشن `<@id>`

    شناسه‌های عددی بدون پیشوند معمولاً وقتی پیش‌فرض کانال فعال باشد به‌عنوان شناسهٔ کانال resolve می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب برای سازگاری به‌عنوان اهداف DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="گروه‌های دسترسی">
    DMهای Discord و مجوزدهی دستور متنی می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی بین کانال‌های پیام مشترک هستند. برای گروهی ایستا که اعضای آن در نحو عادی `allowFrom` هر کانال بیان می‌شوند از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌طور پویا تعریف کنند از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست اعضای جداگانه ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو گیلد پیکربندی‌شده است و در حال حاضر پس از اعمال نقش‌ها و بازنویسی‌های کانال، مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    مثال: به هر کسی که می‌تواند `#maintainers` را ببیند اجازه دهید به ربات DM بدهد، در حالی که DMها برای همهٔ افراد دیگر بسته می‌مانند.

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

    جست‌وجوها در صورت شکست بسته می‌مانند. اگر Discord مقدار `Missing Access` را برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال به گیلدی متفاوت تعلق داشته باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، در Discord Developer Portal گزینهٔ **Server Members Intent** را برای ربات فعال کنید. DMها وضعیت عضو گیلد را شامل نمی‌شوند، بنابراین OpenClaw عضو را در زمان مجوزدهی از طریق Discord REST resolve می‌کند.

  </Tab>

  <Tab title="سیاست گیلد">
    مدیریت گیلد توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط مبنای امن وقتی `channels.discord` وجود دارد `allowlist` است.

    رفتار `allowlist`:

    - گیلد باید با `channels.discord.guilds` مطابق باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابق باشند مجازند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر یک گیلد `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک گیلد بلوک `channels` نداشته باشد، همهٔ کانال‌های آن گیلدِ در فهرست مجاز اجازه دارند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` ایجاد نکنید، fallback زمان اجرا `groupPolicy="allowlist"` خواهد بود (با هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="منشن‌ها و DMهای گروهی">
    پیام‌های گیلد به‌طور پیش‌فرض پشت دروازهٔ منشن قرار دارند.

    تشخیص منشن شامل موارد زیر است:

    - منشن صریح ربات
    - الگوهای منشن پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback برابر `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به ربات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو canonical منشن استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از فرم منشن نام مستعار قدیمی `<@!USER_ID>` استفاده نکنید.

    `requireMention` به‌ازای هر گیلد/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که کاربر/نقش دیگری غیر از ربات را منشن می‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی عامل بر اساس نقش

برای مسیریابی اعضای گیلد Discord به عامل‌های متفاوت بر اساس شناسهٔ نقش، از `bindings[].match.roles` استفاده کنید. اتصال‌های مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از اتصال‌های peer یا parent-peer و پیش از اتصال‌های فقط گیلد ارزیابی می‌شوند. اگر یک اتصال فیلدهای match دیگری را هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابق باشند.

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

## دستورهای بومی و احراز مجوز دستور

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی فرمان‌های اسلش Discord را هنگام راه‌اندازی رد می‌کند. فرمان‌هایی که قبلا ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف نکنید، همچنان در Discord دیده شوند.
- احراز هویت فرمان‌های بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که در مدیریت عادی پیام‌ها به کار می‌روند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند دیده شوند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای فهرست فرمان‌ها و رفتار آن‌ها، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض فرمان اسلش:

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

    نکته: `off` رشته‌سازی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه مرجع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای آن نوبت متصل می‌کند.
    `batched` فقط زمانی مرجع پاسخ بومی ضمنی Discord را متصل می‌کند که
    نوبت ورودی یک دسته تاخیرزدایی‌شده از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتا برای گفتگوهای مبهم و رگباری می‌خواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایان می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هم‌زمان با رسیدن متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming` مقادیر `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش نگه می‌دارد و آن را تا تحویل نهایی با پیشرفت ابزار به‌روزرسانی می‌کند؛ برچسب آغازگر مشترک یک خط چرخان است، بنابراین پس از ظاهر شدن کار کافی، مانند بقیه محتوا از دید خارج می‌شود. `streamMode` یک نام مستعار زمان‌اجرای قدیمی است. برای بازنویسی پیکربندی ذخیره‌شده به کلید canonical، `openclaw doctor --fix` را اجرا کنید.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` بگذارید. اگر پخش بلوکی Discord به‌صراحت فعال شده باشد، OpenClaw برای جلوگیری از پخش دوگانه از جریان پیش‌نمایش صرف‌نظر می‌کند.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` هم‌زمان با رسیدن توکن‌ها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی به اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، با سقف `textChunkLimit`).
    - رسانه، خطا، و پاسخ‌های نهایی صریح، ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - ردیف‌های ابزار/پیشرفت در صورت وجود، به‌صورت ایموجی فشرده + عنوان + جزئیات نمایش داده می‌شوند، برای مثال `🛠️ Bash: run tests` یا `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات فرمان/اجرا را در خطوط پیشرفت فشرده کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام فرمان/اجرا را پنهان کنید و هم‌زمان خطوط پیشرفت فشرده را نگه دارید:

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

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی پخش `block` به‌صراحت فعال باشد، OpenClaw برای جلوگیری از پخش دوگانه از جریان پیش‌نمایش صرف‌نظر می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، زمینه، و رفتار رشته">
    زمینه تاریخچه Guild:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌صورت نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند، مگر اینکه بازنویسی شده باشد.
    - نشست‌های رشته، انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان fallback مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی رشته همچنان اولویت دارند و تاریخچه transcript والد کپی نمی‌شود مگر اینکه ارث‌بری transcript فعال شده باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای seed شدن از transcript والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند اهداف DM به‌شکل `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام fallback فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل حذف زمینه تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های مقید به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به هدف نشست مقید کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست، از جمله نشست‌های زیرعامل، مسیریابی شوند.

    فرمان‌ها:

    - `/focus <target>` رشته فعلی/جدید را به هدف زیرعامل/نشست مقید می‌کند
    - `/unfocus` مقیدسازی رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت مقیدسازی را نشان می‌دهد
    - `/session idle <duration|off>` auto-unfocus ناشی از غیرفعالی برای مقیدسازی‌های focused را بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر سن سخت برای مقیدسازی‌های focused را بررسی/به‌روزرسانی می‌کند

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
    - `spawnSessions` ایجاد/مقیدسازی خودکار رشته‌ها را برای `sessions_spawn({ thread: true })` و spawn رشته ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه زیرعامل بومی را برای spawn‌های مقید به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` با `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر مقیدسازی رشته برای یک حساب غیرفعال باشد، `/focus` و عملیات مرتبط مقیدسازی رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="مقیدسازی‌های کانال ACP پایدار">
    برای فضاهای کاری ACP پایدار و "always-on"، مقیدسازی‌های ACP تایپ‌شده در سطح بالا را که گفتگوهای Discord را هدف می‌گیرند پیکربندی کنید.

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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان‌جا مقید می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته، مقیدسازی کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته مقید، `/new` و `/reset` همان نشست ACP را در همان‌جا reset می‌کنند. مقیدسازی‌های موقت رشته می‌توانند تا زمانی که فعال هستند resolve کردن هدف را بازنویسی کنند.
    - `spawnSessions` ایجاد/مقیدسازی رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار مقیدسازی، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستم تبدیل می‌شوند و به نشست Discord مسیریابی‌شده متصل می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw یک ایموجی تأیید دریافت ارسال می‌کند.

    ترتیب resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی unicode یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های پیکربندی">
    نوشتن‌های پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال هستند.

    این بر جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های فرمان فعال باشند).

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
    ترافیک WebSocket مربوط به Discord gateway و lookupهای REST هنگام راه‌اندازی (شناسه برنامه + resolve فهرست مجاز) را از طریق یک پراکسی HTTP(S) با `channels.discord.proxy` مسیریابی کنید.

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
    resolve کردن PluralKit را فعال کنید تا پیام‌های proxied به هویت عضو سیستم نگاشت شوند:

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
    - نام‌های نمایشی عضو فقط زمانی با name/slug مطابقت داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true`
    - lookupها از شناسه پیام اصلی استفاده می‌کنند و با پنجره زمانی محدود می‌شوند
    - اگر lookup ناموفق باشد، پیام‌های proxied به‌عنوان پیام bot در نظر گرفته و drop می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها به منشن‌های خروجی قطعی برای کاربران شناخته‌شده Discord نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handleها بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و منشن‌های داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

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

  <Accordion title="پیکربندی Presence">
    به‌روزرسانی‌های Presence زمانی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت تنظیم کنید، یا وقتی auto presence را فعال کنید.

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

    مثال Streaming:

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

    نقشه نوع فعالیت:

    - 0: در حال بازی
    - 1: در حال استریم (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (متن فعالیت را به‌عنوان وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
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

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، کاهش‌یافته یا نامشخص => بیکار، تمام‌شده یا دردسترس‌نبودن => مزاحم نشوید. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌گیر `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در پیام‌های خصوصی پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری درخواست‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    Discord وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل حل باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، تأییدهای اجرایی بومی را به‌طور خودکار فعال می‌کند. Discord تأییدکنندگان اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال‌کردن صریح Discord به‌عنوان یک کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مخصوص مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw درخواست‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده یک مسیر مالک Discord داشته باشد، ابتدا پیام خصوصی Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک در دسترس از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، درخواست تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان حل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. درخواست‌های تأیید متن فرمان را شامل می‌شوند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل از طریق پیام خصوصی برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترک مورد استفاده سایر کانال‌های چت را رندر می‌کند. آداپتر بومی Discord عمدتاً مسیریابی پیام خصوصی تأییدکننده و انتشار در کانال را اضافه می‌کند.
    وقتی این دکمه‌ها وجود داشته باشند، تجربه کاربری اصلی تأیید هستند؛ OpenClaw
    فقط زمانی باید یک فرمان دستی `/approve` را شامل کند که نتیجه ابزار بگوید
    تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید بومی Discord فعال نباشد، OpenClaw درخواست
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت بومی به هیچ مقصدی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان چت با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، تعدیل، حضور، و اقدام‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- تعدیل: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` می‌پذیرد (URL یا مسیر فایل محلی) تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه اقدام                                                                                                                                                              | پیش‌فرض |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| واکنش‌ها، پیام‌ها، رشته‌ها، پین‌ها، نظرسنجی‌ها، جست‌وجو، اطلاعات عضو، اطلاعات نقش، اطلاعات کانال، کانال‌ها، وضعیت صوتی، رویدادها، استیکرها، بارگذاری ایموجی، بارگذاری استیکر، مجوزها | فعال    |
| نقش‌ها                                                                                                                                                                  | غیرفعال |
| تعدیل                                                                                                                                                                   | غیرفعال |
| حضور                                                                                                                                                                    | غیرفعال |

## رابط کاربری مؤلفه‌های v2

OpenClaw برای تأییدهای اجرا و نشانگرهای میان‌بافتی از مؤلفه‌های Discord v2 استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` را بپذیرند (پیشرفته؛ نیازمند ساخت payload مؤلفه از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکید مورد استفاده کانتینرهای مؤلفه Discord را تنظیم می‌کند (hex).
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

## صوت

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بی‌درنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موجی). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی فهرست‌های مجاز نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با حوزه‌های `bot` و `applications.commands` دعوت کنید.
4. مجوزهای Connect، Speak، Send Messages، و Read Message History را در کانال صوتی مقصد اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان فهرست مجاز و قواعد سیاست گروهی سایر فرمان‌های Discord را دنبال می‌کند.

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
        model: "openai-codex/gpt-5.5",
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
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

نکات:

- `voice.tts` فقط برای پخش صوتی `stt-tts`، مقدار `messages.tts` را بازنویسی می‌کند. حالت‌های Realtime از `voice.realtime.voice` استفاده می‌کنند.
- `voice.mode` مسیر مکالمه را کنترل می‌کند. مقدار پیش‌فرض `agent-proxy` است: یک پیشانهٔ صوتی Realtime زمان‌بندی نوبت، وقفه و پخش را مدیریت می‌کند، کارهای محتوایی را از طریق `openclaw_agent_consult` به عامل مسیریابی‌شدهٔ OpenClaw واگذار می‌کند، و نتیجه را مانند یک اعلان تایپ‌شدهٔ Discord از همان گوینده در نظر می‌گیرد. `stt-tts` جریان قدیمی‌تر STT دسته‌ای به‌همراه TTS را نگه می‌دارد. `bidi` اجازه می‌دهد مدل Realtime مستقیماً گفتگو کند، درحالی‌که `openclaw_agent_consult` را برای مغز OpenClaw در دسترس می‌گذارد.
- `voice.agentSession` کنترل می‌کند کدام مکالمهٔ OpenClaw نوبت‌های صوتی را دریافت کند. آن را تنظیم‌نشده بگذارید تا از نشست خود کانال صوتی استفاده شود، یا `{ mode: "target", target: "channel:<text-channel-id>" }` را تنظیم کنید تا کانال صوتی به‌عنوان افزونهٔ میکروفون/بلندگوی یک نشست موجود کانال متنی Discord مانند `#maintainers` عمل کند.
- `voice.model` مغز عامل OpenClaw را برای پاسخ‌های صوتی Discord و مشورت‌های Realtime بازنویسی می‌کند. آن را تنظیم‌نشده بگذارید تا مدل عامل مسیریابی‌شده را به ارث ببرد. این گزینه از `voice.realtime.model` جدا است.
- `agent-proxy` گفتار را از طریق `discord-voice` مسیریابی می‌کند؛ این مسیر مجوزهای معمول مالک/ابزار را برای گوینده و نشست هدف حفظ می‌کند، اما ابزار `tts` عامل را پنهان می‌کند، چون صوت Discord مالک پخش است. به‌طور پیش‌فرض، `agent-proxy` برای گویندگان مالک دسترسی کامل ابزار هم‌ارز مالک را به مشورت می‌دهد (`voice.realtime.toolPolicy: "owner"`) و به‌شدت ترجیح می‌دهد پیش از پاسخ‌های محتوایی با عامل OpenClaw مشورت کند (`voice.realtime.consultPolicy: "always"`). در حالت پیش‌فرض `always`، لایهٔ Realtime پیش از پاسخ مشورت به‌صورت خودکار حرف‌های پرکننده پخش نمی‌کند؛ گفتار را ضبط و رونویسی می‌کند، سپس پاسخ مسیریابی‌شدهٔ OpenClaw را می‌خواند. اگر چند پاسخ مشورت اجباری درحالی کامل شوند که Discord هنوز پاسخ اول را پخش می‌کند، پاسخ‌های گفتار دقیق بعدی به‌جای جایگزین‌کردن گفتار در میانهٔ جمله، تا بیکار شدن پخش در صف می‌مانند.
- در حالت `stt-tts`، STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثری ندارد.
- در حالت‌های Realtime، `voice.realtime.provider`، `voice.realtime.model` و `voice.realtime.voice` نشست صوتی Realtime را پیکربندی می‌کنند. برای OpenAI Realtime 2 به‌همراه مغز Codex، از `voice.realtime.model: "gpt-realtime-2"` و `voice.model: "openai-codex/gpt-5.5"` استفاده کنید.
- ارائه‌دهندهٔ Realtime متعلق به OpenAI نام رویدادهای فعلی Realtime 2 و نام‌های مستعار قدیمی سازگار با Codex را برای رویدادهای صدای خروجی و رونویسی می‌پذیرد، بنابراین snapshotهای سازگار ارائه‌دهنده می‌توانند بدون حذف صدای دستیار تغییر کنند.
- `voice.realtime.bargeIn` کنترل می‌کند آیا رویدادهای شروع گفتار گوینده در Discord پخش فعال Realtime را قطع کنند یا نه. اگر تنظیم نشود، از تنظیم وقفهٔ صدای ورودی ارائه‌دهندهٔ Realtime پیروی می‌کند.
- `voice.realtime.minBargeInAudioEndMs` حداقل مدت پخش دستیار را پیش از آن‌که barge-in در Realtime متعلق به OpenAI صدا را کوتاه کند کنترل می‌کند. پیش‌فرض: `250`. برای وقفهٔ فوری در اتاق‌های با پژواک کم، `0` را تنظیم کنید، یا برای چیدمان‌های بلندگوی پرپژواک آن را افزایش دهید.
- برای استفاده از صدای OpenAI در پخش Discord، `voice.tts.provider: "openai"` را تنظیم کنید و یک صدای Text-to-speech را زیر `voice.tts.openai.voice` یا `voice.tts.providers.openai.voice` انتخاب کنید. `cedar` در مدل فعلی TTS متعلق به OpenAI گزینهٔ خوبی با حس صدای مردانه است.
- بازنویسی‌های `systemPrompt` مخصوص هر کانال Discord برای نوبت‌های رونویسی صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی وضعیت مالک را از `allowFrom` متعلق به Discord (یا `dm.allowFrom`) استخراج می‌کنند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط‌مالک دسترسی داشته باشند، برای مثال `gateway` و `cron`.
- صوت Discord برای پیکربندی‌های فقط‌متن انتخابی است؛ برای فعال‌کردن فرمان‌های `/vc`، runtime صوتی و intent مربوط به Gateway با نام `GuildVoiceStates`، مقدار `channels.discord.voice.enabled=true` را تنظیم کنید، یا یک بلوک موجود `channels.discord.voice` را نگه دارید.
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صراحتاً بازنویسی کند. آن را تنظیم‌نشده بگذارید تا intent از فعال‌بودن مؤثر صوت پیروی کند.
- اگر `voice.autoJoin` چند ورودی برای یک guild داشته باشد، OpenClaw به آخرین کانال پیکربندی‌شده برای آن guild می‌پیوندد.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های join در `@discordjs/voice` منتقل می‌شوند.
- پیش‌فرض‌های `@discordjs/voice` در صورت تنظیم‌نشدن، `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw برای دریافت صوت Discord به‌طور پیش‌فرض از رمزگشای pure-JS با نام `opusscript` استفاده می‌کند. بستهٔ native اختیاری `@discordjs/opus` طبق سیاست نصب pnpm مخزن نادیده گرفته می‌شود تا نصب‌های عادی، مسیرهای Docker و آزمون‌های نامرتبط یک native addon را کامپایل نکنند. میزبان‌های اختصاصی کارایی صوت می‌توانند پس از نصب native addon با `OPENCLAW_DISCORD_OPUS_DECODER=native` آن را فعال کنند.
- `voice.connectTimeoutMs` انتظار اولیهٔ Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های auto-join کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع‌شدن یک نشست صوتی چه مدت برای شروع reconnect صبر کند، پیش از آن‌که آن را نابود کند. پیش‌فرض: `15000`.
- در حالت `stt-tts`، پخش صوت فقط به‌خاطر شروع صحبت کاربر دیگر متوقف نمی‌شود. برای جلوگیری از چرخه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوت جدید را نادیده می‌گیرد؛ برای نوبت بعدی پس از پایان پخش صحبت کنید. حالت‌های Realtime شروع گفتار گوینده را به‌عنوان سیگنال‌های barge-in به ارائه‌دهندهٔ Realtime ارسال می‌کنند.
- در حالت‌های Realtime، پژواک بلندگوها در یک میکروفون باز می‌تواند شبیه barge-in به نظر برسد و پخش را قطع کند. برای اتاق‌های Discord پرپژواک، `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید تا OpenAI روی صدای ورودی به‌صورت خودکار وقفه ایجاد نکند. اگر همچنان می‌خواهید رویدادهای شروع گفتار گوینده در Discord پخش فعال را قطع کنند، `voice.realtime.bargeIn: true` را اضافه کنید. پل Realtime متعلق به OpenAI کوتاه‌سازی‌های پخش کوتاه‌تر از `voice.realtime.minBargeInAudioEndMs` را به‌عنوان پژواک/نویز محتمل نادیده می‌گیرد و به‌جای پاک‌کردن پخش Discord، آن‌ها را به‌عنوان ردشده ثبت می‌کند.
- `voice.captureSilenceGraceMs` کنترل می‌کند پس از آن‌که Discord گزارش می‌دهد گوینده متوقف شده است، OpenClaw چه مدت پیش از نهایی‌کردن آن قطعهٔ صوتی برای STT صبر کند. پیش‌فرض: `2500`؛ اگر Discord مکث‌های عادی را به رونویسی‌های جزئی و بریده‌بریده تقسیم می‌کند، این مقدار را افزایش دهید.
- وقتی ElevenLabs ارائه‌دهندهٔ TTS انتخاب‌شده باشد، پخش صوت Discord از TTS جریانی استفاده می‌کند و از stream پاسخ ارائه‌دهنده شروع می‌شود. ارائه‌دهندگانی که از streaming پشتیبانی نمی‌کنند، به مسیر فایل موقت سنتزشده برمی‌گردند.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از خطاهای تکراری در یک بازهٔ کوتاه، با ترک‌کردن و پیوستن دوباره به کانال صوتی خودکار بازیابی می‌شود.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط bundled مربوط به `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 در discord.js است که issue #11419 در discord.js را بست.
- رویدادهای دریافت `The operation was aborted` زمانی که OpenClaw یک قطعهٔ ضبط‌شدهٔ گوینده را نهایی می‌کند مورد انتظار هستند؛ این‌ها تشخیص‌های پرجزئیات‌اند، نه هشدار.
- لاگ‌های پرجزئیات صوت Discord برای هر قطعهٔ پذیرفته‌شدهٔ گوینده یک پیش‌نمایش محدود یک‌خطی از رونویسی STT دارند، بنابراین اشکال‌زدایی هم سمت کاربر و هم سمت پاسخ عامل را بدون تخلیهٔ متن رونویسی نامحدود نشان می‌دهد.
- در حالت `agent-proxy`، fallback مشورت اجباری قطعه‌های رونویسی احتمالاً ناقص را رد می‌کند، مانند متنی که به `...` ختم می‌شود یا یک اتصال‌دهندهٔ پایانی مثل `and` دارد، به‌علاوهٔ پایان‌بندی‌های آشکارا غیرقابل‌اقدام مانند «الان برمی‌گردم» یا «خداحافظ». وقتی این کار مانع یک پاسخ صف‌شدهٔ stale شود، لاگ‌ها `forced agent consult skipped reason=...` را نشان می‌دهند.

راه‌اندازی opus native برای checkoutهای منبع:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

وقتی native addon از پیش ساخته‌شدهٔ بالادستی macOS arm64 را می‌خواهید، برای Gateway از Node 22 استفاده کنید. اگر از runtime دیگری برای Node استفاده می‌کنید، نصب‌کنندهٔ opt-in ممکن است به toolchain ساخت محلی `node-gyp` نیاز داشته باشد.

پس از نصب native addon، Gateway را با این دستور شروع کنید:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

لاگ‌های پرجزئیات صوت باید `discord voice: opus decoder: @discordjs/opus` را نشان دهند. بدون فعال‌سازی env، یا اگر native addon وجود نداشته باشد یا روی میزبان بارگذاری نشود، OpenClaw مقدار `discord voice: opus decoder: opusscript` را لاگ می‌کند و دریافت صوت را از طریق fallback با pure-JS ادامه می‌دهد.

خط لولهٔ STT به‌همراه TTS:

- ضبط PCM متعلق به Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` مدیریت STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونویسی از طریق ingress و routing مربوط به Discord ارسال می‌شود، درحالی‌که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگشتی را می‌خواهد، چون صوت Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` merge می‌شود؛ ارائه‌دهندگان دارای قابلیت streaming مستقیماً player را تغذیه می‌کنند، وگرنه فایل صوتی حاصل در کانال متصل‌شده پخش می‌شود.

نمونهٔ نشست پیش‌فرض کانال صوتی agent-proxy:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

بدون بلوک `voice.agentSession`، هر کانال صوتی نشست مسیریابی‌شدهٔ OpenClaw خودش را می‌گیرد. برای مثال، `/vc join channel:234567890123456789` با نشست همان کانال صوتی Discord صحبت می‌کند. مدل Realtime فقط پیشانهٔ صوتی است؛ درخواست‌های محتوایی به عامل پیکربندی‌شدهٔ OpenClaw سپرده می‌شوند. اگر مدل Realtime بدون فراخوانی ابزار consult یک رونویسی نهایی تولید کند، OpenClaw مشورت را به‌عنوان fallback اجباری می‌کند تا رفتار پیش‌فرض همچنان مانند صحبت‌کردن با عامل باشد.

نمونهٔ قدیمی STT به‌همراه TTS:

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

نمونهٔ bidi در Realtime:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

صوت به‌عنوان افزونهٔ نشست یک کانال موجود Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

در حالت `agent-proxy`، ربات به کانال صوتی پیکربندی‌شده می‌پیوندد، اما نوبت‌های عامل OpenClaw از نشست و عامل مسیریابی‌شدهٔ معمول کانال هدف استفاده می‌کنند. نشست صوتی Realtime نتیجهٔ بازگشتی را دوباره در کانال صوتی می‌خواند. عامل supervisor همچنان می‌تواند طبق سیاست ابزار خود از ابزارهای معمول پیام استفاده کند، از جمله ارسال یک پیام جداگانهٔ Discord اگر اقدام درست همان باشد.

فرم‌های هدف مفید:

- `target: "channel:123456789012345678"` از طریق نشست کانال متنی Discord مسیریابی می‌کند.
- `target: "123456789012345678"` به‌عنوان هدف کانال در نظر گرفته می‌شود.
- `target: "dm:123456789012345678"` یا `target: "user:123456789012345678"` از طریق همان نشست پیام مستقیم مسیریابی می‌کند.

نمونهٔ OpenAI Realtime برای محیط‌های پرپژواک:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

از این پیکربندی زمانی استفاده کنید که مدل پخش صدای خودش در Discord را از طریق میکروفون باز می‌شنود، اما همچنان می‌خواهید با صحبت کردن آن را قطع کنید. OpenClaw جلوی قطع خودکار OpenAI بر اساس صدای ورودی خام را می‌گیرد، در حالی که `bargeIn: true` اجازه می‌دهد رویدادهای شروع صحبت در بلندگوی Discord و صدای بلندگوی از قبل فعال، پاسخ‌های بلادرنگ فعال را پیش از رسیدن نوبت ضبط‌شده بعدی به OpenAI لغو کنند. سیگنال‌های بسیار زودهنگام ورود به صحبت با `audioEndMs` کمتر از `minBargeInAudioEndMs` به‌عنوان پژواک/نویز محتمل در نظر گرفته و نادیده گرفته می‌شوند تا مدل در اولین فریم پخش قطع نشود.

لاگ‌های صوتی مورد انتظار:

- هنگام پیوستن: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- هنگام شروع بلادرنگ: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- هنگام صدای بلندگو: `discord voice: realtime speaker turn opened ...`، `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- هنگام گفتار کهنه ردشده: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` یا `reason=non-actionable-closing ...`
- هنگام تکمیل پاسخ بلادرنگ: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- هنگام توقف/بازنشانی پخش: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- هنگام مشاوره بلادرنگ: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- هنگام پاسخ عامل: `discord voice: agent turn answer ...`
- هنگام گفتار دقیق صف‌شده: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، به‌دنبال آن `discord voice: realtime exact speech dequeued reason=player-idle ...`
- هنگام تشخیص ورود به صحبت: `discord voice: realtime barge-in detected source=speaker-start ...` یا `discord voice: realtime barge-in detected source=active-speaker-audio ...`، به‌دنبال آن `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- هنگام قطع بلادرنگ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، به‌دنبال آن یا `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` یا `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- هنگام نادیده گرفتن پژواک/نویز: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- هنگام غیرفعال بودن ورود به صحبت: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- هنگام پخش بی‌کار: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

برای عیب‌یابی صدای قطع‌شده، لاگ‌های صدای بلادرنگ را مانند یک خط زمانی بخوانید:

1. `realtime audio playback started` یعنی Discord پخش صدای دستیار را آغاز کرده است. پل از این نقطه شمارش قطعه‌های خروجی دستیار، بایت‌های PCM مربوط به Discord، بایت‌های بلادرنگ ارائه‌دهنده، و مدت صدای سنتزشده را شروع می‌کند.
2. `realtime speaker turn opened` فعال شدن یک گوینده Discord را مشخص می‌کند. اگر پخش از قبل فعال باشد و `bargeIn` فعال شده باشد، این مورد می‌تواند با `barge-in detected source=speaker-start` دنبال شود.
3. `realtime input audio started` اولین فریم صوتی واقعی دریافت‌شده برای آن نوبت گوینده را مشخص می‌کند. `outputActive=true` یا یک `outputAudioMs` غیرصفر در اینجا یعنی میکروفون در حالی ورودی ارسال می‌کند که پخش دستیار هنوز فعال است.
4. `barge-in detected source=active-speaker-audio` یعنی OpenClaw هنگام فعال بودن پخش دستیار، صدای زنده گوینده را دیده است. این برای تشخیص یک قطع واقعی از رویداد شروع گوینده Discord بدون صدای مفید کاربرد دارد.
5. `barge-in requested reason=...` یعنی OpenClaw از ارائه‌دهنده بلادرنگ خواسته است پاسخ فعال را لغو یا کوتاه کند. این شامل `outputAudioMs`، `outputActive`، و `playbackChunks` است تا بتوانید ببینید پیش از قطع، چه مقدار از صدای دستیار واقعاً پخش شده بود.
6. `realtime audio playback stopped reason=...` نقطه بازنشانی پخش محلی Discord است. دلیل مشخص می‌کند چه چیزی پخش را متوقف کرده است: `barge-in`، `player-idle`، `provider-clear-audio`، `forced-agent-consult`، `stream-close`، یا `session-close`.
7. `realtime speaker turn closed` نوبت ورودی ضبط‌شده را خلاصه می‌کند. `chunks=0` یا `hasAudio=false` یعنی نوبت گوینده باز شد اما هیچ صدای قابل استفاده‌ای به پل بلادرنگ نرسید. `interruptedPlayback=true` یعنی آن نوبت ورودی با خروجی دستیار هم‌پوشانی داشته و منطق ورود به صحبت را فعال کرده است.

فیلدهای مفید:

- `outputAudioMs`: مدت صدای دستیار که پیش از خط لاگ توسط ارائه‌دهنده بلادرنگ تولید شده است.
- `audioMs`: مدت صدای دستیار که OpenClaw پیش از توقف پخش شمرده است.
- `elapsedMs`: زمان ساعت دیواری بین باز و بسته شدن جریان پخش یا نوبت گوینده.
- `discordBytes`: بایت‌های PCM استریو ۴۸ کیلوهرتز ارسال‌شده به یا دریافت‌شده از صدای Discord.
- `realtimeBytes`: بایت‌های PCM با قالب ارائه‌دهنده که به ارائه‌دهنده بلادرنگ ارسال یا از آن دریافت شده‌اند.
- `playbackChunks`: قطعه‌های صدای دستیار که برای پاسخ فعال به Discord فرستاده شده‌اند.
- `sinceLastAudioMs`: فاصله بین آخرین فریم صدای گوینده ضبط‌شده و بسته شدن نوبت گوینده.

الگوهای رایج:

- قطع فوری با `source=active-speaker-audio`، `outputAudioMs` کوچک، و همان کاربر در نزدیکی معمولاً به ورود پژواک بلندگو به میکروفون اشاره دارد. `voice.realtime.minBargeInAudioEndMs` را افزایش دهید، صدای بلندگو را کم کنید، از هدفون استفاده کنید، یا `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید.
- `source=speaker-start` که با `speaker turn closed ... hasAudio=false` دنبال می‌شود یعنی Discord شروع گوینده را گزارش کرده اما هیچ صدایی به OpenClaw نرسیده است. این می‌تواند یک رویداد گذرای صدای Discord، رفتار دروازه نویز، یا باز شدن بسیار کوتاه میکروفون توسط کلاینت باشد.
- `audio playback stopped reason=stream-close` بدون ورود به صحبت نزدیک یا `provider-clear-audio` یعنی جریان پخش محلی Discord به‌طور غیرمنتظره پایان یافته است. لاگ‌های قبلی ارائه‌دهنده و پخش‌کننده Discord را بررسی کنید.
- `capture ignored during playback (barge-in disabled)` یعنی OpenClaw عمداً ورودی را هنگام فعال بودن صدای دستیار کنار گذاشته است. اگر می‌خواهید گفتار پخش را قطع کند، `voice.realtime.bargeIn` را فعال کنید.
- `barge-in ignored ... outputActive=false` یعنی VAD مربوط به Discord یا ارائه‌دهنده گفتار را گزارش کرده، اما OpenClaw پخش فعالی برای قطع کردن نداشته است. این نباید صدا را قطع کند.

اعتبارنامه‌ها برای هر مؤلفه جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، احراز هویت TTS برای `messages.tts`/`voice.tts`، و احراز هویت ارائه‌دهنده بلادرنگ برای `voice.realtime.providers` یا پیکربندی احراز هویت عادی ارائه‌دهنده.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش شکل‌موج نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw شکل‌موج را به‌صورت خودکار تولید می‌کند، اما برای بازرسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در یک payload یکسان رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent را فعال کنید
    - وقتی به تشخیص کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، Gateway را بازراه‌اندازی کنید

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` را بررسی کنید
    - allowlist سرور را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` سرور وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای منشن را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون allowlist منطبق برای سرور/کانال
    - پیکربندی `requireMention` در جای نادرست (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist مربوط به `users` در سرور/کانال مسدود شده است

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    گزینه‌های صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار شنونده Gateway در Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord مهلت زمانی متعلق به کانال را روی نوبت‌های عامل صف‌شده اعمال نمی‌کند. شنونده‌های پیام فوراً واگذار می‌کنند، و اجرای‌های صف‌شده Discord ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/زمان اجرا کامل شود یا کار را متوقف کند حفظ می‌کنند.

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
    OpenClaw پیش از اتصال، فراداده Discord `/gateway/bot` را واکشی می‌کند. خرابی‌های گذرا به URL پیش‌فرض Gateway در Discord بازمی‌گردند و در لاگ‌ها محدودسازی نرخ می‌شوند.

    گزینه‌های مهلت زمانی فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - جایگزین env وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، بیشینه: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد زمان اجرا، منتظر رویداد Gateway با نام `READY` در Discord می‌ماند. راه‌اندازی‌های چندحسابه با فاصله‌گذاری شروع ممکن است به پنجره READY طولانی‌تری در زمان راه‌اندازی نسبت به پیش‌فرض نیاز داشته باشند.

    گزینه‌های مهلت زمانی READY:

    - راه‌اندازی تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - جایگزین env راه‌اندازی وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، بیشینه: `120000`
    - زمان اجرای تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - زمان اجرای چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - جایگزین env زمان اجرا وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض زمان اجرا: `30000` (۳۰ ثانیه)، بیشینه: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل تأیید کند.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` در انتظار تأیید جفت‌سازی است

  </Accordion>

  <Accordion title="Bot to bot loops">
    به‌طور پیش‌فرض پیام‌های نوشته‌شده توسط بات‌ها نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه‌ی منشن و فهرست مجاز استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که بات را منشن می‌کنند.

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord وجود داشته باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض بالادستی) شروع کنید و فقط در صورت نیاز تنظیمش کنید
    - لاگ‌ها را برای موارد زیر بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خطاها پس از پیوستن دوباره‌ی خودکار ادامه پیدا کردند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه‌ی دریافت DAVE بالادستی در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه‌ی شنونده), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- استریمینگ: `streaming` (نام مستعار قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (آپلودهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`), `retry`
- کنش‌ها: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ویژگی‌ها: `threadBindings`, سطح بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های بات را به‌عنوان اسرار در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های نظارت‌شده ترجیح داده می‌شود).
- حداقل مجوزهای لازم Discord را اعطا کنید.
- اگر استقرار/وضعیت فرمان قدیمی است، Gateway را دوباره راه‌اندازی کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار چت گروهی و فهرست مجاز.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
