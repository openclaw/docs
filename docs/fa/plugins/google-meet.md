---
read_when:
    - می‌خواهید یک عامل OpenClaw به تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - شما در حال پیکربندی Chrome، Chrome node یا Twilio به‌عنوان انتقال‌دهندهٔ Google Meet هستید
summary: 'Google Meet Plugin: پیوستن به URLهای مشخص Meet از طریق Chrome یا Twilio با پیش‌فرض‌های صدای بلادرنگ'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T02:26:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 77ab70d27d47bcc037144c7c6cfad6f93f307355b6ebcf3ee75c85b96a24af2f
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی شرکت‌کننده Google Meet برای OpenClaw — این Plugin عمدا صریح طراحی شده است:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید ایجاد کند، سپس به URL
  بازگردانده‌شده بپیوندد.
- صدای `realtime` حالت پیش‌فرض است.
- صدای بلادرنگ می‌تواند وقتی به استدلال عمیق‌تر یا ابزارها نیاز است، به عامل کامل OpenClaw
  فراخوانی برگشتی انجام دهد.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: برای گوش‌دادن/پاسخ‌گویی زنده از `realtime`
  استفاده کنید، یا برای پیوستن/کنترل مرورگر بدون پل صدای بلادرنگ از `transcribe` استفاده کنید.
- احراز هویت ابتدا به‌صورت OAuth شخصی Google یا یک نمایه Chrome ازپیش واردشده انجام می‌شود.
- هیچ اعلام رضایت خودکاری وجود ندارد.
- پشتانه صوتی پیش‌فرض Chrome، `BlackHole 2ch` است.
- Chrome می‌تواند محلی اجرا شود یا روی یک میزبان node جفت‌شده.
- Twilio یک شماره شماره‌گیری به‌همراه PIN یا توالی DTMF اختیاری را می‌پذیرد؛
  نمی‌تواند مستقیما یک URL Meet را شماره‌گیری کند.
- فرمان CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر تله‌کنفرانس
  عامل رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید و یک ارائه‌دهنده صدای بلادرنگ پشتانه را پیکربندی کنید.
OpenAI پیش‌فرض است؛ Google Gemini Live نیز با
`realtime.provider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده Homebrew
پیش از آنکه macOS دستگاه را در معرض استفاده قرار دهد به راه‌اندازی مجدد نیاز دارد:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، هر دو بخش را بررسی کنید:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin را فعال کنید:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

راه‌اندازی را بررسی کنید:

```bash
openclaw googlemeet setup
```

خروجی راه‌اندازی برای خوانایی توسط عامل و آگاهی از حالت طراحی شده است. نمایه Chrome،
تثبیت node، و برای پیوستن‌های بلادرنگ Chrome، پل صوتی BlackHole/SoX و بررسی‌های
مقدمه بلادرنگ تأخیری را گزارش می‌کند. برای پیوستن‌های فقط مشاهده، همان انتقال را با
`--mode transcribe` بررسی کنید؛ آن حالت پیش‌نیازهای صوتی بلادرنگ را رد می‌کند
چون از طریق پل گوش نمی‌دهد یا از طریق آن صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌دهد که آیا Plugin
`voice-call`، اعتبارنامه‌های Twilio، و در معرض‌گذاری Webhook عمومی آماده هستند یا نه.
هر بررسی `ok: false` را پیش از درخواست از عامل برای پیوستن، به‌عنوان مسدودکننده
برای انتقال و حالت بررسی‌شده در نظر بگیرید. برای اسکریپت‌ها یا خروجی قابل‌خواندن
برای ماشین، از `openclaw googlemeet setup --json` استفاده کنید. برای پیش‌پرواز یک
انتقال مشخص پیش از تلاش عامل، از `--transport chrome`،
`--transport chrome-node`، یا `--transport twilio` استفاده کنید.

برای Twilio، وقتی انتقال پیش‌فرض Chrome است، همیشه انتقال را صریحا پیش‌پرواز کنید:

```bash
openclaw googlemeet setup --transport twilio
```

این کار سیم‌کشی مفقود `voice-call`، اعتبارنامه‌های Twilio، یا در معرض‌گذاری Webhook
غیرقابل‌دسترسی را پیش از تلاش عامل برای شماره‌گیری جلسه می‌گیرد.

به یک جلسه بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

یا اجازه دهید عامل از طریق ابزار `google_meet` بپیوندد:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

ابزار عامل‌محور `google_meet` روی میزبان‌های غیر macOS برای جریان‌های مصنوع، تقویم،
راه‌اندازی، رونویسی، Twilio، و `chrome-node` در دسترس می‌ماند. کنش‌های پاسخ‌گویی
محلی Chrome در آنجا مسدود می‌شوند چون مسیر صوتی Chrome بسته‌بندی‌شده در حال حاضر
به `BlackHole 2ch` در macOS وابسته است. در Linux، برای مشارکت پاسخ‌گویی Chrome از
`mode: "transcribe"`، شماره‌گیری Twilio، یا یک میزبان macOS `chrome-node` استفاده کنید.

یک جلسه جدید ایجاد کنید و به آن بپیوندید:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

برای اتاق‌های ایجادشده با API، وقتی می‌خواهید سیاست بدون درزدن اتاق به‌جای
ارث‌بری از پیش‌فرض‌های حساب Google صریح باشد، از Google Meet `SpaceConfig.accessType`
استفاده کنید:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` اجازه می‌دهد هر کسی با URL Meet بدون درزدن بپیوندد. `TRUSTED` اجازه می‌دهد
کاربران مورد اعتماد سازمان میزبان، کاربران خارجی دعوت‌شده، و کاربران شماره‌گیر
بدون درزدن بپیوندند. `RESTRICTED` ورود بدون درزدن را به دعوت‌شدگان محدود می‌کند.
این تنظیمات فقط برای مسیر ایجاد رسمی Google Meet API اعمال می‌شوند، بنابراین
اعتبارنامه‌های OAuth باید پیکربندی شده باشند.

اگر پیش از در دسترس شدن این گزینه Google Meet را احراز هویت کرده‌اید، پس از افزودن
دامنه `meetings.space.settings` به صفحه رضایت Google OAuth خود،
`openclaw googlemeet auth login --json` را دوباره اجرا کنید.

فقط URL را بدون پیوستن ایجاد کنید:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` دو مسیر دارد:

- ایجاد API: وقتی اعتبارنامه‌های Google Meet OAuth پیکربندی شده باشند استفاده می‌شود. این
  قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- جایگزین مرورگر: وقتی اعتبارنامه‌های OAuth وجود ندارند استفاده می‌شود. OpenClaw از
  node تثبیت‌شده Chrome استفاده می‌کند، `https://meet.google.com/new` را باز می‌کند،
  منتظر می‌ماند تا Google به یک URL واقعی با کد جلسه هدایت کند، سپس آن URL را
  برمی‌گرداند. این مسیر نیاز دارد نمایه Chrome مربوط به OpenClaw روی node از قبل
  وارد Google شده باشد.
  خودکارسازی مرورگر درخواست نخستین‌اجرای میکروفون خود Meet را مدیریت می‌کند؛ آن درخواست
  به‌عنوان شکست ورود Google تلقی نمی‌شود.
  جریان‌های پیوستن و ایجاد همچنین تلاش می‌کنند پیش از باز کردن مورد جدید، از یک زبانه
  Meet موجود دوباره استفاده کنند. تطبیق، رشته‌های پرس‌وجوی بی‌ضرر URL مانند `authuser`
  را نادیده می‌گیرد، بنابراین تلاش دوباره عامل باید به‌جای ایجاد زبانه دوم Chrome،
  جلسه ازقبل‌باز را متمرکز کند.

خروجی فرمان/ابزار شامل یک فیلد `source` (`api` یا `browser`) است تا عامل‌ها بتوانند
توضیح دهند کدام مسیر استفاده شده است. `create` به‌طور پیش‌فرض به جلسه جدید می‌پیوندد و
`joined: true` به‌همراه نشست پیوستن را برمی‌گرداند. برای ضرب‌کردن فقط URL، در CLI از
`create --no-join` استفاده کنید یا `"join": false` را به ابزار پاس دهید.

