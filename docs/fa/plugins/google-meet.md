---
read_when:
    - می‌خواهید یک عامل OpenClaw به تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - شما در حال پیکربندی Chrome، گره Chrome یا Twilio به‌عنوان ترابری Google Meet هستید
summary: 'Plugin Google Meet: پیوستن به URLهای صریح Meet از طریق Chrome یا Twilio با پیش‌فرض‌های پاسخ‌گویی صوتی عامل'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T18:00:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b154e9cbce560dbc8327a140b27c17d2614d13d7011032a48b110314772ab0c
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی شرکت‌کننده Google Meet برای OpenClaw — این Plugin طبق طراحی صریح است:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید ایجاد کند و سپس به URL
  بازگردانده‌شده بپیوندد.
- `agent` حالت پیش‌فرض پاسخ‌گویی است: رونویسی بی‌درنگ گوش می‌دهد، عامل
  پیکربندی‌شده OpenClaw پاسخ می‌دهد، و TTS معمول OpenClaw در Meet صحبت می‌کند.
- `bidi` همچنان به‌عنوان حالت پشتیبان مدل صوتی بی‌درنگ مستقیم در دسترس است.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: از `agent` برای
  گوش‌دادن/پاسخ‌گویی زنده، از `bidi` برای پشتیبان صوتی بی‌درنگ مستقیم، یا از `transcribe`
  برای پیوستن/کنترل مرورگر بدون پل پاسخ‌گویی استفاده کنید.
- احراز هویت ابتدا به‌صورت Google OAuth شخصی یا یک پروفایل Chrome از قبل واردشده شروع می‌شود.
- اعلام رضایت خودکار وجود ندارد.
- backend صوتی پیش‌فرض Chrome برابر `BlackHole 2ch` است.
- Chrome می‌تواند به‌صورت محلی یا روی یک میزبان Node جفت‌شده اجرا شود.
- Twilio یک شماره شماره‌گیری به‌همراه PIN اختیاری یا دنباله DTMF را می‌پذیرد؛
  نمی‌تواند مستقیما با URL مربوط به Meet تماس بگیرد.
- دستور CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر
  کنفرانس از راه دور عامل رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید و یک provider رونویسی بی‌درنگ به‌همراه
TTS معمول OpenClaw را پیکربندی کنید. OpenAI provider پیش‌فرض رونویسی است؛
Google Gemini Live نیز به‌عنوان یک پشتیبان صوتی `bidi` جداگانه با
`realtime.voiceProvider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده
Homebrew پیش از آنکه macOS دستگاه را نمایان کند، به راه‌اندازی دوباره نیاز دارد:

```bash
sudo reboot
```

پس از راه‌اندازی دوباره، هر دو بخش را بررسی کنید:

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

خروجی setup برای خوانایی توسط عامل و آگاهی از حالت طراحی شده است. پروفایل
Chrome، اتصال به Node، و برای پیوستن‌های بی‌درنگ Chrome، پل صوتی BlackHole/SoX
و بررسی‌های مقدمه بی‌درنگ با تأخیر را گزارش می‌کند. برای پیوستن‌های فقط-مشاهده،
همان انتقال را با `--mode transcribe` بررسی کنید؛ این حالت پیش‌نیازهای صوتی
بی‌درنگ را رد می‌کند چون از طریق پل گوش نمی‌دهد یا صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، setup همچنین گزارش می‌کند که آیا
Plugin `voice-call`، اعتبارنامه‌های Twilio، و در دسترس بودن Webhook عمومی آماده‌اند یا نه.
هر بررسی `ok: false` را پیش از درخواست از عامل برای پیوستن، برای transport و حالت
بررسی‌شده یک blocker در نظر بگیرید. برای اسکریپت‌ها یا خروجی قابل‌خواندن توسط ماشین
از `openclaw googlemeet setup --json` استفاده کنید. برای پیش‌پرواز یک transport مشخص
پیش از تلاش عامل، از `--transport chrome`،‏
`--transport chrome-node`، یا `--transport twilio` استفاده کنید.

برای Twilio، وقتی transport پیش‌فرض Chrome است، همیشه transport را به‌صورت صریح پیش‌پرواز کنید:

```bash
openclaw googlemeet setup --transport twilio
```

این کار نبود اتصال `voice-call`، اعتبارنامه‌های Twilio، یا دسترسی‌ناپذیری
Webhook را پیش از تلاش عامل برای شماره‌گیری جلسه تشخیص می‌دهد.

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
  "mode": "agent"
}
```

ابزار روبه‌عامل `google_meet` روی میزبان‌های غیر macOS برای جریان‌های artifact،
calendar، setup، transcribe، Twilio، و `chrome-node` همچنان در دسترس می‌ماند. کنش‌های
پاسخ‌گویی Chrome محلی در آنجا مسدود می‌شوند، چون مسیر صوتی Chrome همراه‌شده در حال حاضر
به `BlackHole 2ch` در macOS وابسته است. روی Linux، برای مشارکت پاسخ‌گویی Chrome
از `mode: "transcribe"`، شماره‌گیری Twilio، یا یک میزبان macOS `chrome-node` استفاده کنید.

یک جلسه جدید ایجاد کنید و به آن بپیوندید:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

برای اتاق‌های ایجادشده با API، وقتی می‌خواهید سیاست ورود بدون knock اتاق
به‌جای ارث‌بری از پیش‌فرض‌های حساب Google صریح باشد، از Google Meet
`SpaceConfig.accessType` استفاده کنید:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` به هر کسی که URL مربوط به Meet را دارد اجازه می‌دهد بدون knock بپیوندد. `TRUSTED`
به کاربران مورداعتماد سازمان میزبان، کاربران خارجی دعوت‌شده، و کاربران dial-in اجازه می‌دهد
بدون knock بپیوندند. `RESTRICTED` ورود بدون knock را به دعوت‌شدگان محدود می‌کند. این
تنظیمات فقط برای مسیر رسمی ایجاد با Google Meet API اعمال می‌شوند، بنابراین اعتبارنامه‌های
OAuth باید پیکربندی شده باشند.

اگر پیش از در دسترس بودن این گزینه Google Meet را احراز هویت کرده‌اید، پس از افزودن scope
`meetings.space.settings` به صفحه رضایت Google OAuth خود، دوباره
`openclaw googlemeet auth login --json` را اجرا کنید.

فقط URL را بدون پیوستن ایجاد کنید:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` دو مسیر دارد:

- ایجاد با API: وقتی اعتبارنامه‌های OAuth مربوط به Google Meet پیکربندی شده باشند استفاده می‌شود. این
  قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- پشتیبان مرورگر: وقتی اعتبارنامه‌های OAuth وجود نداشته باشند استفاده می‌شود. OpenClaw از
  Node ثابت‌شده Chrome استفاده می‌کند، `https://meet.google.com/new` را باز می‌کند، منتظر می‌ماند Google
  به یک URL واقعی دارای کد جلسه redirect کند، سپس آن URL را برمی‌گرداند. این مسیر نیاز دارد
  پروفایل Chrome متعلق به OpenClaw روی Node از قبل وارد Google شده باشد.
  خودکارسازی مرورگر prompt اولین اجرای میکروفون خود Meet را مدیریت می‌کند؛ آن prompt
  به‌عنوان شکست ورود Google در نظر گرفته نمی‌شود.
  جریان‌های پیوستن و ایجاد همچنین تلاش می‌کنند پیش از باز کردن یک مورد جدید، از یک تب موجود Meet
  دوباره استفاده کنند. تطبیق، query stringهای بی‌ضرر URL مانند `authuser` را نادیده می‌گیرد، بنابراین
  تلاش دوباره عامل باید به‌جای ایجاد تب دوم Chrome، جلسه از قبل باز را focus کند.

خروجی دستور/ابزار شامل یک فیلد `source` (`api` یا `browser`) است تا عامل‌ها
بتوانند توضیح دهند کدام مسیر استفاده شده است. `create` به‌صورت پیش‌فرض به جلسه جدید می‌پیوندد و
`joined: true` به‌همراه نشست پیوستن را برمی‌گرداند. برای فقط ساختن URL، در CLI از
`create --no-join` استفاده کنید یا `"join": false` را به ابزار بدهید.

یا به یک عامل بگویید: «یک Google Meet ایجاد کن، با حالت پاسخ‌گویی عامل به آن بپیوند،
و لینک را برایم بفرست.» عامل باید `google_meet` را با
`action: "create"` فراخوانی کند و سپس `meetingUri` بازگردانده‌شده را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

