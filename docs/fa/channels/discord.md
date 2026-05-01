---
read_when:
    - در حال کار روی ویژگی‌های کانال Discord
summary: وضعیت پشتیبانی ربات Discord، قابلیت‌ها و پیکربندی
title: Discord
x-i18n:
    generated_at: "2026-05-01T11:42:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43fdd86a45a815cfef7ab71746c9ca5966f76df3c9da4f18204bf5d0f59f6352
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های خصوصی و کانال‌های guild از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های خصوصی Discord به‌صورت پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی و فهرست فرمان‌ها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌ها و جریان تعمیر بین‌کانالی.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با bot بسازید، bot را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. توصیه می‌کنیم bot خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="یک برنامه و bot در Discord بسازید">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل "OpenClaw" برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را به هر نامی که برای عامل OpenClaw خود به‌کار می‌برید تنظیم کنید.

  </Step>

  <Step title="intentهای دارای امتیاز را فعال کنید">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (ضروری)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام به ID ضروری است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="توکن bot خود را کپی کنید">
    در صفحه **Bot** دوباره به بالا بروید و روی **Reset Token** کلیک کنید.

    <Note>
    با وجود نام آن، این کار نخستین توکن شما را تولید می‌کند — چیزی "reset" نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="یک URL دعوت بسازید و bot را به سرور خود اضافه کنید">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای اضافه کردن bot به سرورتان می‌سازید.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخشی با عنوان **Bot Permissions** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **General Permissions**
      - مشاهده کانال‌ها
    **Text Permissions**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی پیوندها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله جریان‌های کاری کانال forum یا media که یک رشته می‌سازند یا ادامه می‌دهند، **Send Messages in Threads** را نیز فعال کنید.
    URL تولیدشده در پایین را کپی کنید، آن را در مرورگر خود بچسبانید، سرور خود را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید bot خود را در سرور Discord ببینید.

  </Step>

  <Step title="Developer Mode را فعال کنید و IDهای خود را جمع‌آوری کنید">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید IDهای داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتار خود) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. در نوار کناری روی **آیکون سرور** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه پیام‌های خصوصی از اعضای سرور را بدهید">
    برای اینکه جفت‌سازی کار کند، Discord باید به bot شما اجازه دهد به شما پیام خصوصی بفرستد. روی **آیکون سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله botها) اجازه می‌دهد برای شما پیام خصوصی بفرستند. اگر می‌خواهید از پیام‌های خصوصی Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های guild استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های خصوصی را غیرفعال کنید.

  </Step>

  <Step title="توکن bot خود را به‌صورت امن تنظیم کنید (آن را در چت نفرستید)">
    توکن bot در Discord یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac متعلق به OpenClaw یا با توقف و راه‌اندازی دوباره فرایند `openclaw gateway run` راه‌اندازی مجدد کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از پوسته‌ای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند پس از راه‌اندازی مجدد env SecretRef را حل کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام شروع Discord مسدود یا محدودنرخ شده است، ID برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا شروع به‌کار بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند bot در Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="OpenClaw را پیکربندی و جفت کنید">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و این را به آن بگویید. اگر Discord نخستین کانال شماست، به‌جای آن از برگه CLI / config استفاده کنید.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
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

        جایگزین env برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقادیر متنی ساده `token` پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند bot در Discord، هر توکن bot و ID برنامه را زیر حساب خودش نگه دارید. `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، بنابراین فقط وقتی آن را آنجا تنظیم کنید که همه حساب‌ها باید از یک ID برنامه یکسان استفاده کنند.

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

  <Step title="نخستین جفت‌سازی پیام خصوصی را تأیید کنید">
    صبر کنید تا gateway در حال اجرا باشد، سپس در Discord به bot خود پیام خصوصی بدهید. با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        کد جفت‌سازی را در کانال موجود خود برای عاملتان بفرستید:

        > "Approve this Discord pairing code: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    کدهای جفت‌سازی پس از 1 ساعت منقضی می‌شوند.

    اکنون باید بتوانید در Discord از طریق پیام خصوصی با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
حل توکن نسبت به حساب آگاه است. مقادیر توکن در پیکربندی بر جایگزین env اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن bot یکسان حل شوند، OpenClaw فقط یک ناظر Gateway برای آن توکن راه‌اندازی می‌کند. توکن منشأگرفته از پیکربندی بر جایگزین env پیش‌فرض اولویت دارد؛ در غیر این صورت نخستین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار message/اقدام‌های کانال)، `token` صریح در هر فراخوانی برای همان فراخوانی استفاده می‌شود. این شامل اقدام‌های send و read/probe-style می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست/تلاش دوباره حساب همچنان از حساب انتخاب‌شده در عکس فوری runtime فعال می‌آیند.
</Note>

## توصیه‌شده: یک فضای کاری guild راه‌اندازی کنید

وقتی پیام‌های خصوصی کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل خودش را با زمینه خودش می‌گیرد. این برای سرورهای خصوصی که فقط شما و bot شما در آن هستید توصیه می‌شود.

<Steps>
  <Step title="سرور خود را به فهرست مجاز guild اضافه کنید">
    این کار به عامل شما اجازه می‌دهد در هر کانال روی سرورتان پاسخ دهد، نه فقط پیام‌های خصوصی.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "Add my Discord Server ID `<server_id>` to the guild allowlist"
      </Tab>
      <Tab title="پیکربندی">

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

  <Step title="اجازه پاسخ‌ها بدون @mention">
    به‌صورت پیش‌فرض، عامل شما فقط وقتی در کانال‌های guild پاسخ می‌دهد که @mentioned شده باشد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های guild، پاسخ‌های نهایی عادی دستیار به‌صورت پیش‌فرض خصوصی می‌مانند. خروجی قابل مشاهده Discord باید به‌صورت صریح با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌صورت پیش‌فرض در پس‌زمینه بماند و فقط وقتی پست کند که تشخیص دهد پاسخ کانالی مفید است.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="پیکربندی">
        `requireMention: false` را در پیکربندی guild خود تنظیم کنید:

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

        برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروهی/کانالی، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برای حافظه در کانال‌های guild برنامه‌ریزی کنید">
    به‌صورت پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام خصوصی بارگذاری می‌شود. کانال‌های guild، MEMORY.md را به‌صورت خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (آن‌ها برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود بسازید و چت را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست جداافتاده خودش را می‌گیرد — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با جریان کاری شما سازگار است راه‌اندازی کنید.

## مدل runtime

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ گیلد/کانال Discord به‌عنوان زمینهٔ نامطمئن به پرامپت مدل افزوده می‌شود، نه به‌عنوان پیشوند پاسخ قابل مشاهده برای کاربر. اگر مدل آن پاکت را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل را به‌اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های گیلد کلیدهای نشست جداگانه هستند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در نشست‌های فرمان جداگانه اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان‌های cron/heartbeat فقط‌متنی به Discord یک‌بار از پاسخ نهایی قابل مشاهده برای دستیار استفاده می‌کند. محموله‌های رسانه و مؤلفه‌های ساخت‌یافته وقتی عامل چند محمولهٔ قابل تحویل منتشر می‌کند، همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته‌ای را می‌پذیرند. OpenClaw از دو روش برای ساختن آن‌ها پشتیبانی می‌کند:

- برای ساخت خودکار یک رشته، پیامی به والد انجمن (`channel:<forumId>`) بفرستید. عنوان رشته از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- برای ساخت مستقیم یک رشته از `openclaw message thread create` استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

نمونه: ارسال به والد انجمن برای ساختن یک رشته

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

نمونه: ساخت صریح یک رشتهٔ انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته ارسال کنید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفه‌های v2 Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با محمولهٔ `components` استفاده کنید. نتیجه‌های تعامل به‌صورت پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های اقدام حداکثر ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌کنند
- نوع‌های انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضا چند بار قابل استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی یک دکمه کلیک کند، روی همان دکمه `allowedUsers` را تنظیم کنید (شناسه‌های کاربری Discord، تگ‌ها، یا `*`). در صورت پیکربندی، کاربران نامنطبق یک رد موقت دریافت می‌کنند.

فرمان‌های اسلش `/model` و `/models` یک انتخابگر تعاملی مدل با منوهای کشویی ارائه‌دهنده، مدل، و runtime سازگار به‌همراه مرحلهٔ ارسال باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، پیام منسوخ‌بودن برمی‌گرداند. پاسخ انتخابگر موقت است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` فراهم کنید (تک‌فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابق باشد، برای بازنویسی نام بارگذاری از `filename` استفاده کنید

فرم‌های مودال:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw به‌طور خودکار یک دکمهٔ راه‌انداز اضافه می‌کند

نمونه:

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
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` allowlist متعارف DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    تقدم چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط روی حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی تقدم دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` هرگاه بتواند این کار را بدون تغییر دسترسی انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب مقصد DM برای تحویل:

    - `user:<id>`
    - اشارهٔ `<@id>`

    شناسه‌های عددی بدون پیشوند معمولاً وقتی یک پیش‌فرض کانال فعال باشد، به‌عنوان شناسهٔ کانال حل می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان مقصدهای DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت گیلد با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    مبنای امن وقتی `channels.discord` وجود داشته باشد، `allowlist` است.

    رفتار `allowlist`:

    - گیلد باید با `channels.discord.guilds` مطابق باشد (`id` ترجیح دارد، slug پذیرفته می‌شود)
    - allowlistهای فرستندهٔ اختیاری: `users` (شناسه‌های پایدار توصیه می‌شود) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابق باشند مجاز هستند
    - تطبیق مستقیم نام/تگ به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/تگ‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ وقتی ورودی‌های نام/تگ استفاده شوند، `openclaw security audit` هشدار می‌دهد
    - اگر یک گیلد `channels` را پیکربندی کرده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک گیلد بلوک `channels` نداشته باشد، همهٔ کانال‌های آن گیلدِ allowlistشده مجاز هستند

    نمونه:

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` خواهد بود (با هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های گیلد به‌طور پیش‌فرض با اشاره کنترل می‌شوند.

    تشخیص اشاره شامل موارد زیر است:

    - اشارهٔ صریح به بات
    - الگوهای اشارهٔ پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ‌به-بات در موارد پشتیبانی‌شده

    `requireMention` برای هر گیلد/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقش دیگری اشاره می‌کنند اما به بات اشاره نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - allowlist اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا slugهای کانال)

  </Tab>
</Tabs>

### مسیریابی عامل بر پایهٔ نقش

برای مسیریابی اعضای گیلد Discord به عامل‌های مختلف بر اساس شناسهٔ نقش، از `bindings[].match.roles` استفاده کنید. bindingهای مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از bindingهای همتا یا والد-همتا و پیش از bindingهای فقط‌گیلد ارزیابی می‌شوند. اگر یک binding فیلدهای تطبیق دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابق باشند.

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

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال می‌شود.
- بازنویسی هر کانال: `channels.discord.commands.native`.
- `commands.native=false` فرمان‌های بومی Discord را که قبلاً ثبت شده‌اند، صریحاً پاک می‌کند.
- احراز مجوز فرمان بومی از همان allowlistها/سیاست‌های Discord استفاده می‌کند که مدیریت پیام عادی استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در UI Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز مجوز OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای فهرست و رفتار فرمان‌ها، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض فرمان اسلش:

- `ephemeral: true`

## جزئیات قابلیت

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord از تگ‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    با `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌سازی پاسخ ضمنی را غیرفعال می‌کند. تگ‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه مرجع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord در آن نوبت متصل می‌کند.
    `batched` فقط وقتی مرجع پاسخ بومی ضمنی Discord را متصل می‌کند که نوبت ورودی یک دستهٔ debounced از چند پیام بوده باشد. این زمانی مفید است که پاسخ‌های بومی را عمدتاً برای چت‌های مبهم و انفجاری می‌خواهید، نه هر نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایش داده می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw می‌تواند پاسخ‌های پیش‌نویس را با ارسال یک پیام موقت و ویرایش آن هم‌زمان با رسیدن متن، stream کند. `channels.discord.streaming` مقدارهای `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌پذیرد. `progress` در Discord به `partial` نگاشت می‌شود؛ `streamMode` یک نام مستعار قدیمی است و خودکار مهاجرت داده می‌شود.

    مقدار پیش‌فرض `off` باقی می‌ماند، چون ویرایش‌های پیش‌نمایش Discord وقتی چند بات یا gateway یک حساب را به‌اشتراک می‌گذارند، خیلی زود به محدودیت نرخ برخورد می‌کنند.

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

    - `partial` با رسیدن توکن‌ها، یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازهٔ پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید؛ به `textChunkLimit` محدود می‌شود).
    - موارد نهایی رسانه، خطا، و پاسخ صریح، ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.

    streaming پیش‌نمایش فقط‌متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی fallback می‌کنند. وقتی streaming از نوع `block` صریحاً فعال باشد، OpenClaw برای جلوگیری از streaming دوبل از جریان پیش‌نمایش صرف‌نظر می‌کند.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    زمینهٔ تاریخچهٔ گیلد:

    - مقدار پیش‌فرض `channels.discord.historyLimit` برابر `20` است
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچهٔ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و مگر اینکه بازنویسی شوند، پیکربندی کانال والد را به ارث می‌برند.
    - نشست‌های رشته، انتخاب `/model` در سطح نشستِ کانال والد را فقط به‌عنوان جایگزین مختص مدل به ارث می‌برند؛ انتخاب‌های محلیِ رشته برای `/model` همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه ارث‌بری رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای مقداردهی اولیه از رونوشت والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند مقصدهای DM از نوع `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام جایگزین فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوع‌های کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه اینکه یک مرز کامل برای حذف زمینه تکمیلی باشند.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord می‌تواند یک رشته را به یک مقصد نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست مسیریابی شوند (از جمله نشست‌های زیرعامل).

    فرمان‌ها:

    - `/focus <target>` رشته فعلی/جدید را به مقصد زیرعامل/نشست متصل می‌کند
    - `/unfocus` اتصال رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت اتصال را نشان می‌دهد
    - `/session idle <duration|off>` فوکوس‌زدایی خودکار ناشی از عدم فعالیت را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر سن سخت‌گیرانه را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند

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

    نکته‌ها:

    - `session.threadBindings.*` پیش‌فرض‌های سراسری را تنظیم می‌کند.
    - `channels.discord.threadBindings.*` رفتار Discord را بازنویسی می‌کند.
    - برای ایجاد/اتصال خودکار رشته‌ها برای `sessions_spawn({ thread: true })`، `spawnSubagentSessions` باید true باشد.
    - برای ایجاد/اتصال خودکار رشته‌ها برای ACP (`/acp spawn ... --thread ...` یا `sessions_spawn({ runtime: "acp", thread: true })`)، `spawnAcpSessions` باید true باشد.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با اتصال رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    برای فضاهای کاری ACP پایدار و «همیشه روشن»، اتصال‌های ACP نوع‌دار سطح بالا را با هدف‌گیری گفتگوهای Discord پیکربندی کنید.

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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان‌جا متصل می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را در همان‌جا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند هنگام فعال بودن، حل مقصد را بازنویسی کنند.
    - `spawnAcpSessions` فقط وقتی لازم است که OpenClaw نیاز داشته باشد یک رشته فرزند را از طریق `--thread auto|here` ایجاد/متصل کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="Reaction notifications">
    حالت اعلان واکنش برای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سامانه تبدیل می‌شوند و به نشست Discord مسیریابی‌شده پیوست می‌شوند.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="Config writes">
    نوشتن پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال است.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های فرمان فعال باشند).

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
    ترافیک WebSocket مربوط به Gateway در Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل فهرست مجاز) را با `channels.discord.proxy` از طریق یک پروکسی HTTP(S) مسیریابی کنید.

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
    حل PluralKit را فعال کنید تا پیام‌های پروکسی‌شده به هویت عضو سامانه نگاشت شوند:

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
    - نام‌های نمایشی اعضا فقط وقتی بر اساس نام/اسلاگ تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به بازه زمانی محدود هستند
    - اگر جست‌وجو ناموفق باشد، پیام‌های پروکسی‌شده به‌عنوان پیام ربات در نظر گرفته می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="Presence configuration">
    به‌روزرسانی‌های حضور وقتی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت تنظیم کنید، یا حضور خودکار را فعال کنید.

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

    مثال پخش:

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

    حضور خودکار دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، تضعیف‌شده یا نامعلوم => idle، تمام‌شده یا ناموجود => dnd. بازنویسی‌های اختیاری متن:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در DMها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری درخواست‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ هر وقت ممکن باشد به `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل حل باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، Discord تأییدهای اجرایی بومی را به‌صورت خودکار فعال می‌کند. Discord تأییدکنندگان اجرایی را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان یک کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک، مانند `/diagnostics` و `/export-trajectory`، OpenClaw درخواست‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. اگر مالک فراخواننده یک مسیر مالک Discord داشته باشد، ابتدا Discord DM را امتحان می‌کند؛ اگر در دسترس نباشد، به اولین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، بازمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، درخواست تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان حل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. درخواست‌های تأیید شامل متن فرمان هستند، بنابراین تحویل کانالی را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل DM بازمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را رندر می‌کند که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند. آداپتور بومی Discord عمدتاً مسیریابی DM تأییدکننده و fanout کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود داشته باشند، تجربه کاربری اصلی تأیید هستند؛ OpenClaw
    فقط وقتی باید یک فرمان دستی `/approve` را شامل کند که نتیجه ابزار بگوید
    تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید بومی Discord فعال نباشد، OpenClaw درخواست
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت بومی نتواند به هیچ مقصدی تحویل داده شود،
    OpenClaw یک اعلان جایگزین در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ سایر شناسه‌ها از طریق `exec.approval.resolve`). تأییدها به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرایی](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور، و اقدام‌های فراداده هستند.

مثال‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- نظارت: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) را برای تنظیم تصویر جلد رویداد زمان‌بندی‌شده می‌پذیرد.

دروازه‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه عملیات                                                                                                                                                              | پیش‌فرض     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال        |
| roles                                                                                                                                                                    | غیرفعال     |
| moderation                                                                                                                                                               | غیرفعال     |
| presence                                                                                                                                                                 | غیرفعال     |

## رابط کاربری کامپوننت‌های v2

OpenClaw از کامپوننت‌های v2 در Discord برای تأییدهای اجرا و نشانگرهای میان‌زمینه‌ای استفاده می‌کند. عملیات پیام Discord می‌تواند برای رابط کاربری سفارشی `components` را نیز بپذیرد (پیشرفته؛ نیازمند ساختن payload کامپوننت از طریق ابزار discord است)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی استفاده‌شده توسط کانتینرهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی کامپوننت‌های v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.

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

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفتگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موجی). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی فهرست‌های مجاز نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. مجوزهای Connect، Speak، Send Messages و Read Message History را در کانال صوتی هدف بدهید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قواعد فهرست مجاز و سیاست گروهی دیگر فرمان‌های Discord را دنبال می‌کند.

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

- `voice.tts` فقط برای پخش صوتی، `messages.tts` را override می‌کند.
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را override می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر نمی‌گذارد.
- overrideهای `systemPrompt` مخصوص هر کانال Discord برای نوبت‌های رونویس صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویس صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) به دست می‌آورند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط‌مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدا به‌صورت پیش‌فرض فعال است؛ برای غیرفعال کردن runtime صدا و intent مربوط به Gateway با نام `GuildVoiceStates`، `channels.discord.voice.enabled=false` را تنظیم کنید.
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را به‌صورت صریح override کند. برای اینکه intent از `voice.enabled` پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های join در `@discordjs/voice` منتقل می‌شوند.
- اگر تنظیم نشوند، پیش‌فرض‌های `@discordjs/voice` برابر `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع شدن یک نشست صوتی، چه مدت برای شروع اتصال دوباره منتظر بماند پیش از آنکه آن را از بین ببرد. پیش‌فرض: `15000`.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از تکرار خطاها در یک بازه کوتاه، با خروج از کانال صوتی و پیوستن دوباره به آن، به‌صورت خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، logهای دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، گزارش dependency و logها را جمع‌آوری کنید. خط bundled مربوط به `@discordjs/voice` شامل اصلاح padding بالادستی از PR شماره #11449 در discord.js است که issue شماره #11419 در discord.js را بست.