یا به عامل بگویید: «یک Google Meet ایجاد کن، با صدای بلادرنگ به آن بپیوند، و پیوند را
برای من بفرست.» عامل باید `google_meet` را با `action: "create"` فراخوانی کند و
سپس `meetingUri` بازگردانده‌شده را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

برای پیوستن فقط مشاهده/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید. این کار
پل صدای بلادرنگ دوطرفه را شروع نمی‌کند، به BlackHole یا SoX نیاز ندارد، و در جلسه
پاسخ صوتی نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای مجوز میکروفون/دوربین
OpenClaw و مسیر **Use
microphone** در Meet اجتناب می‌کنند. اگر Meet میان‌پرده انتخاب صدا را نشان دهد،
خودکارسازی مسیر بدون میکروفون را امتحان می‌کند و در غیر این صورت به‌جای باز کردن
میکروفون محلی، یک اقدام دستی گزارش می‌دهد. در حالت رونویسی، انتقال‌های مدیریت‌شده
Chrome همچنین یک ناظر زیرنویس Meet به‌صورت بهترین تلاش نصب می‌کنند. `googlemeet status --json` و
`googlemeet doctor` موارد `captioning`، `captionsEnabledAttempted`,
`transcriptLines`، `lastCaptionAt`، `lastCaptionSpeaker`، `lastCaptionText`,
و یک دنباله کوتاه `recentTranscript` را نشان می‌دهند تا اپراتورها بتوانند بفهمند
آیا مرورگر به تماس پیوسته و آیا زیرنویس‌های Meet متن تولید می‌کنند یا نه.
وقتی به یک کاوش بله/خیر نیاز دارید، از `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
استفاده کنید: در حالت رونویسی می‌پیوندد، منتظر حرکت تازه زیرنویس یا رونویسی می‌ماند،
و `listenVerified`، `listenTimedOut`، فیلدهای اقدام دستی، و آخرین سلامت زیرنویس را
برمی‌گرداند.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` سلامت مرورگر و پل صوتی مانند `inCall`,
`manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`، مهرهای زمانی آخرین ورودی/خروجی،
شمارنده‌های بایت، و وضعیت بسته‌شدن پل را شامل می‌شود. اگر یک درخواست امن صفحه Meet
ظاهر شود، خودکارسازی مرورگر وقتی بتواند آن را مدیریت می‌کند. ورود، پذیرش میزبان، و
درخواست‌های مجوز مرورگر/سیستم‌عامل به‌صورت اقدام دستی با دلیل و پیام برای انتقال توسط
عامل گزارش می‌شوند. نشست‌های مدیریت‌شده Chrome فقط پس از آن عبارت مقدمه یا آزمون را
منتشر می‌کنند که سلامت مرورگر `inCall: true` را گزارش کند؛ در غیر این صورت وضعیت
`speechReady: false` را گزارش می‌دهد و تلاش گفتار به‌جای وانمود کردن به اینکه عامل
در جلسه صحبت کرده است، مسدود می‌شود.

پیوستن‌های محلی Chrome از طریق نمایه مرورگر OpenClaw واردشده انجام می‌شوند. حالت بلادرنگ
برای مسیر میکروفون/بلندگو که OpenClaw استفاده می‌کند به `BlackHole 2ch` نیاز دارد.
برای صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا یک گراف به سبک Loopback استفاده کنید؛
یک دستگاه BlackHole برای نخستین آزمون دود کافی است اما می‌تواند اکو ایجاد کند.

### Gateway محلی + Chrome در Parallels

برای اینکه فقط VM مالک Chrome باشد، به Gateway کامل OpenClaw یا کلید API مدل داخل VM
macOS نیاز **ندارید**. Gateway و عامل را محلی اجرا کنید، سپس یک میزبان node در VM
اجرا کنید. Plugin بسته‌بندی‌شده را یک‌بار روی VM فعال کنید تا node فرمان Chrome را
اعلان کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهنده
  بلادرنگ، و پیکربندی Plugin Google Meet.
- VM macOS در Parallels: CLI/میزبان node OpenClaw، Google Chrome، SoX، BlackHole 2ch،
  و یک نمایه Chrome واردشده به Google.
- در VM لازم نیست: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا راه‌اندازی
  ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را دوباره راه‌اندازی کنید تا macOS، `BlackHole 2ch` را
در معرض استفاده قرار دهد:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، بررسی کنید که VM بتواند دستگاه صوتی و فرمان‌های SoX را ببیند:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

OpenClaw را در VM نصب یا به‌روزرسانی کنید، سپس Plugin بسته‌بندی‌شده را آنجا فعال کنید:

```bash
openclaw plugins enable google-meet
```

میزبان node را در VM شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP شبکه LAN است و از TLS استفاده نمی‌کنید، node اتصال
WebSocket متنی ساده را رد می‌کند مگر اینکه برای آن شبکه خصوصی مورد اعتماد موافقت کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

هنگام نصب node به‌عنوان LaunchAgent از همان متغیر محیطی استفاده کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` محیط فرایند است، نه یک تنظیم
`openclaw.json`. وقتی روی فرمان نصب وجود داشته باشد، `openclaw node install` آن را
در محیط LaunchAgent ذخیره می‌کند.

node را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید که Gateway، node را می‌بیند و اینکه هم `googlemeet.chrome` و هم قابلیت
مرورگر/`browser.proxy` را اعلان می‌کند:

```bash
openclaw nodes status
```

Meet را روی میزبان Gateway از طریق آن node مسیریابی کنید:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

اکنون به‌طور معمول از میزبان Gateway بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

یا از عامل بخواهید ابزار `google_meet` را با `transport: "chrome-node"` استفاده کند.

برای یک آزمون دود تک‌فرمانی که یک نشست را ایجاد می‌کند یا دوباره استفاده می‌کند، یک
عبارت شناخته‌شده می‌گوید، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

هنگام پیوستن بی‌درنگ، اتوماسیون مرورگر OpenClaw نام مهمان را وارد می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان Meet برای انتخاب اولیه «Use microphone»
نمایان شود، آن را می‌پذیرد. هنگام پیوستن فقط برای مشاهده یا ساخت جلسه فقط با مرورگر،
وقتی همان انتخاب در دسترس باشد، بدون میکروفون از همان اعلان عبور می‌کند.
اگر پروفایل مرورگر وارد حساب نشده باشد، Meet منتظر پذیرش میزبان باشد،
Chrome برای پیوستن بی‌درنگ به مجوز میکروفون/دوربین نیاز داشته باشد، یا Meet روی
اعلانی گیر کرده باشد که اتوماسیون نتوانسته آن را برطرف کند، نتیجه join/test-speech مقدار
`manualActionRequired: true` را همراه با `manualActionReason` و
`manualActionMessage` گزارش می‌کند. Agentها باید تلاش دوباره برای پیوستن را متوقف کنند،
همان پیام دقیق را همراه با `browserUrl`/`browserTitle` فعلی گزارش دهند، و فقط پس از
تکمیل اقدام دستی در مرورگر دوباره تلاش کنند.

اگر `chromeNode.node` حذف شود، OpenClaw فقط زمانی به‌صورت خودکار انتخاب می‌کند که دقیقا یک
node متصل هر دو قابلیت `googlemeet.chrome` و کنترل مرورگر را اعلام کرده باشد. اگر
چند node دارای قابلیت متصل باشند، `chromeNode.node` را روی شناسه node،
نام نمایشی، یا IP راه دور تنظیم کنید.

بررسی‌های رایج خطا:

- `Configured Google Meet node ... is not usable: offline`: node پین‌شده برای
  Gateway شناخته‌شده است اما در دسترس نیست. Agentها باید آن node را به‌عنوان
  وضعیت عیب‌یابی در نظر بگیرند، نه میزبان Chrome قابل استفاده، و به‌جای fallback به
  transport دیگر، مانع راه‌اندازی را گزارش دهند مگر اینکه کاربر چنین چیزی خواسته باشد.
- `No connected Google Meet-capable node`: در VM دستور `openclaw node run` را اجرا کنید،
  pairing را تأیید کنید، و مطمئن شوید `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تأیید کنید میزبان
  Gateway هر دو فرمان node را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز می‌داند.
