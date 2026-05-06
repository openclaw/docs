---
read_when:
    - می‌خواهید یک عامل OpenClaw به تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - در حال پیکربندی Chrome، Chrome node یا Twilio به‌عنوان انتقال‌دهندهٔ Google Meet هستید
summary: 'Plugin ‏Google Meet: پیوستن به URLهای مشخص Meet از طریق Chrome یا Twilio با پیش‌فرض‌های پاسخ‌گویی عامل'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-06T09:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی از شرکت‌کننده Google Meet برای OpenClaw، Plugin عامدانه صریح طراحی شده است:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet تازه ایجاد کند، سپس به URL
  بازگردانده‌شده بپیوندد.
- `agent` حالت پیش‌فرض پاسخ‌گویی صوتی است: رونویسی بلادرنگ گوش می‌دهد،
  عامل پیکربندی‌شده OpenClaw پاسخ می‌دهد، و TTS معمول OpenClaw در Meet صحبت می‌کند.
- `bidi` همچنان به‌عنوان حالت جایگزین مدل صوتی بلادرنگ مستقیم در دسترس است.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: از `agent` برای
  شنیدن/پاسخ‌گویی زنده، از `bidi` برای جایگزین صوتی بلادرنگ مستقیم، یا از `transcribe`
  برای پیوستن/کنترل مرورگر بدون پل پاسخ‌گویی صوتی استفاده کنید.
- احراز هویت با OAuth شخصی Google یا یک نمایه Chrome که از قبل وارد شده است آغاز می‌شود.
- اعلام رضایت خودکار وجود ندارد.
- پشتوانه صوتی پیش‌فرض Chrome برابر `BlackHole 2ch` است.
- Chrome می‌تواند به‌صورت محلی یا روی یک میزبان node جفت‌شده اجرا شود.
- Twilio یک شماره تماس ورودی به‌همراه PIN اختیاری یا دنباله DTMF را می‌پذیرد؛
  نمی‌تواند مستقیما با یک URL مربوط به Meet تماس بگیرد.
- فرمان CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر
  کنفرانس از راه دور عامل رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید و یک ارائه‌دهنده رونویسی بلادرنگ به‌همراه
TTS معمول OpenClaw را پیکربندی کنید. OpenAI ارائه‌دهنده پیش‌فرض رونویسی است؛
Google Gemini Live نیز به‌عنوان یک جایگزین صوتی جداگانه `bidi` با
`realtime.voiceProvider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده
Homebrew نیاز دارد پیش از آنکه macOS دستگاه را نمایش دهد، سیستم دوباره راه‌اندازی شود:

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

خروجی راه‌اندازی طوری طراحی شده است که برای عامل قابل خواندن و نسبت به حالت آگاه باشد.
این خروجی نمایه Chrome، اتصال به node، و برای پیوستن‌های بلادرنگ Chrome، پل صوتی
BlackHole/SoX و بررسی‌های مقدمه بلادرنگ با تاخیر را گزارش می‌کند. برای پیوستن‌های
صرفا مشاهده‌ای، همان انتقال را با `--mode transcribe` بررسی کنید؛ آن حالت پیش‌نیازهای
صوتی بلادرنگ را رد می‌کند، چون از طریق پل گوش نمی‌دهد یا از طریق آن صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌کند که آیا
Plugin `voice-call`، اعتبارنامه‌های Twilio، و قرار گرفتن Webhook عمومی آماده هستند یا نه.
هر بررسی `ok: false` را پیش از درخواست از یک عامل برای پیوستن، برای انتقال و حالت
بررسی‌شده یک مسدودکننده در نظر بگیرید. برای اسکریپت‌ها یا خروجی قابل خواندن برای ماشین
از `openclaw googlemeet setup --json` استفاده کنید. برای پیش‌پرواز یک انتقال مشخص
پیش از آنکه عامل آن را امتحان کند، از `--transport chrome`، `--transport chrome-node`،
یا `--transport twilio` استفاده کنید.

برای Twilio، وقتی انتقال پیش‌فرض Chrome است، همیشه انتقال را صریحا پیش‌پرواز کنید:

```bash
openclaw googlemeet setup --transport twilio
```

این کار سیم‌کشی ناقص `voice-call`، اعتبارنامه‌های Twilio، یا قرارگیری Webhook
غیرقابل دسترسی را پیش از تلاش عامل برای شماره‌گیری جلسه شناسایی می‌کند.

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

ابزار عامل‌محور `google_meet` روی میزبان‌های غیر macOS برای گردش‌کارهای مصنوع،
تقویم، راه‌اندازی، رونویسی، Twilio، و `chrome-node` در دسترس می‌ماند. کنش‌های
پاسخ‌گویی صوتی Chrome محلی در آنجا مسدود می‌شوند، چون مسیر صوتی Chrome همراه‌شده
در حال حاضر به `BlackHole 2ch` روی macOS وابسته است. روی Linux، برای مشارکت
پاسخ‌گویی صوتی Chrome از `mode: "transcribe"`، تماس ورودی Twilio، یا یک میزبان
macOS `chrome-node` استفاده کنید.

یک جلسه تازه ایجاد کنید و به آن بپیوندید:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

برای اتاق‌هایی که API ایجاد می‌کند، وقتی می‌خواهید سیاست بدون درخواست ورود اتاق
به‌جای ارث‌بری از پیش‌فرض‌های حساب Google صریح باشد، از
Google Meet `SpaceConfig.accessType` استفاده کنید:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` به هر کسی که URL مربوط به Meet را دارد اجازه می‌دهد بدون درخواست ورود بپیوندد.
`TRUSTED` به کاربران مورد اعتماد سازمان میزبان، کاربران خارجی دعوت‌شده، و کاربران
تماس ورودی اجازه می‌دهد بدون درخواست ورود بپیوندند. `RESTRICTED` ورود بدون درخواست
را به دعوت‌شدگان محدود می‌کند. این تنظیمات فقط برای مسیر رسمی ایجاد از طریق
Google Meet API اعمال می‌شوند، بنابراین اعتبارنامه‌های OAuth باید پیکربندی شده باشند.

اگر پیش از در دسترس بودن این گزینه Google Meet را احراز هویت کرده‌اید، پس از افزودن
دامنه `meetings.space.settings` به صفحه رضایت Google OAuth خود، دوباره
`openclaw googlemeet auth login --json` را اجرا کنید.

فقط URL را بدون پیوستن ایجاد کنید:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` دو مسیر دارد:

- ایجاد API: وقتی اعتبارنامه‌های Google Meet OAuth پیکربندی شده باشند استفاده می‌شود.
  این قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- جایگزین مرورگر: وقتی اعتبارنامه‌های OAuth وجود نداشته باشند استفاده می‌شود. OpenClaw
  از node پین‌شده Chrome استفاده می‌کند، `https://meet.google.com/new` را باز می‌کند،
  منتظر می‌ماند Google به یک URL واقعی با کد جلسه هدایت کند، سپس آن URL را برمی‌گرداند.
  این مسیر نیاز دارد نمایه Chrome مربوط به OpenClaw روی node از قبل وارد Google شده باشد.
  خودکارسازی مرورگر اعلان میکروفون اجرای نخست خود Meet را مدیریت می‌کند؛ آن اعلان
  به‌عنوان شکست ورود Google تلقی نمی‌شود.
  گردش‌کارهای پیوستن و ایجاد همچنین تلاش می‌کنند پیش از باز کردن یک زبانه تازه،
  از زبانه Meet موجود دوباره استفاده کنند. تطبیق، رشته‌های پرس‌وجوی بی‌ضرر URL مانند
  `authuser` را نادیده می‌گیرد، بنابراین تلاش دوباره عامل باید جلسه ازقبل‌باز را
  متمرکز کند، نه اینکه زبانه دوم Chrome ایجاد کند.

خروجی فرمان/ابزار شامل یک فیلد `source` است (`api` یا `browser`) تا عامل‌ها بتوانند
توضیح دهند کدام مسیر استفاده شده است. `create` به‌صورت پیش‌فرض به جلسه تازه می‌پیوندد و
`joined: true` به‌همراه نشست پیوستن را برمی‌گرداند. برای فقط ساختن URL، در CLI از
`create --no-join` استفاده کنید یا `"join": false` را به ابزار پاس بدهید.

یا به یک عامل بگویید: «یک Google Meet ایجاد کن، با حالت پاسخ‌گویی صوتی عامل به آن
بپیوند، و پیوند را برای من بفرست.» عامل باید `google_meet` را با
`action: "create"` فراخوانی کند و سپس `meetingUri` بازگردانده‌شده را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

