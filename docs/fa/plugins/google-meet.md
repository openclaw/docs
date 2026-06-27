---
read_when:
    - می‌خواهید یک عامل OpenClaw به تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - شما در حال پیکربندی Chrome، گره Chrome، یا Twilio به‌عنوان ترابری Google Meet هستید
summary: 'Plugin Google Meet: پیوستن به URLهای مشخص Meet از طریق Chrome یا Twilio با پیش‌فرض‌های پاسخ صوتی عامل'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-06-27T18:16:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی از شرکت‌کننده Google Meet برای OpenClaw — این Plugin عمداً صریح طراحی شده است:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید بسازد و سپس به URL
  بازگشتی بپیوندد.
- `agent` حالت پیش‌فرض پاسخ‌گویی صوتی است: رونویسی بلادرنگ گوش می‌دهد، عامل
  پیکربندی‌شده OpenClaw پاسخ می‌دهد، و TTS معمولی OpenClaw در Meet صحبت می‌کند.
- `bidi` همچنان به‌عنوان حالت جایگزین مدل صدای بلادرنگ مستقیم در دسترس است.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: از `agent` برای
  شنیدن/پاسخ‌گویی صوتی زنده، از `bidi` برای جایگزین صدای بلادرنگ مستقیم، یا از `transcribe`
  برای پیوستن/کنترل مرورگر بدون پل پاسخ‌گویی صوتی استفاده کنید.
- احراز هویت با Google OAuth شخصی یا یک نمایه Chrome که از قبل وارد حساب شده است شروع می‌شود.
- هیچ اعلان رضایت خودکاری وجود ندارد.
- پشتیبان صوتی پیش‌فرض Chrome برابر `BlackHole 2ch` است.
- Chrome می‌تواند به‌صورت محلی یا روی یک میزبان گره جفت‌شده اجرا شود.
- Twilio یک شماره شماره‌گیری به‌همراه PIN یا توالی DTMF اختیاری را می‌پذیرد؛
  نمی‌تواند مستقیماً با URL Meet تماس بگیرد.
- فرمان CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر
  تله‌کنفرانس عامل رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید و یک ارائه‌دهنده رونویسی بلادرنگ به‌همراه
TTS معمولی OpenClaw را پیکربندی کنید. OpenAI ارائه‌دهنده پیش‌فرض رونویسی است؛
Google Gemini Live نیز به‌عنوان یک جایگزین صدای `bidi` جداگانه با
`realtime.voiceProvider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده
Homebrew برای اینکه macOS دستگاه را نمایش دهد، به راه‌اندازی مجدد نیاز دارد:

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

خروجی راه‌اندازی قرار است برای عامل قابل‌خواندن و نسبت به حالت آگاه باشد.
این خروجی نمایه Chrome، تثبیت گره، و برای پیوستن‌های بلادرنگ Chrome، پل صوتی
BlackHole/SoX و بررسی‌های مقدمه بلادرنگِ با تأخیر را گزارش می‌کند. برای
پیوستن‌های فقط مشاهده، همان انتقال را با `--mode transcribe` بررسی کنید؛ این
حالت پیش‌نیازهای صوتی بلادرنگ را رد می‌کند، چون از طریق پل گوش نمی‌دهد یا
صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌کند که آیا
Plugin `voice-call`، اعتبارنامه‌های Twilio، و در معرض‌گذاری Webhook عمومی آماده‌اند یا نه.
هر بررسی `ok: false` را پیش از درخواست از عامل برای پیوستن، به‌عنوان مانع برای
انتقال و حالت بررسی‌شده در نظر بگیرید. برای اسکریپت‌ها یا خروجی قابل‌خواندن
برای ماشین از `openclaw googlemeet setup --json` استفاده کنید. برای پیش‌بررسی
یک انتقال مشخص پیش از تلاش عامل، از `--transport chrome`،
`--transport chrome-node`، یا `--transport twilio` استفاده کنید.

برای Twilio، وقتی انتقال پیش‌فرض Chrome است، همیشه انتقال را صریحاً پیش‌بررسی کنید:

```bash
openclaw googlemeet setup --transport twilio
```

این کار نبود سیم‌کشی `voice-call`، اعتبارنامه‌های Twilio، یا در معرض‌گذاری
Webhook غیرقابل‌دسترسی را پیش از تلاش عامل برای شماره‌گیری جلسه پیدا می‌کند.

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

ابزار رو‌به‌عامل `google_meet` روی میزبان‌های غیر macOS برای گردش‌کارهای
مصنوعات، تقویم، راه‌اندازی، رونویسی، Twilio، و `chrome-node` در دسترس می‌ماند.
اقدام‌های پاسخ‌گویی صوتی Chrome محلی در آنجا مسدود می‌شوند، چون مسیر صوتی
Chrome بسته‌بندی‌شده در حال حاضر به `BlackHole 2ch` در macOS وابسته است. در
Linux، برای مشارکت پاسخ‌گویی صوتی Chrome از `mode: "transcribe"`، شماره‌گیری
Twilio، یا یک میزبان macOS `chrome-node` استفاده کنید.

یک جلسه جدید بسازید و به آن بپیوندید:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

برای اتاق‌هایی که با API ساخته می‌شوند، وقتی می‌خواهید سیاست بدون‌درزدن اتاق
به‌جای ارث‌بری از پیش‌فرض‌های حساب Google صریح باشد، از Google Meet
`SpaceConfig.accessType` استفاده کنید:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` به هر کسی که URL Meet را دارد اجازه می‌دهد بدون درزدن بپیوندد.
`TRUSTED` به کاربران مورداعتماد سازمان میزبان، کاربران خارجی دعوت‌شده، و
کاربران شماره‌گیری اجازه می‌دهد بدون درزدن بپیوندند. `RESTRICTED` ورود
بدون‌درزدن را به دعوت‌شدگان محدود می‌کند. این تنظیمات فقط روی مسیر رسمی ساخت
با Google Meet API اعمال می‌شوند، بنابراین اعتبارنامه‌های OAuth باید پیکربندی
شده باشند.

اگر پیش از در دسترس بودن این گزینه Google Meet را احراز هویت کرده‌اید، پس از
افزودن دامنه `meetings.space.settings` به صفحه رضایت Google OAuth خود،
`openclaw googlemeet auth login --json` را دوباره اجرا کنید.

فقط URL را بدون پیوستن بسازید:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` دو مسیر دارد:

- ساخت با API: وقتی اعتبارنامه‌های Google Meet OAuth پیکربندی شده باشند استفاده
  می‌شود. این مسیر قطعی‌ترین مسیر است و به وضعیت رابط کاربری مرورگر وابسته نیست.
- جایگزین مرورگر: وقتی اعتبارنامه‌های OAuth وجود نداشته باشند استفاده می‌شود.
  OpenClaw از گره Chrome تثبیت‌شده استفاده می‌کند، `https://meet.google.com/new`
  را باز می‌کند، منتظر می‌ماند تا Google به یک URL واقعی با کد جلسه هدایت کند،
  و سپس آن URL را برمی‌گرداند. این مسیر نیاز دارد نمایه Chrome متعلق به OpenClaw
  روی گره از قبل وارد Google شده باشد. خودکارسازی مرورگر اعلان میکروفون
  اجرای اول خود Meet را مدیریت می‌کند؛ آن اعلان به‌عنوان شکست ورود Google
  در نظر گرفته نمی‌شود.
  گردش‌کارهای پیوستن و ساخت همچنین پیش از باز کردن یک مورد جدید، تلاش می‌کنند
  یک زبانه Meet موجود را دوباره استفاده کنند. تطبیق، رشته‌های پرس‌وجوی بی‌ضرر
  URL مانند `authuser` را نادیده می‌گیرد، بنابراین تلاش دوباره عامل باید جلسه
  ازپیش‌بازشده را متمرکز کند، نه اینکه یک زبانه Chrome دوم بسازد.

خروجی فرمان/ابزار شامل فیلد `source` است (`api` یا `browser`) تا عامل‌ها بتوانند
توضیح دهند کدام مسیر استفاده شده است. `create` به‌طور پیش‌فرض به جلسه جدید
می‌پیوندد و `joined: true` به‌همراه نشست پیوستن را برمی‌گرداند. برای فقط ساختن
URL، در CLI از `create --no-join` استفاده کنید یا `"join": false` را به ابزار
بفرستید.

یا به یک عامل بگویید: «یک Google Meet بساز، با حالت پاسخ‌گویی صوتی عامل به آن
بپیوند، و پیوند را برای من بفرست.» عامل باید `google_meet` را با
`action: "create"` فراخوانی کند و سپس `meetingUri` بازگشتی را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

