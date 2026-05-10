---
read_when:
    - راه‌اندازی پشتیبانی iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی از iMessage از طریق imsg (JSON-RPC روی stdio)، با کنش‌های API خصوصی برای پاسخ‌ها، tapbackها، افکت‌ها، پیوست‌ها و مدیریت گروه. برای راه‌اندازی‌های جدید iMessage در OpenClaw، زمانی که نیازمندی‌های میزبان سازگار باشد، گزینهٔ ترجیحی است.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:22:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرارهای OpenClaw iMessage، از `imsg` روی میزبان macOS Messages که وارد حساب شده است استفاده کنید. اگر Gateway شما روی Linux یا Windows اجرا می‌شود، `channels.imessage.cliPath` را به یک wrapper SSH اشاره دهید که `imsg` را روی Mac اجرا می‌کند.

**جبران قطعی Gateway اختیاری است.** وقتی فعال باشد (`channels.imessage.catchup.enabled: true`)، Gateway پیام‌های ورودی را که هنگام آفلاین بودن آن (خرابی، راه‌اندازی مجدد، خواب Mac) در `chat.db` ثبت شده‌اند، در راه‌اندازی بعدی بازپخش می‌کند. به‌صورت پیش‌فرض غیرفعال است — ببینید [جبران پس از قطعی Gateway](#catching-up-after-gateway-downtime). [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649) را می‌بندد.
</Note>

<Warning>
پشتیبانی BlueBubbles حذف شده است. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` منتقل کنید؛ OpenClaw فقط از طریق `imsg` از iMessage پشتیبانی می‌کند.
</Warning>

وضعیت: یکپارچه‌سازی CLI خارجی بومی. Gateway، `imsg rpc` را اجرا می‌کند و از طریق JSON-RPC روی stdio ارتباط برقرار می‌کند (بدون daemon/port جداگانه). کنش‌های پیشرفته به `imsg launch` و یک بررسی موفق API خصوصی نیاز دارند.

<CardGroup cols={3}>
  <Card title="کنش‌های API خصوصی" icon="wand-sparkles" href="#private-api-actions">
    پاسخ‌ها، tapbackها، افکت‌ها، پیوست‌ها، و مدیریت گروه.
  </Card>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم iMessage به‌صورت پیش‌فرض روی حالت جفت‌سازی هستند.
  </Card>
  <Card title="Mac راه دور" icon="terminal" href="#remote-mac-over-ssh">
    وقتی Gateway روی Mac مربوط به Messages اجرا نمی‌شود، از یک wrapper SSH استفاده کنید.
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

      <Step title="شروع Gateway">

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

  <Tab title="Mac راه دور از طریق SSH">
    OpenClaw فقط به یک `cliPath` سازگار با stdio نیاز دارد، بنابراین می‌توانید `cliPath` را به یک اسکریپت wrapper اشاره دهید که از طریق SSH به یک Mac راه دور وصل می‌شود و `imsg` را اجرا می‌کند.

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

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند با تجزیه اسکریپت wrapper SSH آن را به‌صورت خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

  </Tab>
</Tabs>

## الزامات و مجوزها (macOS)

- Messages باید روی Mac اجراکننده `imsg` وارد حساب شده باشد.
- دسترسی کامل دیسک برای context فرایندی که OpenClaw/`imsg` را اجرا می‌کند لازم است (دسترسی به پایگاه داده Messages).
- مجوز Automation برای ارسال پیام از طریق Messages.app لازم است.
- برای کنش‌های پیشرفته (واکنش / ویرایش / لغو ارسال / پاسخ رشته‌ای / افکت‌ها / عملیات گروه)، System Integrity Protection باید غیرفعال باشد — بخش [فعال‌سازی API خصوصی imsg](#enabling-the-imsg-private-api) را در ادامه ببینید. ارسال/دریافت متن و رسانه پایه بدون آن کار می‌کند.

<Tip>
مجوزها به ازای هر context فرایند اعطا می‌شوند. اگر Gateway به‌صورت headless اجرا می‌شود (LaunchAgent/SSH)، یک فرمان تعاملی یک‌باره را در همان context اجرا کنید تا promptها فعال شوند:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## فعال‌سازی API خصوصی imsg

`imsg` در دو حالت عملیاتی ارائه می‌شود:

- **حالت پایه** (پیش‌فرض، بدون نیاز به تغییرات SIP): متن و رسانه خروجی از طریق `send`، پایش/تاریخچه ورودی، فهرست چت. این همان چیزی است که با یک `brew install steipete/tap/imsg` تازه به‌همراه مجوزهای استاندارد macOS در بالا دریافت می‌کنید.
- **حالت API خصوصی**: `imsg` یک dylib کمکی را به `Messages.app` تزریق می‌کند تا توابع داخلی `IMCore` را فراخوانی کند. این همان چیزی است که `react`، `edit`، `unsend`، `reply` (رشته‌ای)، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، به‌همراه نشانگرهای تایپ و رسیدهای خواندن را فعال می‌کند.

برای رسیدن به سطح کنش پیشرفته‌ای که این صفحه کانال مستند می‌کند، به حالت API خصوصی نیاز دارید. README مربوط به `imsg` درباره این الزام صریح است:

> قابلیت‌های پیشرفته‌ای مانند `read`، `typing`، `launch`، ارسال غنی مبتنی بر bridge، تغییر پیام، و مدیریت چت اختیاری هستند. آن‌ها نیاز دارند SIP غیرفعال باشد و یک dylib کمکی به `Messages.app` تزریق شود. وقتی SIP فعال باشد، `imsg launch` از تزریق خودداری می‌کند.

تکنیک تزریق کمکی از dylib خود `imsg` برای دسترسی به APIهای خصوصی Messages استفاده می‌کند. در مسیر OpenClaw iMessage هیچ سرور شخص ثالث یا runtime مربوط به BlueBubbles وجود ندارد.

<Warning>
**غیرفعال کردن SIP یک مصالحه امنیتی واقعی است.** SIP یکی از محافظت‌های اصلی macOS در برابر اجرای کد سیستمی تغییریافته است؛ خاموش کردن آن در کل سیستم سطح حمله و عوارض جانبی بیشتری ایجاد می‌کند. به‌طور مشخص، **غیرفعال کردن SIP روی Macهای Apple Silicon امکان نصب و اجرای برنامه‌های iOS روی Mac شما را نیز غیرفعال می‌کند**.

با این کار به‌عنوان یک انتخاب عملیاتی آگاهانه برخورد کنید، نه یک پیش‌فرض. اگر مدل تهدید شما خاموش بودن SIP را تحمل نمی‌کند، iMessage همراه‌شده به حالت پایه محدود است — فقط ارسال/دریافت متن و رسانه، بدون واکنش‌ها / ویرایش / لغو ارسال / افکت‌ها / عملیات گروه.
</Warning>

### راه‌اندازی

1. **`imsg` را نصب (یا ارتقا) دهید** روی Mac که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   خروجی `imsg status --json`، `bridge_version`، `rpc_methods`، و `selectors` به ازای هر متد را گزارش می‌کند تا پیش از شروع ببینید build فعلی از چه چیزهایی پشتیبانی می‌کند.

2. **System Integrity Protection را غیرفعال کنید.** این مورد به نسخه macOS وابسته است، چون الزام زیربنایی Apple به سیستم‌عامل و سخت‌افزار بستگی دارد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Library Validation را از طریق Terminal غیرفعال کنید، به Recovery Mode راه‌اندازی مجدد کنید، `csrutil disable` را اجرا کنید، سپس دوباره راه‌اندازی کنید.
   - **macOS 11+ (Big Sur و بعدتر)، Intel:** Recovery Mode (یا Internet Recovery)، `csrutil disable`، راه‌اندازی مجدد.
   - **macOS 11+، Apple Silicon:** توالی راه‌اندازی با دکمه پاور برای ورود به Recovery؛ در نسخه‌های اخیر macOS هنگام کلیک روی Continue کلید **Left Shift** را نگه دارید، سپس `csrutil disable`. راه‌اندازی‌های ماشین مجازی جریان جداگانه‌ای دارند — ابتدا یک snapshot از VM بگیرید.
   - **macOS 26 / Tahoe:** سیاست‌های library-validation و بررسی‌های private-entitlement مربوط به `imagent` سخت‌گیرانه‌تر شده‌اند؛ ممکن است `imsg` برای همگام ماندن به build به‌روزشده نیاز داشته باشد. اگر پس از یک ارتقای عمده macOS، تزریق `imsg launch` یا `selectors` مشخصی شروع به برگرداندن false کردند، پیش از فرض موفق بودن مرحله SIP، یادداشت‌های انتشار `imsg` را بررسی کنید.

   برای غیرفعال کردن SIP پیش از اجرای `imsg launch`، جریان Recovery-mode Apple را برای Mac خود دنبال کنید.

3. **کمک‌کننده را تزریق کنید.** با SIP غیرفعال و Messages.app وارد حساب شده:

   ```bash
   imsg launch
   ```

   وقتی SIP هنوز فعال باشد، `imsg launch` از تزریق خودداری می‌کند، بنابراین این فرمان نقش تأیید موفق بودن مرحله ۲ را نیز دارد.

4. **bridge را از OpenClaw راستی‌آزمایی کنید:**

   ```bash
   openclaw channels status --probe
   ```

   ورودی iMessage باید `works` را گزارش کند، و `imsg status --json | jq '.selectors'` باید `retractMessagePart: true` به‌همراه هر selector ویرایش / تایپ / خواندنی را که build macOS شما ارائه می‌دهد نشان دهد. gating به ازای هر متد در Plugin OpenClaw در `actions.ts` فقط کنش‌هایی را تبلیغ می‌کند که selector زیربنایی آن‌ها `true` است، بنابراین سطح کنشی که در فهرست ابزار عامل می‌بینید، منعکس‌کننده کاری است که bridge واقعاً روی این میزبان می‌تواند انجام دهد.

اگر `openclaw channels status --probe` کانال را `works` گزارش کند اما کنش‌های مشخصی در زمان dispatch خطای "iMessage `<action>` requires the imsg private API bridge" بدهند، دوباره `imsg launch` را اجرا کنید — کمک‌کننده ممکن است خارج شده باشد (راه‌اندازی مجدد Messages.app، به‌روزرسانی OS، و غیره) و وضعیت cache‌شده `available: true` تا زمانی که probe بعدی تازه‌سازی شود، همچنان کنش‌ها را تبلیغ می‌کند.

### وقتی نمی‌توانید SIP را غیرفعال کنید

اگر غیرفعال‌سازی SIP برای مدل تهدید شما قابل قبول نیست:

- `imsg` به حالت پایه برمی‌گردد — فقط متن + رسانه + دریافت.
- Plugin مربوط به OpenClaw همچنان ارسال متن/رسانه و پایش ورودی را تبلیغ می‌کند؛ فقط `react`، `edit`، `unsend`، `reply`، `sendWithEffect` و عملیات گروه را از سطح کنش پنهان می‌کند (طبق gate قابلیت به ازای هر متد).
- می‌توانید یک Mac جداگانه غیر Apple-Silicon (یا یک Mac اختصاصی bot) را با SIP خاموش برای بار کاری iMessage اجرا کنید، در حالی که SIP را روی دستگاه‌های اصلی خود فعال نگه می‌دارید. بخش [کاربر macOS اختصاصی bot (هویت جداگانه iMessage)](#deployment-patterns) را در ادامه ببینید.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist می‌توانند handleها، گروه‌های دسترسی فرستنده ایستا (`accessGroup:<name>`)، یا هدف‌های چت (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) باشند.

  </Tab>

  <Tab title="سیاست گروه + mentionها">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض وقتی پیکربندی شده باشد)
    - `open`
    - `disabled`

    allowlist فرستنده گروه: `channels.imessage.groupAllowFrom`.

    ورودی‌های `groupAllowFrom` همچنین می‌توانند به گروه‌های دسترسی فرستنده ایستا (`accessGroup:<name>`) ارجاع دهند.

    fallback زمان اجرا: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستنده گروه iMessage در صورت وجود به `allowFrom` برمی‌گردند.
    نکته زمان اجرا: اگر `channels.imessage` کاملاً وجود نداشته باشد، runtime به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    <Warning>
    مسیریابی گروه **دو** gate allowlist دارد که پشت سر هم اجرا می‌شوند، و هر دو باید عبور کنند:

    1. **allowlist فرستنده / هدف چت** (`channels.imessage.groupAllowFrom`) — handle، `chat_guid`، `chat_identifier`، یا `chat_id`.
    2. **registry گروه** (`channels.imessage.groups`) — با `groupPolicy: "allowlist"`، این gate یا به یک ورودی wildcard با `groups: { "*": { ... } }` نیاز دارد (`allowAll = true` را تنظیم می‌کند)، یا به یک ورودی صریح به ازای هر `chat_id` زیر `groups`.

    اگر gate 2 هیچ چیزی نداشته باشد، هر پیام گروهی حذف می‌شود. Plugin در سطح log پیش‌فرض دو سیگنال در سطح `warn` منتشر می‌کند:

    - یک‌بار به ازای هر حساب هنگام راه‌اندازی: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - یک‌بار به ازای هر `chat_id` در زمان اجرا: `imessage: dropping group message from chat_id=<id> ...`

    پیام‌های مستقیم همچنان کار می‌کنند چون مسیر کد متفاوتی دارند.

    حداقل پیکربندی برای جاری ماندن گروه‌ها تحت `groupPolicy: "allowlist"`:

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

    اگر آن خطوط `warn` در log Gateway ظاهر شوند، gate 2 در حال حذف کردن است — بلوک `groups` را اضافه کنید.
    </Warning>

    gating مربوط به mention برای گروه‌ها:

    - iMessage فرادادهٔ بومی برای منشن ندارد
    - تشخیص منشن از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، اعمال گیتینگ منشن ممکن نیست

    دستورهای کنترلی از فرستندگان مجاز می‌توانند در گروه‌ها از گیتینگ منشن عبور کنند.

    `systemPrompt` برای هر گروه:

    هر ورودی زیر `channels.imessage.groups.*` یک رشتهٔ اختیاری `systemPrompt` می‌پذیرد. مقدار آن در هر نوبتی که پیامی را در آن گروه پردازش می‌کند، به پرامپت سیستمی عامل تزریق می‌شود. حل‌وفصل آن مشابه حل‌وفصل پرامپت برای هر گروه است که توسط `channels.whatsapp.groups` استفاده می‌شود:

    1. **پرامپت سیستمی ویژهٔ گروه** (`groups["<chat_id>"].systemPrompt`): وقتی ورودی گروه مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` یک رشتهٔ خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ پرامپت سیستمی به آن گروه اعمال نمی‌شود.
    2. **پرامپت سیستمی wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص کاملاً از map غایب باشد، یا وقتی وجود داشته باشد اما کلید `systemPrompt` تعریف نکرده باشد استفاده می‌شود.

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

  <Tab title="جلسه‌ها و پاسخ‌های قطعی">
    - پیام‌های مستقیم از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروهی استفاده می‌کنند.
    - با مقدار پیش‌فرض `session.dmScope=main`، پیام‌های مستقیم iMessage در جلسهٔ اصلی عامل ادغام می‌شوند.
    - جلسه‌های گروهی جدا هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فرادادهٔ کانال/هدف مبدأ به iMessage برمی‌گردند.

    رفتار رشته‌های شبیه گروه:

    برخی رشته‌های چندشرکت‌کننده‌ای iMessage می‌توانند با `is_group=false` وارد شوند.
    اگر آن `chat_id` به‌طور صریح زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را به‌عنوان ترافیک گروهی در نظر می‌گیرد (گیتینگ گروهی + جداسازی جلسهٔ گروهی).

  </Tab>
</Tabs>

## اتصال‌های مکالمهٔ ACP

چت‌های قدیمی iMessage می‌توانند به جلسه‌های ACP نیز متصل شوند.

جریان سریع اپراتور:

- داخل پیام مستقیم یا چت گروهی مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های بعدی در همان مکالمهٔ iMessage به جلسهٔ ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان جلسهٔ ACP متصل را درجا بازنشانی می‌کنند.
- `/acp close` جلسهٔ ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از موارد زیر استفاده کند:

- هندل نرمال‌شدهٔ پیام مستقیم مانند `+15555550123` یا `user@example.com`
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
  <Accordion title="کاربر اختصاصی macOS برای بات (هویت جداگانهٔ iMessage)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک بات از پروفایل شخصی Messages شما جدا بماند.

    جریان معمول:

    1. یک کاربر اختصاصی macOS ایجاد کنید/وارد آن شوید.
    2. در همان کاربر، با Apple ID بات وارد Messages شوید.
    3. `imsg` را در همان کاربر نصب کنید.
    4. یک wrapper برای SSH ایجاد کنید تا OpenClaw بتواند `imsg` را در بافت همان کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل همان کاربر اشاره دهید.

    اجرای نخست ممکن است در جلسهٔ همان کاربر بات به تأییدهای GUI (Automation + Full Disk Access) نیاز داشته باشد.

  </Accordion>

  <Accordion title="Mac راه‌دور از طریق Tailscale (مثال)">
    توپولوژی رایج:

    - Gateway روی Linux/VM اجرا می‌شود
    - iMessage + `imsg` روی یک Mac در tailnet شما اجرا می‌شود
    - wrapper مربوط به `cliPath` از SSH برای اجرای `imsg` استفاده می‌کند
    - `remoteHost` دریافت پیوست‌ها از طریق SCP را فعال می‌کند

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

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات تاریخچه، و allowlistهای ریشهٔ پیوست را بازنویسی کند.

  </Accordion>
</AccordionGroup>

## رسانه، تکه‌تکه‌سازی، و هدف‌های تحویل

<AccordionGroup>
  <Accordion title="پیوست‌ها و رسانه">
    - دریافت پیوست‌های ورودی **به‌طور پیش‌فرض خاموش است** — برای ارسال عکس‌ها، یادداشت‌های صوتی، ویدئو، و پیوست‌های دیگر به عامل، `channels.imessage.includeAttachments: true` را تنظیم کنید. وقتی غیرفعال باشد، iMessageهای فقط‌پیوست پیش از رسیدن به عامل حذف می‌شوند و ممکن است اصلاً هیچ خط لاگ `Inbound message` تولید نکنند.
    - مسیرهای پیوست راه‌دور وقتی `remoteHost` تنظیم شده باشد می‌توانند از طریق SCP دریافت شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشهٔ پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازهٔ رسانهٔ خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض 16 MB)

  </Accordion>

  <Accordion title="تکه‌تکه‌سازی خروجی">
    - حد تکهٔ متن: `channels.imessage.textChunkLimit` (پیش‌فرض 4000)
    - حالت تکه‌تکه‌سازی: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم با اولویت پاراگراف)

  </Accordion>

  <Accordion title="قالب‌های آدرس‌دهی">
    هدف‌های صریح ترجیحی:

    - `chat_id:123` (برای مسیریابی پایدار توصیه می‌شود)
    - `chat_guid:...`
    - `chat_identifier:...`

    هدف‌های مبتنی بر هندل نیز پشتیبانی می‌شوند:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## اقدام‌های API خصوصی