برای پیوستن صرفا مشاهده‌ای/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید. این کار
پل صوتی بلادرنگ دوطرفه را شروع نمی‌کند، به BlackHole یا SoX نیاز ندارد، و در جلسه
پاسخ صوتی نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای مجوز میکروفون/دوربین
OpenClaw و مسیر **Use microphone** در Meet پرهیز می‌کنند. اگر Meet یک میان‌پرده
انتخاب صدا نشان دهد، خودکارسازی مسیر بدون میکروفون را امتحان می‌کند و در غیر این صورت
به‌جای باز کردن میکروفون محلی، یک کنش دستی را گزارش می‌کند. در حالت transcribe،
انتقال‌های Chrome مدیریت‌شده همچنین یک ناظر کپشن Meet به‌صورت بهترین تلاش نصب می‌کنند.
`googlemeet status --json` و `googlemeet doctor` موارد `captioning`،
`captionsEnabledAttempted`، `transcriptLines`، `lastCaptionAt`، `lastCaptionSpeaker`،
`lastCaptionText`، و یک دنباله کوتاه `recentTranscript` را نمایش می‌دهند تا
اپراتورها بتوانند تشخیص دهند آیا مرورگر به تماس پیوسته و آیا کپشن‌های Meet متن تولید
می‌کنند یا نه.
وقتی به یک وارسی بله/خیر نیاز دارید، از
`openclaw googlemeet test-listen <meet-url> --transport chrome-node` استفاده کنید:
این فرمان در حالت transcribe می‌پیوندد، منتظر کپشن تازه یا حرکت رونویسی می‌ماند، و
`listenVerified`، `listenTimedOut`، فیلدهای کنش دستی، و تازه‌ترین وضعیت سلامت کپشن را
برمی‌گرداند.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` شامل سلامت مرورگر و پل صوتی مانند
`inCall`، `manualActionRequired`، `providerConnected`، `realtimeReady`،
`audioInputActive`، `audioOutputActive`، زمان‌نماهای آخرین ورودی/خروجی، شمارنده‌های
بایت، و وضعیت بسته‌شدن پل است. اگر یک اعلان امن صفحه Meet ظاهر شود، خودکارسازی مرورگر
در صورت امکان آن را مدیریت می‌کند. ورود، پذیرش میزبان، و اعلان‌های مجوز مرورگر/سیستم‌عامل
به‌عنوان کنش دستی با دلیل و پیام برای انتقال توسط عامل گزارش می‌شوند. نشست‌های
Chrome مدیریت‌شده فقط پس از آنکه سلامت مرورگر `inCall: true` را گزارش کند، مقدمه یا
عبارت آزمایشی را منتشر می‌کنند؛ در غیر این صورت وضعیت `speechReady: false` را گزارش
می‌کند و تلاش گفتار به‌جای وانمود کردن اینکه عامل در جلسه صحبت کرده، مسدود می‌شود.

پیوستن‌های Chrome محلی از طریق نمایه مرورگر واردشده OpenClaw انجام می‌شوند. حالت
بلادرنگ برای مسیر میکروفون/بلندگوی مورد استفاده OpenClaw به `BlackHole 2ch` نیاز دارد.
برای صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا یک گراف سبک Loopback استفاده کنید؛
یک دستگاه BlackHole واحد برای نخستین آزمون دود کافی است، اما ممکن است اکو ایجاد کند.

### Gateway محلی + Chrome در Parallels

برای اینکه VM مالک Chrome باشد، به یک OpenClaw Gateway کامل یا کلید API مدل داخل
VM macOS نیاز **ندارید**. Gateway و عامل را به‌صورت محلی اجرا کنید، سپس یک میزبان
node را در VM اجرا کنید. Plugin همراه‌شده را یک بار روی VM فعال کنید تا node فرمان
Chrome را تبلیغ کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهنده
  بلادرنگ، و پیکربندی Plugin Google Meet.
- VM macOS در Parallels: OpenClaw CLI/میزبان node، Google Chrome، SoX،
  BlackHole 2ch، و یک نمایه Chrome واردشده به Google.
- موارد غیرضروری در VM: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا
  راه‌اندازی ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را دوباره راه‌اندازی کنید تا macOS `BlackHole 2ch` را نمایش دهد:

```bash
sudo reboot
```

پس از راه‌اندازی دوباره، بررسی کنید که VM می‌تواند دستگاه صوتی و فرمان‌های SoX را ببیند:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

OpenClaw را در VM نصب یا به‌روزرسانی کنید، سپس Plugin همراه‌شده را آنجا فعال کنید:

```bash
openclaw plugins enable google-meet
```

میزبان node را در VM شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP شبکه محلی است و از TLS استفاده نمی‌کنید، node سوکت
وب plaintext را رد می‌کند مگر اینکه برای آن شبکه خصوصی مورد اعتماد صریحا موافقت کنید:

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
`openclaw.json`. وقتی این مقدار در فرمان نصب حاضر باشد، `openclaw node install` آن را
در محیط LaunchAgent ذخیره می‌کند.

node را از میزبان Gateway تایید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تایید کنید که Gateway، node را می‌بیند و اینکه هم `googlemeet.chrome` و هم قابلیت
مرورگر/`browser.proxy` را تبلیغ می‌کند:

```bash
openclaw nodes status
```

Meet را از طریق آن node روی میزبان Gateway مسیریابی کنید:

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

اکنون به‌صورت معمول از میزبان Gateway بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

یا از عامل بخواهید ابزار `google_meet` را با `transport: "chrome-node"` استفاده کند.

برای یک آزمون دود تک‌فرمانی که یک نشست را ایجاد می‌کند یا دوباره به‌کار می‌گیرد،
یک عبارت شناخته‌شده را بیان می‌کند، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

در هنگام پیوستن بی‌درنگ، خودکارسازی مرورگر OpenClaw نام مهمان را پر می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان انتخاب «Use microphone» برای نخستین
اجرای Meet ظاهر شود، آن را می‌پذیرد. در هنگام پیوستن فقط برای مشاهده یا ایجاد
جلسه فقط با مرورگر، وقتی همان انتخاب در دسترس باشد، از همان اعلان بدون میکروفون
عبور می‌کند. اگر پروفایل مرورگر وارد حساب نشده باشد، Meet منتظر پذیرش میزبان
باشد، Chrome برای پیوستن بی‌درنگ به مجوز میکروفون/دوربین نیاز داشته باشد، یا
Meet روی اعلانی گیر کند که خودکارسازی نتوانسته آن را حل کند، نتیجه
join/test-speech مقدار `manualActionRequired: true` را همراه با
`manualActionReason` و `manualActionMessage` گزارش می‌کند. عامل‌ها باید تلاش
مجدد برای پیوستن را متوقف کنند، همان پیام دقیق را همراه با `browserUrl`/`browserTitle`
فعلی گزارش دهند، و فقط پس از کامل شدن اقدام دستی در مرورگر دوباره تلاش کنند.

اگر `chromeNode.node` حذف شود، OpenClaw فقط زمانی به‌صورت خودکار انتخاب می‌کند
که دقیقاً یک Node متصل هم `googlemeet.chrome` و هم کنترل مرورگر را اعلام کند.
اگر چند Node توانمند متصل باشند، `chromeNode.node` را روی شناسه Node، نام
نمایشی، یا IP راه دور تنظیم کنید.

بررسی‌های رایج خرابی:

- `Configured Google Meet node ... is not usable: offline`: Node سنجاق‌شده برای
  Gateway شناخته‌شده است اما در دسترس نیست. عامل‌ها باید آن Node را وضعیت
  تشخیصی بدانند، نه یک میزبان Chrome قابل استفاده، و به‌جای برگشت به ترابری
  دیگر، مانع راه‌اندازی را گزارش کنند مگر اینکه کاربر چنین چیزی خواسته باشد.
- `No connected Google Meet-capable node`: در VM دستور `openclaw node run` را
  اجرا کنید، جفت‌سازی را تأیید کنید، و مطمئن شوید `openclaw plugins enable google-meet`
  و `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تأیید کنید
  میزبان Gateway هر دو فرمان Node را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز کرده است.
- `BlackHole 2ch audio device not found`: روی میزبانی که بررسی می‌شود
  `blackhole-2ch` را نصب کنید و پیش از استفاده از صدای Chrome محلی، بازراه‌اندازی کنید.
- `BlackHole 2ch audio device not found on the node`: در VM، `blackhole-2ch` را
  نصب کنید و VM را بازراه‌اندازی کنید.