برای پیوستن فقط-مشاهده/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید. این کار
پل صوتی بی‌درنگ دوطرفه را شروع نمی‌کند، به BlackHole یا SoX نیاز ندارد،
و در جلسه پاسخ نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای مجوز
میکروفون/دوربین OpenClaw و مسیر **Use
microphone** در Meet پرهیز می‌کنند. اگر Meet یک interstitial انتخاب صدا نشان دهد، خودکارسازی
مسیر بدون میکروفون را امتحان می‌کند و در غیر این صورت به‌جای باز کردن میکروفون محلی،
یک اقدام دستی گزارش می‌کند. در حالت transcribe، transportهای Chrome مدیریت‌شده همچنین
یک observer زیرنویس Meet به‌صورت best-effort نصب می‌کنند. `googlemeet status --json` و
`googlemeet doctor` موارد `captioning`،‏ `captionsEnabledAttempted`،
`transcriptLines`،‏ `lastCaptionAt`،‏ `lastCaptionSpeaker`،‏ `lastCaptionText`،
و یک دنباله کوتاه `recentTranscript` را نشان می‌دهند تا operatorها بتوانند تشخیص دهند آیا مرورگر
به تماس پیوسته و آیا زیرنویس‌های Meet متن تولید می‌کنند یا نه.
وقتی به یک probe بله/خیر نیاز دارید از `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
استفاده کنید: این دستور در حالت transcribe می‌پیوندد، منتظر حرکت تازه در caption یا transcript می‌ماند،
و `listenVerified`،‏ `listenTimedOut`، فیلدهای اقدام دستی، و تازه‌ترین وضعیت سلامت caption را برمی‌گرداند.

در طول نشست‌های بی‌درنگ، وضعیت `google_meet` شامل سلامت مرورگر و پل صوتی مانند
`inCall`،‏ `manualActionRequired`،‏ `providerConnected`،
`realtimeReady`،‏ `audioInputActive`،‏ `audioOutputActive`، زمان‌مهرهای آخرین ورودی/خروجی،
شمارنده‌های بایت، و وضعیت بسته بودن پل است. اگر یک prompt امن صفحه Meet ظاهر شود،
خودکارسازی مرورگر وقتی بتواند آن را مدیریت می‌کند. ورود، پذیرش میزبان، و promptهای مجوز
مرورگر/OS به‌عنوان اقدام دستی همراه با دلیل و پیام برای انتقال توسط عامل گزارش می‌شوند.
نشست‌های Chrome مدیریت‌شده فقط پس از آن intro یا عبارت test را emit می‌کنند که سلامت مرورگر
`inCall: true` را گزارش کند؛ در غیر این صورت وضعیت `speechReady: false` را گزارش می‌کند و
تلاش برای صحبت به‌جای وانمود کردن به اینکه عامل در جلسه صحبت کرده، مسدود می‌شود.

پیوستن‌های Chrome محلی از طریق پروفایل مرورگر OpenClaw واردشده انجام می‌شوند. حالت بی‌درنگ
برای مسیر میکروفون/اسپیکر مورد استفاده OpenClaw به `BlackHole 2ch` نیاز دارد. برای
صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا یک گراف سبک Loopback استفاده کنید؛ یک دستگاه
BlackHole واحد برای نخستین smoke test کافی است اما می‌تواند echo ایجاد کند.

### Gateway محلی + Chrome در Parallels

برای اینکه VM مالک Chrome باشد، به یک OpenClaw Gateway کامل یا کلید API مدل درون macOS VM
نیاز **ندارید**. Gateway و عامل را محلی اجرا کنید، سپس یک
میزبان Node در VM اجرا کنید. Plugin همراه‌شده را یک‌بار روی VM فعال کنید تا Node
دستور Chrome را advertise کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، workspace عامل، کلیدهای مدل/API، provider بی‌درنگ،
  و پیکربندی Plugin مربوط به Google Meet.
- Parallels macOS VM: OpenClaw CLI/میزبان Node، Google Chrome، SoX، BlackHole 2ch،
  و یک پروفایل Chrome واردشده به Google.
- در VM لازم نیست: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا setup
  provider مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را راه‌اندازی دوباره کنید تا macOS دستگاه `BlackHole 2ch` را نمایان کند:

```bash
sudo reboot
```

پس از راه‌اندازی دوباره، بررسی کنید VM می‌تواند دستگاه صوتی و دستورات SoX را ببیند:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

OpenClaw را در VM نصب یا به‌روزرسانی کنید، سپس Plugin همراه‌شده را آنجا فعال کنید:

```bash
openclaw plugins enable google-meet
```

میزبان Node را در VM شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP شبکه LAN است و از TLS استفاده نمی‌کنید، Node
WebSocket متن‌واضح را رد می‌کند مگر اینکه برای آن شبکه خصوصی مورداعتماد opt in کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

هنگام نصب Node به‌عنوان LaunchAgent، از همان متغیر محیطی استفاده کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` محیط پردازش است، نه یک تنظیم
`openclaw.json`. وقتی روی دستور نصب وجود داشته باشد، `openclaw node install` آن را در محیط
LaunchAgent ذخیره می‌کند.

Node را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید Gateway، Node را می‌بیند و اینکه هم `googlemeet.chrome`
و هم قابلیت مرورگر/`browser.proxy` را advertise می‌کند:

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

اکنون از میزبان Gateway به‌صورت معمول بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

یا از عامل بخواهید از ابزار `google_meet` با `transport: "chrome-node"` استفاده کند.

برای یک smoke test تک‌دستوری که یک نشست ایجاد می‌کند یا از آن دوباره استفاده می‌کند، یک
عبارت شناخته‌شده را می‌گوید، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

هنگام پیوستن بلادرنگ، خودکارسازی مرورگر OpenClaw نام مهمان را پر می‌کند، روی
پیوستن/درخواست پیوستن کلیک می‌کند و وقتی اعلان انتخاب بار اول Meet برای «استفاده از میکروفون»
ظاهر شود، آن را می‌پذیرد. هنگام پیوستن فقط برای مشاهده یا ایجاد جلسه فقط با مرورگر، در صورت
در دسترس بودن گزینهٔ بدون میکروفون، از همان اعلان عبور می‌کند.
اگر پروفایل مرورگر وارد نشده باشد، Meet منتظر پذیرش میزبان باشد،
Chrome برای پیوستن بلادرنگ به مجوز میکروفون/دوربین نیاز داشته باشد، یا Meet روی
اعلانی گیر کرده باشد که خودکارسازی نتوانسته آن را حل کند، نتیجهٔ join/test-speech
`manualActionRequired: true` را همراه با `manualActionReason` و
`manualActionMessage` گزارش می‌کند. عامل‌ها باید تلاش دوباره برای پیوستن را متوقف کنند،
همان پیام دقیق به‌همراه `browserUrl`/`browserTitle` فعلی را گزارش کنند و فقط پس از
تکمیل اقدام دستی در مرورگر دوباره تلاش کنند.

اگر `chromeNode.node` حذف شده باشد، OpenClaw فقط زمانی به‌صورت خودکار انتخاب می‌کند که دقیقاً یک
Node متصل هم `googlemeet.chrome` و هم کنترل مرورگر را اعلام کند. اگر
چند Node توانمند متصل باشند، `chromeNode.node` را روی شناسهٔ Node،
نام نمایشی یا IP راه دور تنظیم کنید.

بررسی‌های رایج خرابی:

- `Configured Google Meet node ... is not usable: offline`: Node سنجاق‌شده برای
  Gateway شناخته شده است اما در دسترس نیست. عامل‌ها باید آن Node را
  وضعیت تشخیصی در نظر بگیرند، نه میزبان Chrome قابل استفاده، و مانع راه‌اندازی را
  به‌جای برگشت به انتقالی دیگر گزارش کنند، مگر اینکه کاربر چنین خواسته باشد.
- `No connected Google Meet-capable node`: در VM فرمان `openclaw node run` را شروع کنید،
  جفت‌سازی را تأیید کنید و مطمئن شوید `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تأیید کنید که
  میزبان Gateway هر دو فرمان Node را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز کرده است.
- `BlackHole 2ch audio device not found`: روی میزبانی که بررسی می‌شود
  `blackhole-2ch` را نصب کنید و پیش از استفاده از صدای Chrome محلی راه‌اندازی مجدد کنید.
- `BlackHole 2ch audio device not found on the node`: در VM
  `blackhole-2ch` را نصب کنید و VM را راه‌اندازی مجدد کنید.
- Chrome باز می‌شود اما نمی‌تواند بپیوندد: داخل VM به پروفایل مرورگر وارد شوید، یا
  برای پیوستن مهمان، `chrome.guestName` را تنظیم‌شده نگه دارید. پیوستن خودکار مهمان از
  خودکارسازی مرورگر OpenClaw از طریق پراکسی مرورگر Node استفاده می‌کند؛ مطمئن شوید
  پیکربندی مرورگر Node به پروفایلی که می‌خواهید اشاره می‌کند، برای مثال
  `browser.defaultProfile: "user"` یا یک پروفایل نشست موجودِ نام‌گذاری‌شده.
- تب‌های تکراری Meet: گزینهٔ `chrome.reuseExistingTab: true` را فعال نگه دارید. OpenClaw
  پیش از باز کردن تب جدید، تب موجود برای همان URL در Meet را فعال می‌کند، و
  ایجاد جلسه با مرورگر، پیش از باز کردن تب دیگر، از تب درحال‌انجام
  `https://meet.google.com/new` یا اعلان حساب Google استفادهٔ دوباره می‌کند.
