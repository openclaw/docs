---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی از بات Discord، قابلیت‌ها و پیکربندی
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های guild از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستور بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و روند ترمیم.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با یک bot بسازید، bot را به سرورتان اضافه کنید، و آن را با OpenClaw جفت کنید. پیشنهاد می‌کنیم bot خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="یک برنامه و bot در Discord بسازید">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل "OpenClaw" برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. مقدار **Username** را به هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="intentهای ممتاز را فعال کنید">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (پیشنهادی؛ برای فهرست‌های مجاز نقش و تطبیق نام به ID الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="توکن bot خود را کپی کنید">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    با وجود نامش، این کار نخستین توکن شما را تولید می‌کند — چیزی واقعاً "بازنشانی" نمی‌شود.
    </Note>

    توکن را کپی و در جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز دارید.

  </Step>

  <Step title="یک URL دعوت تولید کنید و bot را به سرورتان اضافه کنید">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن bot به سرورتان تولید خواهید کرد.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخش **Bot Permissions** در پایین ظاهر می‌شود. حداقل این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها
    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی لینک‌ها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در threadهای Discord پست کنید، از جمله workflowهای کانال forum یا media که یک thread ایجاد یا ادامه می‌دهند، **Send Messages in Threads** را هم فعال کنید.
    URL تولیدشده در پایین را کپی کنید، در مرورگر خود بچسبانید، سرورتان را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید bot خود را در سرور Discord ببینید.

  </Step>

  <Step title="Developer Mode را فعال کنید و IDهای خود را جمع‌آوری کنید">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید IDهای داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتار) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. روی **آیکون سرور** خود در نوار کناری راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در گام بعدی هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="پیام‌های مستقیم از اعضای سرور را مجاز کنید">
    برای کار کردن جفت‌سازی، Discord باید اجازه دهد bot به شما پیام مستقیم بفرستد. روی **آیکون سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله botها) اجازه می‌دهد به شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های guild استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="توکن bot خود را به‌صورت امن تنظیم کنید (آن را در چت نفرستید)">
    توکن bot شما در Discord یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌صورت سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه OpenClaw Mac یا با متوقف کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از یک shell اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند پس از بازراه‌اندازی env SecretRef را resolve کند.
    اگر میزبان شما توسط lookup برنامه هنگام startup در Discord مسدود یا rate-limit شده است، ID برنامه/client مربوط به Discord را از Developer Portal تنظیم کنید تا startup بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند bot در Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="OpenClaw را پیکربندی و جفت کنید">

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و این را به آن بگویید. اگر Discord نخستین کانال شماست، به‌جای آن از تب CLI / config استفاده کنید.

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

        fallback محیطی برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقدارهای متنی ساده `token` پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند bot در Discord، هر توکن bot و ID برنامه را زیر حساب خودش نگه دارید. `channels.discord.applicationId` در سطح بالا توسط حساب‌ها به ارث برده می‌شود، پس فقط زمانی آن را آنجا تنظیم کنید که همه حساب‌ها باید از همان ID برنامه استفاده کنند.

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

  <Step title="نخستین جفت‌سازی پیام مستقیم را تأیید کنید">
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به bot خود پیام مستقیم بدهید. bot با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        کد جفت‌سازی را در کانال موجودتان برای عامل خود بفرستید:

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
resolve توکن با آگاهی از حساب انجام می‌شود. مقدارهای توکن در پیکربندی بر fallback محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به همان توکن bot resolve شوند، OpenClaw فقط یک monitor Gateway برای آن توکن راه‌اندازی می‌کند. توکنِ آمده از پیکربندی بر fallback محیطی پیش‌فرض اولویت دارد؛ در غیر این صورت نخستین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های outbound پیشرفته (ابزار message/کنش‌های کانال)، یک `token` صریح برای همان فراخوانی استفاده می‌شود. این مورد برای کنش‌های سبک send و read/probe اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات policy/retry حساب همچنان از حساب انتخاب‌شده در snapshot فعال runtime می‌آیند.
</Note>

## پیشنهادی: یک فضای کاری guild راه‌اندازی کنید