- `BlackHole 2ch audio device not found`: روی میزبانی که بررسی می‌شود
  `blackhole-2ch` را نصب کنید و پیش از استفاده از صدای Chrome محلی reboot کنید.
- `BlackHole 2ch audio device not found on the node`: در VM، `blackhole-2ch`
  را نصب کنید و VM را reboot کنید.
- Chrome باز می‌شود اما نمی‌تواند بپیوندد: داخل VM وارد پروفایل مرورگر شوید، یا
  برای پیوستن مهمان `chrome.guestName` را تنظیم نگه دارید. پیوستن خودکار مهمان از
  اتوماسیون مرورگر OpenClaw از طریق proxy مرورگر node استفاده می‌کند؛ مطمئن شوید config
  مرورگر node به پروفایلی اشاره می‌کند که می‌خواهید، برای نمونه
  `browser.defaultProfile: "user"` یا یک پروفایل named existing-session.
- تب‌های تکراری Meet: گزینه `chrome.reuseExistingTab: true` را فعال نگه دارید. OpenClaw
  پیش از باز کردن تب جدید، تب موجود برای همان URL Meet را فعال می‌کند، و
  ساخت جلسه با مرورگر، پیش از باز کردن تب دیگر، یک تب در حال انجام
  `https://meet.google.com/new` یا تب اعلان حساب Google را reuse می‌کند.
- بدون صدا: در Meet، میکروفون/بلندگو را از مسیر دستگاه صدای مجازی‌ای عبور دهید که
  OpenClaw استفاده می‌کند؛ برای صدای duplex تمیز از دستگاه‌های مجازی جداگانه یا
  routing شبیه Loopback استفاده کنید.

## نکات نصب

پیش‌فرض talk-back در Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin برای audio bridge پیش‌فرض PCM16 با نرخ 24 kHz
  از فرمان‌های صریح دستگاه CoreAudio استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این ابزار دستگاه صوتی `BlackHole 2ch`
  را ایجاد می‌کند که Chrome/Meet می‌توانند از آن route کنند.

OpenClaw هیچ‌کدام از این دو package را bundle یا بازتوزیع نمی‌کند. مستندات از کاربران می‌خواهند
آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق Homebrew نصب کنند. SoX با مجوز
`LGPL-2.0-only AND GPL-2.0-only` منتشر شده است؛ BlackHole تحت GPL-3.0 است. اگر
installer یا applianceای می‌سازید که BlackHole را همراه با OpenClaw bundle می‌کند، شرایط
مجوزدهی upstream BlackHole را بررسی کنید یا از Existential Audio مجوز جداگانه بگیرید.

## Transportها

### Chrome

transport مربوط به Chrome، URL Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و با
پروفایل مرورگر OpenClaw که وارد حساب شده است می‌پیوندد. در macOS، Plugin پیش از launch وجود
`BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز کردن Chrome یک فرمان
سلامت audio bridge و فرمان startup را نیز اجرا می‌کند. وقتی Chrome/صدا روی میزبان
Gateway هستند از `chrome` استفاده کنید؛ وقتی Chrome/صدا روی node جفت‌شده‌ای مثل VM
macOS در Parallels هستند از `chrome-node` استفاده کنید. برای Chrome محلی، پروفایل را با
`browser.defaultProfile` انتخاب کنید؛ `chrome.browserProfile` به میزبان‌های
`chrome-node` پاس داده می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از audio bridge محلی OpenClaw عبور دهید. اگر
`BlackHole 2ch` نصب نشده باشد، پیوستن به‌جای اینکه بی‌صدا و بدون مسیر صوتی انجام شود،
با خطای راه‌اندازی شکست می‌خورد.

### Twilio

transport مربوط به Twilio یک dial plan سخت‌گیرانه است که به Plugin تماس صوتی واگذار می‌شود. این
transport صفحه‌های Meet را برای شماره تلفن parse نمی‌کند.

وقتی مشارکت از طریق Chrome در دسترس نیست یا fallback تماس تلفنی می‌خواهید از این استفاده کنید.
Google Meet باید برای جلسه شماره dial-in و PIN تلفنی ارائه کند؛ OpenClaw آن‌ها را از
صفحه Meet کشف نمی‌کند.

Plugin تماس صوتی را روی میزبان Gateway فعال کنید، نه روی node مربوط به Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

اعتبارنامه‌های Twilio را از طریق environment یا config فراهم کنید. environment باعث می‌شود
secretها خارج از `openclaw.json` بمانند:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

پس از فعال کردن `voice-call`، Gateway را restart یا reload کنید؛ تغییرات config مربوط به Plugin
تا زمانی که reload نشود در فرایند Gateway در حال اجرا ظاهر نمی‌شوند.

سپس بررسی کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی delegation مربوط به Twilio وصل باشد، `googlemeet setup` شامل بررسی‌های موفق
`twilio-voice-call-plugin`، `twilio-voice-call-credentials` و
`twilio-voice-call-webhook` خواهد بود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وقتی جلسه به sequence سفارشی نیاز دارد از `--dtmf-sequence` استفاده کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth و preflight

OAuth برای ساختن لینک Meet اختیاری است، چون `googlemeet create` می‌تواند به
اتوماسیون مرورگر fallback کند. وقتی ساخت از طریق API رسمی، resolution مربوط به space،
یا بررسی‌های preflight در Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک Google Cloud OAuth client بسازید،
scopeهای لازم را درخواست کنید، یک حساب Google را authorize کنید، سپس refresh token حاصل را
در config مربوط به Plugin Google Meet ذخیره کنید یا متغیرهای محیطی
`OPENCLAW_GOOGLE_MEET_*` را فراهم کنید.

OAuth جایگزین مسیر پیوستن با Chrome نمی‌شود. transportهای Chrome و Chrome-node
هنوز هنگام استفاده از مشارکت مرورگری، از طریق پروفایل Chrome واردشده، BlackHole/SoX و
یک node متصل می‌پیوندند. OAuth فقط برای مسیر رسمی Google Meet API است: ساخت meeting
spaceها، resolve کردن spaceها، و اجرای بررسی‌های preflight در Meet Media API.

### ساخت اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژه Google Cloud بسازید یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحه OAuth consent را پیکربندی کنید.
   - **Internal** برای سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا زمانی که app در Testing است،
     هر حساب Google را که قرار است app را authorize کند به‌عنوان test user اضافه کنید.
4. scopeهایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک OAuth client ID بسازید.
   - نوع application: **Web application**.
   - URI مجاز redirect:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client ID و client secret را کپی کنید.

`meetings.space.created` برای `spaces.create` در Google Meet لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به spaceها resolve کند.
`meetings.space.settings` به OpenClaw اجازه می‌دهد هنگام ساخت room از طریق API، تنظیمات
`SpaceConfig` مانند `accessType` را پاس دهد.
`meetings.conference.media.readonly` برای preflight در Meet Media API و کار رسانه‌ای است؛
Google ممکن است برای استفاده واقعی از Media API به ثبت‌نام Developer Preview نیاز داشته باشد.
اگر فقط به پیوستن‌های browser-based در Chrome نیاز دارید، OAuth را کاملا رد کنید.

### ساخت refresh token

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها را به‌عنوان
متغیرهای محیطی پاس دهید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک config به نام `oauth` با refresh token چاپ می‌کند. از PKCE،
callback روی localhost در `http://localhost:8085/oauth2callback`، و flow دستی
copy/paste با `--manual` استفاده می‌کند.

نمونه‌ها:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

وقتی مرورگر نمی‌تواند به callback محلی برسد از حالت دستی استفاده کنید:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

خروجی JSON شامل این موارد است:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

object مربوط به `oauth` را زیر config Plugin مربوط به Google Meet ذخیره کنید:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

وقتی نمی‌خواهید refresh token در config باشد، متغیرهای محیطی را ترجیح دهید.
اگر هم مقدارهای config و هم مقدارهای environment حاضر باشند، Plugin ابتدا config را resolve می‌کند
و سپس به environment fallback می‌کند.

OAuth consent شامل ساخت space در Meet، دسترسی خواندن space در Meet، و دسترسی خواندن رسانه
conference در Meet است. اگر پیش از وجود پشتیبانی ساخت جلسه authenticate کرده‌اید،
`openclaw googlemeet auth login --json` را دوباره اجرا کنید تا refresh token دارای scope
`meetings.space.created` باشد.