برای پیوستن فقط مشاهده/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید.
این حالت پل صدای بلادرنگ دوطرفه را شروع نمی‌کند، به BlackHole یا SoX نیاز ندارد،
و در جلسه پاسخ صوتی نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای
مجوز میکروفون/دوربین OpenClaw و مسیر **استفاده از میکروفون** در Meet اجتناب
می‌کنند. اگر Meet میان‌صفحه انتخاب صوتی نشان دهد، خودکارسازی مسیر بدون میکروفون
را امتحان می‌کند و در غیر این صورت، به‌جای باز کردن میکروفون محلی، یک اقدام
دستی گزارش می‌دهد. در حالت رونویسی، انتقال‌های Chrome مدیریت‌شده همچنین یک
ناظر زیرنویس Meet به‌صورت بهترین‌تلاش نصب می‌کنند. `googlemeet status --json`
و `googlemeet doctor` مقادیر `captioning`، `captionsEnabledAttempted`،
`transcriptLines`، `lastCaptionAt`، `lastCaptionSpeaker`، `lastCaptionText`، و
یک دنباله کوتاه `recentTranscript` را نمایش می‌دهند تا اپراتورها بتوانند
تشخیص دهند آیا مرورگر به تماس پیوسته و آیا زیرنویس‌های Meet متن تولید می‌کنند.
وقتی به یک کاوش بله/خیر نیاز دارید، از
`openclaw googlemeet test-listen <meet-url> --transport chrome-node` استفاده کنید:
این فرمان در حالت رونویسی می‌پیوندد، منتظر حرکت تازه زیرنویس یا رونویسی می‌ماند،
و `listenVerified`، `listenTimedOut`، فیلدهای اقدام دستی، و آخرین سلامت زیرنویس
را برمی‌گرداند.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` سلامت مرورگر و پل صوتی مانند
`inCall`، `manualActionRequired`، `providerConnected`، `realtimeReady`،
`audioInputActive`، `audioOutputActive`، آخرین زمان‌مهرهای ورودی/خروجی، شمارنده‌های
بایت، و وضعیت بسته‌شدن پل را شامل می‌شود. اگر اعلان امن صفحه Meet ظاهر شود،
خودکارسازی مرورگر وقتی بتواند آن را مدیریت می‌کند. ورود، پذیرش توسط میزبان، و
اعلان‌های مجوز مرورگر/OS به‌عنوان اقدام دستی با دلیل و پیام برای انتقال توسط
عامل گزارش می‌شوند. نشست‌های Chrome مدیریت‌شده فقط پس از اینکه سلامت مرورگر
`inCall: true` را گزارش کرد، عبارت مقدمه یا آزمایشی را منتشر می‌کنند؛ در غیر
این صورت وضعیت `speechReady: false` را گزارش می‌کند و تلاش گفتار به‌جای وانمود
کردن اینکه عامل در جلسه صحبت کرده، مسدود می‌شود.

پیوستن‌های Chrome محلی از طریق نمایه مرورگر OpenClaw که وارد حساب شده انجام
می‌شوند. حالت بلادرنگ برای مسیر میکروفون/بلندگوی استفاده‌شده توسط OpenClaw به
`BlackHole 2ch` نیاز دارد. برای صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه
یا یک گراف به سبک Loopback استفاده کنید؛ یک دستگاه BlackHole برای نخستین
آزمون دود کافی است، اما ممکن است پژواک ایجاد کند.

### Gateway محلی + Chrome در Parallels

فقط برای اینکه VM مالک Chrome باشد، به یک OpenClaw Gateway کامل یا کلید API مدل
داخل VM macOS نیاز ندارید. Gateway و عامل را به‌صورت محلی اجرا کنید، سپس یک
میزبان گره را در VM اجرا کنید. Plugin بسته‌بندی‌شده را یک بار روی VM فعال کنید
تا گره فرمان Chrome را تبلیغ کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهنده
  بلادرنگ، و پیکربندی Plugin Google Meet.
- VM macOS در Parallels: OpenClaw CLI/میزبان گره، Google Chrome، SoX، BlackHole 2ch،
  و یک نمایه Chrome که وارد Google شده است.
- مواردی که در VM لازم نیستند: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT،
  یا راه‌اندازی ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را راه‌اندازی مجدد کنید تا macOS دستگاه `BlackHole 2ch`
را نمایش دهد:

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

میزبان گره را در VM شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP شبکه محلی است و از TLS استفاده نمی‌کنید، گره
WebSocket متن ساده را نمی‌پذیرد مگر اینکه برای آن شبکه خصوصی مورداعتماد صریحاً
اجازه دهید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

هنگام نصب گره به‌عنوان LaunchAgent نیز از همان متغیر محیطی استفاده کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` محیط فرایند است، نه یک تنظیم
`openclaw.json`. وقتی `openclaw node install` روی فرمان نصب وجود داشته باشد،
آن را در محیط LaunchAgent ذخیره می‌کند.

گره را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید Gateway گره را می‌بیند و اینکه هم `googlemeet.chrome` و هم قابلیت
مرورگر/`browser.proxy` را تبلیغ می‌کند:

```bash
openclaw nodes status
```

Meet را از طریق آن گره روی میزبان Gateway مسیریابی کنید:

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

یا از عامل بخواهید ابزار `google_meet` را با `transport: "chrome-node"` استفاده کند.

برای یک آزمون دود تک‌فرمانی که یک نشست را می‌سازد یا دوباره استفاده می‌کند،
یک عبارت شناخته‌شده را می‌گوید، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

در هنگام پیوستن بلادرنگ، خودکارسازی مرورگر OpenClaw نام مهمان را پر می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان نخستین اجرای Meet برای انتخاب
"Use microphone" ظاهر شود، آن را می‌پذیرد. هنگام پیوستن فقط برای مشاهده یا
ایجاد جلسه فقط با مرورگر، وقتی انتخاب بدون میکروفون در دسترس باشد، از همان
اعلان بدون میکروفون عبور می‌کند. اگر نمایه مرورگر وارد نشده باشد، Meet منتظر
پذیرش میزبان باشد، Chrome برای پیوستن بلادرنگ به مجوز میکروفون/دوربین نیاز
داشته باشد، یا Meet روی اعلانی گیر کرده باشد که خودکارسازی نتوانسته آن را حل
کند، نتیجه join/test-speech مقدار `manualActionRequired: true` را همراه با
`manualActionReason` و `manualActionMessage` گزارش می‌کند. Agentها باید تلاش
مجدد برای پیوستن را متوقف کنند، همان پیام دقیق را همراه با `browserUrl`/
`browserTitle` فعلی گزارش کنند، و فقط پس از تکمیل اقدام دستی در مرورگر دوباره
تلاش کنند.

اگر `chromeNode.node` حذف شود، OpenClaw فقط وقتی خودکار انتخاب می‌کند که دقیقا
یک Node متصل هم `googlemeet.chrome` و هم کنترل مرورگر را اعلام کند. اگر چند
Node توانمند متصل باشند، `chromeNode.node` را روی شناسه Node، نام نمایشی، یا IP
راه‌دور تنظیم کنید.

بررسی‌های رایج خطا:

- `Configured Google Meet node ... is not usable: offline`: Node سنجاق‌شده برای
  Gateway شناخته‌شده است اما در دسترس نیست. Agentها باید آن Node را به‌عنوان
  وضعیت عیب‌یابی در نظر بگیرند، نه میزبان Chrome قابل استفاده، و به‌جای برگشت
  به ترابری دیگر، مانع راه‌اندازی را گزارش کنند مگر اینکه کاربر چنین درخواستی
  کرده باشد.
- `No connected Google Meet-capable node`: در VM، `openclaw node run` را اجرا
  کنید، جفت‌سازی را تایید کنید، و مطمئن شوید `openclaw plugins enable google-meet`
  و `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تایید کنید
  میزبان Gateway هر دو فرمان Node را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز
  کرده است.
- `BlackHole 2ch audio device not found`: روی میزبانی که بررسی می‌شود
  `blackhole-2ch` را نصب کنید و پیش از استفاده از صدای Chrome محلی، راه‌اندازی
  مجدد انجام دهید.
- `BlackHole 2ch audio device not found on the node`: در VM، `blackhole-2ch` را
  نصب کنید و VM را راه‌اندازی مجدد کنید.
- Chrome باز می‌شود اما نمی‌تواند بپیوندد: داخل VM وارد نمایه مرورگر شوید، یا
  برای پیوستن مهمان، `chrome.guestName` را تنظیم‌شده نگه دارید. پیوستن خودکار
  مهمان از خودکارسازی مرورگر OpenClaw از طریق پروکسی مرورگر Node استفاده
  می‌کند؛ مطمئن شوید پیکربندی مرورگر Node به نمایه‌ای اشاره می‌کند که می‌خواهید،
  برای مثال `browser.defaultProfile: "user"` یا یک نمایه existing-session نام‌دار.
- زبانه‌های تکراری Meet: `chrome.reuseExistingTab: true` را فعال نگه دارید.
  OpenClaw پیش از باز کردن زبانه جدید، زبانه موجود برای همان URL Meet را فعال
  می‌کند، و ایجاد جلسه مرورگر پیش از باز کردن زبانه دیگر، زبانه در حال اجرای
  `https://meet.google.com/new` یا اعلان حساب Google را دوباره استفاده می‌کند.