وقتی `imsg launch` در حال اجرا است و `openclaw channels status --probe` مقدار `privateApi.available: true` را گزارش می‌کند، ابزار پیام علاوه بر ارسال‌های متنی معمول می‌تواند از اقدام‌های بومی iMessage استفاده کند.

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
  <Accordion title="اقدام‌های موجود">
    - **react**: افزودن/حذف tapbackهای iMessage (`messageId`، `emoji`، `remove`). tapbackهای پشتیبانی‌شده به love، like، dislike، laugh، emphasize، و question نگاشت می‌شوند.
    - **reply**: ارسال پاسخ رشته‌ای به یک پیام موجود (`messageId`، `text` یا `message`، به‌همراه `chatGuid`، `chatId`، `chatIdentifier`، یا `to`).
    - **sendWithEffect**: ارسال متن با یک جلوهٔ iMessage (`text` یا `message`، `effect` یا `effectId`).
    - **edit**: ویرایش پیام ارسال‌شده در نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`، `text` یا `newText`).
    - **unsend**: پس‌گرفتن پیام ارسال‌شده در نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`).
    - **upload-file**: ارسال رسانه/فایل‌ها (`buffer` به‌صورت base64 یا یک `media`/`path`/`filePath` هیدراته‌شده، `filename`، و `asVoice` اختیاری). نام مستعار قدیمی: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: مدیریت چت‌های گروهی وقتی هدف فعلی یک مکالمهٔ گروهی است.

  </Accordion>

  <Accordion title="شناسه‌های پیام">
    بافت ورودی iMessage، وقتی موجود باشد، هم مقادیر کوتاه `MessageSid` و هم GUIDهای کامل پیام را شامل می‌شود. شناسه‌های کوتاه محدود به کش پاسخ درون‌حافظه‌ای اخیر هستند و پیش از استفاده در برابر چت فعلی بررسی می‌شوند. اگر یک شناسهٔ کوتاه منقضی شده باشد یا به چت دیگری تعلق داشته باشد، با `MessageSidFull` کامل دوباره تلاش کنید.

  </Accordion>

  <Accordion title="تشخیص قابلیت">
    OpenClaw اقدام‌های API خصوصی را فقط وقتی پنهان می‌کند که وضعیت probe کش‌شده نشان دهد bridge در دسترس نیست. اگر وضعیت نامشخص باشد، اقدام‌ها همچنان قابل مشاهده می‌مانند و ارسال، probeها را به‌صورت تنبل انجام می‌دهد تا نخستین اقدام بتواند پس از `imsg launch` بدون تازه‌سازی دستی جداگانهٔ وضعیت موفق شود.

  </Accordion>

  <Accordion title="رسید خواندن و تایپ کردن">
    وقتی bridge API خصوصی فعال باشد، چت‌های ورودی پذیرفته‌شده پیش از dispatch به‌عنوان خوانده‌شده علامت‌گذاری می‌شوند و هنگام تولید پاسخ توسط عامل، یک حباب تایپ برای فرستنده نمایش داده می‌شود. علامت‌گذاری خواندن را با این پیکربندی غیرفعال کنید:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    buildهای قدیمی‌تر `imsg` که پیش از فهرست قابلیت هر متد هستند، تایپ/خواندن را بی‌صدا gate می‌کنند؛ OpenClaw در هر راه‌اندازی مجدد یک هشدار یک‌باره ثبت می‌کند تا نبود رسید قابل انتساب باشد.

  </Accordion>
