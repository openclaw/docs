---
read_when:
    - راه‌اندازی پشتیبانی iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی از iMessage از طریق imsg (JSON-RPC روی stdio)، با کنش‌های API خصوصی برای پاسخ‌ها، tapbackها، جلوه‌ها، پیوست‌ها و مدیریت گروه. برای راه‌اندازی‌های جدید OpenClaw iMessage زمانی که نیازمندی‌های میزبان مناسب باشند، ترجیح داده می‌شود.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرارهای OpenClaw iMessage، از `imsg` روی میزبان macOS Messages که وارد حساب شده است استفاده کنید. اگر Gateway شما روی Linux یا Windows اجرا می‌شود، `channels.imessage.cliPath` را به یک پوشش SSH اشاره دهید که `imsg` را روی Mac اجرا می‌کند.

**بازیابی ورودی خودکار است.** پس از راه‌اندازی مجدد پل یا gateway، iMessage پیام‌هایی را که هنگام ازکارافتادگی از دست رفته‌اند بازپخش می‌کند و «بمب انباشت» کهنه‌ای را که Apple می‌تواند پس از بازیابی Push تخلیه کند سرکوب می‌کند، و با حذف موارد تکراری مانع می‌شود چیزی دوبار ارسال شود. هیچ پیکربندی‌ای برای فعال‌سازی وجود ندارد — ببینید [بازیابی ورودی پس از راه‌اندازی مجدد پل یا gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
پشتیبانی BlueBubbles حذف شد. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` مهاجرت دهید؛ OpenClaw از iMessage فقط از طریق `imsg` پشتیبانی می‌کند. برای اعلان کوتاه با [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) شروع کنید، یا برای جدول کامل مهاجرت [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) را ببینید.
</Warning>

وضعیت: یکپارچه‌سازی CLI خارجی بومی. Gateway فرآیند `imsg rpc` را ایجاد می‌کند و روی stdio از طریق JSON-RPC ارتباط برقرار می‌کند (بدون daemon/port جداگانه). کنش‌های پیشرفته به `imsg launch` و یک کاوش موفق API خصوصی نیاز دارند.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    پاسخ‌ها، tapbackها، افکت‌ها، پیوست‌ها، و مدیریت گروه.
  </Card>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    DMهای iMessage به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    زمانی که Gateway روی Mac مربوط به Messages اجرا نمی‌شود، از یک پوشش SSH استفاده کنید.
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
    OpenClaw فقط به یک `cliPath` سازگار با stdio نیاز دارد، بنابراین می‌توانید `cliPath` را به یک اسکریپت پوششی اشاره دهید که از طریق SSH به یک Mac راه‌دور وصل می‌شود و `imsg` را اجرا می‌کند.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    پیکربندی پیشنهادی هنگام فعال بودن پیوست‌ها:

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

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند آن را با تجزیه اسکریپت پوششی SSH به‌طور خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

<Warning>
هر پوشش `cliPath` یا پراکسی SSH که جلوی `imsg` قرار می‌دهید باید مانند یک لوله stdio شفاف برای JSON-RPC بلندمدت رفتار کند. OpenClaw در طول عمر کانال، پیام‌های کوچک JSON-RPC قاب‌بندی‌شده با newline را از طریق stdin/stdout پوشش مبادله می‌کند:

- هر تکه/خط stdin را **به‌محض در دسترس بودن بایت‌ها** ارسال کنید — منتظر EOF نمانید.
- هر تکه/خط stdout را به‌سرعت در جهت معکوس ارسال کنید.
- newlineها را حفظ کنید.
- از خواندن‌های مسدودکننده با اندازه ثابت (`read(4096)`، `cat | buffer`، `read` پیش‌فرض shell) که می‌توانند قاب‌های کوچک را گرسنه نگه دارند اجتناب کنید.
- stderr را از جریان stdout مربوط به JSON-RPC جدا نگه دارید.

پوششی که stdin را تا پر شدن یک بلوک بزرگ buffer می‌کند، نشانه‌هایی ایجاد می‌کند که شبیه قطعی iMessage به نظر می‌رسند — `imsg rpc timeout (chats.list)` یا راه‌اندازی مجدد مکرر کانال — هرچند خود `imsg rpc` سالم است. `ssh -T host imsg "$@"` (بالا) امن است چون آرگومان‌های `cliPath` مربوط به OpenClaw مانند `rpc` و `--db` را ارسال می‌کند. pipelineهایی مانند `ssh host imsg | grep -v '^DEBUG'` امن نیستند — ابزارهای line-buffered همچنان می‌توانند قاب‌ها را نگه دارند؛ اگر ناچار به فیلتر کردن هستید، در هر مرحله از `stdbuf -oL -eL` استفاده کنید.
</Warning>

  </Tab>
</Tabs>

## نیازمندی‌ها و مجوزها (macOS)

- Messages باید روی Macی که `imsg` را اجرا می‌کند وارد حساب شده باشد.
- برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند، Full Disk Access لازم است (دسترسی به پایگاه داده Messages).
- برای ارسال پیام‌ها از طریق Messages.app مجوز Automation لازم است.
- برای کنش‌های پیشرفته (واکنش / ویرایش / لغو ارسال / پاسخ رشته‌ای / افکت‌ها / عملیات گروه)، System Integrity Protection باید غیرفعال باشد — بخش [فعال‌سازی API خصوصی imsg](#enabling-the-imsg-private-api) را در ادامه ببینید. ارسال/دریافت پایه متن و رسانه بدون آن کار می‌کند.

<Tip>
مجوزها برای هر زمینه فرایندی اعطا می‌شوند. اگر gateway به‌صورت headless اجرا می‌شود (LaunchAgent/SSH)، یک فرمان تعاملی یک‌باره را در همان زمینه اجرا کنید تا promptها فعال شوند:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  یک راه‌اندازی SSH راه‌دور می‌تواند chatها را بخواند، `channels status --probe` را پاس کند، و پیام‌های ورودی را پردازش کند، درحالی‌که ارسال‌های خروجی همچنان با خطای مجوز AppleEvents شکست می‌خورند:

```text
Not authorized to send Apple events to Messages. (-1743)
```

پایگاه داده TCC کاربر واردشده Mac یا System Settings > Privacy & Security > Automation را بررسی کنید. اگر ورودی Automation به‌جای فرایند `imsg` یا shell محلی برای `/usr/libexec/sshd-keygen-wrapper` ثبت شده باشد، macOS ممکن است toggle قابل‌استفاده‌ای برای Messages برای آن کلاینت سمت سرور SSH نمایش ندهد:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

در آن وضعیت، تکرار `tccutil reset AppleEvents` یا اجرای دوباره `imsg send` از طریق همان پوشش SSH ممکن است همچنان شکست بخورد، چون زمینه فرایندی که به Automation برای Messages نیاز دارد پوشش SSH است، نه اپی که UI بتواند به آن مجوز بدهد.

به‌جای آن از یکی از زمینه‌های فرایندی پشتیبانی‌شده `imsg` استفاده کنید:

- Gateway، یا دست‌کم پل `imsg`، را در نشست محلی کاربر واردشده Messages اجرا کنید.
- پس از اعطای Full Disk Access و Automation از همان نشست، Gateway را با LaunchAgent برای آن کاربر شروع کنید.
- اگر topology دوکاربره SSH را نگه می‌دارید، پیش از فعال کردن کانال، تأیید کنید که یک ارسال واقعی خروجی `imsg send` از طریق همان پوشش دقیق موفق می‌شود. اگر نمی‌توان Automation را به آن اعطا کرد، به‌جای تکیه بر پوشش SSH برای ارسال‌ها، پیکربندی را به یک راه‌اندازی تک‌کاربره `imsg` تغییر دهید.

</Accordion>

## فعال‌سازی API خصوصی imsg

`imsg` در دو حالت عملیاتی ارائه می‌شود:

- **حالت پایه** (پیش‌فرض، بدون نیاز به تغییر SIP): متن و رسانه خروجی از طریق `send`، watch/history ورودی، فهرست chatها. این همان چیزی است که با یک `brew install steipete/tap/imsg` تازه به‌همراه مجوزهای استاندارد macOS بالا به‌صورت آماده دریافت می‌کنید.
- **حالت API خصوصی**: `imsg` یک helper dylib را به `Messages.app` تزریق می‌کند تا توابع داخلی `IMCore` را فراخوانی کند. این همان چیزی است که `react`، `edit`، `unsend`، `reply` (رشته‌ای)، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، به‌همراه نشانگرهای تایپ و رسیدهای خواندن را فعال می‌کند.

برای دسترسی به سطح کنش‌های پیشرفته‌ای که این صفحه کانال مستند می‌کند، به حالت API خصوصی نیاز دارید. README مربوط به `imsg` درباره این نیازمندی صریح است:

> ویژگی‌های پیشرفته مانند `read`، `typing`، `launch`، ارسال غنی مبتنی بر پل، تغییر پیام، و مدیریت chat به‌صورت opt-in هستند. آن‌ها نیاز دارند SIP غیرفعال باشد و یک helper dylib به `Messages.app` تزریق شود. `imsg launch` وقتی SIP فعال باشد از تزریق خودداری می‌کند.

تکنیک تزریق helper از dylib خود `imsg` برای دسترسی به APIهای خصوصی Messages استفاده می‌کند. در مسیر OpenClaw iMessage هیچ سرور شخص ثالث یا runtime مربوط به BlueBubbles وجود ندارد.

<Warning>
**غیرفعال کردن SIP یک مصالحه امنیتی واقعی است.** SIP یکی از حفاظت‌های اصلی macOS در برابر اجرای کد سیستمی تغییریافته است؛ خاموش کردن آن در سطح سیستم سطح حمله و عوارض جانبی بیشتری ایجاد می‌کند. به‌طور خاص، **غیرفعال کردن SIP روی Macهای Apple Silicon همچنین امکان نصب و اجرای اپ‌های iOS روی Mac شما را غیرفعال می‌کند**.

با این موضوع به‌عنوان یک انتخاب عملیاتی آگاهانه برخورد کنید، نه یک پیش‌فرض. اگر مدل تهدید شما نمی‌تواند خاموش بودن SIP را تحمل کند، iMessage بسته‌بندی‌شده به حالت پایه محدود است — فقط ارسال/دریافت متن و رسانه، بدون واکنش‌ها / ویرایش / لغو ارسال / افکت‌ها / عملیات گروه.
</Warning>

### راه‌اندازی

1. **`imsg` را نصب (یا ارتقا) کنید** روی Macی که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   خروجی `imsg status --json` مقدارهای `bridge_version`، `rpc_methods`، و `selectors` برای هر متد را گزارش می‌کند تا پیش از شروع ببینید build فعلی از چه چیزهایی پشتیبانی می‌کند.

2. **System Integrity Protection و (در macOSهای مدرن) Library Validation را غیرفعال کنید.** تزریق یک helper dylib غیر Apple به `Messages.app` امضاشده توسط Apple نیاز دارد SIP خاموش باشد **و** library validation سست شده باشد. مرحله SIP در حالت Recovery به نسخه macOS وابسته است:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Library Validation را از طریق Terminal غیرفعال کنید، به Recovery Mode راه‌اندازی مجدد کنید، `csrutil disable` را اجرا کنید، دوباره راه‌اندازی کنید.
   - **macOS 11+ (Big Sur و نسخه‌های بعدی)، Intel:** Recovery Mode (یا Internet Recovery)، `csrutil disable`، راه‌اندازی مجدد.
   - **macOS 11+، Apple Silicon:** توالی راه‌اندازی با دکمه پاور برای ورود به Recovery؛ در نسخه‌های جدید macOS هنگام کلیک روی Continue کلید **Left Shift** را نگه دارید، سپس `csrutil disable`. راه‌اندازی‌های ماشین مجازی جریان جداگانه‌ای دارند، بنابراین ابتدا یک snapshot از VM بگیرید.

   **در macOS 11 و نسخه‌های بعدی، معمولاً `csrutil disable` به‌تنهایی کافی نیست.** Apple همچنان library validation را برای `Messages.app` به‌عنوان یک platform binary اعمال می‌کند، بنابراین یک helper با امضای adhoc رد می‌شود (`Library Validation failed: ... platform binary, but mapped file is not`) حتی وقتی SIP خاموش است. پس از غیرفعال کردن SIP، library validation را نیز غیرفعال کرده و راه‌اندازی مجدد کنید:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)، تأییدشده روی 26.5.1:** خاموش بودن SIP **به‌علاوه** فرمان `DisableLibraryValidation` بالا برای تزریق helper در نسخه‌های 26.0 تا 26.5.x کافی است. **هیچ boot-args لازم نیست.** این plist عامل تعیین‌کننده و رایج‌ترین مرحله جاافتاده هنگام شکست تزریق روی Tahoe است:
   - **با plist:** `imsg launch` تزریق می‌کند و `imsg status` مقدار `advanced_features: true` را گزارش می‌کند.
   - **بدون plist (حتی با SIP خاموش):** `imsg launch` با `Failed to launch: Timeout waiting for Messages.app to initialize` شکست می‌خورد. AMFI helper با امضای adhoc را هنگام load رد می‌کند، بنابراین پل هرگز آماده نمی‌شود و launch timeout می‌دهد. این timeout همان نشانه‌ای است که بیشتر افراد روی Tahoe با آن روبه‌رو می‌شوند، و راه‌حل همان plist بالا است، نه اقدامی شدیدتر.

   این موضوع با یک آزمون کنترل‌شده قبل/بعد روی macOS 26.5.1 (Apple Silicon) تأیید شد: با plist، dylib در `Messages.app` map می‌شود و پل بالا می‌آید؛ plist را حذف کنید و راه‌اندازی مجدد کنید، و `imsg launch` شکست timeout بالا را با map نشدن dylib تولید می‌کند.

   اگر تزریق `imsg launch` یا `selectors` مشخص بعد از ارتقای macOS شروع به برگرداندن false کرد، این گیت معمولاً علت آن است. پیش از اینکه فرض کنید خود مرحله SIP شکست خورده است، وضعیت SIP و library-validation خود را بررسی کنید. اگر آن تنظیمات درست هستند و bridge هنوز نمی‌تواند تزریق کند، خروجی `imsg status --json` به‌همراه خروجی `imsg launch` را جمع‌آوری کنید و به‌جای تضعیف کنترل‌های امنیتی سراسری بیشتر، آن را به پروژه `imsg` گزارش دهید.

   برای غیرفعال کردن SIP پیش از اجرای `imsg launch`، جریان Recovery-mode اپل را برای Mac خود دنبال کنید.

3. **helper را تزریق کنید.** با SIP غیرفعال و Messages.app واردشده:

   ```bash
   imsg launch
   ```

   وقتی SIP هنوز فعال باشد، `imsg launch` از تزریق خودداری می‌کند؛ بنابراین این کار هم‌زمان تأیید می‌کند که مرحله ۲ انجام شده است.

4. **bridge را از OpenClaw تأیید کنید:**

   ```bash
   openclaw channels status --probe
   ```

   ورودی iMessage باید `works` را گزارش کند، و `imsg status --json | jq '.selectors'` باید `retractMessagePart: true` به‌علاوه هر selector مربوط به ویرایش / درحال‌نوشتن / خواندن را که build macOS شما ارائه می‌دهد نشان دهد. گیتینگ per-method در Plugin مربوط به OpenClaw در `actions.ts` فقط actionهایی را advertise می‌کند که selector زیربنایی آن‌ها `true` باشد؛ بنابراین سطح actionای که در فهرست ابزارهای agent می‌بینید بازتاب می‌دهد bridge واقعاً روی این میزبان چه کاری می‌تواند انجام دهد.

اگر `openclaw channels status --probe` کانال را به‌صورت `works` گزارش می‌کند اما actionهای مشخص هنگام dispatch خطای "iMessage `<action>` requires the imsg private API bridge" می‌دهند، دوباره `imsg launch` را اجرا کنید — helper ممکن است خارج شود (راه‌اندازی مجدد Messages.app، به‌روزرسانی OS، و غیره) و وضعیت cache‌شده `available: true` تا زمانی که probe بعدی تازه‌سازی شود، همچنان actionها را advertise می‌کند.

### وقتی نمی‌توانید SIP را غیرفعال کنید

اگر SIP غیرفعال با threat model شما قابل‌قبول نیست:

- `imsg` به حالت پایه fallback می‌کند — فقط متن + رسانه + دریافت.
- Plugin مربوط به OpenClaw همچنان ارسال متن/رسانه و پایش inbound را advertise می‌کند؛ فقط `react`، `edit`، `unsend`، `reply`، `sendWithEffect` و عملیات گروه را از سطح action پنهان می‌کند (طبق گیت قابلیت per-method).
- می‌توانید یک Mac جداگانه غیر Apple-Silicon (یا یک Mac اختصاصی برای بات) را با SIP خاموش برای بارکاری iMessage اجرا کنید، درحالی‌که SIP را روی دستگاه‌های اصلی خود فعال نگه می‌دارید. در پایین، [کاربر macOS اختصاصی بات (هویت iMessage جداگانه)](#deployment-patterns) را ببینید.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند آن است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist باید فرستنده‌ها را شناسایی کنند: handleها یا گروه‌های دسترسی ایستای فرستنده (`accessGroup:<name>`). برای هدف‌های chat مانند `chat_id:*`، `chat_guid:*` یا `chat_identifier:*` از `channels.imessage.groupAllowFrom` استفاده کنید؛ برای کلیدهای رجیستری عددی `chat_id` از `channels.imessage.groups` استفاده کنید.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض هنگام پیکربندی)
    - `open`
    - `disabled`

    allowlist فرستنده گروه: `channels.imessage.groupAllowFrom`.

    ورودی‌های `groupAllowFrom` همچنین می‌توانند به گروه‌های دسترسی ایستای فرستنده ارجاع دهند (`accessGroup:<name>`).

    fallback زمان اجرا: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستنده گروه iMessage از `allowFrom` استفاده می‌کنند؛ وقتی پذیرش DM و گروه باید متفاوت باشد، `groupAllowFrom` را تنظیم کنید.
    نکته زمان اجرا: اگر `channels.imessage` کاملاً وجود نداشته باشد، runtime به `groupPolicy="allowlist"` fallback می‌کند و یک warning ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    <Warning>
    مسیریابی گروه **دو** گیت allowlist دارد که پشت‌سرهم اجرا می‌شوند و هر دو باید عبور کنند:

    1. **allowlist فرستنده / هدف chat** (`channels.imessage.groupAllowFrom`) — handle، `chat_guid`، `chat_identifier` یا `chat_id`.
    2. **رجیستری گروه** (`channels.imessage.groups`) — با `groupPolicy: "allowlist"`، این گیت به یکی از این دو نیاز دارد: یک ورودی wildcard به‌شکل `groups: { "*": { ... } }` (که `allowAll = true` را تنظیم می‌کند)، یا یک ورودی explicit به‌ازای هر `chat_id` زیر `groups`.

    اگر گیت ۲ هیچ چیزی در خود نداشته باشد، همه پیام‌های گروه dropped می‌شوند. Plugin در سطح log پیش‌فرض دو سیگنال با سطح `warn` منتشر می‌کند:

    - یک‌بار به‌ازای هر حساب هنگام startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - یک‌بار به‌ازای هر `chat_id` در runtime: `imessage: dropping group message from chat_id=<id> ...`

    DMها به کار خود ادامه می‌دهند چون مسیر کد متفاوتی دارند.

    حداقل config برای جاری نگه داشتن گروه‌ها زیر `groupPolicy: "allowlist"`:

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

    اگر آن خطوط `warn` در log gateway ظاهر شوند، گیت ۲ در حال drop کردن است — بلوک `groups` را اضافه کنید.
    </Warning>

    گیتینگ mention برای گروه‌ها:

    - iMessage هیچ metadata بومی برای mention ندارد
    - تشخیص mention از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، با fallback به `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، گیتینگ mention قابل اعمال نیست

    فرمان‌های کنترلی از فرستنده‌های مجاز می‌توانند در گروه‌ها گیتینگ mention را دور بزنند.

    `systemPrompt` به‌ازای هر گروه:

    هر ورودی زیر `channels.imessage.groups.*` یک رشته اختیاری `systemPrompt` می‌پذیرد. این مقدار در هر نوبتی که پیامی را در آن گروه پردازش می‌کند، به system prompt agent تزریق می‌شود. Resolution همانند resolution پرامپت به‌ازای گروه است که توسط `channels.whatsapp.groups` استفاده می‌شود:

    1. **system prompt اختصاصی گروه** (`groups["<chat_id>"].systemPrompt`): وقتی ورودی گروه مشخص در map وجود دارد **و** کلید `systemPrompt` آن تعریف شده باشد استفاده می‌شود. اگر `systemPrompt` رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ system promptی برای آن گروه اعمال نمی‌شود.
    2. **system prompt wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص کاملاً در map غایب باشد، یا وقتی وجود دارد اما هیچ کلید `systemPrompt`ی تعریف نمی‌کند، استفاده می‌شود.

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

    پرامپت‌های به‌ازای گروه فقط روی پیام‌های گروه اعمال می‌شوند — پیام‌های مستقیم در این کانال تحت‌تأثیر قرار نمی‌گیرند.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMها از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروه استفاده می‌کنند.
    - با `session.dmScope=main` پیش‌فرض، DMهای iMessage در session اصلی agent ادغام می‌شوند.
    - sessionهای گروه ایزوله هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از metadata کانال/هدف مبدأ، به iMessage برگردانده می‌شوند.

    رفتار thread شبیه گروه:

    بعضی threadهای چندشرکت‌کننده iMessage ممکن است با `is_group=false` وارد شوند.
    اگر آن `chat_id` به‌صورت explicit زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را به‌عنوان ترافیک گروه در نظر می‌گیرد (گیتینگ گروه + ایزوله‌سازی session گروه).

  </Tab>
</Tabs>

## bindingهای گفت‌وگوی ACP

chatهای legacy iMessage همچنین می‌توانند به sessionهای ACP bind شوند.

جریان سریع operator:

- داخل DM یا chat گروه مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های آینده در همان گفت‌وگوی iMessage به session ایجادشده ACP مسیریابی می‌شوند.
- `/new` و `/reset` همان session bind‌شده ACP را درجا reset می‌کنند.
- `/acp close` session ACP را می‌بندد و binding را حذف می‌کند.

bindingهای پایدار پیکربندی‌شده از طریق ورودی‌های سطح‌بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از این موارد استفاده کند:

- handle نرمال‌شده DM مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (برای bindingهای پایدار گروه توصیه می‌شود)
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

برای رفتار binding مشترک ACP، [ACP Agents](/fa/tools/acp-agents) را ببینید.

## الگوهای deployment

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک بات از profile شخصی Messages شما ایزوله شود.

    جریان معمول:

    1. یک کاربر اختصاصی macOS ایجاد کنید/وارد شوید.
    2. در آن کاربر با Apple ID بات وارد Messages شوید.
    3. `imsg` را در آن کاربر نصب کنید.
    4. wrapper مربوط به SSH را ایجاد کنید تا OpenClaw بتواند `imsg` را در context آن کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به profile آن کاربر اشاره دهید.

    اجرای اول ممکن است در session آن کاربر بات به تأییدهای GUI نیاز داشته باشد (Automation + Full Disk Access).

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    توپولوژی رایج:

    - gateway روی Linux/VM اجرا می‌شود
    - iMessage + `imsg` روی یک Mac در tailnet شما اجرا می‌شود
    - wrapper مربوط به `cliPath` از SSH برای اجرای `imsg` استفاده می‌کند
    - `remoteHost` دریافت attachmentها با SCP را فعال می‌کند

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
    ابتدا مطمئن شوید host key مورد اعتماد است (برای مثال `ssh bot@mac-mini.tailnet-1234.ts.net`) تا `known_hosts` پر شود.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage از config به‌ازای هر حساب زیر `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات history و allowlistهای ریشه attachment را override کند.

  </Accordion>

  <Accordion title="Direct-message history">
    `channels.imessage.dmHistoryLimit` را تنظیم کنید تا sessionهای جدید پیام مستقیم با history اخیر و decodeشده `imsg` برای آن گفت‌وگو seed شوند. برای overrideهای به‌ازای فرستنده، از جمله `0` برای غیرفعال کردن history برای یک فرستنده، از `channels.imessage.dms["<sender>"].historyLimit` استفاده کنید.

    history مربوط به DMهای iMessage در صورت نیاز از `imsg` دریافت می‌شود. تنظیم‌نکردن `dmHistoryLimit`، seeding سراسری history مربوط به DM را غیرفعال می‌کند، اما مقدار مثبت به‌ازای فرستنده در `channels.imessage.dms["<sender>"].historyLimit` همچنان seeding را برای آن فرستنده فعال می‌کند.

  </Accordion>
</AccordionGroup>

## رسانه، chunking و هدف‌های delivery

<AccordionGroup>
  <Accordion title="پیوست‌ها و رسانه">
    - دریافت پیوست‌های ورودی **به‌طور پیش‌فرض خاموش است** — برای فرستادن عکس‌ها، یادداشت‌های صوتی، ویدیو و سایر پیوست‌ها به عامل، `channels.imessage.includeAttachments: true` را تنظیم کنید. وقتی غیرفعال باشد، iMessageهای فقط‌پیوست پیش از رسیدن به عامل کنار گذاشته می‌شوند و ممکن است اصلاً هیچ خط گزارش `Inbound message` تولید نکنند.
    - مسیرهای پیوست راه‌دور وقتی `remoteHost` تنظیم شده باشد می‌توانند از طریق SCP دریافت شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشه پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازه رسانه خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض 16 MB)

  </Accordion>

  <Accordion title="تکه‌تکه‌سازی خروجی">
    - حد تکه متن: `channels.imessage.textChunkLimit` (پیش‌فرض 4000)
    - حالت تکه‌سازی: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم‌بندی با اولویت پاراگراف)

  </Accordion>

  <Accordion title="قالب‌های آدرس‌دهی">
    مقصدهای صریح ترجیحی:

    - `chat_id:123` (برای مسیریابی پایدار توصیه می‌شود)
    - `chat_guid:...`
    - `chat_identifier:...`

    مقصدهای مبتنی بر شناسه کاربر نیز پشتیبانی می‌شوند:

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
    - **react**: افزودن/حذف tapbackهای iMessage (`messageId`, `emoji`, `remove`). tapbackهای پشتیبانی‌شده به love، like، dislike، laugh، emphasize و question نگاشت می‌شوند.
    - **reply**: ارسال پاسخ رشته‌ای به یک پیام موجود (`messageId`, `text` یا `message`، به‌همراه `chatGuid`, `chatId`, `chatIdentifier` یا `to`).
    - **sendWithEffect**: ارسال متن با یک جلوه iMessage (`text` یا `message`، `effect` یا `effectId`).
    - **edit**: ویرایش یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شده macOS/API خصوصی (`messageId`, `text` یا `newText`).
    - **unsend**: پس‌گرفتن یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شده macOS/API خصوصی (`messageId`).
    - **upload-file**: ارسال رسانه/فایل‌ها (`buffer` به‌صورت base64 یا یک `media`/`path`/`filePath` آماده‌شده، `filename`، و `asVoice` اختیاری). نام مستعار قدیمی: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: مدیریت گفت‌وگوهای گروهی وقتی مقصد فعلی یک مکالمه گروهی است.

  </Accordion>

  <Accordion title="شناسه‌های پیام">
    زمینه ورودی iMessage در صورت موجود بودن هم مقدارهای کوتاه `MessageSid` و هم GUIDهای کامل پیام را شامل می‌شود. شناسه‌های کوتاه به کش پاسخ اخیرِ پشتیبانی‌شده با SQLite محدود هستند و پیش از استفاده در برابر گفت‌وگوی فعلی بررسی می‌شوند. اگر یک شناسه کوتاه منقضی شده باشد یا به گفت‌وگوی دیگری تعلق داشته باشد، با `MessageSidFull` کامل دوباره تلاش کنید.

  </Accordion>

  <Accordion title="تشخیص قابلیت">
    OpenClaw کنش‌های API خصوصی را فقط زمانی پنهان می‌کند که وضعیت probe کش‌شده بگوید پل در دسترس نیست. اگر وضعیت نامشخص باشد، کنش‌ها همچنان قابل مشاهده می‌مانند و probeها را به‌صورت تنبل اعزام می‌کنند تا نخستین کنش پس از `imsg launch` بدون تازه‌سازی دستی جداگانه وضعیت بتواند موفق شود.

  </Accordion>

  <Accordion title="رسیدهای خواندن و تایپ">
    وقتی پل API خصوصی فعال باشد، گفت‌وگوهای ورودی پذیرفته‌شده خوانده‌شده علامت‌گذاری می‌شوند و گفت‌وگوهای مستقیم به‌محض پذیرفته‌شدن نوبت، در حالی که عامل زمینه را آماده می‌کند و خروجی تولید می‌کند، حباب تایپ نشان می‌دهند. علامت‌گذاری خواندن را با این تنظیم غیرفعال کنید:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    ساخت‌های قدیمی‌تر `imsg` که مربوط به پیش از فهرست قابلیت‌های هر روش هستند، تایپ/خواندن را بی‌صدا مسدود می‌کنند؛ OpenClaw در هر راه‌اندازی مجدد یک هشدار یک‌باره ثبت می‌کند تا نبود رسید قابل انتساب باشد.

  </Accordion>

  <Accordion title="tapbackهای ورودی">
    OpenClaw در tapbackهای iMessage مشترک می‌شود و واکنش‌های پذیرفته‌شده را به‌جای متن پیام معمول، به‌عنوان رویدادهای سیستمی مسیریابی می‌کند؛ بنابراین tapback کاربر یک چرخه پاسخ معمولی را فعال نمی‌کند.

    حالت اعلان با `channels.imessage.reactionNotifications` کنترل می‌شود:

    - `"own"` (پیش‌فرض): فقط وقتی کاربران به پیام‌های نوشته‌شده توسط ربات واکنش نشان می‌دهند اطلاع بده.
    - `"all"`: برای همه tapbackهای ورودی از فرستندگان مجاز اطلاع بده.
    - `"off"`: tapbackهای ورودی را نادیده بگیر.

    بازنویسی‌های مختص حساب از `channels.imessage.accounts.<id>.reactionNotifications` استفاده می‌کنند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید (👍 / 👎)">
    وقتی `approvals.exec.enabled` یا `approvals.plugin.enabled` مقدار true داشته باشد و درخواست به iMessage مسیریابی شود، Gateway یک درخواست تأیید را به‌صورت بومی تحویل می‌دهد و یک tapback را برای حل آن می‌پذیرد:

    - `👍` (tapback پسندیدن) → `allow-once`
    - `👎` (tapback نپسندیدن) → `deny`
    - `allow-always` به‌عنوان fallback دستی باقی می‌ماند: `/approve <id> allow-always` را به‌عنوان یک پاسخ عادی بفرستید.

    رسیدگی به واکنش مستلزم آن است که شناسه کاربرِ واکنش‌دهنده یک تأییدکننده صریح باشد. فهرست تأییدکنندگان از `channels.imessage.allowFrom` (یا `channels.imessage.accounts.<id>.allowFrom`) خوانده می‌شود؛ شماره تلفن کاربر را به شکل E.164 یا ایمیل Apple ID او را اضافه کنید. ورودی wildcard یعنی `"*"` رعایت می‌شود، اما به هر فرستنده‌ای اجازه تأیید می‌دهد. میانبر واکنش عمداً `reactionNotifications`، `dmPolicy` و `groupAllowFrom` را دور می‌زند، چون allowlist تأییدکننده صریح تنها دریچه‌ای است که برای حل تأیید اهمیت دارد.

    **تغییر رفتار در این انتشار:** وقتی `channels.imessage.allowFrom` خالی نیست، فرمان متنی `/approve <id> <decision>` اکنون در برابر همان فهرست تأییدکنندگان مجاز می‌شود (نه allowlist گسترده‌تر پیام مستقیم). فرستندگانی که در allowlist پیام مستقیم مجاز هستند اما در `allowFrom` نیستند، یک رد صریح دریافت می‌کنند. برای حفظ رفتار قبلی، هر اپراتوری را که باید بتواند از طریق `/approve` (و از طریق واکنش‌ها) تأیید کند به `allowFrom` اضافه کنید. وقتی `allowFrom` خالی است، fallback قدیمی «همان گفت‌وگو» همچنان برقرار می‌ماند و `/approve` همچنان هر کسی را که allowlist پیام مستقیم اجازه می‌دهد مجاز می‌کند.

    یادداشت‌های اپراتور:
    - اتصال واکنش هم در حافظه (با TTL منطبق با انقضای تأیید) و هم در ذخیره‌گاه کلیددار پایدار Gateway ذخیره می‌شود؛ بنابراین tapbackای که کمی پس از راه‌اندازی مجدد Gateway برسد همچنان تأیید را حل می‌کند.
    - tapbackهای بین‌دستگاهی `is_from_me=true` (واکنش خود اپراتور روی یک دستگاه Apple جفت‌شده) عمداً نادیده گرفته می‌شوند تا ربات نتواند خود را تأیید کند.
    - tapbackهای قدیمی به سبک متن (`Liked "…"` به‌صورت متن ساده از کلاینت‌های بسیار قدیمی Apple) نمی‌توانند تأییدها را حل کنند، چون GUID پیام ندارند؛ حل واکنش به فراداده ساختاریافته tapback نیاز دارد که کلاینت‌های فعلی macOS / iOS منتشر می‌کنند.

  </Accordion>
</AccordionGroup>

## نوشتن پیکربندی

iMessage به‌طور پیش‌فرض اجازه نوشتن پیکربندی آغازشده از کانال را می‌دهد (برای `/config set|unset` وقتی `commands.config: true` باشد).

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

## یکی‌سازی پیام‌های مستقیم split-send (فرمان + URL در یک ترکیب)

وقتی کاربر یک فرمان و یک URL را با هم تایپ می‌کند — برای نمونه `Dump https://example.com/article` — برنامه Messages شرکت Apple ارسال را به **دو ردیف جداگانه `chat.db`** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک حباب پیش‌نمایش URL (`"https://..."`) با تصویرهای پیش‌نمایش OG به‌عنوان پیوست.

این دو ردیف در بیشتر راه‌اندازی‌ها با فاصله حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون یکی‌سازی، عامل در نوبت 1 فقط فرمان را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست») و URL را فقط در نوبت 2 می‌بیند — در آن زمان زمینه فرمان از دست رفته است. این خط لوله ارسال Apple است، نه چیزی که OpenClaw یا `imsg` معرفی کرده باشند.

