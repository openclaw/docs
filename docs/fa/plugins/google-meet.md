---
read_when:
    - می‌خواهید یک عامل OpenClaw به تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw تماس جدیدی در Google Meet ایجاد کند
    - شما Chrome، Chrome Node یا Twilio را به‌عنوان انتقال‌دهندهٔ Google Meet پیکربندی می‌کنید
summary: 'Google Meet Plugin: پیوستن به URLهای صریح Meet از طریق Chrome یا Twilio با پیش‌فرض‌های صدای بلادرنگ'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-29T23:15:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 09779496b4aad3c854937dfeb69966372dd1a61eaafcf9da06831fa4bad8f34d
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی از شرکت‌کننده Google Meet برای OpenClaw — این Plugin عمدا با طراحی صریح کار می‌کند:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید ایجاد کند و سپس به URL
  بازگردانده‌شده بپیوندد.
- صدای `realtime` حالت پیش‌فرض است.
- صدای بلادرنگ می‌تواند وقتی به استدلال عمیق‌تر یا ابزارها نیاز است، به عامل کامل OpenClaw
  فراخوانی برگشتی انجام دهد.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: برای گوش‌دادن/پاسخ‌گفتن زنده از `realtime` استفاده کنید،
  یا برای پیوستن/کنترل مرورگر بدون پل صدای بلادرنگ از `transcribe` استفاده کنید.
- احراز هویت در ابتدا Google OAuth شخصی یا یک نمایه Chrome از قبل واردشده است.
- هیچ اعلام رضایت خودکاری وجود ندارد.
- بک‌اند صوتی پیش‌فرض Chrome برابر `BlackHole 2ch` است.
- Chrome می‌تواند محلی یا روی میزبان node جفت‌شده اجرا شود.
- Twilio یک شماره تماس ورودی به‌همراه PIN یا توالی DTMF اختیاری را می‌پذیرد.
- فرمان CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر تله‌کنفرانس عامل
  رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید و یک ارائه‌دهنده صدای بلادرنگ بک‌اند را پیکربندی کنید.
OpenAI پیش‌فرض است؛ Google Gemini Live نیز با
`realtime.provider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده Homebrew
قبل از اینکه macOS دستگاه را نمایان کند، به راه‌اندازی مجدد نیاز دارد:

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

خروجی راه‌اندازی برای خواندن توسط عامل و آگاه از حالت طراحی شده است. این خروجی نمایه Chrome،
سنجاق‌کردن node، و برای پیوستن‌های Chrome بلادرنگ، پل صوتی BlackHole/SoX
و بررسی‌های معرفی بلادرنگ با تأخیر را گزارش می‌کند. برای پیوستن‌های فقط مشاهده، همان
انتقال را با `--mode transcribe` بررسی کنید؛ آن حالت پیش‌نیازهای صدای بلادرنگ را رد می‌کند
زیرا از طریق پل گوش نمی‌دهد یا از طریق آن صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌دهد که آیا Plugin
`voice-call` و اعتبارنامه‌های Twilio آماده هستند یا نه. هر بررسی `ok: false` را
قبل از درخواست از یک عامل برای پیوستن، برای انتقال و حالت بررسی‌شده مسدودکننده تلقی کنید.
برای اسکریپت‌ها یا خروجی قابل خواندن توسط ماشین از `openclaw googlemeet setup --json` استفاده کنید.
برای پیش‌پرواز یک انتقال مشخص قبل از اینکه عامل آن را امتحان کند، از `--transport chrome`، `--transport chrome-node`، یا `--transport twilio`
استفاده کنید.

به یک جلسه بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

یا اجازه دهید یک عامل از طریق ابزار `google_meet` بپیوندد:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

یک جلسه جدید ایجاد کنید و به آن بپیوندید:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

فقط URL را بدون پیوستن ایجاد کنید:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` دو مسیر دارد:

- ایجاد با API: وقتی اعتبارنامه‌های Google Meet OAuth پیکربندی شده باشند استفاده می‌شود. این
  قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- جایگزین مرورگر: وقتی اعتبارنامه‌های OAuth وجود نداشته باشند استفاده می‌شود. OpenClaw از node
  سنجاق‌شده Chrome استفاده می‌کند، `https://meet.google.com/new` را باز می‌کند، منتظر می‌ماند Google
  به یک URL واقعی با کد جلسه هدایت کند، سپس آن URL را بازمی‌گرداند. این مسیر نیاز دارد
  که نمایه Chrome مربوط به OpenClaw روی node از قبل به Google وارد شده باشد.
  خودکارسازی مرورگر اعلان بار اول میکروفون خود Meet را مدیریت می‌کند؛ آن اعلان
  به‌عنوان شکست ورود Google تلقی نمی‌شود.
  جریان‌های پیوستن و ایجاد همچنین قبل از بازکردن یک تب جدید تلاش می‌کنند از یک تب Meet موجود
  دوباره استفاده کنند. تطبیق، رشته‌های پرس‌وجوی بی‌ضرر URL مانند `authuser` را نادیده می‌گیرد،
  بنابراین تلاش دوباره عامل باید به‌جای ایجاد تب دوم Chrome، جلسه از قبل باز را متمرکز کند.

خروجی فرمان/ابزار شامل یک فیلد `source` است (`api` یا `browser`) تا عامل‌ها
بتوانند توضیح دهند کدام مسیر استفاده شد. `create` به‌صورت پیش‌فرض به جلسه جدید می‌پیوندد و
`joined: true` به‌همراه نشست پیوستن را بازمی‌گرداند. برای فقط ساختن URL، در CLI از
`create --no-join` استفاده کنید یا `"join": false` را به ابزار پاس دهید.

یا به یک عامل بگویید: «یک Google Meet ایجاد کن، با صدای بلادرنگ به آن بپیوند، و
پیوند را برایم بفرست.» عامل باید `google_meet` را با `action: "create"` فراخوانی کند و
سپس `meetingUri` بازگردانده‌شده را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

