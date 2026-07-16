---
read_when:
    - راه‌اندازی پشتیبانی از iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی از iMessage از طریق imsg (JSON-RPC روی stdio)، با عملیات API خصوصی برای پاسخ‌ها، واکنش‌های Tapback، جلوه‌ها، نظرسنجی‌ها، پیوست‌ها و مدیریت گروه. گزینهٔ ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw، درصورتی‌که نیازمندی‌های میزبان فراهم باشند.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T15:20:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرار معمول iMessage در OpenClaw، Gateway و `imsg` را روی همان میزبان macOS که به Messages وارد شده است اجرا کنید. اگر Gateway شما جای دیگری اجرا می‌شود، `channels.imessage.cliPath` را به یک پوشش شفاف SSH هدایت کنید که `imsg` را روی Mac اجرا می‌کند.

**بازیابی ورودی خودکار است.** پس از راه‌اندازی مجدد پل یا Gateway، iMessage پیام‌هایی را که هنگام ازکارافتادگی دریافت نشده‌اند بازپخش می‌کند و «بمب انباشت» قدیمی را که Apple ممکن است پس از بازیابی Push تخلیه کند سرکوب می‌کند؛ همچنین با حذف موارد تکراری مانع از ارسال دوباره هر مورد می‌شود. برای فعال‌سازی نیازی به پیکربندی نیست — به [بازیابی ورودی پس از راه‌اندازی مجدد پل یا Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart) مراجعه کنید.
</Note>

<Warning>
پشتیبانی از BlueBubbles حذف شده است. پیکربندی‌های `channels.bluebubbles` را به `channels.imessage` مهاجرت دهید؛ OpenClaw فقط از طریق `imsg` از iMessage پشتیبانی می‌کند. برای اعلان کوتاه با [حذف BlueBubbles و مسیر imsg برای iMessage](/fa/announcements/bluebubbles-imessage) شروع کنید، یا برای جدول کامل مهاجرت به [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) مراجعه کنید.
</Warning>

وضعیت: یکپارچه‌سازی بومی با CLI خارجی. Gateway فرایند `imsg rpc` را ایجاد می‌کند و از طریق stdio با JSON-RPC ارتباط برقرار می‌کند — بدون دیمن یا درگاه جداگانه. برای برخورداری از کانال کامل iMessage، حالت API خصوصی قویاً توصیه می‌شود؛ پاسخ‌ها، واکنش‌های tapback، جلوه‌ها، نظرسنجی‌ها، پاسخ به پیوست‌ها و عملیات گروهی به `imsg launch` و یک بررسی موفق API خصوصی نیاز دارند.

در راه‌اندازی محلی متداول، راه‌اندازی OpenClaw می‌تواند نصب یا به‌روزرسانی `imsg` از طریق Homebrew را با تأیید کاربر روی Mac واردشده به Messages پیشنهاد دهد. راه‌اندازی دستی و توپولوژی‌های پوشش SSH همچنان بر عهده اپراتور هستند: `imsg` را در همان زمینه کاربری نصب یا به‌روزرسانی کنید که Gateway یا پوشش را اجرا خواهد کرد.

<CardGroup cols={3}>
  <Card title="عملیات API خصوصی" icon="wand-sparkles" href="#private-api-actions">
    پاسخ‌ها، واکنش‌های tapback، جلوه‌ها، نظرسنجی‌ها، پیوست‌ها و مدیریت گروه.
  </Card>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های خصوصی iMessage به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="Mac راه‌دور" icon="terminal" href="#remote-mac-over-ssh">
    وقتی Gateway روی Mac مربوط به Messages اجرا نمی‌شود، از پوشش SSH استفاده کنید.
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
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        وقتی راهنمای راه‌اندازی محلی تشخیص دهد که فرمان پیش‌فرض `imsg` وجود ندارد، می‌تواند نصب `steipete/tap/imsg` از طریق Homebrew را پیشنهاد کند. اگر یک `imsg` تحت مدیریت Homebrew را تشخیص دهد، می‌تواند نصب مجدد یا به‌روزرسانی آن را پیشنهاد کند. پوشش‌های سفارشی `cliPath` تغییر داده نمی‌شوند.

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

      <Step title="تأیید نخستین جفت‌سازی پیام خصوصی (dmPolicy پیش‌فرض)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        درخواست‌های جفت‌سازی پس از 1 ساعت منقضی می‌شوند.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac راه‌دور از طریق SSH">
    بیشتر راه‌اندازی‌ها به SSH نیاز ندارند. فقط زمانی از این توپولوژی استفاده کنید که Gateway نتواند روی Mac واردشده به Messages اجرا شود. OpenClaw فقط به یک `cliPath` سازگار با stdio نیاز دارد، بنابراین می‌توانید `cliPath` را به اسکریپت پوششی هدایت کنید که از طریق SSH به Mac راه‌دور متصل می‌شود و `imsg` را اجرا می‌کند.
    `imsg` را روی همان Mac راه‌دور نصب و به‌روزرسانی کنید، نه روی میزبان Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    پیکربندی توصیه‌شده هنگام فعال‌بودن پیوست‌ها:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // برای دریافت پیوست‌ها با SCP استفاده می‌شود
      includeAttachments: true,
      // اختیاری: ریشه‌های مجاز اضافی برای پیوست‌ها (با مقدار پیش‌فرض
      // /Users/*/Library/Messages/Attachments ادغام می‌شوند).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند آن را با تجزیه اسکریپت پوشش SSH به‌طور خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH)؛ مقادیر ناامن نادیده گرفته می‌شوند.
    OpenClaw برای SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، بنابراین کلید میزبان رله باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

<Warning>
هر پوشش `cliPath` یا پراکسی SSH که جلوی `imsg` قرار می‌دهید باید برای JSON-RPC طولانی‌مدت مانند یک لوله شفاف stdio رفتار کند. OpenClaw در تمام طول عمر کانال، پیام‌های کوچک JSON-RPC با قاب‌بندی خط جدید را از طریق stdin/stdout پوشش مبادله می‌کند:

- هر قطعه/خط stdin را **به‌محض دردسترس‌بودن بایت‌ها** ارسال کنید — منتظر EOF نمانید.
- هر قطعه/خط stdout را بی‌درنگ در جهت معکوس ارسال کنید.
- خطوط جدید را حفظ کنید.
- از خواندن‌های مسدودکننده با اندازه ثابت (`read(4096)`، `cat | buffer`، `read` پیش‌فرض پوسته) که ممکن است قاب‌های کوچک را معطل کنند، اجتناب کنید.
- stderr را از جریان stdout مربوط به JSON-RPC جدا نگه دارید.

پوششی که stdin را تا زمان پرشدن یک بلوک بزرگ بافر می‌کند، علائمی شبیه قطعی iMessage ایجاد خواهد کرد — `imsg rpc timeout (chats.list)` یا راه‌اندازی‌های مجدد مکرر کانال — حتی اگر خود `imsg rpc` سالم باشد. `ssh -T host imsg "$@"` (در بالا) امن است، زیرا آرگومان‌های `cliPath` مربوط به OpenClaw، مانند `rpc` و `--db`، را ارسال می‌کند. خط‌های لوله‌ای مانند `ssh host imsg | grep -v '^DEBUG'` امن نیستند — ابزارهای با بافر خطی همچنان ممکن است قاب‌ها را نگه دارند؛ اگر ناچار به پالایش هستید، در هر مرحله از `stdbuf -oL -eL` استفاده کنید.
</Warning>

  </Tab>
</Tabs>

## الزامات و مجوزها (macOS)