`channels.imessage.coalesceSameSenderDms` یک پیام مستقیم را به بافر کردن ردیف‌های پیاپی از همان فرستنده وارد می‌کند. وقتی `imsg` نشانگر ساختاری پیش‌نمایش URL یعنی `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` را روی یکی از ردیف‌های منبع ارائه کند، OpenClaw فقط همان split-send واقعی را ادغام می‌کند و هر ردیف بافرشده دیگر را به‌عنوان نوبت‌های جداگانه نگه می‌دارد. روی ساخت‌های قدیمی‌تر `imsg` که هیچ فراداده حبابی منتشر نمی‌کنند، OpenClaw نمی‌تواند split-send را از ارسال‌های جداگانه تشخیص دهد؛ بنابراین به ادغام bucket برمی‌گردد. این کار رفتار پیش از فراداده را حفظ می‌کند، به‌جای آنکه split-sendهای `Dump <url>` را دوباره به دو نوبت پس‌رفت دهد. گفت‌وگوهای گروهی همچنان به‌ازای هر پیام اعزام می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="زمان فعال‌سازی">
    فعال کنید وقتی:

    - Skillsای ارائه می‌کنید که انتظار `command + payload` را در یک پیام دارند (dump، paste، save، queue و غیره).
    - کاربران شما URLها را کنار فرمان‌ها جای‌گذاری می‌کنند.
    - می‌توانید تأخیر افزوده‌شده نوبت پیام مستقیم را بپذیرید (پایین را ببینید).

    غیرفعال بگذارید وقتی:

    - برای محرک‌های پیام مستقیم تک‌واژه‌ای به کمترین تأخیر فرمان نیاز دارید.
    - همه جریان‌های شما فرمان‌های یک‌مرحله‌ای بدون پیگیری payload هستند.

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

    با روشن بودن این پرچم و نبود `messages.inbound.byChannel.imessage` صریح یا `messages.inbound.debounceMs` سراسری، پنجره debounce به **7000 ms** گسترش می‌یابد (پیش‌فرض قدیمی 0 ms است — بدون debounce). این پنجره گسترده‌تر لازم است، چون آهنگ split-send پیش‌نمایش URL در Apple می‌تواند تا چند ثانیه کش بیاید، در حالی که Messages.app ردیف پیش‌نمایش را منتشر می‌کند.

    برای تنظیم دستی پنجره:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="مصالحه‌ها">
    - **ادغام دقیق به فراداده payload فعلی `imsg` نیاز دارد.** وقتی ردیف URL شامل `balloon_bundle_id` باشد، فقط همان split-send واقعی ادغام می‌شود و ردیف‌های بافرشده دیگر جدا می‌مانند. روی ساخت‌های قدیمی‌تر `imsg` که هیچ فراداده حبابی ارائه نمی‌کنند، OpenClaw به ادغام bucket بافرشده برمی‌گردد تا split-sendهای `Dump <url>` به دو نوبت پس‌رفت نکنند (سازگاری موقت با گذشته، پس از آنکه `imsg` یکی‌سازی split-sendها را upstream انجام دهد حذف می‌شود).
    - **تأخیر افزوده برای پیام‌های مستقیم.** با روشن بودن این پرچم، هر پیام مستقیم (از جمله فرمان‌های کنترلی مستقل و پیگیری‌های تک‌متنی) تا سقف پنجره debounce پیش از اعزام منتظر می‌ماند، برای حالتی که یک ردیف پیش‌نمایش URL در راه باشد. پیام‌های گفت‌وگوی گروهی اعزام فوری خود را حفظ می‌کنند.
    - **خروجی ادغام‌شده محدود است.** متن ادغام‌شده با نشانگر صریح `…[truncated]` در 4000 نویسه محدود می‌شود؛ پیوست‌ها در 20 محدود می‌شوند؛ ورودی‌های منبع در 10 محدود می‌شوند (پس از آن، اولین به‌علاوه جدیدترین نگه داشته می‌شود). هر GUID منبع در `coalescedMessageGuids` برای telemetry پایین‌دست ردیابی می‌شود.
    - **فقط پیام مستقیم.** گفت‌وگوهای گروهی به اعزام به‌ازای هر پیام عبور می‌کنند تا ربات وقتی چند نفر در حال تایپ هستند پاسخ‌گو بماند.
    - **opt-in، به‌ازای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر قرار نمی‌گیرند. پیکربندی‌های قدیمی BlueBubbles که `channels.bluebubbles.coalesceSameSenderDms` را تنظیم می‌کنند باید آن مقدار را به `channels.imessage.coalesceSameSenderDms` منتقل کنند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