- بدون صدا: در Meet، میکروفون/بلندگو را از مسیر دستگاه صوتی مجازی
  مورد استفادهٔ OpenClaw عبور دهید؛ برای صدای دوطرفهٔ تمیز از دستگاه‌های مجازی جداگانه
  یا مسیریابی سبک Loopback استفاده کنید.

## نکات نصب

پیش‌فرض بازگویی Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. این Plugin از فرمان‌های صریح دستگاه CoreAudio
  برای پل صوتی پیش‌فرض PCM16 با نرخ 24 kHz استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این ابزار دستگاه صوتی `BlackHole 2ch`
  را ایجاد می‌کند که Chrome/Meet می‌توانند از آن عبور کنند.

OpenClaw هیچ‌کدام از این بسته‌ها را همراه خود ارائه یا بازتوزیع نمی‌کند. مستندات از کاربران می‌خواهند
آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق Homebrew نصب کنند. SoX با مجوز
`LGPL-2.0-only AND GPL-2.0-only` منتشر شده است؛ BlackHole دارای GPL-3.0 است. اگر
نصب‌کننده یا appliance می‌سازید که BlackHole را همراه با OpenClaw بسته‌بندی می‌کند، شرایط
مجوز بالادستی BlackHole را بررسی کنید یا از Existential Audio مجوز جداگانه بگیرید.

## انتقال‌ها

### Chrome

انتقال Chrome نشانی Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و
به‌عنوان پروفایل مرورگر واردشدهٔ OpenClaw می‌پیوندد. در macOS، این Plugin پیش از اجرا وجود
`BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز کردن Chrome یک فرمان
سلامت پل صوتی و فرمان راه‌اندازی نیز اجرا می‌کند. وقتی
Chrome/صدا روی میزبان Gateway قرار دارند از `chrome` استفاده کنید؛ وقتی Chrome/صدا روی
Node جفت‌شده‌ای مانند VM macOS در Parallels قرار دارند از `chrome-node` استفاده کنید. برای Chrome محلی،
پروفایل را با `browser.defaultProfile` انتخاب کنید؛ `chrome.browserProfile` به
میزبان‌های `chrome-node` داده می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از طریق پل صوتی محلی OpenClaw عبور دهید.
اگر `BlackHole 2ch` نصب نشده باشد، پیوستن به‌جای ورود بی‌صدا بدون مسیر صوتی،
با خطای راه‌اندازی شکست می‌خورد.

### Twilio

انتقال Twilio یک طرح شماره‌گیری سخت‌گیرانه است که به Plugin تماس صوتی واگذار می‌شود. این
صفحه‌های Meet را برای شماره تلفن‌ها تجزیه نمی‌کند.

وقتی مشارکت Chrome در دسترس نیست یا fallback شماره‌گیری تلفنی می‌خواهید، از این استفاده کنید.
Google Meet باید برای جلسه شمارهٔ تماس ورودی و PIN ارائه کند؛
OpenClaw آن‌ها را از صفحهٔ Meet کشف نمی‌کند.

Plugin تماس صوتی را روی میزبان Gateway فعال کنید، نه روی Node مربوط به Chrome:

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

اعتبارنامه‌های Twilio را از طریق محیط یا پیکربندی ارائه کنید. محیط
اسرار را خارج از `openclaw.json` نگه می‌دارد:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

اگر ارائه‌دهندهٔ صدای بلادرنگ شما این است، به‌جای آن از `realtime.provider: "openai"` همراه با Plugin ارائه‌دهندهٔ OpenAI و
`OPENAI_API_KEY` استفاده کنید.

پس از فعال کردن `voice-call`، Gateway را راه‌اندازی مجدد یا بارگذاری مجدد کنید؛ تغییرات پیکربندی Plugin
تا زمانی که پردازهٔ Gateway از قبل درحال اجرا بارگذاری مجدد نشود، در آن ظاهر نمی‌شوند.

سپس بررسی کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی واگذاری Twilio سیم‌کشی شده باشد، `googlemeet setup` شامل بررسی‌های موفق
`twilio-voice-call-plugin`، `twilio-voice-call-credentials` و
`twilio-voice-call-webhook` است.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وقتی جلسه به دنبالهٔ سفارشی نیاز دارد، از `--dtmf-sequence` استفاده کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth و پیش‌بررسی

OAuth برای ایجاد پیوند Meet اختیاری است، چون `googlemeet create` می‌تواند به
خودکارسازی مرورگر fallback کند. وقتی ایجاد از طریق API رسمی،
حل‌کردن فضا، یا بررسی‌های پیش‌بررسی Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک کلاینت OAuth در Google Cloud ایجاد کنید،
دامنه‌های لازم را درخواست کنید، یک حساب Google را مجاز کنید، سپس
توکن تازه‌سازی حاصل را در پیکربندی Plugin Google Meet ذخیره کنید یا متغیرهای محیطی
`OPENCLAW_GOOGLE_MEET_*` را ارائه کنید.

OAuth جایگزین مسیر پیوستن Chrome نمی‌شود. انتقال‌های Chrome و Chrome-node
هنوز هنگام استفاده از مشارکت مرورگر، از طریق پروفایل Chrome واردشده، BlackHole/SoX، و یک
Node متصل می‌پیوندند. OAuth فقط برای مسیر رسمی Google
Meet API است: ایجاد فضاهای جلسه، حل‌کردن فضاها، و اجرای بررسی‌های پیش‌بررسی Meet Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژهٔ Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحهٔ رضایت OAuth را پیکربندی کنید.
   - **داخلی** برای یک سازمان Google Workspace ساده‌ترین گزینه است.
   - **خارجی** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ وقتی برنامه در حالت آزمایش است،
     هر حساب Google را که قرار است برنامه را مجاز کند، به‌عنوان کاربر آزمایشی اضافه کنید.
4. دامنه‌هایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک شناسهٔ کلاینت OAuth ایجاد کنید.
   - نوع برنامه: **برنامهٔ وب**.
   - URI تغییرمسیر مجاز:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. شناسهٔ کلاینت و راز کلاینت را کپی کنید.

`meetings.space.created` برای Google Meet `spaces.create` لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به فضاها حل کند.
`meetings.space.settings` به OpenClaw اجازه می‌دهد تنظیمات `SpaceConfig` مانند
`accessType` را هنگام ایجاد اتاق از طریق API ارسال کند.
`meetings.conference.media.readonly` برای پیش‌بررسی Meet Media API و کار رسانه‌ای است؛
Google ممکن است برای استفادهٔ واقعی از Media API به ثبت‌نام Developer Preview نیاز داشته باشد.
اگر فقط به پیوستن‌های Chrome مبتنی بر مرورگر نیاز دارید، OAuth را کاملاً رد کنید.

### ایجاد توکن تازه‌سازی

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها را به‌عنوان
متغیرهای محیطی ارسال کنید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک پیکربندی `oauth` با توکن تازه‌سازی چاپ می‌کند. از PKCE،
callback روی localhost در `http://localhost:8085/oauth2callback`، و جریان
کپی/جای‌گذاری دستی با `--manual` استفاده می‌کند.

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

وقتی نمی‌خواهید توکن تازه‌سازی در پیکربندی باشد، متغیرهای محیطی را ترجیح دهید.
اگر هر دو مقدار پیکربندی و محیط وجود داشته باشند، Plugin ابتدا پیکربندی را حل می‌کند
و سپس به fallback محیط می‌رود.

رضایت OAuth شامل ایجاد فضای Meet، دسترسی خواندن به فضای Meet، و دسترسی خواندن به رسانهٔ
کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه احراز هویت کرده‌اید،
`openclaw googlemeet auth login --json` را دوباره اجرا کنید تا توکن تازه‌سازی
دامنهٔ `meetings.space.created` را داشته باشد.