- روی Mac اجراکننده `imsg` باید به Messages وارد شده باشید.
- برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند، دسترسی کامل به دیسک لازم است (برای دسترسی به پایگاه داده Messages).
- برای ارسال پیام از طریق Messages.app، مجوز Automation لازم است.
- برای عملیات پیشرفته (واکنش / ویرایش / لغو ارسال / پاسخ رشته‌ای / جلوه‌ها / نظرسنجی‌ها / عملیات گروهی)، System Integrity Protection باید غیرفعال باشد — به [فعال‌سازی API خصوصی imsg](#enabling-the-imsg-private-api) مراجعه کنید. ارسال و دریافت متن و رسانه پایه بدون آن کار می‌کند.

<Tip>
مجوزها به‌ازای هر زمینه فرایند اعطا می‌شوند. اگر Gateway بدون رابط تعاملی (LaunchAgent/SSH) اجرا می‌شود، یک فرمان تعاملی یک‌باره را در همان زمینه اجرا کنید تا درخواست‌های مجوز ظاهر شوند:

```bash
imsg chats --limit 1
# یا
imsg send <handle> "آزمایش"
```

</Tip>

<Accordion title="ارسال از پوشش SSH با AppleEvents -1743 ناموفق است">
  یک راه‌اندازی SSH راه‌دور ممکن است گفتگوها را بخواند، `channels status --probe` را با موفقیت بگذراند و پیام‌های ورودی را پردازش کند، درحالی‌که ارسال‌های خروجی همچنان با خطای مجوز AppleEvents ناموفق هستند:

```text
مجوز ارسال رویدادهای Apple به Messages وجود ندارد. (-1743)
```

پایگاه داده TCC کاربر واردشده به Mac یا System Settings > Privacy & Security > Automation را بررسی کنید. اگر ورودی Automation به‌جای فرایند `imsg` یا پوسته محلی برای `/usr/libexec/sshd-keygen-wrapper` ثبت شده باشد، ممکن است macOS کلید قابل‌استفاده‌ای برای Messages در اختیار آن کلاینت سمت سرور SSH قرار ندهد:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

در این وضعیت، تکرار `tccutil reset AppleEvents` یا اجرای مجدد `imsg send` از طریق همان پوشش SSH ممکن است همچنان ناموفق باشد، زیرا زمینه فرایندی که به Automation مربوط به Messages نیاز دارد، پوشش SSH است، نه برنامه‌ای که رابط کاربری بتواند به آن مجوز بدهد.

در عوض، از یکی از زمینه‌های فرایندی پشتیبانی‌شده `imsg` استفاده کنید:

- Gateway، یا دست‌کم پل `imsg`، را در نشست محلی کاربر واردشده به Messages اجرا کنید.
- پس از اعطای دسترسی کامل به دیسک و Automation از همان نشست، Gateway را با یک LaunchAgent برای آن کاربر راه‌اندازی کنید.
- اگر توپولوژی SSH دوکاربره را حفظ می‌کنید، پیش از فعال‌سازی کانال بررسی کنید که یک ارسال خروجی واقعی `imsg send` از طریق همان پوشش دقیقاً موفق باشد. اگر امکان اعطای Automation وجود ندارد، به‌جای اتکا به پوشش SSH برای ارسال‌ها، پیکربندی را به راه‌اندازی تک‌کاربره `imsg` تغییر دهید.

</Accordion>

## فعال‌سازی API خصوصی imsg

`imsg` با دو حالت عملیاتی ارائه می‌شود. برای OpenClaw، حالت API خصوصی راه‌اندازی توصیه‌شده است، زیرا عملیات بومی iMessage مورد انتظار کاربران را در اختیار کانال قرار می‌دهد. حالت پایه همچنان برای نصب‌های کم‌ریسک، تأیید اولیه یا میزبان‌هایی که SIP در آن‌ها قابل غیرفعال‌سازی نیست مفید است.

- **حالت پایه** (پیش‌فرض، بدون نیاز به تغییر SIP): متن و رسانه خروجی از طریق `send`، پایش/تاریخچه ورودی و فهرست گفتگوها. این همان چیزی است که با یک `brew install steipete/tap/imsg` تازه به‌همراه مجوزهای استاندارد macOS ذکرشده در بالا، بدون تنظیمات اضافی دریافت می‌کنید.
- **حالت API خصوصی**: `imsg` یک dylib کمکی را به `Messages.app` تزریق می‌کند تا توابع داخلی `IMCore` را فراخوانی کند. این کار `react`، `edit`، `unsend`، `reply` (رشته‌ای)، `sendWithEffect`، `poll` و `poll-vote` (نظرسنجی‌های بومی Messages)، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، به‌علاوه نشانگرهای تایپ و رسیدهای خواندن را فعال می‌کند.

سطح عملیات توصیه‌شده در این صفحه به حالت API خصوصی نیاز دارد. README مربوط به `imsg` این الزام را به‌صراحت بیان می‌کند:

> قابلیت‌های پیشرفته‌ای مانند `read`، `typing`، `launch`، ارسال غنی متکی به پل، تغییر پیام و مدیریت گفتگو اختیاری هستند. این قابلیت‌ها مستلزم غیرفعال‌بودن SIP و تزریق یک dylib کمکی به `Messages.app` هستند. وقتی SIP فعال باشد، `imsg launch` از تزریق خودداری می‌کند.

روش تزریق ابزار کمکی از dylib خود `imsg` برای دسترسی به APIهای خصوصی Messages استفاده می‌کند. در مسیر iMessage مربوط به OpenClaw هیچ سرور شخص ثالث یا زمان اجرای BlueBubbles وجود ندارد.

<Warning>
**غیرفعال‌کردن SIP یک موازنه امنیتی واقعی است.** SIP یکی از حفاظت‌های اصلی macOS در برابر اجرای کد سیستمی تغییریافته است؛ خاموش‌کردن سراسری آن سطح حمله و عوارض جانبی بیشتری ایجاد می‌کند. نکته مهم این‌که **غیرفعال‌کردن SIP روی Macهای Apple Silicon، قابلیت نصب و اجرای برنامه‌های iOS روی Mac را نیز غیرفعال می‌کند**.

این کار را یک انتخاب عملیاتی آگاهانه در نظر بگیرید، به‌ویژه روی Mac شخصی اصلی. برای iMessage با کیفیت عملیاتی در OpenClaw، یک Mac اختصاصی یا کاربر ربات macOS را ترجیح دهید که فعال‌سازی پل روی آن برایتان پذیرفتنی باشد. اگر مدل تهدید شما خاموش‌بودن SIP را در هیچ سامانه‌ای تحمل نمی‌کند، iMessage همراه به حالت پایه محدود می‌شود — فقط ارسال و دریافت متن و رسانه، بدون واکنش‌ها / ویرایش / لغو ارسال / جلوه‌ها / عملیات گروهی.
</Warning>

### راه‌اندازی

1. **`imsg` را نصب (یا ارتقا) کنید** روی Mac که Messages.app را اجرا می‌کند:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   خروجی `imsg status --json` موارد `bridge_version`، `rpc_methods` و `selectors` را برای هر متد گزارش می‌کند تا بتوانید پیش از شروع ببینید ساخت فعلی از چه قابلیت‌هایی پشتیبانی می‌کند.

2. **محافظت از یکپارچگی سیستم و (در نسخه‌های جدید macOS) اعتبارسنجی کتابخانه را غیرفعال کنید.** تزریق یک dylib کمکی غیر Apple به `Messages.app` که با امضای Apple امضا شده است، مستلزم غیرفعال‌بودن SIP **و** کاهش محدودیت اعتبارسنجی کتابخانه است. مرحله SIP در حالت Recovery به نسخه macOS بستگی دارد:
   - **macOS 10.13-10.15 (Sierra-Catalina):** اعتبارسنجی کتابخانه را از طریق Terminal غیرفعال کنید، سیستم را در Recovery Mode راه‌اندازی مجدد کنید، `csrutil disable` را اجرا کنید و دوباره راه‌اندازی کنید.
   - **macOS 11+ (Big Sur و نسخه‌های بعدی)، Intel:** وارد Recovery Mode (یا Internet Recovery) شوید، `csrutil disable` را اجرا کنید و دوباره راه‌اندازی کنید.
   - **macOS 11+، Apple Silicon:** برای ورود به Recovery از توالی راه‌اندازی با دکمه روشن/خاموش استفاده کنید؛ در نسخه‌های جدید macOS هنگام کلیک روی Continue کلید **Left Shift** را نگه دارید، سپس `csrutil disable` را اجرا کنید. راه‌اندازی‌های ماشین مجازی روند جداگانه‌ای دارند، بنابراین ابتدا از VM یک snapshot بگیرید.

   **در macOS 11 و نسخه‌های بعدی، `csrutil disable` به‌تنهایی معمولاً کافی نیست.** Apple همچنان اعتبارسنجی کتابخانه را برای `Messages.app` به‌عنوان یک باینری پلتفرم اعمال می‌کند؛ بنابراین حتی با SIP غیرفعال، ابزار کمکی با امضای adhoc رد می‌شود (`Library Validation failed: ... platform binary, but mapped file is not`). پس از غیرفعال‌کردن SIP، اعتبارسنجی کتابخانه را نیز غیرفعال و سیستم را راه‌اندازی مجدد کنید:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)، تأییدشده روی 26.5.1:** غیرفعال‌بودن SIP **به‌همراه** فرمان `DisableLibraryValidation` بالا برای تزریق ابزار کمکی در نسخه‌های 26.0 تا 26.5.x کافی است. **هیچ boot-argsی لازم نیست.** فایل plist عامل تعیین‌کننده و رایج‌ترین مرحله فراموش‌شده هنگام شکست تزریق در Tahoe است:
   - **با plist:** `imsg launch` تزریق می‌شود و `imsg status` مقدار `advanced_features: true` را گزارش می‌کند.
   - **بدون plist (حتی با SIP غیرفعال):** `imsg launch` با `Failed to launch: Timeout waiting for Messages.app to initialize` شکست می‌خورد. AMFI ابزار کمکی adhoc را هنگام بارگذاری رد می‌کند، بنابراین پل هرگز آماده نمی‌شود و راه‌اندازی timeout می‌شود. این timeout همان نشانه‌ای است که بیشتر افراد در Tahoe با آن مواجه می‌شوند؛ راه‌حل، plist بالا است، نه اقدام شدیدتر دیگری.

   اگر پس از ارتقای macOS، تزریق `imsg launch` یا برخی `selectors`ها شروع به بازگرداندن false کردند، معمولاً علت همین مانع است. پیش از فرض اینکه خود مرحله SIP شکست خورده است، وضعیت SIP و اعتبارسنجی کتابخانه را بررسی کنید. اگر این تنظیمات درست هستند و پل همچنان نمی‌تواند تزریق شود، `imsg status --json` را به‌همراه خروجی `imsg launch` جمع‌آوری و به پروژه `imsg` گزارش کنید، نه اینکه کنترل‌های امنیتی سراسری بیشتری را تضعیف کنید.