ستون «پرچم روشن» رفتار را روی یک بیلد `imsg` نشان می‌دهد که `balloon_bundle_id` منتشر می‌کند. در بیلدهای قدیمی‌تر `imsg` که اصلا هیچ فرادادهٔ بالونی منتشر نمی‌کنند، ردیف‌های زیر که با «دو نوبت» / «N نوبت» مشخص شده‌اند، به‌جای آن به ادغام قدیمی برمی‌گردند (یک نوبت): OpenClaw نمی‌تواند از نظر ساختاری ارسالِ تکه‌تکه را از ارسال‌های جداگانه تشخیص دهد، بنابراین ادغام پیش از فراداده را حفظ می‌کند. جداسازی دقیق وقتی فعال می‌شود که بیلد فرادادهٔ بالونی منتشر کند.

| کاربر می‌نویسد                                                     | `chat.db` تولید می‌کند              | پرچم خاموش (پیش‌فرض)                    | پرچم روشن + پنجره (`imsg` فرادادهٔ بالونی منتشر می‌کند)                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | ۲ ردیف با فاصلهٔ حدود ۱ ثانیه       | دو نوبت عامل: فقط «Dump»، سپس URL       | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                                                  |
| `Save this 📎image.jpg caption` (پیوست + متن)                      | ۲ ردیف بدون فرادادهٔ بالونی URL     | دو نوبت                                 | پس از مشاهدهٔ فراداده دو نوبت؛ در نشست‌های قدیمی/پیش از قفل‌شدنِ بدون فراداده، یک نوبت ادغام‌شده |
| `/status` (فرمان مستقل)                                            | ۱ ردیف                              | ارسال فوری                              | **تا سقف پنجره منتظر بمان، سپس ارسال کن**                                                          |
| URL به‌تنهایی جای‌گذاری شده                                        | ۱ ردیف                              | ارسال فوری                              | تا سقف پنجره منتظر بمان، سپس ارسال کن                                                              |
| متن + URL به‌صورت دو پیام جداگانهٔ عمدی، با فاصلهٔ چند دقیقه       | ۲ ردیف خارج از پنجره                | دو نوبت                                 | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                                             |
| سیل سریع (>۱۰ پیام مستقیم کوچک داخل پنجره)                         | N ردیف بدون فرادادهٔ بالونی URL     | N نوبت                                  | پس از مشاهدهٔ فراداده N نوبت؛ در نشست‌های قدیمی/پیش از قفل‌شدنِ بدون فراداده، یک نوبت ادغام‌شدهٔ محدود |
| دو نفر در یک گفت‌وگوی گروهی در حال تایپ                             | N ردیف از M فرستنده                 | M+ نوبت (یکی برای هر سطل فرستنده)       | M+ نوبت — گفت‌وگوهای گروهی هم‌ادغام نمی‌شوند                                                       |