برای پیوستن فقط مشاهده/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید. این کار
پل مدل بلادرنگ دوطرفه را شروع نمی‌کند، به BlackHole یا SoX نیاز ندارد،
و در جلسه پاسخ صوتی نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای مجوز
میکروفون/دوربین OpenClaw و مسیر **Use
microphone** در Meet اجتناب می‌کنند. اگر Meet میان‌پرده انتخاب صدا نشان دهد، خودکارسازی
مسیر بدون میکروفون را امتحان می‌کند و در غیر این صورت به‌جای بازکردن
میکروفون محلی، یک اقدام دستی گزارش می‌دهد.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` سلامت مرورگر و پل صوتی
مانند `inCall`، `manualActionRequired`، `providerConnected`,
`realtimeReady`، `audioInputActive`، `audioOutputActive`، مهرهای زمانی آخرین ورودی/خروجی،
شمارنده‌های بایت، و وضعیت بسته‌شدن پل را شامل می‌شود. اگر اعلان امن صفحه Meet
ظاهر شود، خودکارسازی مرورگر وقتی بتواند آن را مدیریت می‌کند. ورود، پذیرش میزبان، و
اعلان‌های مجوز مرورگر/OS به‌عنوان اقدام دستی با دلیل و
پیام برای انتقال توسط عامل گزارش می‌شوند.

پیوستن‌های Chrome محلی از طریق نمایه مرورگر واردشده OpenClaw انجام می‌شوند. حالت بلادرنگ
برای مسیر میکروفون/بلندگو که OpenClaw استفاده می‌کند به `BlackHole 2ch` نیاز دارد. برای
صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا یک گراف به سبک Loopback استفاده کنید؛ یک
دستگاه BlackHole برای اولین آزمون دود کافی است اما می‌تواند پژواک ایجاد کند.

### Gateway محلی + Parallels Chrome

فقط برای اینکه VM مالک Chrome باشد، به یک OpenClaw Gateway کامل یا کلید API مدل داخل VM macOS
نیاز ندارید. Gateway و عامل را محلی اجرا کنید، سپس یک
میزبان node را در VM اجرا کنید. Plugin بسته‌بندی‌شده را یک بار روی VM فعال کنید تا node
فرمان Chrome را اعلام کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهنده بلادرنگ،
  و پیکربندی Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/میزبان node، Google Chrome، SoX، BlackHole 2ch،
  و یک نمایه Chrome واردشده به Google.
- در VM لازم نیست: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا راه‌اندازی
  ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را راه‌اندازی مجدد کنید تا macOS بتواند `BlackHole 2ch` را نمایان کند:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، بررسی کنید VM می‌تواند دستگاه صوتی و فرمان‌های SoX را ببیند:

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

اگر `<gateway-host>` یک IP شبکه LAN است و از TLS استفاده نمی‌کنید، node تا زمانی که برای آن
شبکه خصوصی مورد اعتماد اعلام رضایت نکنید، WebSocket متن ساده را رد می‌کند:

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
`openclaw.json`. وقتی `openclaw node install` این مقدار را در فرمان نصب حاضر ببیند،
آن را در محیط LaunchAgent ذخیره می‌کند.

node را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید Gateway، node را می‌بیند و اینکه هم `googlemeet.chrome`
و هم قابلیت مرورگر/`browser.proxy` را اعلام می‌کند:

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

اکنون از میزبان Gateway به‌صورت عادی بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

یا از عامل بخواهید ابزار `google_meet` را با `transport: "chrome-node"` استفاده کند.

برای یک آزمون دود تک‌فرمانی که یک نشست را ایجاد می‌کند یا دوباره به‌کار می‌گیرد، یک
عبارت شناخته‌شده را می‌گوید، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

در طول پیوستن بلادرنگ، خودکارسازی مرورگر OpenClaw نام مهمان را پر می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان بار اول «Use microphone» در Meet
ظاهر شود آن را می‌پذیرد. هنگام پیوستن فقط مشاهده یا ایجاد جلسه فقط با مرورگر، وقتی آن گزینه
در دسترس باشد، بدون میکروفون از همان اعلان عبور می‌کند.
اگر نمایه مرورگر وارد نشده باشد، Meet منتظر پذیرش میزبان باشد،
Chrome برای پیوستن بلادرنگ به مجوز میکروفون/دوربین نیاز داشته باشد، یا Meet روی اعلانی گیر کرده باشد
که خودکارسازی نتوانسته حل کند، نتیجه join/test-speech
`manualActionRequired: true` را همراه با `manualActionReason` و
`manualActionMessage` گزارش می‌کند. عامل‌ها باید تلاش دوباره برای پیوستن را متوقف کنند، همان
پیام دقیق به‌همراه `browserUrl`/`browserTitle` فعلی را گزارش دهند، و فقط پس از کامل‌شدن
اقدام دستی مرورگر دوباره تلاش کنند.

اگر `chromeNode.node` حذف شود، OpenClaw فقط زمانی خودکار انتخاب می‌کند که دقیقا یک
node متصل، هم `googlemeet.chrome` و هم کنترل مرورگر را اعلام کند. اگر
چند node توانمند متصل باشند، `chromeNode.node` را به شناسه node،
نام نمایشی، یا IP راه دور تنظیم کنید.

بررسی‌های رایج شکست:

- `Configured Google Meet node ... is not usable: offline`: node سنجاق‌شده برای
  Gateway شناخته‌شده است اما در دسترس نیست. عامل‌ها باید آن node را
  وضعیت تشخیصی تلقی کنند، نه یک میزبان Chrome قابل استفاده، و به‌جای بازگشت به انتقال دیگر
  مسدودکننده راه‌اندازی را گزارش کنند مگر اینکه کاربر چنین خواسته باشد.
- `No connected Google Meet-capable node`: در VM، `openclaw node run` را شروع کنید،
  جفت‌سازی را تأیید کنید، و مطمئن شوید `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تأیید کنید میزبان
  Gateway هر دو فرمان node را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز کرده است.