### بررسی OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون راز می‌خواهید، doctor مربوط به OAuth را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار runtime مربوط به Chrome را بارگذاری نمی‌کند و به Node متصل برای Chrome نیاز ندارد. این
بررسی می‌کند که پیکربندی OAuth وجود دارد و توکن تازه‌سازی می‌تواند یک توکن دسترسی
ایجاد کند. گزارش JSON فقط فیلدهای وضعیت مانند `ok`، `configured`،
`tokenSource`، `expiresAt` و پیام‌های بررسی را شامل می‌شود؛ توکن دسترسی،
توکن تازه‌سازی، یا راز کلاینت را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنی                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک توکن دسترسی کش‌شده، موجود است.       |
| `oauth-token`        | توکن دسترسی کش‌شده هنوز معتبر است، یا توکن نوسازی یک توکن دسترسی جدید صادر کرده است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای Meet موجود را resolve کرد.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای Meet جدید ایجاد کرد.                               |

برای اثبات فعال بودن Google Meet API و scope مربوط به `spaces.create` نیز، بررسی
ایجاد دارای اثر جانبی را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL موقت Meet ایجاد می‌کند. وقتی لازم است تأیید کنید
که پروژه Google Cloud دارای Meet API فعال است و حساب مجازشده
scope مربوط به `meetings.space.created` را دارد، از آن استفاده کنید.

برای اثبات دسترسی خواندن به یک فضای جلسه موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک
فضای موجود را اثبات می‌کنند که حساب Google مجازشده می‌تواند به آن دسترسی داشته باشد. دریافت `403` از این بررسی‌ها
معمولاً یعنی Google Meet REST API غیرفعال است، توکن نوسازی consent‌شده
scope لازم را ندارد، یا حساب Google نمی‌تواند به آن فضای Meet
دسترسی پیدا کند. خطای refresh-token یعنی `openclaw googlemeet auth login
--json` را دوباره اجرا کنید و بلوک جدید `oauth` را ذخیره کنید.

برای fallback مرورگر، هیچ credential مربوط به OAuth لازم نیست. در آن حالت، احراز هویت Google
از پروفایل Chrome واردشده روی node انتخاب‌شده می‌آید، نه از
پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان fallback پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` یا `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` یا `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` یا
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` یا `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` یا `GOOGLE_MEET_PREVIEW_ACK`

یک URL یا کد Meet، یا `spaces/{id}` را از طریق `spaces.get` resolve کنید:

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

با `--meeting`، `artifacts` و `attendance` به‌صورت پیش‌فرض از جدیدترین رکورد کنفرانس
استفاده می‌کنند. وقتی همه رکوردهای نگه‌داری‌شده
برای آن جلسه را می‌خواهید، `--all-conference-records` را بدهید.

جست‌وجوی Calendar می‌تواند پیش از خواندن artifactهای Meet، URL جلسه را از Google Calendar
resolve کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` تقویم `primary` امروز را برای یک رویداد Calendar دارای
لینک Google Meet جست‌وجو می‌کند. برای جست‌وجوی متن رویداد مطابق، از `--event <query>` استفاده کنید، و
برای تقویمی غیر از primary از `--calendar <id>`. جست‌وجوی Calendar به یک ورود تازه
OAuth نیاز دارد که شامل scope فقط‌خواندنی رویدادهای Calendar باشد.
`calendar-events` رویدادهای Meet مطابق را پیش‌نمایش می‌کند و رویدادی را که
`latest`، `artifacts`، `attendance` یا `export` انتخاب خواهد کرد علامت‌گذاری می‌کند.

اگر از قبل شناسه رکورد کنفرانس را می‌دانید، مستقیماً آن را نشانی‌دهی کنید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

وقتی می‌خواهید پس از تماس اتاق را ببندید، یک کنفرانس فعال را برای فضای ایجادشده با API
پایان دهید:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

این دستور Google Meet `spaces.endActiveConference` را فراخوانی می‌کند و به OAuth با
scope مربوط به `meetings.space.created` برای فضایی نیاز دارد که حساب مجازشده بتواند مدیریت کند.
OpenClaw یک URL Meet، کد جلسه، یا ورودی `spaces/{id}` را می‌پذیرد و پیش از پایان دادن به کنفرانس فعال،
آن را به منبع فضای API resolve می‌کند.
این از `googlemeet leave` جداست: `leave` مشارکت محلی/session
OpenClaw را متوقف می‌کند، در حالی که `end-active-conference` از Google Meet می‌خواهد کنفرانس فعال
آن فضا را پایان دهد.

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

`artifacts` در صورت ارائه‌شدن توسط Google برای جلسه، metadata رکورد کنفرانس به‌همراه metadata منابع شرکت‌کننده، ضبط،
رونوشت، ورودی ساختاریافته رونوشت، و یادداشت هوشمند را برمی‌گرداند. برای رد کردن
جست‌وجوی entry در جلسه‌های بزرگ از `--no-transcript-entries` استفاده کنید. `attendance` شرکت‌کنندگان را به
ردیف‌های participant-session با زمان‌های اولین/آخرین مشاهده، مدت کل session،
پرچم‌های دیر رسیدن/ترک زودهنگام، و منابع شرکت‌کننده تکراری ادغام‌شده بر اساس کاربر واردشده
یا نام نمایشی گسترش می‌دهد. برای جدا نگه داشتن منابع خام شرکت‌کننده،
`--no-merge-duplicates` را بدهید، برای تنظیم تشخیص دیرکرد از `--late-after-minutes`، و
برای تنظیم تشخیص ترک زودهنگام از `--early-before-minutes` استفاده کنید.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`،
`transcript.md`، `artifacts.json`، `attendance.json`، و `manifest.json` می‌نویسد.
`manifest.json` ورودی انتخاب‌شده، گزینه‌های export، رکوردهای کنفرانس،
فایل‌های خروجی، شمارش‌ها، منبع توکن، رویداد Calendar در صورت استفاده، و هر
هشدار مربوط به بازیابی ناقص را ثبت می‌کند. برای نوشتن یک آرشیو قابل‌حمل در کنار
پوشه نیز `--zip` را بدهید. برای export کردن متن Google Docs رونوشت و یادداشت هوشمند
لینک‌شده از طریق Google Drive `files.export`، `--include-doc-bodies` را بدهید؛ این به
یک ورود تازه OAuth نیاز دارد که شامل scope فقط‌خواندنی Drive Meet باشد. بدون
`--include-doc-bodies`، exportها فقط شامل metadata مربوط به Meet و ورودی‌های ساختاریافته رونوشت
هستند. اگر Google یک شکست جزئی artifact برگرداند، مانند خطای فهرست‌کردن یادداشت هوشمند،
transcript-entry، یا document-body در Drive، summary و
manifest به‌جای شکست کل export، هشدار را نگه می‌دارند.
برای دریافت همان داده‌های artifact/attendance و چاپ JSON مربوط به
manifest بدون ایجاد پوشه یا ZIP، از `--dry-run` استفاده کنید. این پیش از نوشتن
یک export بزرگ یا وقتی یک agent فقط به شمارش‌ها، رکوردهای انتخاب‌شده، و
هشدارها نیاز دارد مفید است.

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

برای برگرداندن فقط manifest مربوط به export و رد کردن نوشتن فایل‌ها، `"dryRun": true` را تنظیم کنید.

agentها همچنین می‌توانند یک اتاق مبتنی بر API با سیاست دسترسی صریح ایجاد کنند:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

برای اعتبارسنجی listen-first، agentها باید پیش از ادعای مفید بودن
جلسه، از `test_listen` استفاده کنند:

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

live listen-first browser probe را در برابر جلسه‌ای اجرا کنید که در آن کسی
با زیرنویس‌های Meet در دسترس صحبت خواهد کرد:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

محیط live smoke:

- `OPENCLAW_LIVE_TEST=1` تست‌های live محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL، کد، یا
  `spaces/{id}` مربوط به Meet نگه‌داری‌شده اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه client مربوط به OAuth
  را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
  توکن نوسازی را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های fallback
  بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