3. **ابزار کمکی را تزریق کنید.** درحالی‌که SIP غیرفعال است و در Messages.app وارد حساب شده‌اید:

   ```bash
   imsg launch
   ```

   وقتی SIP همچنان فعال باشد، `imsg launch` از تزریق خودداری می‌کند؛ بنابراین این کار تأییدی بر انجام مرحله 2 نیز هست.

4. **پل را از OpenClaw بررسی کنید:**

   ```bash
   openclaw channels status --probe
   ```

   ورودی iMessage باید `works` را گزارش کند و `imsg status --json | jq '{rpc_methods, selectors}'` باید قابلیت‌های ارائه‌شده توسط build نسخه macOS شما را نشان دهد. ایجاد نظرسنجی به `selectors.pollPayloadMessage` نیاز دارد؛ رأی‌دادن به هر دو مورد `selectors.pollVoteMessage` و متد RPC با نام `poll.vote` نیاز دارد. Plugin مربوط به OpenClaw فقط actionهایی را اعلام می‌کند که probe ذخیره‌شده در cache پشتیبانی می‌کند، درحالی‌که cache خالی خوش‌بینانه باقی می‌ماند و در نخستین dispatch، probe انجام می‌دهد.

اگر `openclaw channels status --probe` کانال را به‌صورت `works` گزارش می‌کند، اما actionهای خاص هنگام dispatch خطای "iMessage `<action>` requires the imsg private API bridge" می‌دهند، `imsg launch` را دوباره اجرا کنید — ابزار کمکی ممکن است از دسترس خارج شود (راه‌اندازی مجدد Messages.app، به‌روزرسانی سیستم‌عامل و غیره) و وضعیت cacheشده `available: true` تا زمانی که probe بعدی آن را تازه کند، همچنان actionها را اعلام خواهد کرد.

### وقتی SIP فعال باقی می‌ماند

اگر غیرفعال‌کردن SIP برای مدل تهدید شما پذیرفتنی نیست:

- `imsg` به حالت پایه بازمی‌گردد — فقط متن + رسانه + دریافت.
- Plugin مربوط به OpenClaw همچنان ارسال متن/رسانه و پایش ورودی را اعلام می‌کند؛ اما `react`، `edit`، `unsend`، `reply`، `sendWithEffect` و عملیات گروهی را از سطح action پنهان می‌کند (مطابق مانع قابلیت هر متد).
- می‌توانید یک Mac جداگانه غیر Apple-Silicon (یا یک Mac اختصاصی برای ربات) را با SIP غیرفعال برای بار کاری iMessage اجرا کنید و درعین‌حال SIP را روی دستگاه‌های اصلی خود فعال نگه دارید. بخش [کاربر اختصاصی ربات در macOS (هویت جداگانه iMessage)](#deployment-patterns) را در ادامه ببینید.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist` (حداقل به یک ورودی `allowFrom` نیاز دارد)
    - `open` (لازم است `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد فهرست مجاز: `channels.imessage.allowFrom`.

    ورودی‌های فهرست مجاز باید فرستندگان را مشخص کنند: handleها یا گروه‌های دسترسی ایستای فرستنده (`accessGroup:<name>`). برای مقصدهای چت مانند `chat_id:*`، `chat_guid:*` یا `chat_identifier:*` از `channels.imessage.groupAllowFrom` استفاده کنید؛ برای کلیدهای عددی رجیستری `chat_id` از `channels.imessage.groups` استفاده کنید.

  </Tab>

  <Tab title="سیاست گروه + اشاره‌ها">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض)
    - `open`
    - `disabled`

    فهرست مجاز فرستندگان گروه: `channels.imessage.groupAllowFrom`.

    ورودی‌های `groupAllowFrom` می‌توانند به گروه‌های دسترسی ایستای فرستنده (`accessGroup:<name>`) نیز ارجاع دهند.

    بازگشت runtime: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی فرستندگان گروه iMessage از `allowFrom` استفاده می‌کند؛ وقتی پذیرش پیام مستقیم و گروه باید متفاوت باشد، `groupAllowFrom` را تنظیم کنید. یک `groupAllowFrom: []` که صراحتاً خالی است، بازگشت انجام نمی‌دهد — در `allowlist` همه فرستندگان گروه را مسدود می‌کند.
    نکته runtime: اگر `channels.imessage` کاملاً وجود نداشته باشد، runtime به `groupPolicy="allowlist"` بازمی‌گردد و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    <Warning>
    مسیریابی گروه در `groupPolicy: "allowlist"` **دو** مانع را پشت‌سرهم اجرا می‌کند:

    1. **فهرست مجاز فرستندگان** (`channels.imessage.groupAllowFrom`) — handle، `accessGroup:<name>`، `chat_guid`، `chat_identifier` یا `chat_id`. فهرست مؤثر خالی (بدون `groupAllowFrom` و بدون بازگشت `allowFrom`) همه فرستندگان گروه را مسدود می‌کند.
    2. **رجیستری گروه** (`channels.imessage.groups`) — پس از اینکه map دارای ورودی باشد اعمال می‌شود: چت باید با یک ورودی صریح برای هر `chat_id` یا wildcard با نام `groups: { "*": { ... } }` مطابقت داشته باشد. وقتی `groups` خالی است یا وجود ندارد، فقط فهرست مجاز فرستندگان درباره پذیرش تصمیم می‌گیرد.

    اگر هیچ فهرست مجاز مؤثری برای فرستندگان گروه پیکربندی نشده باشد، همه پیام‌های گروه پیش از مانع رجیستری حذف می‌شوند. هر مانع در سطح پیش‌فرض گزارش‌گیری، سیگنال سطح `warn` مخصوص خود را دارد و هرکدام راه‌حل متفاوتی را مشخص می‌کنند:

    - یک‌بار برای هر حساب هنگام راه‌اندازی، وقتی فهرست مجاز مؤثر فرستندگان گروه خالی است: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — با تنظیم `channels.imessage.groupAllowFrom` (یا `allowFrom`) رفع کنید؛ افزودن صرف ورودی‌های `groups` باعث می‌شود مانع 1 همچنان همه فرستندگان را مسدود کند.
    - یک‌بار برای هر `chat_id` هنگام runtime، وقتی فرستنده از مانع 1 عبور کرده اما چت در رجیستری پرشده `groups` وجود ندارد: `imessage: dropping group message from chat_id=<id> ...` — با افزودن آن `chat_id` (یا `"*"`) زیر `channels.imessage.groups` رفع کنید.

    پیام‌های مستقیم تحت‌تأثیر نیستند — آن‌ها مسیر کد متفاوتی را طی می‌کنند.

    پیکربندی پیشنهادی برای جریان گروه در `groupPolicy: "allowlist"`:

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

    `groupAllowFrom` به‌تنهایی این فرستندگان را در هر گروهی می‌پذیرد؛ بلوک `groups` را اضافه کنید تا تعیین شود کدام چت‌ها مجازند (و گزینه‌های هر چت مانند `requireMention` تنظیم شوند).
    </Warning>

    مانع اشاره برای گروه‌ها:

    - iMessage هیچ فراداده بومی برای اشاره ندارد
    - تشخیص اشاره از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، با بازگشت به `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، مانع اشاره قابل‌اعمال نیست
    - فرمان‌های کنترلی فرستندگان مجاز، مانع اشاره را دور می‌زنند

    `systemPrompt` برای هر گروه:

    هر ورودی زیر `channels.imessage.groups.*` یک رشته اختیاری `systemPrompt` می‌پذیرد که در هر نوبتی که پیامی از آن گروه را مدیریت می‌کند، به اعلان سیستمی عامل تزریق می‌شود. تفکیک آن مشابه `channels.whatsapp.groups` است:

    1. **اعلان سیستمی مخصوص گروه** (`groups["<chat_id>"].systemPrompt`): وقتی ورودی گروه مشخص در map وجود داشته باشد **و** کلید `systemPrompt` آن تعریف شده باشد، استفاده می‌شود. اگر `systemPrompt` رشته‌ای خالی (`""`) باشد، wildcard سرکوب می‌شود و هیچ اعلان سیستمی برای آن گروه اعمال نمی‌شود.
    2. **اعلان سیستمی wildcard گروه** (`groups["*"].systemPrompt`): وقتی ورودی گروه مشخص به‌طور کامل در map وجود ندارد، یا وجود دارد اما هیچ کلید `systemPrompt` تعریف نمی‌کند، استفاده می‌شود.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "از املای بریتانیایی استفاده کنید." },
            "8421": {
              requireMention: true,
              systemPrompt: "این چت نوبت‌بندی آماده‌باش است. پاسخ‌ها را به کمتر از 3 جمله محدود کنید.",
            },
            "9907": {
              // سرکوب صریح: wildcard با متن "از املای بریتانیایی استفاده کنید." در اینجا اعمال نمی‌شود
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    اعلان‌های هر گروه فقط برای پیام‌های گروه اعمال می‌شوند — پیام‌های مستقیم تحت‌تأثیر نیستند.

  </Tab>

  <Tab title="جلسه‌ها و پاسخ‌های قطعی">
    - پیام‌های مستقیم از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروه استفاده می‌کنند.
    - با `session.dmScope=main` پیش‌فرض، پیام‌های مستقیم iMessage در جلسه اصلی عامل ادغام می‌شوند.
    - جلسه‌های گروه از یکدیگر جدا هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فراداده کانال/مقصد مبدأ، دوباره به iMessage مسیریابی می‌شوند.

    رفتار رشته‌های شبه‌گروهی:

    برخی رشته‌های چندشرکت‌کننده‌ای iMessage ممکن است با `is_group=false` دریافت شوند.
    اگر آن `chat_id` صراحتاً زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را ترافیک گروهی در نظر می‌گیرد (مانع گروه + جداسازی جلسه گروه).

  </Tab>
</Tabs>

## اتصال مکالمه‌های ACP

چت‌های iMessage را می‌توان به جلسه‌های ACP متصل کرد.

روند سریع اپراتور:

- `/acp spawn codex --bind here` را در پیام مستقیم یا چت گروهی مجاز اجرا کنید.
- پیام‌های آینده در همان مکالمه iMessage به جلسه ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان جلسه ACP متصل‌شده را درجا بازنشانی می‌کنند.
- `/acp close` جلسه ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده از ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` استفاده می‌کنند.

`match.peer.id` می‌تواند از موارد زیر استفاده کند:

- handle نرمال‌شده پیام مستقیم مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (برای اتصال‌های پایدار گروه توصیه می‌شود)
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

برای رفتار مشترک اتصال ACP، بخش [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="کاربر اختصاصی ربات در macOS (هویت جداگانه iMessage)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک ربات از پروفایل شخصی Messages شما جدا باشد.

    روند معمول:

    1. یک کاربر اختصاصی macOS ایجاد کنید/به آن وارد شوید.
    2. در آن کاربر، با Apple ID ربات وارد Messages شوید.
    3. `imsg` را در آن کاربر نصب کنید.
    4. یک پوشش SSH ایجاد کنید تا OpenClaw بتواند `imsg` را در زمینهٔ آن کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل آن کاربر ارجاع دهید.

    اجرای نخست ممکن است در نشست کاربر ربات به تأییدهای رابط گرافیکی (Automation + Full Disk Access) نیاز داشته باشد.

  </Accordion>

  <Accordion title="Mac راه‌دور از طریق Tailscale (مثال)">
    توپولوژی رایج:

    - gateway روی Linux/VM اجرا می‌شود
    - iMessage + `imsg` روی یک Mac در tailnet شما اجرا می‌شود
    - پوشش `cliPath` برای اجرای `imsg` از SSH استفاده می‌کند
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

    از کلیدهای SSH استفاده کنید تا SSH و SCP هر دو غیرتعاملی باشند.
    ابتدا مطمئن شوید کلید میزبان مورد اعتماد است (برای مثال `ssh bot@mac-mini.tailnet-1234.ts.net`) تا `known_hosts` مقداردهی شود.

  </Accordion>

  <Accordion title="الگوی چندحسابی">
    iMessage از پیکربندی جداگانهٔ هر حساب در `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات تاریخچه و فهرست‌های مجاز ریشهٔ پیوست را بازنویسی کند.

  </Accordion>

  <Accordion title="تاریخچهٔ پیام مستقیم">
    برای مقداردهی اولیهٔ نشست‌های جدید پیام مستقیم با تاریخچهٔ رمزگشایی‌شدهٔ اخیر `imsg` آن مکالمه، `channels.imessage.dmHistoryLimit` را تنظیم کنید. برای بازنویسی‌های مختص هر فرستنده از `channels.imessage.dms["<sender>"].historyLimit` استفاده کنید؛ از جمله `0` برای غیرفعال‌کردن تاریخچه برای یک فرستنده.

    تاریخچهٔ پیام مستقیم iMessage هنگام نیاز از `imsg` واکشی می‌شود. تنظیم‌نکردن `dmHistoryLimit` مقداردهی اولیهٔ سراسری تاریخچهٔ پیام مستقیم را غیرفعال می‌کند، اما یک `channels.imessage.dms["<sender>"].historyLimit` مثبت برای هر فرستنده همچنان مقداردهی اولیه را برای همان فرستنده فعال می‌کند.

  </Accordion>
</AccordionGroup>

## رسانه، قطعه‌بندی و مقصدهای تحویل

<AccordionGroup>
  <Accordion title="پیوست‌ها و رسانه">
    - ورود پیوست‌های دریافتی **به‌طور پیش‌فرض غیرفعال است** — برای ارسال عکس‌ها، یادداشت‌های صوتی، ویدئو و سایر پیوست‌ها به عامل، `channels.imessage.includeAttachments: true` را تنظیم کنید. در صورت غیرفعال‌بودن آن، iMessageهایی که فقط پیوست دارند پیش از رسیدن به عامل حذف می‌شوند و ممکن است اصلاً هیچ خط گزارش `Inbound message` ایجاد نکنند.
    - وقتی `remoteHost` تنظیم شده باشد، مسیرهای پیوست راه‌دور را می‌توان از طریق SCP واکشی کرد
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - ریشه‌های پیکربندی‌شده الگوی ریشهٔ پیش‌فرض `/Users/*/Library/Messages/Attachments` را گسترش می‌دهند (ادغام می‌شوند، نه جایگزین)
    - SCP از بررسی سخت‌گیرانهٔ کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازهٔ رسانهٔ خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض 16 MB)

  </Accordion>

  <Accordion title="متن خروجی و قطعه‌بندی">
    - حد قطعهٔ متن: `channels.imessage.textChunkLimit` (پیش‌فرض 4000)
    - حالت قطعه‌بندی: `channels.imessage.streaming.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم ابتدا بر اساس بند)
    - قالب‌بندی پررنگ/مورب/زیرخط‌دار/خط‌خوردهٔ Markdown خروجی به متن با سبک بومی تبدیل می‌شود (گیرندگان macOS 15+ سبک‌بندی را نمایش می‌دهند؛ گیرندگان قدیمی‌تر متن ساده را بدون نشانه‌ها می‌بینند)؛ جدول‌های Markdown مطابق حالت جدول Markdown کانال تبدیل می‌شوند
    - `channels.imessage.sendTransport` (پیش‌فرض `auto`، `bridge`، `applescript`) نحوهٔ تحویل ارسال‌ها توسط `imsg` را انتخاب می‌کند

  </Accordion>

  <Accordion title="قالب‌های آدرس‌دهی">
    مقصدهای صریح ترجیحی:

    - `chat_id:123` (برای مسیریابی پایدار توصیه می‌شود)
    - `chat_guid:...`
    - `chat_identifier:...`

    مقصدهای شناسه نیز پشتیبانی می‌شوند:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## کنش‌های API خصوصی

وقتی `imsg launch` در حال اجرا است و `openclaw channels status --probe` وضعیت `privateApi.available: true` را گزارش می‌کند، ابزار پیام علاوه بر ارسال عادی متن می‌تواند از کنش‌های بومی iMessage استفاده کند.

همهٔ کنش‌ها به‌طور پیش‌فرض فعال‌اند؛ برای غیرفعال‌کردن هر کنش از `channels.imessage.actions` استفاده کنید:

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
  <Accordion title="کنش‌های موجود">
    - **واکنش**: افزودن/حذف tapbackهای iMessage (`messageId`، `emoji`، `remove`). tapbackهای پشتیبانی‌شده به عشق، پسندیدن، نپسندیدن، خنده، تأکید و پرسش نگاشت می‌شوند. حذف بدون ایموجی، هر tapback تنظیم‌شده‌ای را پاک می‌کند.
    - **پاسخ**: ارسال پاسخ رشته‌ای به یک پیام موجود (`messageId`، `text` یا `message`، به‌علاوهٔ `chatGuid`، `chatId`، `chatIdentifier` یا `to`). پاسخ همراه پیوست علاوه بر این به یک ساخت `imsg` نیاز دارد که `send-rich` آن از `--file` پشتیبانی کند.
    - **ارسال با جلوه**: ارسال متن با یک جلوهٔ iMessage (`text` یا `message`، `effect` یا `effectId`). نام‌های کوتاه: slam، loud، gentle، invisibleink، confetti، lasers، fireworks، balloon، heart، echo، happybirthday، shootingstar، sparkles، spotlight.
    - **ویرایش**: ویرایش یک پیام ارسال‌شده در نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`، `text` یا `newText`). فقط پیام‌هایی که خود Gateway ارسال کرده است قابل ویرایش‌اند.
    - **لغو ارسال**: پس‌گرفتن یک پیام ارسال‌شده در نسخه‌های پشتیبانی‌شدهٔ macOS/API خصوصی (`messageId`). فقط پیام‌هایی که خود Gateway ارسال کرده است قابل لغو ارسال‌اند.
    - **بارگذاری فایل**: ارسال رسانه/فایل‌ها (`buffer` به‌صورت base64 یا یک `media`/`path`/`filePath` آماده‌شده، `filename`، و `asVoice` اختیاری). نام مستعار قدیمی: `sendAttachment`.
    - **تغییر نام گروه**، **تنظیم نماد گروه**، **افزودن شرکت‌کننده**، **حذف شرکت‌کننده**، **ترک گروه**: مدیریت گفت‌وگوهای گروهی هنگامی که مقصد فعلی یک مکالمهٔ گروهی است. این کنش‌ها هویت Messages میزبان را تغییر می‌دهند، بنابراین به یک فرستندهٔ مالک یا یک کارخواه Gateway با `operator.admin` نیاز دارند.
    - **نظرسنجی**: ایجاد یک نظرسنجی بومی Apple Messages (`pollQuestion`، تکرار `pollOption` از 2 تا 12 بار، به‌علاوهٔ `chatGuid`، `chatId`، `chatIdentifier` یا `to`). گیرندگان روی iOS/iPadOS/macOS 26+ آن را به‌صورت بومی می‌بینند و رأی می‌دهند؛ نسخه‌های قدیمی‌تر سیستم‌عامل متن جایگزین "یک نظرسنجی ارسال شد" را دریافت می‌کنند. به `selectors.pollPayloadMessage` نیاز دارد.
    - **رأی در نظرسنجی**: رأی‌دادن در یک نظرسنجی موجود (`pollId` یا `messageId`، به‌علاوهٔ دقیقاً یکی از `pollOptionIndex`، `pollOptionId` یا `pollOptionText`). به `selectors.pollVoteMessage` و روش RPC با نام `poll.vote` نیاز دارد.

    نظرسنجی‌های ورودی پذیرفته‌شده برای عامل با پرسش، برچسب‌های شماره‌گذاری‌شدهٔ گزینه‌ها، تعداد آرا و شناسهٔ پیام نظرسنجی مورد نیاز `poll-vote` نمایش داده می‌شوند.

  </Accordion>

  <Accordion title="شناسه‌های پیام">
    زمینهٔ ورودی iMessage، در صورت موجودبودن، هم مقادیر کوتاه `MessageSid` و هم GUIDهای کامل پیام (`MessageSidFull`) را شامل می‌شود. شناسه‌های کوتاه به حافظهٔ نهان اخیر پاسخ مبتنی بر SQLite محدودند و پیش از استفاده در برابر گفت‌وگوی فعلی بررسی می‌شوند. اگر شناسه‌ای کوتاه منقضی شد، هنگام هدف‌گیری مکالمه‌ای که آن را ارائه کرده است، با `MessageSidFull` آن دوباره تلاش کنید. شناسه‌های کامل، قید مکالمه یا حساب را دور نمی‌زنند؛ بنابراین شناسه‌ای از گفت‌وگویی دیگر را با شناسه‌ای از مقصد فعلی جایگزین کنید. فراخوانی‌های واگذارشدهٔ راه‌دور ممکن است شناسه‌های کامل قدیمی را وقتی شواهد مکالمهٔ فعلی در دسترس نیست رد کنند.

  </Accordion>

  <Accordion title="تشخیص قابلیت">
    OpenClaw فقط وقتی کنش‌های API خصوصی را پنهان می‌کند که وضعیت کاوش ذخیره‌شده در حافظهٔ نهان نشان دهد پل در دسترس نیست. اگر وضعیت نامعلوم باشد، کنش‌ها قابل مشاهده می‌مانند و هنگام ارسال، کاوش را به‌صورت تنبل انجام می‌دهند تا نخستین کنش پس از `imsg launch` بدون نوسازی دستی و جداگانهٔ وضعیت موفق شود.

  </Accordion>

  <Accordion title="رسید خواندن و وضعیت تایپ">
    وقتی پل API خصوصی فعال است، گفت‌وگوهای ورودی پذیرفته‌شده خوانده‌شده علامت‌گذاری می‌شوند و به‌محض پذیرفته‌شدن نوبت، در گفت‌وگوهای مستقیم حباب تایپ نمایش داده می‌شود؛ درحالی‌که عامل زمینه را آماده می‌کند و پاسخ را می‌سازد. علامت‌گذاری خوانده‌شدن را با این تنظیم غیرفعال کنید:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    ساخت‌های قدیمی‌تر `imsg` که مربوط به پیش از فهرست قابلیت‌های هر روش‌اند، تایپ/خوانده‌شدن را بی‌صدا غیرفعال می‌کنند؛ OpenClaw در هر راه‌اندازی مجدد یک هشدار یک‌باره ثبت می‌کند تا علت نبود رسید مشخص باشد.

  </Accordion>

  <Accordion title="tapbackهای ورودی">
    OpenClaw در tapbackهای iMessage مشترک می‌شود و واکنش‌های پذیرفته‌شده را به‌جای متن عادی پیام، به‌صورت رویدادهای سیستمی مسیریابی می‌کند؛ بنابراین tapback کاربر چرخهٔ پاسخ عادی را فعال نمی‌کند.

    حالت اعلان با `channels.imessage.reactionNotifications` کنترل می‌شود:

    - `"own"` (پیش‌فرض): فقط وقتی کاربران به پیام‌های نوشته‌شده توسط ربات واکنش نشان می‌دهند اعلان کنید.
    - `"all"`: برای همهٔ tapbackهای ورودی از فرستندگان مجاز اعلان کنید.
    - `"off"`: tapbackهای ورودی را نادیده بگیرید.

    بازنویسی‌های مختص هر حساب از `channels.imessage.accounts.<id>.reactionNotifications` استفاده می‌کنند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید (👍 / 👎)">
    وقتی `approvals.exec.enabled` یا `approvals.plugin.enabled` برابر true باشد و درخواست به iMessage مسیریابی شود، Gateway یک درخواست تأیید را به‌صورت بومی تحویل می‌دهد و برای حل آن یک tapback را می‌پذیرد:

    - `👍` (tapback پسندیدن) → `allow-once`
    - `👎` (tapback نپسندیدن) → `deny`
    - `allow-always` همچنان گزینهٔ جایگزین دستی است: `/approve <id> allow-always` را به‌صورت پاسخ عادی ارسال کنید.

    مدیریت واکنش مستلزم آن است که شناسهٔ کاربر واکنش‌دهنده به‌صراحت در فهرست تأییدکنندگان باشد. فهرست تأییدکنندگان از `channels.imessage.allowFrom` (یا `channels.imessage.accounts.<id>.allowFrom`) خوانده می‌شود؛ شماره‌تلفن کاربر را با قالب E.164 یا ایمیل Apple ID او اضافه کنید (مقصدهای گفت‌وگو مانند `chat_id:*` ورودی معتبر تأییدکننده نیستند). ورودی عام `"*"` پذیرفته می‌شود، اما به هر فرستنده‌ای اجازهٔ تأیید می‌دهد؛ فهرست خالی تأییدکنندگان میان‌بر واکنش را کاملاً غیرفعال می‌کند. میان‌بر واکنش عمداً `reactionNotifications`، `dmPolicy` و `groupAllowFrom` را دور می‌زند، زیرا فهرست مجاز تأییدکنندگان صریح تنها دروازهٔ مؤثر برای حل تأیید است.

    مجوزدهی فرمان متنی `/approve` از همان فهرست پیروی می‌کند: وقتی `channels.imessage.allowFrom` خالی نباشد، `/approve <id> <decision>` در برابر همان فهرست تأییدکنندگان مجاز می‌شود (نه فهرست مجاز گسترده‌تر پیام مستقیم)، و فرستندگانی که در فهرست مجاز پیام مستقیم اجازه دارند اما در `allowFrom` نیستند، رد صریح دریافت می‌کنند. وقتی `allowFrom` خالی باشد، گزینهٔ جایگزین همان گفت‌وگو همچنان برقرار می‌ماند و `/approve` هرکسی را که فهرست مجاز پیام مستقیم اجازه دهد، مجاز می‌کند. هر راهبری را که باید تأیید کند — از طریق `/approve` یا واکنش‌ها — به `allowFrom` اضافه کنید.

    یادداشت‌های اپراتور:
    - اتصال واکنش هم در حافظه و هم در ذخیره‌گاه کلیددار پایدار Gateway نگهداری می‌شود (TTL با زمان انقضای تأیید مطابقت دارد) و Gateway همچنین درخواست‌های در انتظار را برای tapbackها پایش می‌کند؛ بنابراین tapbackای که اندکی پس از راه‌اندازی مجدد Gateway برسد، همچنان تأیید را تعیین تکلیف می‌کند.
    - tapback خود اپراتور با `is_from_me=true` (برای مثال از یک دستگاه Apple جفت‌شده) هنگامی تأیید را تعیین تکلیف می‌کند که آن شناسه به‌صراحت تأییدکننده باشد.
    - درخواست‌های تأیید فقط زمانی به یک گفت‌وگوی گروهی هدایت می‌شوند که تأییدکنندگان صریح پیکربندی شده باشند؛ در غیر این صورت، هر عضو گروه می‌تواند تأیید کند.
    - tapbackهای قدیمی به‌سبک متنی (`Liked "…"` متن ساده از کلاینت‌های بسیار قدیمی Apple) نمی‌توانند تأییدها را تعیین تکلیف کنند، زیرا GUID پیام ندارند؛ تعیین تکلیف واکنش به فرادادهٔ ساختاریافتهٔ tapback نیاز دارد که کلاینت‌های کنونی macOS / iOS منتشر می‌کنند.

  </Accordion>
