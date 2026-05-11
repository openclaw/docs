---
read_when:
    - راه‌اندازی پشتیبانی از iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی از iMessage از طریق imsg (JSON-RPC روی stdio)، با اقدامات API خصوصی برای پاسخ‌ها، واکنش‌های لمسی، جلوه‌ها، پیوست‌ها و مدیریت گروه. گزینهٔ ترجیحی برای راه‌اندازی‌های جدید OpenClaw iMessage زمانی که الزامات میزبان برآورده شود.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرارهای OpenClaw iMessage، از `imsg` روی یک میزبان macOS Messages که وارد حساب شده است استفاده کنید. اگر Gateway شما روی Linux یا Windows اجرا می‌شود، `channels.imessage.cliPath` را به یک wrapper مبتنی بر SSH اشاره دهید که `imsg` را روی Mac اجرا می‌کند.

**جبران وقفهٔ Gateway اختیاری است.** وقتی فعال باشد (`channels.imessage.catchup.enabled: true`)، Gateway در راه‌اندازی بعدی پیام‌های ورودی‌ای را که هنگام آفلاین بودن آن (خرابی، راه‌اندازی مجدد، خواب Mac) در `chat.db` رسیده‌اند، دوباره پخش می‌کند. به‌طور پیش‌فرض غیرفعال است — [جبران پس از وقفهٔ gateway](#catching-up-after-gateway-downtime) را ببینید. [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) را می‌بندد.
</Note>

<Warning>
پشتیبانی BlueBubbles حذف شد. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` منتقل کنید؛ OpenClaw از iMessage فقط از طریق `imsg` پشتیبانی می‌کند. برای اعلامیهٔ کوتاه از [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) شروع کنید، یا برای جدول کامل مهاجرت [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) را ببینید.
</Warning>

وضعیت: یکپارچه‌سازی بومی با CLI خارجی. Gateway فرایند `imsg rpc` را اجرا می‌کند و از طریق JSON-RPC روی stdio ارتباط برقرار می‌کند (بدون daemon/port جداگانه). کنش‌های پیشرفته به `imsg launch` و یک probe موفق API خصوصی نیاز دارند.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    پاسخ‌ها، tapbackها، افکت‌ها، پیوست‌ها و مدیریت گروه.
  </Card>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم iMessage به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    وقتی Gateway روی Mac میزبان Messages اجرا نمی‌شود، از یک wrapper مبتنی بر SSH استفاده کنید.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/fa/gateway/config-channels#imessage">
    مرجع کامل فیلدهای iMessage.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw فقط به یک `cliPath` سازگار با stdio نیاز دارد، بنابراین می‌توانید `cliPath` را به یک اسکریپت wrapper اشاره دهید که با SSH به یک Mac راه دور وصل می‌شود و `imsg` را اجرا می‌کند.

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

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند با تجزیهٔ اسکریپت wrapper مبتنی بر SSH آن را به‌صورت خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

  </Tab>
</Tabs>

## نیازمندی‌ها و مجوزها (macOS)

- Messages باید روی Macی که `imsg` را اجرا می‌کند وارد حساب شده باشد.
- Full Disk Access برای زمینهٔ فرایندی که OpenClaw/`imsg` را اجرا می‌کند لازم است (دسترسی به DB پیام‌ها).
- مجوز Automation برای ارسال پیام‌ها از طریق Messages.app لازم است.
- برای کنش‌های پیشرفته (واکنش / ویرایش / لغو ارسال / پاسخ رشته‌ای / افکت‌ها / عملیات گروه)، System Integrity Protection باید غیرفعال باشد — بخش [فعال‌سازی API خصوصی imsg](#enabling-the-imsg-private-api) را در پایین ببینید. ارسال/دریافت متن و رسانهٔ پایه بدون آن کار می‌کند.

<Tip>
مجوزها برای هر زمینهٔ فرایند اعطا می‌شوند. اگر gateway به‌صورت headless اجرا می‌شود (LaunchAgent/SSH)، برای ایجاد promptها یک فرمان تعاملی یک‌باره را در همان زمینه اجرا کنید:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## فعال‌سازی API خصوصی imsg

`imsg` در دو حالت عملیاتی عرضه می‌شود:

- **حالت پایه** (پیش‌فرض، بدون نیاز به تغییرات SIP): متن و رسانهٔ خروجی از طریق `send`، پایش/تاریخچهٔ ورودی، فهرست چت‌ها. این همان چیزی است که با یک `brew install steipete/tap/imsg` تازه و مجوزهای استاندارد macOS بالا دریافت می‌کنید.
- **حالت API خصوصی**: `imsg` یک dylib کمکی را به `Messages.app` تزریق می‌کند تا توابع داخلی `IMCore` را فراخوانی کند. این همان چیزی است که `react`، `edit`، `unsend`، `reply` (رشته‌ای)، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، به‌علاوهٔ نشانگرهای تایپ و رسیدهای خواندن را فعال می‌کند.

برای رسیدن به سطح کنش‌های پیشرفته‌ای که این صفحهٔ کانال مستند می‌کند، به حالت API خصوصی نیاز دارید. README مربوط به `imsg` دربارهٔ این نیاز صریح است:

> قابلیت‌های پیشرفته‌ای مانند `read`، `typing`، `launch`، ارسال غنی مبتنی بر bridge، تغییر پیام و مدیریت چت اختیاری هستند. آن‌ها نیاز دارند SIP غیرفعال باشد و یک dylib کمکی به `Messages.app` تزریق شود. وقتی SIP فعال باشد، `imsg launch` از تزریق خودداری می‌کند.

تکنیک تزریق helper از dylib خود `imsg` برای دسترسی به APIهای خصوصی Messages استفاده می‌کند. در مسیر OpenClaw iMessage هیچ سرور شخص ثالث یا runtime مربوط به BlueBubbles وجود ندارد.

<Warning>
**غیرفعال کردن SIP یک مصالحهٔ امنیتی واقعی است.** SIP یکی از محافظت‌های اصلی macOS در برابر اجرای کد سیستمی تغییریافته است؛ خاموش کردن آن در سطح سیستم سطح حمله و اثرات جانبی بیشتری ایجاد می‌کند. به‌ویژه، **غیرفعال کردن SIP روی Macهای Apple Silicon همچنین توانایی نصب و اجرای برنامه‌های iOS روی Mac شما را غیرفعال می‌کند**.

این را یک انتخاب عملیاتی آگاهانه بدانید، نه یک پیش‌فرض. اگر مدل تهدید شما نمی‌تواند خاموش بودن SIP را تحمل کند، iMessage همراه‌شده به حالت پایه محدود است — فقط ارسال/دریافت متن و رسانه، بدون واکنش‌ها / ویرایش / لغو ارسال / افکت‌ها / عملیات گروه.
</Warning>

### راه‌اندازی

1. **`imsg` را نصب (یا ارتقا) کنید** روی Macی که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   خروجی `imsg status --json` مقدارهای `bridge_version`، `rpc_methods` و `selectors` را برای هر متد گزارش می‌کند تا پیش از شروع ببینید build فعلی از چه چیزهایی پشتیبانی می‌کند.

2. **System Integrity Protection را غیرفعال کنید.** این مورد وابسته به نسخهٔ macOS است، چون نیاز زیربنایی Apple به OS و سخت‌افزار بستگی دارد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Library Validation را از طریق Terminal غیرفعال کنید، به Recovery Mode راه‌اندازی مجدد کنید، `csrutil disable` را اجرا کنید، سپس restart کنید.
   - **macOS 11+ (Big Sur و بعدتر)، Intel:** Recovery Mode (یا Internet Recovery)، `csrutil disable`، سپس restart.
   - **macOS 11+، Apple Silicon:** دنبالهٔ راه‌اندازی با دکمهٔ پاور برای ورود به Recovery؛ در نسخه‌های جدید macOS هنگام کلیک روی Continue کلید **Left Shift** را نگه دارید، سپس `csrutil disable`. راه‌اندازی‌های ماشین مجازی جریان جداگانه‌ای دارند — ابتدا یک snapshot از VM بگیرید.
   - **macOS 26 / Tahoe:** سیاست‌های library-validation و بررسی‌های private-entitlement مربوط به `imagent` سخت‌گیرانه‌تر شده‌اند؛ ممکن است `imsg` برای همگام ماندن به build به‌روزشده نیاز داشته باشد. اگر پس از یک ارتقای major macOS تزریق `imsg launch` یا `selectors` مشخص شروع به برگرداندن false کردند، پیش از فرض موفقیت مرحلهٔ SIP، release notes مربوط به `imsg` را بررسی کنید.

   برای غیرفعال کردن SIP پیش از اجرای `imsg launch`، جریان Recovery-mode مربوط به Mac خود را طبق راهنمای Apple دنبال کنید.

3. **helper را تزریق کنید.** با SIP غیرفعال و Messages.app وارد حساب‌شده:

   ```bash
   imsg launch
   ```

   وقتی SIP هنوز فعال باشد، `imsg launch` از تزریق خودداری می‌کند، بنابراین این کار نقش تأیید موفقیت مرحلهٔ ۲ را هم دارد.

4. **bridge را از OpenClaw تأیید کنید:**

   ```bash
   openclaw channels status --probe
   ```

   ورودی iMessage باید `works` را گزارش کند، و `imsg status --json | jq '.selectors'` باید `retractMessagePart: true` به‌علاوهٔ هر selector مربوط به ویرایش / تایپ / خواندن را که build macOS شما ارائه می‌کند نشان دهد. gating مربوط به هر متد در Plugin OpenClaw در `actions.ts` فقط کنش‌هایی را advertise می‌کند که selector زیربنایی آن‌ها `true` باشد، بنابراین سطح کنشی که در فهرست ابزارهای agent می‌بینید بازتاب می‌دهد bridge واقعاً روی این میزبان چه کاری می‌تواند انجام دهد.

اگر `openclaw channels status --probe` کانال را به‌صورت `works` گزارش می‌کند اما کنش‌های مشخص در زمان dispatch خطای "iMessage `<action>` requires the imsg private API bridge" می‌دهند، دوباره `imsg launch` را اجرا کنید — helper ممکن است خارج شود (راه‌اندازی مجدد Messages.app، به‌روزرسانی OS و غیره) و وضعیت cache‌شدهٔ `available: true` تا زمانی که probe بعدی آن را refresh کند، همچنان کنش‌ها را advertise می‌کند.

### وقتی نمی‌توانید SIP را غیرفعال کنید

اگر غیرفعال بودن SIP برای مدل تهدید شما قابل قبول نیست:

- `imsg` به حالت پایه برمی‌گردد — فقط متن + رسانه + دریافت.
- Plugin مربوط به OpenClaw همچنان ارسال متن/رسانه و پایش ورودی را advertise می‌کند؛ فقط `react`، `edit`، `unsend`، `reply`، `sendWithEffect` و عملیات گروه را از سطح کنش پنهان می‌کند (طبق gate قابلیت هر متد).
- می‌توانید یک Mac جداگانهٔ غیر Apple-Silicon (یا یک bot Mac اختصاصی) را با SIP خاموش برای workload مربوط به iMessage اجرا کنید، در حالی که SIP را روی دستگاه‌های اصلی خود فعال نگه می‌دارید. بخش [کاربر macOS اختصاصی bot (هویت جداگانهٔ iMessage)](#deployment-patterns) را در پایین ببینید.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist می‌توانند handleها، گروه‌های دسترسی فرستندهٔ ثابت (`accessGroup:<name>`) یا هدف‌های چت (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) باشند.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض وقتی پیکربندی شده باشد)
    - `open`
    - `disabled`

    allowlist فرستندهٔ گروه: `channels.imessage.groupAllowFrom`.

    ورودی‌های `groupAllowFrom` همچنین می‌توانند به گروه‌های دسترسی فرستندهٔ ثابت (`accessGroup:<name>`) اشاره کنند.

    fallback زمان اجرا: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستندهٔ گروه iMessage در صورت وجود به `allowFrom` برمی‌گردند.
    نکتهٔ زمان اجرا: اگر `channels.imessage` کاملاً وجود نداشته باشد، runtime به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار log می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    <Warning>
    مسیریابی گروه **دو** gate allowlist دارد که پشت سر هم اجرا می‌شوند، و هر دو باید عبور کنند:

    1. **allowlist فرستنده / هدف چت** (`channels.imessage.groupAllowFrom`) — handle، `chat_guid`، `chat_identifier`، یا `chat_id`.
    2. **رجیستری گروه** (`channels.imessage.groups`) — با `groupPolicy: "allowlist"`، این gate یا به یک ورودی wildcard به شکل `groups: { "*": { ... } }` نیاز دارد (که `allowAll = true` را تنظیم می‌کند)، یا به یک ورودی صریح برای هر `chat_id` زیر `groups`.

    اگر gate 2 هیچ چیزی در خود نداشته باشد، هر پیام گروهی drop می‌شود. Plugin در سطح log پیش‌فرض دو سیگنال سطح `warn` منتشر می‌کند:

    - یک‌بار برای هر حساب هنگام راه‌اندازی: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - یک‌بار برای هر `chat_id` در زمان اجرا: `imessage: dropping group message from chat_id=<id> ...`

    پیام‌های مستقیم همچنان کار می‌کنند، چون مسیر کد متفاوتی دارند.

    حداقل پیکربندی برای حفظ جریان گروه‌ها تحت `groupPolicy: "allowlist"`:

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

    اگر آن خطوط `warn` در لاگ Gateway ظاهر شدند، گیت ۲ دارد حذف می‌کند — بلوک `groups` را اضافه کنید.
    </Warning>

    گیت‌گذاری اشاره برای گروه‌ها:

    - iMessage فرادادهٔ اشارهٔ بومی ندارد
    - تشخیص اشاره از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، گیت‌گذاری اشاره قابل اعمال نیست

    فرمان‌های کنترلی از فرستندگان مجاز می‌توانند گیت‌گذاری اشاره را در گروه‌ها دور بزنند.

    `systemPrompt` به‌ازای هر گروه:

    هر ورودی زیر `channels.imessage.groups.*` یک رشتهٔ اختیاری `systemPrompt` می‌پذیرد. مقدار آن در هر نوبتی که پیامی را در آن گروه پردازش می‌کند، به اعلان سیستمی عامل تزریق می‌شود. حل‌وفصل آن مشابه حل‌وفصل اعلان به‌ازای گروه است که توسط `channels.whatsapp.groups` استفاده می‌شود:

    1. **اعلان سیستمی اختصاصی گروه** (`groups["<chat_id>"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشتهٔ خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ اعلان سیستمی برای آن گروه اعمال نمی‌شود.
    2. **اعلان سیستمی wildcard گروه** (`groups["*"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص کاملاً از نگاشت غایب باشد، یا وقتی وجود دارد اما هیچ کلید `systemPrompt` تعریف نمی‌کند.

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

    اعلان‌های به‌ازای گروه فقط روی پیام‌های گروهی اعمال می‌شوند — پیام‌های مستقیم در این کانال تحت تأثیر قرار نمی‌گیرند.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - پیام‌های مستقیم از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروهی استفاده می‌کنند.
    - با مقدار پیش‌فرض `session.dmScope=main`، پیام‌های مستقیم iMessage در نشست اصلی عامل ادغام می‌شوند.
    - نشست‌های گروهی ایزوله هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فرادادهٔ کانال/هدف مبدأ دوباره به iMessage مسیریابی می‌شوند.

    رفتار رشته‌گفت‌وگوی شبیه گروه:

    برخی رشته‌گفت‌وگوهای iMessage با چند شرکت‌کننده می‌توانند با `is_group=false` برسند.
    اگر آن `chat_id` به‌صراحت زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را به‌عنوان ترافیک گروهی در نظر می‌گیرد (گیت‌گذاری گروه + ایزوله‌سازی نشست گروهی).

  </Tab>
</Tabs>

## اتصال‌های گفت‌وگوی ACP

چت‌های قدیمی iMessage نیز می‌توانند به نشست‌های ACP متصل شوند.

جریان سریع اپراتور:

- در پیام مستقیم یا چت گروهی مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های آینده در همان گفت‌وگوی iMessage به نشست ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان نشست ACP متصل را در جای خود بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از موارد زیر استفاده کند:

- هندل عادی‌سازی‌شدهٔ پیام مستقیم مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (برای اتصال‌های گروهی پایدار توصیه می‌شود)
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک بات از پروفایل Messages شخصی شما ایزوله شود.

    جریان معمول:

    1. یک کاربر macOS اختصاصی ایجاد کنید/وارد آن شوید.
    2. در آن کاربر، با Apple ID بات وارد Messages شوید.
    3. `imsg` را در آن کاربر نصب کنید.
    4. یک پوشش SSH ایجاد کنید تا OpenClaw بتواند `imsg` را در زمینهٔ آن کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل آن کاربر اشاره دهید.

    اجرای نخست ممکن است در نشست آن کاربر بات به تأییدهای GUI نیاز داشته باشد (Automation + Full Disk Access).

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    توپولوژی رایج:

    - Gateway روی Linux/VM اجرا می‌شود
    - iMessage + `imsg` روی یک Mac در tailnet شما اجرا می‌شود
    - پوشش `cliPath` از SSH برای اجرای `imsg` استفاده می‌کند
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

  <Accordion title="Multi-account pattern">
    iMessage از پیکربندی به‌ازای حساب زیر `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات تاریخچه، و فهرست‌های مجاز ریشهٔ پیوست را بازنویسی کند.

  </Accordion>
</AccordionGroup>

## رسانه، قطعه‌بندی، و هدف‌های تحویل

<AccordionGroup>
  <Accordion title="Attachments and media">
    - دریافت پیوست‌های ورودی به‌صورت **پیش‌فرض خاموش** است — برای ارسال عکس‌ها، یادداشت‌های صوتی، ویدئو و پیوست‌های دیگر به عامل، `channels.imessage.includeAttachments: true` را تنظیم کنید. وقتی غیرفعال باشد، iMessageهای فقط‌پیوست پیش از رسیدن به عامل حذف می‌شوند و ممکن است اصلاً هیچ خط لاگ `Inbound message` تولید نکنند.
    - مسیرهای پیوست راه‌دور زمانی که `remoteHost` تنظیم شده باشد می‌توانند از طریق SCP دریافت شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشهٔ پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازهٔ رسانهٔ خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض ۱۶ مگابایت)

  </Accordion>

  <Accordion title="Outbound chunking">
    - حد قطعهٔ متن: `channels.imessage.textChunkLimit` (پیش‌فرض ۴۰۰۰)
    - حالت قطعه‌بندی: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم‌بندی با اولویت پاراگراف)

  </Accordion>

  <Accordion title="Addressing formats">
    هدف‌های صریح ترجیحی:

    - `chat_id:123` (برای مسیریابی پایدار توصیه می‌شود)
    - `chat_guid:...`
    - `chat_identifier:...`

    هدف‌های هندل نیز پشتیبانی می‌شوند:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## کنش‌های API خصوصی

وقتی `imsg launch` در حال اجرا است و `openclaw channels status --probe` مقدار `privateApi.available: true` را گزارش می‌کند، ابزار پیام علاوه بر ارسال‌های متنی عادی می‌تواند از کنش‌های بومی iMessage استفاده کند.

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
  <Accordion title="Available actions">
    - **react**: افزودن/حذف tapbackهای iMessage (`messageId`، `emoji`، `remove`). tapbackهای پشتیبانی‌شده به love، like، dislike، laugh، emphasize، و question نگاشت می‌شوند.
    - **reply**: ارسال پاسخ رشته‌ای به یک پیام موجود (`messageId`، `text` یا `message`، به‌علاوهٔ `chatGuid`، `chatId`، `chatIdentifier`، یا `to`).
    - **sendWithEffect**: ارسال متن با یک جلوهٔ iMessage (`text` یا `message`، `effect` یا `effectId`).
    - **edit**: ویرایش یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`، `text` یا `newText`).
    - **unsend**: پس‌گرفتن یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`).
    - **upload-file**: ارسال رسانه/فایل‌ها (`buffer` به‌صورت base64 یا یک `media`/`path`/`filePath` آب‌رسانی‌شده، `filename`، `asVoice` اختیاری). نام مستعار قدیمی: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: مدیریت چت‌های گروهی زمانی که هدف فعلی یک گفت‌وگوی گروهی است.

  </Accordion>

  <Accordion title="Message IDs">
    زمینهٔ iMessage ورودی، در صورت موجود بودن، هم مقدارهای کوتاه `MessageSid` و هم GUIDهای کامل پیام را شامل می‌شود. شناسه‌های کوتاه به کش پاسخ درون‌حافظه‌ای اخیر محدود هستند و پیش از استفاده در برابر چت فعلی بررسی می‌شوند. اگر یک شناسهٔ کوتاه منقضی شده یا متعلق به چت دیگری باشد، با `MessageSidFull` کامل دوباره تلاش کنید.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw کنش‌های API خصوصی را فقط زمانی پنهان می‌کند که وضعیت probe کش‌شده نشان دهد bridge در دسترس نیست. اگر وضعیت ناشناخته باشد، کنش‌ها قابل مشاهده می‌مانند و ارسال، probeها را به‌صورت تنبل اجرا می‌کند تا نخستین کنش بتواند پس از `imsg launch` بدون تازه‌سازی دستی جداگانهٔ وضعیت موفق شود.

  </Accordion>

  <Accordion title="Read receipts and typing">
    وقتی bridge API خصوصی فعال است، چت‌های ورودی پذیرفته‌شده پیش از ارسال به‌عنوان خوانده‌شده علامت‌گذاری می‌شوند و هنگام تولید پاسخ توسط عامل، حباب تایپ به فرستنده نمایش داده می‌شود. علامت‌گذاری خواندن را با این گزینه غیرفعال کنید:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    نسخه‌های قدیمی‌تر `imsg` که پیش از فهرست قابلیت به‌ازای روش ساخته شده‌اند، تایپ/خواندن را بی‌صدا غیرفعال می‌کنند؛ OpenClaw در هر راه‌اندازی مجدد یک هشدار یک‌باره ثبت می‌کند تا نبود رسید قابل انتساب باشد.

  </Accordion>
