---
read_when:
    - راه‌اندازی پشتیبانی از iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی از iMessage از طریق imsg ‏(JSON-RPC روی stdio)، همراه با کنش‌های API خصوصی برای پاسخ‌ها، tapbackها، جلوه‌ها، پیوست‌ها و مدیریت گروه. برای راه‌اندازی‌های جدید iMessage در OpenClaw، هنگامی که نیازمندی‌های میزبان سازگار باشند، گزینهٔ ترجیحی است.
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرارهای iMessage در OpenClaw، از `imsg` روی میزبان macOS Messages که به حساب وارد شده است استفاده کنید. اگر Gateway شما روی Linux یا Windows اجرا می‌شود، `channels.imessage.cliPath` را به یک پوشش SSH اشاره دهید که `imsg` را روی Mac اجرا می‌کند.

**جبران قطعی Gateway اختیاری است.** وقتی فعال باشد (`channels.imessage.catchup.enabled: true`)، gateway پیام‌های ورودی‌ای را که هنگام آفلاین بودن آن (کرش، راه‌اندازی مجدد، خواب Mac) در `chat.db` ثبت شده‌اند، در شروع بعدی بازپخش می‌کند. به‌صورت پیش‌فرض غیرفعال است — [جبران پس از قطعی gateway](#catching-up-after-gateway-downtime) را ببینید. [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) را می‌بندد.
</Note>

<Warning>
پشتیبانی BlueBubbles حذف شده است. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` مهاجرت دهید؛ OpenClaw فقط از طریق `imsg` از iMessage پشتیبانی می‌کند. برای اعلان کوتاه از [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) شروع کنید، یا برای جدول کامل مهاجرت [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) را ببینید.
</Warning>

وضعیت: یکپارچه‌سازی بومی CLI خارجی. Gateway، `imsg rpc` را اجرا می‌کند و از طریق JSON-RPC روی stdio ارتباط برقرار می‌کند (بدون daemon/port جداگانه). کنش‌های پیشرفته به `imsg launch` و یک بررسی موفق API خصوصی نیاز دارند.

<CardGroup cols={3}>
  <Card title="کنش‌های API خصوصی" icon="wand-sparkles" href="#private-api-actions">
    پاسخ‌ها، tapbackها، افکت‌ها، پیوست‌ها و مدیریت گروه.
  </Card>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم iMessage به‌صورت پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Mac راه‌دور" icon="terminal" href="#remote-mac-over-ssh">
    وقتی Gateway روی Mac مربوط به Messages اجرا نمی‌شود، از یک پوشش SSH استفاده کنید.
  </Card>
  <Card title="مرجع پیکربندی" icon="settings" href="/fa/gateway/config-channels#imessage">
    مرجع کامل فیلدهای iMessage.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Mac محلی (مسیر سریع)">
    <Steps>
      <Step title="نصب و بررسی imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="پیکربندی OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="راه‌اندازی gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="تأیید نخستین جفت‌سازی پیام مستقیم (dmPolicy پیش‌فرض)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac راه‌دور از طریق SSH">
    OpenClaw فقط به یک `cliPath` سازگار با stdio نیاز دارد، بنابراین می‌توانید `cliPath` را به یک اسکریپت پوششی اشاره دهید که با SSH به یک Mac راه‌دور وصل می‌شود و `imsg` را اجرا می‌کند.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    پیکربندی پیشنهادی وقتی پیوست‌ها فعال هستند:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند با تحلیل اسکریپت پوششی SSH آن را به‌طور خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

  </Tab>
</Tabs>

## نیازمندی‌ها و مجوزها (macOS)

- Messages باید روی Mac اجراکننده `imsg` وارد حساب شده باشد.
- برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند، دسترسی کامل دیسک لازم است (دسترسی به پایگاه داده Messages).
- برای ارسال پیام‌ها از طریق Messages.app، مجوز Automation لازم است.
- برای کنش‌های پیشرفته (واکنش / ویرایش / لغو ارسال / پاسخ رشته‌ای / افکت‌ها / عملیات گروهی)، System Integrity Protection باید غیرفعال باشد — بخش [فعال‌سازی API خصوصی imsg](#enabling-the-imsg-private-api) را در پایین ببینید. ارسال/دریافت متن و رسانه پایه بدون آن کار می‌کند.

<Tip>
مجوزها برای هر زمینه فرایند اعطا می‌شوند. اگر gateway به‌صورت بدون واسط اجرا می‌شود (LaunchAgent/SSH)، یک فرمان تعاملی یک‌باره را در همان زمینه اجرا کنید تا درخواست‌های مجوز ظاهر شوند:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## فعال‌سازی API خصوصی imsg

`imsg` در دو حالت عملیاتی عرضه می‌شود:

- **حالت پایه** (پیش‌فرض، بدون نیاز به تغییر SIP): متن و رسانه خروجی از طریق `send`، پایش/تاریخچه ورودی، فهرست گفتگوها. این همان چیزی است که بلافاصله پس از یک `brew install steipete/tap/imsg` تازه، همراه با مجوزهای استاندارد macOS در بالا، دریافت می‌کنید.
- **حالت API خصوصی**: `imsg` یک dylib کمکی را به `Messages.app` تزریق می‌کند تا توابع داخلی `IMCore` را فراخوانی کند. این همان چیزی است که `react`، `edit`، `unsend`، `reply` (رشته‌ای)، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، به‌علاوه نشانگرهای تایپ و رسیدهای خواندن را فعال می‌کند.

برای رسیدن به سطح کنش پیشرفته‌ای که این صفحه کانال مستند می‌کند، به حالت API خصوصی نیاز دارید. README مربوط به `imsg` درباره این نیاز صریح است:

> قابلیت‌های پیشرفته مانند `read`، `typing`، `launch`، ارسال غنی مبتنی بر bridge، تغییر پیام، و مدیریت گفتگو اختیاری هستند. آن‌ها نیاز دارند SIP غیرفعال باشد و یک dylib کمکی به `Messages.app` تزریق شود. وقتی SIP فعال باشد، `imsg launch` از تزریق خودداری می‌کند.

روش تزریق کمکی از dylib خود `imsg` برای دسترسی به APIهای خصوصی Messages استفاده می‌کند. در مسیر iMessage مربوط به OpenClaw هیچ سرور شخص ثالث یا runtime مربوط به BlueBubbles وجود ندارد.

<Warning>
**غیرفعال کردن SIP یک مصالحه امنیتی واقعی است.** SIP یکی از محافظت‌های اصلی macOS در برابر اجرای کد سیستمی تغییر‌یافته است؛ خاموش کردن آن در سطح سیستم سطح حمله و اثرات جانبی بیشتری ایجاد می‌کند. به‌طور خاص، **غیرفعال کردن SIP روی Macهای Apple Silicon همچنین قابلیت نصب و اجرای برنامه‌های iOS روی Mac شما را غیرفعال می‌کند**.

با این موضوع به‌عنوان یک انتخاب عملیاتی آگاهانه برخورد کنید، نه یک پیش‌فرض. اگر مدل تهدید شما نمی‌تواند خاموش بودن SIP را تحمل کند، iMessage بسته‌بندی‌شده به حالت پایه محدود می‌شود — فقط ارسال/دریافت متن و رسانه، بدون واکنش / ویرایش / لغو ارسال / افکت‌ها / عملیات گروهی.
</Warning>

### راه‌اندازی

1. **`imsg` را نصب (یا ارتقا) کنید** روی Macی که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   خروجی `imsg status --json`، `bridge_version`، `rpc_methods` و `selectors` مربوط به هر روش را گزارش می‌کند تا پیش از شروع ببینید build فعلی از چه چیزهایی پشتیبانی می‌کند.

2. **System Integrity Protection را غیرفعال کنید.** این مورد وابسته به نسخه macOS است، چون نیاز زیربنایی Apple به سیستم‌عامل و سخت‌افزار بستگی دارد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Library Validation را از طریق Terminal غیرفعال کنید، به Recovery Mode راه‌اندازی مجدد کنید، `csrutil disable` را اجرا کنید، سپس دوباره راه‌اندازی کنید.
   - **macOS 11+ (Big Sur و نسخه‌های بعدی)، Intel:** Recovery Mode (یا Internet Recovery)، `csrutil disable`، سپس راه‌اندازی مجدد.
   - **macOS 11+، Apple Silicon:** دنباله راه‌اندازی با دکمه روشن/خاموش برای ورود به Recovery؛ در نسخه‌های اخیر macOS هنگام کلیک روی Continue کلید **Left Shift** را نگه دارید، سپس `csrutil disable`. تنظیمات ماشین مجازی مسیر جداگانه‌ای دارند — ابتدا یک snapshot از VM بگیرید.
   - **macOS 26 / Tahoe:** سیاست‌های library-validation و بررسی‌های مجوز خصوصی `imagent` سخت‌گیرانه‌تر شده‌اند؛ ممکن است `imsg` برای همگام ماندن به build به‌روز نیاز داشته باشد. اگر پس از ارتقای عمده macOS، تزریق `imsg launch` یا `selectors` خاص شروع به برگرداندن false کردند، پیش از فرض موفق بودن مرحله SIP، یادداشت‌های انتشار `imsg` را بررسی کنید.

   پیش از اجرای `imsg launch`، جریان Recovery-mode مربوط به Apple را برای Mac خود دنبال کنید تا SIP را غیرفعال کنید.

3. **کمک‌کننده را تزریق کنید.** با SIP غیرفعال و Messages.app وارد حساب‌شده:

   ```bash
   imsg launch
   ```

   وقتی SIP هنوز فعال باشد، `imsg launch` از تزریق خودداری می‌کند، بنابراین این فرمان همچنین تأییدی است که مرحله ۲ اثر کرده است.

4. **bridge را از OpenClaw بررسی کنید:**

   ```bash
   openclaw channels status --probe
   ```

   ورودی iMessage باید `works` گزارش کند، و `imsg status --json | jq '.selectors'` باید `retractMessagePart: true` را به‌همراه هر selector ویرایش / تایپ / خواندنی که build macOS شما ارائه می‌دهد نشان دهد. دروازه‌بندی هر روش در Plugin مربوط به OpenClaw در `actions.ts` فقط کنش‌هایی را تبلیغ می‌کند که selector زیربنایی آن‌ها `true` باشد، بنابراین سطح کنشی که در فهرست ابزارهای agent می‌بینید بازتاب‌دهنده کاری است که bridge واقعاً می‌تواند روی این میزبان انجام دهد.

اگر `openclaw channels status --probe` کانال را به‌عنوان `works` گزارش می‌کند اما کنش‌های مشخص در زمان dispatch خطای "iMessage `<action>` requires the imsg private API bridge" می‌دهند، `imsg launch` را دوباره اجرا کنید — کمک‌کننده ممکن است از کار بیفتد (راه‌اندازی مجدد Messages.app، به‌روزرسانی OS و غیره) و وضعیت cache‌شده `available: true` تا زمانی که بررسی بعدی تازه‌سازی شود، همچنان کنش‌ها را تبلیغ می‌کند.

### وقتی نمی‌توانید SIP را غیرفعال کنید

اگر غیرفعال بودن SIP برای مدل تهدید شما قابل قبول نیست:

- `imsg` به حالت پایه برمی‌گردد — فقط متن + رسانه + دریافت.
- Plugin مربوط به OpenClaw همچنان ارسال متن/رسانه و پایش ورودی را تبلیغ می‌کند؛ فقط `react`، `edit`، `unsend`، `reply`، `sendWithEffect` و عملیات گروهی را از سطح کنش پنهان می‌کند (مطابق دروازه قابلیت هر روش).
- می‌توانید برای بار کاری iMessage یک Mac جداگانه غیر Apple-Silicon (یا یک Mac اختصاصی bot) با SIP خاموش اجرا کنید، در حالی که SIP را روی دستگاه‌های اصلی خود فعال نگه می‌دارید. بخش [کاربر macOS اختصاصی bot (هویت iMessage جداگانه)](#deployment-patterns) را در پایین ببینید.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist باید فرستندگان را مشخص کنند: handleها یا گروه‌های دسترسی ایستای فرستنده (`accessGroup:<name>`). برای هدف‌های گفتگو مانند `chat_id:*`، `chat_guid:*` یا `chat_identifier:*` از `channels.imessage.groupAllowFrom` استفاده کنید؛ برای کلیدهای رجیستری عددی `chat_id` از `channels.imessage.groups` استفاده کنید.

  </Tab>

  <Tab title="سیاست گروه + mentionها">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض هنگام پیکربندی)
    - `open`
    - `disabled`

    allowlist فرستنده گروه: `channels.imessage.groupAllowFrom`.

    ورودی‌های `groupAllowFrom` همچنین می‌توانند به گروه‌های دسترسی ایستای فرستنده (`accessGroup:<name>`) ارجاع دهند.

    fallback زمان اجرا: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستنده گروه iMessage از `allowFrom` استفاده می‌کنند؛ وقتی پذیرش پیام مستقیم و گروه باید متفاوت باشد، `groupAllowFrom` را تنظیم کنید.
    یادداشت زمان اجرا: اگر `channels.imessage` کاملاً وجود نداشته باشد، runtime به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    <Warning>
    مسیریابی گروه **دو** دروازه allowlist دارد که پشت‌سرهم اجرا می‌شوند، و هر دو باید عبور کنند:

    1. **allowlist فرستنده / هدف گفتگو** (`channels.imessage.groupAllowFrom`) — handle، `chat_guid`، `chat_identifier` یا `chat_id`.
    2. **رجیستری گروه** (`channels.imessage.groups`) — با `groupPolicy: "allowlist"`، این دروازه یا به یک ورودی wildcard از نوع `groups: { "*": { ... } }` نیاز دارد (که `allowAll = true` را تنظیم می‌کند)، یا به یک ورودی صریح برای هر `chat_id` زیر `groups`.

    اگر دروازه ۲ هیچ چیزی نداشته باشد، هر پیام گروهی حذف می‌شود. Plugin در سطح پیش‌فرض log دو سیگنال در سطح `warn` منتشر می‌کند:

    - یک‌بار برای هر حساب در زمان شروع: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - یک‌بار برای هر `chat_id` در زمان اجرا: `imessage: dropping group message from chat_id=<id> ...`

    پیام‌های مستقیم همچنان کار می‌کنند، چون از مسیر کد متفاوتی عبور می‌کنند.

    حداقل پیکربندی برای جاری نگه داشتن گروه‌ها تحت `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    اگر این خطوط `warn` در گزارش Gateway ظاهر شوند، درگاه ۲ در حال حذف کردن است — بلوک `groups` را اضافه کنید.
    </Warning>

    کنترل اشاره برای گروه‌ها:

    - iMessage فرادادهٔ اشارهٔ بومی ندارد
    - تشخیص اشاره از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، با جایگزین `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، کنترل اشاره قابل اعمال نیست

    فرمان‌های کنترلی از فرستندگان مجاز می‌توانند کنترل اشاره را در گروه‌ها دور بزنند.

    `systemPrompt` برای هر گروه:

    هر ورودی زیر `channels.imessage.groups.*` یک رشتهٔ اختیاری `systemPrompt` می‌پذیرد. مقدار در هر نوبتی که پیامی را در آن گروه پردازش می‌کند، به system prompt عامل تزریق می‌شود. تفکیک همانند تفکیک prompt برای هر گروه است که توسط `channels.whatsapp.groups` استفاده می‌شود:

    1. **system prompt مخصوص گروه** (`groups["<chat_id>"].systemPrompt`): وقتی ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد، استفاده می‌شود. اگر `systemPrompt` یک رشتهٔ خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ system prompt برای آن گروه اعمال نمی‌شود.
    2. **system prompt wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص کاملاً در نگاشت وجود نداشته باشد، یا وقتی وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند، استفاده می‌شود.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    promptهای هر گروه فقط برای پیام‌های گروهی اعمال می‌شوند — پیام‌های مستقیم در این کانال تحت تأثیر قرار نمی‌گیرند.

  </Tab>

  <Tab title="جلسه‌ها و پاسخ‌های قطعی">
    - DMها از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروهی استفاده می‌کنند.
    - با مقدار پیش‌فرض `session.dmScope=main`، DMهای iMessage در جلسهٔ اصلی عامل ادغام می‌شوند.
    - جلسه‌های گروهی جدا هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فرادادهٔ کانال/هدف مبدأ، به iMessage برگردانده می‌شوند.

    رفتار رشته‌گفتگوی شبیه گروه:

    برخی رشته‌گفتگوهای iMessage با چند شرکت‌کننده ممکن است با `is_group=false` وارد شوند.
    اگر آن `chat_id` به‌طور صریح زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را به‌عنوان ترافیک گروهی در نظر می‌گیرد (کنترل گروه + جداسازی جلسهٔ گروهی).

  </Tab>
</Tabs>

## اتصال‌های مکالمهٔ ACP

گفتگوهای قدیمی iMessage نیز می‌توانند به جلسه‌های ACP متصل شوند.

روند سریع اپراتور:

- `/acp spawn codex --bind here` را داخل DM یا گفتگوی گروهی مجاز اجرا کنید.
- پیام‌های آینده در همان مکالمهٔ iMessage به جلسهٔ ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان جلسهٔ ACP متصل را درجا بازنشانی می‌کنند.
- `/acp close` جلسهٔ ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از این موارد استفاده کند:

- شناسهٔ نرمال‌شدهٔ DM مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (برای اتصال‌های پایدار گروهی توصیه می‌شود)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

برای رفتار مشترک اتصال ACP، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="کاربر اختصاصی macOS برای بات (هویت جداگانهٔ iMessage)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک بات از پروفایل شخصی Messages شما جدا باشد.

    روند معمول:

    1. یک کاربر اختصاصی macOS ایجاد کنید/وارد آن شوید.
    2. در همان کاربر با Apple ID بات وارد Messages شوید.
    3. `imsg` را در همان کاربر نصب کنید.
    4. wrapper مربوط به SSH را بسازید تا OpenClaw بتواند `imsg` را در زمینهٔ همان کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل همان کاربر اشاره دهید.

    اجرای نخست ممکن است در جلسهٔ همان کاربر بات به تأییدهای GUI نیاز داشته باشد (Automation + Full Disk Access).

  </Accordion>

  <Accordion title="Mac راه‌دور از طریق Tailscale (مثال)">
    توپولوژی رایج:

    - Gateway روی Linux/VM اجرا می‌شود
    - iMessage + `imsg` روی یک Mac در tailnet شما اجرا می‌شود
    - wrapper مربوط به `cliPath` از SSH برای اجرای `imsg` استفاده می‌کند
    - `remoteHost` دریافت پیوست‌ها با SCP را فعال می‌کند

    مثال:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    از کلیدهای SSH استفاده کنید تا هم SSH و هم SCP غیرتعاملی باشند.
    ابتدا مطمئن شوید کلید میزبان مورد اعتماد است (برای مثال `ssh bot@mac-mini.tailnet-1234.ts.net`) تا `known_hosts` پر شود.

  </Accordion>

  <Accordion title="الگوی چندحسابی">
    iMessage از پیکربندی هر حساب زیر `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات history، و فهرست‌های مجاز ریشهٔ پیوست را بازنویسی کند.

  </Accordion>
</AccordionGroup>

## رسانه، تکه‌بندی، و هدف‌های تحویل

<AccordionGroup>
  <Accordion title="پیوست‌ها و رسانه">
    - دریافت پیوست‌های ورودی **به‌طور پیش‌فرض خاموش است** — برای ارسال عکس‌ها، یادداشت‌های صوتی، ویدئو، و پیوست‌های دیگر به عامل، `channels.imessage.includeAttachments: true` را تنظیم کنید. وقتی غیرفعال باشد، iMessageهای فقط‌پیوست پیش از رسیدن به عامل حذف می‌شوند و ممکن است اصلاً هیچ خط گزارش `Inbound message` تولید نکنند.
    - مسیرهای پیوست راه‌دور وقتی `remoteHost` تنظیم شده باشد، می‌توانند از طریق SCP دریافت شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشهٔ پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازهٔ رسانهٔ خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض 16 MB)

  </Accordion>

  <Accordion title="تکه‌بندی خروجی">
    - حد تکهٔ متن: `channels.imessage.textChunkLimit` (پیش‌فرض 4000)
    - حالت تکه‌بندی: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم‌بندی با اولویت پاراگراف)

  </Accordion>

  <Accordion title="قالب‌های آدرس‌دهی">
    هدف‌های صریح ترجیحی:

    - `chat_id:123` (برای مسیریابی پایدار توصیه می‌شود)
    - `chat_guid:...`
    - `chat_identifier:...`

    هدف‌های handle نیز پشتیبانی می‌شوند:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## کنش‌های API خصوصی