- `BlackHole 2ch audio device not found`: `blackhole-2ch` را روی میزبانی که
  بررسی می‌شود نصب کنید و قبل از استفاده از صدای Chrome محلی راه‌اندازی مجدد کنید.
- `BlackHole 2ch audio device not found on the node`: `blackhole-2ch` را
  در VM نصب کنید و VM را راه‌اندازی مجدد کنید.
- Chrome باز می‌شود اما نمی‌تواند بپیوندد: داخل VM به نمایه مرورگر وارد شوید، یا
  برای پیوستن مهمان `chrome.guestName` را تنظیم‌شده نگه دارید. پیوستن خودکار مهمان از خودکارسازی مرورگر
  OpenClaw از طریق پروکسی مرورگر node استفاده می‌کند؛ مطمئن شوید پیکربندی مرورگر node
  به نمایه مورد نظر شما اشاره می‌کند، برای مثال
  `browser.defaultProfile: "user"` یا یک نمایه نشست موجود با نام.
- تب‌های تکراری Meet: `chrome.reuseExistingTab: true` را فعال نگه دارید. OpenClaw
  قبل از بازکردن تب جدید، تب موجود برای همان URL Meet را فعال می‌کند، و
  ایجاد جلسه مرورگر قبل از بازکردن تب دیگر، یک `https://meet.google.com/new`
  در حال انجام یا تب اعلان حساب Google را دوباره به‌کار می‌گیرد.
- نبود صدا: در Meet، میکروفون/بلندگو را از طریق مسیر دستگاه صوتی مجازی
  مورد استفاده OpenClaw مسیریابی کنید؛ برای صدای دوطرفه تمیز از دستگاه‌های مجازی جداگانه
  یا مسیریابی به سبک Loopback استفاده کنید.

## نکات نصب

پیش‌فرض بی‌درنگ Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin از فرمان‌های صریح دستگاه CoreAudio
  برای پل صوتی پیش‌فرض 24 kHz PCM16 استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این درایور دستگاه صوتی `BlackHole 2ch`
  را ایجاد می‌کند که Chrome/Meet می‌تواند صدا را از مسیر آن عبور دهد.

OpenClaw هیچ‌کدام از این دو بسته را همراه خود ارائه یا بازتوزیع نمی‌کند. مستندات از کاربران می‌خواهند
آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق Homebrew نصب کنند. مجوز SoX برابر با
`LGPL-2.0-only AND GPL-2.0-only` است؛ BlackHole دارای مجوز GPL-3.0 است. اگر یک
نصب‌کننده یا دستگاه آماده می‌سازید که BlackHole را همراه OpenClaw بسته‌بندی می‌کند، شرایط مجوز
بالادستی BlackHole را بررسی کنید یا از Existential Audio مجوز جداگانه بگیرید.

## انتقال‌ها

### Chrome

انتقال Chrome نشانی Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و
با پروفایل مرورگر واردشده‌ی OpenClaw به جلسه می‌پیوندد. در macOS، Plugin پیش از اجرا وجود
`BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز کردن Chrome یک فرمان سلامت پل صوتی
و یک فرمان راه‌اندازی را هم اجرا می‌کند. وقتی Chrome/صدا روی میزبان Gateway قرار دارد از
`chrome` استفاده کنید؛ وقتی Chrome/صدا روی یک node جفت‌شده مانند VM macOS در Parallels قرار دارد از
`chrome-node` استفاده کنید. برای Chrome محلی، پروفایل را با `browser.defaultProfile` انتخاب کنید؛
`chrome.browserProfile` به میزبان‌های `chrome-node` پاس داده می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از طریق پل صوتی محلی OpenClaw مسیردهی کنید.
اگر `BlackHole 2ch` نصب نشده باشد، پیوستن با خطای راه‌اندازی شکست می‌خورد
به‌جای اینکه بی‌سروصدا بدون مسیر صوتی به جلسه بپیوندد.

### Twilio

انتقال Twilio یک برنامه شماره‌گیری سخت‌گیرانه است که به Plugin تماس صوتی واگذار می‌شود. این انتقال
صفحه‌های Meet را برای شماره تلفن‌ها تجزیه نمی‌کند.

وقتی مشارکت Chrome در دسترس نیست یا یک fallback شماره‌گیری تلفنی می‌خواهید، از این روش استفاده کنید.
Google Meet باید برای جلسه یک شماره تماس تلفنی و PIN ارائه کند؛
OpenClaw این موارد را از صفحه Meet کشف نمی‌کند.

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

اعتبارنامه‌های Twilio را از طریق محیط یا پیکربندی ارائه کنید. محیط باعث می‌شود
اسرار از `openclaw.json` بیرون بمانند:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

پس از فعال کردن `voice-call`، Gateway را restart یا reload کنید؛ تغییرات پیکربندی Plugin
تا زمانی که process در حال اجرای Gateway دوباره load نشود در آن ظاهر نمی‌شوند.

سپس بررسی کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی واگذاری Twilio متصل شده باشد، `googlemeet setup` شامل بررسی‌های موفق
`twilio-voice-call-plugin` و `twilio-voice-call-credentials` است.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وقتی جلسه به توالی سفارشی نیاز دارد از `--dtmf-sequence` استفاده کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth و پیش‌بررسی

OAuth برای ایجاد لینک Meet اختیاری است، چون `googlemeet create` می‌تواند به
اتوماسیون مرورگر fallback کند. وقتی ایجاد از طریق API رسمی، resolve کردن space،
یا بررسی‌های پیش‌بررسی Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک Google Cloud OAuth client بسازید،
scopeهای لازم را درخواست کنید، یک حساب Google را authorize کنید، سپس
refresh token حاصل را در پیکربندی Plugin Google Meet ذخیره کنید یا
متغیرهای محیطی `OPENCLAW_GOOGLE_MEET_*` را ارائه دهید.

OAuth جایگزین مسیر پیوستن Chrome نمی‌شود. انتقال‌های Chrome و Chrome-node
همچنان هنگام استفاده از مشارکت مرورگر، از طریق پروفایل Chrome واردشده، BlackHole/SoX،
و یک node متصل به جلسه می‌پیوندند. OAuth فقط برای مسیر رسمی Google
Meet API است: ایجاد meeting spaceها، resolve کردن spaceها، و اجرای بررسی‌های پیش‌بررسی
Meet Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژه Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحه رضایت OAuth را پیکربندی کنید.
   - **Internal** برای یک سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا زمانی که app در Testing است،
     هر حساب Google را که قرار است app را authorize کند به‌عنوان test user اضافه کنید.
4. scopeهایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک OAuth client ID ایجاد کنید.
   - نوع برنامه: **Web application**.
   - URI مجاز redirect:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client ID و client secret را کپی کنید.

`meetings.space.created` برای Google Meet `spaces.create` لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به spaceها resolve کند.
`meetings.conference.media.readonly` برای پیش‌بررسی Meet Media API و کار با media است؛
ممکن است Google برای استفاده واقعی از Media API به ثبت‌نام Developer Preview نیاز داشته باشد.
اگر فقط به پیوستن‌های مبتنی بر مرورگر Chrome نیاز دارید، OAuth را کامل رد کنید.

### ساخت refresh token

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها را به‌عنوان
متغیرهای محیطی پاس دهید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک پیکربندی `oauth` همراه با refresh token چاپ می‌کند. از PKCE،
callback روی localhost در `http://localhost:8085/oauth2callback`، و جریان
کپی/چسباندن دستی با `--manual` استفاده می‌کند.

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