</AccordionGroup>

## نوشتن پیکربندی

iMessage به‌صورت پیش‌فرض اجازهٔ نوشتن پیکربندی آغازشده از کانال را می‌دهد (برای `/config set|unset` وقتی `commands.config: true` باشد).

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

## ادغام پیام‌های مستقیمِ ارسال‌شده به‌صورت جداگانه (فرمان + URL در یک ترکیب)

وقتی کاربر یک فرمان و یک URL را با هم تایپ می‌کند — مثلاً `Dump https://example.com/article` — برنامهٔ Messages اپل ارسال را به **دو ردیف جداگانهٔ `chat.db`** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک حباب پیش‌نمایش URL (`"https://..."`) با تصویرهای پیش‌نمایش OG به‌عنوان پیوست.

این دو ردیف در بیشتر راه‌اندازی‌ها با فاصلهٔ حدود ۰٫۸ تا ۲٫۰ ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت ۱ فقط فرمان را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست»)، و URL را فقط در نوبت ۲ می‌بیند — در آن نقطه زمینهٔ فرمان از دست رفته است. این خط لولهٔ ارسال اپل است، نه چیزی که OpenClaw یا `imsg` معرفی کرده باشد.

`channels.imessage.coalesceSameSenderDms` یک پیام مستقیم را وارد ادغام ردیف‌های پیاپیِ یک فرستنده در یک نوبت عامل می‌کند. چت‌های گروهی همچنان به‌صورت پیام‌به‌پیام ارسال می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="When to enable">
    فعال کنید وقتی:

    - Skills ارائه می‌کنید که انتظار دارند `command + payload` در یک پیام باشد (dump، paste، save، queue، و غیره).
    - کاربران شما URLها، تصویرها، یا محتوای طولانی را کنار فرمان‌ها جای‌گذاری می‌کنند.
    - می‌توانید تأخیر افزودهٔ نوبت پیام مستقیم را بپذیرید (پایین را ببینید).

    غیرفعال بگذارید وقتی:

    - برای محرک‌های تک‌واژه‌ای پیام مستقیم به کمترین تأخیر فرمان نیاز دارید.
    - همهٔ جریان‌های شما فرمان‌های یک‌مرحله‌ای بدون پیگیری payload هستند.

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

    با روشن بودن این پرچم و بدون `messages.inbound.byChannel.imessage` صریح، پنجره debounce به **2500 ms** افزایش می‌یابد (پیش‌فرض قدیمی 0 ms است؛ یعنی بدون debouncing). این پنجره وسیع‌تر لازم است، چون آهنگ ارسال جداگانه Apple با فاصله 0.8-2.0 s در پیش‌فرض فشرده‌تر جا نمی‌شود.

    برای تنظیم دستی پنجره:

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
    - **تأخیر افزوده برای پیام‌های DM.** با روشن بودن این پرچم، هر DM (از جمله فرمان‌های کنترلی مستقل و پیگیری‌های تک‌متنی) پیش از ارسال تا سقف پنجره debounce منتظر می‌ماند، در صورتی که ردیف payload در راه باشد. پیام‌های گفت‌وگوی گروهی همچنان فوری ارسال می‌شوند.
    - **خروجی ادغام‌شده محدود است.** متن ادغام‌شده با نشانگر صریح `…[truncated]` به 4000 نویسه محدود می‌شود؛ پیوست‌ها به 20 محدود می‌شوند؛ ورودی‌های منبع به 10 محدود می‌شوند (فراتر از آن، اولین و جدیدترین نگه داشته می‌شوند). هر GUID منبع در `coalescedMessageGuids` برای تله‌متری پایین‌دستی ردیابی می‌شود.
    - **فقط DM.** گفت‌وگوهای گروهی به ارسال جداگانه هر پیام واگذار می‌شوند تا ربات هنگام تایپ هم‌زمان چند نفر پاسخ‌گو بماند.
    - **اختیاری و به‌ازای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند. پیکربندی‌های قدیمی BlueBubbles که `channels.bluebubbles.coalesceSameSenderDms` را تنظیم کرده‌اند باید آن مقدار را به `channels.imessage.coalesceSameSenderDms` منتقل کنند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| کاربر می‌نویسد                                                     | `chat.db` تولید می‌کند | پرچم خاموش (پیش‌فرض)                   | پرچم روشن + پنجره 2500 ms                                             |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 ردیف با فاصله ~1 s  | دو نوبت عامل: فقط "Dump"، سپس URL      | یک نوبت: متن ادغام‌شده `Dump https://example.com`                      |
