---
read_when:
    - راه‌اندازی پشتیبانی iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی iMessage از طریق imsg‏ (JSON-RPC روی stdio)، با کنش‌های API خصوصی برای پاسخ‌ها، tapbackها، جلوه‌ها، نظرسنجی‌ها، پیوست‌ها و مدیریت گروه. برای راه‌اندازی‌های جدید iMessage در OpenClaw، زمانی که الزامات میزبان سازگار باشند، گزینهٔ ترجیحی است.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:10:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرارهای iMessage در OpenClaw، روی میزبان macOS Messages که وارد حساب شده است از `imsg` استفاده کنید. اگر Gateway شما روی Linux یا Windows اجرا می‌شود، `channels.imessage.cliPath` را به یک wrapper مبتنی بر SSH اشاره دهید که `imsg` را روی Mac اجرا می‌کند.

**بازیابی ورودی خودکار است.** پس از راه‌اندازی دوباره bridge یا Gateway، iMessage پیام‌هایی را که در زمان خاموش بودن از دست رفته‌اند بازپخش می‌کند و «backlog bomb» قدیمی‌ای را که Apple می‌تواند پس از بازیابی Push تخلیه کند سرکوب می‌کند، با حذف موارد تکراری تا هیچ چیزی دوبار dispatch نشود. هیچ پیکربندی‌ای برای فعال‌سازی وجود ندارد — [بازیابی ورودی پس از راه‌اندازی دوباره bridge یا Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart) را ببینید.
</Note>