### تأیید OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون secret می‌خواهید، OAuth doctor را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار runtime مربوط به Chrome را load نمی‌کند و به node متصل Chrome نیاز ندارد. بررسی می‌کند که
config مربوط به OAuth وجود داشته باشد و refresh token بتواند access token صادر کند. گزارش JSON
فقط شامل فیلدهای وضعیت مانند `ok`، `configured`، `tokenSource`، `expiresAt` و پیام‌های check است؛
access token، refresh token یا client secret را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنی                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌علاوه `oauth.refreshToken`، یا یک access token کش‌شده، حاضر است.       |
| `oauth-token`        | access token کش‌شده هنوز معتبر است، یا refresh token یک access token جدید صادر کرده است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک space موجود Meet را resolve کرده است.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک space جدید Meet ایجاد کرده است.                               |

برای اثبات فعال بودن Google Meet API و scope مربوط به `spaces.create` نیز، بررسی create دارای
side effect را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL موقت Meet ایجاد می‌کند. وقتی لازم است تأیید کنید که پروژه Google Cloud دارای Meet API فعال است و حساب مجاز scope‏ `meetings.space.created` را دارد، از آن استفاده کنید.

برای اثبات دسترسی خواندن به یک فضای جلسه موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک space موجود را که حساب Google مجاز می‌تواند به آن دسترسی داشته باشد اثبات می‌کنند. دریافت `403` از این بررسی‌ها معمولاً یعنی Google Meet REST API غیرفعال است، refresh token تأییدشده scope لازم را ندارد، یا حساب Google نمی‌تواند به آن space در Meet دسترسی داشته باشد. خطای refresh-token یعنی دوباره `openclaw googlemeet auth login
--json` را اجرا کنید و بلوک جدید `oauth` را ذخیره کنید.

برای fallback مرورگر، هیچ اعتبارنامه OAuth لازم نیست. در این حالت، احراز هویت Google از پروفایل Chrome واردشده در Node انتخاب‌شده می‌آید، نه از پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان fallback پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` یا `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` یا `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` یا
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` یا `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` یا `GOOGLE_MEET_PREVIEW_ACK`

یک URL‏ Meet، کد، یا `spaces/{id}` را از طریق `spaces.get` resolve کنید:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

پیش از کار رسانه‌ای، preflight را اجرا کنید:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

پس از اینکه Meet رکوردهای کنفرانس را ایجاد کرد، artifactهای جلسه و حضور را فهرست کنید:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، `artifacts` و `attendance` به‌طور پیش‌فرض از آخرین رکورد کنفرانس استفاده می‌کنند. وقتی همه رکوردهای نگه‌داری‌شده برای آن جلسه را می‌خواهید، `--all-conference-records` را پاس دهید.

جست‌وجوی Calendar می‌تواند پیش از خواندن artifactهای Meet، URL جلسه را از Google Calendar resolve کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` در Calendar‏ `primary` امروز به‌دنبال رویداد Calendar دارای لینک Google Meet می‌گردد. برای جست‌وجوی متن رویدادهای مطابق از `--event <query>`، و برای Calendar غیر primary از `--calendar <id>` استفاده کنید. جست‌وجوی Calendar به یک ورود OAuth تازه نیاز دارد که شامل scope فقط‌خواندنی رویدادهای Calendar باشد.
`calendar-events` رویدادهای Meet مطابق را پیش‌نمایش می‌کند و رویدادی را که `latest`، `artifacts`، `attendance`، یا `export` انتخاب خواهد کرد علامت می‌زند.

اگر از قبل id رکورد کنفرانس را می‌دانید، آن را مستقیماً نشانی‌دهی کنید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

وقتی می‌خواهید اتاق را پس از تماس ببندید، کنفرانس فعال را برای یک space ایجادشده با API پایان دهید:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

این دستور Google Meet‏ `spaces.endActiveConference` را فراخوانی می‌کند و برای spaceای که حساب مجاز می‌تواند مدیریت کند، به OAuth با scope‏ `meetings.space.created` نیاز دارد.
OpenClaw ورودی URL‏ Meet، کد جلسه، یا `spaces/{id}` را می‌پذیرد و پیش از پایان دادن به کنفرانس فعال، آن را به منبع space در API resolve می‌کند.
این دستور از `googlemeet leave` جداست: `leave` مشارکت محلی/نشست OpenClaw را متوقف می‌کند، در حالی که `end-active-conference` از Google Meet می‌خواهد کنفرانس فعال آن space را پایان دهد.

یک گزارش خوانا بنویسید:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` وقتی Google آن را برای جلسه ارائه کند، metadata رکورد کنفرانس به‌همراه metadata منابع participant، recording، transcript، transcript-entry ساخت‌یافته، و smart-note را برمی‌گرداند. برای رد کردن lookup ورودی‌ها در جلسه‌های بزرگ از `--no-transcript-entries` استفاده کنید. `attendance` شرکت‌کنندگان را به ردیف‌های participant-session با زمان‌های اولین/آخرین مشاهده، مدت کل نشست، flagهای دیرآمدن/زودتر ترک‌کردن، و منابع participant تکراری ادغام‌شده بر اساس کاربر واردشده یا نام نمایشی گسترش می‌دهد. برای جدا نگه داشتن منابع خام participant، `--no-merge-duplicates`، برای تنظیم تشخیص دیرآمدن `--late-after-minutes`، و برای تنظیم تشخیص زودتر ترک‌کردن `--early-before-minutes` را پاس دهید.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`، `transcript.md`، `artifacts.json`، `attendance.json`، و `manifest.json` می‌نویسد.
`manifest.json` ورودی انتخاب‌شده، گزینه‌های export، رکوردهای کنفرانس، فایل‌های خروجی، شمارش‌ها، منبع token، رویداد Calendar در صورت استفاده، و هرگونه هشدار بازیابی جزئی را ثبت می‌کند. برای نوشتن یک archive قابل‌حمل کنار پوشه نیز `--zip` را پاس دهید. برای export متن Google Docs مربوط به transcript و smart-note لینک‌شده از طریق Google Drive‏ `files.export`، `--include-doc-bodies` را پاس دهید؛ این کار به یک ورود OAuth تازه نیاز دارد که شامل scope فقط‌خواندنی Drive Meet باشد. بدون `--include-doc-bodies`، exportها فقط شامل metadata‏ Meet و ورودی‌های transcript ساخت‌یافته هستند. اگر Google یک شکست جزئی artifact برگرداند، مانند خطای فهرست smart-note، transcript-entry، یا document-body در Drive، summary و manifest به‌جای شکست دادن کل export، هشدار را نگه می‌دارند.
برای دریافت همان داده‌های artifact/attendance و چاپ JSON مربوط به manifest بدون ایجاد پوشه یا ZIP، از `--dry-run` استفاده کنید. این کار پیش از نوشتن یک export بزرگ یا وقتی agent فقط به شمارش‌ها، رکوردهای انتخاب‌شده، و هشدارها نیاز دارد مفید است.

agentها همچنین می‌توانند همان bundle را از طریق ابزار `google_meet` ایجاد کنند:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

برای بازگرداندن فقط manifest خروجی و رد کردن نوشتن فایل‌ها، `"dryRun": true` را تنظیم کنید.

agentها همچنین می‌توانند یک اتاق مبتنی بر API با policy دسترسی صریح ایجاد کنند:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

و می‌توانند کنفرانس فعال یک اتاق شناخته‌شده را پایان دهند:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

برای اعتبارسنجی listen-first، agentها باید پیش از ادعای مفید بودن جلسه از `test_listen` استفاده کنند:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

live smoke محافظت‌شده را در برابر یک جلسه واقعی نگه‌داری‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

live listen-first browser probe را در برابر جلسه‌ای اجرا کنید که کسی در آن صحبت خواهد کرد و captionهای Meet در دسترس است:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

محیط live smoke:

- `OPENCLAW_LIVE_TEST=1` تست‌های live محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL‏ Meet، کد، یا `spaces/{id}` نگه‌داری‌شده اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه client‏ OAuth را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN` refresh token را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های fallback
  بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