</AccordionGroup>

## نوشتن پیکربندی

iMessage به‌طور پیش‌فرض اجازهٔ نوشتن پیکربندیِ آغازشده از کانال را می‌دهد (برای `/config set|unset` وقتی `commands.config: true` باشد).

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

## ادغام پیام‌های مستقیم split-send (دستور + URL در یک ترکیب)

وقتی کاربر یک دستور و یک URL را با هم تایپ می‌کند — مثلاً `Dump https://example.com/article` — برنامهٔ Messages اپل ارسال را به **دو ردیف جداگانهٔ `chat.db`** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک بالن پیش‌نمایش URL (`"https://..."`) با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

این دو ردیف در بیشتر راه‌اندازی‌ها با فاصلهٔ حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت 1 فقط دستور را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست»)، و URL را فقط در نوبت 2 می‌بیند — در آن زمان بافت دستور از دست رفته است. این pipeline ارسال اپل است، نه چیزی که OpenClaw یا `imsg` معرفی کرده باشد.

`channels.imessage.coalesceSameSenderDms` یک پیام مستقیم را وارد حالت ادغام ردیف‌های پیاپی از همان فرستنده در یک نوبت عامل می‌کند. چت‌های گروهی همچنان برای هر پیام جداگانه dispatch می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="زمان فعال‌سازی">
    وقتی فعال کنید که:

    - شما Skillsی ارائه می‌کنید که انتظار `command + payload` را در یک پیام دارند (dump، paste، save، queue، و غیره).
    - کاربران شما URLها، تصاویر، یا محتوای طولانی را کنار دستورها paste می‌کنند.
    - می‌توانید تأخیر افزودهٔ نوبت پیام مستقیم را بپذیرید (پایین را ببینید).

    وقتی غیرفعال بگذارید که:

    - برای triggerهای تک‌کلمه‌ای پیام مستقیم به کمترین تأخیر دستور نیاز دارید.
    - همهٔ جریان‌های شما دستورهای یک‌مرحله‌ای بدون follow-up payload هستند.

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

    با فعال بودن پرچم و نبود `messages.inbound.byChannel.imessage` صریح، پنجرهٔ رفع نوسان به **2500 ms** افزایش می‌یابد (پیش‌فرض قدیمی 0 ms است — بدون رفع نوسان). این پنجرهٔ بازتر لازم است چون آهنگ ارسالِ تقسیم‌شدهٔ Apple با فاصلهٔ 0.8-2.0 s در پیش‌فرضی تنگ‌تر جا نمی‌شود.

    برای تنظیم پنجره توسط خودتان:

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
    - **تأخیر افزوده برای پیام‌های مستقیم.** با فعال بودن پرچم، هر پیام مستقیم (از جمله فرمان‌های کنترلی مستقل و پیگیری‌های تک‌متنی) پیش از ارسال تا سقف پنجرهٔ رفع نوسان منتظر می‌ماند، شاید ردیف بار داده‌ای در راه باشد. پیام‌های گپ گروهی همچنان فوری ارسال می‌شوند.
    - **خروجی ادغام‌شده محدود است.** متن ادغام‌شده با نشانگر صریح `…[truncated]` در 4000 نویسه محدود می‌شود؛ پیوست‌ها به 20 محدود می‌شوند؛ ورودی‌های منبع به 10 محدود می‌شوند (پس از آن نخستین و جدیدترین مورد نگه داشته می‌شود). هر GUID منبع برای سنجش‌پذیری پایین‌دست در `coalescedMessageGuids` ردیابی می‌شود.
    - **فقط پیام مستقیم.** گپ‌های گروهی به ارسال جداگانه برای هر پیام می‌افتند تا ربات وقتی چند نفر در حال تایپ هستند پاسخ‌گو بماند.
    - **اختیاری و برای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند. پیکربندی‌های قدیمی BlueBubbles که `channels.bluebubbles.coalesceSameSenderDms` را تنظیم کرده‌اند باید آن مقدار را به `channels.imessage.coalesceSameSenderDms` منتقل کنند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