- Chrome باز می‌شود اما نمی‌تواند بپیوندد: داخل VM وارد پروفایل مرورگر شوید، یا
  برای پیوستن مهمان، `chrome.guestName` را تنظیم‌شده نگه دارید. پیوستن خودکار
  مهمان از خودکارسازی مرورگر OpenClaw از طریق پراکسی مرورگر Node استفاده می‌کند؛
  مطمئن شوید پیکربندی مرورگر Node به پروفایلی اشاره می‌کند که می‌خواهید، برای
  مثال `browser.defaultProfile: "user"` یا یک پروفایل جلسه موجود نام‌گذاری‌شده.
- تب‌های تکراری Meet: گزینه `chrome.reuseExistingTab: true` را فعال نگه دارید.
  OpenClaw پیش از باز کردن تب جدید، یک تب موجود برای همان URL Meet را فعال می‌کند،
  و ایجاد جلسه در مرورگر پیش از باز کردن تب دیگر، از یک تب در حال پیشرفت
  `https://meet.google.com/new` یا اعلان حساب Google دوباره استفاده می‌کند.
- نبود صدا: در Meet، میکروفون/بلندگو را از مسیر دستگاه صوتی مجازی استفاده‌شده
  توسط OpenClaw عبور دهید؛ برای صدای دوطرفه تمیز از دستگاه‌های مجازی جداگانه یا
  مسیریابی شبیه Loopback استفاده کنید.

## نکات نصب

پیش‌فرض talk-back در Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin برای پل صوتی پیش‌فرض 24 kHz PCM16 از
  فرمان‌های صریح دستگاه CoreAudio استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این ابزار دستگاه صوتی `BlackHole 2ch`
  را ایجاد می‌کند که Chrome/Meet می‌تواند از مسیر آن عبور کند.

OpenClaw هیچ‌یک از این بسته‌ها را همراه خود نمی‌آورد یا بازتوزیع نمی‌کند.
مستندات از کاربران می‌خواهد آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق
Homebrew نصب کنند. SoX با مجوز `LGPL-2.0-only AND GPL-2.0-only` منتشر شده است؛
BlackHole مجوز GPL-3.0 دارد. اگر نصاب یا applianceای می‌سازید که BlackHole را
همراه با OpenClaw بسته‌بندی می‌کند، شرایط مجوز بالادستی BlackHole را بررسی کنید
یا از Existential Audio مجوز جداگانه بگیرید.

## ترابری‌ها

### Chrome

ترابری Chrome، URL مربوط به Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و
با پروفایل مرورگر OpenClaw که وارد حساب شده است می‌پیوندد. در macOS، Plugin پیش
از اجرا وجود `BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز
کردن Chrome یک فرمان سلامت پل صوتی و فرمان راه‌اندازی را نیز اجرا می‌کند. وقتی
Chrome/صدا روی میزبان Gateway قرار دارد از `chrome` استفاده کنید؛ وقتی Chrome/صدا
روی یک Node جفت‌شده مانند VM macOS در Parallels قرار دارد از `chrome-node` استفاده
کنید. برای Chrome محلی، پروفایل را با `browser.defaultProfile` انتخاب کنید؛
`chrome.browserProfile` به میزبان‌های `chrome-node` ارسال می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از پل صوتی محلی OpenClaw عبور دهید. اگر
`BlackHole 2ch` نصب نباشد، پیوستن به‌جای ورود بی‌صدا و بدون مسیر صوتی، با خطای
راه‌اندازی شکست می‌خورد.

### Twilio

ترابری Twilio یک طرح شماره‌گیری سخت‌گیرانه است که به Plugin تماس صوتی واگذار
می‌شود. این ترابری صفحات Meet را برای یافتن شماره تلفن تجزیه نمی‌کند.

وقتی مشارکت با Chrome در دسترس نیست یا یک fallback شماره‌گیری تلفنی می‌خواهید،
از این گزینه استفاده کنید. Google Meet باید برای جلسه شماره تماس تلفنی و PIN
ارائه کند؛ OpenClaw آن‌ها را از صفحه Meet کشف نمی‌کند.

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

اعتبارنامه‌های Twilio را از طریق محیط یا پیکربندی ارائه کنید. محیط، محرمانه‌ها
را بیرون از `openclaw.json` نگه می‌دارد:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

اگر ارائه‌دهنده صدای بی‌درنگ شما OpenAI است، به‌جای آن از
`realtime.provider: "openai"` همراه با Plugin ارائه‌دهنده OpenAI و
`OPENAI_API_KEY` استفاده کنید.

پس از فعال کردن `voice-call`، Gateway را بازراه‌اندازی یا بازبارگذاری کنید؛
تغییرات پیکربندی Plugin تا زمان بازبارگذاری در فرایند Gateway در حال اجرا ظاهر
نمی‌شوند.

سپس بررسی کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی واگذاری Twilio متصل شده باشد، `googlemeet setup` بررسی‌های موفق
`twilio-voice-call-plugin`، `twilio-voice-call-credentials` و
`twilio-voice-call-webhook` را شامل می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وقتی جلسه به دنباله سفارشی نیاز دارد، از `--dtmf-sequence` استفاده کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth و بررسی پیش‌پرواز

OAuth برای ایجاد لینک Meet اختیاری است، چون `googlemeet create` می‌تواند به
خودکارسازی مرورگر fallback کند. وقتی ایجاد رسمی از طریق API، حل‌کردن space، یا
بررسی‌های پیش‌پرواز Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک کلاینت OAuth در
Google Cloud بسازید، scopeهای لازم را درخواست کنید، یک حساب Google را مجاز
کنید، سپس refresh token حاصل را در پیکربندی Plugin مربوط به Google Meet ذخیره
کنید یا متغیرهای محیطی `OPENCLAW_GOOGLE_MEET_*` را ارائه دهید.

OAuth مسیر پیوستن Chrome را جایگزین نمی‌کند. ترابری‌های Chrome و Chrome-node
هنگام استفاده از مشارکت مرورگر همچنان از طریق پروفایل Chrome واردشده، BlackHole/SoX،
و یک Node متصل می‌پیوندند. OAuth فقط برای مسیر رسمی Google Meet API است: ایجاد
spaceهای جلسه، حل‌کردن spaceها، و اجرای بررسی‌های پیش‌پرواز Meet Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژه Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحه رضایت OAuth را پیکربندی کنید.
   - **Internal** برای سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا زمانی که
     برنامه در حالت Testing است، هر حساب Google را که برنامه را مجاز می‌کند
     به‌عنوان کاربر آزمایشی اضافه کنید.
4. scopeهایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک شناسه کلاینت OAuth ایجاد کنید.
   - نوع برنامه: **Web application**.
   - URI تغییرمسیر مجاز:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. شناسه کلاینت و client secret را کپی کنید.

`meetings.space.created` برای Google Meet `spaces.create` لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به spaceها
حل کند. `meetings.space.settings` به OpenClaw اجازه می‌دهد تنظیمات `SpaceConfig`
مانند `accessType` را هنگام ایجاد اتاق از طریق API ارسال کند.
`meetings.conference.media.readonly` برای پیش‌پرواز Meet Media API و کار رسانه‌ای
است؛ Google ممکن است برای استفاده واقعی از Media API ثبت‌نام در Developer Preview
را لازم بداند. اگر فقط به پیوستن‌های مبتنی بر مرورگر Chrome نیاز دارید، OAuth را
کلاً رد کنید.

### ساخت refresh token

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها را
به‌عنوان متغیرهای محیطی ارسال کنید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک پیکربندی `oauth` همراه با refresh token چاپ می‌کند. از PKCE،
callback محلی روی `http://localhost:8085/oauth2callback`، و جریان کپی/جای‌گذاری
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
اگر هم مقادیر پیکربندی و هم مقادیر محیطی وجود داشته باشند، Plugin ابتدا
پیکربندی و سپس fallback محیطی را resolve می‌کند.

رضایت OAuth شامل ایجاد space در Meet، دسترسی خواندن به space در Meet، و دسترسی
خواندن به رسانه کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه احراز
هویت کرده‌اید، `openclaw googlemeet auth login --json` را دوباره اجرا کنید تا
refresh token دارای scope مربوط به `meetings.space.created` باشد.