live smoke پایه artifact/attendance به
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. export متن document-body در Drive به
`https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک space تازه Meet ایجاد کنید:

```bash
openclaw googlemeet create
```

این دستور `meeting uri` جدید، منبع، و نشست join را چاپ می‌کند. با اعتبارنامه‌های OAuth از Google Meet API رسمی استفاده می‌کند. بدون اعتبارنامه‌های OAuth از پروفایل مرورگر واردشده Node سنجاق‌شده Chrome به‌عنوان fallback استفاده می‌کند. agentها می‌توانند از ابزار `google_meet` با `action: "create"` برای ایجاد و join در یک مرحله استفاده کنند. برای ایجاد فقط URL، `"join": false` را پاس دهید.

نمونه خروجی JSON از fallback مرورگر:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

اگر fallback مرورگر پیش از اینکه بتواند URL را ایجاد کند به مانع ورود Google یا مجوز Meet برخورد کند، متد Gateway یک پاسخ ناموفق برمی‌گرداند و ابزار `google_meet` به‌جای یک رشته ساده، جزئیات ساخت‌یافته برمی‌گرداند:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

وقتی agent مقدار `manualActionRequired: true` را می‌بیند، باید `manualActionMessage` به‌علاوه context مربوط به Node/زبانه مرورگر را گزارش کند و تا زمانی که operator مرحله مرورگر را کامل نکرده است، باز کردن زبانه‌های جدید Meet را متوقف کند.

نمونه خروجی JSON از create در API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

ایجاد Meet به‌طور پیش‌فرض join می‌کند. transport مربوط به Chrome یا Chrome-node همچنان برای join از طریق مرورگر به یک پروفایل Google Chrome واردشده نیاز دارد. اگر پروفایل خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک خطای fallback مرورگر گزارش می‌کند و از operator می‌خواهد پیش از تلاش دوباره، ورود Google را کامل کند.

`preview.enrollmentAcknowledged: true` را فقط پس از تأیید اینکه پروژه Cloud، اصل OAuth، و شرکت‌کنندگان جلسه شما در Google Workspace Developer Preview Program برای APIهای رسانه‌ای Meet ثبت‌نام شده‌اند تنظیم کنید.

## پیکربندی

مسیر رایج agent در Chrome فقط به فعال بودن Plugin، BlackHole، SoX، یک کلید provider رونویسی realtime، و یک provider‏ TTS پیکربندی‌شده OpenClaw نیاز دارد.
OpenAI provider پیش‌فرض رونویسی است؛ برای استفاده از Google Gemini Live در حالت `bidi`، `realtime.provider: "google"` را تنظیم کنید:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

پیکربندی Plugin را زیر `plugins.entries.google-meet.config` تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

پیش‌فرض‌ها:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` به‌عنوان نام مستعار سازگاری برای
  `"agent"` پذیرفته می‌شود)
- `chromeNode.node`: شناسه/نام/IP اختیاری Node برای `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحه مهمان Meet بدون ورود به حساب استفاده می‌شود
- `chrome.autoJoin: true`: پر کردن نام مهمان و کلیک روی Join Now به‌صورت بهترین تلاش از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال کردن تب Meet موجود به‌جای
  باز کردن موارد تکراری
- `chrome.waitForInCallMs: 20000`: انتظار برای اینکه تب Meet پیش از فعال شدن معرفی بلادرنگ، وضعیت درون‌تماس را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت‌فرمان. فقط برای جفت‌فرمان‌های قدیمی/سفارشی که هنوز صدای تلفنی تولید می‌کنند از
  `"g711-ulaw-8khz"` استفاده کنید.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch`
  می‌خواند و صدا را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صدا را در `chrome.audioFormat`
  می‌خواند و در CoreAudio `BlackHole 2ch` می‌نویسد
- `chrome.bargeInInputCommand`: فرمان اختیاری میکروفون محلی که برای تشخیص ورود گفتار انسان در حین پخش دستیار، PCM مونو little-endian امضادار ۱۶ بیتی می‌نویسد. این مورد در حال حاضر برای پل جفت‌فرمان `chrome` میزبانی‌شده در Gateway اعمال می‌شود.
- `chrome.bargeInRmsThreshold: 650`: سطح RMS که در `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی حساب می‌شود
- `chrome.bargeInPeakThreshold: 2500`: سطح پیک که در `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی حساب می‌شود
- `chrome.bargeInCooldownMs: 900`: حداقل تأخیر بین پاک‌سازی‌های تکراری وقفه انسانی
- `mode: "agent"`: حالت پیش‌فرض پاسخ‌گویی صوتی. گفتار شرکت‌کننده توسط ارائه‌دهنده رونویسی بلادرنگ پیکربندی‌شده رونویسی می‌شود، به عامل OpenClaw پیکربندی‌شده در یک نشست زیرعامل برای هر جلسه ارسال می‌شود و از طریق زمان اجرای معمول TTS در OpenClaw به گفتار برگردانده می‌شود.
- `mode: "bidi"`: حالت جایگزین مستقیم مدل بلادرنگ دوطرفه. ارائه‌دهنده صدای بلادرنگ مستقیما به گفتار شرکت‌کننده پاسخ می‌دهد و ممکن است برای پاسخ‌های عمیق‌تر/پشتوانه‌دار با ابزار، `openclaw_agent_consult` را فراخوانی کند.
- `mode: "transcribe"`: حالت فقط مشاهده بدون پل پاسخ‌گویی صوتی.
- `realtime.provider: "openai"`: شناسه ارائه‌دهنده‌ای که حالت `agent` برای رونویسی بلادرنگ و حالت `bidi` برای صدای بلادرنگ استفاده می‌کند.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، همراه با
  `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی کوتاه گفتاری آمادگی هنگام اتصال پل بلادرنگ؛ برای ورود بی‌صدا آن را روی `""` بگذارید
- `realtime.agentId`: شناسه اختیاری عامل OpenClaw برای
  `openclaw_agent_consult`؛ مقدار پیش‌فرض `main` است

بازنویسی‌های اختیاری:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

پیکربندی فقط Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` به‌صورت پیش‌فرض `true` است؛ با انتقال Twilio، تماس واقعی PSTN، DTMF و خوشامدگویی آغازین را به Plugin تماس صوتی واگذار می‌کند. تماس صوتی پیش از باز کردن جریان رسانه بلادرنگ، توالی DTMF را پخش می‌کند و سپس از متن معرفی ذخیره‌شده به‌عنوان خوشامدگویی اولیه بلادرنگ استفاده می‌کند. اگر `voice-call` فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را اعتبارسنجی و ثبت کند، اما نمی‌تواند تماس Twilio را برقرار کند.

## ابزار

عامل‌ها می‌توانند از ابزار `google_meet` استفاده کنند:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