## بازیابی ورودی پس از راه‌اندازی دوبارهٔ پل یا Gateway

iMessage پیام‌هایی را که هنگام خاموش بودن Gateway از دست رفته‌اند بازیابی می‌کند و هم‌زمان «بمب صف عقب‌مانده» قدیمی‌ای را که Apple می‌تواند پس از بازیابی Push تخلیه کند سرکوب می‌کند. رفتار پیش‌فرض همیشه روشن است و بر پایهٔ حذف تکراری ورودی ساخته شده است.

- **حذف تکراری بازپخش.** هر پیام ورودیِ ارسال‌شده با GUID مربوط به Apple آن در وضعیت پایدار Plugin (`imessage.inbound-dedupe`) ثبت می‌شود، هنگام دریافت claim می‌شود و پس از پردازش commit می‌شود (در خطای گذرا آزاد می‌شود تا بتواند دوباره تلاش کند). هر چیزی که قبلا پردازش شده باشد، به‌جای ارسال دوباره حذف می‌شود. همین اجازه می‌دهد بازیابی بدون حسابداری جداگانه برای هر پیام، بازپخش تهاجمی انجام دهد.
- **بازیابی زمان خاموشی.** هنگام راه‌اندازی، مانیتور آخرین rowid ارسال‌شدهٔ `chat.db` را به خاطر می‌سپارد (یک مکان‌نمای پایدار برای هر حساب) و آن را به‌عنوان `since_rowid` به `imsg watch.subscribe` می‌دهد، تا imsg ردیف‌هایی را که هنگام خاموش بودن Gateway رسیده‌اند بازپخش کند و سپس دنبالهٔ زنده را دنبال کند. بازپخش به جدیدترین ردیف‌ها و به پیام‌های حداکثر حدود ۲ ساعت گذشته محدود است، و حذف تکراری هر چیزی را که قبلا پردازش شده باشد حذف می‌کند.
- **حصار سنِ صف عقب‌ماندهٔ قدیمی.** ردیف‌های بالاتر از مرز راه‌اندازی واقعا زنده‌اند؛ ردیفی که تاریخ ارسالش بیش از حدود ۱۵ دقیقه از زمان رسیدنش قدیمی‌تر باشد، صف عقب‌ماندهٔ تخلیهٔ Push است و سرکوب می‌شود. ردیف‌های بازپخش‌شده (در مرز یا پایین‌تر از آن) به‌جای آن از پنجرهٔ بازیابی وسیع‌تر استفاده می‌کنند، بنابراین پیام تازه ازدست‌رفته تحویل داده می‌شود اما تاریخچهٔ بسیار قدیمی نه.

