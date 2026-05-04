---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Discord
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های خصوصی و کانال‌های سرور از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های خصوصی Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با bot بسازید، bot را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. پیشنهاد می‌کنیم bot خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سروری ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ساخت یک برنامه و bot در Discord">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. مقدار **Username** را به هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="فعال‌کردن intentهای ممتاز">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام با شناسه الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های وضعیت حضور لازم است)

  </Step>

  <Step title="کپی‌کردن توکن bot">
    در صفحه **Bot** دوباره به بالا بروید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار اولین توکن شما را تولید می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و کمی بعد به آن نیاز دارید.

  </Step>

  <Step title="تولید URL دعوت و افزودن bot به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن bot به سرورتان تولید می‌کنید.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخشی با عنوان **Bot Permissions** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها
    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی پیوندها
      - پیوست‌کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی معمولی است. اگر قصد دارید در threadهای Discord پست بگذارید، از جمله گردش‌کارهای کانال forum یا media که یک thread ایجاد یا ادامه می‌دهند، **Send Messages in Threads** را هم فعال کنید.
    URL تولیدشده در پایین را کپی کنید، آن را در مرورگر خود جای‌گذاری کنید، سرور خود را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید bot خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌کردن Developer Mode و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتارتان) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. در نوار کناری روی **آیکون سرور** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در گام بعدی هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه‌دادن به پیام‌های خصوصی از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید اجازه دهد bot به شما پیام خصوصی بفرستد. روی **آیکون سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار اجازه می‌دهد اعضای سرور (از جمله botها) برای شما پیام خصوصی بفرستند. اگر می‌خواهید از پیام‌های خصوصی Discord با OpenClaw استفاده کنید، این گزینه را روشن نگه دارید. اگر فقط قصد استفاده از کانال‌های سرور را دارید، می‌توانید پس از جفت‌سازی پیام‌های خصوصی را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن bot (آن را در چت نفرستید)">
    توکن bot در Discord یک راز است (مثل گذرواژه). پیش از پیام‌دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac مربوط به OpenClaw یا با متوقف‌کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` راه‌اندازی مجدد کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از شلی اجرا کنید که `DISCORD_BOT_TOKEN` در آن موجود است، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند پس از راه‌اندازی مجدد env SecretRef را resolve کند.
    اگر میزبان شما توسط lookup برنامه در زمان راه‌اندازی Discord مسدود یا rate-limit شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند bot در Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و به آن بگویید. اگر Discord اولین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > «من قبلاً توکن bot در Discord را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` تمام کن.»
      </Tab>
      <Tab title="CLI / پیکربندی">
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

        fallback env برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقدارهای plaintext برای `token` پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند bot در Discord، هر توکن bot و شناسه برنامه را زیر حساب خودش نگه دارید. مقدار سطح‌بالای `channels.discord.applicationId` توسط حساب‌ها به ارث برده می‌شود، بنابراین فقط زمانی آن را در آنجا تنظیم کنید که همه حساب‌ها باید از همان شناسه برنامه استفاده کنند.

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

  <Step title="تأیید اولین جفت‌سازی پیام خصوصی">
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به bot خود پیام خصوصی بدهید. با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
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

    اکنون باید بتوانید در Discord از طریق پیام خصوصی با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
resolve شدن توکن نسبت به حساب آگاه است. مقدارهای توکن در پیکربندی بر fallback env اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن bot یکسان resolve شوند، OpenClaw فقط یک مانیتور Gateway برای آن توکن شروع می‌کند. توکنِ دارای منبع پیکربندی بر fallback env پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار message/اقدام‌های کانال)، یک `token` صریح برای همان فراخوانی استفاده می‌شود. این برای اقدام‌های send و read/probe-style اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش دوباره همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آید.
</Note>

## توصیه‌شده: راه‌اندازی فضای کاری سرور