| `Save this 📎image.jpg caption` (پیوست + متن)                      | 2 ردیف                | دو نوبت (پیوست در ادغام حذف می‌شود)    | یک نوبت: متن + تصویر حفظ می‌شود                                        |
| `/status` (فرمان مستقل)                                            | 1 ردیف                | ارسال فوری                              | **تا سقف پنجره منتظر می‌ماند، سپس ارسال می‌شود**                      |
| URL به‌تنهایی چسبانده شده                                          | 1 ردیف                | ارسال فوری                              | ارسال فوری (فقط یک ورودی در bucket)                                    |
| متن + URL به‌صورت دو پیام جداگانه عمدی، با فاصله چند دقیقه ارسال شده | 2 ردیف خارج از پنجره | دو نوبت                                 | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                 |
| سیل سریع (>10 DM کوچک داخل پنجره)                                  | N ردیف                | N نوبت                                  | یک نوبت، خروجی محدود (اولین + جدیدترین، با اعمال سقف متن/پیوست)       |
| دو نفر در یک گفت‌وگوی گروهی تایپ می‌کنند                          | N ردیف از M فرستنده  | M+ نوبت (یکی برای هر bucket فرستنده)   | M+ نوبت — گفت‌وگوهای گروهی ادغام نمی‌شوند                             |

