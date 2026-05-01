---
read_when:
    - می‌خواهید یک عامل OpenClaw به تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - شما در حال پیکربندی Chrome، Chrome node یا Twilio به‌عنوان انتقال Google Meet هستید
summary: 'Plugin Google Meet: پیوستن به URLهای صریح Meet از طریق Chrome یا Twilio با پیش‌فرض‌های صوتی بلادرنگ'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T11:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی مشارکت‌کننده Google Meet برای OpenClaw — Plugin عمدا صریح طراحی شده است:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید ایجاد کند، سپس به URL
  بازگردانده‌شده بپیوندد.
- حالت پیش‌فرض صدا `realtime` است.
- صدای بلادرنگ می‌تواند وقتی استدلال عمیق‌تر یا ابزارها لازم باشند، دوباره
  عامل کامل OpenClaw را فراخوانی کند.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: برای گوش‌دادن/پاسخ‌دادن زنده
  از `realtime` استفاده کنید، یا برای پیوستن/کنترل مرورگر بدون پل صدای بلادرنگ
  از `transcribe` استفاده کنید.
- احراز هویت به‌صورت Google OAuth شخصی یا یک پروفایل Chrome که از قبل وارد شده
  است شروع می‌شود.
- اعلام رضایت خودکار وجود ندارد.
- بک‌اند صدای پیش‌فرض Chrome برابر `BlackHole 2ch` است.
- Chrome می‌تواند محلی یا روی یک میزبان Node جفت‌شده اجرا شود.
- Twilio یک شماره تماس ورودی به‌همراه PIN اختیاری یا دنباله DTMF را می‌پذیرد.
- دستور CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر کنفرانس
  تلفنی عامل رزرو شده است.

## شروع سریع

وابستگی‌های صدای محلی را نصب کنید و یک ارائه‌دهنده صدای بلادرنگ بک‌اند را
پیکربندی کنید. OpenAI پیش‌فرض است؛ Google Gemini Live هم با
`realtime.provider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صدای مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده
Homebrew قبل از اینکه macOS دستگاه را آشکار کند، به راه‌اندازی مجدد نیاز دارد:

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

خروجی راه‌اندازی برای خواندن توسط عامل و آگاه از حالت طراحی شده است. این خروجی
پروفایل Chrome، سنجاق‌کردن Node، و برای پیوستن‌های Chrome بلادرنگ، پل صدای
BlackHole/SoX و بررسی‌های مقدمه بلادرنگ با تأخیر را گزارش می‌کند. برای
پیوستن‌های فقط مشاهده، همان انتقال را با `--mode transcribe` بررسی کنید؛ آن حالت
پیش‌نیازهای صدای بلادرنگ را رد می‌کند چون از طریق پل گوش نمی‌دهد یا از طریق آن
صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌کند که آیا
Plugin `voice-call`، اعتبارنامه‌های Twilio و در معرض‌بودن Webhook عمومی آماده
هستند یا نه. هر بررسی `ok: false` را پیش از درخواست از عامل برای پیوستن، به‌عنوان
مسدودکننده برای انتقال و حالت بررسی‌شده در نظر بگیرید. برای اسکریپت‌ها یا خروجی
قابل‌خواندن برای ماشین از `openclaw googlemeet setup --json` استفاده کنید. برای
پیش‌پرواز یک انتقال مشخص پیش از تلاش عامل، از `--transport chrome`,
`--transport chrome-node` یا `--transport twilio` استفاده کنید.

برای Twilio، وقتی انتقال پیش‌فرض Chrome است، همیشه انتقال را به‌صورت صریح
پیش‌پرواز کنید:

```bash
openclaw googlemeet setup --transport twilio
```

این کار سیم‌کشی گم‌شده `voice-call`، اعتبارنامه‌های Twilio یا در معرض‌بودن
Webhook غیرقابل‌دسترسی را پیش از تلاش عامل برای شماره‌گیری جلسه تشخیص می‌دهد.

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

- ایجاد با API: وقتی اعتبارنامه‌های Google Meet OAuth پیکربندی شده باشند استفاده
  می‌شود. این قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- جایگزین مرورگر: وقتی اعتبارنامه‌های OAuth وجود ندارند استفاده می‌شود. OpenClaw
  از Node سنجاق‌شده Chrome استفاده می‌کند، `https://meet.google.com/new` را باز
  می‌کند، منتظر می‌ماند Google به یک URL واقعی با کد جلسه هدایت کند، سپس آن URL
  را بازمی‌گرداند. این مسیر نیاز دارد که پروفایل OpenClaw Chrome روی Node از قبل
  وارد Google شده باشد.
  خودکارسازی مرورگر اعلان میکروفون اجرای نخست خود Meet را مدیریت می‌کند؛ آن
  اعلان به‌عنوان شکست ورود Google در نظر گرفته نمی‌شود.
  گردش‌های پیوستن و ایجاد همچنین تلاش می‌کنند پیش از بازکردن تب جدید، از تب
  موجود Meet دوباره استفاده کنند. تطبیق، رشته‌های پرس‌وجوی بی‌ضرر URL مانند
  `authuser` را نادیده می‌گیرد، پس تلاش دوباره عامل باید به‌جای ایجاد تب دوم
  Chrome، جلسه باز موجود را متمرکز کند.

خروجی دستور/ابزار شامل فیلد `source` (`api` یا `browser`) است تا عامل‌ها بتوانند
توضیح دهند کدام مسیر استفاده شد. `create` به‌صورت پیش‌فرض به جلسه جدید می‌پیوندد
و `joined: true` به‌همراه نشست پیوستن را بازمی‌گرداند. برای فقط ساختن URL، در
CLI از `create --no-join` استفاده کنید یا `"join": false` را به ابزار بدهید.

یا به عامل بگویید: «یک Google Meet ایجاد کن، با صدای بلادرنگ به آن بپیوند، و
پیوند را برایم بفرست.» عامل باید `google_meet` را با `action: "create"` فراخوانی
کند و سپس `meetingUri` بازگردانده‌شده را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