- بدون صدا: در Meet، میکروفون/بلندگو را از مسیر دستگاه صدای مجازی استفاده‌شده
  توسط OpenClaw عبور دهید؛ برای صدای دوطرفه تمیز از دستگاه‌های مجازی جداگانه یا
  مسیریابی سبک Loopback استفاده کنید.

## یادداشت‌های نصب

پیش‌فرض پاسخ گفتاری Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin از فرمان‌های صریح دستگاه CoreAudio برای
  پل صوتی پیش‌فرض 24 kHz PCM16 استفاده می‌کند.
- `blackhole-2ch`: درایور صدای مجازی macOS. این ابزار دستگاه صوتی
  `BlackHole 2ch` را ایجاد می‌کند که Chrome/Meet می‌تواند از آن مسیر عبور کند.

OpenClaw هیچ‌کدام از این بسته‌ها را همراه خود ندارد یا بازتوزیع نمی‌کند. مستندات
از کاربران می‌خواهند آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق Homebrew نصب
کنند. SoX تحت مجوز `LGPL-2.0-only AND GPL-2.0-only` است؛ BlackHole تحت GPL-3.0
است. اگر نصب‌کننده یا applianceی می‌سازید که BlackHole را همراه OpenClaw بسته‌بندی
می‌کند، شرایط مجوز بالادستی BlackHole را بررسی کنید یا از Existential Audio
مجوز جداگانه بگیرید.

## ترابری‌ها

### Chrome

ترابری Chrome، URL Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و با نمایه
مرورگر واردشده OpenClaw می‌پیوندد. در macOS، Plugin پیش از اجرا وجود
`BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز کردن Chrome
یک فرمان سلامت پل صوتی و یک فرمان شروع نیز اجرا می‌کند. وقتی Chrome/صدا روی
میزبان Gateway قرار دارد از `chrome` استفاده کنید؛ وقتی Chrome/صدا روی یک Node
جفت‌شده مانند VM macOS در Parallels قرار دارد از `chrome-node` استفاده کنید.
برای Chrome محلی، نمایه را با `browser.defaultProfile` انتخاب کنید؛
`chrome.browserProfile` به میزبان‌های `chrome-node` پاس داده می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از پل صوتی محلی OpenClaw عبور دهید. اگر
`BlackHole 2ch` نصب نشده باشد، پیوستن به‌جای اینکه بی‌صدا و بدون مسیر صوتی انجام
شود، با خطای راه‌اندازی شکست می‌خورد.

### Twilio

ترابری Twilio یک طرح شماره‌گیری سخت‌گیرانه است که به Plugin Voice Call واگذار
می‌شود. این ترابری صفحات Meet را برای یافتن شماره تلفن تجزیه نمی‌کند.

وقتی مشارکت Chrome در دسترس نیست یا یک گزینه پشتیبان شماره‌گیری تلفنی می‌خواهید
از این استفاده کنید. Google Meet باید برای جلسه شماره dial-in تلفنی و PIN ارائه
کند؛ OpenClaw آن‌ها را از صفحه Meet کشف نمی‌کند.

Plugin Voice Call را روی میزبان Gateway فعال کنید، نه روی Node مربوط به Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

اعتبارنامه‌های Twilio را از طریق محیط یا پیکربندی ارائه کنید. محیط، رازها را
بیرون از `openclaw.json` نگه می‌دارد:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

اگر ارائه‌دهنده صدای بلادرنگ شما این است، به‌جای آن از
`realtime.provider: "openai"` همراه با Plugin ارائه‌دهنده OpenAI و
`OPENAI_API_KEY` استفاده کنید.

پس از فعال‌سازی `voice-call`، Gateway را راه‌اندازی مجدد یا reload کنید؛ تغییرات
پیکربندی Plugin تا زمانی که فرایند Gateway در حال اجرا reload نشود، در آن ظاهر
نمی‌شوند.

سپس تایید کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی واگذاری Twilio وصل شده باشد، `googlemeet setup` شامل بررسی‌های موفق
`twilio-voice-call-plugin`، `twilio-voice-call-credentials` و
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

## OAuth و پیش‌پرواز

OAuth برای ایجاد پیوند Meet اختیاری است، زیرا `googlemeet create` می‌تواند به
خودکارسازی مرورگر fallback کند. وقتی ایجاد از طریق API رسمی، resolution فضا، یا
بررسی‌های پیش‌پرواز Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک Google Cloud OAuth
client ایجاد کنید، scopeهای لازم را درخواست کنید، یک حساب Google را مجاز کنید،
سپس refresh token حاصل را در پیکربندی Plugin Google Meet ذخیره کنید یا متغیرهای
محیطی `OPENCLAW_GOOGLE_MEET_*` را ارائه دهید.

OAuth جایگزین مسیر پیوستن Chrome نمی‌شود. وقتی از مشارکت مرورگر استفاده می‌کنید،
ترابری‌های Chrome و Chrome-node همچنان از طریق نمایه Chrome واردشده،
BlackHole/SoX، و یک Node متصل می‌پیوندند. OAuth فقط برای مسیر رسمی Google Meet
API است: ایجاد فضاهای جلسه، resolve کردن فضاها، و اجرای بررسی‌های پیش‌پرواز Meet
Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژه Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحه رضایت OAuth را پیکربندی کنید.
   - **Internal** برای سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا وقتی برنامه در
     حالت Testing است، هر حساب Google که برنامه را مجاز خواهد کرد به‌عنوان کاربر
     آزمایشی اضافه کنید.
4. scopeهایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک OAuth client ID ایجاد کنید.
   - نوع برنامه: **Web application**.
   - URI تغییرمسیر مجاز:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client ID و client secret را کپی کنید.

`meetings.space.created` برای Google Meet `spaces.create` لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به فضاها
resolve کند. `meetings.space.settings` به OpenClaw اجازه می‌دهد هنگام ایجاد اتاق
از طریق API، تنظیمات `SpaceConfig` مانند `accessType` را پاس دهد.
`meetings.conference.media.readonly` برای پیش‌پرواز Meet Media API و کار رسانه
است؛ Google ممکن است برای استفاده واقعی از Media API به ثبت‌نام Developer Preview
نیاز داشته باشد. اگر فقط به پیوستن‌های Chrome مبتنی بر مرورگر نیاز دارید، OAuth
را کاملا رد کنید.

### ساخت refresh token

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها
را به‌عنوان متغیر محیطی پاس دهید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک پیکربندی `oauth` همراه با refresh token چاپ می‌کند. از PKCE،
callback محلی روی `http://localhost:8085/oauth2callback`، و جریان copy/paste
دستی با `--manual` استفاده می‌کند.

نمونه‌ها:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

وقتی مرورگر نمی‌تواند به callback محلی برسد، از حالت دستی استفاده کنید:

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
اگر هم مقدارهای پیکربندی و هم مقدارهای محیطی وجود داشته باشند، Plugin ابتدا
پیکربندی را resolve می‌کند و سپس سراغ fallback محیط می‌رود.

رضایت OAuth شامل ایجاد فضای Meet، دسترسی خواندن فضای Meet، و دسترسی خواندن رسانه
کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه احراز هویت کرده‌اید،
`openclaw googlemeet auth login --json` را دوباره اجرا کنید تا refresh token دارای
scope `meetings.space.created` باشد.

### تایید OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون راز می‌خواهید، doctor مربوط به OAuth را اجرا
کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار runtime مربوط به Chrome را بارگذاری نمی‌کند و به Node متصل Chrome نیاز
ندارد. بررسی می‌کند که پیکربندی OAuth وجود دارد و refresh token می‌تواند access
token بسازد. گزارش JSON فقط شامل فیلدهای وضعیت مانند `ok`، `configured`،
`tokenSource`، `expiresAt` و پیام‌های بررسی است؛ access token، refresh token یا
client secret را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنا                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک توکن دسترسی کش‌شده، وجود دارد.       |
| `oauth-token`        | توکن دسترسی کش‌شده هنوز معتبر است، یا توکن نوسازی یک توکن دسترسی تازه صادر کرده است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای Meet موجود را resolve کرد.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای Meet تازه ایجاد کرد.                               |