<Warning>
پشتیبانی BlueBubbles حذف شده است. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` مهاجرت دهید؛ OpenClaw از iMessage فقط از طریق `imsg` پشتیبانی می‌کند. برای اعلامیه کوتاه از [حذف BlueBubbles و مسیر iMessage مبتنی بر imsg](/fa/announcements/bluebubbles-imessage) شروع کنید، یا برای جدول کامل مهاجرت [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) را ببینید.
</Warning>

وضعیت: یکپارچه‌سازی بومی CLI خارجی. Gateway، `imsg rpc` را اجرا می‌کند و از طریق JSON-RPC روی stdio ارتباط برقرار می‌کند (بدون daemon/port جداگانه). کنش‌های پیشرفته به `imsg launch` و یک probe موفق API خصوصی نیاز دارند.

<CardGroup cols={3}>
  <Card title="کنش‌های API خصوصی" icon="wand-sparkles" href="#private-api-actions">
    پاسخ‌ها، tapbackها، افکت‌ها، نظرسنجی‌ها، پیوست‌ها، و مدیریت گروه.
  </Card>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های خصوصی iMessage به‌طور پیش‌فرض از حالت pairing استفاده می‌کنند.
  </Card>
  <Card title="Mac راه دور" icon="terminal" href="#remote-mac-over-ssh">
    وقتی Gateway روی Mac میزبان Messages اجرا نمی‌شود، از یک wrapper مبتنی بر SSH استفاده کنید.
  </Card>
  <Card title="مرجع پیکربندی" icon="settings" href="/fa/gateway/config-channels#imessage">
    مرجع کامل فیلدهای iMessage.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Mac محلی (مسیر سریع)">
    <Steps>
      <Step title="نصب و تأیید imsg">

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

      <Step title="راه‌اندازی Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="تأیید اولین pairing پیام خصوصی (dmPolicy پیش‌فرض)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        درخواست‌های pairing پس از ۱ ساعت منقضی می‌شوند.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac راه دور از طریق SSH">
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

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند با parse کردن اسکریپت wrapper مبتنی بر SSH آن را به‌صورت خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانه host-key استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

<Warning>
هر wrapper در `cliPath` یا proxy مبتنی بر SSH که جلوی `imsg` می‌گذارید باید برای JSON-RPC طولانی‌مدت مانند یک pipe شفاف stdio رفتار کند. OpenClaw در طول عمر channel، پیام‌های کوچک JSON-RPC قاب‌بندی‌شده با newline را از طریق stdin/stdout wrapper مبادله می‌کند:

- هر قطعه/خط stdin را **به‌محض در دسترس بودن byteها** forward کنید — منتظر EOF نمانید.
- هر قطعه/خط stdout را بی‌درنگ در جهت معکوس forward کنید.
- newlineها را حفظ کنید.
- از خواندن‌های blocking با اندازه ثابت (`read(4096)`, `cat | buffer`, پیش‌فرض shell `read`) که می‌توانند frameهای کوچک را محروم کنند خودداری کنید.
- stderr را از stream مربوط به stdout در JSON-RPC جدا نگه دارید.

wrapperای که stdin را تا پر شدن یک block بزرگ buffer کند، علائمی ایجاد می‌کند که شبیه قطعی iMessage به نظر می‌رسند — `imsg rpc timeout (chats.list)` یا راه‌اندازی‌های دوباره مکرر channel — حتی اگر خود `imsg rpc` سالم باشد. `ssh -T host imsg "$@"` (بالا) امن است، چون آرگومان‌های `cliPath` در OpenClaw مانند `rpc` و `--db` را forward می‌کند. Pipelineهایی مثل `ssh host imsg | grep -v '^DEBUG'` امن نیستند — ابزارهای line-buffered همچنان می‌توانند frameها را نگه دارند؛ اگر ناچار به filter کردن هستید، روی همه stageها از `stdbuf -oL -eL` استفاده کنید.
</Warning>

  </Tab>
</Tabs>

## نیازمندی‌ها و مجوزها (macOS)

- Messages باید روی Macی که `imsg` را اجرا می‌کند وارد حساب شده باشد.
- برای process contextی که OpenClaw/`imsg` را اجرا می‌کند، Full Disk Access لازم است (دسترسی به DB پیام‌ها).
- برای ارسال پیام از طریق Messages.app، مجوز Automation لازم است.
- برای کنش‌های پیشرفته (react / edit / unsend / threaded reply / effects / polls / group ops)، System Integrity Protection باید غیرفعال باشد — بخش [فعال‌سازی API خصوصی imsg](#enabling-the-imsg-private-api) را در پایین ببینید. ارسال/دریافت متن و رسانه پایه بدون آن کار می‌کند.

<Tip>
مجوزها به‌ازای هر process context داده می‌شوند. اگر Gateway بدون محیط گرافیکی اجرا می‌شود (LaunchAgent/SSH)، برای فعال شدن promptها یک دستور تعاملی یک‌باره را در همان context اجرا کنید:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="ارسال‌های wrapper مبتنی بر SSH با AppleEvents -1743 شکست می‌خورند">
  یک راه‌اندازی remote-SSH می‌تواند chatها را بخواند، `channels status --probe` را پاس کند، و پیام‌های ورودی را پردازش کند، در حالی که ارسال‌های خروجی همچنان با خطای مجوز AppleEvents شکست می‌خورند:

```text
Not authorized to send Apple events to Messages. (-1743)
```

پایگاه داده TCC کاربر واردشده در Mac یا System Settings > Privacy & Security > Automation را بررسی کنید. اگر ورودی Automation برای `/usr/libexec/sshd-keygen-wrapper` به‌جای فرایند `imsg` یا shell محلی ثبت شده باشد، macOS ممکن است toggle قابل استفاده Messages را برای آن client سمت‌سرور SSH نمایش ندهد:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

در این وضعیت، تکرار `tccutil reset AppleEvents` یا اجرای دوباره `imsg send` از طریق همان wrapper مبتنی بر SSH ممکن است همچنان شکست بخورد، چون process contextی که به Automation مربوط به Messages نیاز دارد wrapper مبتنی بر SSH است، نه برنامه‌ای که UI بتواند به آن مجوز بدهد.

به‌جای آن از یکی از process contextهای پشتیبانی‌شده `imsg` استفاده کنید:

- Gateway، یا دست‌کم bridge مربوط به `imsg`، را در نشست محلی کاربر واردشده در Messages اجرا کنید.
- Gateway را پس از دادن Full Disk Access و Automation از همان نشست، با یک LaunchAgent برای همان کاربر شروع کنید.
- اگر topology مبتنی بر SSH دوکاربره را نگه می‌دارید، پیش از فعال کردن channel تأیید کنید که یک `imsg send` خروجی واقعی از طریق همان wrapper دقیق موفق می‌شود. اگر امکان دادن Automation وجود ندارد، به‌جای تکیه بر wrapper مبتنی بر SSH برای ارسال‌ها، به یک راه‌اندازی `imsg` تک‌کاربره بازپیکربندی کنید.

</Accordion>

## فعال‌سازی API خصوصی imsg

`imsg` در دو حالت عملیاتی عرضه می‌شود:

- **حالت پایه** (پیش‌فرض، بدون نیاز به تغییرات SIP): متن و رسانه خروجی از طریق `send`، watch/history ورودی، فهرست chat. این همان چیزی است که با یک `brew install steipete/tap/imsg` تازه به‌همراه مجوزهای استاندارد macOS در بالا به‌صورت آماده دریافت می‌کنید.
- **حالت API خصوصی**: `imsg` یک helper dylib را به `Messages.app` inject می‌کند تا توابع داخلی `IMCore` را فراخوانی کند. این همان چیزی است که `react`، `edit`، `unsend`، `reply` (threaded)، `sendWithEffect`، `poll` و `poll-vote` (نظرسنجی‌های بومی Messages)، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، به‌همراه indicators مربوط به typing و read receipts را فعال می‌کند.

برای رسیدن به سطح کنش‌های پیشرفته‌ای که این صفحه channel مستند می‌کند، به حالت API خصوصی نیاز دارید. README مربوط به `imsg` درباره این نیازمندی صریح است:

> قابلیت‌های پیشرفته‌ای مانند `read`، `typing`، `launch`، ارسال غنی پشتیبانی‌شده با bridge، تغییر پیام، و مدیریت chat اختیاری هستند. آن‌ها نیاز دارند SIP غیرفعال باشد و یک helper dylib به `Messages.app` inject شود. `imsg launch` وقتی SIP فعال باشد از inject کردن خودداری می‌کند.

تکنیک helper-injection از dylib خود `imsg` برای دسترسی به APIهای خصوصی Messages استفاده می‌کند. در مسیر iMessage در OpenClaw هیچ سرور شخص ثالث یا runtime مربوط به BlueBubbles وجود ندارد.

<Warning>
**غیرفعال کردن SIP یک مصالحه امنیتی واقعی است.** SIP یکی از محافظت‌های اصلی macOS در برابر اجرای کد سیستمی تغییر‌یافته است؛ خاموش کردن آن در سطح سیستم سطح حمله و اثرات جانبی بیشتری ایجاد می‌کند. به‌طور خاص، **غیرفعال کردن SIP روی Macهای Apple Silicon همچنین امکان نصب و اجرای برنامه‌های iOS روی Mac شما را غیرفعال می‌کند**.

با این موضوع به‌عنوان یک انتخاب عملیاتی آگاهانه رفتار کنید، نه یک پیش‌فرض. اگر مدل تهدید شما نمی‌تواند خاموش بودن SIP را تحمل کند، iMessage bundled به حالت پایه محدود می‌شود — فقط ارسال/دریافت متن و رسانه، بدون واکنش‌ها / ویرایش / لغو ارسال / افکت‌ها / عملیات گروه.
</Warning>

### راه‌اندازی

1. **`imsg` را نصب (یا upgrade) کنید** روی Macی که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   خروجی `imsg status --json`، `bridge_version`، `rpc_methods`، و `selectors` به‌ازای هر method را گزارش می‌کند تا پیش از شروع ببینید build فعلی از چه چیزهایی پشتیبانی می‌کند.

2. **System Integrity Protection و (در macOSهای مدرن) Library Validation را غیرفعال کنید.** inject کردن یک helper dylib غیر Apple به `Messages.app` امضاشده توسط Apple نیاز دارد SIP خاموش باشد **و** library validation relaxed شود. مرحله SIP در حالت Recovery مخصوص نسخه macOS است:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Library Validation را از طریق Terminal غیرفعال کنید، به Recovery Mode راه‌اندازی مجدد کنید، `csrutil disable` را اجرا کنید، restart کنید.
   - **macOS 11+ (Big Sur و بعدتر)، Intel:** Recovery Mode (یا Internet Recovery)، `csrutil disable`، restart.
   - **macOS 11+، Apple Silicon:** دنباله startup با دکمه power برای ورود به Recovery؛ در نسخه‌های اخیر macOS وقتی Continue را کلیک می‌کنید کلید **Left Shift** را نگه دارید، سپس `csrutil disable`. راه‌اندازی‌های ماشین مجازی flow جداگانه‌ای دارند، پس ابتدا یک snapshot از VM بگیرید.

   **در macOS 11 و بعدتر، معمولاً `csrutil disable` به‌تنهایی کافی نیست.** Apple همچنان library validation را در برابر `Messages.app` به‌عنوان یک platform binary اعمال می‌کند، بنابراین یک helper با امضای adhoc رد می‌شود (`Library Validation failed: ... platform binary, but mapped file is not`) حتی وقتی SIP خاموش است. پس از غیرفعال کردن SIP، library validation را نیز غیرفعال کنید و reboot کنید:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)، تأییدشده روی 26.5.1:** خاموش بودن SIP **به‌علاوه** دستور `DisableLibraryValidation` در بالا برای inject کردن helper در سراسر 26.0 تا 26.5.x کافی است. **هیچ boot-args لازم نیست.** plist عامل تعیین‌کننده و رایج‌ترین مرحله جاافتاده هنگام شکست injection روی Tahoe است:
   - **با plist:** `imsg launch` inject می‌کند و `imsg status`، `advanced_features: true` را گزارش می‌کند.
   - **بدون plist (حتی با SIP خاموش):** `imsg launch` با `Failed to launch: Timeout waiting for Messages.app to initialize` شکست می‌خورد. AMFI، helper با امضای adhoc را هنگام load رد می‌کند، بنابراین bridge هرگز آماده نمی‌شود و launch timeout می‌شود. این timeout همان علامتی است که بیشتر افراد روی Tahoe با آن روبه‌رو می‌شوند، و راه‌حل plist بالاست، نه اقدام شدیدتر.

   این موضوع با یک قبل/بعد کنترل‌شده روی macOS 26.5.1 (Apple Silicon) تأیید شد: با plist، dylib در `Messages.app` map می‌شود و bridge بالا می‌آید؛ plist را حذف کنید و reboot کنید، و `imsg launch` خطای timeout بالا را با map نشدن dylib تولید می‌کند.

   اگر تزریق `imsg launch` یا `selectors` خاص پس از ارتقای macOS شروع به برگرداندن false کنند، این دروازه معمولا علت معمول است. پیش از این‌که فرض کنید خود مرحله SIP شکست خورده است، وضعیت SIP و اعتبارسنجی کتابخانه را بررسی کنید. اگر آن تنظیمات درست هستند و bridge همچنان نمی‌تواند تزریق کند، خروجی `imsg status --json` به‌همراه خروجی `imsg launch` را جمع‌آوری کنید و به‌جای تضعیف کنترل‌های امنیتی بیشتر در سطح کل سیستم، آن را به پروژه `imsg` گزارش دهید.

   پیش از اجرای `imsg launch`، جریان Recovery-mode اپل را برای Mac خود دنبال کنید تا SIP را غیرفعال کنید.

3. **helper را تزریق کنید.** با SIP غیرفعال و Messages.app واردشده:

   ```bash
   imsg launch
   ```

   وقتی SIP هنوز فعال باشد، `imsg launch` از تزریق خودداری می‌کند؛ بنابراین این کار همچنین تأیید می‌کند که مرحله ۲ اعمال شده است.

4. **bridge را از OpenClaw بررسی کنید:**

   ```bash
   openclaw channels status --probe
   ```

   ورودی iMessage باید `works` گزارش کند، و `imsg status --json | jq '{rpc_methods, selectors}'` باید قابلیت‌هایی را نشان دهد که build مربوط به macOS شما در معرض می‌گذارد. ایجاد نظرسنجی به `selectors.pollPayloadMessage` نیاز دارد؛ رأی‌دادن هم به `selectors.pollVoteMessage` و هم به روش RPC با نام `poll.vote` نیاز دارد. Plugin مربوط به OpenClaw فقط اقداماتی را تبلیغ می‌کند که توسط probe کش‌شده پشتیبانی می‌شوند، درحالی‌که کش خالی خوش‌بین باقی می‌ماند و هنگام نخستین dispatch، probe می‌کند.

اگر `openclaw channels status --probe` کانال را به‌صورت `works` گزارش می‌کند اما اقدامات خاص هنگام dispatch خطای "iMessage `<action>` requires the imsg private API bridge" می‌دهند، دوباره `imsg launch` را اجرا کنید — helper ممکن است خارج شود (راه‌اندازی مجدد Messages.app، به‌روزرسانی OS و غیره) و وضعیت کش‌شده `available: true` تا زمانی که probe بعدی تازه‌سازی شود، همچنان اقدامات را تبلیغ خواهد کرد.

### وقتی نمی‌توانید SIP را غیرفعال کنید

اگر SIP-disabled برای مدل تهدید شما پذیرفتنی نیست:

- `imsg` به حالت پایه برمی‌گردد — فقط متن + رسانه + دریافت.
- Plugin مربوط به OpenClaw همچنان ارسال متن/رسانه و پایش ورودی را تبلیغ می‌کند؛ فقط `react`، `edit`، `unsend`، `reply`، `sendWithEffect` و عملیات گروهی را از سطح اقدام پنهان می‌کند (بر اساس دروازه قابلیت هر روش).
- می‌توانید یک Mac جداگانه غیر Apple-Silicon (یا یک Mac اختصاصی bot) را با SIP خاموش برای بار کاری iMessage اجرا کنید، درحالی‌که SIP را روی دستگاه‌های اصلی خود فعال نگه می‌دارید. پایین‌تر [کاربر اختصاصی bot در macOS (هویت جداگانه iMessage)](#deployment-patterns) را ببینید.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند آن است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist باید فرستندگان را مشخص کنند: handleها یا گروه‌های دسترسی فرستنده ایستا (`accessGroup:<name>`). برای هدف‌های گفت‌وگو مانند `chat_id:*`، `chat_guid:*` یا `chat_identifier:*` از `channels.imessage.groupAllowFrom` استفاده کنید؛ برای کلیدهای رجیستری عددی `chat_id` از `channels.imessage.groups` استفاده کنید.

  </Tab>

  <Tab title="سیاست گروه + mentionها">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض وقتی پیکربندی شده باشد)
    - `open`
    - `disabled`

    allowlist فرستنده گروه: `channels.imessage.groupAllowFrom`.

    ورودی‌های `groupAllowFrom` همچنین می‌توانند به گروه‌های دسترسی فرستنده ایستا (`accessGroup:<name>`) ارجاع دهند.

    fallback زمان اجرا: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستنده گروه iMessage از `allowFrom` استفاده می‌کنند؛ وقتی پذیرش DM و گروه باید متفاوت باشد، `groupAllowFrom` را تنظیم کنید.
    نکته زمان اجرا: اگر `channels.imessage` کاملا وجود نداشته باشد، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    <Warning>
    مسیریابی گروه **دو** دروازه allowlist دارد که پشت‌سرهم اجرا می‌شوند، و هر دو باید عبور کنند:

    1. **allowlist فرستنده / هدف گفت‌وگو** (`channels.imessage.groupAllowFrom`) — handle، `chat_guid`، `chat_identifier` یا `chat_id`.
    2. **رجیستری گروه** (`channels.imessage.groups`) — با `groupPolicy: "allowlist"`، این دروازه یا به ورودی wildcard به‌صورت `groups: { "*": { ... } }` نیاز دارد (که `allowAll = true` را تنظیم می‌کند)، یا به یک ورودی صریح برای هر `chat_id` زیر `groups`.

    اگر دروازه ۲ هیچ چیزی نداشته باشد، هر پیام گروهی حذف می‌شود. Plugin در سطح گزارش‌گیری پیش‌فرض دو سیگنال در سطح `warn` منتشر می‌کند:

    - یک‌بار برای هر حساب هنگام startup: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - یک‌بار برای هر `chat_id` هنگام runtime: `imessage: dropping group message from chat_id=<id> ...`

    DMها به کار ادامه می‌دهند، چون مسیر کد متفاوتی را طی می‌کنند.

    حداقل پیکربندی برای جاری نگه‌داشتن گروه‌ها زیر `groupPolicy: "allowlist"`:

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

    اگر آن خط‌های `warn` در گزارش gateway ظاهر شوند، دروازه ۲ در حال حذف است — بلوک `groups` را اضافه کنید.
    </Warning>

    دروازه mention برای گروه‌ها:

    - iMessage هیچ فراداده mention بومی ندارد
    - تشخیص mention از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، دروازه mention قابل اعمال نیست

    فرمان‌های کنترل از فرستندگان مجاز می‌توانند در گروه‌ها دروازه mention را دور بزنند.

    `systemPrompt` برای هر گروه:

    هر ورودی زیر `channels.imessage.groups.*` یک رشته اختیاری `systemPrompt` می‌پذیرد. مقدار در هر turn که پیامی را در آن گروه مدیریت می‌کند، به prompt سیستمی عامل تزریق می‌شود. resolve کردن، مشابه resolve کردن prompt برای هر گروه است که توسط `channels.whatsapp.groups` استفاده می‌شود:

    1. **prompt سیستمی مخصوص گروه** (`groups["<chat_id>"].systemPrompt`): وقتی ورودی گروه مشخص در map وجود دارد **و** کلید `systemPrompt` آن تعریف شده است، استفاده می‌شود. اگر `systemPrompt` یک رشته خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ prompt سیستمی روی آن گروه اعمال نمی‌شود.
    2. **prompt سیستمی wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص به‌کلی از map غایب است، یا وقتی وجود دارد اما هیچ کلید `systemPrompt` تعریف نمی‌کند، استفاده می‌شود.

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

    promptهای هر گروه فقط روی پیام‌های گروهی اعمال می‌شوند — پیام‌های مستقیم در این کانال تحت تأثیر قرار نمی‌گیرند.

  </Tab>

  <Tab title="نشست‌ها و پاسخ‌های قطعی">
    - DMها از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروه استفاده می‌کنند.
    - با `session.dmScope=main` پیش‌فرض، DMهای iMessage در نشست اصلی عامل ادغام می‌شوند.
    - نشست‌های گروه جدا هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فراداده کانال/هدف مبدأ، دوباره به iMessage مسیریابی می‌شوند.

    رفتار thread شبه‌گروهی:

    برخی threadهای iMessage با چند شرکت‌کننده می‌توانند با `is_group=false` برسند.
    اگر آن `chat_id` صراحتا زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw با آن به‌عنوان ترافیک گروهی رفتار می‌کند (دروازه گروه + جداسازی نشست گروه).

  </Tab>
</Tabs>

## اتصال‌های گفت‌وگوی ACP

گفت‌وگوهای قدیمی iMessage نیز می‌توانند به نشست‌های ACP متصل شوند.

جریان سریع operator:

- `/acp spawn codex --bind here` را داخل DM یا گفت‌وگوی گروهی مجاز اجرا کنید.
- پیام‌های آینده در همان گفت‌وگوی iMessage به نشست ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان نشست ACP متصل را درجا reset می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از این‌ها استفاده کند:

- handle عادی‌سازی‌شده DM مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (پیشنهادی برای اتصال‌های گروهی پایدار)
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
  <Accordion title="کاربر اختصاصی bot در macOS (هویت جداگانه iMessage)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک bot از پروفایل شخصی Messages شما جدا بماند.

    جریان معمول:

    1. یک کاربر macOS اختصاصی بسازید/وارد آن شوید.
    2. با Apple ID مربوط به bot در Messages همان کاربر وارد شوید.
    3. `imsg` را در همان کاربر نصب کنید.
    4. wrapper مربوط به SSH را بسازید تا OpenClaw بتواند `imsg` را در context همان کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل همان کاربر اشاره دهید.

    اجرای نخست ممکن است در نشست همان کاربر bot به تأییدهای GUI (Automation + Full Disk Access) نیاز داشته باشد.

  </Accordion>

  <Accordion title="Mac راه‌دور از طریق Tailscale (مثال)">
    توپولوژی رایج:

    - gateway روی Linux/VM اجرا می‌شود
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
    iMessage از پیکربندی برای هر حساب زیر `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات تاریخچه و allowlistهای ریشه پیوست را override کند.

  </Accordion>

  <Accordion title="تاریخچه پیام مستقیم">
    `channels.imessage.dmHistoryLimit` را تنظیم کنید تا نشست‌های جدید پیام مستقیم با تاریخچه اخیر رمزگشایی‌شده `imsg` برای آن گفت‌وگو seed شوند. برای overrideهای هر فرستنده، از جمله `0` برای غیرفعال کردن تاریخچه برای یک فرستنده، از `channels.imessage.dms["<sender>"].historyLimit` استفاده کنید.

    تاریخچه DM در iMessage در صورت نیاز از `imsg` دریافت می‌شود. تنظیم‌نکردن `dmHistoryLimit` باعث غیرفعال شدن seed کردن سراسری تاریخچه DM می‌شود، اما مقدار مثبت برای هر فرستنده در `channels.imessage.dms["<sender>"].historyLimit` همچنان seed کردن را برای آن فرستنده فعال می‌کند.

  </Accordion>