برای پیوستن فقط مشاهده/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید. این
پل مدل بلادرنگ دوطرفه را شروع نمی‌کند، به BlackHole یا SoX نیاز ندارد، و در جلسه
پاسخ صوتی نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای مجوز
میکروفون/دوربین OpenClaw و مسیر **Use microphone** در Meet پرهیز می‌کنند. اگر
Meet یک میان‌صفحه انتخاب صدا نشان دهد، خودکارسازی مسیر بدون میکروفون را امتحان
می‌کند و در غیر این صورت به‌جای بازکردن میکروفون محلی، یک اقدام دستی گزارش
می‌دهد.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` سلامت مرورگر و پل صدا مانند
`inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`,
`audioInputActive`, `audioOutputActive`، آخرین مُهرهای زمانی ورودی/خروجی، شمارنده‌های
بایت، و وضعیت بسته‌شدن پل را شامل می‌شود. اگر یک اعلان امن صفحه Meet ظاهر شود،
خودکارسازی مرورگر هر زمان بتواند آن را مدیریت می‌کند. اعلان‌های ورود، پذیرش
میزبان، و مجوز مرورگر/سیستم‌عامل به‌عنوان اقدام دستی با دلیل و پیام گزارش
می‌شوند تا عامل آن را منتقل کند. نشست‌های مدیریت‌شده Chrome فقط پس از اینکه
سلامت مرورگر `inCall: true` گزارش دهد، مقدمه یا عبارت آزمایشی را منتشر می‌کنند؛
در غیر این صورت وضعیت `speechReady: false` را گزارش می‌کند و تلاش گفتار به‌جای
وانمودکردن اینکه عامل در جلسه صحبت کرده است، مسدود می‌شود.

پیوستن‌های Chrome محلی از طریق پروفایل مرورگر OpenClaw که وارد شده است انجام
می‌شوند. حالت بلادرنگ برای مسیر میکروفون/بلندگوی استفاده‌شده توسط OpenClaw به
`BlackHole 2ch` نیاز دارد. برای صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا
یک گراف به سبک Loopback استفاده کنید؛ یک دستگاه BlackHole برای نخستین آزمون
دود کافی است اما ممکن است پژواک ایجاد کند.

### Gateway محلی + Parallels Chrome

برای اینکه VM مالک Chrome باشد، نیازی به Gateway کامل OpenClaw یا کلید API مدل
داخل یک VM macOS ندارید. Gateway و عامل را محلی اجرا کنید، سپس یک میزبان Node را
در VM اجرا کنید. Plugin همراه را یک‌بار در VM فعال کنید تا Node دستور Chrome را
اعلان کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهنده
  بلادرنگ، و پیکربندی Plugin Google Meet.
- VM macOS در Parallels: OpenClaw CLI/میزبان Node، Google Chrome، SoX،
  BlackHole 2ch، و یک پروفایل Chrome واردشده به Google.
- مواردی که در VM لازم نیست: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا
  راه‌اندازی ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را دوباره راه‌اندازی کنید تا macOS دستگاه `BlackHole 2ch`
را آشکار کند:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، بررسی کنید VM می‌تواند دستگاه صدا و دستورهای SoX را
ببیند:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

OpenClaw را در VM نصب یا به‌روزرسانی کنید، سپس Plugin همراه را آنجا فعال کنید:

```bash
openclaw plugins enable google-meet
```

میزبان Node را در VM شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP شبکه محلی است و از TLS استفاده نمی‌کنید، Node اتصال
WebSocket متن ساده را رد می‌کند مگر اینکه برای آن شبکه خصوصی مورداعتماد اعلام
موافقت کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

هنگام نصب Node به‌عنوان LaunchAgent نیز از همان متغیر محیطی استفاده کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` محیط فرایند است، نه یک تنظیم
`openclaw.json`. وقتی در دستور نصب وجود داشته باشد، `openclaw node install` آن
را در محیط LaunchAgent ذخیره می‌کند.

Node را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید Gateway، Node را می‌بیند و اینکه هم `googlemeet.chrome` و هم قابلیت
مرورگر/`browser.proxy` را اعلان می‌کند:

```bash
openclaw nodes status
```

Meet را روی میزبان Gateway از طریق آن Node مسیریابی کنید:

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

اکنون به‌صورت عادی از میزبان Gateway بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

یا از عامل بخواهید ابزار `google_meet` را با `transport: "chrome-node"` استفاده
کند.

برای یک آزمون دود تک‌دستوری که نشستی را ایجاد یا دوباره استفاده می‌کند، یک عبارت
شناخته‌شده را بیان می‌کند، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

در طول پیوستن بلادرنگ، خودکارسازی مرورگر OpenClaw نام مهمان را پر می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان نخستین اجرای «Use microphone» در Meet
ظاهر شود آن را می‌پذیرد. در طول پیوستن فقط مشاهده یا ایجاد جلسه فقط با مرورگر،
وقتی انتخاب بدون میکروفون موجود باشد، از همان اعلان بدون میکروفون عبور می‌کند.
اگر پروفایل مرورگر وارد نشده باشد، Meet منتظر پذیرش میزبان باشد، Chrome برای
پیوستن بلادرنگ به مجوز میکروفون/دوربین نیاز داشته باشد، یا Meet روی اعلانی گیر
کرده باشد که خودکارسازی نتوانسته حل کند، نتیجه پیوستن/test-speech مقدار
`manualActionRequired: true` را همراه با `manualActionReason` و
`manualActionMessage` گزارش می‌کند. عامل‌ها باید تلاش دوباره برای پیوستن را متوقف
کنند، همان پیام دقیق را به‌همراه `browserUrl`/`browserTitle` فعلی گزارش دهند، و
فقط پس از کامل‌شدن اقدام دستی مرورگر دوباره تلاش کنند.

اگر `chromeNode.node` حذف شده باشد، OpenClaw فقط وقتی به‌صورت خودکار انتخاب
می‌کند که دقیقا یک Node متصل هم `googlemeet.chrome` و هم کنترل مرورگر را اعلان
کند. اگر چند Node توانمند متصل هستند، `chromeNode.node` را به شناسه Node، نام
نمایشی، یا IP راه‌دور تنظیم کنید.

بررسی‌های رایج شکست:

- `Configured Google Meet node ... is not usable: offline`: Node سنجاق‌شده برای
  Gateway شناخته‌شده است، اما در دسترس نیست. عامل‌ها باید آن Node را به‌عنوان
  وضعیت تشخیصی در نظر بگیرند، نه یک میزبان Chrome قابل استفاده، و به‌جای
  بازگشت به انتقالی دیگر، مانع راه‌اندازی را گزارش کنند مگر اینکه کاربر چنین
  چیزی خواسته باشد.