</AccordionGroup>

## نوشتن پیکربندی

iMessage به‌طور پیش‌فرض اجازه می‌دهد کانال نوشتن پیکربندی را آغاز کند (برای `/config set|unset` هنگامی که `commands.config: true`).

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

## ادغام پیام‌های خصوصی ارسال‌شده به‌صورت تفکیک‌شده (دستور + URL در یک ترکیب)

وقتی کاربر یک دستور و یک URL را با هم تایپ می‌کند — برای مثال `Dump https://example.com/article` — برنامهٔ Messages اپل ارسال را به **دو ردیف جداگانهٔ `chat.db`** تقسیم می‌کند:

1. یک پیام متنی (`"Dump"`).
2. یک حباب پیش‌نمایش URL (`"https://..."`) با تصاویر پیش‌نمایش OG به‌عنوان پیوست.

در اغلب راه‌اندازی‌ها، این دو ردیف با فاصلهٔ حدود 0.8-2.0 ثانیه به OpenClaw می‌رسند. بدون ادغام، عامل در نوبت 1 فقط دستور را دریافت می‌کند (و اغلب پاسخ می‌دهد «URL را برایم بفرست») و سپس URL در نوبت 2 می‌رسد. این خط لولهٔ ارسال اپل است، نه چیزی که OpenClaw یا `imsg` ایجاد کرده باشد.