بازیابی هم روی تنظیمات محلی و هم روی تنظیمات راه‌دور `cliPath` کار می‌کند، چون بازپخش `since_rowid` از همان اتصال RPC مربوط به `imsg` عبور می‌کند. تفاوت در پنجره است: وقتی Gateway بتواند `chat.db` را بخواند (محلی)، مرز rowid راه‌اندازی را لنگر می‌کند، گسترهٔ بازپخش را محدود می‌کند و پیام‌های ازدست‌رفته تا چند ساعت گذشته را تحویل می‌دهد. روی یک `cliPath` راه‌دور SSH نمی‌تواند پایگاه داده را بخواند، بنابراین بازپخش بدون سقف است و هر ردیف از حصار سنِ زنده استفاده می‌کند — همچنان پیام‌های تازه ازدست‌رفته را بازیابی می‌کند و همچنان صف عقب‌ماندهٔ قدیمی را سرکوب می‌کند، فقط با پنجرهٔ زندهٔ محدودتر. برای پنجرهٔ بازیابی وسیع‌تر، Gateway را روی Mac مربوط به Messages اجرا کنید.

### سیگنال قابل مشاهده برای اپراتور

صف عقب‌ماندهٔ سرکوب‌شده در سطح پیش‌فرض log می‌شود و هرگز بی‌صدا حذف نمی‌شود (پرچم `recovery` نشان می‌دهد کدام پنجره اعمال شده است):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### مهاجرت