</AccordionGroup>

## رسانه، قطعه‌بندی، و هدف‌های تحویل

<AccordionGroup>
  <Accordion title="پیوست‌ها و رسانه">
    - دریافت پیوست ورودی **به‌طور پیش‌فرض خاموش است** — برای ارسال عکس‌ها، یادداشت‌های صوتی، ویدیو و دیگر پیوست‌ها به عامل، `channels.imessage.includeAttachments: true` را تنظیم کنید. وقتی غیرفعال باشد، iMessageهای فقط‌پیوست پیش از رسیدن به عامل کنار گذاشته می‌شوند و ممکن است اصلاً هیچ خط لاگ `Inbound message` تولید نکنند.
    - مسیرهای پیوست راه‌دور وقتی `remoteHost` تنظیم شده باشد می‌توانند از طریق SCP دریافت شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشه پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازه رسانه خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض 16 MB)

  </Accordion>

  <Accordion title="قطعه‌بندی خروجی">
    - حد قطعه متن: `channels.imessage.textChunkLimit` (پیش‌فرض 4000)
    - حالت قطعه‌بندی: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم با اولویت پاراگراف)

  </Accordion>

  <Accordion title="قالب‌های آدرس‌دهی">
    مقصدهای صریح ترجیحی:

    - `chat_id:123` (برای مسیریابی پایدار توصیه می‌شود)
    - `chat_guid:...`
    - `chat_identifier:...`

    مقصدهای شناسه کاربری نیز پشتیبانی می‌شوند:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## کنش‌های API خصوصی