- `No connected Google Meet-capable node`: در VM، `openclaw node run` را شروع
  کنید، جفت‌سازی را تأیید کنید، و مطمئن شوید `openclaw plugins enable google-meet`
  و `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تأیید کنید که
  میزبان Gateway هر دو فرمان Node را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز
  می‌داند.
- `BlackHole 2ch audio device not found`: روی میزبانی که بررسی می‌شود
  `blackhole-2ch` را نصب کنید و پیش از استفاده از صدای Chrome محلی، راه‌اندازی
  مجدد انجام دهید.
- `BlackHole 2ch audio device not found on the node`: در VM، `blackhole-2ch` را
  نصب کنید و VM را راه‌اندازی مجدد کنید.
- Chrome باز می‌شود اما نمی‌تواند وارد شود: داخل پروفایل مرورگر در VM وارد
  حساب شوید، یا برای ورود مهمان، `chrome.guestName` را تنظیم‌شده نگه دارید.
  ورود خودکار مهمان از اتوماسیون مرورگر OpenClaw از طریق پروکسی مرورگر Node
  استفاده می‌کند؛ مطمئن شوید پیکربندی مرورگر Node به پروفایلی اشاره می‌کند که
  می‌خواهید، برای مثال `browser.defaultProfile: "user"` یا یک پروفایل نشست
  موجود و نام‌گذاری‌شده.
- زبانه‌های تکراری Meet: `chrome.reuseExistingTab: true` را فعال نگه دارید.
  OpenClaw پیش از باز کردن زبانه جدید، زبانه موجود برای همان URL Meet را فعال
  می‌کند، و ایجاد جلسه از طریق مرورگر، پیش از باز کردن زبانه‌ای دیگر، از
  زبانه در حال پیشرفت `https://meet.google.com/new` یا درخواست حساب Google
  دوباره استفاده می‌کند.
- صدا وجود ندارد: در Meet، میکروفون/بلندگو را از مسیر دستگاه صوتی مجازی مورد
  استفاده OpenClaw عبور دهید؛ برای صدای دوطرفه تمیز، از دستگاه‌های مجازی جدا
  یا مسیریابی مشابه Loopback استفاده کنید.

## یادداشت‌های نصب

پیش‌فرض بلادرنگ Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin برای پل صوتی پیش‌فرض 24 kHz PCM16 از
  فرمان‌های صریح دستگاه CoreAudio استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این درایور دستگاه صوتی
  `BlackHole 2ch` را ایجاد می‌کند که Chrome/Meet می‌تواند از آن عبور کند.

OpenClaw هیچ‌کدام از این دو بسته را همراه خود ندارد یا بازتوزیع نمی‌کند. مستندات
از کاربران می‌خواهد آن‌ها را از طریق Homebrew به‌عنوان وابستگی‌های میزبان نصب
کنند. SoX تحت مجوز `LGPL-2.0-only AND GPL-2.0-only` منتشر شده است؛ BlackHole
مجوز GPL-3.0 دارد. اگر نصب‌کننده یا اپلاینسی می‌سازید که BlackHole را همراه
OpenClaw بسته‌بندی می‌کند، شرایط مجوز بالادستی BlackHole را بررسی کنید یا از
Existential Audio مجوز جداگانه بگیرید.

## انتقال‌ها

### Chrome

انتقال Chrome، URL Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و با
پروفایل مرورگر OpenClaw که وارد حساب شده است، وارد می‌شود. روی macOS، Plugin
پیش از اجرا وجود `BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از
باز کردن Chrome یک فرمان سلامت پل صوتی و فرمان راه‌اندازی را نیز اجرا می‌کند.
وقتی Chrome/صدا روی میزبان Gateway قرار دارد از `chrome` استفاده کنید؛ وقتی
Chrome/صدا روی یک Node جفت‌شده مانند VM macOS در Parallels قرار دارد، از
`chrome-node` استفاده کنید. برای Chrome محلی، پروفایل را با
`browser.defaultProfile` انتخاب کنید؛ `chrome.browserProfile` به میزبان‌های
`chrome-node` ارسال می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از پل صوتی محلی OpenClaw عبور دهید. اگر
`BlackHole 2ch` نصب نشده باشد، ورود به‌جای پیوستن بی‌صدا و بدون مسیر صوتی، با
خطای راه‌اندازی ناموفق می‌شود.

### Twilio

انتقال Twilio یک طرح شماره‌گیری سخت‌گیرانه است که به Plugin تماس صوتی واگذار
می‌شود. این انتقال صفحات Meet را برای شماره تلفن‌ها تجزیه نمی‌کند.

وقتی مشارکت با Chrome در دسترس نیست یا یک جایگزین شماره‌گیری تلفنی می‌خواهید،
از این استفاده کنید. Google Meet باید برای جلسه، شماره شماره‌گیری تلفنی و PIN
ارائه دهد؛ OpenClaw آن‌ها را از صفحه Meet کشف نمی‌کند.

Plugin تماس صوتی را روی میزبان Gateway فعال کنید، نه روی Node مربوط به Chrome:

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
رازها خارج از `openclaw.json` بمانند:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

پس از فعال کردن `voice-call`، Gateway را راه‌اندازی مجدد یا بارگذاری مجدد کنید؛
تغییرات پیکربندی Plugin تا زمانی که فرایند Gateway در حال اجرا دوباره بارگذاری
نشود، در آن ظاهر نمی‌شوند.

سپس تأیید کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی واگذاری Twilio وصل شده باشد، `googlemeet setup` شامل بررسی‌های موفق
`twilio-voice-call-plugin`، `twilio-voice-call-credentials`، و
`twilio-voice-call-webhook` است.

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

## OAuth و بررسی پیش از اجرا

OAuth برای ایجاد پیوند Meet اختیاری است، چون `googlemeet create` می‌تواند به
اتوماسیون مرورگر بازگردد. وقتی ایجاد از طریق API رسمی، حل‌کردن فضا، یا
بررسی‌های پیش از اجرای Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک کلاینت OAuth در
Google Cloud ایجاد کنید، دامنه‌های لازم را درخواست کنید، یک حساب Google را
مجاز کنید، سپس refresh token حاصل را در پیکربندی Plugin مربوط به Google Meet
ذخیره کنید یا متغیرهای محیطی `OPENCLAW_GOOGLE_MEET_*` را ارائه دهید.

OAuth جایگزین مسیر ورود Chrome نمی‌شود. انتقال‌های Chrome و Chrome-node همچنان
هنگام استفاده از مشارکت مرورگر، از طریق یک پروفایل Chrome واردشده، BlackHole/SoX،
و یک Node متصل وارد می‌شوند. OAuth فقط برای مسیر رسمی Google Meet API است:
ایجاد فضاهای جلسه، حل‌کردن فضاها، و اجرای بررسی‌های پیش از اجرای Meet Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژه Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحه رضایت OAuth را پیکربندی کنید.
   - **Internal** برای یک سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا وقتی برنامه
     در حالت Testing است، هر حساب Google که برنامه را مجاز خواهد کرد به‌عنوان
     کاربر آزمایشی اضافه کنید.
4. دامنه‌هایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک شناسه کلاینت OAuth ایجاد کنید.
   - نوع برنامه: **Web application**.
   - URI بازگشت مجاز:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. شناسه کلاینت و راز کلاینت را کپی کنید.

`meetings.space.created` برای Google Meet `spaces.create` لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به فضاها
حل کند. `meetings.conference.media.readonly` برای بررسی پیش از اجرای Meet Media
API و کار رسانه‌ای است؛ Google ممکن است برای استفاده واقعی از Media API به
ثبت‌نام Developer Preview نیاز داشته باشد. اگر فقط به ورودهای Chrome مبتنی بر
مرورگر نیاز دارید، OAuth را کاملاً نادیده بگیرید.

### ساخت refresh token

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها
را به‌عنوان متغیرهای محیطی ارسال کنید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک پیکربندی `oauth` همراه با refresh token چاپ می‌کند. از PKCE،
بازگشت localhost روی `http://localhost:8085/oauth2callback`، و جریان کپی/چسباندن
دستی با `--manual` استفاده می‌کند.