وقتی Chrome روی میزبان Gateway اجرا می‌شود از `transport: "chrome"` استفاده کنید. وقتی Chrome روی یک Node جفت‌شده مانند VM Parallels اجرا می‌شود از
`transport: "chrome-node"` استفاده کنید. در هر دو حالت، ارائه‌دهندگان مدل و `openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا باقی می‌مانند. با `mode: "agent"` پیش‌فرض، ارائه‌دهنده رونویسی بلادرنگ گوش دادن را انجام می‌دهد، عامل OpenClaw پیکربندی‌شده پاسخ را تولید می‌کند و TTS معمول OpenClaw آن را در Meet پخش می‌کند. وقتی می‌خواهید مدل صدای بلادرنگ مستقیما پاسخ دهد از
`mode: "bidi"` استفاده کنید.
`mode: "realtime"` همچنان به‌عنوان نام مستعار سازگاری برای
`mode: "agent"` پذیرفته می‌شود.

از `action: "status"` برای فهرست کردن نشست‌های فعال یا بررسی یک شناسه نشست استفاده کنید. از `action: "speak"` همراه با `sessionId` و `message` استفاده کنید تا عامل بلادرنگ فورا صحبت کند. از `action: "test_speech"` برای ایجاد یا استفاده مجدد از نشست، فعال کردن یک عبارت شناخته‌شده و برگرداندن سلامت `inCall` وقتی میزبان Chrome بتواند آن را گزارش کند استفاده کنید. `test_speech` همیشه `mode: "agent"` را اجباری می‌کند و اگر درخواست شود در
`mode: "transcribe"` اجرا شود شکست می‌خورد، چون نشست‌های فقط مشاهده عمدا نمی‌توانند گفتار منتشر کنند. نتیجه `speechOutputVerified` آن بر اساس افزایش بایت‌های خروجی صدای بلادرنگ در طول این تماس آزمایشی است، بنابراین نشست استفاده‌شده مجدد با صدای قدیمی‌تر به‌عنوان بررسی گفتار موفق تازه حساب نمی‌شود. از `action: "leave"` برای علامت‌گذاری پایان نشست استفاده کنید.

`status` در صورت دسترس بودن، سلامت Chrome را شامل می‌شود:

- `inCall`: به نظر می‌رسد Chrome داخل تماس Meet است
- `micMuted`: وضعیت میکروفون Meet به‌صورت بهترین تلاش
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: نمایه مرورگر پیش از کار کردن گفتار به ورود دستی، پذیرش توسط میزبان Meet، مجوزها یا تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: آیا گفتار Chrome مدیریت‌شده اکنون مجاز است یا نه. `speechReady: false` یعنی OpenClaw عبارت معرفی/آزمایش را به پل صوتی ارسال نکرد.
- `providerConnected` / `realtimeReady`: وضعیت پل صدای بلادرنگ
- `lastInputAt` / `lastOutputAt`: آخرین صدای دیده‌شده از پل یا ارسال‌شده به آن
- `audioOutputRouted` / `audioOutputDeviceLabel`: آیا خروجی رسانه تب Meet به‌صورت فعال به دستگاه BlackHole استفاده‌شده توسط پل هدایت شده است یا نه
- `lastSuppressedInputAt` / `suppressedInputBytes`: ورودی loopback که هنگام فعال بودن پخش دستیار نادیده گرفته شده است

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## حالت‌های عامل و Bidi

حالت `agent` در Chrome برای رفتار «عامل من در جلسه است» بهینه شده است. ارائه‌دهنده رونویسی بلادرنگ صدای جلسه را می‌شنود، رونویسی‌های نهایی شرکت‌کننده از طریق عامل OpenClaw پیکربندی‌شده هدایت می‌شوند و پاسخ از طریق زمان اجرای معمول TTS در OpenClaw گفته می‌شود. وقتی می‌خواهید مدل صدای بلادرنگ مستقیما پاسخ دهد، `mode: "bidi"` را تنظیم کنید.
قطعه‌های نزدیک رونویسی نهایی پیش از مشاوره با هم ادغام می‌شوند تا یک نوبت گفتاری چند پاسخ جزئی کهنه تولید نکند. ورودی بلادرنگ همچنین تا زمانی که صدای صف‌شده دستیار هنوز در حال پخش است سرکوب می‌شود،
و پژواک‌های اخیر رونویسی شبیه دستیار پیش از مشاوره عامل نادیده گرفته می‌شوند تا loopback مربوط به BlackHole باعث نشود عامل به گفتار خودش پاسخ دهد.

| حالت    | چه کسی پاسخ را تعیین می‌کند        | مسیر خروجی گفتار                     | زمان استفاده                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | عامل OpenClaw پیکربندی‌شده | زمان اجرای معمول TTS در OpenClaw            | وقتی رفتار «عامل من در جلسه است» را می‌خواهید        |
| `bidi`  | مدل صدای بلادرنگ      | پاسخ صوتی ارائه‌دهنده صدای بلادرنگ | وقتی حلقه مکالمه صوتی با کمترین تأخیر را می‌خواهید |

در حالت `bidi`، وقتی مدل بلادرنگ به استدلال عمیق‌تر، اطلاعات فعلی یا ابزارهای معمول OpenClaw نیاز دارد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره در پشت صحنه عامل معمول OpenClaw را با زمینه رونویسی اخیر جلسه اجرا می‌کند و یک پاسخ گفتاری مختصر برمی‌گرداند. در حالت `agent`، OpenClaw آن پاسخ را مستقیما به زمان اجرای TTS ارسال می‌کند؛ در حالت `bidi`، مدل صدای بلادرنگ می‌تواند نتیجه مشاوره را دوباره در جلسه بگوید. این مورد از همان سازوکار مشترک مشاوره Voice Call استفاده می‌کند.

به‌صورت پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید با یک فضای کاری اختصاصی عامل OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار، حافظه و تاریخچه نشست مشورت کند، `realtime.agentId` را تنظیم کنید.

مشاوره‌های حالت عامل از کلید نشست `agent:<id>:subagent:google-meet:<session>` برای هر جلسه استفاده می‌کنند تا پرسش‌های بعدی ضمن به‌ارث بردن سیاست معمول عامل از عامل پیکربندی‌شده، زمینه جلسه را حفظ کنند.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در دسترس قرار می‌دهد و عامل معمول را به
  `read`، `web_search`، `web_fetch`، `x_search`، `memory_search` و
  `memory_get` محدود می‌کند.
- `owner`: ابزار مشاوره را در دسترس قرار می‌دهد و به عامل معمول اجازه می‌دهد از سیاست ابزار معمول عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صدای بلادرنگ قرار نمی‌دهد.

کلید نشست مشاوره برای هر نشست Meet محدود شده است، بنابراین فراخوانی‌های مشاوره بعدی می‌توانند در همان جلسه از زمینه مشاوره قبلی دوباره استفاده کنند.

برای اجبار یک بررسی آمادگی گفتاری پس از اینکه Chrome کاملا وارد تماس شد:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای آزمون کامل پیوستن و گفتار:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## چک‌لیست آزمایش زنده

پیش از سپردن جلسه به یک عامل بدون نظارت، از این توالی استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت مورد انتظار Chrome-node:

- `googlemeet setup` کاملا سبز است.
- وقتی Chrome-node انتقال پیش‌فرض است یا یک Node سنجاق شده است، `googlemeet setup` شامل `chrome-node-connected` می‌شود.
- `nodes status` نشان می‌دهد Node انتخاب‌شده متصل است.
- Node انتخاب‌شده هر دو قابلیت `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- تب Meet به تماس می‌پیوندد و `test-speech` سلامت Chrome را با
  `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome راه‌دور مانند VM macOS در Parallels، این کوتاه‌ترین بررسی امن پس از به‌روزرسانی Gateway یا VM است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند که Plugin مربوط به Gateway بارگذاری شده است، Node مربوط به VM با توکن فعلی متصل است و پل صوتی Meet پیش از اینکه یک عامل تب جلسه واقعی را باز کند در دسترس است.

برای آزمون Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را نشان می‌دهد:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` بررسی‌های سبز `twilio-voice-call-plugin`،
  `twilio-voice-call-credentials`، و `twilio-voice-call-webhook` را شامل می‌شود.
- `voicecall` پس از بارگذاری دوباره Gateway در CLI در دسترس است.
- نشست بازگردانده‌شده دارای `transport: "twilio"` و یک `twilio.voiceCallId` است.
- `openclaw logs --follow` نشان می‌دهد TwiML مربوط به DTMF پیش از TwiML بلادرنگ ارائه شده، سپس یک
  پل بلادرنگ با خوشامدگویی اولیه در صف قرار گرفته است.
