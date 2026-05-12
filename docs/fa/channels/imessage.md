---
read_when:
    - راه‌اندازی پشتیبانی از iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی از iMessage از طریق imsg (JSON-RPC روی stdio)، همراه با اقدام‌های API خصوصی برای پاسخ‌ها، واکنش‌های سریع، جلوه‌ها، پیوست‌ها و مدیریت گروه. وقتی الزامات میزبان برقرار باشد، برای راه‌اندازی‌های جدید iMessage در OpenClaw ترجیح داده می‌شود.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرارهای OpenClaw iMessage، از `imsg` روی یک میزبان macOS Messages که وارد حساب شده است استفاده کنید. اگر Gateway شما روی Linux یا Windows اجرا می‌شود، `channels.imessage.cliPath` را به یک wrapper مبتنی بر SSH اشاره دهید که `imsg` را روی Mac اجرا می‌کند.

**جبران قطعی Gateway اختیاری است.** وقتی فعال باشد (`channels.imessage.catchup.enabled: true`)، Gateway در راه‌اندازی بعدی پیام‌های ورودی‌ای را که هنگام آفلاین بودن آن (خرابی، راه‌اندازی مجدد، خواب Mac) در `chat.db` ثبت شده‌اند بازپخش می‌کند. به‌طور پیش‌فرض غیرفعال است — [جبران پس از قطعی gateway](#catching-up-after-gateway-downtime) را ببینید. [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) را می‌بندد.
</Note>

<Warning>
پشتیبانی BlueBubbles حذف شده است. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` مهاجرت دهید؛ OpenClaw از iMessage فقط از طریق `imsg` پشتیبانی می‌کند. برای اعلامیه کوتاه با [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) شروع کنید، یا برای جدول کامل مهاجرت [آمدن از BlueBubbles](/fa/channels/imessage-from-bluebubbles) را ببینید.
</Warning>

وضعیت: یکپارچه‌سازی بومی CLI خارجی. Gateway، `imsg rpc` را اجرا می‌کند و از طریق JSON-RPC روی stdio ارتباط برقرار می‌کند (بدون daemon/port جداگانه). کنش‌های پیشرفته به `imsg launch` و یک کاوش موفق API خصوصی نیاز دارند.

<CardGroup cols={3}>
  <Card title="کنش‌های API خصوصی" icon="wand-sparkles" href="#private-api-actions">
    پاسخ‌ها، tapbackها، افکت‌ها، پیوست‌ها، و مدیریت گروه.
  </Card>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم iMessage به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Mac راه‌دور" icon="terminal" href="#remote-mac-over-ssh">
    وقتی Gateway روی Mac مربوط به Messages اجرا نمی‌شود، از یک wrapper مبتنی بر SSH استفاده کنید.
  </Card>
  <Card title="مرجع پیکربندی" icon="settings" href="/fa/gateway/config-channels#imessage">
    مرجع کامل فیلدهای iMessage.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Mac محلی (مسیر سریع)">
    <Steps>
      <Step title="نصب و راستی‌آزمایی imsg">

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
    OpenClaw فقط به یک `cliPath` سازگار با stdio نیاز دارد، بنابراین می‌توانید `cliPath` را به یک اسکریپت wrapper اشاره دهید که با SSH به یک Mac راه‌دور وصل می‌شود و `imsg` را اجرا می‌کند.

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

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند آن را با تجزیه اسکریپت wrapper مبتنی بر SSH به‌طور خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

  </Tab>
</Tabs>

## الزامات و مجوزها (macOS)

- Messages باید روی Mac اجراکننده `imsg` وارد حساب شده باشد.
- برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند، Full Disk Access لازم است (دسترسی به پایگاه داده Messages).
- برای ارسال پیام از طریق Messages.app، مجوز Automation لازم است.
- برای کنش‌های پیشرفته (واکنش / ویرایش / لغو ارسال / پاسخ رشته‌ای / افکت‌ها / عملیات گروه)، System Integrity Protection باید غیرفعال باشد — [فعال‌سازی API خصوصی imsg](#enabling-the-imsg-private-api) را در ادامه ببینید. ارسال/دریافت متن و رسانه پایه بدون آن کار می‌کند.

<Tip>
مجوزها برای هر زمینه فرایند اعطا می‌شوند. اگر gateway به‌صورت headless اجرا می‌شود (LaunchAgent/SSH)، یک فرمان تعاملی یک‌باره را در همان زمینه اجرا کنید تا promptها فعال شوند:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## فعال‌سازی API خصوصی imsg

`imsg` با دو حالت عملیاتی ارائه می‌شود:

- **حالت پایه** (پیش‌فرض، بدون نیاز به تغییرات SIP): متن و رسانه خروجی از طریق `send`، watch/history ورودی، فهرست chat. این همان چیزی است که با یک `brew install steipete/tap/imsg` تازه و مجوزهای استاندارد macOS بالا، آماده دریافت می‌کنید.
- **حالت API خصوصی**: `imsg` یک dylib کمکی را در `Messages.app` تزریق می‌کند تا توابع داخلی `IMCore` را فراخوانی کند. این همان چیزی است که `react`، `edit`، `unsend`، `reply` (رشته‌ای)، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، به‌همراه نشانگرهای تایپ و رسیدهای خواندن را فعال می‌کند.

برای رسیدن به سطح کنش پیشرفته‌ای که این صفحه channel مستند می‌کند، به حالت API خصوصی نیاز دارید. README مربوط به `imsg` درباره این الزام صریح است:

> قابلیت‌های پیشرفته مانند `read`، `typing`، `launch`، ارسال غنی مبتنی بر bridge، تغییر پیام، و مدیریت chat اختیاری هستند. آن‌ها نیاز دارند SIP غیرفعال باشد و یک dylib کمکی در `Messages.app` تزریق شود. وقتی SIP فعال باشد، `imsg launch` از تزریق خودداری می‌کند.

روش تزریق helper از dylib خود `imsg` برای دسترسی به APIهای خصوصی Messages استفاده می‌کند. در مسیر OpenClaw iMessage هیچ سرور شخص ثالث یا runtime مربوط به BlueBubbles وجود ندارد.

<Warning>
**غیرفعال کردن SIP یک مصالحه امنیتی واقعی است.** SIP یکی از محافظت‌های اصلی macOS در برابر اجرای کد سیستمی تغییر‌یافته است؛ خاموش کردن آن در سطح کل سیستم سطح حمله و عوارض جانبی بیشتری ایجاد می‌کند. نکته مهم این است که **غیرفعال کردن SIP روی Macهای Apple Silicon همچنین امکان نصب و اجرای برنامه‌های iOS روی Mac شما را غیرفعال می‌کند**.

با این موضوع به‌عنوان یک انتخاب عملیاتی آگاهانه برخورد کنید، نه یک پیش‌فرض. اگر مدل تهدید شما نمی‌تواند خاموش بودن SIP را تحمل کند، iMessage بسته‌بندی‌شده به حالت پایه محدود است — فقط ارسال/دریافت متن و رسانه، بدون واکنش‌ها / ویرایش / لغو ارسال / افکت‌ها / عملیات گروه.
</Warning>

### راه‌اندازی

1. **`imsg` را نصب (یا ارتقا) کنید** روی Macی که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   خروجی `imsg status --json` مقدارهای `bridge_version`، `rpc_methods`، و `selectors` هر متد را گزارش می‌کند تا پیش از شروع ببینید build فعلی از چه چیزهایی پشتیبانی می‌کند.

2. **System Integrity Protection را غیرفعال کنید.** این کار وابسته به نسخه macOS است، چون الزام زیربنایی Apple به OS و سخت‌افزار بستگی دارد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Library Validation را از طریق Terminal غیرفعال کنید، در Recovery Mode راه‌اندازی مجدد کنید، `csrutil disable` را اجرا کنید، سپس restart کنید.
   - **macOS 11+ (Big Sur و بعدتر)، Intel:** Recovery Mode (یا Internet Recovery)، `csrutil disable`، restart.
   - **macOS 11+، Apple Silicon:** توالی راه‌اندازی با دکمه پاور برای ورود به Recovery؛ در نسخه‌های اخیر macOS هنگام کلیک روی Continue کلید **Left Shift** را نگه دارید، سپس `csrutil disable`. راه‌اندازی‌های ماشین مجازی جریان جداگانه‌ای دارند — ابتدا یک snapshot از VM بگیرید.
   - **macOS 26 / Tahoe:** سیاست‌های library-validation و بررسی‌های private-entitlement مربوط به `imagent` سخت‌گیرانه‌تر شده‌اند؛ شاید `imsg` برای همگام ماندن به build به‌روزشده نیاز داشته باشد. اگر پس از یک ارتقای اصلی macOS تزریق `imsg launch` یا `selectors` خاص شروع به بازگرداندن false کردند، پیش از فرض موفقیت‌آمیز بودن مرحله SIP، یادداشت‌های انتشار `imsg` را بررسی کنید.

   برای غیرفعال کردن SIP پیش از اجرای `imsg launch`، جریان Recovery-mode مربوط به Apple را برای Mac خود دنبال کنید.

3. **helper را تزریق کنید.** با SIP غیرفعال و Messages.app وارد حساب شده:

   ```bash
   imsg launch
   ```

   وقتی SIP هنوز فعال باشد، `imsg launch` از تزریق خودداری می‌کند، بنابراین این فرمان همچنین تأییدی است که مرحله ۲ اثر کرده است.

4. **bridge را از OpenClaw راستی‌آزمایی کنید:**

   ```bash
   openclaw channels status --probe
   ```

   ورودی iMessage باید `works` را گزارش کند، و `imsg status --json | jq '.selectors'` باید `retractMessagePart: true` به‌علاوه هر selector مربوط به ویرایش / تایپ / خواندن را که build macOS شما در دسترس می‌گذارد نشان دهد. gate کردن هر متد در Plugin OpenClaw در `actions.ts` فقط کنش‌هایی را تبلیغ می‌کند که selector زیربنایی آن‌ها `true` است، بنابراین سطح کنشی که در فهرست ابزارهای agent می‌بینید بازتاب چیزی است که bridge واقعاً می‌تواند روی این میزبان انجام دهد.

اگر `openclaw channels status --probe` کانال را به‌صورت `works` گزارش کند اما کنش‌های خاص در زمان dispatch خطای "iMessage `<action>` requires the imsg private API bridge" بدهند، `imsg launch` را دوباره اجرا کنید — helper ممکن است از دسترس خارج شود (راه‌اندازی مجدد Messages.app، به‌روزرسانی OS، و غیره) و وضعیت کش‌شده `available: true` تا زمان probe بعدی که وضعیت را تازه کند همچنان کنش‌ها را تبلیغ می‌کند.

### وقتی نمی‌توانید SIP را غیرفعال کنید

اگر غیرفعال بودن SIP برای مدل تهدید شما قابل قبول نیست:

- `imsg` به حالت پایه برمی‌گردد — فقط متن + رسانه + دریافت.
- Plugin OpenClaw همچنان ارسال متن/رسانه و پایش ورودی را تبلیغ می‌کند؛ فقط `react`، `edit`، `unsend`، `reply`، `sendWithEffect`، و عملیات گروه را از سطح کنش پنهان می‌کند (مطابق gate قابلیت هر متد).
- می‌توانید یک Mac جداگانه غیر Apple Silicon (یا یک Mac اختصاصی برای bot) با SIP خاموش برای بار کاری iMessage اجرا کنید، در حالی که SIP روی دستگاه‌های اصلی شما فعال می‌ماند. [کاربر macOS اختصاصی bot (هویت جداگانه iMessage)](#deployment-patterns) را در ادامه ببینید.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist می‌توانند handle، گروه‌های دسترسی فرستنده ثابت (`accessGroup:<name>`)، یا اهداف chat (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) باشند.

  </Tab>

  <Tab title="سیاست گروه + اشاره‌ها">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض وقتی پیکربندی شده باشد)
    - `open`
    - `disabled`

    allowlist فرستنده گروه: `channels.imessage.groupAllowFrom`.

    ورودی‌های `groupAllowFrom` همچنین می‌توانند به گروه‌های دسترسی فرستنده ثابت (`accessGroup:<name>`) ارجاع دهند.

    fallback در runtime: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستنده گروه iMessage در صورت در دسترس بودن به `allowFrom` برمی‌گردند.
    نکته runtime: اگر `channels.imessage` کاملاً وجود نداشته باشد، runtime به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار log می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    <Warning>
    مسیریابی گروه **دو** gate allowlist دارد که پشت سر هم اجرا می‌شوند، و هر دو باید عبور کنند:

    1. **allowlist فرستنده / هدف chat** (`channels.imessage.groupAllowFrom`) — handle، `chat_guid`، `chat_identifier`، یا `chat_id`.
    2. **registry گروه** (`channels.imessage.groups`) — با `groupPolicy: "allowlist"`، این gate یا به یک ورودی wildcard به‌شکل `groups: { "*": { ... } }` نیاز دارد (`allowAll = true` را تنظیم می‌کند)، یا یک ورودی صریح برای هر `chat_id` زیر `groups`.

    اگر gate 2 هیچ چیزی نداشته باشد، همه پیام‌های گروه حذف می‌شوند. Plugin دو سیگنال سطح `warn` را در سطح log پیش‌فرض منتشر می‌کند:

    - یک‌بار برای هر حساب در startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - یک‌بار برای هر `chat_id` در runtime: `imessage: dropping group message from chat_id=<id> ...`

    پیام‌های مستقیم همچنان کار می‌کنند، چون از مسیر کد متفاوتی عبور می‌کنند.

    حداقل پیکربندی برای ادامه جریان گروه‌ها تحت `groupPolicy: "allowlist"`:

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

    اگر آن خطوط `warn` در لاگ Gateway ظاهر شوند، گیت ۲ در حال رد کردن است — بلوک `groups` را اضافه کنید.
    </Warning>

    اعمال شرط اشاره برای گروه‌ها را ذکر کنید:

    - iMessage فراداده بومی برای اشاره ندارد
    - تشخیص اشاره از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، اعمال شرط اشاره ممکن نیست

    دستورهای کنترلی از فرستندگان مجاز می‌توانند شرط اشاره را در گروه‌ها دور بزنند.

    `systemPrompt` برای هر گروه:

    هر ورودی زیر `channels.imessage.groups.*` یک رشته اختیاری `systemPrompt` می‌پذیرد. این مقدار در هر نوبتی که پیامی را در آن گروه پردازش می‌کند، به پرامپت سیستمی عامل تزریق می‌شود. حل‌کردن آن مشابه حل پرامپت برای هر گروه است که توسط `channels.whatsapp.groups` استفاده می‌شود:

    1. **پرامپت سیستمی ویژه گروه** (`groups["<chat_id>"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص در نگاشت وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی برای آن گروه اعمال نمی‌شود.
    2. **پرامپت سیستمی wildcard گروه** (`groups["*"].systemPrompt`): زمانی استفاده می‌شود که ورودی گروه مشخص کاملاً از نگاشت غایب باشد، یا وجود داشته باشد اما هیچ کلید `systemPrompt` تعریف نکند.

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

    پرامپت‌های هر گروه فقط روی پیام‌های گروهی اعمال می‌شوند — پیام‌های مستقیم در این کانال تحت تأثیر قرار نمی‌گیرند.

  </Tab>

  <Tab title="نشست‌ها و پاسخ‌های قطعی">
    - پیام‌های مستقیم از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروهی استفاده می‌کنند.
    - با مقدار پیش‌فرض `session.dmScope=main`، پیام‌های مستقیم iMessage در نشست اصلی عامل ادغام می‌شوند.
    - نشست‌های گروهی جدا هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فراداده کانال/هدف مبدأ به iMessage برمی‌گردند.

    رفتار رشته‌های شبیه گروه:

    برخی رشته‌های iMessage با چند مشارکت‌کننده ممکن است با `is_group=false` برسند.
    اگر آن `chat_id` به‌صراحت زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را به‌عنوان ترافیک گروهی در نظر می‌گیرد (کنترل گروهی + جداسازی نشست گروهی).

  </Tab>
</Tabs>

## پیوندهای مکالمه ACP

چت‌های قدیمی iMessage همچنین می‌توانند به نشست‌های ACP پیوند داده شوند.

روند سریع اپراتور:

- داخل پیام مستقیم یا چت گروهی مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های آینده در همان مکالمه iMessage به نشست ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان نشست ACP پیوندخورده را درجا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و پیوند را حذف می‌کند.

پیوندهای پایدار پیکربندی‌شده از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از این موارد استفاده کند:

- شناسه پیام مستقیم نرمال‌شده مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (توصیه‌شده برای پیوندهای گروهی پایدار)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

نمونه:

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

برای رفتار مشترک پیوند ACP، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="کاربر اختصاصی macOS برای ربات (هویت iMessage جداگانه)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک ربات از پروفایل شخصی Messages شما جدا بماند.

    روند معمول:

    1. یک کاربر اختصاصی macOS بسازید/وارد آن شوید.
    2. در آن کاربر، با Apple ID ربات وارد Messages شوید.
    3. `imsg` را در آن کاربر نصب کنید.
    4. یک wrapper برای SSH بسازید تا OpenClaw بتواند `imsg` را در زمینه همان کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل آن کاربر اشاره دهید.

    اجرای نخست ممکن است به تأییدهای GUI (Automation + Full Disk Access) در نشست همان کاربر ربات نیاز داشته باشد.

  </Accordion>

  <Accordion title="Mac راه‌دور از طریق Tailscale (نمونه)">
    توپولوژی رایج:

    - Gateway روی Linux/VM اجرا می‌شود
    - iMessage + `imsg` روی یک Mac در tailnet شما اجرا می‌شود
    - wrapper مربوط به `cliPath` از SSH برای اجرای `imsg` استفاده می‌کند
    - `remoteHost` واکشی پیوست‌ها با SCP را فعال می‌کند

    نمونه:

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
    ابتدا مطمئن شوید کلید میزبان قابل اعتماد است (برای مثال `ssh bot@mac-mini.tailnet-1234.ts.net`) تا `known_hosts` پر شود.

  </Accordion>

  <Accordion title="الگوی چندحسابی">
    iMessage از پیکربندی هر حساب زیر `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات تاریخچه و فهرست مجاز ریشه‌های پیوست را بازنویسی کند.

  </Accordion>
</AccordionGroup>

## رسانه، قطعه‌بندی و اهداف تحویل

<AccordionGroup>
  <Accordion title="پیوست‌ها و رسانه">
    - دریافت پیوست‌های ورودی **به‌صورت پیش‌فرض خاموش است** — برای ارسال عکس‌ها، یادداشت‌های صوتی، ویدیو و پیوست‌های دیگر به عامل، `channels.imessage.includeAttachments: true` را تنظیم کنید. وقتی غیرفعال باشد، iMessageهای فقط شامل پیوست پیش از رسیدن به عامل حذف می‌شوند و ممکن است اصلاً هیچ خط لاگ `Inbound message` تولید نکنند.
    - مسیرهای پیوست راه‌دور وقتی `remoteHost` تنظیم شده باشد، می‌توانند از طریق SCP واکشی شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشه پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازه رسانه خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض ۱۶ MB)

  </Accordion>

  <Accordion title="قطعه‌بندی خروجی">
    - سقف قطعه متن: `channels.imessage.textChunkLimit` (پیش‌فرض ۴۰۰۰)
    - حالت قطعه‌بندی: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم با اولویت پاراگراف)

  </Accordion>

  <Accordion title="قالب‌های آدرس‌دهی">
    اهداف صریح ترجیحی:

    - `chat_id:123` (توصیه‌شده برای مسیریابی پایدار)
    - `chat_guid:...`
    - `chat_identifier:...`

    اهداف مبتنی بر شناسه نیز پشتیبانی می‌شوند:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## کنش‌های API خصوصی

وقتی `imsg launch` در حال اجرا است و `openclaw channels status --probe` مقدار `privateApi.available: true` را گزارش می‌کند، ابزار پیام علاوه بر ارسال‌های متنی معمول می‌تواند از کنش‌های بومی iMessage استفاده کند.

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
    - **react**: افزودن/حذف Tapbackهای iMessage (`messageId`، `emoji`، `remove`). Tapbackهای پشتیبانی‌شده به عشق، پسندیدن، نپسندیدن، خنده، تأکید و پرسش نگاشت می‌شوند.
    - **reply**: ارسال پاسخ رشته‌ای به یک پیام موجود (`messageId`، `text` یا `message`، به‌علاوه `chatGuid`، `chatId`، `chatIdentifier` یا `to`).
    - **sendWithEffect**: ارسال متن با یک جلوه iMessage (`text` یا `message`، `effect` یا `effectId`).
    - **edit**: ویرایش یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شده macOS/API خصوصی (`messageId`، `text` یا `newText`).
    - **unsend**: پس‌گرفتن یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شده macOS/API خصوصی (`messageId`).
    - **upload-file**: ارسال رسانه/فایل‌ها (`buffer` به‌صورت base64 یا یک `media`/`path`/`filePath` هیدراته‌شده، `filename`، و `asVoice` اختیاری). نام مستعار قدیمی: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: مدیریت چت‌های گروهی وقتی هدف فعلی یک مکالمه گروهی است.

  </Accordion>

  <Accordion title="شناسه‌های پیام">
    زمینه iMessage ورودی، هم مقدارهای کوتاه `MessageSid` و هم GUIDهای کامل پیام را در صورت موجود بودن شامل می‌شود. شناسه‌های کوتاه به cache پاسخ اخیر در حافظه محدود هستند و پیش از استفاده در برابر چت فعلی بررسی می‌شوند. اگر یک شناسه کوتاه منقضی شده باشد یا متعلق به چت دیگری باشد، با `MessageSidFull` کامل دوباره تلاش کنید.

  </Accordion>

  <Accordion title="تشخیص قابلیت">
    OpenClaw کنش‌های API خصوصی را فقط زمانی پنهان می‌کند که وضعیت probe ذخیره‌شده در cache بگوید bridge در دسترس نیست. اگر وضعیت نامعلوم باشد، کنش‌ها قابل مشاهده می‌مانند و dispatch به‌صورت تنبل probe می‌کند تا نخستین کنش پس از `imsg launch` بدون refresh دستی جداگانه وضعیت موفق شود.

  </Accordion>

  <Accordion title="رسیدهای خواندن و نشانگر تایپ">
    وقتی bridge API خصوصی فعال است، چت‌های ورودی پذیرفته‌شده پیش از dispatch به‌عنوان خوانده‌شده علامت‌گذاری می‌شوند و هنگام تولید پاسخ توسط عامل، حباب تایپ برای فرستنده نشان داده می‌شود. علامت‌گذاری خواندن را با این تنظیم غیرفعال کنید:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    buildهای قدیمی‌تر `imsg` که مربوط به قبل از فهرست قابلیت هر متد هستند، تایپ/خواندن را بی‌صدا غیرفعال می‌کنند؛ OpenClaw در هر restart یک هشدار یک‌باره ثبت می‌کند تا نبود رسید قابل انتساب باشد.

  </Accordion>

  <Accordion title="Tapbackهای ورودی">
    OpenClaw در Tapbackهای iMessage مشترک می‌شود و واکنش‌های پذیرفته‌شده را به‌جای متن پیام معمول، به‌عنوان رویدادهای سیستمی مسیریابی می‌کند؛ بنابراین Tapback کاربر یک چرخه پاسخ عادی را فعال نمی‌کند.

    حالت اعلان توسط `channels.imessage.reactionNotifications` کنترل می‌شود:

    - `"own"` (پیش‌فرض): فقط وقتی کاربران به پیام‌های نوشته‌شده توسط ربات واکنش می‌دهند، اعلان بده.
    - `"all"`: برای همه Tapbackهای ورودی از فرستندگان مجاز اعلان بده.
    - `"off"`: Tapbackهای ورودی را نادیده بگیر.

    بازنویسی‌های هر حساب از `channels.imessage.accounts.<id>.reactionNotifications` استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## نوشتن پیکربندی

iMessage به‌صورت پیش‌فرض اجازه نوشتن پیکربندی آغازشده توسط کانال را می‌دهد (برای `/config set|unset` وقتی `commands.config: true` باشد).

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

## تجمیع پیام‌های مستقیمِ ارسالِ تفکیک‌شده (دستور + URL در یک ترکیب)

وقتی کاربر یک دستور و یک URL را با هم تایپ می‌کند — برای مثال `Dump https://example.com/article` — برنامه Messages اپل ارسال را به **دو ردیف جداگانه `chat.db`** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک بالون پیش‌نمایش URL (`"https://..."`) با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

این دو ردیف در بیشتر setupها با فاصله حدود ۰.۸ تا ۲.۰ ثانیه به OpenClaw می‌رسند. بدون تجمیع، عامل در نوبت ۱ فقط دستور را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست»)، و URL را فقط در نوبت ۲ می‌بیند — در آن نقطه زمینه دستور از قبل از دست رفته است. این خط لوله ارسال اپل است، نه چیزی که OpenClaw یا `imsg` ایجاد کرده باشد.

`channels.imessage.coalesceSameSenderDms` یک DM را برای ادغام ردیف‌های پیاپی از همان فرستنده در یک نوبت واحد عامل فعال می‌کند. گفت‌وگوهای گروهی همچنان به‌ازای هر پیام ارسال می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="زمان فعال‌سازی">
    زمانی فعال کنید که:

    - Skillsای ارائه می‌کنید که انتظار دارند `command + payload` در یک پیام باشد (dump، paste، save، queue و غیره).
    - کاربران شما URLها، تصاویر یا محتوای طولانی را همراه با فرمان‌ها paste می‌کنند.
    - می‌توانید تاخیر اضافه‌شده برای نوبت DM را بپذیرید (پایین‌تر ببینید).

    زمانی غیرفعال بگذارید که:

    - برای محرک‌های DM تک‌واژه‌ای به کمترین تاخیر فرمان نیاز دارید.
    - همهٔ جریان‌های شما فرمان‌های یک‌مرحله‌ای بدون پیگیری payload هستند.

  </Tab>
  <Tab title="فعال‌سازی">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    با روشن بودن این پرچم و بدون `messages.inbound.byChannel.imessage` صریح، پنجرهٔ debounce به **2500 ms** گسترش می‌یابد (پیش‌فرض قدیمی 0 ms است — بدون debounce). این پنجرهٔ بازتر لازم است چون آهنگ ارسال جداگانهٔ Apple، یعنی 0.8-2.0 s، در پیش‌فرضی فشرده‌تر جا نمی‌گیرد.

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
  <Tab title="مصالحه‌ها">
    - **تاخیر اضافه برای پیام‌های DM.** با روشن بودن این پرچم، هر DM (از جمله فرمان‌های کنترلی مستقل و پیگیری‌های تک‌متنی) تا سقف پنجرهٔ debounce پیش از ارسال منتظر می‌ماند، شاید یک ردیف payload در راه باشد. پیام‌های گفت‌وگوی گروهی ارسال فوری خود را حفظ می‌کنند.
    - **خروجی ادغام‌شده محدود است.** متن ادغام‌شده با نشانگر صریح `…[truncated]` تا 4000 نویسه محدود می‌شود؛ پیوست‌ها تا 20؛ ورودی‌های منبع تا 10 (فراتر از آن، اولین به‌علاوهٔ جدیدترین نگه داشته می‌شود). هر GUID منبع در `coalescedMessageGuids` برای دورسنجی پایین‌دستی ردیابی می‌شود.
    - **فقط DM.** گفت‌وگوهای گروهی به ارسال به‌ازای هر پیام ادامه می‌دهند تا ربات هنگام تایپ چند نفر پاسخ‌گو بماند.
    - **اختیاری و به‌ازای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تاثیر نیستند. پیکربندی‌های قدیمی BlueBubbles که `channels.bluebubbles.coalesceSameSenderDms` را تنظیم می‌کنند باید آن مقدار را به `channels.imessage.coalesceSameSenderDms` منتقل کنند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| کاربر می‌نویسد                                                     | `chat.db` تولید می‌کند | پرچم خاموش (پیش‌فرض)                    | پرچم روشن + پنجرهٔ 2500 ms                                             |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 ردیف با فاصلهٔ ~1 s | دو نوبت عامل: «Dump» به‌تنهایی، سپس URL | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (پیوست + متن)                     | 2 ردیف                | دو نوبت (پیوست هنگام ادغام حذف می‌شود) | یک نوبت: متن + تصویر حفظ می‌شود                                        |
| `/status` (فرمان مستقل)                                           | 1 ردیف                | ارسال فوری                              | **تا سقف پنجره منتظر می‌ماند، سپس ارسال می‌شود**                      |
| URL به‌تنهایی paste شده                                            | 1 ردیف                | ارسال فوری                              | ارسال فوری (فقط یک ورودی در bucket)                                    |
| متن + URL که عمدا در دو پیام جداگانه با فاصلهٔ چند دقیقه ارسال شده‌اند | 2 ردیف بیرون از پنجره | دو نوبت                                 | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                 |
| سیل سریع (>10 DM کوچک داخل پنجره)                                 | N ردیف                | N نوبت                                  | یک نوبت، خروجی محدود (اولین + جدیدترین، سقف متن/پیوست اعمال شده)     |
| دو نفر در یک گفت‌وگوی گروهی تایپ می‌کنند                           | N ردیف از M فرستنده   | M+ نوبت (یکی برای هر bucket فرستنده)   | M+ نوبت — گفت‌وگوهای گروهی coalesce نمی‌شوند                           |

## همگام‌سازی پس از ازکارافتادگی Gateway

وقتی Gateway آفلاین است (خرابی، راه‌اندازی مجدد، خواب Mac، خاموش بودن دستگاه)، `imsg watch` پس از بازگشت Gateway از وضعیت فعلی `chat.db` ادامه می‌دهد — هر چیزی که در آن فاصله رسیده باشد، به‌طور پیش‌فرض، هرگز دیده نمی‌شود. Catchup آن پیام‌ها را در راه‌اندازی بعدی بازپخش می‌کند تا عامل ترافیک ورودی را بی‌صدا از دست ندهد.

Catchup به‌طور **پیش‌فرض غیرفعال** است. آن را به‌ازای هر کانال فعال کنید:

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

### نحوهٔ اجرا

یک گذر در هر راه‌اندازی `monitorIMessageProvider`، با ترتیب `imsg launch` ready → `watch.subscribe` → `performIMessageCatchup` → live dispatch loop. خود Catchup از `chats.list` + `messages.history` به‌ازای هر گفت‌وگو، روی همان کلاینت JSON-RPC استفاده‌شده توسط `imsg watch` استفاده می‌کند. هر چیزی که هنگام گذر catchup برسد، به‌طور عادی از مسیر ارسال زنده عبور می‌کند؛ کش inbound-dedupe موجود هر هم‌پوشانی با ردیف‌های بازپخش‌شده را جذب می‌کند.

هر ردیف بازپخش‌شده از مسیر ارسال زنده (`evaluateIMessageInbound` + `dispatchInboundMessage`) عبور داده می‌شود، بنابراین allowlistها، سیاست گروه، debouncer، کش echo و رسیدهای خواندن در پیام‌های بازپخش‌شده و زنده رفتاری یکسان دارند.

### معناشناسی cursor و تلاش دوباره

Catchup یک cursor به‌ازای هر حساب در `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` نگه می‌دارد (دایرکتوری وضعیت OpenClaw به‌طور پیش‌فرض `~/.openclaw` است و با `OPENCLAW_STATE_DIR` قابل بازنویسی است):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- cursor با هر ارسال موفق جلو می‌رود و وقتی ارسال یک ردیف خطا می‌دهد نگه داشته می‌شود — راه‌اندازی بعدی همان ردیف را از cursor نگه‌داشته‌شده دوباره تلاش می‌کند.
- پس از `maxFailureRetries` خطای پیاپی برای همان `guid`، catchup یک `warn` ثبت می‌کند و cursor را به‌اجبار از پیام گیرکرده عبور می‌دهد تا راه‌اندازی‌های بعدی بتوانند پیش بروند.
- guidهایی که قبلا از آن‌ها صرف‌نظر شده است، در اجراهای بعدی به‌محض دیده‌شدن رد می‌شوند (بدون تلاش برای ارسال) و در خلاصهٔ اجرا زیر `skippedGivenUp` شمرده می‌شوند.

### سیگنال‌های قابل مشاهده برای اپراتور

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

خط `WARN ... capped to perRunLimit` یعنی یک راه‌اندازی واحد کل عقب‌ماندگی را تخلیه نکرده است. اگر فاصله‌های شما مرتب از گذر پیش‌فرض 50 ردیفی بیشتر می‌شود، `perRunLimit` را افزایش دهید (حداکثر 500).

### چه زمانی آن را خاموش بگذارید

- Gateway به‌طور پیوسته با راه‌اندازی مجدد خودکار watchdog اجرا می‌شود و فاصله‌ها همیشه < چند ثانیه هستند — پیش‌فرض خاموش مناسب است.
- حجم DM کم است و پیام‌های ازدست‌رفته رفتار عامل را تغییر نمی‌دهند — پنجرهٔ اولیهٔ `firstRunLookbackMinutes` می‌تواند هنگام اولین فعال‌سازی زمینهٔ قدیمی غافلگیرکننده‌ای را ارسال کند.

وقتی catchup را روشن می‌کنید، اولین راه‌اندازی بدون cursor فقط به اندازهٔ `firstRunLookbackMinutes` به عقب نگاه می‌کند (پیش‌فرض 30 دقیقه)، نه کل پنجرهٔ `maxAgeMinutes` — این از بازپخش تاریخچهٔ طولانی پیام‌های پیش از فعال‌سازی جلوگیری می‌کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg پیدا نشد یا RPC پشتیبانی نمی‌شود">
    باینری و پشتیبانی RPC را اعتبارسنجی کنید:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    اگر probe گزارش داد RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید. اگر کنش‌های API خصوصی در دسترس نیستند، `imsg launch` را در نشست کاربر واردشدهٔ macOS اجرا کنید و دوباره probe بگیرید. اگر Gateway روی macOS اجرا نمی‌شود، به‌جای مسیر local `imsg` پیش‌فرض، از راه‌اندازی Remote Mac over SSH بالا استفاده کنید.

  </Accordion>

  <Accordion title="Gateway روی macOS اجرا نمی‌شود">
    مقدار پیش‌فرض `cliPath: "imsg"` باید روی Macی اجرا شود که وارد Messages شده است. در Linux یا Windows، `channels.imessage.cliPath` را روی یک اسکریپت wrapper تنظیم کنید که به آن Mac SSH می‌زند و `imsg "$@"` را اجرا می‌کند.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    سپس اجرا کنید:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMها نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - تاییدهای pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="پیام‌های گروهی نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - رفتار allowlist در `channels.imessage.groups`
    - پیکربندی الگوی mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="پیوست‌های remote شکست می‌خورند">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان Gateway
    - کلید میزبان در `~/.ssh/known_hosts` روی میزبان Gateway وجود دارد
    - خواندنی‌بودن مسیر remote روی Macی که Messages را اجرا می‌کند

  </Accordion>

  <Accordion title="درخواست‌های مجوز macOS از دست رفته‌اند">
    در یک ترمینال GUI تعاملی در همان زمینهٔ کاربر/نشست دوباره اجرا کنید و درخواست‌ها را تایید کنید:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تایید کنید Full Disk Access + Automation برای زمینهٔ فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## اشاره‌گرهای مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [Pairing](/fa/channels/pairing)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) — اطلاعیه و خلاصهٔ مهاجرت
- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) — جدول ترجمهٔ پیکربندی و cutover گام‌به‌گام
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