نمونه‌ها:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

وقتی مرورگر نمی‌تواند به بازگشت محلی دسترسی پیدا کند، از حالت دستی استفاده کنید:

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

شیء `oauth` را زیر پیکربندی Plugin مربوط به Google Meet ذخیره کنید:

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
اگر هم مقادیر پیکربندی و هم مقادیر محیط وجود داشته باشند، Plugin ابتدا
پیکربندی را حل می‌کند و سپس به محیط بازمی‌گردد.

رضایت OAuth شامل ایجاد فضای Meet، دسترسی خواندن فضای Meet، و دسترسی خواندن
رسانه کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه احراز هویت کرده‌اید،
`openclaw googlemeet auth login --json` را دوباره اجرا کنید تا refresh token
دامنه `meetings.space.created` را داشته باشد.

### تأیید OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون راز می‌خواهید، doctor مربوط به OAuth را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار زمان اجرای Chrome را بارگذاری نمی‌کند و به Node متصل مربوط به Chrome
نیاز ندارد. بررسی می‌کند که پیکربندی OAuth وجود دارد و refresh token می‌تواند
یک access token بسازد. گزارش JSON فقط شامل فیلدهای وضعیت مانند `ok`،
`configured`، `tokenSource`، `expiresAt`، و پیام‌های بررسی است؛ access token،
refresh token، یا راز کلاینت را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنی                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک access token کش‌شده، وجود دارد.       |
| `oauth-token`        | access token کش‌شده هنوز معتبر است، یا refresh token یک access token جدید ساخته است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای Meet موجود را حل کرد.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای Meet جدید ایجاد کرد.                               |

برای اثبات فعال‌بودن Google Meet API و دامنه `spaces.create` نیز، بررسی ایجاد
دارای اثر جانبی را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL Meet موقت ایجاد می‌کند. وقتی باید تأیید کنید پروژه
Google Cloud، Meet API را فعال دارد و حساب مجازشده دامنه
`meetings.space.created` را دارد، از آن استفاده کنید.

برای اثبات دسترسی خواندن برای یک فضای جلسه موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک فضای موجود را
که حساب Google مجازشده می‌تواند به آن دسترسی داشته باشد، اثبات می‌کنند. یک
`403` از این بررسی‌ها معمولاً یعنی Google Meet REST API غیرفعال است، refresh token
رضایت‌داده‌شده دامنه لازم را ندارد، یا حساب Google نمی‌تواند به آن فضای Meet
دسترسی داشته باشد. خطای refresh-token یعنی `openclaw googlemeet auth login
--json` را دوباره اجرا کنید و بلوک `oauth` جدید را ذخیره کنید.

برای بازگشت مرورگر، هیچ اعتبارنامه OAuth لازم نیست. در آن حالت، احراز هویت
Google از پروفایل Chrome واردشده روی Node انتخابی می‌آید، نه از پیکربندی
OpenClaw.

این متغیرهای محیطی به‌عنوان مقادیر جایگزین پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` یا `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` یا `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` یا
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` یا `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` یا `GOOGLE_MEET_PREVIEW_ACK`

یک URL، کد، یا `spaces/{id}` مربوط به Meet را از طریق `spaces.get` حل کنید:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

پیش از کار رسانه‌ای، پیش‌بررسی را اجرا کنید:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

پس از اینکه Meet رکوردهای کنفرانس را ایجاد کرد، مصنوعات جلسه و حضور را فهرست کنید:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، `artifacts` و `attendance` به‌طور پیش‌فرض از جدیدترین رکورد کنفرانس استفاده می‌کنند. وقتی همه رکوردهای نگه‌داری‌شده برای آن جلسه را می‌خواهید، `--all-conference-records` را ارسال کنید.

جست‌وجوی Calendar می‌تواند پیش از خواندن مصنوعات Meet، URL جلسه را از Google Calendar حل کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` در تقویم `primary` امروز به‌دنبال رویداد Calendar دارای پیوند Google Meet می‌گردد. از `--event <query>` برای جست‌وجوی متن رویدادهای مطابق، و از `--calendar <id>` برای تقویم غیر اصلی استفاده کنید. جست‌وجوی Calendar به ورود تازه OAuth نیاز دارد که دامنه فقط‌خواندنی رویدادهای Calendar را شامل شود. `calendar-events` رویدادهای Meet مطابق را پیش‌نمایش می‌کند و رویدادی را که `latest`، `artifacts`، `attendance`، یا `export` انتخاب خواهد کرد، علامت می‌زند.

اگر شناسه رکورد کنفرانس را از قبل می‌دانید، آن را مستقیم آدرس‌دهی کنید:

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

`artifacts` فراداده رکورد کنفرانس را به‌همراه فراداده منابع شرکت‌کننده، ضبط، رونوشت، ورودی ساختاریافته رونوشت، و یادداشت هوشمند، زمانی که Google آن را برای جلسه در دسترس بگذارد، برمی‌گرداند. برای رد شدن از جست‌وجوی ورودی‌ها در جلسه‌های بزرگ، از `--no-transcript-entries` استفاده کنید. `attendance` شرکت‌کنندگان را به ردیف‌های نشست شرکت‌کننده با زمان‌های نخستین/آخرین مشاهده، مدت کل نشست، پرچم‌های تأخیر/ترک زودهنگام، و منابع تکراری شرکت‌کننده که بر اساس کاربر واردشده یا نام نمایشی ادغام شده‌اند، گسترش می‌دهد. برای جدا نگه داشتن منابع خام شرکت‌کننده، `--no-merge-duplicates` را ارسال کنید؛ برای تنظیم تشخیص تأخیر، `--late-after-minutes`؛ و برای تنظیم تشخیص ترک زودهنگام، `--early-before-minutes`.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`، `transcript.md`، `artifacts.json`، `attendance.json`، و `manifest.json` می‌نویسد. `manifest.json` ورودی انتخاب‌شده، گزینه‌های صدور، رکوردهای کنفرانس، فایل‌های خروجی، شمارش‌ها، منبع توکن، رویداد Calendar در صورت استفاده، و هر هشدار بازیابی ناقص را ثبت می‌کند. برای نوشتن یک آرشیو قابل‌حمل کنار پوشه نیز `--zip` را ارسال کنید. برای صدور متن Google Docs رونوشت و یادداشت هوشمندِ پیوندشده از طریق Google Drive `files.export`، `--include-doc-bodies` را ارسال کنید؛ این کار به ورود تازه OAuth نیاز دارد که دامنه فقط‌خواندنی Drive Meet را شامل شود. بدون `--include-doc-bodies`، خروجی‌ها فقط شامل فراداده Meet و ورودی‌های ساختاریافته رونوشت هستند. اگر Google یک خرابی جزئی مصنوع برگرداند، مانند خطای فهرست‌کردن یادداشت هوشمند، ورودی رونوشت، یا بدنه سند Drive، خلاصه و مانیفست به‌جای شکست دادن کل صدور، هشدار را نگه می‌دارند. از `--dry-run` برای واکشی همان داده‌های مصنوعات/حضور و چاپ JSON مانیفست بدون ایجاد پوشه یا ZIP استفاده کنید. این کار پیش از نوشتن یک خروجی بزرگ یا زمانی که یک عامل فقط به شمارش‌ها، رکوردهای انتخاب‌شده، و هشدارها نیاز دارد، مفید است.