### بررسی OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون محرمانه می‌خواهید، doctor مربوط به OAuth را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار runtime مربوط به Chrome را بارگذاری نمی‌کند و به Node متصل Chrome نیاز
ندارد. بررسی می‌کند که پیکربندی OAuth وجود داشته باشد و refresh token بتواند
access token صادر کند. گزارش JSON فقط فیلدهای وضعیت مانند `ok`، `configured`،
`tokenSource`، `expiresAt` و پیام‌های بررسی را شامل می‌شود؛ access token،
refresh token، یا client secret را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنا                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک توکن دسترسی ذخیره‌شده در کش، وجود دارد.       |
| `oauth-token`        | توکن دسترسی ذخیره‌شده در کش هنوز معتبر است، یا توکن تازه‌سازی یک توکن دسترسی جدید صادر کرده است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای Meet موجود را resolve کرد.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای Meet جدید ایجاد کرد.                               |

برای اثبات فعال بودن Google Meet API و scope مربوط به `spaces.create` نیز،
بررسی ایجادِ دارای اثر جانبی را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL دورریختنی Meet ایجاد می‌کند. وقتی لازم است تأیید کنید
که Google Cloud project دارای Meet API فعال است و حساب مجازشده scope
`meetings.space.created` را دارد، از آن استفاده کنید.

برای اثبات دسترسی خواندن به یک فضای جلسه موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک فضای موجود را
که حساب Google مجازشده می‌تواند به آن دسترسی داشته باشد اثبات می‌کنند. پاسخ
`403` از این بررسی‌ها معمولاً یعنی Google Meet REST API غیرفعال است، توکن
تازه‌سازیِ consent‌شده scope لازم را ندارد، یا حساب Google نمی‌تواند به آن
فضای Meet دسترسی پیدا کند. خطای توکن تازه‌سازی یعنی دوباره `openclaw googlemeet auth login
--json` را اجرا کنید و بلوک جدید `oauth` را ذخیره کنید.

برای مسیر جایگزین مرورگر هیچ اعتبارنامه OAuth لازم نیست. در آن حالت، احراز هویت
Google از پروفایل Chrome واردشده در Node انتخاب‌شده می‌آید، نه از پیکربندی
OpenClaw.

این متغیرهای محیطی به‌عنوان مسیر جایگزین پذیرفته می‌شوند:

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

پس از آنکه Meet رکوردهای کنفرانس را ایجاد کرد، آرتیفکت‌های جلسه و حضور و غیاب
را فهرست کنید:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، دستورهای `artifacts` و `attendance` به‌طور پیش‌فرض از جدیدترین
رکورد کنفرانس استفاده می‌کنند. وقتی همه رکوردهای نگه‌داری‌شده برای آن جلسه را
می‌خواهید، `--all-conference-records` را بدهید.

جست‌وجوی Calendar می‌تواند پیش از خواندن آرتیفکت‌های Meet، URL جلسه را از
Google Calendar resolve کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` در Calendar `primary` امروز به‌دنبال رویداد Calendar دارای لینک
Google Meet می‌گردد. از `--event <query>` برای جست‌وجوی متن رویداد مطابق، و از
`--calendar <id>` برای Calendar غیر اصلی استفاده کنید. جست‌وجوی Calendar به
ورود تازه OAuth نیاز دارد که scope فقط‌خواندنی رویدادهای Calendar را شامل شود.
`calendar-events` رویدادهای Meet مطابق را پیش‌نمایش می‌کند و رویدادی را که
`latest`، `artifacts`، `attendance`، یا `export` انتخاب خواهد کرد علامت می‌زند.

اگر از قبل شناسه رکورد کنفرانس را می‌دانید، مستقیماً به آن نشانی‌دهی کنید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

وقتی می‌خواهید پس از تماس اتاق را ببندید، یک کنفرانس فعال را برای فضای
ایجادشده با API پایان دهید:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

این دستور Google Meet `spaces.endActiveConference` را فراخوانی می‌کند و برای
فضایی که حساب مجازشده می‌تواند مدیریت کند، به OAuth با scope
`meetings.space.created` نیاز دارد. OpenClaw یک URL مربوط به Meet، کد جلسه، یا
ورودی `spaces/{id}` را می‌پذیرد و پیش از پایان دادن به کنفرانس فعال، آن را به
منبع فضای API resolve می‌کند.
این از `googlemeet leave` جدا است: `leave` مشارکت محلی/نشست OpenClaw را متوقف
می‌کند، درحالی‌که `end-active-conference` از Google Meet می‌خواهد کنفرانس فعال
برای آن فضا را پایان دهد.

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

`artifacts` وقتی Google آن را برای جلسه در معرض دسترس قرار دهد، فراداده رکورد
کنفرانس به‌همراه فراداده منابع شرکت‌کننده، ضبط، رونوشت، ورودی ساختاریافته
رونوشت، و یادداشت هوشمند را برمی‌گرداند. برای رد شدن از جست‌وجوی ورودی در
جلسه‌های بزرگ، از `--no-transcript-entries` استفاده کنید. `attendance`
شرکت‌کنندگان را به ردیف‌های نشست شرکت‌کننده با زمان‌های اولین/آخرین مشاهده،
مدت کل نشست، پرچم‌های دیر رسیدن/زود ترک کردن، و منابع تکراری شرکت‌کننده که بر
اساس کاربر واردشده یا نام نمایشی ادغام شده‌اند گسترش می‌دهد. برای جدا نگه
داشتن منابع خام شرکت‌کننده، `--no-merge-duplicates` را بدهید، برای تنظیم تشخیص
دیر رسیدن از `--late-after-minutes`، و برای تنظیم تشخیص ترک زودهنگام از
`--early-before-minutes` استفاده کنید.

`export` پوشه‌ای می‌نویسد که شامل `summary.md`، `attendance.csv`،
`transcript.md`، `artifacts.json`، `attendance.json`، و `manifest.json` است.
`manifest.json` ورودی انتخاب‌شده، گزینه‌های export، رکوردهای کنفرانس، فایل‌های
خروجی، شمارش‌ها، منبع توکن، رویداد Calendar در صورت استفاده، و هر هشدار مربوط
به بازیابی ناقص را ثبت می‌کند. برای نوشتن یک آرشیو قابل حمل کنار پوشه نیز
`--zip` را بدهید. برای export کردن متن Google Docs مربوط به رونوشت لینک‌شده و
یادداشت هوشمند از طریق Google Drive `files.export`، `--include-doc-bodies` را
بدهید؛ این کار به ورود تازه OAuth نیاز دارد که scope فقط‌خواندنی Drive Meet را
شامل شود. بدون `--include-doc-bodies`، exportها فقط شامل فراداده Meet و
ورودی‌های ساختاریافته رونوشت هستند. اگر Google یک شکست جزئی در آرتیفکت برگرداند،
مانند خطای فهرست‌کردن یادداشت هوشمند، ورودی رونوشت، یا بدنه سند Drive، summary
و manifest هشدار را نگه می‌دارند و کل export را شکست‌خورده نمی‌کنند.
برای دریافت همان داده‌های آرتیفکت/حضور و غیاب و چاپ JSON مربوط به manifest بدون
ایجاد پوشه یا ZIP، از `--dry-run` استفاده کنید. این پیش از نوشتن یک export بزرگ
یا وقتی یک عامل فقط به شمارش‌ها، رکوردهای انتخاب‌شده، و هشدارها نیاز دارد مفید
است.

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

برای برگرداندن فقط manifest مربوط به export و رد شدن از نوشتن فایل‌ها،
`"dryRun": true` را تنظیم کنید.

عامل‌ها همچنین می‌توانند یک اتاق پشتیبانی‌شده با API را با سیاست دسترسی صریح
ایجاد کنند:

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

برای اعتبارسنجی مبتنی بر شنیدن در ابتدا، عامل‌ها باید پیش از ادعا درباره مفید
بودن جلسه از `test_listen` استفاده کنند:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

آزمون دود زنده محافظت‌شده را روی یک جلسه واقعی نگه‌داری‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

کاوش زنده مرورگر با رویکرد شنیدن در ابتدا را روی جلسه‌ای اجرا کنید که در آن
کسی صحبت خواهد کرد و زیرنویس‌های Meet در دسترس هستند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

محیط آزمون دود زنده:

- `OPENCLAW_LIVE_TEST=1` آزمون‌های زنده محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL، کد، یا
  `spaces/{id}` نگه‌داری‌شده مربوط به Meet اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه کلاینت OAuth
  را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN` توکن
  تازه‌سازی را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های جایگزین بدون
  پیشوند `OPENCLAW_` استفاده می‌کنند.