شیء `oauth` را زیر پیکربندی Plugin Google Meet ذخیره کنید:

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

وقتی نمی‌خواهید refresh token در پیکربندی باشد، متغیرهای محیطی را ترجیح دهید.
اگر هم مقدارهای پیکربندی و هم مقدارهای محیط وجود داشته باشند، Plugin ابتدا پیکربندی
و سپس fallback محیط را resolve می‌کند.

رضایت OAuth شامل ایجاد space در Meet، دسترسی خواندن space در Meet، و دسترسی خواندن
media کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه احراز هویت کرده‌اید،
`openclaw googlemeet auth login --json` را دوباره اجرا کنید تا refresh token دارای scope
`meetings.space.created` باشد.

### بررسی OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون افشای secret می‌خواهید، OAuth doctor را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار runtime مربوط به Chrome را load نمی‌کند و به node متصل Chrome نیاز ندارد. بررسی می‌کند
که پیکربندی OAuth وجود داشته باشد و refresh token بتواند access token بسازد.
گزارش JSON فقط فیلدهای وضعیت مانند `ok`، `configured`،
`tokenSource`، `expiresAt` و پیام‌های بررسی را شامل می‌شود؛ access
token، refresh token یا client secret را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنا                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` همراه با `oauth.refreshToken`، یا یک access token کش‌شده، وجود دارد.       |
| `oauth-token`        | access token کش‌شده هنوز معتبر است، یا refresh token یک access token جدید ساخته است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک space موجود در Meet را resolve کرده است.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک space جدید در Meet ایجاد کرده است.                               |

برای اثبات فعال بودن Google Meet API و scope مربوط به `spaces.create` نیز، بررسی
create دارای side effect را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL دورریختنی Meet ایجاد می‌کند. وقتی باید تأیید کنید
پروژه Google Cloud دارای Meet API فعال است و حساب authorize شده
scope `meetings.space.created` را دارد، از آن استفاده کنید.

برای اثبات دسترسی خواندن برای یک meeting space موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک
space موجود را که حساب Google مجاز می‌تواند به آن دسترسی داشته باشد اثبات می‌کنند. `403` از این بررسی‌ها
معمولاً یعنی Google Meet REST API غیرفعال است، refresh token رضایت‌داده‌شده
scope لازم را ندارد، یا حساب Google نمی‌تواند به آن space در Meet دسترسی پیدا کند.
خطای refresh-token یعنی `openclaw googlemeet auth login
--json` را دوباره اجرا کنید و بلوک `oauth` جدید را ذخیره کنید.

برای fallback مرورگر هیچ اعتبارنامه OAuth لازم نیست. در آن حالت، احراز هویت Google
از پروفایل Chrome واردشده روی node انتخاب‌شده می‌آید، نه از
پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان fallback پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` or `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` or `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` or
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` or `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` or `GOOGLE_MEET_PREVIEW_ACK`

یک URL، کد، یا `spaces/{id}` مربوط به Meet را از طریق `spaces.get` resolve کنید:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

پیش از کار با media، پیش‌بررسی را اجرا کنید:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

پس از اینکه Meet رکوردهای کنفرانس را ایجاد کرد، artifactهای جلسه و حضور و غیاب را فهرست کنید:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، `artifacts` و `attendance` به‌طور پیش‌فرض از آخرین رکورد کنفرانس
استفاده می‌کنند. وقتی همه رکوردهای نگه‌داشته‌شده برای آن جلسه را می‌خواهید،
`--all-conference-records` را پاس دهید.

lookup تقویم می‌تواند پیش از خواندن artifactهای Meet، URL جلسه را از Google Calendar
resolve کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` در تقویم `primary` امروز به‌دنبال یک رویداد Calendar با پیوند Google Meet می‌گردد. از `--event <query>` برای جست‌وجوی متن رویدادهای مطابق، و از `--calendar <id>` برای یک تقویم غیر اصلی استفاده کنید. جست‌وجوی Calendar به ورود OAuth تازه‌ای نیاز دارد که محدوده readonly رویدادهای Calendar را شامل شود. `calendar-events` رویدادهای Meet مطابق را پیش‌نمایش می‌کند و رویدادی را علامت می‌زند که `latest`، `artifacts`، `attendance` یا `export` انتخاب خواهد کرد.