عامل‌ها همچنین می‌توانند همان بسته را از طریق ابزار `google_meet` ایجاد کنند:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

برای بازگرداندن فقط مانیفست خروجی و رد شدن از نوشتن فایل‌ها، `"dryRun": true` را تنظیم کنید.

دودتست زنده محافظت‌شده را روی یک جلسه واقعی نگه‌داری‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

محیط دودتست زنده:

- `OPENCLAW_LIVE_TEST=1` آزمون‌های زنده محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL، کد، یا `spaces/{id}` نگه‌داری‌شده Meet اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه سرویس‌گیرنده OAuth را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN` توکن تازه‌سازی را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های جایگزین بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

دودتست زنده پایه مصنوعات/حضور به `https://www.googleapis.com/auth/meetings.space.readonly` و `https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. صدور بدنه سند Drive به `https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای تازه Meet ایجاد کنید:

```bash
openclaw googlemeet create
```

این فرمان `meeting uri` جدید، منبع، و نشست پیوستن را چاپ می‌کند. با اعتبارنامه‌های OAuth از API رسمی Google Meet استفاده می‌کند. بدون اعتبارنامه‌های OAuth، از نمایه مرورگر واردشده Node کروم سنجاق‌شده به‌عنوان جایگزین استفاده می‌کند. عامل‌ها می‌توانند از ابزار `google_meet` با `action: "create"` برای ایجاد و پیوستن در یک گام استفاده کنند. برای ایجاد فقط URL، `"join": false` را ارسال کنید.

نمونه خروجی JSON از جایگزین مرورگر:

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

اگر جایگزین مرورگر پیش از اینکه بتواند URL را ایجاد کند با ورود Google یا مسدودکننده مجوز Meet روبه‌رو شود، روش Gateway پاسخ ناموفق برمی‌گرداند و ابزار `google_meet` به‌جای یک رشته ساده، جزئیات ساختاریافته برمی‌گرداند:

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

وقتی یک عامل `manualActionRequired: true` را می‌بیند، باید `manualActionMessage` را همراه با زمینه Node/زبانه مرورگر گزارش کند و تا زمانی که اپراتور مرحله مرورگر را کامل نکرده است، از باز کردن زبانه‌های جدید Meet دست بکشد.

نمونه خروجی JSON از ایجاد API:

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

ایجاد یک Meet به‌طور پیش‌فرض می‌پیوندد. انتقال Chrome یا Chrome-node همچنان برای پیوستن از طریق مرورگر به یک نمایه واردشده Google Chrome نیاز دارد. اگر نمایه خارج شده باشد، OpenClaw `manualActionRequired: true` یا خطای جایگزین مرورگر را گزارش می‌کند و از اپراتور می‌خواهد پیش از تلاش دوباره، ورود Google را کامل کند.

فقط پس از تأیید اینکه پروژه Cloud، اصل OAuth، و شرکت‌کنندگان جلسه شما در Google Workspace Developer Preview Program برای APIهای رسانه‌ای Meet ثبت‌نام شده‌اند، `preview.enrollmentAcknowledged: true` را تنظیم کنید.

## پیکربندی

مسیر بلادرنگ مشترک Chrome فقط به Plugin فعال‌شده، BlackHole، SoX، و کلید ارائه‌دهنده صوتی بلادرنگ پشتیبان نیاز دارد. OpenAI پیش‌فرض است؛ برای استفاده از Google Gemini Live، `realtime.provider: "google"` را تنظیم کنید:

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
- `chromeNode.node`: شناسه/نام/IP اختیاری Node برای `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحه مهمانِ خارج‌شده Meet استفاده می‌شود
- `chrome.autoJoin: true`: پر کردن نام مهمان و کلیک Join Now به‌صورت بهترین‌تلاش از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال کردن یک زبانه Meet موجود به‌جای باز کردن موارد تکراری
- `chrome.waitForInCallMs: 20000`: انتظار برای اینکه زبانه Meet پیش از راه‌اندازی معرفی بلادرنگ، وضعیت در تماس بودن را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت‌فرمان. فقط برای جفت‌فرمان‌های قدیمی/سفارشی که هنوز صدای تلفنی تولید می‌کنند، از `"g711-ulaw-8khz"` استفاده کنید.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch` می‌خواند و صدا را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صدا را در `chrome.audioFormat` می‌خواند و در CoreAudio `BlackHole 2ch` می‌نویسد
- `chrome.bargeInInputCommand`: فرمان میکروفون محلی اختیاری که برای تشخیص ورود گفتاری انسان هنگام فعال بودن پخش دستیار، PCM مونو با علامت ۱۶‌بیتی little-endian می‌نویسد. این مورد در حال حاضر برای پل جفت‌فرمان `chrome` میزبانی‌شده در Gateway اعمال می‌شود.
- `chrome.bargeInRmsThreshold: 650`: سطح RMS که در `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی شمرده می‌شود
- `chrome.bargeInPeakThreshold: 2500`: سطح اوج که در `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی شمرده می‌شود
- `chrome.bargeInCooldownMs: 900`: حداقل تأخیر بین پاک‌سازی‌های تکراری وقفه انسانی
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، با `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی آمادگی گفتاری کوتاه هنگام اتصال پل بلادرنگ؛ برای پیوستن بی‌صدا آن را روی `""` تنظیم کنید
- `realtime.agentId`: شناسه اختیاری عامل OpenClaw برای `openclaw_agent_consult`؛ پیش‌فرض `main` است

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

`voiceCall.enabled` به‌طور پیش‌فرض `true` است؛ با انتقال Twilio، تماس واقعی PSTN، DTMF و خوشامدگویی آغازین را به Plugin تماس صوتی واگذار می‌کند. Voice Call دنباله DTMF را پیش از باز کردن جریان رسانه‌ای بلادرنگ پخش می‌کند، سپس از متن آغازین ذخیره‌شده به‌عنوان خوشامدگویی اولیه بلادرنگ استفاده می‌کند. اگر `voice-call` فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را اعتبارسنجی و ضبط کند، اما نمی‌تواند تماس Twilio را برقرار کند.

## ابزار

عامل‌ها می‌توانند از ابزار `google_meet` استفاده کنند:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

وقتی Chrome روی میزبان Gateway اجرا می‌شود از `transport: "chrome"` استفاده کنید. وقتی Chrome روی یک Node جفت‌شده مانند VM در Parallels اجرا می‌شود از `transport: "chrome-node"` استفاده کنید. در هر دو حالت، مدل بلادرنگ و `openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا می‌مانند.