آزمون دود زنده پایه برای آرتیفکت/حضور و غیاب به
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد.
جست‌وجوی Calendar به `https://www.googleapis.com/auth/calendar.events.readonly`
نیاز دارد. export بدنه سند Drive به
`https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای تازه Meet ایجاد کنید:

```bash
openclaw googlemeet create
```

این دستور `meeting uri` جدید، منبع، و نشست پیوستن را چاپ می‌کند. با
اعتبارنامه‌های OAuth از Google Meet API رسمی استفاده می‌کند. بدون اعتبارنامه‌های
OAuth، از پروفایل مرورگر واردشده در Node ثابت‌شده Chrome به‌عنوان مسیر جایگزین
استفاده می‌کند. عامل‌ها می‌توانند از ابزار `google_meet` با `action: "create"`
برای ایجاد و پیوستن در یک مرحله استفاده کنند. برای ایجاد فقط URL،
`"join": false` را بدهید.

نمونه خروجی JSON از مسیر جایگزین مرورگر:

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

اگر مسیر جایگزین مرورگر پیش از ایجاد URL به مانع ورود Google یا مجوز Meet برخورد
کند، متد Gateway یک پاسخ ناموفق برمی‌گرداند و ابزار `google_meet` به‌جای یک
رشته ساده، جزئیات ساختاریافته برمی‌گرداند:

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

وقتی یک عامل `manualActionRequired: true` را می‌بیند، باید
`manualActionMessage` را به‌همراه زمینه Node/زبانه مرورگر گزارش کند و تا زمانی
که اپراتور مرحله مرورگر را کامل نکرده است، از باز کردن زبانه‌های جدید Meet
متوقف شود.

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

ایجاد یک Meet به‌صورت پیش‌فرض به جلسه می‌پیوندد. انتقال Chrome یا Chrome-node همچنان
برای پیوستن از طریق مرورگر به یک نمایه Google Chrome واردشده نیاز دارد. اگر
نمایه خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک
خطای جایگزین مرورگر را گزارش می‌کند و از گرداننده می‌خواهد پیش از تلاش دوباره،
ورود به Google را کامل کند.

فقط پس از تأیید اینکه پروژه Cloud، اصل OAuth، و شرکت‌کنندگان جلسه شما در
Google Workspace Developer Preview Program برای Meet media APIs ثبت‌نام شده‌اند،
`preview.enrollmentAcknowledged: true` را تنظیم کنید.

## پیکربندی

مسیر عامل مشترک Chrome فقط به فعال بودن Plugin، BlackHole، SoX، یک
کلید ارائه‌دهنده رونویسی بی‌درنگ، و یک ارائه‌دهنده TTS پیکربندی‌شده OpenClaw نیاز دارد.
OpenAI ارائه‌دهنده پیش‌فرض رونویسی است؛ برای استفاده از Google Gemini Live در حالت
`bidi` بدون تغییر ارائه‌دهنده رونویسی پیش‌فرض حالت عامل،
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
- `chromeNode.node`: شناسه/نام/IP اختیاری Node برای `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحه مهمان خارج‌شده Meet
  استفاده می‌شود
- `chrome.autoJoin: true`: پر کردن نام مهمان و کلیک روی Join Now به‌صورت بهترین‌تلاش
  از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال کردن یک زبانه موجود Meet به‌جای
  باز کردن نسخه‌های تکراری
- `chrome.waitForInCallMs: 20000`: انتظار برای اینکه زبانه Meet پیش از
  فعال شدن معرفی پاسخ‌گویی، وضعیت در تماس را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت‌فرمان. از
  `"g711-ulaw-8khz"` فقط برای جفت‌فرمان‌های قدیمی/سفارشی که هنوز صوت تلفنی
  تولید می‌کنند استفاده کنید.
- `chrome.audioBufferBytes: 4096`: بافر پردازش SoX برای فرمان‌های صوتی
  جفت‌فرمان Chrome تولیدشده. این مقدار نصف بافر پیش‌فرض 8192 بایتی SoX است
  و تأخیر پیش‌فرض لوله را کاهش می‌دهد، درحالی‌که امکان افزایش آن روی میزبان‌های شلوغ
  باقی می‌ماند. مقادیر کمتر از حداقل SoX به 17 بایت محدود می‌شوند.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch`
  می‌خواند و صوت را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صوت را در `chrome.audioFormat`
  می‌خواند و در CoreAudio `BlackHole 2ch` می‌نویسد
- `chrome.bargeInInputCommand`: فرمان میکروفون محلی اختیاری که برای تشخیص
  ورود گفتار انسانی هنگام فعال بودن پخش دستیار، PCM تک‌کاناله little-endian
  16 بیتی علامت‌دار می‌نویسد. این در حال حاضر روی پل جفت‌فرمان `chrome`
  میزبانی‌شده در Gateway اعمال می‌شود.
- `chrome.bargeInRmsThreshold: 650`: سطح RMS که روی
  `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی محسوب می‌شود
- `chrome.bargeInPeakThreshold: 2500`: سطح اوج که روی
  `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی محسوب می‌شود
- `chrome.bargeInCooldownMs: 900`: حداقل تأخیر بین پاک‌سازی‌های تکراری
  وقفه انسانی
- `mode: "agent"`: حالت پیش‌فرض پاسخ‌گویی. گفتار شرکت‌کننده توسط
  ارائه‌دهنده رونویسی بی‌درنگ پیکربندی‌شده رونویسی می‌شود، به عامل
  OpenClaw پیکربندی‌شده در یک نشست زیرعامل مخصوص هر جلسه فرستاده می‌شود،
  و از طریق زمان‌اجرای عادی TTS در OpenClaw بازگو می‌شود.
- `mode: "bidi"`: حالت جایگزین مدل بی‌درنگ دوسویه مستقیم. ارائه‌دهنده
  صدای بی‌درنگ مستقیماً به گفتار شرکت‌کننده پاسخ می‌دهد و ممکن است برای
  پاسخ‌های عمیق‌تر/دارای پشتوانه ابزار `openclaw_agent_consult` را فراخوانی کند.
- `mode: "transcribe"`: حالت فقط مشاهده بدون پل پاسخ‌گویی.
- `realtime.provider: "openai"`: جایگزین سازگاری که وقتی فیلدهای
  ارائه‌دهنده محدوده‌دار زیر تنظیم نشده باشند استفاده می‌شود.
- `realtime.transcriptionProvider: "openai"`: شناسه ارائه‌دهنده‌ای که حالت
  `agent` برای رونویسی بی‌درنگ استفاده می‌کند.
- `realtime.voiceProvider`: شناسه ارائه‌دهنده‌ای که حالت `bidi` برای صدای
  بی‌درنگ مستقیم استفاده می‌کند. برای استفاده از Gemini Live درحالی‌که
  رونویسی حالت عامل روی OpenAI باقی می‌ماند، این را روی `"google"` تنظیم کنید.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، همراه با
  `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی آمادگی گفتاری کوتاه هنگام اتصال پل بی‌درنگ؛
  برای پیوستن بی‌صدا آن را روی `""` تنظیم کنید
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

ElevenLabs برای هر دو کار شنیدن و صحبت کردن در حالت عامل:

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

صدای پایدار Meet از
`messages.tts.providers.elevenlabs.voiceId` می‌آید. پاسخ‌های عامل همچنین می‌توانند
وقتی بازنویسی‌های مدل TTS فعال باشند از دستورهای مخصوص هر پاسخ
`[[tts:voiceId=... model=eleven_v3]]` استفاده کنند، اما پیکربندی، پیش‌فرض
قطعی برای جلسه‌ها است. هنگام پیوستن، گزارش‌ها باید
`transcriptionProvider=elevenlabs` را نشان دهند و هر پاسخ گفتاری باید
`provider=elevenlabs model=eleven_v3 voice=<voiceId>` را ثبت کند.

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

`voiceCall.enabled` به‌صورت پیش‌فرض `true` است؛ با انتقال Twilio، تماس واقعی
PSTN، DTMF، و خوشامدگویی آغازین را به Plugin تماس صوتی واگذار می‌کند. تماس صوتی
پیش از باز کردن جریان رسانه بی‌درنگ، دنباله DTMF را پخش می‌کند، سپس متن معرفی
ذخیره‌شده را به‌عنوان خوشامدگویی بی‌درنگ اولیه استفاده می‌کند. اگر `voice-call`
فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را اعتبارسنجی و ضبط کند،
اما نمی‌تواند تماس Twilio را برقرار کند.

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