- `googlemeet leave <sessionId>` تماس صوتی تفویض‌شده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر همین الان `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را راه‌اندازی مجدد یا دوباره بارگذاری کنید.
عامل در حال اجرا فقط ابزارهای Plugin را می‌بیند که توسط فرایند فعلی Gateway
ثبت شده‌اند.

روی میزبان‌های Gateway غیر از macOS، ابزار روبه‌روی عامل `google_meet` همچنان قابل مشاهده می‌ماند،
اما اقدامات پاسخ صوتی Chrome محلی پیش از رسیدن به پل صوتی مسدود می‌شوند.
صدای پاسخ صوتی Chrome محلی در حال حاضر به `BlackHole 2ch` در macOS وابسته است، بنابراین
عامل‌های Linux باید به‌جای مسیر پیش‌فرض عامل Chrome محلی از `mode: "transcribe"`، تماس ورودی Twilio، یا یک میزبان
`chrome-node` مبتنی بر macOS استفاده کنند.

### هیچ Node سازگار با Google Meet متصل نیست

روی میزبان Node، اجرا کنید:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

روی میزبان Gateway، Node را تأیید کنید و فرمان‌ها را بررسی کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node باید متصل باشد و `googlemeet.chrome` به‌همراه `browser.proxy` را فهرست کند.
پیکربندی Gateway باید آن فرمان‌های Node را مجاز کند:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

اگر `googlemeet setup` در `chrome-node-connected` شکست خورد یا گزارش Gateway
`gateway token mismatch` را نشان داد، Node را با توکن فعلی Gateway دوباره نصب یا راه‌اندازی مجدد کنید. برای یک Gateway در LAN این معمولاً یعنی:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

سپس سرویس Node را دوباره بارگذاری کنید و دوباره اجرا کنید:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### مرورگر باز می‌شود اما عامل نمی‌تواند وارد شود

برای ورودهای فقط مشاهده، `googlemeet test-listen` را اجرا کنید، یا برای ورودهای بلادرنگ
`googlemeet test-speech` را اجرا کنید، سپس سلامت Chrome بازگردانده‌شده را بررسی کنید. اگر هرکدام از آزمون‌ها
`manualActionRequired: true` را گزارش کرد، `manualActionMessage` را به اپراتور
نشان دهید و تا کامل شدن اقدام مرورگر از تلاش مجدد خودداری کنید.

اقدامات دستی رایج:

- به نمایه Chrome وارد شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی اعلان مجوز بومی Chrome ظاهر شد، مجوزهای میکروفون/دوربین Chrome را بدهید.
- گفت‌وگوی گیرکرده مجوز Meet را ببندید یا اصلاح کنید.

صرفاً به این دلیل که Meet نشان می‌دهد "Do you want people to
hear you in the meeting?"، «وارد نشده» گزارش نکنید. این صفحه میانی انتخاب صدا در Meet است؛ OpenClaw
در صورت امکان از طریق خودکارسازی مرورگر روی **Use microphone** کلیک می‌کند و منتظر
وضعیت واقعی جلسه می‌ماند. برای جایگزین مرورگر فقط-ایجاد، OpenClaw
ممکن است روی **Continue without microphone** کلیک کند، چون ایجاد URL به مسیر صدای بلادرنگ نیاز ندارد.

### ایجاد جلسه شکست می‌خورد

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند از endpoint
`spaces.create` در Google Meet API استفاده می‌کند. بدون اعتبارنامه‌های OAuth، به مرورگر Node ثابت‌شده Chrome برمی‌گردد.
تأیید کنید:

- برای ایجاد از طریق API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند،
  یا متغیرهای محیطی مطابق `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ایجاد از طریق API: توکن تازه‌سازی پس از افزوده شدن پشتیبانی ایجاد صادر شده باشد.
  توکن‌های قدیمی‌تر ممکن است scope مربوط به `meetings.space.created` را نداشته باشند؛
  `openclaw googlemeet auth login --json` را دوباره اجرا کنید و پیکربندی Plugin را به‌روزرسانی کنید.
- برای جایگزین مرورگر: `defaultTransport: "chrome-node"` و
  `chromeNode.node` به یک Node متصل با `browser.proxy` و
  `googlemeet.chrome` اشاره می‌کنند.
- برای جایگزین مرورگر: نمایه Chrome متعلق به OpenClaw روی آن Node به Google وارد شده است
  و می‌تواند `https://meet.google.com/new` را باز کند.
- برای جایگزین مرورگر: تلاش‌های مجدد پیش از باز کردن زبانه جدید، از یک
  `https://meet.google.com/new` موجود یا زبانه اعلان حساب Google استفاده می‌کنند. اگر عامل timeout شد،
  به‌جای باز کردن دستی یک زبانه دیگر Meet، فراخوانی ابزار را دوباره تلاش کنید.
- برای جایگزین مرورگر: اگر ابزار `manualActionRequired: true` بازگرداند، از
  `browser.nodeId`، `browser.targetId`، `browserUrl`، و
  `manualActionMessage` بازگردانده‌شده برای راهنمایی اپراتور استفاده کنید. تا کامل شدن آن
  اقدام، در حلقه تلاش مجدد نکنید.
- برای جایگزین مرورگر: اگر Meet نشان داد "Do you want people to hear you in the
  meeting?"، زبانه را باز نگه دارید. OpenClaw باید از طریق خودکارسازی مرورگر روی **Use microphone** یا، برای
  جایگزین فقط-ایجاد، روی **Continue without microphone** کلیک کند
  و همچنان منتظر URL تولیدشده Meet بماند. اگر نتواند، خطا باید به
  `meet-audio-choice-required` اشاره کند، نه `google-login-required`.

### عامل وارد می‌شود اما صحبت نمی‌کند

مسیر بلادرنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای مسیر عادی STT -> عامل OpenClaw -> پاسخ صوتی TTS از `mode: "agent"` استفاده کنید،
یا برای جایگزین مستقیم صدای بلادرنگ از `mode: "bidi"` استفاده کنید. `mode: "transcribe"`
عمداً پل پاسخ صوتی را شروع نمی‌کند. برای اشکال‌زدایی فقط مشاهده،
پس از صحبت کردن شرکت‌کنندگان، `openclaw googlemeet status --json <session-id>` را اجرا کنید
و `captioning`، `transcriptLines`، و `lastCaptionText` را بررسی کنید. اگر `inCall`
true است اما `transcriptLines` روی `0` می‌ماند، ممکن است زیرنویس‌های Meet غیرفعال باشند، از زمان نصب مشاهده‌گر کسی
صحبت نکرده باشد، UI Meet تغییر کرده باشد، یا زیرنویس زنده برای زبان/حساب جلسه
در دسترس نباشد.

`googlemeet test-speech` همیشه مسیر بلادرنگ را بررسی می‌کند و گزارش می‌دهد که آیا
برای آن فراخوانی، بایت‌های خروجی پل مشاهده شده‌اند یا نه. اگر `speechOutputVerified` false و
`speechOutputTimedOut` true باشد، ارائه‌دهنده بلادرنگ ممکن است
گفتار را پذیرفته باشد اما OpenClaw ندیده باشد که بایت‌های خروجی جدید به پل صوتی Chrome
برسند.

همچنین بررسی کنید:

- یک کلید ارائه‌دهنده بلادرنگ روی میزبان Gateway در دسترس باشد، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده باشد.
- `sox` روی میزبان Chrome وجود داشته باشد.
- میکروفون و بلندگوی Meet از مسیر صدای مجازی استفاده‌شده توسط
  OpenClaw عبور داده شده باشند. برای ورودهای بلادرنگ Chrome محلی،
  `doctor` باید `meet output routed: yes` را نشان دهد.

`googlemeet doctor [session-id]` نشست، Node، وضعیت در تماس بودن،
دلیل اقدام دستی، اتصال ارائه‌دهنده بلادرنگ، `realtimeReady`، فعالیت
ورودی/خروجی صدا، آخرین timestampهای صدا، شمارنده‌های بایت، و URL مرورگر را چاپ می‌کند.
وقتی به JSON خام نیاز دارید از `googlemeet status [session-id] --json` استفاده کنید. وقتی
باید تازه‌سازی OAuth مربوط به Google Meet را بدون افشای توکن‌ها بررسی کنید از
`googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API نیز نیاز دارید
`--meeting` یا `--create-space` را اضافه کنید.

اگر عامل timeout شد و می‌توانید ببینید که یک زبانه Meet از قبل باز است، آن زبانه را
بدون باز کردن زبانه دیگر بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

اقدام ابزار معادل `recover_current_tab` است. این اقدام یک زبانه موجود Meet را برای انتقال انتخاب‌شده
در کانون قرار می‌دهد و بررسی می‌کند. با `chrome`، از کنترل مرورگر محلی از طریق Gateway استفاده می‌کند؛ با `chrome-node`،
از Node پیکربندی‌شده Chrome استفاده می‌کند. زبانه جدید باز نمی‌کند یا نشست جدید نمی‌سازد؛
مسدودکننده فعلی را گزارش می‌دهد، مانند ورود، پذیرش، مجوزها، یا وضعیت انتخاب صدا.
فرمان CLI با Gateway پیکربندی‌شده صحبت می‌کند، پس Gateway باید در حال اجرا باشد؛
`chrome-node` همچنین نیاز دارد Node مربوط به Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

`twilio-voice-call-plugin` وقتی `voice-call` مجاز یا فعال نباشد شکست می‌خورد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید، و Gateway را دوباره بارگذاری کنید.

`twilio-voice-call-credentials` وقتی backend مربوط به Twilio فاقد SID حساب،
توکن auth، یا شماره تماس‌گیرنده باشد شکست می‌خورد. این‌ها را روی میزبان Gateway تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` وقتی `voice-call` در معرض Webhook عمومی نباشد،
یا وقتی `publicUrl` به loopback یا فضای شبکه خصوصی اشاره کند، شکست می‌خورد.
`plugins.entries.voice-call.config.publicUrl` را روی URL عمومی ارائه‌دهنده تنظیم کنید یا
یک tunnel/نمایانی Tailscale برای `voice-call` پیکربندی کنید.