برای اثبات فعال‌بودن Google Meet API و scope مربوط به `spaces.create` نیز، بررسی ایجادِ دارای اثر جانبی را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL دورریختنی Meet ایجاد می‌کند. زمانی از آن استفاده کنید که باید تأیید کنید پروژه Google Cloud، Meet API را فعال کرده و حساب مجازشده scope مربوط به `meetings.space.created` را دارد.

برای اثبات دسترسی خواندن به یک فضای جلسه موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک فضای موجود را اثبات می‌کنند که حساب Google مجازشده می‌تواند به آن دسترسی داشته باشد. دریافت `403` از این بررسی‌ها معمولاً یعنی Google Meet REST API غیرفعال است، توکن نوسازیِ رضایت‌داده‌شده scope لازم را ندارد، یا حساب Google نمی‌تواند به آن فضای Meet دسترسی داشته باشد. خطای refresh-token یعنی دوباره `openclaw googlemeet auth login
--json` را اجرا کنید و بلوک `oauth` تازه را ذخیره کنید.

برای fallback مرورگر به هیچ اعتبارنامه OAuth نیاز نیست. در آن حالت، احراز هویت Google از پروفایل Chrome واردشده در node انتخاب‌شده می‌آید، نه از پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان fallback پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` یا `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` یا `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` یا
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` یا `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` یا `GOOGLE_MEET_PREVIEW_ACK`

یک URL، کد، یا `spaces/{id}` مربوط به Meet را از طریق `spaces.get` resolve کنید:

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

با `--meeting`، `artifacts` و `attendance` به‌صورت پیش‌فرض از آخرین رکورد کنفرانس استفاده می‌کنند. وقتی همه رکوردهای نگه‌داشته‌شده برای آن جلسه را می‌خواهید، `--all-conference-records` را بفرستید.

جست‌وجوی Calendar می‌تواند پیش از خواندن artifactهای Meet، URL جلسه را از Google Calendar resolve کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` تقویم `primary` امروز را برای یک رویداد Calendar دارای لینک Google Meet جست‌وجو می‌کند. برای جست‌وجوی متن رویداد مطابق، از `--event <query>` و برای تقویم غیر اصلی از `--calendar <id>` استفاده کنید. جست‌وجوی Calendar به ورود OAuth تازه‌ای نیاز دارد که شامل scope فقط‌خواندنی رویدادهای Calendar باشد.
`calendar-events` رویدادهای Meet مطابق را پیش‌نمایش می‌کند و رویدادی را علامت می‌زند که `latest`، `artifacts`، `attendance`، یا `export` انتخاب خواهد کرد.

اگر از قبل شناسه رکورد کنفرانس را می‌دانید، مستقیم به آن اشاره کنید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

وقتی می‌خواهید پس از تماس، اتاق را ببندید، کنفرانس فعال را برای فضای ایجادشده با API پایان دهید:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

این دستور `spaces.endActiveConference` در Google Meet را فراخوانی می‌کند و برای فضایی که حساب مجازشده می‌تواند مدیریت کند، به OAuth با scope مربوط به `meetings.space.created` نیاز دارد.
OpenClaw ورودی URL مربوط به Meet، کد جلسه، یا `spaces/{id}` را می‌پذیرد و پیش از پایان‌دادن به کنفرانس فعال، آن را به منبع فضای API resolve می‌کند.
این از `googlemeet leave` جداست: `leave` مشارکت محلی/نشستی OpenClaw را متوقف می‌کند، در حالی که `end-active-conference` از Google Meet می‌خواهد کنفرانس فعالِ آن فضا را پایان دهد.

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

`artifacts` فراداده رکورد کنفرانس را به‌همراه فراداده منابع شرکت‌کننده، ضبط، transcript، ورودی transcript ساختاریافته، و smart-note برمی‌گرداند، هر زمان که Google آن را برای جلسه آشکار کند. برای ردکردن جست‌وجوی ورودی در جلسات بزرگ، از `--no-transcript-entries` استفاده کنید. `attendance` شرکت‌کنندگان را به ردیف‌های participant-session با زمان‌های اولین/آخرین مشاهده، مدت کل نشست، پرچم‌های تأخیر/ترک زودهنگام، و منابع شرکت‌کننده تکراری ادغام‌شده بر اساس کاربر واردشده یا نام نمایشی گسترش می‌دهد. برای جدا نگه‌داشتن منابع خام شرکت‌کننده، `--no-merge-duplicates` را بفرستید؛ برای تنظیم تشخیص تأخیر، `--late-after-minutes`؛ و برای تنظیم تشخیص ترک زودهنگام، `--early-before-minutes`.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`، `transcript.md`، `artifacts.json`، `attendance.json`، و `manifest.json` می‌نویسد.
`manifest.json` ورودی انتخاب‌شده، گزینه‌های export، رکوردهای کنفرانس، فایل‌های خروجی، شمارش‌ها، منبع توکن، رویداد Calendar در صورت استفاده، و هر هشدار بازیابی جزئی را ثبت می‌کند. برای نوشتن یک آرشیو قابل‌حمل کنار پوشه نیز، `--zip` را بفرستید. برای export کردن متن Google Docs مربوط به transcript و smart-note لینک‌شده از طریق Google Drive `files.export`، `--include-doc-bodies` را بفرستید؛ این به ورود OAuth تازه‌ای نیاز دارد که شامل scope فقط‌خواندنی Drive Meet باشد. بدون `--include-doc-bodies`، exportها فقط شامل فراداده Meet و ورودی‌های transcript ساختاریافته هستند. اگر Google خطای artifact جزئی برگرداند، مانند خطای فهرست‌کردن smart-note، ورودی transcript، یا بدنه سند Drive، summary و manifest هشدار را نگه می‌دارند، به‌جای اینکه کل export شکست بخورد.
برای دریافت همان داده‌های artifact/attendance و چاپ JSON مربوط به manifest بدون ایجاد پوشه یا ZIP، از `--dry-run` استفاده کنید. این پیش از نوشتن یک export بزرگ یا زمانی مفید است که agent فقط به شمارش‌ها، رکوردهای انتخاب‌شده، و هشدارها نیاز دارد.

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

برای برگرداندن فقط export manifest و ردکردن نوشتن فایل‌ها، `"dryRun": true` را تنظیم کنید.

agentها همچنین می‌توانند یک اتاق پشتیبانی‌شده با API را با سیاست دسترسی صریح ایجاد کنند:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

و می‌توانند کنفرانس فعال را برای یک اتاق شناخته‌شده پایان دهند:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

برای اعتبارسنجی listen-first، agentها باید پیش از ادعای مفیدبودن جلسه، از `test_listen` استفاده کنند:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

smoke زنده محافظت‌شده را روی یک جلسه واقعی نگه‌داشته‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

پروب مرورگر زنده listen-first را روی جلسه‌ای اجرا کنید که کسی در آن با زیرنویس‌های Meet در دسترس صحبت خواهد کرد:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

محیط smoke زنده:

- `OPENCLAW_LIVE_TEST=1` آزمون‌های زنده محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL، کد، یا
  `spaces/{id}` نگه‌داشته‌شده Meet اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه client مربوط به OAuth را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN` توکن نوسازی را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های fallback بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

smoke زنده پایه artifact/attendance به
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. export بدنه سند Drive به
`https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای Meet تازه ایجاد کنید:

```bash
openclaw googlemeet create
```

این دستور `meeting uri` تازه، منبع، و نشست پیوستن را چاپ می‌کند. با اعتبارنامه‌های OAuth از Google Meet API رسمی استفاده می‌کند. بدون اعتبارنامه‌های OAuth، از پروفایل مرورگر واردشده node ثابت‌شده Chrome به‌عنوان fallback استفاده می‌کند. agentها می‌توانند از ابزار `google_meet` با `action: "create"` برای ایجاد و پیوستن در یک مرحله استفاده کنند. برای ایجاد فقط URL، `"join": false` را بفرستید.

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

اگر fallback مرورگر پیش از اینکه بتواند URL را ایجاد کند به مانع ورود Google یا مجوز Meet برخورد کند، متد Gateway یک پاسخ ناموفق برمی‌گرداند و ابزار `google_meet` به‌جای یک رشته ساده، جزئیات ساختاریافته برمی‌گرداند:

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