از `action: "status"` برای فهرست کردن نشست‌های فعال یا بررسی یک شناسه نشست استفاده کنید. از `action: "speak"` همراه با `sessionId` و `message` استفاده کنید تا عامل بلادرنگ فوراً صحبت کند. از `action: "test_speech"` استفاده کنید تا نشست را ایجاد یا بازاستفاده کند، یک عبارت شناخته‌شده را اجرا کند، و وقتی میزبان Chrome بتواند گزارش دهد، سلامت `inCall` را برگرداند. `test_speech` همیشه `mode: "realtime"` را اجباری می‌کند و اگر از آن خواسته شود در `mode: "transcribe"` اجرا شود ناموفق می‌شود، چون نشست‌های فقط مشاهده عمداً نمی‌توانند گفتار منتشر کنند. نتیجه `speechOutputVerified` آن بر پایه افزایش بایت‌های خروجی صوت بلادرنگ در طول این تماس آزمایشی است، بنابراین یک نشست بازاستفاده‌شده با صوت قدیمی‌تر به‌عنوان بررسی گفتار تازه و موفق حساب نمی‌شود. از `action: "leave"` برای علامت‌گذاری یک نشست به‌عنوان پایان‌یافته استفاده کنید.

`status` در صورت دسترس بودن، سلامت Chrome را شامل می‌شود:

- `inCall`: به نظر می‌رسد Chrome داخل تماس Meet باشد
- `micMuted`: وضعیت میکروفون Meet به‌صورت بهترین تلاش
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: پروفایل مرورگر پیش از کار کردن گفتار به ورود دستی، پذیرش توسط میزبان Meet، مجوزها، یا تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: آیا گفتار مدیریت‌شده Chrome اکنون مجاز است یا نه. `speechReady: false` یعنی OpenClaw عبارت آغازین/آزمایشی را به پل صوتی نفرستاده است.
- `providerConnected` / `realtimeReady`: وضعیت پل صدای بلادرنگ
- `lastInputAt` / `lastOutputAt`: آخرین صوت دیده‌شده از پل یا ارسال‌شده به آن
- `lastSuppressedInputAt` / `suppressedInputBytes`: ورودی local loopback که هنگام فعال بودن پخش دستیار نادیده گرفته شده است

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## مشاوره عامل بلادرنگ

حالت بلادرنگ Chrome برای یک حلقه صوتی زنده بهینه شده است. ارائه‌دهنده صدای بلادرنگ صوت جلسه را می‌شنود و از طریق پل صوتی پیکربندی‌شده صحبت می‌کند. وقتی مدل بلادرنگ به استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی OpenClaw نیاز داشته باشد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره، عامل معمول OpenClaw را در پشت صحنه با بافت رونوشت اخیر جلسه اجرا می‌کند و یک پاسخ گفتاری کوتاه به نشست صدای بلادرنگ برمی‌گرداند. سپس مدل صدا می‌تواند آن پاسخ را دوباره در جلسه بیان کند. این ابزار از همان ابزار مشترک مشاوره بلادرنگ Voice Call استفاده می‌کند.

به‌طور پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید با یک فضای کاری عامل اختصاصی OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار، حافظه، و تاریخچه نشست مشورت کند، `realtime.agentId` را تنظیم کنید.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در دسترس قرار دهید و عامل معمول را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search` و `memory_get` محدود کنید.
- `owner`: ابزار مشاوره را در دسترس قرار دهید و اجازه دهید عامل معمول از سیاست ابزار عادی عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صدای بلادرنگ قرار ندهید.

کلید نشست مشاوره به‌ازای هر نشست Meet محدودسازی می‌شود، بنابراین فراخوانی‌های پیگیری مشاوره می‌توانند در همان جلسه از بافت مشاوره قبلی بازاستفاده کنند.

برای اجبار یک بررسی آمادگی گفتاری پس از اینکه Chrome کاملاً به تماس پیوست:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای آزمون کامل پیوستن و صحبت کردن:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## فهرست بررسی آزمون زنده

پیش از سپردن یک جلسه به یک عامل بدون ناظر از این دنباله استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت مورد انتظار Chrome-node:

- `googlemeet setup` همه سبز است.
- وقتی Chrome-node انتقال پیش‌فرض است یا یک Node پین شده است، `googlemeet setup` شامل `chrome-node-connected` می‌شود.
- `nodes status` نشان می‌دهد Node انتخاب‌شده متصل است.
- Node انتخاب‌شده هم `googlemeet.chrome` و هم `browser.proxy` را اعلام می‌کند.
- زبانه Meet به تماس می‌پیوندد و `test-speech` سلامت Chrome را با `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome از راه دور مانند VM در Parallels macOS، این کوتاه‌ترین بررسی ایمن پس از به‌روزرسانی Gateway یا VM است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند که Plugin Gateway بارگذاری شده، Node در VM با توکن فعلی متصل است، و پل صوتی Meet پیش از باز کردن یک زبانه جلسه واقعی توسط عامل در دسترس است.

برای یک آزمون Twilio، از جلسه‌ای استفاده کنید که جزئیات تماس تلفنی ورودی را ارائه می‌دهد:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin`، `twilio-voice-call-credentials` و `twilio-voice-call-webhook` است.
- پس از بارگذاری دوباره Gateway، `voicecall` در CLI در دسترس است.
- نشست برگشتی `transport: "twilio"` و یک `twilio.voiceCallId` دارد.
- `openclaw logs --follow` نشان می‌دهد TwiML مربوط به DTMF پیش از TwiML بلادرنگ ارائه شده، سپس یک پل بلادرنگ با خوشامدگویی اولیه در صف قرار گرفته است.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر همین حالا `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را بازراه‌اندازی یا دوباره بارگذاری کنید. عامل در حال اجرا فقط ابزارهای Plugin ثبت‌شده توسط فرایند فعلی Gateway را می‌بیند.