pipeline کانال صوتی:

- ضبط PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` کار STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونویس از مسیر ingress و routing در Discord فرستاده می‌شود، در حالی که LLM پاسخ با یک سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن برگشتی را درخواست می‌کند، چون صدای Discord مالک پخش نهایی TTS است.
- وقتی `voice.model` تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی override می‌کند.
- `voice.tts` روی `messages.tts` merge می‌شود؛ صدای حاصل در کانال پیوسته‌شده پخش می‌شود.

اعتبارنامه‌ها برای هر کامپوننت جداگانه resolve می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord یک پیش‌نمایش موجی نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw موج را به‌صورت خودکار تولید می‌کند، اما برای بازرسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در همان payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="استفاده از intentهای غیرمجاز یا ندیدن پیام‌های guild توسط ربات">

    - Message Content Intent را فعال کنید
    - وقتی به resolve کردن کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، Gateway را restart کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - فهرست مجاز guild زیر `channels.discord.guilds` را بررسی کنید
    - اگر map مربوط به `channels` در guild وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention برابر false است اما هنوز مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون فهرست مجاز guild/channel مطابق
    - `requireMention` در جای نادرست پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی channel باشد)
    - فرستنده توسط فهرست مجاز `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    logهای معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    knobهای صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener مربوط به Gateway در Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord برای نوبت‌های عامل صف‌شده timeout متعلق به کانال اعمال نمی‌کند. listenerهای پیام بلافاصله تحویل می‌دهند، و اجراهای صف‌شده Discord ترتیب هر نشست را تا زمانی که چرخه عمر session/tool/runtime کامل شود یا کار را abort کند حفظ می‌کنند.

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

  <Accordion title="هشدارهای timeout در lookup متادیتای Gateway">
    OpenClaw پیش از اتصال، متادیتای `/gateway/bot` در Discord را fetch می‌کند. شکست‌های گذرا به URL پیش‌فرض Gateway در Discord fallback می‌کنند و در logها rate-limit می‌شوند.

    knobهای timeout متادیتا:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیط وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناهماهنگی‌های audit مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق runtime همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل راستی‌آزمایی کند.

  </Accordion>

  <Accordion title="مشکلات DM و pairing">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` در انتظار تأیید pairing است

  </Accordion>

  <Accordion title="حلقه‌های ربات به ربات">
    به‌صورت پیش‌فرض پیام‌های نوشته‌شده توسط ربات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قواعد سخت‌گیرانه mention و فهرست مجاز استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که به ربات mention می‌دهند.

  </Accordion>

  <Accordion title="افت STT صوتی با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صوتی Discord وجود داشته باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` است (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` شروع کنید (پیش‌فرض بالادستی) و فقط در صورت نیاز تنظیم کنید
    - logها را برای این موارد زیر نظر بگیرید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر پس از پیوستن دوباره خودکار، خطاها ادامه یافت، logها را جمع‌آوری کنید و با سابقه دریافت DAVE بالادستی در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای پرسیگنال Discord">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- متادیتای Gateway: `gatewayInfoTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (uploadهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- عملیات: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- رابط کاربری: `ui.components.accentColor`
- ویژگی‌ها: `threadBindings`, سطح بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- tokenهای ربات را به‌عنوان secret در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های supervised ترجیح داده می‌شود).
- حداقل مجوزهای لازم Discord را بدهید.
- اگر وضعیت deploy/state فرمان قدیمی است، Gateway را restart کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با Gateway جفت کنید.
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
  <Card title="مسیریابی چندعامله" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستور بومی.
  </Card>
</CardGroup>