وقتی `imsg launch` در حال اجرا است و `openclaw channels status --probe` مقدار `privateApi.available: true` را گزارش می‌کند، ابزار پیام علاوه بر ارسال متن عادی می‌تواند از کنش‌های بومی iMessage استفاده کند.

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="کنش‌های در دسترس">
    - **react**: افزودن/حذف tapbackهای iMessage (`messageId`، `emoji`، `remove`). tapbackهای پشتیبانی‌شده به love، like، dislike، laugh، emphasize و question نگاشت می‌شوند.
    - **reply**: ارسال پاسخ رشته‌ای به یک پیام موجود (`messageId`، `text` یا `message`، به‌همراه `chatGuid`، `chatId`، `chatIdentifier` یا `to`).
    - **sendWithEffect**: ارسال متن با یک جلوه iMessage (`text` یا `message`، `effect` یا `effectId`).
    - **edit**: ویرایش یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شده macOS/API خصوصی (`messageId`، `text` یا `newText`).
    - **unsend**: پس‌گرفتن یک پیام ارسال‌شده روی نسخه‌های پشتیبانی‌شده macOS/API خصوصی (`messageId`).
    - **upload-file**: ارسال رسانه/فایل‌ها (`buffer` به‌صورت base64 یا یک `media`/`path`/`filePath` آب‌رسانی‌شده، `filename`، و `asVoice` اختیاری). نام مستعار قدیمی: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: مدیریت گفت‌وگوهای گروهی وقتی مقصد فعلی یک گفت‌وگوی گروهی است.
    - **poll**: ایجاد یک نظرسنجی بومی Apple Messages (`pollQuestion`، `pollOption` که 2 تا 12 بار تکرار می‌شود، به‌همراه `chatGuid`، `chatId`، `chatIdentifier` یا `to`). گیرندگان روی iOS/iPadOS/macOS 26+ آن را به‌صورت بومی می‌بینند و رأی می‌دهند؛ نسخه‌های قدیمی‌تر سیستم‌عامل یک متن جایگزین "Sent a poll" دریافت می‌کنند. به `selectors.pollPayloadMessage` نیاز دارد.
    - **poll-vote**: رأی‌دادن به یک نظرسنجی موجود (`pollId` یا `messageId`، به‌همراه دقیقاً یکی از `pollOptionIndex`، `pollOptionId` یا `pollOptionText`). به `selectors.pollVoteMessage` و روش RPC با نام `poll.vote` نیاز دارد.

    نظرسنجی‌های ورودی پذیرفته‌شده برای عامل با پرسش، برچسب‌های گزینه شماره‌گذاری‌شده، شمار رأی‌ها و شناسه پیام نظرسنجی موردنیاز `poll-vote` نمایش داده می‌شوند.

  </Accordion>

  <Accordion title="شناسه‌های پیام">
    زمینه iMessage ورودی، هرجا در دسترس باشد، هم مقدارهای کوتاه `MessageSid` و هم GUIDهای کامل پیام را شامل می‌شود. شناسه‌های کوتاه به کش پاسخ اخیرِ پشتیبانی‌شده با SQLite محدودند و پیش از استفاده در برابر گفت‌وگوی فعلی بررسی می‌شوند. اگر یک شناسه کوتاه منقضی شده باشد یا به گفت‌وگوی دیگری تعلق داشته باشد، با `MessageSidFull` کامل دوباره تلاش کنید.

  </Accordion>

  <Accordion title="تشخیص قابلیت">
    OpenClaw کنش‌های API خصوصی را فقط وقتی پنهان می‌کند که وضعیت کاوش کش‌شده بگوید پل در دسترس نیست. اگر وضعیت نامشخص باشد، کنش‌ها قابل مشاهده می‌مانند و کاوش‌ها هنگام ارسال به‌صورت تنبل اجرا می‌شوند تا نخستین کنش بتواند پس از `imsg launch` بدون تازه‌سازی دستی جداگانه وضعیت موفق شود.

  </Accordion>

  <Accordion title="رسید خواندن و تایپ">
    وقتی پل API خصوصی فعال است، گفت‌وگوهای ورودی پذیرفته‌شده خوانده‌شده علامت‌گذاری می‌شوند و گفت‌وگوهای مستقیم به‌محض پذیرش نوبت، در حالی که عامل زمینه را آماده و تولید می‌کند، حباب تایپ نشان می‌دهند. علامت‌گذاری خواندن را با این تنظیم غیرفعال کنید:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    بیلدهای قدیمی‌تر `imsg` که پیش از فهرست قابلیت به‌ازای هر روش هستند، تایپ/خواندن را بی‌صدا غیرفعال می‌کنند؛ OpenClaw در هر راه‌اندازی دوباره یک هشدار یک‌باره ثبت می‌کند تا رسیدِ گم‌شده قابل انتساب باشد.

  </Accordion>

  <Accordion title="tapbackهای ورودی">
    OpenClaw در tapbackهای iMessage مشترک می‌شود و واکنش‌های پذیرفته‌شده را به‌جای متن پیام عادی، به‌عنوان رویدادهای سیستمی مسیریابی می‌کند، بنابراین tapback کاربر یک حلقه پاسخ معمولی را فعال نمی‌کند.

    حالت اعلان با `channels.imessage.reactionNotifications` کنترل می‌شود:

    - `"own"` (پیش‌فرض): فقط وقتی کاربران به پیام‌های نوشته‌شده توسط ربات واکنش می‌دهند اطلاع‌رسانی کن.
    - `"all"`: برای همه tapbackهای ورودی از فرستندگان مجاز اطلاع‌رسانی کن.
    - `"off"`: tapbackهای ورودی را نادیده بگیر.

    بازنویسی‌های به‌ازای حساب از `channels.imessage.accounts.<id>.reactionNotifications` استفاده می‌کنند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید (👍 / 👎)">
    وقتی `approvals.exec.enabled` یا `approvals.plugin.enabled` برابر true باشد و درخواست به iMessage مسیریابی شود، Gateway یک درخواست تأیید را به‌صورت بومی تحویل می‌دهد و برای حل آن یک tapback را می‌پذیرد:

    - `👍` (tapback نوع Like) → `allow-once`
    - `👎` (tapback نوع Dislike) → `deny`
    - `allow-always` به‌عنوان جایگزین دستی باقی می‌ماند: `/approve <id> allow-always` را به‌صورت یک پاسخ عادی ارسال کنید.

    مدیریت واکنش نیاز دارد شناسه کاربری کاربر واکنش‌دهنده یک تأییدکننده صریح باشد. فهرست تأییدکننده‌ها از `channels.imessage.allowFrom` (یا `channels.imessage.accounts.<id>.allowFrom`) خوانده می‌شود؛ شماره تلفن کاربر را در قالب E.164 یا ایمیل Apple ID او اضافه کنید. ورودی wildcard با مقدار `"*"` رعایت می‌شود اما به هر فرستنده‌ای اجازه تأیید می‌دهد. میان‌بر واکنش عمداً `reactionNotifications`، `dmPolicy` و `groupAllowFrom` را دور می‌زند، چون allowlist تأییدکننده صریح تنها دروازه‌ای است که برای حل تأیید اهمیت دارد.

    **تغییر رفتار در این نسخه:** وقتی `channels.imessage.allowFrom` خالی نباشد، فرمان متنی `/approve <id> <decision>` اکنون در برابر همان فهرست تأییدکننده مجاز می‌شود (نه allowlist گسترده‌تر DM). فرستندگانی که در allowlist پیام مستقیم مجازند اما در `allowFrom` نیستند، یک رد صریح دریافت می‌کنند. برای حفظ رفتار قبلی، هر اپراتوری را که باید بتواند از طریق `/approve` (و از طریق واکنش‌ها) تأیید کند به `allowFrom` اضافه کنید. وقتی `allowFrom` خالی باشد، fallback قدیمی «همان گفت‌وگو» همچنان برقرار می‌ماند و `/approve` همچنان هر کسی را که allowlist پیام مستقیم اجازه می‌دهد مجاز می‌کند.

    یادداشت‌های اپراتور:
    - اتصال واکنش هم در حافظه (با TTL منطبق با انقضای تأیید) و هم در ذخیره‌گاه کلیددار پایدار Gateway ذخیره می‌شود، بنابراین tapbackی که کمی پس از راه‌اندازی دوباره Gateway برسد همچنان تأیید را حل می‌کند.
    - tapbackهای بین‌دستگاهی با `is_from_me=true` (واکنش خود اپراتور روی یک دستگاه Apple جفت‌شده) عمداً نادیده گرفته می‌شوند تا ربات نتواند خودش را تأیید کند.
    - tapbackهای قدیمی به سبک متن (`Liked "…"` به‌صورت متن ساده از کلاینت‌های بسیار قدیمی Apple) نمی‌توانند تأییدها را حل کنند، چون هیچ GUID پیام همراه ندارند؛ حل واکنش به فراداده tapback ساخت‌یافته‌ای نیاز دارد که کلاینت‌های فعلی macOS / iOS منتشر می‌کنند.

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