URLهای loopback و خصوصی برای callbackهای carrier معتبر نیستند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7`، یا `fd00::/8` به‌عنوان `publicUrl` استفاده نکنید.

برای یک URL عمومی پایدار:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

برای توسعه محلی، به‌جای URL میزبان خصوصی از tunnel یا نمایانی Tailscale استفاده کنید:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

سپس Gateway را راه‌اندازی مجدد یا دوباره بارگذاری کنید و اجرا کنید:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌طور پیش‌فرض فقط آمادگی را بررسی می‌کند. برای اجرای آزمایشی یک شماره مشخص:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط زمانی `--yes` را اضافه کنید که عمداً می‌خواهید یک تماس اعلان خروجی زنده برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید رویداد Meet جزئیات تماس تلفنی ورودی را ارائه می‌کند. شماره دقیق تماس ورودی
و PIN یا یک توالی DTMF سفارشی را بدهید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر ارائه‌دهنده پیش از وارد کردن PIN به مکث نیاز دارد، از `w` ابتدایی یا ویرگول‌ها در
`--dtmf-sequence` استفاده کنید.

اگر تماس تلفنی ساخته شد اما فهرست شرکت‌کنندگان Meet هرگز شرکت‌کننده تماس ورودی را نشان نداد:

- `openclaw googlemeet doctor <session-id>` را اجرا کنید تا ID تماس Twilio تفویض‌شده،
  اینکه DTMF در صف بوده یا نه، و اینکه خوشامدگویی آغازین درخواست شده یا نه را تأیید کنید.
- `openclaw voicecall status --call-id <id>` را اجرا کنید و تأیید کنید تماس همچنان
  فعال است.
- `openclaw voicecall tail` را اجرا کنید و بررسی کنید Webhookهای Twilio به
  Gateway می‌رسند.
- `openclaw logs --follow` را اجرا کنید و به‌دنبال توالی Twilio Meet بگردید: Google
  Meet ورود را تفویض می‌کند، Voice Call مسیر تلفنی را شروع می‌کند، Google Meet
  `voiceCall.dtmfDelayMs` صبر می‌کند، با `voicecall.dtmf` DTMF می‌فرستد،
  `voiceCall.postDtmfSpeechDelayMs` صبر می‌کند، سپس با
  `voicecall.speak` گفتار آغازین را درخواست می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ بررسی سبز راه‌اندازی
  لازم است اما ثابت نمی‌کند توالی PIN جلسه درست است.
- تأیید کنید شماره تماس ورودی به همان دعوت‌نامه و منطقه Meet مربوط به PIN تعلق دارد.
- اگر Meet کند پاسخ می‌دهد یا transcript تماس پس از ارسال DTMF همچنان
  اعلان درخواست PIN را نشان می‌دهد، `voiceCall.dtmfDelayMs` را افزایش دهید.
- اگر شرکت‌کننده وارد شد اما خوشامدگویی را نمی‌شنوید، در
  `openclaw logs --follow` درخواست پس از DTMF مربوط به `voicecall.speak` و
  پخش TTS از طریق media-stream یا جایگزین Twilio `<Say>` را بررسی کنید. اگر transcript تماس
  همچنان شامل "enter the meeting PIN" است، مسیر تلفنی هنوز وارد اتاق Meet نشده است،
  پس شرکت‌کنندگان جلسه گفتار را نخواهند شنید.

اگر Webhookها نمی‌رسند، ابتدا Voice Call Plugin را عیب‌یابی کنید: ارائه‌دهنده باید به `plugins.entries.voice-call.config.publicUrl` یا تونل پیکربندی‌شده دسترسی داشته باشد.
[عیب‌یابی تماس صوتی](/fa/plugins/voice-call#troubleshooting) را ببینید.

## یادداشت‌ها

API رسمی رسانه‌ای Google Meet دریافت‌محور است، بنابراین صحبت کردن در یک تماس Meet همچنان به یک مسیر شرکت‌کننده نیاز دارد. این Plugin این مرز را آشکار نگه می‌دارد:
Chrome مشارکت مرورگر و مسیریابی صوت محلی را مدیریت می‌کند؛ Twilio مشارکت شماره‌گیری تلفنی را مدیریت می‌کند.

حالت‌های پاسخ‌گویی صوتی Chrome به `BlackHole 2ch` به‌علاوه یکی از موارد زیر نیاز دارند:

- `chrome.audioInputCommand` به‌همراه `chrome.audioOutputCommand`: OpenClaw مالک پل است و صوت را با `chrome.audioFormat` بین این دستورها و ارائه‌دهنده انتخاب‌شده لوله‌کشی می‌کند. حالت agent از رونویسی بی‌درنگ به‌همراه TTS معمولی استفاده می‌کند؛ حالت bidi از ارائه‌دهنده صدای بی‌درنگ استفاده می‌کند. مسیر پیش‌فرض Chrome برابر با PCM16 با نرخ 24 کیلوهرتز است؛ G.711 mu-law با نرخ 8 کیلوهرتز همچنان برای جفت‌دستورهای قدیمی در دسترس است.
- `chrome.audioBridgeCommand`: یک دستور پل خارجی مالک کل مسیر صوت محلی است و باید پس از راه‌اندازی یا اعتبارسنجی daemon خود خارج شود. این فقط برای `bidi` معتبر است، زیرا حالت `agent` برای TTS به دسترسی مستقیم جفت‌دستور نیاز دارد.

برای صوت دوطرفه تمیز، خروجی Meet و میکروفون Meet را از طریق دستگاه‌های مجازی جداگانه یا یک گراف دستگاه مجازی به سبک Loopback مسیریابی کنید. یک دستگاه BlackHole مشترک واحد می‌تواند صدای دیگر شرکت‌کنندگان را دوباره به تماس بازتاب دهد.

با پل Chrome مبتنی بر جفت‌دستور، `chrome.bargeInInputCommand` می‌تواند به یک میکروفون محلی جداگانه گوش دهد و وقتی انسان شروع به صحبت می‌کند، پخش دستیار را پاک کند. این کار گفتار انسان را حتی وقتی ورودی local loopback مشترک BlackHole هنگام پخش دستیار موقتاً سرکوب شده است، جلوتر از خروجی دستیار نگه می‌دارد.
مانند `chrome.audioInputCommand` و `chrome.audioOutputCommand`، این یک دستور محلی پیکربندی‌شده توسط اپراتور است. از یک مسیر دستور یا فهرست آرگومان صریح و مورداعتماد استفاده کنید و آن را به اسکریپت‌های مکان‌های نامطمئن اشاره ندهید.

`googlemeet speak` پل صوتی پاسخ‌گویی فعال را برای یک نشست Chrome فعال می‌کند. `googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق Voice Call Plugin واگذار شده‌اند، `leave` تماس صوتی زیربنایی را نیز قطع می‌کند.
وقتی می‌خواهید کنفرانس فعال Google Meet را نیز برای یک فضای مدیریت‌شده با API ببندید، از `googlemeet end-active-conference` استفاده کنید.

## مرتبط

- [Voice Call Plugin](/fa/plugins/voice-call)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