| کاربر می‌نویسد                                                      | `chat.db` تولید می‌کند    | پرچم خاموش (پیش‌فرض)                      | پرچم روشن + پنجرهٔ 2500 ms                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 ردیف با فاصلهٔ حدود 1 s     | دو نوبت عامل: «Dump» تنها، سپس نشانی | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (پیوست + متن)                | 2 ردیف                | دو نوبت (پیوست هنگام ادغام حذف می‌شود) | یک نوبت: متن + تصویر حفظ می‌شود                                        |
| `/status` (فرمان مستقل)                                     | 1 ردیف                 | ارسال فوری                        | **تا سقف پنجره منتظر می‌ماند، سپس ارسال می‌شود**                                    |
| نشانی به‌تنهایی چسبانده شده                                                   | 1 ردیف                 | ارسال فوری                        | ارسال فوری (فقط یک ورودی در سطل)                             |
| متن + نشانی که عمداً به‌صورت دو پیام جدا و با فاصلهٔ چند دقیقه ارسال شده‌اند | 2 ردیف بیرون از پنجره | دو نوبت                               | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                 |
| هجوم سریع (>10 پیام مستقیم کوچک درون پنجره)                          | N ردیف                | N نوبت                                 | یک نوبت، خروجی محدود (نخستین + جدیدترین، سقف‌های متن/پیوست اعمال می‌شوند) |
| دو نفر در یک گپ گروهی تایپ می‌کنند                                  | N ردیف از M فرستنده | M+ نوبت (یکی برای هر سطل فرستنده)        | M+ نوبت — گپ‌های گروهی ادغام نمی‌شوند                                |