live smoke پایه artifact/attendance به
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar
به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. export کردن
document-body از Drive به
`https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای تازه Meet ایجاد کنید:

```bash
openclaw googlemeet create
```

این دستور `meeting uri` جدید، منبع، و join session را چاپ می‌کند. با credentialهای OAuth
از Google Meet API رسمی استفاده می‌کند. بدون credentialهای OAuth،
از پروفایل مرورگر واردشده pinned Chrome node به‌عنوان fallback استفاده می‌کند. agentها می‌توانند
از ابزار `google_meet` با `action: "create"` برای ایجاد و join در یک
گام استفاده کنند. برای ایجاد فقط URL، `"join": false` را بدهید.

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

اگر fallback مرورگر پیش از آنکه بتواند URL را ایجاد کند با ورود Google یا مانع مجوز Meet
برخورد کند، متد Gateway یک پاسخ ناموفق برمی‌گرداند و
ابزار `google_meet` به‌جای یک رشته ساده، جزئیات ساختاریافته برمی‌گرداند:

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

وقتی یک agent مقدار `manualActionRequired: true` را می‌بیند، باید
`manualActionMessage` به‌همراه زمینه browser node/tab را گزارش کند و تا زمانی که operator
مرحله مرورگر را کامل نکرده است، باز کردن tabهای جدید Meet را متوقف کند.

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

ایجاد یک Meet به‌صورت پیش‌فرض به آن می‌پیوندد. انتقال Chrome یا Chrome-node همچنان برای پیوستن از طریق مرورگر به یک نمایه Google Chrome واردشده نیاز دارد. اگر نمایه خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک خطای جایگزین مرورگر را گزارش می‌کند و از اپراتور می‌خواهد پیش از تلاش دوباره، ورود به Google را کامل کند.

فقط پس از تأیید اینکه پروژه Cloud، اصل OAuth، و شرکت‌کنندگان جلسه شما در Google Workspace Developer Preview Program برای APIهای رسانه Meet ثبت‌نام شده‌اند، `preview.enrollmentAcknowledged: true` را تنظیم کنید.

## پیکربندی

مسیر مشترک عامل Chrome فقط به فعال بودن Plugin، BlackHole، SoX، یک کلید ارائه‌دهنده رونویسی بلادرنگ، و یک ارائه‌دهنده TTS پیکربندی‌شده OpenClaw نیاز دارد. OpenAI ارائه‌دهنده پیش‌فرض رونویسی است؛ برای استفاده از Google Gemini Live در حالت `bidi` بدون تغییر ارائه‌دهنده پیش‌فرض رونویسی حالت عامل، `realtime.voiceProvider` را روی `"google"` و `realtime.model` را تنظیم کنید:

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
- `defaultMode: "agent"` (`"realtime"` فقط به‌عنوان نام مستعار سازگاری قدیمی برای `"agent"` پذیرفته می‌شود؛ فراخوانی‌های ابزار جدید باید `"agent"` بگویند)
- `chromeNode.node`: شناسه/نام/IP اختیاری Node برای `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحه مهمان Meet برای کاربر خارج‌شده استفاده می‌شود
- `chrome.autoJoin: true`: تلاش بهینه برای پر کردن نام مهمان و کلیک روی Join Now از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال کردن یک زبانه Meet موجود به‌جای باز کردن نسخه‌های تکراری
- `chrome.waitForInCallMs: 20000`: منتظر ماندن تا زبانه Meet وضعیت داخل تماس را گزارش کند، پیش از آنکه معرفی پاسخ‌گویی گفتاری فعال شود
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت فرمان. از `"g711-ulaw-8khz"` فقط برای جفت‌فرمان‌های قدیمی/سفارشی استفاده کنید که هنوز صدای تلفنی تولید می‌کنند.
- `chrome.audioBufferBytes: 4096`: بافر پردازش SoX برای فرمان‌های صوتی جفت‌فرمان Chrome تولیدشده. این مقدار نصف بافر پیش‌فرض 8192 بایتی SoX است و تأخیر پیش‌فرض پایپ را کاهش می‌دهد، درحالی‌که امکان افزایش آن روی میزبان‌های شلوغ را حفظ می‌کند. مقادیر پایین‌تر از حداقل SoX به 17 بایت محدود می‌شوند.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch` می‌خواند و صدا را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صدا را در `chrome.audioFormat` می‌خواند و به CoreAudio `BlackHole 2ch` می‌نویسد
- `chrome.bargeInInputCommand`: فرمان اختیاری میکروفون محلی که PCM تک‌کاناله 16 بیتی little-endian علامت‌دار را برای تشخیص ورود گفتار انسان هنگام فعال بودن پخش دستیار می‌نویسد. این در حال حاضر برای پل جفت‌فرمان `chrome` میزبانی‌شده روی Gateway اعمال می‌شود.
- `chrome.bargeInRmsThreshold: 650`: سطح RMS که روی `chrome.bargeInInputCommand` به‌عنوان قطع گفتار توسط انسان محسوب می‌شود
- `chrome.bargeInPeakThreshold: 2500`: سطح اوج که روی `chrome.bargeInInputCommand` به‌عنوان قطع گفتار توسط انسان محسوب می‌شود
- `chrome.bargeInCooldownMs: 900`: حداقل تأخیر بین پاک‌سازی‌های تکراری قطع گفتار توسط انسان
- `mode: "agent"`: حالت پیش‌فرض پاسخ‌گویی گفتاری. گفتار شرکت‌کننده توسط ارائه‌دهنده رونویسی بلادرنگ پیکربندی‌شده رونویسی می‌شود، به عامل پیکربندی‌شده OpenClaw در یک نشست زیرعامل مخصوص هر جلسه فرستاده می‌شود، و از طریق زمان‌اجرای عادی TTS در OpenClaw به گفتار تبدیل می‌شود.
- `mode: "bidi"`: حالت جایگزین مدل بلادرنگ مستقیم دوسویه. ارائه‌دهنده صدای بلادرنگ مستقیماً به گفتار شرکت‌کننده پاسخ می‌دهد و می‌تواند برای پاسخ‌های عمیق‌تر/پشتیبانی‌شده با ابزار، `openclaw_agent_consult` را فراخوانی کند.
- `mode: "transcribe"`: حالت فقط مشاهده بدون پل پاسخ‌گویی گفتاری.
- `realtime.provider: "openai"`: جایگزین سازگاری که وقتی فیلدهای ارائه‌دهنده محدوده‌دار زیر تنظیم نشده‌اند استفاده می‌شود.
- `realtime.transcriptionProvider: "openai"`: شناسه ارائه‌دهنده‌ای که حالت `agent` برای رونویسی بلادرنگ استفاده می‌کند.
- `realtime.voiceProvider`: شناسه ارائه‌دهنده‌ای که حالت `bidi` برای صدای بلادرنگ مستقیم استفاده می‌کند. برای استفاده از Gemini Live درحالی‌که رونویسی حالت عامل روی OpenAI می‌ماند، این را روی `"google"` تنظیم کنید.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، با `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی کوتاه آمادگی گفتاری هنگام اتصال پل بلادرنگ؛ برای پیوستن بی‌صدا آن را روی `""` تنظیم کنید
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
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs برای شنیدن و گفتار در حالت عامل:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
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

صدای پایدار Meet از `messages.tts.providers.elevenlabs.voiceId` می‌آید. پاسخ‌های عامل همچنین می‌توانند وقتی بازنویسی‌های مدل TTS فعال هستند، از دستورهای مخصوص هر پاسخ مانند `[[tts:voiceId=... model=eleven_v3]]` استفاده کنند، اما پیکربندی پیش‌فرض قطعی برای جلسات است. هنگام پیوستن، لاگ‌ها باید `transcriptionProvider=elevenlabs` را نشان دهند و هر پاسخ گفتاری باید `provider=elevenlabs model=eleven_v3 voice=<voiceId>` را ثبت کند.

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

`voiceCall.enabled` به‌صورت پیش‌فرض `true` است؛ با انتقال Twilio، تماس PSTN واقعی، DTMF، و خوشامدگویی معرفی را به Plugin تماس صوتی واگذار می‌کند. تماس صوتی توالی DTMF را پیش از باز کردن جریان رسانه بلادرنگ پخش می‌کند، سپس از متن معرفی ذخیره‌شده به‌عنوان خوشامدگویی اولیه بلادرنگ استفاده می‌کند. اگر `voice-call` فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را اعتبارسنجی و ثبت کند، اما نمی‌تواند تماس Twilio را برقرار کند.

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