پس از اینکه پیام‌های خصوصی کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال جلسه عامل خودش را با context خودش دریافت می‌کند. این برای سرورهای خصوصی که فقط شما و bot شما در آن هستید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور به فهرست مجاز سرور">
    این کار به عامل شما امکان می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط پیام‌های خصوصی.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «Discord Server ID `<server_id>` من را به فهرست مجاز سرور اضافه کن»
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

  <Step title="اجازه‌دادن به پاسخ‌ها بدون @mention">
    به‌طور پیش‌فرض، عامل شما فقط وقتی در کانال‌های سرور پاسخ می‌دهد که @mention شود. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های سرور، پاسخ‌های نهایی معمول assistant به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل‌مشاهده Discord باید به‌صراحت با ابزار `message` ارسال شود، تا عامل بتواند به‌طور پیش‌فرض در سکوت مشاهده کند و فقط وقتی تصمیم می‌گیرد پاسخ کانال مفید است پست بگذارد.

    این یعنی مدل انتخاب‌شده باید ابزارها را با اطمینان فراخوانی کند. اگر Discord وضعیت تایپ‌کردن نشان می‌دهد و لاگ‌ها مصرف توکن را نشان می‌دهند اما پیامی پست نشده است، لاگ جلسه را برای متن assistant با `didSendViaMessagingTool: false` بررسی کنید. این یعنی مدل به‌جای فراخوانی `message(action=send)` یک پاسخ نهایی خصوصی تولید کرده است. به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا از پیکربندی زیر برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی استفاده کنید.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «به عامل من اجازه بده بدون اینکه لازم باشد @mention شود، روی این سرور پاسخ دهد»
      </Tab>
      <Tab title="پیکربندی">
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

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های سرور">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در جلسه‌های پیام خصوصی بارگذاری می‌شود. کانال‌های سرور MEMORY.md را به‌طور خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر برای context بلندمدت از MEMORY.md نیاز داشتی، از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به context مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` بگذارید (آن‌ها برای هر جلسه تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و هنگام نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود بسازید و چت را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال جلسه جداافتاده خودش را دریافت می‌کند — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با گردش‌کار شما سازگار است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ guild/channel مربوط به Discord به‌عنوان زمینهٔ نامطمئن به پرامپت مدل اضافه می‌شود،
  نه به‌عنوان پیشوند پاسخ قابل مشاهده برای کاربر. اگر مدلی آن پوشش را
  بازنویسی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از
  زمینهٔ بازپخش آینده حذف می‌کند.
- به‌صورت پیش‌فرض (`session.dmScope=main`)، چت‌های مستقیم نشست اصلی عامل را به اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های Guild کلیدهای نشست جداگانه دارند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌صورت پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های slash بومی در نشست‌های فرمان جداگانه اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان‌های متنی cron/heartbeat به Discord از پاسخ نهایی
  قابل مشاهده برای دستیار، یک بار استفاده می‌کند. محموله‌های رسانه‌ای و مؤلفه‌های ساخت‌یافته
  وقتی عامل چند محمولهٔ قابل تحویل منتشر می‌کند، همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته‌ای را می‌پذیرند. OpenClaw از دو روش برای ساخت آن‌ها پشتیبانی می‌کند:

- پیامی به والد انجمن (`channel:<forumId>`) بفرستید تا یک رشته به‌صورت خودکار ساخته شود. عنوان رشته از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ساخت مستقیم یک رشته استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

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

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته (`channel:<threadId>`) ارسال کنید.

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفهٔ v2 در Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با محمولهٔ `components` استفاده کنید. نتایج تعامل به‌صورت پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و تنظیمات موجود Discord برای `replyToMode` را دنبال می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های اقدام تا ۵ دکمه یا یک منوی انتخاب واحد را مجاز می‌کنند
- نوع‌های انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌صورت پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌گرها و فرم‌ها تا زمان انقضا چند بار قابل استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن افرادی که می‌توانند روی دکمه کلیک کنند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربر Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شده باشد، کاربران نامنطبق یک رد موقت دریافت می‌کنند.