`channels.imessage.coalesceSameSenderDms` یک پیام خصوصی را برای بافر کردن ردیف‌های متوالی از یک فرستنده فعال می‌کند. هنگامی که `imsg` نشانگر ساختاریافتهٔ پیش‌نمایش URL یعنی `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` را در یکی از ردیف‌های مبدأ ارائه می‌کند، OpenClaw فقط همان ارسال واقعاً تفکیک‌شده را ادغام می‌کند و سایر ردیف‌های بافرشده را به‌صورت نوبت‌های جداگانه نگه می‌دارد. در ساخت‌های قدیمی‌تر `imsg` که هیچ فرادادهٔ حبابی منتشر نمی‌کنند، OpenClaw نمی‌تواند ارسال تفکیک‌شده را از ارسال‌های جداگانه تشخیص دهد؛ بنابراین به ادغام مجموعه بازمی‌گردد. این کار به‌جای تبدیل واپس‌گرایانهٔ ارسال‌های تفکیک‌شدهٔ `Dump <url>` به دو نوبت، رفتار پیش از وجود فراداده را حفظ می‌کند. گفت‌وگوهای گروهی همچنان هر پیام را جداگانه ارسال می‌کنند تا ساختار نوبت چندکاربره حفظ شود.

<Tabs>
  <Tab title="زمان فعال‌سازی">
    در موارد زیر فعال کنید:

    - Skillsهایی ارائه می‌کنید که انتظار دارند `command + payload` در یک پیام باشد (تخلیه، جای‌گذاری، ذخیره، صف‌بندی و غیره).
    - کاربران شما URLها را در کنار دستورها جای‌گذاری می‌کنند.
    - می‌توانید تأخیر افزوده‌شده به نوبت پیام خصوصی را بپذیرید (پایین‌تر را ببینید).

    در موارد زیر غیرفعال نگه دارید:

    - برای محرک‌های تک‌واژه‌ای پیام خصوصی به کمترین تأخیر دستور نیاز دارید.
    - همهٔ جریان‌های شما دستورهای یک‌مرحله‌ای و بدون پیگیری محموله هستند.

  </Tab>
  <Tab title="فعال‌سازی">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // فعال‌سازی اختیاری (پیش‌فرض: false)
        },
      },
    }
    ```

    با روشن بودن پرچم و بدون `messages.inbound.byChannel.imessage` صریح یا `messages.inbound.debounceMs` سراسری، پنجرهٔ رفع نوسان به **7000 ms** افزایش می‌یابد (پیش‌فرض قدیمی 0 ms است — بدون رفع نوسان). پنجرهٔ گسترده‌تر لازم است، زیرا فاصلهٔ ارسال تفکیک‌شدهٔ پیش‌نمایش URL اپل ممکن است هنگام انتشار ردیف پیش‌نمایش توسط Messages.app تا چند ثانیه طول بکشد.

    برای تنظیم دستی پنجره:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms تأخیرهای مشاهده‌شدهٔ پیش‌نمایش URL در Messages.app را پوشش می‌دهد.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="موازنه‌ها">
    - **ادغام دقیق به فرادادهٔ کنونی محمولهٔ `imsg` نیاز دارد.** با وجود `balloon_bundle_id`، فقط ارسال واقعاً تفکیک‌شده ادغام می‌شود؛ ادغام جایگزینِ بدون فراداده که بالاتر توضیح داده شد، یک سازگاری موقت با نسخه‌های پیشین است و پس از آنکه `imsg` ارسال‌های تفکیک‌شده را در بالادست ادغام کند، حذف می‌شود.
    - **تأخیر افزوده برای پیام‌های خصوصی.** با روشن بودن پرچم، هر پیام خصوصی (از جمله دستورهای کنترلی مستقل و پیگیری‌های تک‌متنی) پیش از ارسال، تا پایان پنجرهٔ رفع نوسان منتظر می‌ماند، مبادا ردیف پیش‌نمایش URL در راه باشد. پیام‌های گفت‌وگوی گروهی همچنان فوراً ارسال می‌شوند.
    - **خروجی ادغام‌شده محدود است.** متن ادغام‌شده با نشانگر صریح `…[truncated]` حداکثر 4000 نویسه دارد؛ پیوست‌ها حداکثر 20 مورد هستند؛ ورودی‌های مبدأ حداکثر 10 مورد هستند (در صورت فراتر رفتن، اولین و جدیدترین موارد حفظ می‌شوند). همهٔ GUIDهای مبدأ برای تله‌متری پایین‌دستی در `coalescedMessageGuids` ردیابی می‌شوند.
    - **فقط پیام خصوصی.** گفت‌وگوهای گروهی به ارسال جداگانهٔ هر پیام ادامه می‌دهند تا وقتی چند نفر هم‌زمان در حال تایپ هستند، ربات پاسخ‌گو بماند.
    - **فعال‌سازی اختیاری برای هر کانال.** کانال‌های دیگر (Discord، Slack، Telegram، WhatsApp، …) تحت‌تأثیر قرار نمی‌گیرند. پیکربندی‌های قدیمی BlueBubbles که `channels.bluebubbles.coalesceSameSenderDms` را تنظیم کرده‌اند، باید آن مقدار را به `channels.imessage.coalesceSameSenderDms` منتقل کنند.

  </Tab>
</Tabs>

### سناریوها و آنچه عامل می‌بیند

ستون «پرچم روشن» رفتار یک ساخت `imsg` را نشان می‌دهد که `balloon_bundle_id` را منتشر می‌کند. در ساخت‌های قدیمی‌تر `imsg` که هیچ فرادادهٔ حبابی منتشر نمی‌کنند، ردیف‌های زیر که با «دو نوبت» / «N نوبت» علامت‌گذاری شده‌اند، در عوض به ادغام قدیمی (یک نوبت) بازمی‌گردند: OpenClaw از نظر ساختاری نمی‌تواند ارسال تفکیک‌شده را از ارسال‌های جداگانه تشخیص دهد؛ بنابراین ادغام پیش از وجود فراداده را حفظ می‌کند. جداسازی دقیق پس از آن فعال می‌شود که ساخت، فرادادهٔ حباب را منتشر کند.

| آنچه کاربر می‌نویسد                                                      | آنچه `chat.db` تولید می‌کند                  | پرچم خاموش (پیش‌فرض)                      | پرچم روشن + پنجره (imsg فرادادهٔ حباب منتشر می‌کند)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (یک ارسال)                              | 2 ردیف با فاصلهٔ حدود 1 s                   | دو نوبت عامل: ابتدا «Dump» به‌تنهایی، سپس URL | یک نوبت: متن ادغام‌شدهٔ `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (پیوست + متن)                | 2 ردیف بدون فرادادهٔ حباب URL | دو نوبت                               | پس از مشاهدهٔ فراداده دو نوبت؛ در نشست‌های قدیمی/پیش از قفل‌شدن و بدون فراداده، یک نوبت ادغام‌شده       |
| `/status` (دستور مستقل)                                     | 1 ردیف                               | ارسال فوری                        | **انتظار تا پایان پنجره، سپس ارسال**                                                                |
| فقط URL جای‌گذاری شده                                                   | 1 ردیف                               | ارسال فوری                        | انتظار تا پایان پنجره، سپس ارسال                                                                    |
| متن + URL که عمداً به‌صورت دو پیام جداگانه و با فاصلهٔ چند دقیقه ارسال شده‌اند | 2 ردیف خارج از پنجره               | دو نوبت                               | دو نوبت (پنجره میان آن‌ها منقضی می‌شود)                                                             |
| هجوم سریع (>10 پیام خصوصی کوچک درون پنجره)                          | N ردیف بدون فرادادهٔ حباب URL | N نوبت                                 | پس از مشاهدهٔ فراداده N نوبت؛ در نشست‌های قدیمی/پیش از قفل‌شدن و بدون فراداده، یک نوبت ادغام‌شدهٔ محدود |
| دو نفر در یک گفت‌وگوی گروهی در حال تایپ هستند                                  | N ردیف از M فرستنده               | +M نوبت (یکی برای هر مجموعهٔ فرستنده)        | +M نوبت — گفت‌وگوهای گروهی ادغام نمی‌شوند                                                            |