وقتی Chrome روی میزبان Gateway اجرا می‌شود، از `transport: "chrome"` استفاده کنید.
وقتی Chrome روی یک Node جفت‌شده مانند یک ماشین مجازی Parallels اجرا می‌شود، از
`transport: "chrome-node"` استفاده کنید. در هر دو حالت، ارائه‌دهندگان مدل و
`openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های
مدل همان‌جا می‌مانند. با `mode: "agent"` پیش‌فرض، ارائه‌دهنده رونویسی بی‌درنگ
کار شنیدن را انجام می‌دهد، عامل OpenClaw پیکربندی‌شده پاسخ را تولید می‌کند،
و TTS معمول OpenClaw آن را در Meet پخش می‌کند. وقتی می‌خواهید مدل صدای بی‌درنگ
مستقیماً پاسخ دهد، از `mode: "bidi"` استفاده کنید.
`mode: "realtime"` خام همچنان به‌عنوان نام مستعار سازگاری قدیمی برای
`mode: "agent"` پذیرفته می‌شود، اما دیگر در شمای ابزار عامل تبلیغ نمی‌شود.
گزارش‌های حالت عامل در آغاز راه‌اندازی پل، ارائه‌دهنده/مدل رونویسی حل‌شده را،
و پس از هر پاسخ سنتز‌شده، ارائه‌دهنده TTS، مدل، صدا، قالب خروجی، و نرخ نمونه‌برداری
را شامل می‌شوند.

برای فهرست کردن نشست‌های فعال یا بررسی یک شناسه نشست از `action: "status"`
استفاده کنید. برای اینکه عامل بی‌درنگ فوراً صحبت کند، از `action: "speak"`
همراه با `sessionId` و `message` استفاده کنید. برای ایجاد یا استفاده دوباره
از نشست، فعال کردن یک عبارت شناخته‌شده، و بازگرداندن سلامت `inCall` وقتی
میزبان Chrome می‌تواند آن را گزارش کند، از `action: "test_speech"` استفاده کنید.
`test_speech` همیشه `mode: "agent"` را اجباری می‌کند و اگر از آن خواسته شود
در `mode: "transcribe"` اجرا شود شکست می‌خورد، زیرا نشست‌های فقط مشاهده عمداً
نمی‌توانند گفتار منتشر کنند. نتیجه `speechOutputVerified` آن بر پایه افزایش
بایت‌های خروجی صوت بی‌درنگ در طول این فراخوانی آزمایشی است، بنابراین نشست
استفاده‌شده دوباره با صوت قدیمی‌تر به‌عنوان بررسی گفتار موفق تازه محسوب نمی‌شود.
برای علامت‌گذاری پایان نشست از `action: "leave"` استفاده کنید.

`status` در صورت در دسترس بودن، سلامت Chrome را شامل می‌شود:

- `inCall`: به‌نظر می‌رسد Chrome داخل تماس Meet است
- `micMuted`: وضعیت میکروفون Meet به‌صورت بهترین‌تلاش
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: نمایه
  مرورگر پیش از اینکه گفتار کار کند به ورود دستی، پذیرش میزبان Meet، مجوزها،
  یا تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: اینکه آیا
  گفتار Chrome مدیریت‌شده اکنون مجاز است. `speechReady: false` یعنی OpenClaw
  عبارت معرفی/آزمایش را به پل صوتی نفرستاده است.
- `providerConnected` / `realtimeReady`: وضعیت پل صدای بی‌درنگ
- `lastInputAt` / `lastOutputAt`: آخرین صوت دیده‌شده از پل یا ارسال‌شده به آن
- `audioOutputRouted` / `audioOutputDeviceLabel`: اینکه آیا خروجی رسانه زبانه
  Meet به‌طور فعال به دستگاه BlackHole استفاده‌شده توسط پل مسیریابی شده است
- `lastSuppressedInputAt` / `suppressedInputBytes`: ورودی local loopback که
  هنگام فعال بودن پخش دستیار نادیده گرفته شده است

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## حالت‌های عامل و Bidi

حالت `agent` در Chrome برای رفتار «عامل من در جلسه است» بهینه شده است.
ارائه‌دهنده رونویسی بی‌درنگ صوت جلسه را می‌شنود، رونوشت‌های نهایی شرکت‌کننده
از طریق عامل OpenClaw پیکربندی‌شده مسیریابی می‌شوند، و پاسخ از طریق زمان‌اجرای
عادی TTS در OpenClaw پخش می‌شود. وقتی می‌خواهید مدل صدای بی‌درنگ مستقیماً
پاسخ دهد، `mode: "bidi"` را تنظیم کنید.
قطعه‌های نزدیک رونوشت نهایی پیش از مشاوره ادغام می‌شوند تا یک نوبت گفتاری
چند پاسخ جزئی کهنه تولید نکند. ورودی بی‌درنگ نیز تا زمانی که صوت دستیار در صف
هنوز در حال پخش است سرکوب می‌شود،
و بازتاب‌های اخیر رونوشت شبیه دستیار پیش از مشاوره عامل نادیده گرفته می‌شوند
تا local loopback در BlackHole باعث نشود عامل به گفتار خودش پاسخ دهد.

| حالت    | چه کسی پاسخ را تعیین می‌کند        | مسیر خروجی گفتار                     | زمان استفاده                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | عامل OpenClaw پیکربندی‌شده | زمان‌اجرای عادی TTS در OpenClaw            | رفتار «عامل من در جلسه است» را می‌خواهید        |
| `bidi`  | مدل صدای بی‌درنگ      | پاسخ صوتی ارائه‌دهنده صدای بی‌درنگ | حلقه صدای مکالمه‌ای با کمترین تأخیر را می‌خواهید |

در حالت `bidi`، وقتی مدل بی‌درنگ به استدلال عمیق‌تر، اطلاعات جاری، یا ابزارهای
عادی OpenClaw نیاز دارد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره، عامل معمول OpenClaw را در پشت صحنه با زمینه رونوشت اخیر
جلسه اجرا می‌کند و یک پاسخ گفتاری مختصر برمی‌گرداند. در حالت `agent`،
OpenClaw آن پاسخ را مستقیم به زمان‌اجرای TTS می‌فرستد؛ در حالت `bidi`، مدل
صدای بلادرنگ می‌تواند نتیجه مشاوره را دوباره در جلسه بیان کند. این از همان
سازوکار مشاوره مشترک Voice Call استفاده می‌کند.

به‌طور پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet
باید با فضای کاری عامل اختصاصی OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار،
حافظه، و تاریخچه نشست مشورت کند، `realtime.agentId` را تنظیم کنید.

مشاوره‌های حالت عامل از کلید نشست جداگانه برای هر جلسه با قالب
`agent:<id>:subagent:google-meet:<session>` استفاده می‌کنند تا پرسش‌های
دنباله‌دار ضمن حفظ زمینه جلسه، سیاست معمول عامل را از عامل پیکربندی‌شده به
ارث ببرند.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در دسترس بگذارید و عامل معمول را به
  `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و
  `memory_get` محدود کنید.
- `owner`: ابزار مشاوره را در دسترس بگذارید و اجازه دهید عامل معمول از سیاست
  ابزار عادی عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صدای بلادرنگ نگذارید.

کلید نشست مشاوره به هر نشست Meet محدود است، بنابراین فراخوانی‌های مشاوره
دنباله‌دار می‌توانند در همان جلسه از زمینه مشاوره قبلی دوباره استفاده کنند.

برای اجبار به بررسی آمادگی گفتاری پس از اینکه Chrome کاملاً به تماس پیوست:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای دودآزمون کامل پیوستن و صحبت کردن:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## فهرست بررسی آزمون زنده

پیش از سپردن یک جلسه به عامل بی‌ناظر، از این توالی استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت موردانتظار Chrome-node:

- `googlemeet setup` همه‌اش سبز است.
- وقتی Chrome-node حمل‌ونقل پیش‌فرض است یا یک Node سنجاق شده، `googlemeet setup`
  شامل `chrome-node-connected` است.
- `nodes status` نشان می‌دهد Node انتخاب‌شده متصل است.
- Node انتخاب‌شده هر دو قابلیت `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- زبانه Meet به تماس می‌پیوندد و `test-speech` سلامت Chrome را با
  `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome راه‌دور مانند ماشین مجازی Parallels macOS، این کوتاه‌ترین
بررسی امن پس از به‌روزرسانی Gateway یا ماشین مجازی است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند Plugin مربوط به Gateway بارگذاری شده، Node ماشین مجازی با توکن
فعلی متصل است، و پل صوتی Meet پیش از آنکه عامل یک زبانه جلسه واقعی باز کند
در دسترس است.