فرمان‌های slash با نام‌های `/model` و `/models` یک انتخاب‌گر تعاملی مدل را با منوهای کشویی provider، مدل، و runtime سازگار به‌همراه مرحلهٔ Submit باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخاب‌گر موقت است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک ارجاع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (یک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با ارجاع پیوست مطابقت داشته باشد، از `filename` برای بازنویسی نام استفاده کنید

فرم‌های Modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw به‌صورت خودکار یک دکمهٔ راه‌انداز اضافه می‌کند

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

    اولویت در چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - اشارهٔ `<@id>`

    شناسه‌های عددی بدون پیشوند، وقتی پیش‌فرض کانال فعال باشد، معمولاً به‌عنوان شناسهٔ کانال resolve می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان هدف‌های DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="گروه‌های دسترسی DM">
    DMهای Discord می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی بین کانال‌های پیام مشترک‌اند. برای یک گروه ایستا که اعضایش در نحو عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک access-group اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست اعضای جداگانه ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو guild پیکربندی‌شده است و در حال حاضر پس از اعمال بازنویسی‌های نقش و کانال، مجوز مؤثر `ViewChannel` را روی کانال پیکربندی‌شده دارد.

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

    جست‌وجوها در حالت خطا بسته می‌شوند. اگر Discord مقدار `Missing Access` برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال به guild دیگری تعلق داشته باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی channel-audience، **Server Members Intent** را برای ربات در Discord Developer Portal فعال کنید. DMها وضعیت عضو guild را شامل نمی‌شوند، بنابراین OpenClaw در زمان مجوزدهی عضو را از طریق Discord REST resolve می‌کند.

  </Tab>

  <Tab title="سیاست Guild">
    مدیریت Guild توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط پایهٔ امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - guild باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابقت داشته باشند مجازند
    - تطبیق مستقیم نام/برچسب به‌صورت پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر یک guild دارای `channels` پیکربندی‌شده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک guild بلوک `channels` نداشته باشد، همهٔ کانال‌های آن guild مجازشمرده‌شده اجازه دارند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` است (با هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="اشاره‌ها و DMهای گروهی">
    پیام‌های Guild به‌صورت پیش‌فرض پشت دروازهٔ اشاره قرار دارند.

    تشخیص اشاره شامل موارد زیر است:

    - اشارهٔ صریح به ربات
    - الگوهای اشارهٔ پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به ربات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو canonical اشاره استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از فرم اشارهٔ قدیمی nickname یعنی `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر guild/channel پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقش دیگری اشاره می‌کنند اما به ربات اشاره ندارند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی عامل بر پایهٔ نقش

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به عامل‌های مختلف بر اساس شناسهٔ نقش استفاده کنید. bindingهای مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط-guild ارزیابی می‌شوند. اگر یک binding فیلدهای match دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

## فرمان‌های بومی و احراز هویت فرمان

- `commands.native` به‌طور پیش‌فرض `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی دستورهای اسلش Discord را هنگام راه‌اندازی رد می‌کند. دستورهایی که قبلاً ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت دستور بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش عادی پیام استفاده می‌کند.
- دستورها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند دیده شوند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای فهرست دستورها و رفتار، [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض دستور اسلش:

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

    نکته: `off` رشته‌سازی ضمنی پاسخ را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به اولین پیام خروجی Discord برای نوبت وصل می‌کند.
    `batched` فقط وقتی ارجاع پاسخ بومی ضمنی Discord را وصل می‌کند که
    نوبت ورودی یک دسته debounce‌شده از چند پیام باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتاً برای گفت‌وگوهای انفجاری و مبهم می‌خواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه آشکار می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش جریان زنده">
    OpenClaw می‌تواند پاسخ‌های پیش‌نویس را با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، به‌صورت جریانی ارسال کند. `channels.discord.streaming` مقدارهای `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش را نگه می‌دارد و آن را تا تحویل نهایی با پیشرفت ابزار به‌روزرسانی می‌کند؛ `streamMode` یک نام مستعار قدیمی است و به‌طور خودکار مهاجرت داده می‌شود.

    مقدار پیش‌فرض `off` باقی می‌ماند، چون ویرایش‌های پیش‌نمایش Discord وقتی چند ربات یا Gateway یک حساب را به اشتراک می‌گذارند به‌سرعت با محدودیت نرخ برخورد می‌کند.

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
    - `block` تکه‌هایی به اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، که به `textChunkLimit` محدود می‌شود).
    - رسانه، خطا، و نهایی‌های پاسخ صریح ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات دستور/اجرا را در خطوط پیشرفت فشرده کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام دستور/اجرا را پنهان کنید، درحالی‌که خطوط پیشرفت فشرده حفظ می‌شوند:

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

    جریان پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی جریان `block` صراحتاً فعال باشد، OpenClaw برای جلوگیری از جریان‌دهی دوباره، جریان پیش‌نمایش را رد می‌کند.

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
    - نشست‌های رشته انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان جایگزین مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی رشته همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه ارث‌بری رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را وارد کاشتن از رونوشت والد می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند مقصدهای پیام مستقیم `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام جایگزین فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوع‌های کانال به‌عنوان زمینه **نامطمئن** تزریق می‌شوند. فهرست‌های مجاز کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل حذف زمینه تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های مقید به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به یک هدف نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست مسیریابی شوند (از جمله نشست‌های زیرعامل).

    دستورها:

    - `/focus <target>` اتصال رشته فعلی/جدید به یک هدف زیرعامل/نشست
    - `/unfocus` حذف اتصال رشته فعلی
    - `/agents` نمایش اجراهای فعال و وضعیت اتصال
    - `/session idle <duration|off>` بررسی/به‌روزرسانی عدم فعالیت auto-unfocus برای اتصال‌های متمرکز
    - `/session max-age <duration|off>` بررسی/به‌روزرسانی حداکثر عمر سخت برای اتصال‌های متمرکز

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
    - `spawnSessions` ایجاد/اتصال خودکار رشته‌ها را برای `sessions_spawn({ thread: true })` و ایجاد رشته ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه زیرعامل بومی را برای ایجادهای مقید به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` با `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط اتصال رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="اتصال‌های پایدار کانال ACP">
    برای فضاهای کاری ACP پایدار و «همیشه روشن»، اتصال‌های ACP تایپ‌شده سطح بالا را پیکربندی کنید که گفت‌وگوهای Discord را هدف می‌گیرند.

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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را درجا متصل می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را درجا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند هنگام فعال بودن حل هدف را بازنویسی کنند.
    - `spawnSessions` ایجاد/اتصال رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر انجمن:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی unicode یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی">
    نوشتن پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال است.

    این بر جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های دستور فعال باشند).

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

  <Accordion title="پروکسی Gateway">
    ترافیک WebSocket Gateway متعلق به Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل فهرست مجاز) را با `channels.discord.proxy` از طریق یک پروکسی HTTP(S) مسیریابی کنید.

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
    حل PluralKit را فعال کنید تا پیام‌های پروکسی‌شده به هویت عضو سیستم نگاشت شوند:

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
    - نام‌های نمایشی عضو فقط وقتی `channels.discord.dangerouslyAllowNameMatching: true` باشد با نام/slug تطبیق داده می‌شوند
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به پنجره زمانی محدود هستند
    - اگر جست‌وجو شکست بخورد، پیام‌های پروکسی‌شده به‌عنوان پیام ربات تلقی می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

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

  <Accordion title="پیکربندی حضور">
    به‌روزرسانی‌های حضور وقتی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت تنظیم کنید، یا وقتی حضور خودکار را فعال کنید.

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

    نمونه جریان:

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
    - 1: در حال پخش جریانی (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان حالت وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
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

    حضور خودکار، در دسترس بودن زمان اجرا را به وضعیت Discord نگاشت می‌کند: healthy => online، degraded یا unknown => idle، exhausted یا unavailable => dnd. بازنویسی‌های متنی اختیاری:

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

    وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، قابل حل باشد، Discord تأییدهای اجرای بومی را به‌صورت خودکار فعال می‌کند. Discord تأییدکنندگان اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw اعلان‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. اگر مالک فراخواننده مسیر مالک Discord داشته باشد، ابتدا پیام مستقیم Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، اعلان تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان حل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. اعلان‌های تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل از طریق پیام مستقیم برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که سایر کانال‌های چت استفاده می‌کنند رندر می‌کند. آداپتور بومی Discord عمدتاً مسیریابی پیام مستقیم تأییدکننده و پخش به کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود داشته باشند، تجربه کاربری اصلی تأیید همان‌ها هستند؛ OpenClaw
    فقط زمانی باید فرمان دستی `/approve` را اضافه کند که نتیجه ابزار بگوید
    تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید بومی Discord فعال نباشد، OpenClaw اعلان
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت بومی به هیچ هدفی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان چت همراه با فرمان دقیق `/approve`
    از تأیید معلق ارسال می‌کند.

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

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر جلد رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه اقدام                                                                                                                                                              | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال     |
| roles                                                                                                                                                                    | غیرفعال  |
| moderation                                                                                                                                                               | غیرفعال  |
| presence                                                                                                                                                                 | غیرفعال  |

## رابط کاربری Components v2

OpenClaw از components v2 در Discord برای تأییدهای اجرا و نشانگرهای میان‌بافتی استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی استفاده‌شده توسط کانتینرهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی components v2 وجود داشته باشد، `embeds` نادیده گرفته می‌شود.

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

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بی‌درنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موج صدا). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی فهرست‌های مجاز نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. بات را با دامنه‌های `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی هدف، مجوزهای Connect، Speak، Send Messages، و Read Message History را بدهید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قوانین فهرست مجاز و خط‌مشی گروهیِ سایر فرمان‌های Discord را دنبال می‌کند.

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