## ادغام پیام‌های مستقیم split-send (فرمان + URL در یک ترکیب)

وقتی کاربر یک فرمان و یک URL را با هم تایپ می‌کند — مثلاً `Dump https://example.com/article` — برنامه Messages شرکت Apple ارسال را به **دو ردیف جداگانه `chat.db`** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک حباب پیش‌نمایش URL (`"https://..."`) با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

این دو ردیف در بیشتر راه‌اندازی‌ها با فاصله حدود 0.8 تا 2.0 ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت 1 فقط فرمان را دریافت می‌کند، پاسخ می‌دهد (اغلب «URL را برایم بفرست») و URL را فقط در نوبت 2 می‌بیند — در آن نقطه زمینه فرمان از دست رفته است. این خط لوله ارسال Apple است، نه چیزی که OpenClaw یا `imsg` معرفی کرده باشد.

`channels.imessage.coalesceSameSenderDms` یک پیام مستقیم را وارد بافرکردن ردیف‌های پیاپی از همان فرستنده می‌کند. وقتی `imsg` نشانگر ساختاری پیش‌نمایش URL یعنی `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` را روی یکی از ردیف‌های منبع ارائه کند، OpenClaw فقط همان split-send واقعی را ادغام می‌کند و هر ردیف بافرشده دیگر را به‌عنوان نوبت‌های جداگانه نگه می‌دارد. روی بیلدهای قدیمی‌تر `imsg` که اصلاً هیچ فراداده حبابی منتشر نمی‌کنند، OpenClaw نمی‌تواند split-send را از ارسال‌های جداگانه تشخیص دهد، بنابراین به ادغام bucket برمی‌گردد. این رفتار پیش از فراداده را حفظ می‌کند، به‌جای اینکه split-sendهای `Dump <url>` را دوباره به دو نوبت تبدیل کند. گفت‌وگوهای گروهی همچنان به‌ازای هر پیام ارسال می‌شوند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="زمان فعال‌سازی">
    وقتی این موارد برقرار است فعال کنید:

    - Skillsهایی ارائه می‌کنید که انتظار `command + payload` را در یک پیام دارند (dump، paste، save، queue و غیره).
    - کاربران شما URLها را کنار فرمان‌ها paste می‌کنند.
    - می‌توانید تأخیر افزوده‌شده نوبت پیام مستقیم را بپذیرید (پایین را ببینید).

    وقتی این موارد برقرار است غیرفعال بگذارید:

    - برای محرک‌های پیام مستقیم تک‌کلمه‌ای به کمینه تأخیر فرمان نیاز دارید.
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

    با روشن بودن این پرچم و نبود `messages.inbound.byChannel.imessage` صریح یا `messages.inbound.debounceMs` سراسری، پنجره debounce به **7000 ms** افزایش می‌یابد (پیش‌فرض قدیمی 0 ms است — بدون debouncing). پنجره گسترده‌تر لازم است چون آهنگ split-send پیش‌نمایش URL در Apple می‌تواند تا چند ثانیه کشیده شود، در حالی که Messages.app ردیف پیش‌نمایش را منتشر می‌کند.

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
  <Tab title="Trade-offs">
    - **ادغام دقیق به فرادادهٔ محمولهٔ فعلی `imsg` نیاز دارد.** وقتی ردیف URL شامل `balloon_bundle_id` باشد، فقط همان ارسال تکه‌تکهٔ واقعی ادغام می‌شود و ردیف‌های بافری دیگر جدا می‌مانند. در ساخت‌های قدیمی‌تر `imsg` که هیچ فرادادهٔ بالنی ارائه نمی‌کنند، OpenClaw به ادغام سطل بافری برمی‌گردد تا ارسال‌های تکه‌تکهٔ `Dump <url>` به دو نوبت پسرفت نکنند (سازگاری موقت با گذشته، پس از آنکه `imsg` ادغام ارسال‌های تکه‌تکه را در بالادست انجام دهد حذف می‌شود).
    - **تأخیر افزوده برای پیام‌های DM.** با روشن بودن پرچم، هر DM (از جمله فرمان‌های کنترلی مستقل و پیگیری‌های تک‌متنی) پیش از ارسال تا اندازهٔ پنجرهٔ debounce منتظر می‌ماند، شاید ردیف پیش‌نمایش URL در راه باشد. پیام‌های گفت‌وگوی گروهی همچنان فوری ارسال می‌شوند.
    - **خروجی ادغام‌شده محدود است.** متن ادغام‌شده با نشانگر صریح `…[truncated]` در ۴۰۰۰ نویسه سقف دارد؛ پیوست‌ها سقف ۲۰ دارند؛ ورودی‌های منبع سقف ۱۰ دارند (پس از آن، نخستین و تازه‌ترین نگه داشته می‌شوند). هر GUID منبع برای تله‌متری پایین‌دستی در `coalescedMessageGuids` ردیابی می‌شود.
    - **فقط DM.** گفت‌وگوهای گروهی به ارسال تک‌پیامی عبور می‌کنند تا ربات وقتی چند نفر در حال تایپ هستند پاسخ‌گو بماند.
    - **اختیاری و به‌ازای هر کانال.** کانال‌های دیگر (Telegram، WhatsApp، Slack، …) تحت تأثیر نیستند. پیکربندی‌های قدیمی BlueBubbles که `channels.bluebubbles.coalesceSameSenderDms` را تنظیم می‌کنند باید آن مقدار را به `channels.imessage.coalesceSameSenderDms` منتقل کنند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