## بازیابی ورودی پس از راه‌اندازی مجدد پل یا Gateway

iMessage پیام‌هایی را که هنگام ازکارافتادگی Gateway از دست رفته‌اند بازیابی می‌کند و هم‌زمان «بمب انباشت» کهنه‌ای را که اپل ممکن است پس از بازیابی Push تخلیه کند، مهار می‌کند. رفتار پیش‌فرض همیشه فعال است و بر حذف موارد تکراری ورودی بنا شده است.

- **حذف تکرار بازپخش.** هر پیام ورودی ارسال‌شده بر اساس GUID اپل خود در وضعیت پایدار Plugin ثبت می‌شود (`imessage.inbound-dedupe`)، هنگام دریافت ادعا می‌شود و پس از پردازش ثبت نهایی می‌شود (در صورت شکست گذرا آزاد می‌شود تا بتواند دوباره تلاش کند). هر موردی که قبلاً پردازش شده باشد، به‌جای ارسال دوباره حذف می‌شود. این همان چیزی است که اجازه می‌دهد بازیابی بدون ثبت جزئیات تک‌تک پیام‌ها، بازپخش تهاجمی انجام دهد.
- **بازیابی زمان ازکارافتادگی.** هنگام راه‌اندازی، پایشگر آخرین rowid ارسال‌شدهٔ `chat.db` را به خاطر می‌سپارد (یک مکان‌نمای پایدار برای هر حساب) و آن را به‌صورت `since_rowid` به `imsg watch.subscribe` می‌دهد؛ بنابراین imsg ردیف‌هایی را که هنگام ازکارافتادگی Gateway رسیده‌اند بازپخش می‌کند و سپس داده‌های زنده را دنبال می‌کند. بازپخش به 500 ردیف اخیر و پیام‌هایی با حداکثر سن تقریبی 2 ساعت محدود می‌شود و حذف تکرار هر موردی را که قبلاً پردازش شده باشد کنار می‌گذارد.
- **مرز سنی انباشت کهنه.** ردیف‌های بالاتر از مرز راه‌اندازی واقعاً زنده هستند؛ ردیفی که تاریخ ارسالش بیش از حدود 15 دقیقه از زمان رسیدنش قدیمی‌تر باشد، انباشت ناشی از تخلیهٔ Push است و مهار می‌شود. ردیف‌های بازپخش‌شده (در مرز یا پایین‌تر از آن) در عوض از پنجرهٔ بازیابی گسترده‌تر استفاده می‌کنند؛ بنابراین پیام اخیراً ازدست‌رفته تحویل داده می‌شود، اما تاریخچهٔ بسیار قدیمی نه.