نکات:

- `voice.tts` فقط برای پخش صوتی، `messages.tts` را بازنویسی می‌کند.
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` بر رونویسی اثر نمی‌گذارد.
- بازنویسی‌های `systemPrompt` مختص هر کانال Discord برای نوبت‌های رونویسی صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی، وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) استخراج می‌کنند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط مالک (برای مثال `gateway` و `cron`) دسترسی داشته باشند.
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال کردن فرمان‌های `/vc`، زمان اجرای صوتی، و intent مربوط به Gateway یعنی `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحاً بازنویسی کند. برای اینکه intent از فعال‌سازی مؤثر صدا پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های پیوستن `@discordjs/voice` پاس داده می‌شوند.
- اگر تنظیم نشده باشند، پیش‌فرض‌های `@discordjs/voice` برابر `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw چه مدت منتظر می‌ماند تا یک نشست صوتی قطع‌شده پیش از نابود شدن، شروع به اتصال مجدد کند. پیش‌فرض: `15000`.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از خطاهای تکراری در یک بازه کوتاه، با ترک/پیوستن دوباره به کانال صوتی، به‌صورت خودکار بازیابی می‌شود.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR شماره #11449 در discord.js است که issue شماره #11419 در discord.js را بست.

خط لوله کانال صوتی:

- ضبط PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` STT را مدیریت می‌کند، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونویسی از طریق ورودی و مسیریابی Discord ارسال می‌شود، در حالی که LLM پاسخ با خط‌مشی خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگشتی را درخواست می‌کند، زیرا صدای Discord مالک پخش نهایی TTS است.
- وقتی `voice.model` تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صدای حاصل در کانال پیوسته‌شده پخش می‌شود.