وقتی پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که هر کانال در آن نشست عامل خودش را با context خودش می‌گیرد. این کار برای سرورهای خصوصی که فقط شما و bot شما در آن هستید پیشنهاد می‌شود.

<Steps>
  <Step title="سرور خود را به فهرست مجاز guild اضافه کنید">
    این کار به عامل شما اجازه می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
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

  <Step title="پاسخ‌ها بدون @mention را مجاز کنید">
    به‌طور پیش‌فرض، عامل شما فقط زمانی در کانال‌های guild پاسخ می‌دهد که @mention شده باشد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های guild، پاسخ‌های نهایی عادی assistant به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل مشاهده Discord باید صراحتاً با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض در پس‌زمینه بماند و فقط وقتی تصمیم می‌گیرد پاسخ کانال مفید است پست کند.

    این یعنی مدل انتخاب‌شده باید با اطمینان ابزارها را فراخوانی کند. اگر Discord حالت تایپ را نشان می‌دهد و logها مصرف توکن را نشان می‌دهند اما هیچ پیامی پست نمی‌شود، log نشست را برای متن assistant با `didSendViaMessagingTool: false` بررسی کنید. این یعنی مدل به‌جای فراخوانی `message(action=send)` یک پاسخ نهایی خصوصی تولید کرده است. به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا از پیکربندی زیر برای بازگرداندن پاسخ‌های نهایی خودکار legacy استفاده کنید.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="پیکربندی">
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

        برای بازگرداندن پاسخ‌های نهایی خودکار legacy برای اتاق‌های گروهی/کانالی، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برای حافظه در کانال‌های guild برنامه‌ریزی کنید">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های guild به‌طور خودکار MEMORY.md را بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به context مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` بگذارید (آن‌ها برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود بسازید و شروع به چت کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست ایزوله خودش را می‌گیرد — پس می‌توانید `#coding`، `#home`، `#research`، یا هر چیزی که مناسب workflow شماست راه‌اندازی کنید.

## مدل runtime

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ‌ها قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ گیلد/کانال Discord به‌عنوان زمینهٔ نامطمئن به اعلان مدل افزوده می‌شود، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن پوشش را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل (`agent:main:main`) را به‌اشتراک می‌گذارند.
- کانال‌های گیلد کلیدهای نشست جداشده هستند (`agent:<agentId>:discord:channel:<channelId>`).
- پیام‌های مستقیم گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- دستورهای اسلش بومی در نشست‌های فرمان جداشده اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان‌های cron/heartbeat فقط‌متنی به Discord، پاسخ نهاییِ قابل‌مشاهده برای دستیار را یک‌بار استفاده می‌کند. بارهای رسانه‌ای و مؤلفه‌های ساختاریافته وقتی عامل چند بار قابل‌تحویل تولید می‌کند، همچنان چندپیامه باقی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته‌ای را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی به والد انجمن (`channel:<forumId>`) بفرستید تا یک رشته به‌صورت خودکار ایجاد شود. عنوان رشته از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم یک رشته استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

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