وقتی agent مقدار `manualActionRequired: true` را می‌بیند، باید `manualActionMessage` را به‌همراه زمینه node/tab مرورگر گزارش کند و تا زمانی که operator مرحله مرورگر را کامل نکرده است، از بازکردن tabهای تازه Meet دست بکشد.

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

ایجاد یک Meet به‌صورت پیش‌فرض به جلسه می‌پیوندد. انتقال‌دهنده Chrome یا Chrome-node همچنان
برای پیوستن از طریق مرورگر به یک پروفایل Google Chrome واردشده نیاز دارد. اگر
پروفایل خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک
خطای بازگشت مرورگر را گزارش می‌کند و از اپراتور می‌خواهد پیش از تلاش دوباره،
ورود به Google را کامل کند.

`preview.enrollmentAcknowledged: true` را فقط پس از تأیید اینکه پروژه Cloud،
اصل OAuth، و شرکت‌کنندگان جلسه در Google Workspace Developer Preview Program
برای Meet media APIs ثبت‌نام شده‌اند تنظیم کنید.

## پیکربندی

مسیر مشترک عامل Chrome فقط به فعال بودن Plugin، BlackHole، SoX، یک
کلید ارائه‌دهنده رونویسی بلادرنگ، و یک ارائه‌دهنده OpenClaw TTS پیکربندی‌شده
نیاز دارد. OpenAI ارائه‌دهنده پیش‌فرض رونویسی است؛ برای استفاده از Google Gemini Live
در حالت `bidi` بدون تغییر ارائه‌دهنده پیش‌فرض رونویسی حالت عامل،
`realtime.voiceProvider` را روی `"google"` و `realtime.model` را تنظیم کنید:

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
- `defaultMode: "agent"` (`"realtime"` فقط به‌عنوان نام مستعار سازگاری قدیمی
  برای `"agent"` پذیرفته می‌شود؛ فراخوانی‌های ابزار جدید باید `"agent"` بگویند)
- `chromeNode.node`: شناسه/نام/IP اختیاری node برای `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحه مهمان Meet خارج‌شده استفاده می‌شود
- `chrome.autoJoin: true`: پر کردن نام مهمان و کلیک روی Join Now به‌صورت بهترین تلاش
  از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال‌سازی یک زبانه Meet موجود به‌جای
  باز کردن نسخه‌های تکراری
- `chrome.waitForInCallMs: 20000`: انتظار برای اینکه زبانه Meet پیش از
  فعال شدن معرفی گفت‌وبرگشتی، وضعیت داخل تماس را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت‌فرمان. از
  `"g711-ulaw-8khz"` فقط برای جفت‌فرمان‌های قدیمی/سفارشی استفاده کنید که هنوز
  صدای تلفنی تولید می‌کنند.
- `chrome.audioBufferBytes: 4096`: بافر پردازش SoX برای فرمان‌های صوتی جفت‌فرمان
  تولیدشده Chrome. این نصف بافر پیش‌فرض 8192 بایتی SoX است و تأخیر لوله پیش‌فرض
  را کاهش می‌دهد، درحالی‌که امکان افزایش آن روی میزبان‌های شلوغ باقی می‌ماند.
  مقادیر کمتر از حداقل SoX به 17 بایت محدود می‌شوند.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch`
  می‌خواند و صدا را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صدا را در `chrome.audioFormat`
  می‌خواند و به CoreAudio `BlackHole 2ch` می‌نویسد
- `chrome.bargeInInputCommand`: فرمان میکروفون محلی اختیاری که PCM مونو
  little-endian شانزده‌بیتی علامت‌دار را برای تشخیص ورود گفتار انسان هنگام
  فعال بودن پخش دستیار می‌نویسد. این در حال حاضر برای پل جفت‌فرمان `chrome`
  میزبانی‌شده توسط Gateway اعمال می‌شود.
- `chrome.bargeInRmsThreshold: 650`: سطح RMS که روی `chrome.bargeInInputCommand`
  به‌عنوان وقفه انسانی شمرده می‌شود
- `chrome.bargeInPeakThreshold: 2500`: سطح قله که روی `chrome.bargeInInputCommand`
  به‌عنوان وقفه انسانی شمرده می‌شود
- `chrome.bargeInCooldownMs: 900`: حداقل تأخیر بین پاک‌سازی‌های تکراری وقفه انسانی
- `mode: "agent"`: حالت پیش‌فرض گفت‌وبرگشت. گفتار شرکت‌کننده توسط
  ارائه‌دهنده رونویسی بلادرنگ پیکربندی‌شده رونویسی می‌شود، به عامل
  OpenClaw پیکربندی‌شده در یک نشست زیرعامل مختص هر جلسه فرستاده می‌شود،
  و از طریق زمان‌اجرای معمول OpenClaw TTS بازگو می‌شود.
- `mode: "bidi"`: حالت جایگزین مستقیم مدل بلادرنگ دوطرفه. ارائه‌دهنده صدای
  بلادرنگ مستقیماً به گفتار شرکت‌کننده پاسخ می‌دهد و ممکن است برای پاسخ‌های
  عمیق‌تر/متکی بر ابزار، `openclaw_agent_consult` را فراخوانی کند.
- `mode: "transcribe"`: حالت فقط مشاهده بدون پل گفت‌وبرگشت.
- `realtime.provider: "openai"`: بازگشت سازگاری که وقتی فیلدهای ارائه‌دهنده
  محدوده‌دار زیر تنظیم نشده‌اند استفاده می‌شود.
- `realtime.transcriptionProvider: "openai"`: شناسه ارائه‌دهنده‌ای که حالت `agent`
  برای رونویسی بلادرنگ استفاده می‌کند.
- `realtime.voiceProvider`: شناسه ارائه‌دهنده‌ای که حالت `bidi` برای صدای
  بلادرنگ مستقیم استفاده می‌کند. برای استفاده از Gemini Live درحالی‌که
  رونویسی حالت عامل روی OpenAI می‌ماند، این را روی `"google"` تنظیم کنید.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، همراه با
  `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی آمادگی گفتاری کوتاه هنگام اتصال پل بلادرنگ؛
  برای پیوستن بی‌صدا آن را روی `""` تنظیم کنید
- `realtime.agentId`: شناسه اختیاری عامل OpenClaw برای
  `openclaw_agent_consult`؛ پیش‌فرض `main` است

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
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs برای هم شنیدن و هم گفتن در حالت عامل:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

صدای پایدار Meet از
`messages.tts.providers.elevenlabs.speakerVoiceId` می‌آید. پاسخ‌های عامل همچنین می‌توانند
وقتی بازنویسی‌های مدل TTS فعال هستند از دستورهای مختص هر پاسخ
`[[tts:speakerVoiceId=... model=eleven_v3]]` استفاده کنند، اما پیکربندی
پیش‌فرض قطعی برای جلسه‌ها است. هنگام پیوستن، گزارش‌ها باید
`transcriptionProvider=elevenlabs` را نشان دهند و هر پاسخ گفتاری باید
`provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` را ثبت کند.

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

`voiceCall.enabled` به‌صورت پیش‌فرض `true` است؛ با انتقال‌دهنده Twilio،
تماس واقعی PSTN، DTMF، و پیام خوشامد معرفی را به Plugin تماس صوتی واگذار می‌کند.
تماس صوتی پیش از باز کردن جریان رسانه بلادرنگ، توالی DTMF را پخش می‌کند،
سپس متن معرفی ذخیره‌شده را به‌عنوان پیام خوشامد اولیه بلادرنگ استفاده می‌کند.
اگر `voice-call` فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را
اعتبارسنجی و ثبت کند، اما نمی‌تواند تماس Twilio را برقرار کند.

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

وقتی Chrome روی میزبان Gateway اجرا می‌شود از `transport: "chrome"` استفاده کنید.
وقتی Chrome روی یک node جفت‌شده مانند یک VM Parallels اجرا می‌شود از
`transport: "chrome-node"` استفاده کنید. در هر دو حالت، ارائه‌دهندگان مدل و
`openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های
مدل همان‌جا می‌مانند. با `mode: "agent"` پیش‌فرض، ارائه‌دهنده رونویسی
بلادرنگ شنیدن را مدیریت می‌کند، عامل OpenClaw پیکربندی‌شده پاسخ را تولید می‌کند،
و OpenClaw TTS معمولی آن را داخل Meet بیان می‌کند. وقتی می‌خواهید مدل صدای
بلادرنگ مستقیماً پاسخ دهد، از `mode: "bidi"` استفاده کنید.
`mode: "realtime"` خام همچنان به‌عنوان نام مستعار سازگاری قدیمی برای
`mode: "agent"` پذیرفته می‌شود، اما دیگر در شِمای ابزار عامل تبلیغ نمی‌شود.
گزارش‌های حالت عامل در شروع پل، ارائه‌دهنده/مدل رونویسی حل‌شده و پس از هر
پاسخ ترکیب‌شده، ارائه‌دهنده TTS، مدل، صدا، قالب خروجی، و نرخ نمونه‌برداری را
شامل می‌شوند.