### هیچ Node متصل و سازگار با Google Meet وجود ندارد

روی میزبان Node اجرا کنید:

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

Node باید متصل باشد و `googlemeet.chrome` به‌علاوه `browser.proxy` را فهرست کند. پیکربندی Gateway باید آن فرمان‌های Node را مجاز کند:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

اگر `googlemeet setup` در `chrome-node-connected` ناموفق شد یا گزارش Gateway عبارت `gateway token mismatch` را نشان داد، Node را با توکن فعلی Gateway دوباره نصب یا بازراه‌اندازی کنید. برای یک Gateway روی LAN، این معمولاً یعنی:

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

### مرورگر باز می‌شود اما عامل نمی‌تواند بپیوندد

`googlemeet test-speech` را اجرا کنید و سلامت Chrome برگشتی را بررسی کنید. اگر `manualActionRequired: true` را گزارش کرد، `manualActionMessage` را به اپراتور نشان دهید و تا کامل شدن اقدام مرورگر، تلاش دوباره را متوقف کنید.

اقدام‌های دستی رایج:

- وارد پروفایل Chrome شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی اعلان مجوز بومی Chrome ظاهر می‌شود، مجوزهای میکروفون/دوربین Chrome را اعطا کنید.
- یک گفت‌وگوی مجوز گیرکرده Meet را ببندید یا تعمیر کنید.

صرفاً به این دلیل که Meet نشان می‌دهد «آیا می‌خواهید افراد صدای شما را در جلسه بشنوند؟» گزارش «وارد نشده» ندهید. این صفحه میانی انتخاب صوت Meet است؛ OpenClaw در صورت دسترس بودن از طریق خودکارسازی مرورگر روی **استفاده از میکروفون** کلیک می‌کند و همچنان منتظر وضعیت واقعی جلسه می‌ماند. برای جایگزین مرورگر فقط ایجاد، OpenClaw ممکن است روی **ادامه بدون میکروفون** کلیک کند، چون ایجاد URL به مسیر صوتی بلادرنگ نیاز ندارد.

### ایجاد جلسه ناموفق است

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند، از نقطه پایانی `spaces.create` در Google Meet API استفاده می‌کند. بدون اعتبارنامه‌های OAuth، به مرورگر Node پین‌شده Chrome برمی‌گردد. تأیید کنید:

- برای ایجاد از طریق API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند، یا متغیرهای محیطی متناظر `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ایجاد از طریق API: توکن نوسازی پس از اضافه شدن پشتیبانی ایجاد صادر شده است. توکن‌های قدیمی‌تر ممکن است scope مربوط به `meetings.space.created` را نداشته باشند؛ `openclaw googlemeet auth login --json` را دوباره اجرا کنید و پیکربندی Plugin را به‌روزرسانی کنید.
- برای جایگزین مرورگر: `defaultTransport: "chrome-node"` و `chromeNode.node` به یک Node متصل با `browser.proxy` و `googlemeet.chrome` اشاره می‌کنند.
- برای جایگزین مرورگر: پروفایل Chrome مربوط به OpenClaw روی آن Node به Google وارد شده و می‌تواند `https://meet.google.com/new` را باز کند.
- برای جایگزین مرورگر: تلاش‌های دوباره پیش از باز کردن یک زبانه جدید، از یک زبانه موجود `https://meet.google.com/new` یا اعلان حساب Google بازاستفاده می‌کنند. اگر عامل زمان‌تمام شد، به‌جای باز کردن دستی یک زبانه Meet دیگر، فراخوانی ابزار را دوباره امتحان کنید.
- برای جایگزین مرورگر: اگر ابزار `manualActionRequired: true` را برگرداند، از `browser.nodeId`، `browser.targetId`، `browserUrl` و `manualActionMessage` برگشتی برای راهنمایی اپراتور استفاده کنید. تا وقتی آن اقدام کامل نشده، در یک حلقه دوباره تلاش نکنید.
- برای جایگزین مرورگر: اگر Meet نشان می‌دهد «آیا می‌خواهید افراد صدای شما را در جلسه بشنوند؟»، زبانه را باز بگذارید. OpenClaw باید از طریق خودکارسازی مرورگر روی **استفاده از میکروفون** یا، برای جایگزین فقط ایجاد، **ادامه بدون میکروفون** کلیک کند و همچنان منتظر URL تولیدشده Meet بماند. اگر نتواند، خطا باید `meet-audio-choice-required` را ذکر کند، نه `google-login-required`.

### عامل می‌پیوندد اما صحبت نمی‌کند

مسیر بلادرنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای گوش دادن/پاسخ گفتاری از `mode: "realtime"` استفاده کنید. `mode: "transcribe"` عمدا
پل صوتی realtime دوطرفه را آغاز نمی‌کند. `googlemeet test-speech`
همیشه مسیر realtime را بررسی می‌کند و گزارش می‌دهد که آیا بایت‌های خروجی پل
برای آن فراخوانی مشاهده شده‌اند یا نه. اگر `speechOutputVerified` برابر false و
`speechOutputTimedOut` برابر true باشد، provider مربوط به realtime ممکن است
گفته را پذیرفته باشد، اما OpenClaw نرسیدن بایت‌های خروجی جدید به پل صوتی Chrome
را دیده باشد.

همچنین بررسی کنید:

- یک کلید provider مربوط به realtime روی میزبان Gateway در دسترس باشد، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده باشد.
- `sox` روی میزبان Chrome وجود داشته باشد.
- میکروفون و بلندگوی Meet از مسیر صوتی مجازی‌ای عبور داده شوند که
  OpenClaw استفاده می‌کند.