اگر از قبل شناسه رکورد کنفرانس را می‌دانید، آن را مستقیم نشانی‌دهی کنید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` وقتی Google آن را برای جلسه در دسترس قرار دهد، فراداده رکورد کنفرانس به‌همراه فراداده منابع شرکت‌کننده، ضبط، رونوشت، ورودی ساختاریافته رونوشت و یادداشت هوشمند را برمی‌گرداند. از `--no-transcript-entries` برای رد کردن جست‌وجوی ورودی در جلسه‌های بزرگ استفاده کنید. `attendance` شرکت‌کنندگان را به ردیف‌های participant-session گسترش می‌دهد، همراه با زمان‌های اولین/آخرین مشاهده، مدت کل نشست، پرچم‌های دیرکرد/ترک زودهنگام، و منابع تکراری شرکت‌کننده که براساس کاربر واردشده یا نام نمایشی ادغام شده‌اند. برای جدا نگه‌داشتن منابع خام شرکت‌کننده، `--no-merge-duplicates` را بدهید؛ برای تنظیم تشخیص دیرکرد، `--late-after-minutes` را بدهید؛ و برای تنظیم تشخیص ترک زودهنگام، `--early-before-minutes` را بدهید.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`، `transcript.md`، `artifacts.json`، `attendance.json` و `manifest.json` می‌نویسد. `manifest.json` ورودی انتخاب‌شده، گزینه‌های export، رکوردهای کنفرانس، فایل‌های خروجی، شمارش‌ها، منبع توکن، رویداد Calendar در صورت استفاده، و هرگونه هشدار بازیابی ناقص را ثبت می‌کند. برای نوشتن یک آرشیو قابل‌حمل کنار پوشه، `--zip` را هم بدهید. برای export متن Google Docs رونوشت پیوندشده و یادداشت هوشمند از طریق Google Drive `files.export`، `--include-doc-bodies` را بدهید؛ این به ورود OAuth تازه‌ای نیاز دارد که محدوده readonly Drive Meet را شامل شود. بدون `--include-doc-bodies`، export فقط فراداده Meet و ورودی‌های ساختاریافته رونوشت را شامل می‌شود. اگر Google یک شکست جزئی artifact برگرداند، مثل خطای فهرست‌کردن یادداشت هوشمند، ورودی رونوشت، یا بدنه سند Drive، خلاصه و manifest هشدار را نگه می‌دارند به‌جای اینکه کل export را ناموفق کنند. از `--dry-run` برای دریافت همان داده‌های artifact/attendance و چاپ JSON مربوط به manifest بدون ایجاد پوشه یا ZIP استفاده کنید. این پیش از نوشتن یک export بزرگ، یا وقتی یک agent فقط به شمارش‌ها، رکوردهای انتخاب‌شده و هشدارها نیاز دارد، مفید است.

Agentها همچنین می‌توانند همان بسته را از طریق ابزار `google_meet` ایجاد کنند:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

برای برگرداندن فقط manifest مربوط به export و رد کردن نوشتن فایل‌ها، `"dryRun": true` را تنظیم کنید.

smoke زنده محافظت‌شده را در برابر یک جلسه واقعی نگه‌داری‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

محیط smoke زنده:

- `OPENCLAW_LIVE_TEST=1` تست‌های زنده محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL، کد، یا `spaces/{id}` نگه‌داری‌شده Meet اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه کلاینت OAuth را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN` توکن refresh را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`، `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های fallback بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

smoke زنده پایه برای artifact/attendance به `https://www.googleapis.com/auth/meetings.space.readonly` و `https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. export بدنه سند Drive به `https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای Meet تازه ایجاد کنید:

```bash
openclaw googlemeet create
```

این فرمان `meeting uri` جدید، منبع و نشست پیوستن را چاپ می‌کند. با اعتبارنامه‌های OAuth، از API رسمی Google Meet استفاده می‌کند. بدون اعتبارنامه‌های OAuth، از نمایه مرورگر واردشده Chrome node پین‌شده به‌عنوان fallback استفاده می‌کند. Agentها می‌توانند از ابزار `google_meet` با `action: "create"` برای ایجاد و پیوستن در یک مرحله استفاده کنند. برای ایجاد فقط URL، `"join": false` را بدهید.

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

اگر fallback مرورگر پیش از اینکه بتواند URL را ایجاد کند به ورود Google یا یک مسدودکننده مجوز Meet برسد، متد Gateway یک پاسخ ناموفق برمی‌گرداند و ابزار `google_meet` به‌جای یک رشته ساده، جزئیات ساختاریافته برمی‌گرداند:

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

وقتی یک agent مقدار `manualActionRequired: true` را می‌بیند، باید `manualActionMessage` به‌همراه زمینه node/tab مرورگر را گزارش کند و تا زمانی که operator مرحله مرورگر را کامل نکرده است، باز کردن تب‌های جدید Meet را متوقف کند.

نمونه خروجی JSON از ایجاد با API:

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

ایجاد یک Meet به‌صورت پیش‌فرض باعث پیوستن می‌شود. انتقال Chrome یا Chrome-node همچنان برای پیوستن از طریق مرورگر به یک نمایه Google Chrome واردشده نیاز دارد. اگر از نمایه خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک خطای fallback مرورگر را گزارش می‌کند و از operator می‌خواهد پیش از تلاش دوباره، ورود به Google را کامل کند.

`preview.enrollmentAcknowledged: true` را فقط پس از تأیید اینکه پروژه Cloud، اصل OAuth و شرکت‌کنندگان جلسه شما در Google Workspace Developer Preview Program برای APIهای رسانه Meet ثبت‌نام شده‌اند، تنظیم کنید.

## پیکربندی