وقتی `imsg launch` در حال اجراست و `openclaw channels status --probe` مقدار `privateApi.available: true` را گزارش می‌کند، ابزار پیام علاوه بر ارسال‌های متنی عادی می‌تواند از کنش‌های بومی iMessage استفاده کند.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="کنش‌های موجود">
    - **react**: افزودن/حذف tapbackهای iMessage (`messageId`، `emoji`، `remove`). tapbackهای پشتیبانی‌شده به love، like، dislike، laugh، emphasize، و question نگاشت می‌شوند.
    - **reply**: ارسال پاسخ رشته‌ای به یک پیام موجود (`messageId`، `text` یا `message`، به‌همراه `chatGuid`، `chatId`، `chatIdentifier`، یا `to`).
    - **sendWithEffect**: ارسال متن با یک جلوهٔ iMessage (`text` یا `message`، `effect` یا `effectId`).
    - **edit**: ویرایش پیام ارسال‌شده در نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`، `text` یا `newText`).
    - **unsend**: پس‌گرفتن پیام ارسال‌شده در نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`).
    - **upload-file**: ارسال رسانه/فایل‌ها (`buffer` به‌صورت base64 یا یک `media`/`path`/`filePath` آماده‌شده، `filename`، و `asVoice` اختیاری). نام مستعار قدیمی: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: مدیریت گفتگوهای گروهی وقتی هدف فعلی یک مکالمهٔ گروهی است.

  </Accordion>

  <Accordion title="شناسه‌های پیام">
    زمینهٔ iMessage ورودی، وقتی موجود باشد، هم مقادیر کوتاه `MessageSid` و هم GUIDهای کامل پیام را شامل می‌شود. شناسه‌های کوتاه به cache پاسخ اخیر در حافظه محدود هستند و پیش از استفاده با گفتگوی فعلی بررسی می‌شوند. اگر یک شناسهٔ کوتاه منقضی شده باشد یا به گفتگوی دیگری تعلق داشته باشد، با `MessageSidFull` کامل دوباره تلاش کنید.

  </Accordion>

  <Accordion title="تشخیص قابلیت">
    OpenClaw کنش‌های API خصوصی را فقط زمانی پنهان می‌کند که وضعیت probe ذخیره‌شده در cache بگوید bridge در دسترس نیست. اگر وضعیت ناشناخته باشد، کنش‌ها همچنان دیده می‌شوند و dispatch به‌صورت lazy probe می‌کند تا نخستین کنش بتواند پس از `imsg launch` بدون refresh وضعیت دستی جداگانه موفق شود.

  </Accordion>

  <Accordion title="رسیدهای خواندن و تایپ">
    وقتی bridge مربوط به API خصوصی فعال باشد، گفتگوهای ورودی پذیرفته‌شده پیش از dispatch به‌عنوان خوانده‌شده علامت‌گذاری می‌شوند و هنگام تولید پاسخ توسط عامل، حباب تایپ به فرستنده نشان داده می‌شود. علامت‌گذاری خواندن را با این پیکربندی غیرفعال کنید:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    buildهای قدیمی‌تر `imsg` که پیش از فهرست قابلیت‌های هر متد هستند، تایپ/خواندن را بی‌صدا gate می‌کنند؛ OpenClaw در هر راه‌اندازی دوباره یک هشدار یک‌باره ثبت می‌کند تا نبود receipt قابل نسبت دادن باشد.

  </Accordion>

  <Accordion title="tapbackهای ورودی">
    OpenClaw در tapbackهای iMessage مشترک می‌شود و واکنش‌های پذیرفته‌شده را به‌جای متن پیام عادی، به‌عنوان رخدادهای سیستم مسیریابی می‌کند؛ بنابراین tapback کاربر یک حلقهٔ پاسخ معمولی را فعال نمی‌کند.

    حالت اعلان با `channels.imessage.reactionNotifications` کنترل می‌شود:

    - `"own"` (پیش‌فرض): فقط وقتی کاربران به پیام‌های نوشته‌شده توسط بات واکنش نشان می‌دهند، اطلاع بده.
    - `"all"`: برای همهٔ tapbackهای ورودی از فرستندگان مجاز اطلاع بده.
    - `"off"`: tapbackهای ورودی را نادیده بگیر.

    بازنویسی‌های هر حساب از `channels.imessage.accounts.<id>.reactionNotifications` استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## نوشتن پیکربندی