برای فهرست کردن نشست‌های فعال یا بررسی شناسه نشست از `action: "status"` استفاده کنید.
برای اینکه عامل بلادرنگ فوراً صحبت کند، از `action: "speak"` همراه با
`sessionId` و `message` استفاده کنید. برای ایجاد یا استفاده دوباره از نشست،
فعال کردن یک عبارت شناخته‌شده، و بازگرداندن سلامت `inCall` وقتی میزبان Chrome
می‌تواند آن را گزارش کند، از `action: "test_speech"` استفاده کنید.
`test_speech` همیشه `mode: "agent"` را اجباری می‌کند و اگر از آن خواسته شود
در `mode: "transcribe"` اجرا شود شکست می‌خورد، زیرا نشست‌های فقط مشاهده عمداً
نمی‌توانند گفتار تولید کنند. نتیجه `speechOutputVerified` آن بر اساس افزایش
بایت‌های خروجی صوتی بلادرنگ در طول این فراخوانی آزمایشی است، بنابراین نشست
استفاده‌شده دوباره با صدای قدیمی‌تر به‌عنوان بررسی گفتار موفق تازه شمرده نمی‌شود.
برای علامت‌گذاری پایان نشست از `action: "leave"` استفاده کنید.

`status` در صورت موجود بودن، سلامت Chrome را شامل می‌شود:

- `inCall`: به نظر می‌رسد Chrome داخل تماس Meet است
- `micMuted`: وضعیت میکروفون Meet به‌صورت بهترین تلاش
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: پروفایل
  مرورگر پیش از کار کردن گفتار به ورود دستی، پذیرش میزبان Meet، مجوزها، یا
  تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: اینکه آیا
  گفتار مدیریت‌شده Chrome اکنون مجاز است یا نه. `speechReady: false` یعنی OpenClaw
  عبارت معرفی/آزمایش را به پل صوتی نفرستاده است.
- `providerConnected` / `realtimeReady`: وضعیت پل صدای بلادرنگ
- `lastInputAt` / `lastOutputAt`: آخرین صدای دیده‌شده از پل یا ارسال‌شده به آن
- `audioOutputRouted` / `audioOutputDeviceLabel`: اینکه آیا خروجی رسانه زبانه Meet
  فعالانه به دستگاه BlackHole استفاده‌شده توسط پل هدایت شده است یا نه
- `lastSuppressedInputAt` / `suppressedInputBytes`: ورودی loopback که هنگام فعال بودن
  پخش دستیار نادیده گرفته شده است

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## حالت‌های عامل و bidi

حالت `agent` در Chrome برای رفتار «عامل من در جلسه است» بهینه شده است. ارائه‌دهنده
رونویسی بلادرنگ صدای جلسه را می‌شنود، رونوشت‌های نهایی شرکت‌کننده از طریق عامل
OpenClaw پیکربندی‌شده مسیریابی می‌شوند، و پاسخ از طریق زمان‌اجرای معمول
OpenClaw TTS بیان می‌شود. وقتی می‌خواهید مدل صدای بلادرنگ مستقیماً پاسخ دهد،
`mode: "bidi"` را تنظیم کنید.
قطعه‌های نزدیک رونوشت نهایی پیش از مشاوره ادغام می‌شوند تا یک نوبت گفتاری
چند پاسخ ناقص کهنه تولید نکند. ورودی بلادرنگ همچنین هنگام پخش شدن صدای دستیار
در صف سرکوب می‌شود، و بازتاب‌های اخیر رونوشت شبیه دستیار پیش از مشاوره عامل
نادیده گرفته می‌شوند تا BlackHole loopback باعث نشود عامل به گفتار خودش پاسخ دهد.

| حالت    | چه کسی پاسخ را تعیین می‌کند        | مسیر خروجی گفتار                     | زمان استفاده                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | عامل OpenClaw پیکربندی‌شده | زمان‌اجرای معمول OpenClaw TTS            | وقتی رفتار «عامل من در جلسه است» را می‌خواهید        |
| `bidi`  | مدل صدای بلادرنگ      | پاسخ صوتی ارائه‌دهنده صدای بلادرنگ | وقتی کم‌تأخیرترین حلقه صدای مکالمه‌ای را می‌خواهید |

در حالت `bidi`، وقتی مدل بلادرنگ به استدلال عمیق‌تر، اطلاعات جاری، یا ابزارهای
معمول OpenClaw نیاز دارد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره، عامل معمولی OpenClaw را در پشت صحنه با زمینه رونوشت اخیر
جلسه اجرا می‌کند و یک پاسخ گفتاری موجز برمی‌گرداند. در حالت `agent`،
OpenClaw آن پاسخ را مستقیم به runtime TTS می‌فرستد؛ در حالت `bidi`، مدل
صدای بلادرنگ می‌تواند نتیجه مشاوره را دوباره در جلسه بیان کند. این ابزار از
همان سازوکار مشاوره مشترک Voice Call استفاده می‌کند.

به‌طور پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید
با یک فضای کاری اختصاصی عامل OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار، حافظه و
تاریخچه نشست مشاوره کند، `realtime.agentId` را تنظیم کنید.

مشاوره‌های حالت عامل از یک کلید نشست به‌ازای هر جلسه با قالب
`agent:<id>:subagent:google-meet:<session>` استفاده می‌کنند تا پرسش‌های
پیگیری، ضمن به ارث بردن سیاست معمول عامل از عامل پیکربندی‌شده، زمینه جلسه را
حفظ کنند.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در معرض قرار بده و عامل معمولی را به
  `read`، `web_search`، `web_fetch`، `x_search`، `memory_search` و
  `memory_get` محدود کن.
- `owner`: ابزار مشاوره را در معرض قرار بده و اجازه بده عامل معمولی از سیاست
  ابزار معمول عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صدای بلادرنگ قرار نده.

کلید نشست مشاوره به هر نشست Meet محدود می‌شود، بنابراین فراخوانی‌های پیگیری
مشاوره می‌توانند زمینه مشاوره قبلی را در همان جلسه دوباره استفاده کنند.

برای اجبار یک بررسی آمادگی گفتاری پس از اینکه Chrome کاملا وارد تماس شد:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای smoke کامل ورود و گفتار:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## فهرست بررسی آزمون زنده

پیش از سپردن جلسه به یک عامل بدون ناظر، از این توالی استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت مورد انتظار Chrome-node:

- `googlemeet setup` کاملا سبز است.
- وقتی Chrome-node ترابری پیش‌فرض است یا یک گره سنجاق شده، `googlemeet setup`
  شامل `chrome-node-connected` است.
- `nodes status` نشان می‌دهد گره انتخاب‌شده متصل است.
- گره انتخاب‌شده هر دو قابلیت `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- زبانه Meet وارد تماس می‌شود و `test-speech` سلامت Chrome را با
  `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome از راه دور، مانند VM macOS در Parallels، این کوتاه‌ترین
بررسی امن پس از به‌روزرسانی Gateway یا VM است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند Plugin Gateway بارگذاری شده، گره VM با توکن فعلی متصل است، و
پل صوتی Meet پیش از باز کردن یک زبانه جلسه واقعی توسط عامل، در دسترس است.

برای smoke در Twilio، از جلسه‌ای استفاده کنید که جزئیات تماس تلفنی را نمایش می‌دهد:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin`،
  `twilio-voice-call-credentials` و `twilio-voice-call-webhook` است.
- `voicecall` پس از بارگذاری دوباره Gateway در CLI در دسترس است.
- نشست برگشتی `transport: "twilio"` و یک `twilio.voiceCallId` دارد.
- `openclaw logs --follow` نشان می‌دهد TwiML برای DTMF پیش از TwiML بلادرنگ
  سرو شده، سپس یک پل بلادرنگ با خوشامدگویی اولیه در صف قرار گرفته است.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر همین حالا `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را
بازراه‌اندازی یا دوباره بارگذاری کنید. عامل در حال اجرا فقط ابزارهای Plugin را
می‌بیند که توسط فرایند فعلی Gateway ثبت شده‌اند.