مسیر realtime مشترک Chrome فقط به فعال بودن Plugin، BlackHole، SoX و یک کلید ارائه‌دهنده صدای realtime backend نیاز دارد. OpenAI پیش‌فرض است؛ برای استفاده از Google Gemini Live، `realtime.provider: "google"` را تنظیم کنید:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: شناسه/نام/IP اختیاری node برای `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحه مهمان خارج‌ازحساب Meet استفاده می‌شود
- `chrome.autoJoin: true`: تلاش best-effort برای پر کردن نام مهمان و کلیک Join Now از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال کردن تب Meet موجود به‌جای باز کردن موارد تکراری
- `chrome.waitForInCallMs: 20000`: منتظر ماندن تا تب Meet پیش از فعال شدن معرفی realtime، وضعیت in-call را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت‌فرمان. از `"g711-ulaw-8khz"` فقط برای جفت‌فرمان‌های legacy/custom که همچنان صوت تلفنی تولید می‌کنند استفاده کنید.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch` می‌خواند و صدا را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صدا را در `chrome.audioFormat` می‌خواند و در CoreAudio `BlackHole 2ch` می‌نویسد
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، با `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی آمادگی گفتاری کوتاه وقتی پل realtime وصل می‌شود؛ برای پیوستن بی‌صدا آن را روی `""` تنظیم کنید
- `realtime.agentId`: شناسه اختیاری agent در OpenClaw برای `openclaw_agent_consult`؛ پیش‌فرض `main` است

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
  },
  chromeNode: {
    node: "parallels-macos",
  },
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

`voiceCall.enabled` به‌صورت پیش‌فرض `true` است؛ با انتقال Twilio، تماس PSTN واقعی و DTMF را به Plugin تماس صوتی واگذار می‌کند. اگر `voice-call` فعال نباشد، Google Meet همچنان می‌تواند برنامه شماره‌گیری را اعتبارسنجی و ثبت کند، اما نمی‌تواند تماس Twilio را برقرار کند.

## ابزار

Agentها می‌توانند از ابزار `google_meet` استفاده کنند:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

وقتی Chrome روی میزبان Gateway اجرا می‌شود از `transport: "chrome"` استفاده کنید. وقتی Chrome روی یک node جفت‌شده مثل یک VM در Parallels اجرا می‌شود، از `transport: "chrome-node"` استفاده کنید. در هر دو حالت، مدل realtime و `openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا می‌مانند.

از `action: "status"` برای فهرست کردن نشست‌های فعال یا بررسی یک شناسه نشست استفاده کنید. از `action: "speak"` با `sessionId` و `message` استفاده کنید تا agent realtime بلافاصله صحبت کند. از `action: "test_speech"` برای ایجاد یا استفاده دوباره از نشست، فعال کردن یک عبارت شناخته‌شده، و برگرداندن سلامت `inCall` وقتی میزبان Chrome می‌تواند آن را گزارش کند استفاده کنید. `test_speech` همیشه `mode: "realtime"` را اجباری می‌کند و اگر از آن خواسته شود در `mode: "transcribe"` اجرا شود ناموفق می‌شود، چون نشست‌های فقط مشاهده عمداً نمی‌توانند گفتار تولید کنند. نتیجه `speechOutputVerified` آن بر پایه افزایش بایت‌های خروجی صوت realtime در طول این تماس آزمایشی است، بنابراین یک نشست استفاده‌شده دوباره با صوت قدیمی‌تر به‌عنوان بررسی گفتار موفق تازه محسوب نمی‌شود. از `action: "leave"` برای علامت‌گذاری پایان یک نشست استفاده کنید.

`status` در صورت در دسترس بودن، سلامت Chrome را شامل می‌شود:

- `inCall`: به‌نظر می‌رسد Chrome داخل تماس Meet است
- `micMuted`: وضعیت best-effort میکروفون Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: نمایه مرورگر پیش از اینکه گفتار بتواند کار کند، به ورود دستی، پذیرش میزبان Meet، مجوزها، یا تعمیر کنترل مرورگر نیاز دارد
- `providerConnected` / `realtimeReady`: وضعیت پل صدای realtime
- `lastInputAt` / `lastOutputAt`: آخرین صدای دیده‌شده از پل یا ارسال‌شده به آن

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## مشاورهٔ عامل بلادرنگ

حالت بلادرنگ Chrome برای یک چرخهٔ صوتی زنده بهینه شده است. ارائه‌دهندهٔ صدای بلادرنگ صدای جلسه را می‌شنود و از طریق پل صوتی پیکربندی‌شده صحبت می‌کند. وقتی مدل بلادرنگ به استدلال عمیق‌تر، اطلاعات جاری، یا ابزارهای عادی OpenClaw نیاز داشته باشد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره، عامل معمول OpenClaw را در پشت صحنه با زمینهٔ اخیر رونوشت جلسه اجرا می‌کند و پاسخی کوتاه و گفتاری به نشست صدای بلادرنگ برمی‌گرداند. سپس مدل صوتی می‌تواند آن پاسخ را دوباره در جلسه بگوید. این ابزار از همان ابزار مشترک مشاورهٔ بلادرنگ Voice Call استفاده می‌کند.

به‌طور پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید با یک فضای کاری عامل اختصاصی OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار، حافظه، و تاریخچهٔ نشست مشورت کند، `realtime.agentId` را تنظیم کنید.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را ارائه کنید و عامل معمول را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و `memory_get` محدود کنید.
- `owner`: ابزار مشاوره را ارائه کنید و اجازه دهید عامل معمول از سیاست ابزار عادی عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صدای بلادرنگ قرار ندهید.

کلید نشست مشاوره به ازای هر نشست Meet محدود می‌شود، بنابراین فراخوانی‌های بعدی مشاوره می‌توانند در همان جلسه از زمینهٔ قبلی مشاوره دوباره استفاده کنند.

برای اجبار یک بررسی آمادگی گفتاری پس از اینکه Chrome کاملاً به تماس پیوست:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای دودآزمایی کامل پیوستن و صحبت کردن:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## چک‌لیست آزمون زنده

پیش از سپردن یک جلسه به عامل بدون ناظر، از این توالی استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت مورد انتظار Chrome-node:

- `googlemeet setup` کاملاً سبز است.
- وقتی Chrome-node انتقال پیش‌فرض باشد یا یک گره پین شده باشد، `googlemeet setup` شامل `chrome-node-connected` است.
- `nodes status` نشان می‌دهد گره انتخاب‌شده متصل است.
- گره انتخاب‌شده هر دو مورد `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- زبانهٔ Meet به تماس می‌پیوندد و `test-speech` سلامت Chrome را با `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome راه‌دور مانند ماشین مجازی Parallels macOS، این کوتاه‌ترین بررسی ایمن پس از به‌روزرسانی Gateway یا ماشین مجازی است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند Plugin مربوط به Gateway بارگذاری شده، گره ماشین مجازی با توکن فعلی متصل است، و پل صوتی Meet پیش از اینکه عامل یک زبانهٔ جلسهٔ واقعی را باز کند در دسترس است.

برای دودآزمایی Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را ارائه می‌کند:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin` و `twilio-voice-call-credentials` است.
- `voicecall` پس از بارگذاری دوبارهٔ Gateway در CLI در دسترس است.
- نشست برگشتی دارای `transport: "twilio"` و یک `twilio.voiceCallId` است.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر تازه `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را بازراه‌اندازی یا دوباره بارگذاری کنید. عامل در حال اجرا فقط ابزارهای Plugin ثبت‌شده توسط فرایند فعلی Gateway را می‌بیند.

### هیچ گره متصل سازگار با Google Meet وجود ندارد

روی میزبان گره اجرا کنید:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

روی میزبان Gateway، گره را تأیید کنید و فرمان‌ها را بررسی کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

گره باید متصل باشد و `googlemeet.chrome` به‌علاوهٔ `browser.proxy` را فهرست کند. پیکربندی Gateway باید آن فرمان‌های گره را مجاز بداند:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

اگر `googlemeet setup` در `chrome-node-connected` شکست خورد یا گزارش Gateway خطای `gateway token mismatch` را نشان داد، گره را با توکن فعلی Gateway دوباره نصب یا بازراه‌اندازی کنید. برای یک Gateway در LAN، این معمولاً یعنی:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

سپس سرویس گره را دوباره بارگذاری کنید و دوباره اجرا کنید:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### مرورگر باز می‌شود اما عامل نمی‌تواند بپیوندد

`googlemeet test-speech` را اجرا کنید و سلامت Chrome برگشتی را بررسی کنید. اگر `manualActionRequired: true` را گزارش می‌کند، `manualActionMessage` را به اپراتور نشان دهید و تا زمانی که اقدام مرورگر کامل نشده است، تلاش دوباره را متوقف کنید.

اقدام‌های دستی رایج:

- ورود به نمایهٔ Chrome.
- پذیرش مهمان از حساب میزبان Meet.
- دادن مجوزهای میکروفون/دوربین Chrome وقتی اعلان مجوز بومی Chrome ظاهر می‌شود.
- بستن یا تعمیر یک گفت‌وگوی مجوز گیرکردهٔ Meet.

صرفاً چون Meet نشان می‌دهد «آیا می‌خواهید افراد صدای شما را در جلسه بشنوند؟» گزارش «وارد نشده‌اید» ندهید. این میان‌صفحهٔ انتخاب صوتی Meet است؛ OpenClaw در صورت دسترس‌بودن، از طریق خودکارسازی مرورگر روی **Use microphone** کلیک می‌کند و همچنان منتظر وضعیت واقعی جلسه می‌ماند. برای جایگزین مرورگر فقط-ایجاد، OpenClaw ممکن است روی **Continue without microphone** کلیک کند، چون ایجاد URL به مسیر صوتی بلادرنگ نیاز ندارد.

### ایجاد جلسه شکست می‌خورد

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند، از نقطهٔ پایانی `spaces.create` در Google Meet API استفاده می‌کند. بدون اعتبارنامه‌های OAuth، به مرورگر گره Chrome پین‌شده برمی‌گردد. تأیید کنید:

- برای ایجاد با API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند، یا متغیرهای محیطی مطابق `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ایجاد با API: توکن نوسازی پس از اضافه شدن پشتیبانی ایجاد صادر شده است. توکن‌های قدیمی‌تر ممکن است دامنهٔ `meetings.space.created` را نداشته باشند؛ `openclaw googlemeet auth login --json` را دوباره اجرا کنید و پیکربندی Plugin را به‌روزرسانی کنید.
- برای جایگزین مرورگر: `defaultTransport: "chrome-node"` و `chromeNode.node` به یک گره متصل با `browser.proxy` و `googlemeet.chrome` اشاره می‌کنند.
- برای جایگزین مرورگر: نمایهٔ Chrome مربوط به OpenClaw روی آن گره وارد Google شده و می‌تواند `https://meet.google.com/new` را باز کند.
- برای جایگزین مرورگر: تلاش‌های دوباره پیش از باز کردن زبانهٔ تازه، از یک زبانهٔ موجود `https://meet.google.com/new` یا زبانهٔ درخواست حساب Google دوباره استفاده می‌کنند. اگر عامل زمان‌تمام شد، به‌جای باز کردن دستی یک زبانهٔ Meet دیگر، فراخوانی ابزار را دوباره تلاش کنید.
- برای جایگزین مرورگر: اگر ابزار `manualActionRequired: true` را برگرداند، از `browser.nodeId`، `browser.targetId`، `browserUrl`، و `manualActionMessage` برگشتی برای راهنمایی اپراتور استفاده کنید. تا وقتی آن اقدام کامل نشده، در یک حلقه دوباره تلاش نکنید.
- برای جایگزین مرورگر: اگر Meet نشان داد «آیا می‌خواهید افراد صدای شما را در جلسه بشنوند؟»، زبانه را باز بگذارید. OpenClaw باید از طریق خودکارسازی مرورگر روی **Use microphone** یا، برای جایگزین فقط-ایجاد، روی **Continue without microphone** کلیک کند و همچنان منتظر URL تولیدشدهٔ Meet بماند. اگر نتواند، خطا باید به `meet-audio-choice-required` اشاره کند، نه `google-login-required`.

### عامل می‌پیوندد اما صحبت نمی‌کند