وقتی Chrome روی میزبان Gateway اجرا می‌شود، از `transport: "chrome"` استفاده کنید. وقتی Chrome روی یک Node جفت‌شده مانند یک ماشین مجازی Parallels اجرا می‌شود، از `transport: "chrome-node"` استفاده کنید. در هر دو حالت، ارائه‌دهندگان مدل و `openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا می‌مانند. با `mode: "agent"` پیش‌فرض، ارائه‌دهنده رونویسی بلادرنگ شنیدن را مدیریت می‌کند، عامل پیکربندی‌شده OpenClaw پاسخ را تولید می‌کند، و TTS عادی OpenClaw آن را در Meet پخش می‌کند. وقتی می‌خواهید مدل صدای بلادرنگ مستقیماً پاسخ دهد، از `mode: "bidi"` استفاده کنید. مقدار خام `mode: "realtime"` همچنان به‌عنوان نام مستعار سازگاری قدیمی برای `mode: "agent"` پذیرفته می‌شود، اما دیگر در شمای ابزار عامل تبلیغ نمی‌شود. لاگ‌های حالت عامل در شروع پل، ارائه‌دهنده/مدل رونویسی حل‌شده و پس از هر پاسخ ساخته‌شده، ارائه‌دهنده TTS، مدل، صدا، قالب خروجی، و نرخ نمونه‌برداری را شامل می‌شوند.

برای فهرست کردن نشست‌های فعال یا بررسی شناسه نشست از `action: "status"` استفاده کنید. برای اینکه عامل بلادرنگ فوراً صحبت کند، از `action: "speak"` همراه با `sessionId` و `message` استفاده کنید. برای ایجاد یا استفاده دوباره از نشست، فعال کردن یک عبارت شناخته‌شده، و بازگرداندن سلامت `inCall` وقتی میزبان Chrome بتواند آن را گزارش کند، از `action: "test_speech"` استفاده کنید. `test_speech` همیشه `mode: "agent"` را اجباری می‌کند و اگر از آن خواسته شود در `mode: "transcribe"` اجرا شود، شکست می‌خورد، زیرا نشست‌های فقط مشاهده عمداً نمی‌توانند گفتار تولید کنند. نتیجه `speechOutputVerified` آن بر اساس افزایش بایت‌های خروجی صوتی بلادرنگ در طول این فراخوانی آزمایشی است، بنابراین یک نشست استفاده‌شده‌دوباره با صدای قدیمی‌تر به‌عنوان بررسی گفتار موفق تازه حساب نمی‌شود. برای علامت‌گذاری پایان یک نشست، از `action: "leave"` استفاده کنید.

`status` در صورت دسترسی، سلامت Chrome را شامل می‌شود:

- `inCall`: به نظر می‌رسد Chrome داخل تماس Meet است
- `micMuted`: وضعیت میکروفون Meet با تلاش بهینه
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: نمایه مرورگر پیش از کار کردن گفتار، به ورود دستی، پذیرش میزبان Meet، مجوزها، یا تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: آیا گفتار مدیریت‌شده Chrome اکنون مجاز است یا نه. `speechReady: false` یعنی OpenClaw عبارت معرفی/آزمایشی را به پل صوتی نفرستاده است.
- `providerConnected` / `realtimeReady`: وضعیت پل صدای بلادرنگ
- `lastInputAt` / `lastOutputAt`: آخرین صدای دیده‌شده از پل یا فرستاده‌شده به آن
- `audioOutputRouted` / `audioOutputDeviceLabel`: آیا خروجی رسانه زبانه Meet به‌صورت فعال به دستگاه BlackHole مورد استفاده پل هدایت شده است یا نه
- `lastSuppressedInputAt` / `suppressedInputBytes`: ورودی local loopback که هنگام فعال بودن پخش دستیار نادیده گرفته شده است

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## حالت‌های عامل و bidi

حالت `agent` در Chrome برای رفتار «عامل من در جلسه است» بهینه شده است. ارائه‌دهنده رونویسی بلادرنگ صدای جلسه را می‌شنود، رونویسی‌های نهایی شرکت‌کننده از طریق عامل پیکربندی‌شده OpenClaw مسیریابی می‌شوند، و پاسخ از طریق زمان‌اجرای عادی TTS در OpenClaw به گفتار تبدیل می‌شود. وقتی می‌خواهید مدل صدای بلادرنگ مستقیماً پاسخ دهد، `mode: "bidi"` را تنظیم کنید.
قطعه‌های نزدیک رونویسی نهایی پیش از مشورت ادغام می‌شوند تا یک نوبت گفتاری چند پاسخ جزئی کهنه تولید نکند. ورودی بلادرنگ نیز هنگامی که صدای صف‌شده دستیار هنوز در حال پخش است سرکوب می‌شود، و پژواک‌های اخیر رونویسی شبیه دستیار پیش از مشورت عامل نادیده گرفته می‌شوند تا local loopback در BlackHole باعث نشود عامل به گفتار خودش پاسخ دهد.

| حالت    | چه کسی پاسخ را تعیین می‌کند        | مسیر خروجی گفتار                     | زمان استفاده                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | عامل پیکربندی‌شده OpenClaw | زمان‌اجرای عادی TTS در OpenClaw            | وقتی رفتار «عامل من در جلسه است» را می‌خواهید        |
| `bidi`  | مدل صدای بلادرنگ      | پاسخ صوتی ارائه‌دهنده صدای بلادرنگ | وقتی حلقه صدای مکالمه‌ای با کمترین تأخیر را می‌خواهید |

در حالت `bidi`، وقتی مدل بلادرنگ به استدلال عمیق‌تر، اطلاعات جاری، یا ابزارهای عادی OpenClaw نیاز دارد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره، عامل معمول OpenClaw را در پشت‌صحنه با زمینه رونوشت اخیر
جلسه اجرا می‌کند و یک پاسخ گفتاری کوتاه برمی‌گرداند. در حالت `agent`،
OpenClaw آن پاسخ را مستقیم به محیط اجرای TTS می‌فرستد؛ در حالت `bidi`، مدل
صوتی بی‌درنگ می‌تواند نتیجه مشاوره را دوباره در جلسه بیان کند. این ابزار از
همان سازوکار مشاوره مشترکِ تماس صوتی استفاده می‌کند.

به‌طور پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید
از فضای کاری عامل اختصاصی OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار، حافظه و
تاریخچه نشست اختصاصی استفاده کند، `realtime.agentId` را تنظیم کنید.

مشاوره‌های حالت عامل از یک کلید نشستِ به‌ازای هر جلسه با قالب
`agent:<id>:subagent:google-meet:<session>` استفاده می‌کنند تا پرسش‌های
پیگیری، ضمن به ارث بردن سیاست معمول عامل از عامل پیکربندی‌شده، زمینه جلسه را
حفظ کنند.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در دسترس قرار بده و عامل معمول را به
  `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و
  `memory_get` محدود کن.
- `owner`: ابزار مشاوره را در دسترس قرار بده و اجازه بده عامل معمول از سیاست
  عادی ابزارهای عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صوتی بی‌درنگ قرار نده.

کلید نشست مشاوره برای هر نشست Meet محدود می‌شود، بنابراین فراخوانی‌های مشاوره
پیگیری می‌توانند در همان جلسه، از زمینه مشاوره قبلی دوباره استفاده کنند.

برای اجبار یک بررسی آمادگی گفتاری پس از اینکه Chrome کامل وارد تماس شد:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای آزمون دودِ کاملِ پیوستن و صحبت کردن:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## چک‌لیست آزمون زنده

پیش از سپردن جلسه به یک عامل بدون نظارت، از این توالی استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت مورد انتظار Chrome-node:

- `googlemeet setup` همگی سبز است.
- وقتی Chrome-node ترابری پیش‌فرض است یا یک Node پین شده، `googlemeet setup`
  شامل `chrome-node-connected` است.
- `nodes status` نشان می‌دهد Node انتخاب‌شده وصل است.
- Node انتخاب‌شده هر دو قابلیت `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- زبانه Meet وارد تماس می‌شود و `test-speech` سلامت Chrome را با
  `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome راه‌دور مانند یک ماشین مجازی macOS روی Parallels، این
کوتاه‌ترین بررسی امن پس از به‌روزرسانی Gateway یا ماشین مجازی است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند Plugin مربوط به Gateway بارگذاری شده، Node ماشین مجازی با
توکن فعلی وصل است، و پل صوتی Meet پیش از باز کردن زبانه جلسه واقعی توسط عامل
در دسترس است.

برای آزمون دود Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را
نمایش می‌دهد:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin`،
  `twilio-voice-call-credentials`، و `twilio-voice-call-webhook` است.
- `voicecall` پس از بارگذاری دوباره Gateway در CLI در دسترس است.
- نشست برگشتی `transport: "twilio"` و یک `twilio.voiceCallId` دارد.
- `openclaw logs --follow` نشان می‌دهد TwiML مربوط به DTMF پیش از TwiML
  بی‌درنگ ارائه شده، سپس یک پل بی‌درنگ با خوشامدگویی اولیه در صف قرار گرفته است.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر همین حالا `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را
راه‌اندازی دوباره یا بارگذاری دوباره کنید. عامل در حال اجرا فقط ابزارهای Plugin
ثبت‌شده توسط فرایند فعلی Gateway را می‌بیند.