## جبران پیام‌ها پس از قطعی gateway

وقتی gateway آفلاین است (کرش، راه‌اندازی دوباره، خواب Mac، خاموش بودن دستگاه)، `imsg watch` پس از بازگشت gateway از وضعیت فعلی `chat.db` ادامه می‌دهد؛ هر چیزی که در طول فاصله رسیده باشد، به‌صورت پیش‌فرض هرگز دیده نمی‌شود. Catchup این پیام‌ها را در راه‌اندازی بعدی بازپخش می‌کند تا عامل بی‌سروصدا ترافیک ورودی را از دست ندهد.

Catchup به‌صورت **پیش‌فرض غیرفعال** است. آن را به‌ازای هر کانال فعال کنید:

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

یک عبور برای هر راه‌اندازی `monitorIMessageProvider`، با ترتیب `imsg launch` آماده → `watch.subscribe` → `performIMessageCatchup` → حلقه ارسال زنده. خود Catchup از `chats.list` + `messages.history` به‌ازای هر گفت‌وگو در برابر همان سرویس‌گیرنده JSON-RPC استفاده می‌کند که `imsg watch` از آن استفاده می‌کند. هر چیزی که در طول عبور catchup برسد، به‌طور معمول از مسیر ارسال زنده عبور می‌کند؛ کش inbound-dedupe موجود هرگونه هم‌پوشانی با ردیف‌های بازپخش‌شده را جذب می‌کند.