`googlemeet doctor [session-id]` نشست، node، وضعیت داخل تماس،
دلیل اقدام دستی، اتصال provider مربوط به realtime، `realtimeReady`، فعالیت
ورودی/خروجی صدا، آخرین زمان‌نماهای صدا، شمارنده‌های بایت، و URL مرورگر را چاپ
می‌کند. وقتی به JSON خام نیاز دارید از `googlemeet status [session-id] --json`
استفاده کنید. وقتی باید تازه‌سازی OAuth مربوط به Google Meet را بدون افشای tokenها
بررسی کنید از `googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API
هم نیاز دارید، `--meeting` یا `--create-space` را اضافه کنید.

اگر یک agent دچار timeout شد و می‌توانید ببینید که یک زبانه Meet از قبل باز است،
همان زبانه را بدون باز کردن زبانه‌ای دیگر بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

اقدام ابزار معادل آن `recover_current_tab` است. این کار یک زبانه Meet موجود را
برای transport انتخاب‌شده focus و inspect می‌کند. با `chrome`، از کنترل مرورگر
محلی از طریق Gateway استفاده می‌کند؛ با `chrome-node`، از node پیکربندی‌شده
Chrome استفاده می‌کند. زبانه جدیدی باز نمی‌کند و نشست جدیدی نمی‌سازد؛ مانع
فعلی را گزارش می‌دهد، مانند ورود، پذیرش، مجوزها، یا وضعیت انتخاب صدا.
فرمان CLI با Gateway پیکربندی‌شده صحبت می‌کند، بنابراین Gateway باید در حال اجرا باشد؛
`chrome-node` همچنین لازم دارد node مربوط به Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

`twilio-voice-call-plugin` وقتی `voice-call` مجاز یا فعال نباشد شکست می‌خورد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید، و
Gateway را reload کنید.

`twilio-voice-call-credentials` وقتی backend مربوط به Twilio فاقد account
SID، auth token، یا شماره تماس‌گیرنده باشد شکست می‌خورد. این موارد را روی میزبان
Gateway تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` وقتی `voice-call` هیچ در معرض‌گذاری عمومی Webhook
نداشته باشد، یا وقتی `publicUrl` به loopback یا فضای شبکه خصوصی اشاره کند شکست
می‌خورد. `plugins.entries.voice-call.config.publicUrl` را روی URL provider عمومی
تنظیم کنید یا یک tunnel/Tailscale exposure برای `voice-call` پیکربندی کنید.

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

برای توسعه محلی، به‌جای URL میزبان خصوصی از tunnel یا Tailscale exposure استفاده کنید:

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

سپس Gateway را restart یا reload کنید و اجرا کنید:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌طور پیش‌فرض فقط readiness را بررسی می‌کند. برای dry-run یک شماره مشخص:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط وقتی `--yes` را اضافه کنید که عمدا می‌خواهید یک تماس notify خروجی live برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید که رویداد Meet جزئیات dial-in تلفنی را ارائه می‌کند. شماره dial-in
و PIN دقیق یا یک دنباله DTMF سفارشی را بدهید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر provider پیش از وارد کردن PIN به مکث نیاز دارد، در `--dtmf-sequence` از
`w` آغازین یا comma استفاده کنید.

اگر تماس تلفنی ایجاد می‌شود اما فهرست افراد Meet هرگز شرکت‌کننده dial-in را نشان نمی‌دهد:

- `openclaw voicecall status --call-id <id>` را اجرا کنید و تأیید کنید تماس هنوز
  فعال است.
- `openclaw voicecall tail` را اجرا کنید و بررسی کنید که Webhookهای Twilio به
  Gateway می‌رسند.
- `openclaw logs --follow` را اجرا کنید و به دنبال دنباله Twilio Meet بگردید: Google
  Meet پیوستن را delegate می‌کند، Voice Call، TwiML مربوط به DTMF پیش از اتصال را ذخیره می‌کند،
  آن TwiML اولیه را ارائه می‌کند، سپس TwiML مربوط به realtime را ارائه می‌کند و پل realtime را
  با `initialGreeting=queued` آغاز می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ بررسی راه‌اندازی سبز
  لازم است اما ثابت نمی‌کند دنباله PIN جلسه درست است.
- تأیید کنید شماره dial-in متعلق به همان دعوت‌نامه و region در Meet است که PIN هم
  به آن تعلق دارد.
- اگر Meet کند پاسخ می‌دهد، مکث‌های آغازین را در `--dtmf-sequence` افزایش دهید،
  برای مثال `wwww123456#`.
- اگر شرکت‌کننده وارد می‌شود اما greeting را نمی‌شنوید، در
  `openclaw logs --follow` به دنبال TwiML مربوط به realtime، آغاز به کار پل realtime، و
  `initialGreeting=queued` بگردید. greeting از پیام اولیه
  `voicecall.start` پس از اتصال پل realtime تولید می‌شود.

اگر Webhookها نمی‌رسند، ابتدا Plugin تماس صوتی را debug کنید: provider باید بتواند
به `plugins.entries.voice-call.config.publicUrl` یا tunnel پیکربندی‌شده برسد.
[عیب‌یابی تماس صوتی](/fa/plugins/voice-call#troubleshooting) را ببینید.

## نکات

API رسمی رسانه Google Meet دریافت‌محور است، بنابراین صحبت کردن در تماس Meet
هنوز به یک مسیر شرکت‌کننده نیاز دارد. این Plugin آن مرز را آشکار نگه می‌دارد:
Chrome مشارکت مرورگر و مسیریابی صدای محلی را مدیریت می‌کند؛ Twilio مشارکت
dial-in تلفنی را مدیریت می‌کند.

حالت realtime در Chrome به `BlackHole 2ch` به‌علاوه یکی از این‌ها نیاز دارد:

- `chrome.audioInputCommand` به‌علاوه `chrome.audioOutputCommand`: OpenClaw مالک پل
  مدل realtime است و صدا را در `chrome.audioFormat` بین این فرمان‌ها و provider صوتی
  realtime انتخاب‌شده pipe می‌کند. مسیر پیش‌فرض Chrome، PCM16 با 24 kHz است؛
  G.711 mu-law با 8 kHz همچنان برای جفت‌فرمان‌های legacy در دسترس است.
- `chrome.audioBridgeCommand`: یک فرمان پل خارجی مالک کل مسیر صوتی محلی است و
  باید پس از آغاز یا اعتبارسنجی daemon خود خارج شود.

برای صدای دوطرفه تمیز، خروجی Meet و میکروفون Meet را از دستگاه‌های مجازی جداگانه
یا یک گراف دستگاه مجازی به سبک Loopback عبور دهید. یک دستگاه BlackHole مشترک
واحد می‌تواند صدای سایر شرکت‌کنندگان را دوباره به تماس echo کند.

با پل Chrome مبتنی بر جفت‌فرمان، `chrome.bargeInInputCommand` می‌تواند به یک
میکروفون محلی جداگانه گوش دهد و وقتی انسان شروع به صحبت می‌کند، پخش assistant
را پاک کند. این کار باعث می‌شود گفتار انسان حتی وقتی ورودی local loopback مشترک
BlackHole هنگام پخش assistant موقتا سرکوب شده است، جلوتر از خروجی assistant بماند.
مانند `chrome.audioInputCommand` و `chrome.audioOutputCommand`، این یک فرمان محلی
پیکربندی‌شده توسط operator است. از یک مسیر فرمان یا فهرست آرگومان trusted صریح
استفاده کنید و آن را به scriptهای مکان‌های untrusted اشاره ندهید.

`googlemeet speak` پل صوتی realtime فعال را برای یک نشست Chrome trigger می‌کند.
`googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق Plugin
Voice Call delegate شده‌اند، `leave` تماس صوتی underlying را هم قطع می‌کند.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