`channels.imessage.catchup.*` منسوخ شده است — بازیابی زمان خاموشی اکنون خودکار است و برای تنظیمات جدید به هیچ پیکربندی نیاز ندارد. پیکربندی‌های موجود با `catchup.enabled: true` همچنان به‌عنوان نمایهٔ سازگاری برای پنجرهٔ بازپخش بازیابی رعایت می‌شوند. بلوک‌های catchup غیرفعال (`enabled: false` یا بدون `enabled: true`) بازنشسته شده‌اند؛ `openclaw doctor --fix` آن‌ها را حذف می‌کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    باینری و پشتیبانی RPC را اعتبارسنجی کنید:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    اگر probe گزارش داد RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید. اگر کنش‌های API خصوصی در دسترس نیستند، `imsg launch` را در نشست کاربر واردشدهٔ macOS اجرا کنید و دوباره probe بگیرید. اگر Gateway روی macOS اجرا نمی‌شود، به‌جای مسیر محلی پیش‌فرض `imsg`، از تنظیم راه‌دور Mac روی SSH در بالا استفاده کنید.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    ابتدا ثابت کنید که آیا پیام به Mac محلی رسیده است یا نه. اگر `chat.db` تغییر نکند، OpenClaw حتی وقتی `imsg status --json` یک پل سالم گزارش می‌دهد هم نمی‌تواند پیام را دریافت کند.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    اگر پیام‌های ارسال‌شده از تلفن هیچ ردیف جدیدی ایجاد نمی‌کنند، پیش از تغییر پیکربندی OpenClaw، لایهٔ macOS Messages و Apple Push را تعمیر کنید. یک نوسازی یک‌بارهٔ سرویس اغلب کافی است:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    یک iMessage تازه از تلفن بفرستید و پیش از عیب‌یابی نشست‌های OpenClaw، وجود یک ردیف جدید `chat.db` یا رویداد `imsg watch` را تأیید کنید. این کار را به‌صورت حلقهٔ دوره‌ایِ راه‌اندازی دوبارهٔ پل اجرا نکنید؛ اجرای مکرر `imsg launch` همراه با راه‌اندازی دوبارهٔ Gateway در حین کار فعال می‌تواند تحویل‌ها را قطع کند و اجرای کانال‌های در جریان را معلق بگذارد.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    مقدار پیش‌فرض `cliPath: "imsg"` باید روی Mac واردشده به Messages اجرا شود. روی Linux یا Windows، `channels.imessage.cliPath` را روی یک اسکریپت پوششی تنظیم کنید که با SSH به آن Mac وصل می‌شود و `imsg "$@"` را اجرا می‌کند.

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
    - تأییدهای جفت‌سازی (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    بررسی کنید:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - رفتار فهرست مجاز `channels.imessage.groups`
    - پیکربندی الگوی اشاره (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان Gateway
    - وجود کلید میزبان در `~/.ssh/known_hosts` روی میزبان Gateway
    - خواندنی بودن مسیر راه‌دور روی Mac اجراکنندهٔ Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    در یک ترمینال GUI تعاملی در همان زمینهٔ کاربر/نشست دوباره اجرا کنید و درخواست‌ها را تأیید کنید:

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
- [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) — اعلامیه و خلاصهٔ مهاجرت
- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) — جدول ترجمهٔ پیکربندی و انتقال گام‌به‌گام
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