OpenClaw از کانتینرهای مؤلفه‌های Discord v2 برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با بار `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی دوباره به عامل مسیریابی می‌شوند و از تنظیمات موجود Discord `replyToMode` پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب واحد را مجاز می‌کنند
- انواع انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌گرها و فرم‌ها تا زمان انقضا چندین بار قابل‌استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی یک دکمه کلیک کند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربر Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شده باشد، کاربران نامطابق یک رد زودگذر دریافت می‌کنند.

دستورهای اسلش `/model` و `/models` یک انتخاب‌گر تعاملی مدل را با فهرست‌های کشویی ارائه‌دهنده، مدل، و زمان‌اجرای سازگار، به‌همراه یک مرحلهٔ ارسال باز می‌کنند. `/models add` منسوخ شده است و اکنون به‌جای ثبت مدل‌ها از چت، یک پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخاب‌گر زودگذر است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک ارجاع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (یک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با ارجاع پیوست مطابقت داشته باشد، از `filename` برای بازنویسی نام استفاده کنید

فرم‌های مودال:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- انواع فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw به‌صورت خودکار یک دکمهٔ محرک اضافه می‌کند

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
    `channels.discord.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز متعارف پیام مستقیم است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند آن است که `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست پیام مستقیم باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی درخواست می‌گیرند).

    تقدم چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی تقدم دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف پیام مستقیم برای تحویل:

    - `user:<id>`
    - اشارهٔ `<@id>`

    شناسه‌های عددی خام معمولاً وقتی پیش‌فرض کانال فعال باشد، به‌عنوان شناسه‌های کانال حل می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر پیام مستقیم حساب، برای سازگاری به‌عنوان هدف‌های پیام مستقیم کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="DM access groups">
    پیام‌های مستقیم Discord می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی میان کانال‌های پیام مشترک هستند. برای یک گروه ایستا که اعضایش در نحو عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه‌های دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست عضو جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ پیام مستقیم عضو گیلد پیکربندی‌شده است و پس از اعمال نقش‌ها و بازنویسی‌های کانال، درحال‌حاضر مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    مثال: به هر کسی که می‌تواند `#maintainers` را ببیند اجازه دهید به ربات پیام مستقیم بدهد، درحالی‌که پیام‌های مستقیم برای همهٔ دیگران بسته می‌ماند.

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

    می‌توانید ورودی‌های پویا و ایستا را با هم ترکیب کنید:

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

    جست‌وجوها در صورت شکست بسته می‌مانند. اگر Discord `Missing Access` برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال به گیلد دیگری تعلق داشته باشد، فرستندهٔ پیام مستقیم غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، در Discord Developer Portal گزینهٔ **Server Members Intent** را برای ربات فعال کنید. پیام‌های مستقیم وضعیت عضو گیلد را شامل نمی‌شوند، بنابراین OpenClaw عضو را هنگام مجوزدهی از طریق Discord REST حل می‌کند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت گیلد با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط پایهٔ امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - گیلد باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شود) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابقت داشته باشند مجاز هستند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر یک گیلد `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک گیلد بلوک `channels` نداشته باشد، همهٔ کانال‌های آن گیلدِ در فهرست مجاز، مجاز هستند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، پس‌گرد زمان اجرا `groupPolicy="allowlist"` خواهد بود (با هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های گیلد به‌طور پیش‌فرض با اشاره محدود می‌شوند.

    تشخیص اشاره شامل موارد زیر است:

    - اشارهٔ صریح به ربات
    - الگوهای اشارهٔ پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، پس‌گرد `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به ربات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو اشارهٔ متعارف استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از شکل قدیمی اشارهٔ لقب `<@!USER_ID>` استفاده نکنید.

    `requireMention` به‌ازای هر گیلد/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقش دیگری اشاره می‌کنند اما به ربات اشاره نمی‌کنند، حذف می‌کند (به‌جز @everyone/@here).

    پیام‌های مستقیم گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا slugهای کانال)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر نقش

از `bindings[].match.roles` برای مسیریابی اعضای گیلد Discord به عامل‌های مختلف بر اساس شناسهٔ نقش استفاده کنید. اتصال‌های مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از اتصال‌های همتا یا همتای والد و پیش از اتصال‌های فقط‌گیلد ارزیابی می‌شوند. اگر یک اتصال فیلدهای تطبیق دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