مسیر بلادرنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای شنیدن/پاسخ گفتاری از `mode: "realtime"` استفاده کنید. `mode: "transcribe"` عمداً پل صدای بلادرنگ دوطرفه را شروع نمی‌کند. `googlemeet test-speech` همیشه مسیر بلادرنگ را بررسی می‌کند و گزارش می‌دهد که آیا برای آن فراخوانی، بایت‌های خروجی پل مشاهده شده‌اند یا نه. اگر `speechOutputVerified` نادرست و `speechOutputTimedOut` درست باشد، ارائه‌دهندهٔ بلادرنگ ممکن است گفته را پذیرفته باشد اما OpenClaw ندیده باشد که بایت‌های خروجی جدید به پل صوتی Chrome برسند.

همچنین بررسی کنید:

- یک کلید ارائه‌دهندهٔ بلادرنگ روی میزبان Gateway در دسترس است، مانند `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده است.
- `sox` روی میزبان Chrome وجود دارد.
- میکروفون و بلندگوی Meet از مسیر صوتی مجازی مورد استفادهٔ OpenClaw عبور داده شده‌اند.

`googlemeet doctor [session-id]` نشست، گره، وضعیت درون تماس، دلیل اقدام دستی، اتصال ارائه‌دهندهٔ بلادرنگ، `realtimeReady`، فعالیت ورودی/خروجی صوت، آخرین مُهرهای زمانی صوت، شمارنده‌های بایت، و URL مرورگر را چاپ می‌کند. وقتی به JSON خام نیاز دارید از `googlemeet status [session-id]` استفاده کنید. وقتی لازم است نوسازی OAuth مربوط به Google Meet را بدون افشای توکن‌ها بررسی کنید، از `googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API نیز نیاز دارید، `--meeting` یا `--create-space` را اضافه کنید.

اگر زمان عامل تمام شد و می‌توانید ببینید یک زبانهٔ Meet از قبل باز است، بدون باز کردن زبانهٔ دیگر همان زبانه را بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

اقدام ابزار معادل `recover_current_tab` است. این اقدام یک زبانهٔ Meet موجود را برای انتقال انتخاب‌شده فوکوس و بررسی می‌کند. با `chrome`، از کنترل محلی مرورگر از طریق Gateway استفاده می‌کند؛ با `chrome-node`، از گره Chrome پیکربندی‌شده استفاده می‌کند. زبانهٔ تازه باز نمی‌کند یا نشست تازه نمی‌سازد؛ مانع فعلی را گزارش می‌دهد، مانند وضعیت ورود، پذیرش، مجوزها، یا انتخاب صوت. فرمان CLI با Gateway پیکربندی‌شده صحبت می‌کند، پس Gateway باید در حال اجرا باشد؛ `chrome-node` همچنین نیاز دارد گره Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

`twilio-voice-call-plugin` وقتی `voice-call` مجاز یا فعال نباشد شکست می‌خورد. آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید، و Gateway را دوباره بارگذاری کنید.

`twilio-voice-call-credentials` وقتی پشتانهٔ Twilio شناسهٔ حساب، توکن احراز هویت، یا شمارهٔ تماس‌گیرنده را نداشته باشد شکست می‌خورد. این‌ها را روی میزبان Gateway تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

سپس Gateway را بازراه‌اندازی یا دوباره بارگذاری کنید و اجرا کنید:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌طور پیش‌فرض فقط برای آمادگی است. برای اجرای آزمایشی خشک روی یک شمارهٔ مشخص:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط وقتی `--yes` را اضافه کنید که عمداً می‌خواهید یک تماس اعلان خروجی زنده برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید رویداد Meet جزئیات شماره‌گیری تلفنی را ارائه می‌کند. شمارهٔ دقیق شماره‌گیری و PIN یا یک توالی DTMF سفارشی را بدهید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر ارائه‌دهنده پیش از وارد کردن PIN به مکث نیاز دارد، در `--dtmf-sequence` از `w` ابتدایی یا ویرگول‌ها استفاده کنید.

## یادداشت‌ها

API رسانهٔ رسمی Google Meet دریافت‌محور است، بنابراین صحبت کردن در تماس Meet همچنان به مسیر شرکت‌کننده نیاز دارد. این Plugin آن مرز را آشکار نگه می‌دارد: Chrome مشارکت مرورگر و مسیریابی صوت محلی را مدیریت می‌کند؛ Twilio مشارکت شماره‌گیری تلفنی را مدیریت می‌کند.

حالت بلادرنگ Chrome به `BlackHole 2ch` به‌علاوهٔ یکی از موارد زیر نیاز دارد:

- `chrome.audioInputCommand` به‌همراه `chrome.audioOutputCommand`: OpenClaw مالک پل مدل زمان واقعی است و صدا را با قالب `chrome.audioFormat` بین آن فرمان‌ها و ارائه‌دهندهٔ صدای زمان واقعی انتخاب‌شده منتقل می‌کند. مسیر پیش‌فرض Chrome، PCM16 با 24 کیلوهرتز است؛ G.711 mu-law با 8 کیلوهرتز همچنان برای جفت‌فرمان‌های قدیمی در دسترس است.
- `chrome.audioBridgeCommand`: یک فرمان پل خارجی مالک کل مسیر صدای محلی است و باید پس از شروع یا اعتبارسنجی daemon خود خارج شود.

برای صدای دوطرفهٔ شفاف، خروجی Meet و میکروفون Meet را از طریق دستگاه‌های مجازی جداگانه یا یک گراف دستگاه مجازی به سبک Loopback مسیریابی کنید. یک دستگاه مشترک BlackHole می‌تواند صدای دیگر شرکت‌کنندگان را دوباره به تماس بازگرداند.

`googlemeet speak` پل صدای زمان واقعی فعال را برای یک نشست Chrome فعال می‌کند. `googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق Plugin تماس صوتی واگذار شده‌اند، `leave` همچنین تماس صوتی زیربنایی را قطع می‌کند.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