روی میزبان‌های Gateway غیر macOS، ابزار رو به عامل `google_meet` همچنان
قابل مشاهده می‌ماند، اما کنش‌های پاسخ صوتی Chrome محلی پیش از رسیدن به پل صوتی
مسدود می‌شوند. صوت پاسخ‌گویی Chrome محلی در حال حاضر به `BlackHole 2ch` در
macOS وابسته است، بنابراین عامل‌های Linux باید به‌جای مسیر پیش‌فرض عامل
Chrome محلی، از `mode: "transcribe"`، تماس تلفنی Twilio، یا یک میزبان
`chrome-node` در macOS استفاده کنند.

### هیچ گره متصل سازگار با Google Meet وجود ندارد

روی میزبان گره اجرا کنید:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

روی میزبان Gateway، گره را تأیید و فرمان‌ها را بررسی کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

گره باید متصل باشد و `googlemeet.chrome` به‌همراه `browser.proxy` را فهرست کند.
پیکربندی Gateway باید آن فرمان‌های گره را مجاز کند:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

اگر `googlemeet setup` در `chrome-node-connected` شکست می‌خورد یا گزارش Gateway
عبارت `gateway token mismatch` را نشان می‌دهد، گره را با توکن فعلی Gateway
دوباره نصب یا بازراه‌اندازی کنید. برای Gateway روی LAN، معمولا یعنی:

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

### مرورگر باز می‌شود اما عامل نمی‌تواند وارد شود

برای ورودهای فقط مشاهده‌ای `googlemeet test-listen` یا برای ورودهای بلادرنگ
`googlemeet test-speech` را اجرا کنید، سپس سلامت Chrome برگشتی را بررسی کنید.
اگر هرکدام از probeها `manualActionRequired: true` گزارش کرد، `manualActionMessage`
را به اپراتور نشان دهید و تا کامل شدن کنش مرورگر، تلاش مجدد را متوقف کنید.

کنش‌های دستی رایج:

- وارد نمایه Chrome شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی اعلان مجوز بومی Chrome ظاهر شد، مجوزهای میکروفون/دوربین Chrome را بدهید.
- یک گفت‌وگوی مجوز گیرکرده Meet را ببندید یا تعمیر کنید.

صرفا چون Meet نشان می‌دهد "Do you want people to hear you in the meeting?"، گزارش
«وارد نشده» ندهید. این صفحه میانی انتخاب صوتی Meet است؛ OpenClaw وقتی در دسترس
باشد از طریق خودکارسازی مرورگر روی **Use microphone** کلیک می‌کند و همچنان
منتظر وضعیت واقعی جلسه می‌ماند. برای fallback مرورگر فقط-ایجاد، OpenClaw ممکن
است روی **Continue without microphone** کلیک کند، چون ایجاد URL به مسیر صوتی
بلادرنگ نیاز ندارد.

### ایجاد جلسه شکست می‌خورد

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند از
endpoint `spaces.create` در Google Meet API استفاده می‌کند. بدون اعتبارنامه‌های
OAuth به مرورگر گره Chrome سنجاق‌شده fallback می‌کند. تأیید کنید:

- برای ایجاد از API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند،
  یا متغیرهای محیطی همتای `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ایجاد از API: refresh token پس از اضافه شدن پشتیبانی ایجاد صادر شده است.
  توکن‌های قدیمی‌تر ممکن است scope `meetings.space.created` را نداشته باشند؛
  `openclaw googlemeet auth login --json` را دوباره اجرا کنید و پیکربندی Plugin
  را به‌روز کنید.
- برای fallback مرورگر: `defaultTransport: "chrome-node"` و `chromeNode.node`
  به یک گره متصل با `browser.proxy` و `googlemeet.chrome` اشاره می‌کنند.
- برای fallback مرورگر: نمایه Chrome متعلق به OpenClaw روی آن گره وارد Google
  شده و می‌تواند `https://meet.google.com/new` را باز کند.
- برای fallback مرورگر: تلاش‌های مجدد، پیش از باز کردن زبانه تازه، از زبانه
  موجود `https://meet.google.com/new` یا اعلان حساب Google دوباره استفاده می‌کنند.
  اگر عامل timeout شد، به‌جای باز کردن دستی یک زبانه دیگر Meet، فراخوانی ابزار
  را دوباره تلاش کنید.
- برای fallback مرورگر: اگر ابزار `manualActionRequired: true` برگرداند، از
  `browser.nodeId`، `browser.targetId`، `browserUrl` و `manualActionMessage`
  برگشتی برای راهنمایی اپراتور استفاده کنید. تا کامل شدن آن کنش، در حلقه تلاش
  مجدد نکنید.
- برای fallback مرورگر: اگر Meet نشان می‌دهد "Do you want people to hear you in the
  meeting?"، زبانه را باز نگه دارید. OpenClaw باید از طریق خودکارسازی مرورگر روی
  **Use microphone** یا، برای fallback فقط-ایجاد، روی **Continue without microphone**
  کلیک کند و منتظر URL تولیدشده Meet بماند. اگر نتواند، خطا باید
  `meet-audio-choice-required` را ذکر کند، نه `google-login-required`.

### عامل وارد می‌شود اما صحبت نمی‌کند

مسیر بلادرنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای مسیر معمول STT -> عامل OpenClaw -> پاسخ صوتی TTS از `mode: "agent"` استفاده
کنید، یا برای fallback مستقیم صدای بلادرنگ از `mode: "bidi"` استفاده کنید.
`mode: "transcribe"` عمدا پل پاسخ صوتی را شروع نمی‌کند. برای اشکال‌زدایی
فقط مشاهده‌ای، پس از صحبت شرکت‌کنندگان `openclaw googlemeet status --json <session-id>`
را اجرا کنید و `captioning`، `transcriptLines` و `lastCaptionText` را بررسی کنید.
اگر `inCall` برابر true است اما `transcriptLines` روی `0` می‌ماند، ممکن است
زیرنویس‌های Meet غیرفعال باشند، از زمان نصب مشاهده‌گر کسی صحبت نکرده باشد،
رابط کاربری Meet تغییر کرده باشد، یا زیرنویس زنده برای زبان/حساب جلسه در دسترس نباشد.

`googlemeet test-speech` همیشه مسیر بلادرنگ را بررسی می‌کند و گزارش می‌دهد آیا
برای آن فراخوانی، بایت‌های خروجی پل مشاهده شده‌اند یا نه. اگر `speechOutputVerified`
false و `speechOutputTimedOut` true باشد، ارائه‌دهنده بلادرنگ ممکن است utterance
را پذیرفته باشد اما OpenClaw ندیده باشد که بایت‌های خروجی تازه به پل صوتی
Chrome برسند.

همچنین بررسی کنید:

- یک کلید ارائه‌دهنده بلادرنگ روی میزبان Gateway در دسترس است، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده است.
- `sox` روی میزبان Chrome وجود دارد.
- میکروفون و بلندگوی Meet از مسیر صوتی مجازی استفاده‌شده توسط OpenClaw عبور
  داده شده‌اند. `doctor` باید برای ورودهای بلادرنگ Chrome محلی
  `meet output routed: yes` را نشان دهد.

`googlemeet doctor [session-id]` نشست، گره، وضعیت داخل تماس، دلیل کنش دستی،
اتصال ارائه‌دهنده بلادرنگ، `realtimeReady`، فعالیت ورودی/خروجی صوت، آخرین
timestampهای صوتی، شمارنده‌های بایت و URL مرورگر را چاپ می‌کند. وقتی به JSON خام
نیاز دارید، از `googlemeet status [session-id] --json` استفاده کنید. وقتی باید
refresh مربوط به OAuth در Google Meet را بدون افشای توکن‌ها بررسی کنید، از
`googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API هم نیاز
دارید، `--meeting` یا `--create-space` را اضافه کنید.

اگر عامل timeout شد و می‌بینید یک زبانه Meet از قبل باز است، بدون باز کردن زبانه
دیگر همان زبانه را بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

کنش ابزار معادل `recover_current_tab` است. این کنش یک زبانه موجود Meet را برای
ترابری انتخاب‌شده فوکوس و بررسی می‌کند. با `chrome`، از کنترل مرورگر محلی از
طریق Gateway استفاده می‌کند؛ با `chrome-node`، از گره Chrome پیکربندی‌شده
استفاده می‌کند. زبانه تازه باز نمی‌کند یا نشست تازه نمی‌سازد؛ مانع فعلی را
گزارش می‌کند، مانند ورود، پذیرش، مجوزها، یا وضعیت انتخاب صوتی. فرمان CLI با
Gateway پیکربندی‌شده صحبت می‌کند، بنابراین Gateway باید در حال اجرا باشد؛
`chrome-node` همچنین نیاز دارد گره Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

`twilio-voice-call-plugin` وقتی `voice-call` مجاز یا فعال نباشد شکست می‌خورد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید،
و Gateway را دوباره بارگذاری کنید.

`twilio-voice-call-credentials` وقتی backend مربوط به Twilio فاقد account SID،
auth token یا شماره تماس‌گیرنده باشد شکست می‌خورد. این‌ها را روی میزبان Gateway
تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` وقتی `voice-call` هیچ در معرض‌گذاری عمومی Webhook
نداشته باشد، یا وقتی `publicUrl` به loopback یا فضای شبکه خصوصی اشاره کند،
شکست می‌خورد. `plugins.entries.voice-call.config.publicUrl` را روی URL عمومی
ارائه‌دهنده تنظیم کنید یا یک tunnel/Tailscale exposure برای `voice-call`
پیکربندی کنید.