ستون «پرچم روشن» رفتار را روی ساخت `imsg` نشان می‌دهد که `balloon_bundle_id` منتشر می‌کند. در ساخت‌های قدیمی‌تر `imsg` که اصلاً هیچ فرادادهٔ بالنی منتشر نمی‌کنند، ردیف‌های زیر که با «دو نوبت» / «N نوبت» مشخص شده‌اند در عوض به ادغام قدیمی (یک نوبت) برمی‌گردند: OpenClaw نمی‌تواند از نظر ساختاری ارسال تکه‌تکه را از ارسال‌های جداگانه تشخیص دهد، پس ادغام پیش از فراداده را حفظ می‌کند. جداسازی دقیق زمانی فعال می‌شود که ساخت، فرادادهٔ بالنی منتشر کند.

| کاربر می‌نویسد                                                      | `chat.db` تولید می‌کند                  | پرچم خاموش (پیش‌فرض)                      | پرچم روشن + پنجره (`imsg` فرادادهٔ بالنی منتشر می‌کند)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | ۲ ردیف با فاصلهٔ حدود ۱ ثانیه                   | دو نوبت عامل: فقط «Dump»، سپس URL | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (پیوست + متن)                | ۲ ردیف بدون فرادادهٔ بالن URL | دو نوبت                               | پس از مشاهدهٔ فراداده دو نوبت؛ در نشست‌های قدیمی/پیش از قفل‌شدنِ بدون فراداده، یک نوبت ادغام‌شده       |
| `/status` (فرمان مستقل)                                     | ۱ ردیف                               | ارسال فوری                        | **تا پنجره منتظر می‌ماند، سپس ارسال می‌کند**                                                                |
| URL به‌تنهایی چسبانده شده                                                   | ۱ ردیف                               | ارسال فوری                        | تا پنجره منتظر می‌ماند، سپس ارسال می‌کند                                                                    |
| متن + URL به‌صورت دو پیام جداگانهٔ عمدی، با فاصلهٔ چند دقیقه | ۲ ردیف بیرون از پنجره               | دو نوبت                               | دو نوبت (پنجره بین آن‌ها منقضی می‌شود)                                                             |
| سیل سریع (>۱۰ DM کوچک داخل پنجره)                          | N ردیف بدون فرادادهٔ بالن URL | N نوبت                                 | پس از مشاهدهٔ فراداده N نوبت؛ در نشست‌های قدیمی/پیش از قفل‌شدنِ بدون فراداده، یک نوبت ادغام‌شدهٔ محدود |
| دو نفر در یک گفت‌وگوی گروهی تایپ می‌کنند                                  | N ردیف از M فرستنده               | بیش از M نوبت (یکی برای هر سطل فرستنده)        | بیش از M نوبت — گفت‌وگوهای گروهی ادغام نمی‌شوند                                                            |