## جبران پس از قطعی Gateway

وقتی Gateway آفلاین است (خرابی، راه‌اندازی دوباره، خواب Mac، خاموش بودن دستگاه)، `imsg watch` پس از بازگشت Gateway از وضعیت فعلی `chat.db` ادامه می‌دهد — هر چیزی که در فاصلهٔ قطعی رسیده باشد، به‌صورت پیش‌فرض، هرگز دیده نمی‌شود. جبران این پیام‌ها را در راه‌اندازی بعدی بازپخش می‌کند تا عامل بی‌صدا ترافیک ورودی را از دست ندهد.

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

### نحوهٔ اجرا

در هر راه‌اندازی `monitorIMessageProvider` یک گذر اجرا می‌شود، با ترتیب `imsg launch` آماده → `watch.subscribe` → `performIMessageCatchup` → حلقهٔ ارسال زنده. خود جبران از `chats.list` + `messages.history` برای هر گپ، روی همان کارخواه JSON-RPC استفاده‌شده توسط `imsg watch` استفاده می‌کند. هر چیزی که هنگام گذر جبران برسد به‌صورت عادی از مسیر ارسال زنده عبور می‌کند؛ حافظهٔ نهان حذف تکراری‌های ورودی موجود هر هم‌پوشانی با ردیف‌های بازپخش‌شده را جذب می‌کند.