روی میزبان‌های Gateway غیر macOS، ابزار عامل‌محور `google_meet` همچنان قابل
مشاهده می‌ماند، اما کنش‌های گفت‌وبرگشت Chrome محلی پیش از رسیدن به پل صوتی
مسدود می‌شوند. صدای گفت‌وبرگشت Chrome محلی در حال حاضر به `BlackHole 2ch` در
macOS وابسته است، بنابراین عامل‌های Linux باید به‌جای مسیر پیش‌فرض عامل Chrome
محلی، از `mode: "transcribe"`، شماره‌گیری Twilio، یا یک میزبان
`chrome-node` روی macOS استفاده کنند.

### هیچ Node متصل و سازگار با Google Meet وجود ندارد

روی میزبان Node اجرا کنید:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

روی میزبان Gateway، Node را تأیید و فرمان‌ها را بررسی کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node باید وصل باشد و `googlemeet.chrome` به‌همراه `browser.proxy` را فهرست کند.
پیکربندی Gateway باید این فرمان‌های Node را مجاز کند:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

اگر `googlemeet setup` در `chrome-node-connected` شکست خورد یا لاگ Gateway
`gateway token mismatch` را گزارش کرد، Node را با توکن فعلی Gateway دوباره نصب
یا راه‌اندازی دوباره کنید. برای Gateway روی LAN، این معمولاً یعنی:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

سپس سرویس Node را دوباره بارگذاری و دوباره اجرا کنید:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### مرورگر باز می‌شود اما عامل نمی‌تواند وارد شود

برای پیوستن‌های فقط مشاهده، `googlemeet test-listen` و برای پیوستن‌های بی‌درنگ،
`googlemeet test-speech` را اجرا کنید، سپس سلامت Chrome برگشتی را بررسی کنید.
اگر هرکدام از این بررسی‌ها `manualActionRequired: true` را گزارش کرد،
`manualActionMessage` را به اپراتور نشان دهید و تا کامل شدن کنش مرورگر، تلاش
دوباره را متوقف کنید.

کنش‌های دستی رایج:

- وارد نمایه Chrome شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی اعلان مجوز بومی Chrome ظاهر می‌شود، مجوزهای میکروفون/دوربین Chrome را بدهید.
- یک گفت‌وگوی مجوز گیرکرده Meet را ببندید یا تعمیر کنید.

صرفاً به این دلیل که Meet نشان می‌دهد «Do you want people to hear you in the
meeting?» گزارش «وارد نشده» ندهید. این میان‌پرده انتخاب صدا در Meet است؛
OpenClaw وقتی خودکارسازی مرورگر در دسترس باشد، روی **Use microphone** کلیک
می‌کند و همچنان منتظر وضعیت واقعی جلسه می‌ماند. برای پس‌گرد مرورگرِ فقط
ایجاد، OpenClaw ممکن است روی **Continue without microphone** کلیک کند، چون
ایجاد URL به مسیر صوتی بی‌درنگ نیاز ندارد.

### ایجاد جلسه شکست می‌خورد

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند، از
نقطه پایانی `spaces.create` در Google Meet API استفاده می‌کند. بدون
اعتبارنامه‌های OAuth، به مرورگر Node پین‌شده Chrome پس‌گرد می‌کند. تأیید کنید:

- برای ایجاد با API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند،
  یا متغیرهای محیطی مطابق `OPENCLAW_GOOGLE_MEET_*` موجودند.
- برای ایجاد با API: توکن تازه‌سازی پس از اضافه شدن پشتیبانی ایجاد صادر شده
  است. توکن‌های قدیمی‌تر ممکن است قلمرو `meetings.space.created` را نداشته
  باشند؛ `openclaw googlemeet auth login --json` را دوباره اجرا کنید و
  پیکربندی Plugin را به‌روزرسانی کنید.
- برای پس‌گرد مرورگر: `defaultTransport: "chrome-node"` و
  `chromeNode.node` به یک Node متصل با `browser.proxy` و `googlemeet.chrome`
  اشاره می‌کنند.
- برای پس‌گرد مرورگر: نمایه Chrome متعلق به OpenClaw روی آن Node به Google
  وارد شده و می‌تواند `https://meet.google.com/new` را باز کند.
- برای پس‌گرد مرورگر: تلاش‌های دوباره پیش از باز کردن زبانه جدید، از یک
  `https://meet.google.com/new` موجود یا زبانه اعلان حساب Google دوباره
  استفاده می‌کنند. اگر زمان عامل تمام شد، به‌جای باز کردن دستی زبانه Meet
  دیگر، فراخوانی ابزار را دوباره امتحان کنید.
- برای پس‌گرد مرورگر: اگر ابزار `manualActionRequired: true` را برگرداند، از
  `browser.nodeId`، `browser.targetId`، `browserUrl`، و
  `manualActionMessage` برگشتی برای راهنمایی اپراتور استفاده کنید. تا کامل شدن
  آن کنش، در حلقه تلاش دوباره نکنید.
- برای پس‌گرد مرورگر: اگر Meet نشان داد «Do you want people to hear you in the
  meeting?» زبانه را باز بگذارید. OpenClaw باید از طریق خودکارسازی مرورگر روی
  **Use microphone** یا، برای پس‌گرد فقط ایجاد، روی **Continue without
  microphone** کلیک کند و همچنان منتظر URL تولیدشده Meet بماند. اگر نتواند،
  خطا باید به `meet-audio-choice-required` اشاره کند، نه
  `google-login-required`.

### عامل وارد می‌شود اما صحبت نمی‌کند

مسیر بی‌درنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای مسیر معمول STT -> عامل OpenClaw -> گفت‌وبرگشت TTS از `mode: "agent"`،
یا برای پس‌گرد صوتی بی‌درنگ مستقیم از `mode: "bidi"` استفاده کنید.
`mode: "transcribe"` عمداً پل گفت‌وبرگشت را شروع نمی‌کند. برای اشکال‌زدایی
فقط مشاهده، پس از صحبت کردن شرکت‌کنندگان `openclaw googlemeet status --json
<session-id>` را اجرا کنید و `captioning`، `transcriptLines`، و
`lastCaptionText` را بررسی کنید. اگر `inCall` درست است اما `transcriptLines`
روی `0` می‌ماند، ممکن است زیرنویس‌های Meet غیرفعال باشند، از زمان نصب ناظر
کسی صحبت نکرده باشد، رابط کاربری Meet تغییر کرده باشد، یا زیرنویس زنده برای
زبان/حساب جلسه در دسترس نباشد.

`googlemeet test-speech` همیشه مسیر بی‌درنگ را بررسی می‌کند و گزارش می‌دهد آیا
برای آن فراخوانی، بایت‌های خروجی پل مشاهده شده‌اند یا نه. اگر
`speechOutputVerified` نادرست و `speechOutputTimedOut` درست باشد، ارائه‌دهنده
بی‌درنگ ممکن است گفتار را پذیرفته باشد اما OpenClaw بایت‌های خروجی جدیدی را که
به پل صوتی Chrome برسند ندیده است.

همچنین بررسی کنید:

- یک کلید ارائه‌دهنده بی‌درنگ روی میزبان Gateway در دسترس است، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده است.
- `sox` روی میزبان Chrome وجود دارد.
- میکروفون و بلندگوی Meet از مسیر صوتی مجازی مورد استفاده OpenClaw عبور داده
  شده‌اند. برای پیوستن‌های بی‌درنگ Chrome محلی، `doctor` باید
  `meet output routed: yes` را نشان دهد.

`googlemeet doctor [session-id]` نشست، Node، وضعیت حضور در تماس، دلیل کنش
دستی، اتصال ارائه‌دهنده بی‌درنگ، `realtimeReady`، فعالیت ورودی/خروجی صدا،
آخرین زمان‌های صوتی، شمارنده‌های بایت، و URL مرورگر را چاپ می‌کند. وقتی به
JSON خام نیاز دارید از `googlemeet status [session-id] --json` استفاده کنید.
وقتی باید تازه‌سازی OAuth مربوط به Google Meet را بدون افشای توکن‌ها بررسی
کنید از `googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet
API هم نیاز دارید، `--meeting` یا `--create-space` را اضافه کنید.

اگر زمان عامل تمام شد و می‌توانید ببینید یک زبانه Meet از قبل باز است، بدون
باز کردن زبانه دیگر همان زبانه را بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

کنش ابزار معادل `recover_current_tab` است. این کنش یک زبانه Meet موجود را برای
ترابری انتخاب‌شده متمرکز و بررسی می‌کند. با `chrome`، از کنترل مرورگر محلی از
طریق Gateway استفاده می‌کند؛ با `chrome-node`، از Node پیکربندی‌شده Chrome
استفاده می‌کند. زبانه جدیدی باز نمی‌کند و نشست جدیدی نمی‌سازد؛ مانع فعلی را
گزارش می‌دهد، مانند وضعیت ورود، پذیرش، مجوزها، یا انتخاب صدا. فرمان CLI با
Gateway پیکربندی‌شده صحبت می‌کند، بنابراین Gateway باید در حال اجرا باشد؛
`chrome-node` همچنین نیاز دارد Node مربوط به Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

وقتی `voice-call` مجاز یا فعال نباشد، `twilio-voice-call-plugin` شکست می‌خورد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید،
و Gateway را دوباره بارگذاری کنید.

وقتی پس‌زمینه Twilio فاقد SID حساب، توکن احراز هویت، یا شماره تماس‌گیرنده
باشد، `twilio-voice-call-credentials` شکست می‌خورد. این‌ها را روی میزبان
Gateway تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

وقتی `voice-call` هیچ نمایش Webhook عمومی نداشته باشد، یا وقتی `publicUrl` به
local loopback یا فضای شبکه خصوصی اشاره کند، `twilio-voice-call-webhook` شکست
می‌خورد. `plugins.entries.voice-call.config.publicUrl` را به URL عمومی
ارائه‌دهنده تنظیم کنید یا یک تونل/نمایش Tailscale برای `voice-call` پیکربندی
کنید.

URLهای local loopback و خصوصی برای callbackهای اپراتور تلفنی معتبر نیستند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7`، یا `fd00::/8` به‌عنوان `publicUrl`
استفاده نکنید.

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