## بازیابی ورودی پس از راه‌اندازی دوبارهٔ پل یا Gateway

iMessage پیام‌هایی را که هنگام خاموش بودن gateway از دست رفته‌اند بازیابی می‌کند و هم‌زمان «انفجار صف عقب‌مانده» کهنه‌ای را که Apple می‌تواند پس از بازیابی Push تخلیه کند سرکوب می‌کند. رفتار پیش‌فرض همیشه روشن است و بر پایهٔ حذف تکرار ورودی ساخته شده است.

- **حذف تکرار بازپخش.** هر پیام ورودیِ ارسال‌شده با GUID اپل خود در وضعیت پایدار Plugin (`imessage.inbound-dedupe`) ثبت می‌شود، هنگام دریافت claim می‌شود و پس از پردازش commit می‌شود (در خطای گذرا آزاد می‌شود تا بتواند دوباره تلاش کند). هر چیزی که قبلاً پردازش شده باشد به‌جای ارسال دوباره حذف می‌شود. این همان چیزی است که اجازه می‌دهد بازیابی بدون حسابداری تک‌پیامی، بازپخش تهاجمی انجام دهد.
- **بازیابی زمان خاموشی.** هنگام راه‌اندازی، ناظر آخرین rowid ارسال‌شدهٔ `chat.db` را به خاطر می‌سپارد (یک مکان‌نمای پایدار به‌ازای هر حساب) و آن را به‌عنوان `since_rowid` به `imsg watch.subscribe` می‌دهد، تا imsg ردیف‌هایی را که هنگام خاموش بودن gateway رسیده‌اند بازپخش کند و سپس زنده دنبال کند. بازپخش به تازه‌ترین ردیف‌ها و پیام‌های حداکثر حدود ۲ ساعت قبل محدود است، و حذف تکرار هر چیزی را که قبلاً پردازش شده باشد حذف می‌کند.
- **حصار سنی صف عقب‌ماندهٔ کهنه.** ردیف‌های بالاتر از مرز راه‌اندازی واقعاً زنده هستند؛ موردی که تاریخ ارسالش بیش از حدود ۱۵ دقیقه قدیمی‌تر از زمان رسیدنش باشد، صف عقب‌ماندهٔ تخلیه‌شده توسط Push است و سرکوب می‌شود. ردیف‌های بازپخش‌شده (در مرز یا پایین‌تر از آن) به‌جای آن از پنجرهٔ بازیابی گسترده‌تر استفاده می‌کنند، بنابراین پیامی که اخیراً از دست رفته تحویل داده می‌شود، اما تاریخچهٔ بسیار قدیمی نه.