هر ردیف بازپخش‌شده از مسیر ارسال زنده عبور داده می‌شود (`evaluateIMessageInbound` + `dispatchInboundMessage`)، بنابراین فهرست‌های مجاز، سیاست گروه، رفع‌کنندهٔ نوسان، حافظهٔ نهان پژواک، و رسیدهای خواندن روی پیام‌های بازپخش‌شده و زنده رفتاری یکسان دارند.

### معناشناسی مکان‌نما و تلاش دوباره

جبران برای هر حساب یک مکان‌نما در `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` نگه می‌دارد (دایرکتوری وضعیت OpenClaw به‌صورت پیش‌فرض `~/.openclaw` است و با `OPENCLAW_STATE_DIR` قابل بازنویسی است):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- مکان‌نما پس از هر ارسال موفق جلو می‌رود و وقتی ارسال یک ردیف خطا می‌دهد نگه داشته می‌شود — راه‌اندازی بعدی همان ردیف را از مکان‌نمای نگه‌داشته‌شده دوباره امتحان می‌کند.
- پس از `maxFailureRetries` خطای پیاپی روی همان `guid`، جبران یک `warn` ثبت می‌کند و مکان‌نما را به‌اجبار از پیام گیرکرده عبور می‌دهد تا راه‌اندازی‌های بعدی بتوانند پیشرفت کنند.
- guidهایی که قبلاً کنار گذاشته شده‌اند در اجراهای بعدی به‌محض مشاهده رد می‌شوند (بدون تلاش برای ارسال) و در خلاصهٔ اجرا زیر `skippedGivenUp` شمارش می‌شوند.