هر ردیف بازپخش‌شده از مسیر ارسال زنده عبور داده می‌شود (`evaluateIMessageInbound` + `dispatchInboundMessage`)، بنابراین allowlistها، سیاست گروه، debouncer، کش echo، و رسیدهای خوانده‌شدن روی پیام‌های بازپخش‌شده و زنده رفتاری یکسان دارند.

### معنای cursor و retry

Catchup یک cursor به‌ازای هر حساب در `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` نگه می‌دارد (دایرکتوری وضعیت OpenClaw به‌صورت پیش‌فرض `~/.openclaw` است و با `OPENCLAW_STATE_DIR` قابل بازنویسی است):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- cursor پس از هر ارسال موفق جلو می‌رود و وقتی ارسال یک ردیف خطا می‌دهد، ثابت می‌ماند؛ راه‌اندازی بعدی همان ردیف را از cursor نگه‌داشته‌شده دوباره امتحان می‌کند.
- پس از `maxFailureRetries` خطای متوالی برای همان `guid`، catchup یک `warn` ثبت می‌کند و cursor را به‌اجبار از پیام گیرکرده عبور می‌دهد تا راه‌اندازی‌های بعدی بتوانند پیش بروند.
- guidهایی که قبلاً از آن‌ها صرف‌نظر شده است در اجراهای بعدی به‌محض مشاهده رد می‌شوند (بدون تلاش برای ارسال) و در خلاصه اجرا زیر `skippedGivenUp` شمرده می‌شوند.