برای توسعهٔ محلی، به‌جای URL میزبان خصوصی، از یک تونل یا ارائهٔ Tailscale استفاده کنید:

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

سپس Gateway را بازراه‌اندازی یا دوباره بارگذاری کنید و اجرا کنید:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌طور پیش‌فرض فقط آمادگی را بررسی می‌کند. برای اجرای آزمایشی یک شمارهٔ مشخص:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط زمانی `--yes` را اضافه کنید که عمداً می‌خواهید یک تماس اعلان خروجی زنده برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید که رویداد Meet جزئیات شماره‌گیری تلفنی را ارائه می‌کند. شمارهٔ دقیق شماره‌گیری و PIN یا یک توالی DTMF سفارشی را بدهید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر ارائه‌دهنده پیش از وارد کردن PIN به مکث نیاز دارد، در `--dtmf-sequence` از `w` ابتدایی یا ویرگول استفاده کنید.

اگر تماس تلفنی ایجاد می‌شود اما فهرست حاضران Meet هرگز شرکت‌کنندهٔ شماره‌گیری تلفنی را نشان نمی‌دهد:

- `openclaw googlemeet doctor <session-id>` را اجرا کنید تا شناسهٔ تماس Twilio واگذارشده، اینکه آیا DTMF در صف قرار گرفته، و اینکه آیا پیام خوشامدگویی آغازین درخواست شده است را تأیید کنید.
- `openclaw voicecall status --call-id <id>` را اجرا کنید و تأیید کنید که تماس همچنان فعال است.
- `openclaw voicecall tail` را اجرا کنید و بررسی کنید که Webhookهای Twilio به Gateway می‌رسند.
- `openclaw logs --follow` را اجرا کنید و دنبال توالی Twilio Meet بگردید: Google Meet پیوستن را واگذار می‌کند، Voice Call، TwiML مربوط به DTMF پیش از اتصال را ذخیره و سرو می‌کند، Voice Call، TwiML بلادرنگ را برای تماس Twilio سرو می‌کند، سپس Google Meet گفتار آغازین را با `voicecall.speak` درخواست می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ یک بررسی راه‌اندازی سبز لازم است اما درست بودن توالی PIN جلسه را ثابت نمی‌کند.
- تأیید کنید که شمارهٔ شماره‌گیری به همان دعوت‌نامه و منطقهٔ Meet مربوط به PIN تعلق دارد.
- اگر Meet کند پاسخ می‌دهد یا متن تماس پس از ارسال DTMF پیش از اتصال همچنان اعلان درخواست PIN را نشان می‌دهد، `voiceCall.dtmfDelayMs` را از مقدار پیش‌فرض ۱۲ ثانیه افزایش دهید.
- اگر شرکت‌کننده می‌پیوندد اما پیام خوشامدگویی را نمی‌شنوید، `openclaw logs --follow` را برای درخواست پس از DTMF یعنی `voicecall.speak` و پخش TTS جریان رسانه یا جایگزین Twilio `<Say>` بررسی کنید. اگر متن تماس همچنان شامل «PIN جلسه را وارد کنید» است، مسیر تلفنی هنوز به اتاق Meet نپیوسته است، بنابراین شرکت‌کنندگان جلسه گفتار را نخواهند شنید.

اگر Webhookها نمی‌رسند، ابتدا Plugin تماس صوتی را اشکال‌زدایی کنید: ارائه‌دهنده باید بتواند به `plugins.entries.voice-call.config.publicUrl` یا تونل پیکربندی‌شده برسد. [عیب‌یابی تماس صوتی](/fa/plugins/voice-call#troubleshooting) را ببینید.

## یادداشت‌ها

API رسانهٔ رسمی Google Meet دریافت‌محور است، بنابراین صحبت کردن در یک تماس Meet همچنان به مسیر شرکت‌کننده نیاز دارد. این Plugin آن مرز را آشکار نگه می‌دارد: Chrome مشارکت مرورگر و مسیریابی صوت محلی را مدیریت می‌کند؛ Twilio مشارکت شماره‌گیری تلفنی را مدیریت می‌کند.

حالت‌های پاسخ‌گویی Chrome به `BlackHole 2ch` به‌همراه یکی از این‌ها نیاز دارند:

- `chrome.audioInputCommand` به‌همراه `chrome.audioOutputCommand`: OpenClaw مالک پل است و صدا را با `chrome.audioFormat` بین آن فرمان‌ها و ارائه‌دهندهٔ انتخاب‌شده لوله‌کشی می‌کند. حالت عامل از رونویسی بلادرنگ به‌همراه TTS معمولی استفاده می‌کند؛ حالت دوسویه از ارائه‌دهندهٔ صدای بلادرنگ استفاده می‌کند. مسیر پیش‌فرض Chrome برابر با PCM16 با نرخ ۲۴ kHz و `chrome.audioBufferBytes: 4096` است؛ G.711 mu-law با نرخ ۸ kHz همچنان برای جفت‌فرمان‌های قدیمی در دسترس است.
- `chrome.audioBridgeCommand`: یک فرمان پل خارجی مالک کل مسیر صوت محلی است و باید پس از شروع یا اعتبارسنجی daemon خود خارج شود. این فقط برای `bidi` معتبر است، زیرا حالت `agent` برای TTS به دسترسی مستقیم جفت‌فرمان نیاز دارد.

وقتی یک عامل ابزار `google_meet` را در حالت عامل فراخوانی می‌کند، نشست مشاور جلسه پیش از پاسخ دادن به گفتار شرکت‌کنندگان، متن رونوشت فعلی فراخواننده را fork می‌کند. نشست Meet همچنان جدا می‌ماند (`agent:<agentId>:subagent:google-meet:<sessionId>`) تا پیگیری‌های جلسه مستقیماً متن رونوشت فراخواننده را تغییر ندهند.

برای صدای دوطرفهٔ تمیز، خروجی Meet و میکروفون Meet را از طریق دستگاه‌های مجازی جداگانه یا یک گراف دستگاه مجازی به سبک Loopback مسیریابی کنید. یک دستگاه BlackHole مشترک می‌تواند صدای شرکت‌کنندگان دیگر را دوباره به تماس بازتاب دهد.

با پل Chrome جفت‌فرمان، `chrome.bargeInInputCommand` می‌تواند به یک میکروفون محلی جداگانه گوش دهد و وقتی انسان شروع به صحبت می‌کند پخش دستیار را پاک کند. این کار گفتار انسان را حتی زمانی که ورودی local loopback مشترک BlackHole هنگام پخش دستیار به‌طور موقت سرکوب شده است، جلوتر از خروجی دستیار نگه می‌دارد. مانند `chrome.audioInputCommand` و `chrome.audioOutputCommand`، این یک فرمان محلی پیکربندی‌شده توسط اپراتور است. از مسیر فرمان یا فهرست آرگومان‌های صریح و قابل‌اعتماد استفاده کنید و آن را به اسکریپت‌هایی از مکان‌های غیرقابل‌اعتماد اشاره ندهید.

`googlemeet speak` پل صوتی پاسخ‌گویی فعال را برای یک نشست Chrome فعال می‌کند. `googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق Plugin تماس صوتی واگذار شده‌اند، `leave` تماس صوتی زیربنایی را نیز قطع می‌کند. وقتی می‌خواهید کنفرانس فعال Google Meet را نیز برای یک فضای مدیریت‌شده با API ببندید، از `googlemeet end-active-conference` استفاده کنید.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت مکالمه](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