## دستورهای بومی و احراز هویت فرمان

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی دستورهای اسلش Discord را هنگام راه‌اندازی رد می‌کند. دستورهایی که قبلا ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت دستورهای بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که در پردازش عادی پیام به کار می‌روند.
- دستورها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای فهرست دستورها و رفتار آن‌ها، [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض دستور اسلش:

- `ephemeral: true`

## جزئیات قابلیت

<AccordionGroup>
  <Accordion title="برچسب‌های پاسخ و پاسخ‌های بومی">
    Discord از برچسب‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    توسط `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌سازی ضمنی پاسخ را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای آن نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    نوبت ورودی یک دسته کاهش‌نوسان‌یافته از چند پیام باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتا برای چت‌های مبهم و انفجاری بخواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه ارائه می‌شوند تا عامل‌ها بتوانند پیام‌های خاص را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هم‌زمان با رسیدن متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming` مقدارهای `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش نگه می‌دارد و تا تحویل نهایی آن را با پیشرفت ابزار به‌روزرسانی می‌کند؛ `streamMode` یک نام مستعار قدیمی زمان اجرا است. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ماندگارشده به کلید استاندارد بازنویسی شود.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` بگذارید. اگر پخش بلوکی Discord صراحتا فعال شده باشد، OpenClaw برای جلوگیری از پخش دوباره، جریان پیش‌نمایش را رد می‌کند.

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

    - `partial` هنگام رسیدن توکن‌ها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی به اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید؛ محدود به `textChunkLimit`).
    - رسانه، خطا، و نهایی‌های پاسخ صریح، ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات دستور/اجرا را در خط‌های پیشرفت فشرده کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام دستور/اجرا را پنهان کنید، در حالی که خط‌های پیشرفت فشرده حفظ می‌شوند:

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

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی پخش `block` صراحتا فعال شده باشد، OpenClaw برای جلوگیری از پخش دوباره، جریان پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، زمینه، و رفتار رشته">
    زمینه تاریخچه Guild:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به عنوان نشست‌های کانال مسیریابی می‌شوند و مگر اینکه بازنویسی شده باشند، پیکربندی کانال والد را به ارث می‌برند.
    - نشست‌های رشته، انتخاب `/model` در سطح نشست کانال والد را فقط به عنوان جایگزین مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی رشته همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه ارث‌بری رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را وارد بذرگذاری از رونوشت والد می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند هدف‌های DM با قالب `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام جایگزین فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوع‌های کانال به عنوان زمینه **نامطمئن** تزریق می‌شوند. فهرست‌های مجاز کنترل می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل حذف زمینه تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های وابسته به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به هدف نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست مسیریابی شوند (از جمله نشست‌های زیرعامل).

    دستورها:

    - `/focus <target>` رشته فعلی/جدید را به یک هدف زیرعامل/نشست متصل می‌کند
    - `/unfocus` اتصال رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت اتصال را نشان می‌دهد
    - `/session idle <duration|off>` عدم فعالیت auto-unfocus را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر عمر سخت را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند

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
    - `defaultSpawnContext` زمینه بومی زیرعامل را برای ایجادهای وابسته به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` توسط `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط اتصال رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="اتصال‌های پایدار کانال ACP">
    برای فضاهای کاری ACP پایدار و "always-on"، اتصال‌های ACP تایپ‌شده سطح بالا را پیکربندی کنید که گفت‌وگوهای Discord را هدف می‌گیرند.

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
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را در همان‌جا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند در زمان فعال بودن، حل هدف را بازنویسی کنند.
    - `spawnSessions` ایجاد/اتصال رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر Guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سامانه تبدیل می‌شوند و به نشست Discord مسیریابی‌شده پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های پیکربندی">
    نوشتن‌های پیکربندی آغازشده از کانال به طور پیش‌فرض فعال هستند.

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

  <Accordion title="پراکسی Gateway">
    ترافیک WebSocket گیت‌وی Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل فهرست مجاز) را با `channels.discord.proxy` از طریق یک پراکسی HTTP(S) مسیریابی کنید.

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

  <Accordion title="پشتیبانی از PluralKit">
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
    - نام‌های نمایشی عضو فقط وقتی با نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به پنجره زمانی محدود هستند
    - اگر جست‌وجو ناموفق باشد، پیام‌های پروکسی‌شده به عنوان پیام‌های ربات در نظر گرفته می‌شوند و حذف می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها به منشن‌های خروجی قطعی برای کاربران شناخته‌شده Discord نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها هندل‌های بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. هندل‌های ناشناخته، `@everyone`، `@here`، و منشن‌های داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

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
    وقتی یک وضعیت یا فیلد فعالیت تنظیم می‌کنید، یا وقتی حضور خودکار را فعال می‌کنید، به‌روزرسانی‌های حضور اعمال می‌شوند.

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
    - 4: سفارشی (از متن فعالیت به عنوان وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
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

    حضور خودکار، دسترسی‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: healthy => online، degraded یا unknown => idle، exhausted یا unavailable => dnd. بازنویسی‌های اختیاری متن:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord از رسیدگی به تاییدهای مبتنی بر دکمه در پیام‌های خصوصی پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری درخواست‌های تایید را در کانال مبدا ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و حداقل یک تاییدکننده قابل حل باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، Discord تاییدهای exec بومی را به‌صورت خودکار فعال می‌کند. Discord تاییدکنندگان exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال‌کردن صریح Discord به‌عنوان کلاینت تایید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک، مانند `/diagnostics` و `/export-trajectory`، OpenClaw درخواست‌های تایید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. ابتدا وقتی مالک فراخواننده یک مسیر مالک Discord داشته باشد، پیام خصوصی Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به اولین مسیر مالک در دسترس از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، درخواست تایید در کانال قابل مشاهده است. فقط تاییدکنندگان حل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. درخواست‌های تایید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل از طریق پیام خصوصی برمی‌گردد.

    Discord همچنین دکمه‌های تایید مشترکی را که کانال‌های چت دیگر استفاده می‌کنند نمایش می‌دهد. آداپتر بومی Discord عمدتا مسیریابی پیام خصوصی تاییدکننده و انتشار در کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود داشته باشند، UX اصلی تایید هستند؛ OpenClaw
    فقط زمانی باید فرمان دستی `/approve` را شامل کند که نتیجه ابزار بگوید
    تاییدهای چت در دسترس نیستند یا تایید دستی تنها مسیر است.
    اگر زمان اجرای تایید بومی Discord فعال نباشد، OpenClaw اعلان
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت بومی به هیچ هدفی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان چت با فرمان دقیق `/approve`
    از تایید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تایید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تاییدها به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تاییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور، و اقدام‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- نظارت: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` می‌پذیرد (URL یا مسیر فایل محلی) تا تصویر جلد رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه اقدام                                                                                                                                                              | پیش‌فرض       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| reactions، messages، threads، pins، polls، search، memberInfo، roleInfo، channelInfo، channels، voiceStatus، events، stickers، emojiUploads، stickerUploads، permissions | فعال          |