بازیابی در راه‌اندازی‌های محلی و راه‌دور `cliPath` کار می‌کند، زیرا بازپخش `since_rowid` روی همان اتصال RPC یعنی `imsg` اجرا می‌شود. تفاوت در پنجره است: وقتی Gateway بتواند `chat.db` را بخواند (محلی)، مرز rowid راه‌اندازی را تثبیت می‌کند، گسترهٔ بازپخش را محدود می‌کند و پیام‌های ازدست‌رفته با حداکثر سن چند ساعت را تحویل می‌دهد. روی یک `cliPath` راه‌دور از طریق SSH نمی‌تواند پایگاه داده را بخواند؛ بنابراین بازپخش بدون سقف است و هر ردیف از مرز سنی زنده استفاده می‌کند — همچنان پیام‌های اخیراً ازدست‌رفته را بازیابی و انباشت قدیمی را مهار می‌کند، اما با پنجرهٔ زندهٔ محدودتر. برای پنجرهٔ بازیابی گسترده‌تر، Gateway را روی Mac میزبان Messages اجرا کنید.

### سیگنال قابل‌مشاهده برای اپراتور

انباشت مهارشده در سطح پیش‌فرض گزارش می‌شود و هرگز بی‌صدا حذف نمی‌شود (پرچم `recovery` نشان می‌دهد کدام پنجره اعمال شده است):

```text
imessage: انباشت ورودی کهنه مهار شد account=<id> sent=<iso> recovery=<bool> (از زمان شروع <N> مورد مهار شده)
```

### مهاجرت

`channels.imessage.catchup.*` منسوخ شده است — بازیابی زمان ازکارافتادگی خودکار است و برای راه‌اندازی‌های جدید به هیچ پیکربندی‌ای نیاز ندارد. پیکربندی‌های موجود با `catchup.enabled: true` همچنان به‌عنوان نمایهٔ سازگاری پنجرهٔ بازپخش بازیابی رعایت می‌شوند. بلوک‌های catchup غیرفعال (`enabled: false` یا بدون `enabled: true`) بازنشسته شده‌اند؛ `openclaw doctor --fix` آن‌ها را حذف می‌کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg یافت نشد یا RPC پشتیبانی نمی‌شود">
    فایل اجرایی و پشتیبانی RPC را اعتبارسنجی کنید:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    اگر کاوشگر گزارش کرد که RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید. اگر کنش‌های API خصوصی در دسترس نیستند، `imsg launch` را در نشست کاربر واردشدهٔ macOS اجرا و دوباره کاوش کنید. اگر Gateway روی macOS اجرا نمی‌شود، به‌جای مسیر محلی پیش‌فرض `imsg` از راه‌اندازی Mac راه‌دور از طریق SSH که بالاتر آمده است استفاده کنید.

  </Accordion>

  <Accordion title="پیام‌ها ارسال می‌شوند، اما iMessageهای ورودی نمی‌رسند">
    ابتدا مشخص کنید که آیا پیام به Mac محلی رسیده است یا خیر. اگر `chat.db` تغییر نکند، OpenClaw حتی وقتی `imsg status --json` یک پل سالم را گزارش می‌کند نیز نمی‌تواند پیام را دریافت کند.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    اگر پیام‌های ارسال‌شده از تلفن هیچ ردیف جدیدی ایجاد نمی‌کنند، پیش از تغییر پیکربندی OpenClaw، لایهٔ Messages و Apple Push در macOS را تعمیر کنید. یک نوسازی یک‌بارهٔ سرویس اغلب کافی است:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    پیش از اشکال‌زدایی نشست‌های OpenClaw، یک iMessage جدید از تلفن ارسال کنید و ایجاد یک ردیف جدید `chat.db` یا رویداد `imsg watch` را تأیید کنید. این کار را به‌صورت یک حلقه دوره‌ای برای راه‌اندازی مجدد پل اجرا نکنید؛ تکرار `imsg launch` همراه با راه‌اندازی‌های مجدد Gateway هنگام کار فعال می‌تواند تحویل‌ها را مختل کند و اجراهای درحال‌انجام کانال را بلاتکلیف بگذارد.

  </Accordion>

  <Accordion title="Gateway در macOS اجرا نمی‌شود">
    `cliPath: "imsg"` پیش‌فرض باید روی Mac واردشده به Messages اجرا شود. در Linux یا Windows، `channels.imessage.cliPath` را روی یک اسکریپت پوششی تنظیم کنید که با SSH به آن Mac متصل شود و `imsg "$@"` را اجرا کند.

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
    موارد زیر را بررسی کنید:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - تأییدهای جفت‌سازی (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="پیام‌های گروهی نادیده گرفته می‌شوند">
    موارد زیر را بررسی کنید:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - رفتار فهرست مجاز `channels.imessage.groups`
    - پیکربندی الگوی اشاره (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="پیوست‌های راه‌دور با شکست مواجه می‌شوند">
    موارد زیر را بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلیدی SSH/SCP از میزبان Gateway
    - وجود کلید میزبان در `~/.ssh/known_hosts` روی میزبان Gateway
    - خوانا بودن مسیر راه‌دور روی Mac اجراکننده Messages

  </Accordion>

  <Accordion title="درخواست‌های مجوز macOS نادیده گرفته شدند">
    فرمان‌ها را دوباره در یک ترمینال گرافیکی تعاملی، در همان زمینه کاربر/نشست، اجرا و درخواست‌ها را تأیید کنید:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأیید کنید که «دسترسی کامل به دیسک» و «خودکارسازی» برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند، اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## ارجاع‌های مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [جفت‌سازی](/fa/channels/pairing)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [حذف BlueBubbles و مسیر iMessage مبتنی بر imsg](/fa/announcements/bluebubbles-imessage) — اطلاعیه و خلاصه مهاجرت
- [مهاجرت از BlueBubbles](/fa/channels/imessage-from-bluebubbles) — جدول تبدیل پیکربندی و انتقال گام‌به‌گام
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و فرایند جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل مبتنی بر اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