بازیابی روی هر دو راه‌اندازی محلی و راه‌اندازی‌های `cliPath` راه‌دور کار می‌کند، چون بازپخش `since_rowid` از همان اتصال RPC به `imsg` اجرا می‌شود. تفاوت در پنجره است: وقتی gateway می‌تواند `chat.db` را بخواند (محلی)، مرز rowid راه‌اندازی را لنگر می‌کند، گسترهٔ بازپخش را محدود می‌کند، و پیام‌های ازدست‌رفته تا چند ساعت قبل را تحویل می‌دهد. روی `cliPath` راه‌دور با SSH نمی‌تواند پایگاه داده را بخواند، پس بازپخش بدون سقف است و هر ردیف از حصار سنی زنده استفاده می‌کند — همچنان پیام‌های اخیراً ازدست‌رفته را بازیابی می‌کند و همچنان صف عقب‌ماندهٔ قدیمی را سرکوب می‌کند، فقط با پنجرهٔ زندهٔ باریک‌تر. برای پنجرهٔ بازیابی گسترده‌تر، gateway را روی Mac مربوط به Messages اجرا کنید.

### سیگنال قابل مشاهده برای اپراتور

صف عقب‌ماندهٔ سرکوب‌شده در سطح پیش‌فرض ثبت می‌شود و هرگز بی‌صدا حذف نمی‌شود (پرچم `recovery` نشان می‌دهد کدام پنجره اعمال شده است):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### مهاجرت

`channels.imessage.catchup.*` منسوخ شده است — بازیابی زمان خاموشی اکنون خودکار است و برای راه‌اندازی‌های جدید به هیچ پیکربندی نیاز ندارد. پیکربندی‌های موجود با `catchup.enabled: true` همچنان به‌عنوان نمایهٔ سازگاری برای پنجرهٔ بازپخش بازیابی رعایت می‌شوند. بلوک‌های catchup غیرفعال (`enabled: false` یا بدون `enabled: true`) بازنشسته شده‌اند؛ `openclaw doctor --fix` آن‌ها را حذف می‌کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    باینری و پشتیبانی RPC را اعتبارسنجی کنید:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    اگر probe گزارش داد RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید. اگر کنش‌های API خصوصی در دسترس نیستند، `imsg launch` را در نشست کاربر واردشدهٔ macOS اجرا کنید و دوباره probe بگیرید. اگر Gateway روی macOS اجرا نمی‌شود، به‌جای مسیر محلی پیش‌فرض `imsg` از راه‌اندازی Mac راه‌دور از طریق SSH در بالا استفاده کنید.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    ابتدا ثابت کنید که آیا پیام به Mac محلی رسیده است یا نه. اگر `chat.db` تغییر نکند، OpenClaw نمی‌تواند پیام را دریافت کند حتی وقتی `imsg status --json` یک پل سالم گزارش می‌دهد.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    اگر پیام‌های ارسال‌شده از تلفن ردیف جدیدی ایجاد نمی‌کنند، پیش از تغییر پیکربندی OpenClaw، لایهٔ macOS Messages و Apple Push را تعمیر کنید. یک تازه‌سازی یک‌بارهٔ سرویس اغلب کافی است:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    یک iMessage تازه از تلفن بفرستید و پیش از عیب‌یابی نشست‌های OpenClaw، ردیف جدید `chat.db` یا رویداد `imsg watch` را تأیید کنید. این را به‌عنوان حلقهٔ دوره‌ای راه‌اندازی دوبارهٔ پل اجرا نکنید؛ اجرای تکراری `imsg launch` همراه با راه‌اندازی دوبارهٔ gateway هنگام کار فعال می‌تواند تحویل‌ها را قطع کند و اجراهای کانالِ در جریان را معلق بگذارد.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    `cliPath: "imsg"` پیش‌فرض باید روی Mac واردشده به Messages اجرا شود. روی Linux یا Windows، `channels.imessage.cliPath` را به یک اسکریپت wrapper تنظیم کنید که به آن Mac با SSH وصل می‌شود و `imsg "$@"` را اجرا می‌کند.

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
    - رفتار allowlist برای `channels.imessage.groups`
    - پیکربندی الگوی اشاره (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان gateway
    - کلید میزبان در `~/.ssh/known_hosts` روی میزبان gateway وجود دارد
    - خوانایی مسیر راه‌دور روی Mac اجراکنندهٔ Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    در یک ترمینال GUI تعاملی در همان زمینهٔ کاربر/نشست دوباره اجرا کنید و promptها را تأیید کنید:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأیید کنید Full Disk Access + Automation برای زمینهٔ فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## اشاره‌گرهای مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [Pairing](/fa/channels/pairing)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [حذف BlueBubbles و مسیر imsg iMessage](/fa/announcements/bluebubbles-imessage) — اعلامیه و خلاصهٔ مهاجرت
- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) — جدول ترجمهٔ پیکربندی و انتقال گام‌به‌گام
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و gating اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