| roles                                                                                                                                                                    | غیرفعال       |
| moderation                                                                                                                                                               | غیرفعال       |
| presence                                                                                                                                                                 | غیرفعال       |

## رابط کاربری Components v2

OpenClaw از components v2 در Discord برای تاییدهای exec و نشانگرهای میان‌بافتی استفاده می‌کند. اقدام‌های پیام Discord می‌توانند `components` را نیز برای رابط کاربری سفارشی بپذیرند (پیشرفته؛ نیازمند ساخت payload مولفه از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تاکیدی استفاده‌شده توسط ظرف‌های مولفه Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی components v2 وجود داشته باشد، `embeds` نادیده گرفته می‌شود.

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

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موجی). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی allowlistهای نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی هدف، مجوزهای Connect، Speak، Send Messages، و Read Message History را بدهید.
5. فرمان‌های بومی را فعال کنید (`commands.native` یا `channels.discord.commands.native`).
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از agent پیش‌فرض حساب استفاده می‌کند و از همان قوانین allowlist و سیاست گروهی فرمان‌های دیگر Discord پیروی می‌کند.

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

- `voice.tts` فقط برای پخش صدا، `messages.tts` را بازنویسی می‌کند.
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند. برای به‌ارث‌بردن مدل agent مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر ندارد.
- بازنویسی‌های `systemPrompt` مخصوص کانال Discord روی نوبت‌های رونویسی صدا برای همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صدا وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) به‌دست می‌آورند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال‌کردن فرمان‌های `/vc`، زمان اجرای صدا، و intent Gateway مربوط به `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحا بازنویسی کند. برای اینکه intent از فعال‌سازی موثر صدا پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های join در `@discordjs/voice` منتقل می‌شوند.
- اگر تنظیم نشده باشند، پیش‌فرض‌های `@discordjs/voice` برابر `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع شدن یک نشست صوتی، چه مدت منتظر شروع اتصال مجدد بماند پیش از آنکه آن را نابود کند. پیش‌فرض: `15000`.
- OpenClaw همچنین شکست‌های رمزگشایی دریافت را زیر نظر می‌گیرد و پس از شکست‌های تکراری در یک بازه کوتاه، با ترک/پیوستن دوباره به کانال صوتی به‌صورت خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت مکررا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط bundled `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 در discord.js است، که issue #11419 در discord.js را بست.

خط لوله کانال صوتی:

- ضبط PCM در Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` رسیدگی به STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونویسی از طریق ورود و مسیریابی Discord ارسال می‌شود، در حالی که LLM پاسخ با یک سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` متعلق به agent را پنهان می‌کند و متن بازگشتی می‌خواهد، چون صدای Discord مالک پخش TTS نهایی است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صدای حاصل در کانال متصل‌شده پخش می‌شود.

اعتبارنامه‌ها به‌ازای هر مولفه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord یک پیش‌نمایش موجی نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw موج را به‌صورت خودکار تولید می‌کند، اما برای بازرسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در همان payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را راه‌اندازی مجدد کنید

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

    - `groupPolicy="allowlist"` بدون allowlist گیلد/کانال منطبق
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist `users` گیلد/کانال مسدود شده است

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    پیچ‌های تنظیم صف Gateway در Discord:

    - حساب تکی: `channels.discord.eventQueue.listenerTimeout`
    - چندحسابی: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener Gateway در Discord را کنترل می‌کند، نه طول عمر نوبت agent

    Discord برای نوبت‌های agent صف‌شده، timeout متعلق به کانال اعمال نمی‌کند. listenerهای پیام بلافاصله تحویل می‌دهند، و اجراهای صف‌شده Discord ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/زمان اجرا کامل شود یا کار را لغو کند حفظ می‌کنند.

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

  <Accordion title="هشدارهای اتمام مهلت جست‌وجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده Discord `/gateway/bot` را دریافت می‌کند. شکست‌های گذرا به URL پیش‌فرض Gateway در Discord بازمی‌گردند و در لاگ‌ها محدودیت نرخ دارند.

    تنظیمات اتمام مهلت فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - جایگزین محیطی وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های مجدد به‌دلیل اتمام مهلت READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد در زمان اجرا، منتظر رویداد `READY` مربوط به Gateway در Discord می‌ماند. راه‌اندازی‌های چندحساب با فاصله‌گذاری راه‌اندازی ممکن است به پنجره طولانی‌تری برای READY هنگام شروع نسبت به مقدار پیش‌فرض نیاز داشته باشند.

    تنظیمات اتمام مهلت READY:

    - راه‌اندازی تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - جایگزین محیطی راه‌اندازی وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - زمان اجرا تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - زمان اجرا چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - جایگزین محیطی زمان اجرا وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض زمان اجرا: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناسازگاری‌های ممیزی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق در زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل راستی‌آزمایی کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در انتظار تأیید جفت‌سازی در حالت `pairing`

  </Accordion>

  <Accordion title="حلقه‌های bot به bot">
    به‌طور پیش‌فرض پیام‌های نوشته‌شده توسط bot نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، از قوانین سخت‌گیرانه mention و allowlist استفاده کنید تا از رفتار حلقه‌ای جلوگیری شود.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های bot را بپذیرید که به bot اشاره می‌کنند.

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

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord وجود داشته باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - لاگ‌ها را برای موارد زیر بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر شکست‌ها پس از پیوستن مجدد خودکار ادامه داشتند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه دریافت DAVE در upstream در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

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
- جریان‌دهی: `streaming` (نام مستعار قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش مجدد: `mediaMaxMb` (بارگذاری‌های خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`), `retry`
- کنش‌ها: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ویژگی‌ها: `threadBindings`, سطح بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های bot را به‌عنوان راز در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح دارد).
- مجوزهای Discord را با حداقل دسترسی لازم اعطا کنید.
- اگر استقرار/وضعیت فرمان کهنه است، Gateway را دوباره راه‌اندازی کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار گپ گروهی و allowlist.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به agentها نگاشت کنید.
  </Card>
  <Card title="فرمان‌های Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