### سیگنال‌های قابل مشاهده برای اپراتور

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

خط `WARN ... capped to perRunLimit` یعنی یک راه‌اندازی واحد کل backlog را تخلیه نکرده است. اگر فاصله‌های شما مرتباً از عبور پیش‌فرض 50 ردیفی بیشتر می‌شود، `perRunLimit` را افزایش دهید (حداکثر 500).

### چه زمانی خاموش بماند

- Gateway به‌صورت پیوسته با راه‌اندازی دوباره خودکار watchdog اجرا می‌شود و فاصله‌ها همیشه کمتر از چند ثانیه هستند؛ پیش‌فرض خاموش مناسب است.
- حجم DM کم است و پیام‌های ازدست‌رفته رفتار عامل را تغییر نمی‌دهند؛ پنجره اولیه `firstRunLookbackMinutes` می‌تواند هنگام اولین فعال‌سازی زمینه قدیمی غیرمنتظره‌ای را ارسال کند.

وقتی catchup را روشن می‌کنید، اولین راه‌اندازی بدون cursor فقط به‌اندازه `firstRunLookbackMinutes` (پیش‌فرض 30 دقیقه) به عقب نگاه می‌کند، نه کل پنجره `maxAgeMinutes`؛ این کار از بازپخش تاریخچه طولانی پیام‌های پیش از فعال‌سازی جلوگیری می‌کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    باینری و پشتیبانی RPC را اعتبارسنجی کنید:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    اگر probe گزارش دهد که RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید. اگر اقدامات private API در دسترس نیستند، `imsg launch` را در نشست کاربر واردشده macOS اجرا کنید و دوباره probe بگیرید. اگر Gateway روی macOS اجرا نمی‌شود، به‌جای مسیر محلی پیش‌فرض `imsg`، از راه‌اندازی Remote Mac over SSH در بالا استفاده کنید.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    مقدار پیش‌فرض `cliPath: "imsg"` باید روی Mac واردشده به Messages اجرا شود. روی Linux یا Windows، `channels.imessage.cliPath` را به یک اسکریپت wrapper تنظیم کنید که با SSH به آن Mac وصل شود و `imsg "$@"` را اجرا کند.

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
    - رفتار allowlist در `channels.imessage.groups`
    - پیکربندی الگوی mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان gateway
    - کلید میزبان در `~/.ssh/known_hosts` روی میزبان gateway وجود داشته باشد
    - خوانایی مسیر remote روی Mac اجراکننده Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    دوباره در یک ترمینال GUI تعاملی در همان زمینه کاربر/نشست اجرا کنید و promptها را تأیید کنید:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأیید کنید که Full Disk Access + Automation برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## اشاره‌گرهای مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [Pairing](/fa/channels/pairing)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) — اعلامیه و خلاصه مهاجرت
- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) — جدول ترجمه پیکربندی و انتقال گام‌به‌گام
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
