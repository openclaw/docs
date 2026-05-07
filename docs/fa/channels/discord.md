---
read_when:
    - کار روی ویژگی‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Discord
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های گیلد از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و فهرست دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با یک بات بسازید، بات را به سرورتان اضافه کنید و آن را با OpenClaw جفت کنید. توصیه می‌کنیم بات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ساخت یک برنامه و بات Discord">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل "OpenClaw" برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را روی هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی intentهای ممتاز">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این گزینه‌ها را فعال کنید:

    - **Message Content Intent** (لازم)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام با شناسه لازم است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="کپی کردن توکن بات">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    با وجود نام آن، این کار اولین توکن شما را تولید می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="تولید URL دعوت و افزودن بات به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن بات به سرورتان تولید خواهید کرد.

    به پایین تا **OAuth2 URL Generator** بروید و این گزینه‌ها را فعال کنید:

    - `bot`
    - `applications.commands`

    بخش **Bot Permissions** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها
    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی پیوندها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله جریان‌های کاری کانال فروم یا رسانه که یک رشته می‌سازند یا ادامه می‌دهند، **Send Messages in Threads** را هم فعال کنید.
    URL تولیدشده در پایین را کپی کنید، آن را در مرورگر خود جای‌گذاری کنید، سرورتان را انتخاب کنید و برای اتصال روی **Continue** کلیک کنید. اکنون باید بات خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌سازی Developer Mode و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (نماد چرخ‌دنده کنار آواتارتان) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. روی **نماد سرور** خود در نوار کناری راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را برای OpenClaw ارسال می‌کنید.

  </Step>

  <Step title="اجازه دادن به پیام‌های مستقیم از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید به بات شما اجازه دهد به شما پیام مستقیم بدهد. روی **نماد سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله بات‌ها) اجازه می‌دهد برای شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های گیلد استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن بات (آن را در چت نفرستید)">
    توکن بات Discord شما یک راز است (مثل رمز عبور). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac OpenClaw یا با متوقف کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از پوسته‌ای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس پس از بازراه‌اندازی بتواند env SecretRef را resolve کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام شروع Discord مسدود شده یا نرخ آن محدود شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند بات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و به آن بگویید. اگر Discord اولین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
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

        fallback متغیر محیطی برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقدارهای plaintext برای `token` پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

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

  <Step title="تأیید اولین جفت‌سازی پیام مستقیم">
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به بات خود پیام مستقیم بدهید. بات با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        کد جفت‌سازی را در کانال موجود خود برای عاملتان ارسال کنید:

        > "Approve this Discord pairing code: `<CODE>`"
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
resolve کردن توکن نسبت به حساب آگاه است. مقدارهای توکن در پیکربندی بر fallback متغیر محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن بات resolve شوند، OpenClaw فقط یک ناظر Gateway برای آن توکن شروع می‌کند. توکنی که از پیکربندی می‌آید بر fallback متغیر محیطی پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/کنش‌های کانال)، `token` صریح در سطح هر فراخوانی برای همان فراخوانی استفاده می‌شود. این برای کنش‌های سبک ارسال و خواندن/کاوش اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست/تلاش دوباره حساب همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آید.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری گیلد