iMessage به‌طور پیش‌فرض امکان نوشتن پیکربندی آغازشده از کانال را می‌دهد (برای `/config set|unset` وقتی `commands.config: true` باشد).

غیرفعال‌سازی:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## ادغام DMهای ارسال‌شده به‌صورت جداشده (فرمان + URL در یک ترکیب)

وقتی کاربر یک فرمان و یک URL را با هم تایپ می‌کند — مثلاً `Dump https://example.com/article` — برنامهٔ Messages اپل ارسال را به **دو ردیف جداگانهٔ `chat.db`** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک بالون پیش‌نمایش URL (`"https://..."`) با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

این دو ردیف در بیشتر راه‌اندازی‌ها با فاصله حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت 1 فقط فرمان را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست») و URL را فقط در نوبت 2 می‌بیند؛ در این نقطه، زمینه فرمان از قبل از دست رفته است. این خط لوله ارسال Apple است، نه چیزی که OpenClaw یا `imsg` اضافه کرده باشد.

`channels.imessage.coalesceSameSenderDms` یک DM را به ادغام ردیف‌های پیاپی از همان فرستنده در یک نوبت واحد عامل وارد می‌کند. گفتگوهای گروهی همچنان هر پیام را جداگانه ارسال می‌کنند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="When to enable">
    زمانی فعال کنید که:

    - Skillsی ارائه می‌کنید که انتظار دارند `command + payload` در یک پیام باشد (dump، paste، save، queue و غیره).
    - کاربران شما URLها، تصاویر، یا محتوای طولانی را کنار فرمان‌ها جای‌گذاری می‌کنند.
    - می‌توانید تأخیر اضافه‌شده در نوبت DM را بپذیرید (پایین‌تر را ببینید).

    زمانی غیرفعال نگه دارید که:

    - برای محرک‌های DM تک‌کلمه‌ای به کمترین تأخیر فرمان نیاز دارید.
    - همه جریان‌های شما فرمان‌های یک‌مرحله‌ای بدون پیگیری payload هستند.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    با روشن بودن این پرچم و بدون `messages.inbound.byChannel.imessage` صریح، پنجره دیبانس به **2500 ms** گسترش می‌یابد (پیش‌فرض قدیمی 0 ms است، یعنی بدون دیبانس). این پنجره گسترده‌تر لازم است چون آهنگ ارسالِ تقسیم‌شده Apple با فاصله 0.8 تا 2.0 ثانیه در پیش‌فرضی تنگ‌تر جا نمی‌شود.

    برای تنظیم دستی این پنجره:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **تأخیر اضافه برای پیام‌های DM.** با روشن بودن این پرچم، هر DM (از جمله فرمان‌های کنترلی مستقل و پیگیری‌های تک‌متنی) تا سقف پنجره دیبانس منتظر می‌ماند و سپس ارسال می‌شود، شاید ردیف payload در راه باشد. پیام‌های گفتگوی گروهی ارسال فوری را حفظ می‌کنند.
    - **خروجی ادغام‌شده محدود است.** متن ادغام‌شده با نشانگر صریح `…[truncated]` در 4000 نویسه محدود می‌شود؛ پیوست‌ها به 20 محدود می‌شوند؛ ورودی‌های منبع به 10 محدود می‌شوند (پس از آن، اولین و تازه‌ترین مورد نگه داشته می‌شوند). هر GUID منبع برای تله‌متری پایین‌دست در `coalescedMessageGuids` ردیابی می‌شود.
    - **فقط DM.** گفتگوهای گروهی به ارسال هر پیام به‌صورت جداگانه عبور می‌کنند تا bot هنگام تایپ چند نفر پاسخ‌گو بماند.
    - **اختیاری، برای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) بی‌تأثیر می‌مانند. پیکربندی‌های قدیمی BlueBubbles که `channels.bluebubbles.coalesceSameSenderDms` را تنظیم کرده‌اند باید آن مقدار را به `channels.imessage.coalesceSameSenderDms` منتقل کنند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| آنچه کاربر می‌نویسد                                                | آنچه `chat.db` تولید می‌کند | پرچم خاموش (پیش‌فرض)                  | پرچم روشن + پنجره 2500 ms                                             |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 ردیف با فاصله حدود 1 ثانیه | دو نوبت عامل: فقط «Dump»، سپس URL | یک نوبت: متن ادغام‌شده `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (پیوست + متن)                | 2 ردیف                | دو نوبت (پیوست هنگام ادغام حذف می‌شود) | یک نوبت: متن + تصویر حفظ می‌شود                                        |
| `/status` (فرمان مستقل)                                     | 1 ردیف                 | ارسال فوری                        | **تا سقف پنجره منتظر می‌ماند، سپس ارسال می‌کند**                                    |
| URL به‌تنهایی جای‌گذاری شده                                                   | 1 ردیف                 | ارسال فوری                        | ارسال فوری (فقط یک ورودی در bucket)                             |
| متن + URL که عمداً به‌صورت دو پیام جدا، با فاصله چند دقیقه فرستاده شده‌اند | 2 ردیف خارج از پنجره | دو نوبت                               | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                 |
| سیل سریع (>10 DM کوچک داخل پنجره)                          | N ردیف                | N نوبت                                 | یک نوبت، خروجی محدود (اولین + تازه‌ترین، سقف‌های متن/پیوست اعمال می‌شود) |
| دو نفر در یک گفتگوی گروهی تایپ می‌کنند                                  | N ردیف از M فرستنده | M+ نوبت (یکی برای هر bucket فرستنده)        | M+ نوبت؛ گفتگوهای گروهی ادغام نمی‌شوند                                |

## جبران پس از توقف Gateway

وقتی Gateway آفلاین است (خرابی، راه‌اندازی دوباره، خواب Mac، خاموش بودن دستگاه)، `imsg watch` پس از بالا آمدن دوباره Gateway از وضعیت فعلی `chat.db` ادامه می‌دهد؛ هر چیزی که در این فاصله رسیده باشد، به‌صورت پیش‌فرض هرگز دیده نمی‌شود. جبران این پیام‌ها را در راه‌اندازی بعدی بازپخش می‌کند تا عامل بی‌صدا ترافیک ورودی را از دست ندهد.

جبران به‌صورت **پیش‌فرض غیرفعال** است. آن را برای هر کانال فعال کنید:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### نحوه اجرا

یک گذر در هر راه‌اندازی `monitorIMessageProvider`، به‌ترتیب `imsg launch` آماده → `watch.subscribe` → `performIMessageCatchup` → حلقه ارسال زنده. خود جبران از `chats.list` + `messages.history` برای هر گفتگو، روی همان کارخواه JSON-RPC که `imsg watch` استفاده می‌کند، بهره می‌برد. هر چیزی که هنگام گذر جبران برسد، طبق معمول از مسیر ارسال زنده عبور می‌کند؛ کش موجود حذف تکرار ورودی، هر همپوشانی با ردیف‌های بازپخش‌شده را جذب می‌کند.

هر ردیف بازپخش‌شده از مسیر ارسال زنده (`evaluateIMessageInbound` + `dispatchInboundMessage`) عبور داده می‌شود، بنابراین فهرست‌های مجاز، سیاست گروه، دیبانسر، کش echo، و رسیدهای خواندن برای پیام‌های بازپخش‌شده و زنده رفتار یکسانی دارند.

### معناشناسی cursor و تلاش دوباره

جبران برای هر حساب یک cursor در `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` نگه می‌دارد (دایرکتوری وضعیت OpenClaw به‌صورت پیش‌فرض `~/.openclaw` است و با `OPENCLAW_STATE_DIR` قابل بازنویسی است):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- cursor در هر ارسال موفق جلو می‌رود و وقتی ارسال یک ردیف خطا می‌دهد، نگه داشته می‌شود؛ راه‌اندازی بعدی همان ردیف را از cursor نگه‌داشته‌شده دوباره امتحان می‌کند.
- پس از `maxFailureRetries` خطای پیاپی برای همان `guid`، جبران یک `warn` ثبت می‌کند و cursor را به‌اجبار از پیام گیرکرده عبور می‌دهد تا راه‌اندازی‌های بعدی بتوانند پیشرفت کنند.
- guidهایی که از قبل کنار گذاشته شده‌اند در اجراهای بعدی به‌محض دیده‌شدن رد می‌شوند (بدون تلاش برای ارسال) و در خلاصه اجرا زیر `skippedGivenUp` شمرده می‌شوند.

### سیگنال‌های قابل مشاهده برای اپراتور

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

خط `WARN ... capped to perRunLimit` یعنی یک راه‌اندازی منفرد کل backlog را تخلیه نکرده است. اگر فاصله‌های شما مرتباً از گذر پیش‌فرض 50 ردیفی بیشتر می‌شوند، `perRunLimit` (حداکثر 500) را افزایش دهید.

### چه زمانی خاموش بماند

- Gateway به‌صورت پیوسته با راه‌اندازی دوباره خودکار watchdog اجرا می‌شود و فاصله‌ها همیشه کمتر از چند ثانیه‌اند؛ پیش‌فرض خاموش مناسب است.
- حجم DM کم است و پیام‌های ازدست‌رفته رفتار عامل را تغییر نمی‌دهند؛ پنجره اولیه `firstRunLookbackMinutes` می‌تواند هنگام اولین فعال‌سازی زمینه قدیمی غیرمنتظره‌ای را ارسال کند.

وقتی جبران را روشن می‌کنید، اولین راه‌اندازی بدون cursor فقط به‌اندازه `firstRunLookbackMinutes` به عقب نگاه می‌کند (پیش‌فرض 30 دقیقه)، نه کل پنجره `maxAgeMinutes`؛ این از بازپخش تاریخچه طولانی پیام‌های پیش از فعال‌سازی جلوگیری می‌کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    دودویی و پشتیبانی RPC را اعتبارسنجی کنید:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    اگر probe گزارش داد RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید. اگر کنش‌های private API در دسترس نیستند، `imsg launch` را در نشست کاربر واردشده macOS اجرا کنید و دوباره probe بگیرید. اگر Gateway روی macOS اجرا نمی‌شود، به‌جای مسیر local پیش‌فرض `imsg`، از راه‌اندازی Remote Mac over SSH در بالا استفاده کنید.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    مقدار پیش‌فرض `cliPath: "imsg"` باید روی Macی اجرا شود که به Messages وارد شده است. روی Linux یا Windows، `channels.imessage.cliPath` را روی یک اسکریپت wrapper تنظیم کنید که به آن Mac SSH می‌زند و `imsg "$@"` را اجرا می‌کند.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    سپس اجرا کنید:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    بررسی کنید:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - تأییدهای pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    بررسی کنید:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - رفتار فهرست مجاز `channels.imessage.groups`
    - پیکربندی الگوی mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان Gateway
    - کلید میزبان در `~/.ssh/known_hosts` روی میزبان Gateway وجود دارد
    - خوانایی مسیر remote روی Macی که Messages را اجرا می‌کند

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    دوباره در یک ترمینال GUI تعاملی در همان زمینه کاربر/نشست اجرا کنید و promptها را تأیید کنید:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأیید کنید Full Disk Access + Automation برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## اشاره‌گرهای مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [Pairing](/fa/channels/pairing)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) — اعلان و خلاصه مهاجرت
- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) — جدول ترجمه پیکربندی و cutover گام‌به‌گام
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفتگوی گروهی و gating بر پایه mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