برای دودآزمون Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را
ارائه می‌کند:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت موردانتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin`،
  `twilio-voice-call-credentials`، و `twilio-voice-call-webhook` است.
- پس از بارگذاری دوباره Gateway، `voicecall` در CLI در دسترس است.
- نشست برگشتی `transport: "twilio"` و یک `twilio.voiceCallId` دارد.
- `openclaw logs --follow` نشان می‌دهد TwiML مربوط به DTMF پیش از TwiML
  بلادرنگ ارائه شده، سپس یک پل بلادرنگ با خوشامدگویی اولیه در صف قرار گرفته است.
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

روی میزبان‌های Gateway غیر از macOS، ابزار روبه‌عامل `google_meet` همچنان
قابل مشاهده می‌ماند، اما کنش‌های بازگشت گفتار Chrome محلی پیش از رسیدن به پل
صوتی مسدود می‌شوند. صدای بازگشت گفتار Chrome محلی در حال حاضر به
`BlackHole 2ch` در macOS وابسته است، بنابراین عامل‌های Linux باید به‌جای مسیر
پیش‌فرض عامل Chrome محلی از `mode: "transcribe"`، شماره‌گیری Twilio، یا یک
میزبان `chrome-node` روی macOS استفاده کنند.

### هیچ Node متصل و دارای قابلیت Google Meet وجود ندارد

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

اگر `googlemeet setup` در `chrome-node-connected` شکست می‌خورد یا گزارش Gateway
عبارت `gateway token mismatch` را نشان می‌دهد، Node را با توکن فعلی Gateway
دوباره نصب یا بازراه‌اندازی کنید. برای یک Gateway در LAN، این معمولاً یعنی:

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

برای پیوستن‌های فقط مشاهده، `googlemeet test-listen` را اجرا کنید، یا برای
پیوستن‌های بلادرنگ `googlemeet test-speech` را، سپس سلامت Chrome برگشتی را
بررسی کنید. اگر هرکدام از این کاوش‌ها `manualActionRequired: true` را گزارش کرد،
`manualActionMessage` را به اپراتور نشان دهید و تا زمانی که کنش مرورگر کامل نشده
تلاش دوباره را متوقف کنید.

کنش‌های دستی رایج:

- وارد نمایه Chrome شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی اعلان مجوز بومی Chrome ظاهر می‌شود، مجوزهای میکروفون/دوربین Chrome را بدهید.
- یک گفت‌وگوی مجوز گیرکرده Meet را ببندید یا تعمیر کنید.

صرفاً به این دلیل که Meet نشان می‌دهد "Do you want people to hear you in the meeting?"
گزارش «وارد نشده» ندهید. این میان‌صفحه انتخاب صوت Meet است؛ OpenClaw وقتی
در دسترس باشد از طریق خودکارسازی مرورگر روی **Use microphone** کلیک می‌کند و
برای وضعیت واقعی جلسه همچنان منتظر می‌ماند. برای مسیر جایگزین مرورگر فقط-ایجاد،
OpenClaw ممکن است روی **Continue without microphone** کلیک کند، چون ایجاد URL
به مسیر صوتی بلادرنگ نیاز ندارد.

### ایجاد جلسه شکست می‌خورد

`googlemeet create` ابتدا، وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند، از
نقطه پایانی Google Meet API `spaces.create` استفاده می‌کند. بدون اعتبارنامه‌های
OAuth به مرورگر Chrome node سنجاق‌شده برمی‌گردد. تأیید کنید:

- برای ایجاد از طریق API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند،
  یا متغیرهای محیطی مطابق `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ایجاد از طریق API: توکن نوسازی پس از اضافه شدن پشتیبانی ایجاد صادر شده است.
  توکن‌های قدیمی‌تر ممکن است دامنه `meetings.space.created` را نداشته باشند؛
  `openclaw googlemeet auth login --json` را دوباره اجرا کنید و پیکربندی Plugin را به‌روزرسانی کنید.
- برای مسیر جایگزین مرورگر: `defaultTransport: "chrome-node"` و
  `chromeNode.node` به Node متصلی اشاره می‌کنند که `browser.proxy` و
  `googlemeet.chrome` دارد.
- برای مسیر جایگزین مرورگر: نمایه Chrome مربوط به OpenClaw روی آن Node به
  Google وارد شده و می‌تواند `https://meet.google.com/new` را باز کند.
- برای مسیر جایگزین مرورگر: تلاش‌های دوباره پیش از باز کردن زبانه جدید، از
  زبانه موجود `https://meet.google.com/new` یا اعلان حساب Google دوباره استفاده
  می‌کنند. اگر عامل مهلت زمانی را از دست داد، به‌جای باز کردن دستی یک زبانه Meet
  دیگر، فراخوانی ابزار را دوباره امتحان کنید.
- برای مسیر جایگزین مرورگر: اگر ابزار `manualActionRequired: true` را برگرداند،
  از `browser.nodeId`، `browser.targetId`، `browserUrl`، و `manualActionMessage`
  برگشتی برای راهنمایی اپراتور استفاده کنید. تا زمانی که آن کنش کامل نشده در
  حلقه تلاش دوباره نکنید.
- برای مسیر جایگزین مرورگر: اگر Meet نشان می‌دهد "Do you want people to hear you in the
  meeting?"، زبانه را باز بگذارید. OpenClaw باید از طریق خودکارسازی مرورگر روی
  **Use microphone** یا، برای مسیر جایگزین فقط-ایجاد، روی
  **Continue without microphone** کلیک کند و برای URL تولیدشده Meet همچنان منتظر
  بماند. اگر نتواند، خطا باید به `meet-audio-choice-required` اشاره کند، نه
  `google-login-required`.

### عامل می‌پیوندد اما صحبت نمی‌کند

مسیر بلادرنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای مسیر عادی بازگشت گفتار STT -> عامل OpenClaw -> TTS از `mode: "agent"`،
یا برای جایگزین صدای بلادرنگ مستقیم از `mode: "bidi"` استفاده کنید.
`mode: "transcribe"` عمداً پل بازگشت گفتار را شروع نمی‌کند. برای اشکال‌زدایی
فقط مشاهده، پس از صحبت شرکت‌کنندگان `openclaw googlemeet status --json <session-id>`
را اجرا کنید و `captioning`، `transcriptLines`، و `lastCaptionText` را بررسی کنید.
اگر `inCall` برابر true است اما `transcriptLines` روی `0` می‌ماند، ممکن است
زیرنویس‌های Meet غیرفعال باشند، از زمان نصب مشاهده‌گر کسی صحبت نکرده باشد،
رابط کاربری Meet تغییر کرده باشد، یا زیرنویس زنده برای زبان/حساب جلسه در دسترس نباشد.

`googlemeet test-speech` همیشه مسیر بلادرنگ را بررسی می‌کند و گزارش می‌دهد که
آیا برای آن فراخوانی، بایت‌های خروجی پل مشاهده شده‌اند یا نه. اگر
`speechOutputVerified` برابر false و `speechOutputTimedOut` برابر true باشد،
ممکن است ارائه‌دهنده بلادرنگ گفتار را پذیرفته باشد اما OpenClaw ندیده باشد که
بایت‌های خروجی جدید به پل صوتی Chrome برسند.

همچنین بررسی کنید:

- یک کلید ارائه‌دهنده بلادرنگ روی میزبان Gateway در دسترس است، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده است.
- `sox` روی میزبان Chrome وجود دارد.
- میکروفون و بلندگوی Meet از مسیر صوتی مجازی استفاده‌شده توسط OpenClaw عبور داده شده‌اند.
  برای پیوستن‌های بلادرنگ Chrome محلی، `doctor` باید `meet output routed: yes` را نشان دهد.