وقتی پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال جلسه عامل خودش را با زمینه خودش دارد. این کار برای سرورهای خصوصی که فقط شما و باتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور به فهرست مجاز گیلد">
    این کار به عامل شما اجازه می‌دهد در هر کانالی در سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

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

  <Step title="اجازه دادن به پاسخ‌ها بدون @mention">
    به‌طور پیش‌فرض، عامل شما فقط زمانی در کانال‌های گیلد پاسخ می‌دهد که @mention شده باشد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های گیلد، پاسخ‌های نهایی عادی دستیار به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل‌مشاهده Discord باید به‌صورت صریح با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض فقط گوش بدهد و فقط وقتی تصمیم گرفت پاسخ کانالی مفید است پست بگذارد.

    این یعنی مدل انتخاب‌شده باید به‌طور قابل‌اعتماد ابزارها را فراخوانی کند. اگر Discord وضعیت تایپ کردن را نشان می‌دهد و گزارش‌ها مصرف توکن را نشان می‌دهند اما پیامی پست نشده است، گزارش جلسه را برای متن دستیار با `didSendViaMessagingTool: false` بررسی کنید. این یعنی مدل به‌جای فراخوانی `message(action=send)` یک پاسخ نهایی خصوصی تولید کرده است. به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا از پیکربندی زیر برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی استفاده کنید.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="پیکربندی">
        در پیکربندی گیلد خود `requireMention: false` را تنظیم کنید:

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

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های گیلد">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در جلسه‌های پیام مستقیم بارگذاری می‌شود. کانال‌های گیلد MEMORY.md را به‌صورت خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (آن‌ها برای هر جلسه تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود بسازید و شروع به چت کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال جلسه ایزوله خودش را می‌گیرد — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با جریان کاری شما سازگار است تنظیم کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord دوباره به Discord برمی‌گردند.
- فرادادهٔ گیلد/کانال Discord به‌عنوان زمینهٔ نامطمئن به پرامپت مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن لفافه را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفتگوهای مستقیم نشست اصلی عامل را به‌اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های گیلد کلیدهای نشست ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در نشست‌های فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به نشست گفتگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان متنیِ cron/heartbeat به Discord یک‌بار از پاسخ نهاییِ قابل‌مشاهده برای دستیار استفاده می‌کند. رسانه و بارهای مؤلفهٔ ساختاریافته وقتی عامل چند بار قابل‌تحویل تولید می‌کند، همچنان چندپیامه باقی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته‌ای را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی به والد انجمن بفرستید (`channel:<forumId>`) تا یک رشته به‌طور خودکار ایجاد شود. عنوان رشته از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم رشته استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

مثال: ارسال به والد انجمن برای ایجاد رشته

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ایجاد صریح رشتهٔ انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته ارسال کنید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفهٔ v2 Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با بار `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌کنند
- نوع‌های انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضا چندین بار قابل‌استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی دکمه کلیک کند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربری Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شود، کاربران نامنطبق یک رد موقت دریافت می‌کنند.

فرمان‌های اسلش `/model` و `/models` یک انتخابگر مدل تعاملی باز می‌کنند که شامل فهرست‌های کشویی ارائه‌دهنده، مدل و runtime سازگار به‌همراه مرحلهٔ ارسال است. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، پیام منسوخ‌بودن برمی‌گرداند. پاسخ انتخابگر موقت است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (تک‌فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابقت داشته باشد، از `filename` برای بازنویسی نام استفاده کنید

فرم‌های Modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw به‌طور خودکار یک دکمهٔ محرک اضافه می‌کند

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

    تقدم چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی تقدم دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - ذکر `<@id>`

    شناسه‌های عددی خام معمولاً وقتی پیش‌فرض کانال فعال باشد به‌عنوان شناسهٔ کانال حل می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان هدف‌های DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="DM access groups">
    DMهای Discord می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی بین کانال‌های پیام مشترک هستند. برای گروه ایستایی که اعضایش در نحو معمول `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست عضو جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌طور مدل می‌کند: فرستندهٔ DM عضو گیلد پیکربندی‌شده است و پس از اعمال نقش‌ها و بازنویسی‌های کانال، درحال‌حاضر مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    مثال: اجازه دهید هر کسی که می‌تواند `#maintainers` را ببیند به ربات DM بفرستد، درحالی‌که DMها برای همهٔ افراد دیگر بسته بمانند.

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

    جستجوها در حالت شکست بسته می‌مانند. اگر Discord مقدار `Missing Access` را برگرداند، جستجوی عضو شکست بخورد، یا کانال به گیلد متفاوتی تعلق داشته باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را در Discord Developer Portal برای ربات فعال کنید. DMها وضعیت عضو گیلد را شامل نمی‌شوند، بنابراین OpenClaw عضو را هنگام مجوزدهی از طریق Discord REST حل می‌کند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت گیلد با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط مبنای امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - گیلد باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابقت داشته باشند مجاز هستند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها ایمن‌ترند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر یک گیلد `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک گیلد بلوک `channels` نداشته باشد، همهٔ کانال‌های آن گیلدِ موجود در فهرست مجاز، مجاز هستند

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

  <Tab title="Mentions and group DMs">
    پیام‌های گیلد به‌طور پیش‌فرض با ذکر محدود می‌شوند.

    تشخیص ذکر شامل موارد زیر است:

    - ذکر صریح ربات
    - الگوهای ذکر پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به ربات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو ذکر متعارف استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از شکل ذکر نام مستعار قدیمی `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر گیلد/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که کاربر/نقش دیگری را ذکر می‌کنند اما ربات را ذکر نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شود (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا slugهای کانال)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر نقش