URLهای loopback و خصوصی برای callbackهای carrier معتبر نیستند. از `localhost`،
`127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`، `192.168.x`،
`169.254.x`، `fc00::/7` یا `fd00::/8` به‌عنوان `publicUrl` استفاده نکنید.

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

برای توسعهٔ محلی، به‌جای URL میزبان خصوصی از یک تونل یا در معرض‌گذاری Tailscale
استفاده کنید:

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

سپس Gateway را راه‌اندازی مجدد یا بازبارگذاری کنید و اجرا کنید:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌صورت پیش‌فرض فقط آمادگی را بررسی می‌کند. برای اجرای آزمایشی روی یک شمارهٔ مشخص:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط زمانی `--yes` را اضافه کنید که عمداً می‌خواهید یک تماس اعلان خروجی زنده
برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید که رویداد Meet جزئیات شماره‌گیری تلفنی را ارائه می‌کند. شمارهٔ دقیق
شماره‌گیری و PIN یا یک توالی DTMF سفارشی را وارد کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر ارائه‌دهنده پیش از وارد کردن PIN به مکث نیاز دارد، در `--dtmf-sequence` از
`w` ابتدایی یا ویرگول استفاده کنید.

اگر تماس تلفنی ایجاد می‌شود اما فهرست اعضای Meet هرگز شرکت‌کنندهٔ شماره‌گیری‌شده
را نشان نمی‌دهد:

- `openclaw googlemeet doctor <session-id>` را اجرا کنید تا شناسهٔ تماس Twilio
  واگذارشده، اینکه آیا DTMF در صف قرار گرفته، و اینکه آیا پیام خوشامد اولیه درخواست شده است تأیید شود.
- `openclaw voicecall status --call-id <id>` را اجرا کنید و تأیید کنید که تماس
  هنوز فعال است.
- `openclaw voicecall tail` را اجرا کنید و بررسی کنید که Webhookهای Twilio به
  Gateway می‌رسند.
- `openclaw logs --follow` را اجرا کنید و به‌دنبال توالی Twilio Meet بگردید: Google
  Meet پیوستن را واگذار می‌کند، Voice Call توالی DTMF TwiML پیش از اتصال را ذخیره و ارائه می‌کند،
  Voice Call برای تماس Twilio توالی TwiML بلادرنگ را ارائه می‌کند، سپس Google Meet با
  `voicecall.speak` گفتار معرفی را درخواست می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ بررسی موفق
  setup لازم است اما درست بودن توالی PIN جلسه را ثابت نمی‌کند.
- تأیید کنید که شمارهٔ شماره‌گیری متعلق به همان دعوت‌نامه و منطقهٔ Meet است که
  PIN به آن مربوط می‌شود.
- اگر Meet کند پاسخ می‌دهد یا متن تماس پس از ارسال DTMF پیش از اتصال هنوز اعلان
  درخواست PIN را نشان می‌دهد، `voiceCall.dtmfDelayMs` را از مقدار پیش‌فرض ۱۲ ثانیه افزایش دهید.
- اگر شرکت‌کننده وارد می‌شود اما پیام خوشامد را نمی‌شنوید، در
  `openclaw logs --follow` درخواست پس از DTMF مربوط به `voicecall.speak` و
  پخش TTS از طریق media-stream یا جایگزین Twilio `<Say>` را بررسی کنید. اگر متن
  تماس هنوز شامل «enter the meeting PIN» است، شاخهٔ تلفنی هنوز وارد اتاق Meet نشده است،
  بنابراین شرکت‌کنندگان جلسه گفتار را نخواهند شنید.

اگر Webhookها نمی‌رسند، ابتدا Plugin تماس صوتی را اشکال‌زدایی کنید: ارائه‌دهنده باید
به `plugins.entries.voice-call.config.publicUrl` یا تونل پیکربندی‌شده دسترسی داشته باشد.
[عیب‌یابی تماس صوتی](/fa/plugins/voice-call#troubleshooting) را ببینید.

## نکات

API رسمی رسانهٔ Google Meet دریافت‌محور است، بنابراین صحبت کردن در یک تماس Meet
هنوز به مسیر شرکت‌کننده نیاز دارد. این Plugin آن مرز را آشکار نگه می‌دارد:
Chrome مشارکت مرورگر و مسیریابی صوت محلی را مدیریت می‌کند؛ Twilio مشارکت از طریق
شماره‌گیری تلفنی را مدیریت می‌کند.

حالت‌های پاسخ‌گویی Chrome به `BlackHole 2ch` به‌همراه یکی از موارد زیر نیاز دارند:

- `chrome.audioInputCommand` به‌همراه `chrome.audioOutputCommand`: OpenClaw مالک
  پل است و صدا را با قالب `chrome.audioFormat` بین آن فرمان‌ها و ارائه‌دهندهٔ
  انتخاب‌شده لوله‌کشی می‌کند. حالت عامل از رونویسی بلادرنگ به‌همراه TTS معمولی استفاده می‌کند؛
  حالت bidi از ارائه‌دهندهٔ صدای بلادرنگ استفاده می‌کند. مسیر پیش‌فرض Chrome
  برابر با PCM16 با نرخ ۲۴ کیلوهرتز و `chrome.audioBufferBytes: 4096` است؛
  G.711 mu-law با نرخ ۸ کیلوهرتز برای جفت‌فرمان‌های قدیمی همچنان در دسترس است.
- `chrome.audioBridgeCommand`: یک فرمان پل خارجی مالک کل مسیر صوت محلی است و
  باید پس از راه‌اندازی یا اعتبارسنجی daemon خود خارج شود. این فقط برای `bidi`
  معتبر است، زیرا حالت `agent` برای TTS به دسترسی مستقیم جفت‌فرمان نیاز دارد.

وقتی یک عامل ابزار `google_meet` را در حالت agent فراخوانی می‌کند، نشست مشاور
جلسه پیش از پاسخ دادن به گفتار شرکت‌کننده، transcript فعلی فراخواننده را fork می‌کند.
نشست Meet همچنان جدا می‌ماند (`agent:<agentId>:subagent:google-meet:<sessionId>`)
تا پیگیری‌های جلسه transcript فراخواننده را مستقیماً تغییر ندهند.

برای صدای دوطرفهٔ تمیز، خروجی Meet و میکروفن Meet را از طریق دستگاه‌های مجازی
جداگانه یا یک گراف دستگاه مجازی به‌سبک Loopback مسیریابی کنید. یک دستگاه مشترک
BlackHole می‌تواند صدای دیگر شرکت‌کنندگان را دوباره به تماس بازتاب دهد.

با پل Chrome مبتنی بر جفت‌فرمان، `chrome.bargeInInputCommand` می‌تواند به یک
میکروفن محلی جداگانه گوش دهد و هنگام شروع صحبت انسان، پخش دستیار را پاک کند.
این کار گفتار انسان را حتی زمانی که ورودی local loopback مشترک BlackHole در طول
پخش دستیار موقتاً سرکوب شده است، جلوتر از خروجی دستیار نگه می‌دارد.
مانند `chrome.audioInputCommand` و `chrome.audioOutputCommand`، این یک فرمان محلی
پیکربندی‌شده توسط اپراتور است. از یک مسیر فرمان یا فهرست آرگومان صریح و مورد اعتماد
استفاده کنید و آن را به اسکریپت‌های مکان‌های نامطمئن اشاره ندهید.

`googlemeet speak` پل صوتی پاسخ‌گویی فعال را برای یک نشست Chrome فعال می‌کند.
`googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق Plugin
Voice Call واگذار شده‌اند، `leave` تماس صوتی زیربنایی را نیز قطع می‌کند.
وقتی می‌خواهید کنفرانس فعال Google Meet را نیز برای یک فضای مدیریت‌شده با API ببندید،
از `googlemeet end-active-conference` استفاده کنید.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