اعتبارنامه‌ها برای هر مؤلفه جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord یک پیش‌نمایش موج صدا نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw موج صدا را به‌صورت خودکار تولید می‌کند، اما برای بررسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در همان payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا بات هیچ پیام guild نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را راه‌اندازی مجدد کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - فهرست مجاز guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` در guild وجود دارد، فقط کانال‌های فهرست‌شده مجاز هستند
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

    - `groupPolicy="allowlist"` بدون فهرست مجاز guild/channel منطبق
    - `requireMention` در جای نادرست پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی channel باشد)
    - فرستنده توسط فهرست مجاز `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    تنظیم‌های صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Gateway مربوط به Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord timeout متعلق به کانال را روی نوبت‌های عاملِ در صف اعمال نمی‌کند. listenerهای پیام فوراً واگذار می‌کنند، و اجراهای Discord در صف، ترتیب هر نشست را حفظ می‌کنند تا چرخه عمر نشست/ابزار/زمان اجرا کامل شود یا کار را لغو کند.

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

  <Accordion title="هشدارهای پایان مهلت جستجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده Discord `/gateway/bot` را دریافت می‌کند. خرابی‌های گذرا به URL پیش‌فرض Gateway در Discord بازمی‌گردند و در گزارش‌ها محدودسازی نرخ دارند.

    تنظیمات پایان مهلت فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - جایگزین env وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های مجدد ناشی از پایان مهلت READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد زمان اجرا، منتظر رویداد `READY` در Gateway مربوط به Discord می‌ماند. پیکربندی‌های چندحساب با فاصله‌گذاری در راه‌اندازی ممکن است به بازه READY طولانی‌تری در راه‌اندازی نسبت به مقدار پیش‌فرض نیاز داشته باشند.

    تنظیمات پایان مهلت READY:

    - راه‌اندازی تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - جایگزین env راه‌اندازی وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - زمان اجرا تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - زمان اجرا چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - جایگزین env زمان اجرا وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض زمان اجرا: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="عدم‌تطابق‌های حسابرسی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق در زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در انتظار تأیید جفت‌سازی در حالت `pairing`

  </Accordion>

  <Accordion title="حلقه‌های بات به بات">
    به‌طور پیش‌فرض پیام‌های نوشته‌شده توسط بات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه mention و allowlist استفاده کنید.
    بهتر است از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که بات را mention می‌کنند.

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

  <Accordion title="افت‌های STT صوتی با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صوتی Discord حاضر باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض بالادستی) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - گزارش‌ها را برای این موارد پایش کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خرابی‌ها پس از پیوستن مجدد خودکار ادامه یافتند، گزارش‌ها را گردآوری کنید و با تاریخچه دریافت DAVE بالادستی در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

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
- پخش جریانی: `streaming` (نام مستعار قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش مجدد: `mediaMaxMb` (بارگذاری‌های خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`), `retry`
- کنش‌ها: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`, سطح بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های بات را به‌عنوان راز در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح داده می‌شود).
- کمترین مجوزهای لازم Discord را اعطا کنید.
- اگر deploy/state فرمان قدیمی است، Gateway را راه‌اندازی مجدد کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

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
  <Card title="دستورهای Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