`googlemeet doctor [session-id]` نشست، Node، وضعیت داخل تماس، دلیل کنش دستی،
اتصال ارائه‌دهنده بلادرنگ، `realtimeReady`، فعالیت ورودی/خروجی صوتی،
آخرین زمان‌های صوتی، شمارنده‌های بایت، و URL مرورگر را چاپ می‌کند.
وقتی به JSON خام نیاز دارید از `googlemeet status [session-id] --json` استفاده کنید.
وقتی لازم است نوسازی OAuth مربوط به Google Meet را بدون افشای توکن‌ها بررسی کنید،
از `googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API هم
نیاز دارید، `--meeting` یا `--create-space` را اضافه کنید.

اگر عامل مهلت زمانی را از دست داد و می‌توانید ببینید که یک زبانه Meet از قبل
باز است، همان زبانه را بدون باز کردن زبانه دیگر بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

کنش ابزار معادل `recover_current_tab` است. این کار یک زبانه Meet موجود را برای
حمل‌ونقل انتخاب‌شده متمرکز و بررسی می‌کند. با `chrome`، از کنترل مرورگر محلی
از طریق Gateway استفاده می‌کند؛ با `chrome-node`، از Chrome node پیکربندی‌شده
استفاده می‌کند. زبانه جدیدی باز نمی‌کند یا نشست جدیدی نمی‌سازد؛ مانع فعلی را
گزارش می‌کند، مانند ورود، پذیرش، مجوزها، یا وضعیت انتخاب صوت. فرمان CLI با
Gateway پیکربندی‌شده صحبت می‌کند، بنابراین Gateway باید در حال اجرا باشد؛
`chrome-node` همچنین نیاز دارد Chrome node متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

وقتی `voice-call` مجاز یا فعال نباشد، `twilio-voice-call-plugin` شکست می‌خورد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید،
و Gateway را دوباره بارگذاری کنید.

وقتی backend مربوط به Twilio فاقد SID حساب، توکن احراز هویت، یا شماره تماس‌گیرنده
باشد، `twilio-voice-call-credentials` شکست می‌خورد. این‌ها را روی میزبان Gateway
تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

وقتی `voice-call` هیچ Webhook عمومی در معرض دسترس ندارد، یا وقتی `publicUrl` به
loopback یا فضای شبکه خصوصی اشاره می‌کند، `twilio-voice-call-webhook` شکست می‌خورد.
`plugins.entries.voice-call.config.publicUrl` را روی URL عمومی ارائه‌دهنده تنظیم کنید
یا یک تونل/در معرض‌گذاری `voice-call` از طریق Tailscale پیکربندی کنید.

URLهای loopback و خصوصی برای callbacks اپراتور معتبر نیستند. از
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

`voicecall smoke` به‌طور پیش‌فرض فقط آمادگی را بررسی می‌کند. برای اجرای آزمایشی بدون ارسال واقعی روی یک شمارهٔ مشخص:

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
dial-in و PIN یا یک توالی سفارشی DTMF را بدهید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر ارائه‌دهنده پیش از وارد کردن PIN به مکث نیاز دارد، در `--dtmf-sequence` از
`w` ابتدایی یا ویرگول استفاده کنید.

اگر تماس تلفنی ایجاد شده اما فهرست شرکت‌کنندگان Meet هرگز شرکت‌کنندهٔ dial-in
را نشان نمی‌دهد:

- `openclaw googlemeet doctor <session-id>` را اجرا کنید تا شناسهٔ تماس Twilio
  واگذارشده، اینکه آیا DTMF در صف قرار گرفته، و اینکه آیا خوشامدگویی آغازین درخواست شده است تأیید شود.
- `openclaw voicecall status --call-id <id>` را اجرا کنید و تأیید کنید که تماس هنوز
  فعال است.
- `openclaw voicecall tail` را اجرا کنید و بررسی کنید که Webhookهای Twilio به
  Gateway می‌رسند.
- `openclaw logs --follow` را اجرا کنید و به‌دنبال توالی Twilio Meet بگردید: Google
  Meet پیوستن را واگذار می‌کند، Voice Call توالی DTMF پیش از اتصال را ذخیره و TwiML آن را ارائه می‌کند،
  Voice Call برای تماس Twilio تویی‌ام‌ال بلادرنگ ارائه می‌کند، سپس Google Meet گفتار
  معرفی را با `voicecall.speak` درخواست می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ بررسی setup سبز
  لازم است اما درست بودن توالی PIN جلسه را اثبات نمی‌کند.
- تأیید کنید شمارهٔ dial-in به همان دعوت‌نامه و منطقهٔ Meet تعلق دارد که PIN نیز
  مربوط به آن است.
- اگر Meet کند پاسخ می‌دهد یا متن تماس همچنان پس از ارسال DTMF پیش از اتصال
  پیام درخواست PIN را نشان می‌دهد، `voiceCall.dtmfDelayMs` را از مقدار پیش‌فرض ۱۲ ثانیه افزایش دهید.
- اگر شرکت‌کننده وارد می‌شود اما خوشامدگویی را نمی‌شنوید، در
  `openclaw logs --follow` درخواست `voicecall.speak` پس از DTMF و
  پخش TTS از media-stream یا fallback `<Say>` در Twilio را بررسی کنید. اگر متن
  تماس هنوز شامل «enter the meeting PIN» است، مسیر تلفنی هنوز وارد اتاق Meet نشده است،
  بنابراین شرکت‌کنندگان جلسه گفتار را نخواهند شنید.

اگر Webhookها نمی‌رسند، ابتدا Plugin تماس صوتی را اشکال‌زدایی کنید: ارائه‌دهنده باید
به `plugins.entries.voice-call.config.publicUrl` یا تونل پیکربندی‌شده دسترسی داشته باشد.
[عیب‌یابی تماس صوتی](/fa/plugins/voice-call#troubleshooting) را ببینید.

## نکته‌ها

API رسمی رسانهٔ Google Meet دریافت‌محور است، بنابراین صحبت کردن در یک تماس Meet
هنوز به مسیر شرکت‌کننده نیاز دارد. این Plugin آن مرز را آشکار نگه می‌دارد:
Chrome مشارکت مرورگر و مسیریابی صوت محلی را مدیریت می‌کند؛ Twilio مشارکت
dial-in تلفنی را مدیریت می‌کند.

حالت‌های talk-back در Chrome به `BlackHole 2ch` به‌همراه یکی از این موارد نیاز دارند:

- `chrome.audioInputCommand` به‌همراه `chrome.audioOutputCommand`: OpenClaw مالک
  پل است و صدا را در `chrome.audioFormat` بین آن دستورها و ارائه‌دهندهٔ انتخاب‌شده لوله‌کشی می‌کند.
  حالت عامل از رونویسی بلادرنگ به‌همراه TTS عادی استفاده می‌کند؛
  حالت bidi از ارائه‌دهندهٔ صدای بلادرنگ استفاده می‌کند. مسیر پیش‌فرض Chrome برابر با PCM16
  با نرخ ۲۴ kHz و `chrome.audioBufferBytes: 4096` است؛ G.711 mu-law با نرخ ۸ kHz همچنان
  برای جفت‌دستورهای قدیمی در دسترس است.
- `chrome.audioBridgeCommand`: یک دستور پل خارجی مالک کل مسیر صوت محلی است
  و باید پس از شروع یا اعتبارسنجی daemon خود خارج شود. این فقط برای `bidi`
  معتبر است، چون حالت `agent` برای TTS به دسترسی مستقیم به جفت‌دستور نیاز دارد.

وقتی یک عامل در حالت عامل ابزار `google_meet` را فراخوانی می‌کند، نشست مشاور
جلسه، پیش از پاسخ دادن به گفتار شرکت‌کننده، متن گفت‌وگوی فعلی فراخواننده را fork می‌کند.
نشست Meet همچنان جدا می‌ماند (`agent:<agentId>:subagent:google-meet:<sessionId>`)
تا پیگیری‌های جلسه متن گفت‌وگوی فراخواننده را مستقیماً تغییر ندهند.

برای صدای دوطرفهٔ تمیز، خروجی Meet و میکروفون Meet را از طریق دستگاه‌های مجازی
جداگانه یا یک گراف دستگاه مجازی به سبک Loopback مسیریابی کنید. یک دستگاه مشترک
BlackHole می‌تواند صدای سایر شرکت‌کنندگان را دوباره به تماس بازتاب دهد.

با پل Chrome مبتنی بر جفت‌دستور، `chrome.bargeInInputCommand` می‌تواند به یک
میکروفون محلی جداگانه گوش دهد و وقتی انسان شروع به صحبت می‌کند پخش دستیار را
پاک کند. این کار گفتار انسان را حتی زمانی که ورودی loopback مشترک BlackHole
در طول پخش دستیار موقتاً سرکوب شده است، جلوتر از خروجی دستیار نگه می‌دارد.
مانند `chrome.audioInputCommand` و `chrome.audioOutputCommand`، این یک دستور
محلی پیکربندی‌شده توسط اپراتور است. از مسیر دستور یا فهرست آرگومان‌های صریح و مورد اعتماد استفاده کنید
و آن را به اسکریپت‌هایی از مکان‌های نامطمئن اشاره ندهید.

`googlemeet speak` پل صوتی talk-back فعال را برای یک نشست Chrome فعال می‌کند.
`googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق
Plugin تماس صوتی واگذار شده‌اند، `leave` تماس صوتی زیربنایی را نیز قطع می‌کند.
وقتی می‌خواهید کنفرانس فعال Google Meet را هم برای یک فضای مدیریت‌شده با API ببندید،
از `googlemeet end-active-conference` استفاده کنید.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