از `bindings[].match.roles` برای مسیریابی اعضای گیلد Discord به عامل‌های مختلف بر اساس شناسهٔ نقش استفاده کنید. اتصال‌های مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از اتصال‌های peer یا parent-peer و پیش از اتصال‌های فقط گیلد ارزیابی می‌شوند. اگر یک اتصال فیلدهای تطبیق دیگری را هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی در سطح هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی فرمان‌های اسلش Discord را هنگام راه‌اندازی رد می‌کند. فرمان‌هایی که قبلا ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت فرمان بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش معمول پیام از آن‌ها استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و «مجاز نیست» برمی‌گرداند.

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

    نکته: `off` رشته‌سازی ضمنی پاسخ را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    نوبت ورودی یک دسته debounce‌شده از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتا برای گفتگوهای پرشتاب و مبهم می‌خواهید، نه برای
    هر نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایش داده می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هم‌زمان با رسیدن متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming` مقادیر `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش را نگه می‌دارد و آن را با پیشرفت ابزار تا تحویل نهایی به‌روزرسانی می‌کند؛ `streamMode` یک نام مستعار runtime قدیمی است. برای بازنویسی پیکربندی پایدارشده به کلید رسمی، `openclaw doctor --fix` را اجرا کنید.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` تنظیم کنید. اگر پخش بلوکی Discord به‌صراحت فعال شده باشد، OpenClaw برای جلوگیری از پخش دوباره، جریان پیش‌نمایش را رد می‌کند.

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

    - `partial` یک پیام پیش‌نمایش واحد را هم‌زمان با رسیدن توکن‌ها ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، با محدودسازی به `textChunkLimit`).
    - رسانه، خطا، و نهایی‌های پاسخ صریح، ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات فرمان/اجرا را در خطوط پیشرفت فشرده کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام فرمان/اجرا را پنهان کنید و در عین حال خطوط پیشرفت فشرده را نگه دارید:

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

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل معمول برمی‌گردند. وقتی پخش `block` به‌صراحت فعال باشد، OpenClaw برای جلوگیری از پخش دوباره، جریان پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، زمینه، و رفتار رشته">
    زمینه تاریخچه انجمن:

    - پیش‌فرض `channels.discord.historyLimit` مقدار `20` است
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند، مگر اینکه بازنویسی شده باشند.
    - نشست‌های رشته، انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان fallback مخصوص مدل به ارث می‌برند؛ انتخاب‌های محلی `/model` در رشته همچنان اولویت دارند و تاریخچه transcript والد کپی نمی‌شود مگر اینکه ارث‌بری transcript فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای seed شدن از transcript والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند هدف‌های DM با قالب `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام fallback فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل حذف زمینه تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های وابسته به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به هدف نشست bind کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست (از جمله نشست‌های زیرعامل) مسیریابی شوند.

    فرمان‌ها:

    - `/focus <target>` رشته فعلی/جدید را به هدف زیرعامل/نشست bind می‌کند
    - `/unfocus` binding رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت binding را نشان می‌دهد
    - `/session idle <duration|off>` auto-unfocus ناشی از عدم فعالیت را برای bindingهای متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر عمر سخت را برای bindingهای متمرکز بررسی/به‌روزرسانی می‌کند

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
    - `spawnSessions` ایجاد/bind خودکار رشته‌ها را برای `sessions_spawn({ thread: true })` و spawnهای رشته ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه بومی زیرعامل را برای spawnهای وابسته به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` با `openclaw doctor --fix` migrate می‌شوند.
    - اگر bindingهای رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با binding رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="bindingهای پایدار کانال ACP">
    برای workspaceهای ACP پایدار و «همیشه روشن»، bindingهای ACP تایپ‌شده در سطح بالا را که گفتگوهای Discord را هدف می‌گیرند پیکربندی کنید.

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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان‌جا bind می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته binding کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته bindشده، `/new` و `/reset` همان نشست ACP را در همان‌جا reset می‌کنند. bindingهای موقت رشته می‌توانند هنگام فعال بودن، resolve هدف را بازنویسی کنند.
    - `spawnSessions` ایجاد/binding رشته فرزند را از طریق `--thread auto|here` gate می‌کند.

    برای جزئیات رفتار binding، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش در سطح هر انجمن:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستم تبدیل می‌شوند و به نشست Discord مسیریابی‌شده متصل می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تایید">
    `ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw، یک emoji تایید ارسال می‌کند.

    ترتیب resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Discord ایموجی unicode یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی">
    نوشتن پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال است.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های فرمان فعال باشند).

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
    ترافیک WebSocket گیت‌وی Discord و lookupهای REST هنگام راه‌اندازی (شناسه برنامه + resolve فهرست مجاز) را با `channels.discord.proxy` از طریق یک پراکسی HTTP(S) مسیریابی کنید.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    بازنویسی در سطح هر حساب:

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
    - نام‌های نمایشی عضو فقط وقتی `channels.discord.dangerouslyAllowNameMatching: true` باشد، با نام/slug تطبیق داده می‌شوند
    - lookupها از شناسه پیام اصلی استفاده می‌کنند و به پنجره زمانی محدود هستند
    - اگر lookup ناموفق باشد، پیام‌های proxied به‌عنوان پیام‌های bot در نظر گرفته و حذف می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها برای کاربران شناخته‌شده Discord به منشن‌های خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handleهای بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و منشن‌های داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

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
    - 4: سفارشی (از متن فعالیت به‌عنوان state وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
    - 5: در حال رقابت

    مثال حضور خودکار (سیگنال سلامت runtime):

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

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => online، افت‌کرده یا ناشناخته => idle، تمام‌شده یا در دسترس نبودن => dnd. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در DMها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری درخواست‌های تأیید را در کانال مبدأ نیز ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، قابل تشخیص باشد، تأییدهای اجرای بومی را خودکار فعال می‌کند. Discord تأییدکنندگان اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw درخواست‌های تأیید و نتایج نهایی را خصوصی ارسال می‌کند. ابتدا وقتی مالک فراخواننده مسیر مالک Discord داشته باشد، DM در Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، درخواست تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان حل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. درخواست‌های تأیید شامل متن فرمان هستند، بنابراین تحویل کانالی را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل DM برمی‌گردد.

    Discord دکمه‌های تأیید مشترکی را هم که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند نمایش می‌دهد. آداپتر بومی Discord عمدتاً مسیریابی DM تأییدکننده و پخش کانالی را اضافه می‌کند.
    وقتی این دکمه‌ها وجود داشته باشند، تجربه کاربری اصلی تأیید هستند؛ OpenClaw
    فقط وقتی باید فرمان دستی `/approve` را اضافه کند که نتیجه ابزار بگوید
    تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید بومی Discord فعال نباشد، OpenClaw درخواست
    محلی و قطعی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت بومی به هیچ مقصدی تحویل داده نشود،
    OpenClaw یک اعلان جایگزین در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأییدها از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های کنش

کنش‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور، و کنش‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- واکنش‌ها: `react`, `reactions`, `emojiList`
- نظارت: `timeout`, `kick`, `ban`
- حضور: `setPresence`

کنش `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر جلد رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های کنش زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه کنش                                                                                                                                                                | پیش‌فرض      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال         |
| roles                                                                                                                                                                    | غیرفعال      |
| moderation                                                                                                                                                               | غیرفعال      |
| presence                                                                                                                                                                 | غیرفعال      |

## رابط کاربری کامپوننت‌های v2

OpenClaw برای تأییدهای اجرا و نشانگرهای میان‌بافتاری از کامپوننت‌های v2 Discord استفاده می‌کند. کنش‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی‌که `embeds` قدیمی همچنان در دسترس‌اند اما توصیه نمی‌شوند.

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

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش شکل موج). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی فهرست‌های مجاز نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. بات را با دامنه‌های `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی هدف، Connect، Speak، Send Messages، و Read Message History را اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قواعد فهرست مجاز و سیاست گروهی فرمان‌های دیگر Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

برای بررسی مجوزهای مؤثر بات پیش از پیوستن، اجرا کنید:

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
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` بر رونویسی اثر نمی‌گذارد.
- بازنویسی‌های `systemPrompt` مخصوص هر کانال Discord بر نوبت‌های رونویسی صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) استخراج می‌کنند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال کردن فرمان‌های `/vc`، زمان اجرای صوت، و intent درگاه `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحاً بازنویسی کند. برای اینکه intent از فعال‌سازی مؤثر صدا پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های join در `@discordjs/voice` پاس داده می‌شوند.
- اگر تنظیم نشده باشند، پیش‌فرض‌های `@discordjs/voice` برابر `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع شدن یک نشست صوتی، چه مدت منتظر بماند تا بازاتصال آغاز شود، پیش از آنکه آن را نابود کند. پیش‌فرض: `15000`.
- پخش صوتی صرفاً به این دلیل که کاربر دیگری شروع به صحبت می‌کند متوقف نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوت جدید را نادیده می‌گیرد؛ برای نوبت بعدی پس از پایان پخش صحبت کنید.
- `voice.captureSilenceGraceMs` کنترل می‌کند پس از اینکه Discord گزارش داد یک گوینده متوقف شده است، OpenClaw چه مدت پیش از نهایی کردن آن بخش صوتی برای STT منتظر بماند. پیش‌فرض: `2500`؛ اگر Discord مکث‌های معمولی را به رونویسی‌های تکه‌تکه و ناقص تقسیم می‌کند، این مقدار را افزایش دهید.
- وقتی ElevenLabs ارائه‌دهنده TTS انتخاب‌شده باشد، پخش صوتی Discord از TTS جریانی استفاده می‌کند و از جریان پاسخ ارائه‌دهنده آغاز می‌شود. ارائه‌دهندگانی که از جریان پشتیبانی نمی‌کنند به مسیر فایل موقت سنتز‌شده برمی‌گردند.
- OpenClaw شکست‌های رمزگشایی دریافت را نیز پایش می‌کند و پس از شکست‌های تکرارشونده در یک بازه کوتاه، با ترک/پیوستن دوباره به کانال صوتی خودکار بازیابی می‌شود.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت مکرراً `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط bundled `@discordjs/voice` شامل اصلاح upstream padding از PR #11449 در discord.js است که issue #11419 در discord.js را بست.
- رویدادهای دریافت `The operation was aborted` وقتی OpenClaw یک بخش ضبط‌شده از گوینده را نهایی می‌کند مورد انتظار هستند؛ این‌ها تشخیص‌های پرجزئیات‌اند، نه هشدار.

خط لوله کانال صوتی:

- ضبط PCM در Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` مدیریت STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونویسی از طریق ورودی و مسیریابی Discord ارسال می‌شود، در حالی‌که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگشتی می‌خواهد، زیرا صدای Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ ارائه‌دهندگان دارای قابلیت جریان مستقیماً player را تغذیه می‌کنند، در غیر این صورت فایل صوتی حاصل در کانال پیوسته پخش می‌شود.

اعتبارنامه‌ها برای هر کامپوننت جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش شکل موج نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw شکل موج را به‌صورت خودکار تولید می‌کند، اما برای بررسی و تبدیل، روی میزبان Gateway به `ffmpeg` و `ffprobe` نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در همان payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا بات هیچ پیام guild را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، Gateway را راه‌اندازی دوباره کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - فهرست مجاز guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نقشه `channels` در guild وجود دارد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention برابر با false اما همچنان مسدود است">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون allowlist مطابق برای guild/channel
    - `requireMention` در جای نادرست پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی channel باشد)
    - فرستنده توسط allowlist مربوط به `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    تنظیمات صف Discord gateway:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Discord gateway را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord برای نوبت‌های عامل صف‌شده timeout متعلق به channel اعمال نمی‌کند. Message listenerها بلافاصله واگذار می‌کنند، و اجرای‌های صف‌شده Discord ترتیب هر session را حفظ می‌کنند تا lifecycle مربوط به session/tool/runtime کامل شود یا کار را لغو کند.

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

  <Accordion title="هشدارهای timeout برای واکشی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده Discord `/gateway/bot` را دریافت می‌کند. خرابی‌های گذرا به URL پیش‌فرض Gateway در Discord برمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    تنظیمات timeout فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی مجدد پس از timeout رویداد READY در Gateway">
    OpenClaw هنگام startup و پس از reconnectهای runtime منتظر رویداد Gateway با نام `READY` در Discord می‌ماند. راه‌اندازی‌های چندحساب با stagger در startup ممکن است به پنجره startup READY طولانی‌تری نسبت به پیش‌فرض نیاز داشته باشند.

    تنظیمات timeout برای READY:

    - startup تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - startup چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback محیطی startup وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض startup: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - runtime تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback محیطی runtime وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض runtime: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناسازگاری‌های audit مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای IDهای عددی channel کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق runtime همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را کامل بررسی کند.

  </Accordion>

  <Accordion title="مشکلات DM و pairing">

    - DM غیرفعال: `channels.discord.dm.enabled=false`
    - policy مربوط به DM غیرفعال: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - انتظار برای تأیید pairing در حالت `pairing`

  </Accordion>

  <Accordion title="چرخه‌های bot به bot">
    به‌صورت پیش‌فرض پیام‌هایی که توسط bot نوشته شده‌اند نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار چرخه‌ای از قوانین سخت‌گیرانه mention و allowlist استفاده کنید.
    `channels.discord.allowBots="mentions"` را ترجیح دهید تا فقط پیام‌های bot را بپذیرد که bot را mention می‌کنند.

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

  <Accordion title="حذف شدن Voice STT با DecryptionFailed(...)">

    - OpenClaw را current نگه دارید (`openclaw update`) تا منطق بازیابی دریافت voice در Discord وجود داشته باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - لاگ‌ها را برای این موارد بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خرابی‌ها پس از rejoin خودکار ادامه داشتند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه دریافت upstream DAVE در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای مهم Discord">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف event: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (نام مستعار legacy: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (uploadهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`، سطح بالای `bindings[]` (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- tokenهای bot را secret در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های supervised ترجیح داده می‌شود).
- مجوزهای Discord را با کمترین سطح دسترسی اعطا کنید.
- اگر deploy/state مربوط به command قدیمی است، Gateway را restart کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را به Gateway pair کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار group chat و allowlist.
  </Card>
  <Card title="مسیریابی Channel" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها route کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و channelها را به عامل‌ها map کنید.
  </Card>
  <Card title="دستورهای Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار native command.
  </Card>
</CardGroup>