### سیگنال‌های قابل مشاهده برای اپراتور

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

خط `WARN ... capped to perRunLimit` یعنی یک راه‌اندازی منفرد کل عقب‌ماندگی را خالی نکرده است. اگر فاصله‌های شما مرتباً از گذر پیش‌فرض 50 ردیفی بیشتر می‌شود، `perRunLimit` را افزایش دهید (حداکثر 500).

### چه زمانی آن را خاموش بگذارید

- Gateway پیوسته با راه‌اندازی مجدد خودکارِ نگهبان اجرا می‌شود و فاصله‌ها همیشه کمتر از چند ثانیه هستند — پیش‌فرض خاموش مناسب است.
- حجم پیام مستقیم کم است و پیام‌های از‌دست‌رفته رفتار عامل را تغییر نمی‌دهند — پنجرهٔ اولیهٔ `firstRunLookbackMinutes` می‌تواند در نخستین فعال‌سازی زمینهٔ قدیمی غافلگیرکننده‌ای را ارسال کند.

وقتی جبران را روشن می‌کنید، نخستین راه‌اندازی بدون مکان‌نما فقط به‌اندازهٔ `firstRunLookbackMinutes` به عقب نگاه می‌کند (پیش‌فرض 30 دقیقه)، نه کل پنجرهٔ `maxAgeMinutes` — این از بازپخش تاریخچه‌ای طولانی از پیام‌های پیش از فعال‌سازی جلوگیری می‌کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg پیدا نشد یا RPC پشتیبانی نمی‌شود">
    دودویی و پشتیبانی RPC را اعتبارسنجی کنید:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    اگر کاوش گزارش دهد RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید. اگر کنش‌های API خصوصی در دسترس نیستند، `imsg launch` را در نشست کاربر واردشدهٔ macOS اجرا کنید و دوباره کاوش کنید. اگر Gateway روی macOS اجرا نمی‌شود، به‌جای مسیر محلی پیش‌فرض `imsg` از راه‌اندازی Mac راه‌دور از طریق SSH در بالا استفاده کنید.

  </Accordion>

  <Accordion title="Gateway روی macOS اجرا نمی‌شود">
    مقدار پیش‌فرض `cliPath: "imsg"` باید روی Mac واردشده به Messages اجرا شود. روی Linux یا Windows، `channels.imessage.cliPath` را روی یک اسکریپت پوششی تنظیم کنید که به آن Mac از طریق SSH وصل می‌شود و `imsg "$@"` را اجرا می‌کند.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    سپس اجرا کنید:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="پیام‌های مستقیم نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - تأییدهای جفت‌سازی (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="پیام‌های گروهی نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - رفتار فهرست مجاز `channels.imessage.groups`
    - پیکربندی الگوی اشاره (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="پیوست‌های راه‌دور شکست می‌خورند">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان Gateway
    - کلید میزبان در `~/.ssh/known_hosts` روی میزبان Gateway وجود دارد
    - خواندنی‌بودن مسیر راه‌دور روی Mac اجراکنندهٔ Messages

  </Accordion>

  <Accordion title="درخواست‌های مجوز macOS از دست رفته‌اند">
    در یک پایانهٔ گرافیکی تعاملی در همان زمینهٔ کاربر/نشست دوباره اجرا کنید و درخواست‌ها را تأیید کنید:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأیید کنید که Full Disk Access + Automation برای زمینهٔ فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## اشاره‌گرهای مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [جفت‌سازی](/fa/channels/pairing)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) — جدول ترجمهٔ پیکربندی و انتقال گام‌به‌گام
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گپ گروهی و دروازه‌گذاری اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
