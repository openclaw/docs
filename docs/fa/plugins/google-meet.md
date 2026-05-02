---
read_when:
    - می‌خواهید یک عامل OpenClaw به یک تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - شما در حال پیکربندی Chrome، Chrome node یا Twilio به‌عنوان واسط انتقال Google Meet هستید
summary: 'Plugin Google Meet: پیوستن به URLهای مشخص Meet از طریق Chrome یا Twilio با پیش‌فرض‌های صوتی بی‌درنگ'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T11:55:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی شرکت‌کننده Google Meet برای OpenClaw — این Plugin عمداً صریح طراحی شده است:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید ایجاد کند، سپس به URL
  بازگردانده‌شده بپیوندد.
- صدای `realtime` حالت پیش‌فرض است.
- صدای بلادرنگ می‌تواند وقتی به استدلال عمیق‌تر یا ابزارها نیاز است، دوباره به عامل کامل OpenClaw فراخوانی کند.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: از `realtime` برای گوش‌دادن/پاسخ‌گفتن زنده، یا از `transcribe` برای پیوستن/کنترل مرورگر بدون پل صدای بلادرنگ استفاده کنید.
- احراز هویت با Google OAuth شخصی یا یک پروفایل Chrome که از قبل وارد شده است شروع می‌شود.
- هیچ اعلام رضایت خودکاری وجود ندارد.
- backend صوتی پیش‌فرض Chrome، `BlackHole 2ch` است.
- Chrome می‌تواند به‌صورت محلی یا روی یک میزبان node جفت‌شده اجرا شود.
- Twilio یک شماره تماس ورودی به‌همراه PIN یا دنباله DTMF اختیاری را می‌پذیرد؛ نمی‌تواند مستقیماً با یک URL Meet تماس بگیرد.
- فرمان CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر کنفرانس تلفنی عامل رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید و یک ارائه‌دهنده صدای بلادرنگ backend را پیکربندی کنید. OpenAI پیش‌فرض است؛ Google Gemini Live نیز با
`realtime.provider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده Homebrew
پیش از آن‌که macOS دستگاه را در دسترس بگذارد، به راه‌اندازی مجدد نیاز دارد:

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

خروجی راه‌اندازی برای خواندن توسط عامل و با آگاهی از حالت طراحی شده است. این خروجی پروفایل Chrome، پین‌کردن node، و برای پیوستن‌های بلادرنگ Chrome، پل صوتی BlackHole/SoX و بررسی‌های معرفی بلادرنگِ با تأخیر را گزارش می‌کند. برای پیوستن‌های فقط مشاهده، همان انتقال را با `--mode transcribe` بررسی کنید؛ آن حالت پیش‌نیازهای صوتی بلادرنگ را رد می‌کند، زیرا از طریق پل گوش نمی‌دهد یا صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌دهد که آیا Plugin
`voice-call`، اعتبارنامه‌های Twilio، و در معرض‌گذاری عمومی Webhook آماده هستند یا نه.
هر بررسی `ok: false` را پیش از درخواست از عامل برای پیوستن، به‌عنوان مانع برای انتقال و حالت بررسی‌شده در نظر بگیرید. برای اسکریپت‌ها یا خروجی قابل‌خواندن توسط ماشین از `openclaw googlemeet setup --json` استفاده کنید. برای پیش‌پرواز یک انتقال مشخص پیش از تلاش عامل، از `--transport chrome`،
`--transport chrome-node`، یا `--transport twilio` استفاده کنید.

برای Twilio، وقتی انتقال پیش‌فرض Chrome است، همیشه انتقال را به‌صورت صریح پیش‌پرواز کنید:

```bash
openclaw googlemeet setup --transport twilio
```

این کار نبود اتصال‌سازی `voice-call`، اعتبارنامه‌های Twilio، یا در معرض‌گذاری Webhook دسترس‌ناپذیر را پیش از تلاش عامل برای شماره‌گیری جلسه آشکار می‌کند.

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

ابزار روبه‌روی عامل `google_meet` روی میزبان‌های غیر macOS برای جریان‌های artifact، calendar، setup، transcribe، Twilio، و `chrome-node` همچنان در دسترس می‌ماند. اقدامات بلادرنگ Chrome محلی در آن‌جا مسدود می‌شوند، زیرا مسیر صوتی بلادرنگ Chrome بسته‌بندی‌شده فعلاً به `BlackHole 2ch` در macOS وابسته است. روی Linux، برای مشارکت بلادرنگ Chrome از
`mode: "transcribe"`، تماس ورودی Twilio، یا یک میزبان macOS `chrome-node` استفاده کنید.

یک جلسه جدید ایجاد کنید و به آن بپیوندید:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

برای اتاق‌هایی که با API ایجاد شده‌اند، وقتی می‌خواهید سیاست بدون‌درزدن اتاق به‌جای ارث‌بری از پیش‌فرض‌های حساب Google صریح باشد، از Google Meet `SpaceConfig.accessType` استفاده کنید:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` به هر کسی که URL Meet را دارد اجازه می‌دهد بدون درزدن بپیوندد. `TRUSTED` به کاربران مورد اعتماد سازمان میزبان، کاربران خارجی دعوت‌شده، و کاربران تماس ورودی اجازه می‌دهد بدون درزدن بپیوندند. `RESTRICTED` ورود بدون درزدن را به دعوت‌شدگان محدود می‌کند. این تنظیمات فقط برای مسیر رسمی ایجاد از طریق Google Meet API اعمال می‌شوند، بنابراین اعتبارنامه‌های OAuth باید پیکربندی شده باشند.

اگر پیش از در دسترس بودن این گزینه Google Meet را احراز هویت کرده‌اید، پس از افزودن scope
`meetings.space.settings` به صفحه رضایت Google OAuth خود، دوباره
`openclaw googlemeet auth login --json` را اجرا کنید.

فقط URL را بدون پیوستن ایجاد کنید:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` دو مسیر دارد:

- ایجاد با API: وقتی اعتبارنامه‌های Google Meet OAuth پیکربندی شده باشند استفاده می‌شود. این قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- fallback مرورگر: وقتی اعتبارنامه‌های OAuth وجود نداشته باشند استفاده می‌شود. OpenClaw از node پین‌شده Chrome استفاده می‌کند، `https://meet.google.com/new` را باز می‌کند، منتظر می‌ماند Google به یک URL واقعی با کد جلسه تغییر مسیر دهد، سپس آن URL را بازمی‌گرداند. این مسیر نیاز دارد پروفایل Chrome مربوط به OpenClaw روی node از قبل به Google وارد شده باشد.
  خودکارسازی مرورگر prompt میکروفون اجرای نخست خود Meet را مدیریت می‌کند؛ آن prompt
  به‌عنوان شکست ورود Google در نظر گرفته نمی‌شود.
  جریان‌های پیوستن و ایجاد همچنین پیش از بازکردن یک مورد جدید، تلاش می‌کنند از یک تب Meet موجود دوباره استفاده کنند. تطبیق، رشته‌های query بی‌ضرر URL مانند `authuser` را نادیده می‌گیرد، بنابراین تلاش دوباره عامل باید به‌جای ایجاد تب دوم Chrome، جلسه ازقبل‌باز را متمرکز کند.

خروجی فرمان/ابزار شامل یک فیلد `source` است (`api` یا `browser`) تا عامل‌ها بتوانند توضیح دهند کدام مسیر استفاده شده است. `create` به‌صورت پیش‌فرض به جلسه جدید می‌پیوندد و `joined: true` به‌همراه نشست پیوستن را بازمی‌گرداند. برای فقط ساختن URL، در CLI از
`create --no-join` استفاده کنید یا `"join": false` را به ابزار پاس دهید.

یا به یک عامل بگویید: «یک Google Meet ایجاد کن، با صدای بلادرنگ به آن بپیوند، و لینک را برای من بفرست.» عامل باید `google_meet` را با `action: "create"` فراخوانی کند و سپس
`meetingUri` بازگردانده‌شده را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

برای پیوستن فقط مشاهده/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید. این کار پل مدل بلادرنگ دوطرفه را آغاز نمی‌کند، به BlackHole یا SoX نیاز ندارد، و در جلسه پاسخ صوتی نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای مجوز میکروفون/دوربین OpenClaw و مسیر **Use
microphone** در Meet پرهیز می‌کنند. اگر Meet یک میان‌پرده انتخاب صدا نشان دهد، خودکارسازی مسیر بدون میکروفون را امتحان می‌کند و در غیر این صورت به‌جای بازکردن میکروفون محلی، یک اقدام دستی گزارش می‌دهد. در حالت transcribe، انتقال‌های مدیریت‌شده Chrome همچنین یک ناظر زیرنویس Meet را به‌صورت best-effort نصب می‌کنند. `googlemeet status --json` و
`googlemeet doctor` موارد `captioning`، `captionsEnabledAttempted`،
`transcriptLines`، `lastCaptionAt`، `lastCaptionSpeaker`، `lastCaptionText`،
و یک دنباله کوتاه `recentTranscript` را نشان می‌دهند تا اپراتورها بتوانند بفهمند آیا مرورگر به تماس پیوسته است و آیا زیرنویس‌های Meet متن تولید می‌کنند یا نه.
وقتی به یک بررسی بله/خیر نیاز دارید، از `openclaw googlemeet test-listen <meet-url> --transport chrome-node` استفاده کنید: این فرمان در حالت transcribe می‌پیوندد، منتظر حرکت تازه زیرنویس یا transcript می‌ماند، و `listenVerified`، `listenTimedOut`، فیلدهای اقدام دستی، و آخرین وضعیت سلامت زیرنویس را بازمی‌گرداند.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` سلامت مرورگر و پل صوتی مانند `inCall`،
`manualActionRequired`، `providerConnected`، `realtimeReady`، `audioInputActive`،
`audioOutputActive`، timestampهای آخرین ورودی/خروجی، شمارنده‌های بایت، و وضعیت بسته‌شدن پل را شامل می‌شود. اگر یک prompt امن صفحه Meet ظاهر شود، خودکارسازی مرورگر وقتی بتواند آن را مدیریت می‌کند. promptهای ورود، پذیرش توسط میزبان، و مجوز مرورگر/OS به‌صورت اقدام دستی با دلیل و پیام برای انتقال توسط عامل گزارش می‌شوند. نشست‌های مدیریت‌شده Chrome فقط پس از آن‌که سلامت مرورگر `inCall: true` را گزارش کند، معرفی یا عبارت آزمایشی را منتشر می‌کنند؛ در غیر این صورت وضعیت `speechReady: false` گزارش می‌دهد و تلاش برای گفتار به‌جای وانمود کردن به این‌که عامل در جلسه صحبت کرده است، مسدود می‌شود.

پیوستن‌های Chrome محلی از طریق پروفایل مرورگر OpenClaw که وارد شده است انجام می‌شوند. حالت بلادرنگ برای مسیر میکروفون/بلندگو که OpenClaw استفاده می‌کند به `BlackHole 2ch` نیاز دارد. برای صوت دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا یک گراف به سبک Loopback استفاده کنید؛ یک دستگاه BlackHole برای نخستین smoke test کافی است اما می‌تواند echo ایجاد کند.

### Gateway محلی + Parallels Chrome

فقط برای این‌که VM مالک Chrome باشد، به یک OpenClaw Gateway کامل یا کلید API مدل داخل یک VM macOS نیاز ندارید. Gateway و عامل را به‌صورت محلی اجرا کنید، سپس یک میزبان node را در VM اجرا کنید. Plugin بسته‌بندی‌شده را یک بار روی VM فعال کنید تا node فرمان Chrome را advertise کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، workspace عامل، کلیدهای مدل/API، ارائه‌دهنده بلادرنگ، و پیکربندی Plugin Google Meet.
- VM macOS Parallels: OpenClaw CLI/میزبان node، Google Chrome، SoX، BlackHole 2ch،
  و یک پروفایل Chrome که به Google وارد شده است.
- در VM لازم نیست: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا راه‌اندازی ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را راه‌اندازی مجدد کنید تا macOS، `BlackHole 2ch` را در دسترس بگذارد:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، بررسی کنید VM می‌تواند دستگاه صوتی و فرمان‌های SoX را ببیند:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

OpenClaw را در VM نصب یا به‌روزرسانی کنید، سپس Plugin بسته‌بندی‌شده را آن‌جا فعال کنید:

```bash
openclaw plugins enable google-meet
```

میزبان node را در VM شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP شبکه LAN است و از TLS استفاده نمی‌کنید، node اتصال WebSocket متن ساده را رد می‌کند، مگر این‌که برای آن شبکه خصوصی مورد اعتماد opt in کنید:

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
`openclaw.json`. وقتی `openclaw node install` آن را در فرمان نصب حاضر ببیند، در محیط LaunchAgent ذخیره می‌کند.

node را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید Gateway، node را می‌بیند و این‌که هم `googlemeet.chrome` و هم قابلیت مرورگر/`browser.proxy` را advertise می‌کند:

```bash
openclaw nodes status
```

Meet را از طریق آن node روی میزبان Gateway مسیر‌دهی کنید:

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

برای یک smoke test تک‌فرمانی که یک نشست را ایجاد می‌کند یا دوباره به‌کار می‌گیرد، یک عبارت شناخته‌شده را می‌گوید، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

هنگام پیوستن realtime، خودکارسازی مرورگر OpenClaw نام مهمان را وارد می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان Meet برای نخستین اجرا با گزینه
"Use microphone" ظاهر شود، آن گزینه را می‌پذیرد. هنگام پیوستن فقط-مشاهده یا ایجاد
جلسه فقط-مرورگر، اگر همان اعلان بدون میکروفون گزینه‌ای داشته باشد، از آن عبور
می‌کند. اگر نمایه مرورگر وارد حساب نشده باشد، Meet منتظر پذیرش میزبان باشد،
Chrome برای پیوستن realtime به مجوز میکروفون/دوربین نیاز داشته باشد، یا Meet روی
اعلانی گیر کرده باشد که خودکارسازی نتوانسته رفع کند، نتیجه join/test-speech مقدار
`manualActionRequired: true` را همراه با `manualActionReason` و
`manualActionMessage` گزارش می‌کند. Agentها باید تلاش دوباره برای پیوستن را متوقف
کنند، همان پیام دقیق را همراه با `browserUrl`/`browserTitle` فعلی گزارش کنند، و
فقط پس از تکمیل اقدام دستی در مرورگر دوباره تلاش کنند.

اگر `chromeNode.node` حذف شده باشد، OpenClaw فقط زمانی انتخاب خودکار انجام می‌دهد
که دقیقا یک Node متصل هم `googlemeet.chrome` و هم کنترل مرورگر را اعلام کند. اگر
چند Node توانمند متصل باشند، `chromeNode.node` را روی شناسه Node، نام نمایشی، یا
IP راه‌دور تنظیم کنید.

بررسی‌های خطای رایج:

- `Configured Google Meet node ... is not usable: offline`: Node سنجاق‌شده برای
  Gateway شناخته‌شده است اما در دسترس نیست. Agentها باید آن Node را به‌عنوان
  وضعیت تشخیصی در نظر بگیرند، نه به‌عنوان میزبان Chrome قابل استفاده، و به‌جای
  بازگشت به انتقال دیگر، مانع راه‌اندازی را گزارش کنند مگر اینکه کاربر چنین چیزی
  خواسته باشد.
- `No connected Google Meet-capable node`: در VM فرمان `openclaw node run` را اجرا
  کنید، جفت‌سازی را تایید کنید، و مطمئن شوید `openclaw plugins enable google-meet`
  و `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تایید کنید میزبان
  Gateway هر دو فرمان Node را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز کرده
  است.
- `BlackHole 2ch audio device not found`: `blackhole-2ch` را روی میزبانی که بررسی
  می‌شود نصب کنید و پیش از استفاده از صدای Chrome محلی، راه‌اندازی مجدد انجام
  دهید.
- `BlackHole 2ch audio device not found on the node`: `blackhole-2ch` را در VM نصب
  کنید و VM را راه‌اندازی مجدد کنید.
- Chrome باز می‌شود اما نمی‌تواند بپیوندد: داخل VM وارد نمایه مرورگر شوید، یا
  برای پیوستن مهمان، `chrome.guestName` را تنظیم نگه دارید. پیوستن خودکار مهمان
  از خودکارسازی مرورگر OpenClaw از طریق پروکسی مرورگر Node استفاده می‌کند؛ مطمئن
  شوید پیکربندی مرورگر Node به نمایه مورد نظر شما اشاره می‌کند، برای مثال
  `browser.defaultProfile: "user"` یا یک نمایه named existing-session.
- زبانه‌های تکراری Meet: `chrome.reuseExistingTab: true` را فعال بگذارید. OpenClaw
  پیش از باز کردن زبانه جدید، زبانه موجود برای همان URL Meet را فعال می‌کند، و
  ایجاد جلسه در مرورگر پیش از باز کردن زبانه دیگر، از زبانه درحال‌انجام
  `https://meet.google.com/new` یا اعلان حساب Google دوباره استفاده می‌کند.
- بدون صدا: در Meet، میکروفون/بلندگو را از مسیر دستگاه صوتی مجازی استفاده‌شده
  توسط OpenClaw عبور دهید؛ برای صدای دوطرفه تمیز از دستگاه‌های مجازی جداگانه یا
  مسیریابی سبک Loopback استفاده کنید.

## نکته‌های نصب

پیش‌فرض realtime در Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin برای پل صوتی پیش‌فرض 24 kHz PCM16 از
  فرمان‌های صریح دستگاه CoreAudio استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این درایور دستگاه صوتی `BlackHole 2ch`
  را ایجاد می‌کند که Chrome/Meet می‌توانند از آن عبور کنند.

OpenClaw هیچ‌کدام از این دو بسته را همراه خود ندارد یا بازتوزیع نمی‌کند. مستندات
از کاربران می‌خواهند آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق Homebrew نصب
کنند. SoX تحت مجوز `LGPL-2.0-only AND GPL-2.0-only` است؛ BlackHole تحت GPL-3.0
است. اگر نصب‌کننده یا دستگاهی می‌سازید که BlackHole را همراه OpenClaw بسته‌بندی
می‌کند، شرایط مجوزدهی بالادستی BlackHole را بررسی کنید یا از Existential Audio
مجوز جداگانه بگیرید.

## روش‌های انتقال

### Chrome

انتقال Chrome، URL Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و با نمایه
مرورگر OpenClaw که وارد حساب شده است می‌پیوندد. در macOS، Plugin پیش از راه‌اندازی
وجود `BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز کردن
Chrome یک فرمان سلامت پل صوتی و فرمان شروع را نیز اجرا می‌کند. وقتی Chrome/صدا
روی میزبان Gateway هستند از `chrome` استفاده کنید؛ وقتی Chrome/صدا روی یک Node
جفت‌شده مانند VM macOS در Parallels هستند از `chrome-node` استفاده کنید. برای
Chrome محلی، نمایه را با `browser.defaultProfile` انتخاب کنید؛ `chrome.browserProfile`
به میزبان‌های `chrome-node` فرستاده می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از پل صوتی محلی OpenClaw عبور دهید. اگر
`BlackHole 2ch` نصب نشده باشد، پیوستن به‌جای ورود خاموش و بدون مسیر صوتی، با خطای
راه‌اندازی شکست می‌خورد.

### Twilio

انتقال Twilio یک طرح شماره‌گیری سخت‌گیرانه است که به Plugin تماس صوتی واگذار
می‌شود. این روش صفحه‌های Meet را برای یافتن شماره تلفن تحلیل نمی‌کند.

وقتی مشارکت از طریق Chrome در دسترس نیست یا یک fallback شماره‌گیری تلفنی می‌خواهید
از این استفاده کنید. Google Meet باید برای جلسه، شماره شماره‌گیری تلفنی و PIN
ارائه کند؛ OpenClaw آن‌ها را از صفحه Meet کشف نمی‌کند.

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

اعتبارنامه‌های Twilio را از طریق محیط یا پیکربندی ارائه کنید. محیط، رازها را خارج
از `openclaw.json` نگه می‌دارد:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

پس از فعال کردن `voice-call`، Gateway را راه‌اندازی مجدد یا reload کنید؛ تغییرات
پیکربندی Plugin تا زمانی که reload نشوند در فرایند Gateway درحال‌اجرا ظاهر
نمی‌شوند.

سپس بررسی کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی واگذاری Twilio متصل شده باشد، `googlemeet setup` شامل بررسی‌های موفق
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

OAuth برای ایجاد لینک Meet اختیاری است، چون `googlemeet create` می‌تواند به
خودکارسازی مرورگر fallback کند. وقتی ایجاد از طریق API رسمی، تشخیص فضا، یا
بررسی‌های پیش از اجرای Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک کلاینت OAuth در Google
Cloud بسازید، scopeهای لازم را درخواست کنید، یک حساب Google را مجاز کنید، سپس
refresh token حاصل را در پیکربندی Plugin Google Meet ذخیره کنید یا متغیرهای محیطی
`OPENCLAW_GOOGLE_MEET_*` را ارائه کنید.

OAuth جایگزین مسیر پیوستن Chrome نمی‌شود. انتقال‌های Chrome و Chrome-node همچنان
هنگام استفاده از مشارکت مرورگر، از طریق نمایه Chrome واردشده، BlackHole/SoX، و
Node متصل می‌پیوندند. OAuth فقط برای مسیر رسمی Google Meet API است: ایجاد فضاهای
جلسه، تشخیص فضاها، و اجرای بررسی‌های پیش از اجرای Meet Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژه Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحه رضایت OAuth را پیکربندی کنید.
   - **Internal** برای سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا زمانی که برنامه
     در وضعیت Testing است، هر حساب Google که برنامه را مجاز می‌کند به‌عنوان کاربر
     آزمایشی اضافه کنید.
4. scopeهایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک OAuth client ID ایجاد کنید.
   - نوع برنامه: **Web application**.
   - Authorized redirect URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client ID و client secret را کپی کنید.

`meetings.space.created` برای `spaces.create` در Google Meet لازم است.
`meetings.space.readonly` به OpenClaw امکان می‌دهد URLها/کدهای Meet را به فضاها
تشخیص دهد. `meetings.space.settings` به OpenClaw امکان می‌دهد هنگام ایجاد اتاق از
طریق API، تنظیمات `SpaceConfig` مانند `accessType` را ارسال کند.
`meetings.conference.media.readonly` برای بررسی پیش از اجرا و کار رسانه‌ای Meet
Media API است؛ Google ممکن است برای استفاده واقعی از Media API به ثبت‌نام در
Developer Preview نیاز داشته باشد. اگر فقط به پیوستن‌های مبتنی بر مرورگر Chrome
نیاز دارید، OAuth را کاملا نادیده بگیرید.

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

وقتی نمی‌خواهید refresh token در پیکربندی باشد، متغیرهای محیطی را ترجیح دهید. اگر
هم مقدارهای پیکربندی و هم مقدارهای محیط وجود داشته باشند، Plugin ابتدا پیکربندی
را resolve می‌کند و سپس از fallback محیط استفاده می‌کند.

رضایت OAuth شامل ایجاد فضای Meet، دسترسی خواندن فضای Meet، و دسترسی خواندن رسانه
کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه احراز هویت کرده‌اید، دوباره
`openclaw googlemeet auth login --json` را اجرا کنید تا refresh token دارای scope
`meetings.space.created` باشد.

### بررسی OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون راز می‌خواهید، OAuth doctor را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار runtime مربوط به Chrome را بارگذاری نمی‌کند و به Node متصل Chrome نیاز
ندارد. بررسی می‌کند که پیکربندی OAuth وجود دارد و refresh token می‌تواند access
token صادر کند. گزارش JSON فقط فیلدهای وضعیت مانند `ok`، `configured`،
`tokenSource`، `expiresAt`، و پیام‌های بررسی را شامل می‌شود؛ access token، refresh
token، یا client secret را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنی                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک access token کش‌شده، وجود دارد.       |
| `oauth-token`        | access token کش‌شده هنوز معتبر است، یا refresh token یک access token جدید صادر کرده است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای Meet موجود را resolve کرده است.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای Meet جدید ایجاد کرده است.                               |

برای اثبات فعال بودن Google Meet API و scope مربوط به `spaces.create` نیز، بررسی
ایجاد دارای اثر جانبی را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL یک‌بارمصرف Meet ایجاد می‌کند. وقتی به آن نیاز دارید که تأیید کنید پروژه‌ی Google Cloud، API مربوط به Meet را فعال کرده و حساب مجاز دارای حوزه‌ی `meetings.space.created` است، از آن استفاده کنید.

برای اثبات دسترسی خواندن برای یک فضای جلسه‌ی موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک فضای موجود را که حساب مجاز Google می‌تواند به آن دسترسی داشته باشد اثبات می‌کنند. دریافت `403` از این بررسی‌ها معمولاً یعنی API REST مربوط به Google Meet غیرفعال است، توکن تازه‌سازیِ تأییدشده حوزه‌ی لازم را ندارد، یا حساب Google نمی‌تواند به آن فضای Meet دسترسی داشته باشد. خطای توکن تازه‌سازی یعنی دوباره `openclaw googlemeet auth login
--json` را اجرا کنید و بلوک `oauth` جدید را ذخیره کنید.

برای مسیر جایگزین مرورگر، هیچ اعتبارنامه‌ی OAuth لازم نیست. در آن حالت، احراز هویت Google از نمایه‌ی Chrome واردشده در گره انتخاب‌شده می‌آید، نه از پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان جایگزین پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` یا `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` یا `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` یا
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` یا `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` یا `GOOGLE_MEET_PREVIEW_ACK`

یک URL مربوط به Meet، کد، یا `spaces/{id}` را از طریق `spaces.get` resolve کنید:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

پیش از کار رسانه‌ای، preflight را اجرا کنید:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

پس از اینکه Meet رکوردهای کنفرانس را ایجاد کرد، مصنوعات جلسه و حضور و غیاب را فهرست کنید:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، `artifacts` و `attendance` به‌طور پیش‌فرض از جدیدترین رکورد کنفرانس استفاده می‌کنند. وقتی همه‌ی رکوردهای نگه‌داری‌شده برای آن جلسه را می‌خواهید، `--all-conference-records` را ارسال کنید.

جست‌وجوی Calendar می‌تواند پیش از خواندن مصنوعات Meet، URL جلسه را از Google Calendar resolve کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` تقویم `primary` امروز را برای یک رویداد Calendar دارای پیوند Google Meet جست‌وجو می‌کند. برای جست‌وجوی متن رویداد مطابق، از `--event <query>` و برای تقویم غیر اصلی از `--calendar <id>` استفاده کنید. جست‌وجوی Calendar به ورود OAuth تازه‌ای نیاز دارد که شامل حوزه‌ی فقط‌خواندنی رویدادهای Calendar باشد.
`calendar-events` رویدادهای Meet مطابق را پیش‌نمایش می‌کند و رویدادی را علامت می‌زند که `latest`، `artifacts`، `attendance` یا `export` انتخاب خواهد کرد.

اگر از قبل شناسه‌ی رکورد کنفرانس را می‌دانید، مستقیم به آن ارجاع دهید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

وقتی می‌خواهید اتاق را پس از تماس ببندید، کنفرانس فعال را برای یک فضای ایجادشده با API پایان دهید:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

این دستور `spaces.endActiveConference` در Google Meet را فراخوانی می‌کند و برای فضایی که حساب مجاز می‌تواند مدیریت کند، به OAuth با حوزه‌ی `meetings.space.created` نیاز دارد.
OpenClaw ورودی URL مربوط به Meet، کد جلسه، یا `spaces/{id}` را می‌پذیرد و پیش از پایان دادن به کنفرانس فعال، آن را به منبع فضای API resolve می‌کند.
این از `googlemeet leave` جدا است: `leave` مشارکت محلی/نشستی OpenClaw را متوقف می‌کند، در حالی که `end-active-conference` از Google Meet می‌خواهد کنفرانس فعال آن فضا را پایان دهد.

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

`artifacts` فراداده‌ی رکورد کنفرانس را همراه با فراداده‌ی منابع participant، recording، transcript، structured transcript-entry و smart-note، وقتی Google آن را برای جلسه در دسترس قرار دهد، برمی‌گرداند. برای رد شدن از جست‌وجوی ورودی‌ها در جلسه‌های بزرگ از `--no-transcript-entries` استفاده کنید. `attendance` شرکت‌کنندگان را به ردیف‌های participant-session با زمان‌های اولین/آخرین مشاهده، مدت کل نشست، پرچم‌های تأخیر/خروج زودهنگام، و منابع شرکت‌کننده‌ی تکراری ادغام‌شده بر اساس کاربر واردشده یا نام نمایشی گسترش می‌دهد. برای جدا نگه داشتن منابع خام شرکت‌کننده، `--no-merge-duplicates` را ارسال کنید؛ برای تنظیم تشخیص تأخیر از `--late-after-minutes` و برای تنظیم تشخیص خروج زودهنگام از `--early-before-minutes` استفاده کنید.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`، `transcript.md`، `artifacts.json`، `attendance.json` و `manifest.json` می‌نویسد.
`manifest.json` ورودی انتخاب‌شده، گزینه‌های export، رکوردهای کنفرانس، فایل‌های خروجی، شمارش‌ها، منبع توکن، رویداد Calendar در صورت استفاده، و هرگونه هشدار بازیابی ناقص را ثبت می‌کند. برای نوشتن یک آرشیو قابل‌حمل کنار پوشه نیز `--zip` را ارسال کنید. برای export کردن متن Google Docs متصل به transcript و smart-note از طریق `files.export` در Google Drive، `--include-doc-bodies` را ارسال کنید؛ این به ورود OAuth تازه‌ای نیاز دارد که شامل حوزه‌ی فقط‌خواندنی Drive Meet باشد. بدون `--include-doc-bodies`، exportها فقط شامل فراداده‌ی Meet و ورودی‌های transcript ساخت‌یافته هستند. اگر Google یک شکست جزئی در artifact برگرداند، مانند خطای فهرست‌کردن smart-note، transcript-entry یا document-body در Drive، خلاصه و manifest هشدار را نگه می‌دارند، به‌جای اینکه کل export شکست بخورد.
برای واکشی همان داده‌های artifact/attendance و چاپ JSON مربوط به manifest بدون ایجاد پوشه یا ZIP، از `--dry-run` استفاده کنید. این پیش از نوشتن یک export بزرگ، یا وقتی agent فقط به شمارش‌ها، رکوردهای انتخاب‌شده و هشدارها نیاز دارد، مفید است.

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

برای اینکه فقط manifest مربوط به export برگردد و نوشتن فایل‌ها رد شود، `"dryRun": true` را تنظیم کنید.

Agentها همچنین می‌توانند یک اتاق پشتیبانی‌شده با API را با سیاست دسترسی صریح ایجاد کنند:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
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

برای اعتبارسنجی ابتدا-گوش‌دادن، agentها باید پیش از ادعا درباره‌ی مفید بودن جلسه از `test_listen` استفاده کنند:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

آزمون مقدماتی زنده‌ی محافظت‌شده را در برابر یک جلسه‌ی واقعیِ نگه‌داری‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

کاوش زنده‌ی مرورگر برای ابتدا-گوش‌دادن را در برابر جلسه‌ای اجرا کنید که در آن کسی صحبت خواهد کرد و زیرنویس‌های Meet در دسترس هستند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

محیط آزمون مقدماتی زنده:

- `OPENCLAW_LIVE_TEST=1` آزمون‌های زنده‌ی محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL نگه‌داری‌شده‌ی Meet، کد، یا
  `spaces/{id}` اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه‌ی client مربوط به OAuth را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN` توکن تازه‌سازی را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های جایگزین بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

آزمون مقدماتی زنده‌ی پایه برای artifact/attendance به
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. export بدنه‌ی سند Drive به
`https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای تازه‌ی Meet ایجاد کنید:

```bash
openclaw googlemeet create
```

این دستور `meeting uri` جدید، منبع و نشست پیوستن را چاپ می‌کند. با اعتبارنامه‌های OAuth، از API رسمی Google Meet استفاده می‌کند. بدون اعتبارنامه‌های OAuth، از نمایه‌ی مرورگرِ واردشده در گره Chrome پین‌شده به‌عنوان جایگزین استفاده می‌کند. Agentها می‌توانند با ابزار `google_meet` و `action: "create"` در یک گام ایجاد کنند و بپیوندند. برای ایجاد فقط URL، `"join": false` را ارسال کنید.

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

اگر مسیر جایگزین مرورگر پیش از اینکه بتواند URL را ایجاد کند به ورود Google یا مانع مجوز Meet برسد، روش Gateway یک پاسخ ناموفق برمی‌گرداند و ابزار `google_meet` به‌جای یک رشته‌ی ساده، جزئیات ساخت‌یافته برمی‌گرداند:

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

وقتی یک agent مقدار `manualActionRequired: true` را می‌بیند، باید `manualActionMessage` را به‌همراه زمینه‌ی گره/زبانه‌ی مرورگر گزارش کند و تا زمانی که اپراتور مرحله‌ی مرورگر را کامل نکرده است، از باز کردن زبانه‌های جدید Meet خودداری کند.

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

ایجاد یک Meet به‌طور پیش‌فرض باعث پیوستن می‌شود. ترابری Chrome یا Chrome-node همچنان برای پیوستن از طریق مرورگر به یک نمایه‌ی Google Chrome واردشده نیاز دارد. اگر نمایه خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک خطای مسیر جایگزین مرورگر را گزارش می‌کند و از اپراتور می‌خواهد پیش از تلاش دوباره، ورود به Google را کامل کند.

`preview.enrollmentAcknowledged: true` را فقط پس از تأیید اینکه پروژه‌ی Cloud، اصل OAuth و شرکت‌کنندگان جلسه در Google Workspace Developer Preview Program برای APIهای رسانه‌ای Meet ثبت‌نام شده‌اند تنظیم کنید.

## پیکربندی

مسیر هم‌زمان رایج Chrome فقط به فعال بودن Plugin، BlackHole، SoX و یک کلید ارائه‌دهنده‌ی صدای هم‌زمان backend نیاز دارد. OpenAI پیش‌فرض است؛ برای استفاده از Google Gemini Live مقدار `realtime.provider: "google"` را تنظیم کنید:

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
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحهٔ مهمانِ خارج‌شده از حساب Meet استفاده می‌شود
- `chrome.autoJoin: true`: پر کردن نام مهمان و کلیک روی Join Now به‌صورت بهترین تلاش از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال کردن یک زبانهٔ Meet موجود به‌جای باز کردن موارد تکراری
- `chrome.waitForInCallMs: 20000`: انتظار برای اینکه زبانهٔ Meet قبل از فعال شدن معرفی realtime وضعیت داخل تماس را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت‌دستور. فقط برای جفت‌دستورهای قدیمی/سفارشی که هنوز صدای تلفنی تولید می‌کنند از `"g711-ulaw-8khz"` استفاده کنید.
- `chrome.audioInputCommand`: دستور SoX که از CoreAudio `BlackHole 2ch` می‌خواند و صدا را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: دستور SoX که صدا را در `chrome.audioFormat` می‌خواند و به CoreAudio `BlackHole 2ch` می‌نویسد
- `chrome.bargeInInputCommand`: دستور میکروفون محلی اختیاری که برای تشخیص ورود گفتار انسانی هنگام فعال بودن پخش دستیار، PCM مونو little-endian امضادار ۱۶‌بیتی می‌نویسد. این مورد فعلاً روی پل جفت‌دستور `chrome` میزبانی‌شده توسط Gateway اعمال می‌شود.
- `chrome.bargeInRmsThreshold: 650`: سطح RMS که روی `chrome.bargeInInputCommand` به‌عنوان وقفهٔ انسانی شمرده می‌شود
- `chrome.bargeInPeakThreshold: 2500`: سطح اوج که روی `chrome.bargeInInputCommand` به‌عنوان وقفهٔ انسانی شمرده می‌شود
- `chrome.bargeInCooldownMs: 900`: حداقل تأخیر بین پاک‌سازی‌های تکراری وقفهٔ انسانی
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، همراه با `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی آمادگی گفتاری کوتاه هنگام اتصال پل realtime؛ برای ورود بی‌صدا آن را روی `""` تنظیم کنید
- `realtime.agentId`: شناسهٔ اختیاری عامل OpenClaw برای `openclaw_agent_consult`؛ پیش‌فرض `main` است

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

`voiceCall.enabled` به‌طور پیش‌فرض `true` است؛ با انتقال Twilio، تماس واقعی PSTN، DTMF و خوشامدگویی آغازین را به Plugin تماس صوتی واگذار می‌کند. تماس صوتی پیش از باز کردن جریان رسانهٔ realtime، دنبالهٔ DTMF را پخش می‌کند و سپس متن معرفی ذخیره‌شده را به‌عنوان خوشامدگویی اولیهٔ realtime به‌کار می‌برد. اگر `voice-call` فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را اعتبارسنجی و ثبت کند، اما نمی‌تواند تماس Twilio را برقرار کند.

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

وقتی Chrome روی میزبان Gateway اجرا می‌شود، از `transport: "chrome"` استفاده کنید. وقتی Chrome روی یک node جفت‌شده مانند یک VM Parallels اجرا می‌شود، از `transport: "chrome-node"` استفاده کنید. در هر دو حالت، مدل realtime و `openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا می‌مانند.

برای فهرست کردن نشست‌های فعال یا بررسی یک شناسهٔ نشست، از `action: "status"` استفاده کنید. برای اینکه عامل realtime فوراً صحبت کند، از `action: "speak"` همراه با `sessionId` و `message` استفاده کنید. برای ایجاد یا استفادهٔ دوباره از نشست، فعال کردن یک عبارت شناخته‌شده و برگرداندن سلامت `inCall` وقتی میزبان Chrome بتواند آن را گزارش کند، از `action: "test_speech"` استفاده کنید. `test_speech` همیشه `mode: "realtime"` را اجباری می‌کند و اگر خواسته شود در `mode: "transcribe"` اجرا شود شکست می‌خورد، چون نشست‌های فقط مشاهده عمداً نمی‌توانند گفتار تولید کنند. نتیجهٔ `speechOutputVerified` آن بر پایهٔ افزایش بایت‌های خروجی صوت realtime طی این فراخوانی آزمایشی است، بنابراین یک نشست استفاده‌شدهٔ دوباره با صدای قدیمی‌تر به‌عنوان بررسی گفتار موفق تازه شمرده نمی‌شود. برای علامت‌گذاری پایان نشست از `action: "leave"` استفاده کنید.

`status` در صورت دسترس بودن، سلامت Chrome را شامل می‌شود:

- `inCall`: به‌نظر می‌رسد Chrome داخل تماس Meet باشد
- `micMuted`: وضعیت میکروفون Meet به‌صورت بهترین تلاش
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: نمایهٔ مرورگر پیش از کار کردن گفتار به ورود دستی، پذیرش توسط میزبان Meet، مجوزها یا تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: اینکه آیا گفتار Chrome مدیریت‌شده اکنون مجاز است یا نه. `speechReady: false` یعنی OpenClaw عبارت معرفی/آزمایش را به پل صوتی نفرستاده است.
- `providerConnected` / `realtimeReady`: وضعیت پل صوتی realtime
- `lastInputAt` / `lastOutputAt`: آخرین صدایی که از پل دیده شده یا به پل فرستاده شده است
- `lastSuppressedInputAt` / `suppressedInputBytes`: ورودی loopback که هنگام فعال بودن پخش دستیار نادیده گرفته شده است

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## مشاورهٔ عامل realtime

حالت realtime در Chrome برای یک چرخهٔ صوتی زنده بهینه شده است. ارائه‌دهندهٔ صدای realtime صدای جلسه را می‌شنود و از طریق پل صوتی پیکربندی‌شده صحبت می‌کند. وقتی مدل realtime به استدلال عمیق‌تر، اطلاعات جاری یا ابزارهای عادی OpenClaw نیاز داشته باشد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره عامل عادی OpenClaw را در پشت صحنه با زمینهٔ رونوشت اخیر جلسه اجرا می‌کند و یک پاسخ گفتاری کوتاه به نشست صوتی realtime برمی‌گرداند. سپس مدل صوتی می‌تواند آن پاسخ را در جلسه بیان کند. این ابزار از همان ابزار مشترک مشاورهٔ realtime استفاده می‌کند که تماس صوتی هم از آن استفاده می‌کند.

به‌طور پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید با فضای کاری اختصاصی عامل OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار، حافظه و تاریخچهٔ نشست مشورت کند، `realtime.agentId` را تنظیم کنید.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در دسترس قرار می‌دهد و عامل عادی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search` و `memory_get` محدود می‌کند.
- `owner`: ابزار مشاوره را در دسترس قرار می‌دهد و اجازه می‌دهد عامل عادی از سیاست ابزار معمول عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صوتی realtime قرار نمی‌دهد.

کلید نشست مشاوره برای هر نشست Meet محدود می‌شود، بنابراین فراخوانی‌های مشاورهٔ بعدی می‌توانند طی همان جلسه از زمینهٔ قبلی مشاوره استفاده کنند.

برای اجبار یک بررسی آمادگی گفتاری پس از اینکه Chrome کاملاً وارد تماس شد:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای smoke کاملِ ورود و صحبت:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## فهرست بررسی آزمون زنده

پیش از سپردن جلسه به یک عامل بدون نظارت، از این دنباله استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت مورد انتظار Chrome-node:

- `googlemeet setup` همگی سبز است.
- وقتی Chrome-node انتقال پیش‌فرض است یا یک node سنجاق شده است، `googlemeet setup` شامل `chrome-node-connected` می‌شود.
- `nodes status` نشان می‌دهد node انتخاب‌شده متصل است.
- node انتخاب‌شده هر دو مورد `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- زبانهٔ Meet وارد تماس می‌شود و `test-speech` سلامت Chrome را با `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome راه‌دور مانند VM macOS در Parallels، این کوتاه‌ترین بررسی امن پس از به‌روزرسانی Gateway یا VM است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند که Plugin مربوط به Gateway بارگذاری شده، node مربوط به VM با توکن فعلی متصل است و پل صوتی Meet پیش از اینکه یک عامل زبانهٔ جلسهٔ واقعی را باز کند در دسترس است.

برای smoke مربوط به Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را ارائه می‌دهد:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin`، `twilio-voice-call-credentials` و `twilio-voice-call-webhook` است.
- `voicecall` پس از بارگذاری دوبارهٔ Gateway در CLI در دسترس است.
- نشست برگشتی `transport: "twilio"` و یک `twilio.voiceCallId` دارد.
- `openclaw logs --follow` نشان می‌دهد TwiML مربوط به DTMF پیش از TwiML مربوط به realtime ارائه شده، سپس یک پل realtime با خوشامدگویی اولیه در صف قرار گرفته است.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر همین حالا `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را راه‌اندازی دوباره یا دوباره بارگذاری کنید. عامل در حال اجرا فقط ابزارهای Plugin ثبت‌شده توسط فرایند فعلی Gateway را می‌بیند.

روی میزبان‌های Gateway غیر از macOS، ابزار عامل‌محور `google_meet` همچنان قابل مشاهده می‌ماند، اما کنش‌های realtime محلی Chrome پیش از رسیدن به پل صوتی مسدود می‌شوند. صدای realtime محلی Chrome فعلاً به `BlackHole 2ch` در macOS وابسته است، بنابراین عامل‌های Linux باید به‌جای مسیر پیش‌فرض realtime محلی Chrome از `mode: "transcribe"`، شماره‌گیری Twilio، یا یک میزبان `chrome-node` در macOS استفاده کنند.

### هیچ node متصلِ سازگار با Google Meet وجود ندارد

روی میزبان node اجرا کنید:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

روی میزبان Gateway، node را تأیید کنید و دستورها را بررسی کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node باید متصل باشد و `googlemeet.chrome` به‌علاوهٔ `browser.proxy` را فهرست کند. پیکربندی Gateway باید این دستورهای node را مجاز کند:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

اگر `googlemeet setup` در `chrome-node-connected` شکست می‌خورد یا گزارش Gateway پیام `gateway token mismatch` را نشان می‌دهد، node را با توکن فعلی Gateway دوباره نصب یا راه‌اندازی دوباره کنید. برای یک Gateway روی LAN، این معمولاً یعنی:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

سپس سرویس node را دوباره بارگذاری کنید و دوباره اجرا کنید:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### مرورگر باز می‌شود اما عامل نمی‌تواند وارد شود

برای ورودهای فقط مشاهده از `googlemeet test-listen` یا برای ورودهای realtime از `googlemeet test-speech` استفاده کنید، سپس سلامت Chrome برگشتی را بررسی کنید. اگر هرکدام از probeها `manualActionRequired: true` گزارش کرد، `manualActionMessage` را به operator نشان دهید و تا کامل شدن کنش مرورگر، تلاش دوباره را متوقف کنید.

کنش‌های دستی رایج:

- به نمایهٔ Chrome وارد شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی اعلان مجوز بومی Chrome ظاهر می‌شود، مجوزهای میکروفون/دوربین Chrome را اعطا کنید.
- یک گفت‌وگوی مجوز Meet گیرکرده را ببندید یا تعمیر کنید.

اگر Meet پیام «آیا می‌خواهید افراد صدای شما را در جلسه بشنوند؟» را نشان می‌دهد، فقط به همین دلیل «وارد نشده‌اید» گزارش نکنید. این صفحهٔ میانی انتخاب صدا در Meet است؛ OpenClaw وقتی در دسترس باشد، از طریق خودکارسازی مرورگر روی **استفاده از میکروفون** کلیک می‌کند و همچنان منتظر وضعیت واقعی جلسه می‌ماند. برای جایگزین مرورگر فقط-ایجاد، OpenClaw ممکن است روی **ادامه بدون میکروفون** کلیک کند، چون ایجاد URL به مسیر صوتی realtime نیاز ندارد.

### ایجاد جلسه شکست می‌خورد

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند، از endpoint
`spaces.create` در Google Meet API استفاده می‌کند. بدون اعتبارنامه‌های OAuth، به مرورگر pinned Chrome node برمی‌گردد. بررسی کنید:

- برای ایجاد از طریق API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند،
  یا متغیرهای محیطی مطابق `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ایجاد از طریق API: refresh token پس از افزوده شدن پشتیبانی ایجاد صادر شده باشد.
  tokenهای قدیمی‌تر ممکن است scope مربوط به `meetings.space.created` را نداشته باشند؛
  `openclaw googlemeet auth login --json` را دوباره اجرا کنید و پیکربندی plugin را به‌روزرسانی کنید.
- برای جایگزین مرورگر: `defaultTransport: "chrome-node"` و
  `chromeNode.node` به node متصل با `browser.proxy` و
  `googlemeet.chrome` اشاره کنند.
- برای جایگزین مرورگر: نمایهٔ Chrome مربوط به OpenClaw روی آن node به Google وارد شده باشد
  و بتواند `https://meet.google.com/new` را باز کند.
- برای جایگزین مرورگر: تلاش‌های مجدد قبل از باز کردن زبانهٔ جدید، از زبانهٔ موجود
  `https://meet.google.com/new` یا prompt حساب Google استفاده می‌کنند. اگر یک agent timeout شد،
  به‌جای اینکه دستی زبانهٔ Meet دیگری باز کنید، فراخوانی ابزار را دوباره امتحان کنید.
- برای جایگزین مرورگر: اگر ابزار `manualActionRequired: true` برگرداند، از
  `browser.nodeId`، `browser.targetId`، `browserUrl` و
  `manualActionMessage` برگشتی برای راهنمایی operator استفاده کنید. تا زمانی که آن
  اقدام کامل نشده است، در یک حلقه دوباره امتحان نکنید.
- برای جایگزین مرورگر: اگر Meet پیام «آیا می‌خواهید افراد صدای شما را در جلسه
  بشنوند؟» را نشان می‌دهد، زبانه را باز نگه دارید. OpenClaw باید از طریق خودکارسازی
  مرورگر روی **استفاده از میکروفون** یا، برای جایگزین فقط-ایجاد، روی **ادامه بدون میکروفون**
  کلیک کند و به انتظار برای URL تولیدشدهٔ Meet ادامه دهد. اگر نتواند، خطا باید
  `meet-audio-choice-required` را ذکر کند، نه `google-login-required`.

### Agent وارد می‌شود اما صحبت نمی‌کند

مسیر realtime را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای گوش دادن/پاسخ گفتاری از `mode: "realtime"` استفاده کنید. `mode: "transcribe"` عمدا
پل صوتی realtime دوطرفه را شروع نمی‌کند. برای اشکال‌زدایی فقط-مشاهده،
پس از صحبت participants فرمان `openclaw googlemeet status --json <session-id>` را اجرا کنید
و `captioning`، `transcriptLines` و `lastCaptionText` را بررسی کنید. اگر `inCall`
برابر `true` است اما `transcriptLines` روی `0` می‌ماند، ممکن است captions در Meet
غیرفعال باشند، از زمان نصب observer کسی صحبت نکرده باشد، UI مربوط به Meet تغییر کرده باشد،
یا live captions برای زبان/حساب جلسه در دسترس نباشند.

`googlemeet test-speech` همیشه مسیر realtime را بررسی می‌کند و گزارش می‌دهد که آیا
برای آن invocation، byteهای خروجی bridge مشاهده شده‌اند یا نه. اگر `speechOutputVerified` false باشد و
`speechOutputTimedOut` true باشد، provider بلادرنگ ممکن است utterance را پذیرفته باشد،
اما OpenClaw ندیده باشد byteهای خروجی جدید به پل صوتی Chrome برسند.

همچنین بررسی کنید:

- یک کلید provider بلادرنگ روی میزبان Gateway در دسترس باشد، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده باشد.
- `sox` روی میزبان Chrome وجود داشته باشد.
- میکروفون و speaker مربوط به Meet از مسیر صوتی مجازی مورد استفادهٔ
  OpenClaw عبور داده شده باشند.

`googlemeet doctor [session-id]` session، node، وضعیت in-call،
دلیل اقدام دستی، اتصال provider بلادرنگ، `realtimeReady`، فعالیت
ورودی/خروجی صدا، آخرین timestampهای صدا، شمارنده‌های byte و URL مرورگر را چاپ می‌کند.
وقتی به JSON خام نیاز دارید از `googlemeet status [session-id] --json` استفاده کنید. وقتی
می‌خواهید Google Meet OAuth refresh را بدون افشای tokenها بررسی کنید، از
`googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API هم نیاز دارید،
`--meeting` یا `--create-space` را اضافه کنید.

اگر یک agent timeout شد و می‌توانید ببینید که زبانهٔ Meet از قبل باز است، آن زبانه را
بدون باز کردن زبانهٔ دیگر بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

اقدام ابزار معادل `recover_current_tab` است. این اقدام برای transport انتخاب‌شده، یک
زبانهٔ موجود Meet را focus و inspect می‌کند. با `chrome`، از کنترل مرورگر محلی از طریق
Gateway استفاده می‌کند؛ با `chrome-node`، از node پیکربندی‌شدهٔ Chrome استفاده می‌کند.
زبانهٔ جدید باز نمی‌کند یا session جدید نمی‌سازد؛ blocker فعلی را گزارش می‌دهد، مانند
login، admission، permissions یا وضعیت audio-choice. فرمان CLI با Gateway پیکربندی‌شده
صحبت می‌کند، بنابراین Gateway باید در حال اجرا باشد؛ `chrome-node` همچنین نیاز دارد
node مربوط به Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

`twilio-voice-call-plugin` وقتی `voice-call` مجاز یا فعال نباشد شکست می‌خورد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید و
Gateway را reload کنید.

`twilio-voice-call-credentials` وقتی backend مربوط به Twilio فاقد account
SID، auth token یا caller number باشد شکست می‌خورد. این‌ها را روی میزبان Gateway تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` وقتی `voice-call` هیچ نمایش Webhook عمومی ندارد،
یا وقتی `publicUrl` به loopback یا فضای شبکهٔ خصوصی اشاره می‌کند، شکست می‌خورد.
`plugins.entries.voice-call.config.publicUrl` را روی URL عمومی provider تنظیم کنید یا
یک tunnel/Tailscale exposure برای `voice-call` پیکربندی کنید.

URLهای loopback و خصوصی برای callbackهای carrier معتبر نیستند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`,
`192.168.x`، `169.254.x`، `fc00::/7` یا `fd00::/8` به‌عنوان `publicUrl` استفاده نکنید.

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

برای توسعهٔ محلی، به‌جای URL میزبان خصوصی از یک tunnel یا Tailscale exposure استفاده کنید:

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

`voicecall smoke` به‌صورت پیش‌فرض فقط readiness را بررسی می‌کند. برای dry-run یک شمارهٔ مشخص:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط وقتی `--yes` را اضافه کنید که عمدا می‌خواهید یک تماس notify خروجی زنده برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید event مربوط به Meet جزئیات phone dial-in را expose می‌کند. شمارهٔ dial-in
و PIN دقیق یا یک توالی DTMF سفارشی را پاس بدهید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر provider قبل از وارد کردن PIN به pause نیاز دارد، در `--dtmf-sequence` از `w` ابتدایی
یا comma استفاده کنید.

اگر تماس تلفنی ایجاد می‌شود اما roster مربوط به Meet هرگز participant شماره‌گیری‌شده را نشان نمی‌دهد:

- `openclaw googlemeet doctor <session-id>` را اجرا کنید تا call ID واگذارشدهٔ Twilio،
  اینکه DTMF در صف قرار گرفته یا نه، و اینکه intro greeting درخواست شده یا نه را تأیید کنید.
- `openclaw voicecall status --call-id <id>` را اجرا کنید و تأیید کنید تماس هنوز
  active است.
- `openclaw voicecall tail` را اجرا کنید و بررسی کنید Webhookهای Twilio به
  Gateway می‌رسند.
- `openclaw logs --follow` را اجرا کنید و به دنبال توالی Twilio Meet بگردید: Google
  Meet join را delegate می‌کند، Voice Call بخش تلفنی را شروع می‌کند، Google Meet به مدت
  `voiceCall.dtmfDelayMs` منتظر می‌ماند، DTMF را با `voicecall.dtmf` می‌فرستد، به مدت
  `voiceCall.postDtmfSpeechDelayMs` منتظر می‌ماند، سپس intro speech را با
  `voicecall.speak` درخواست می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ یک setup check سبز
  لازم است اما ثابت نمی‌کند توالی PIN جلسه درست است.
- تأیید کنید شمارهٔ dial-in متعلق به همان دعوت‌نامه و region مربوط به Meet است که
  PIN هم به آن تعلق دارد.
- اگر Meet دیر پاسخ می‌دهد یا transcript تماس پس از ارسال DTMF همچنان prompt درخواست
  PIN را نشان می‌دهد، `voiceCall.dtmfDelayMs` را افزایش دهید.
- اگر participant وارد می‌شود اما greeting را نمی‌شنوید، `openclaw logs --follow` را برای
  درخواست post-DTMF `voicecall.speak` و پخش TTS از طریق media-stream یا fallback
  `<Say>` مربوط به Twilio بررسی کنید. اگر transcript تماس همچنان شامل «enter the meeting PIN» است،
  بخش تلفنی هنوز به اتاق Meet وارد نشده است، بنابراین participants جلسه گفتار را نخواهند شنید.

اگر Webhookها نمی‌رسند، ابتدا Voice Call plugin را اشکال‌زدایی کنید: provider باید به
`plugins.entries.voice-call.config.publicUrl` یا tunnel پیکربندی‌شده دسترسی داشته باشد.
[عیب‌یابی voice call](/fa/plugins/voice-call#troubleshooting) را ببینید.

## یادداشت‌ها

media API رسمی Google Meet دریافت‌محور است، بنابراین صحبت کردن در تماس Meet
همچنان به مسیر participant نیاز دارد. این plugin آن مرز را آشکار نگه می‌دارد:
Chrome مشارکت مرورگر و مسیریابی صوتی محلی را انجام می‌دهد؛ Twilio مشارکت
phone dial-in را انجام می‌دهد.

حالت realtime در Chrome به `BlackHole 2ch` به‌علاوهٔ یکی از موارد زیر نیاز دارد:

- `chrome.audioInputCommand` به‌علاوهٔ `chrome.audioOutputCommand`: OpenClaw مالک
  پل مدل realtime است و صدا را در `chrome.audioFormat` بین آن commandها و provider
  صوتی realtime انتخاب‌شده pipe می‌کند. مسیر پیش‌فرض Chrome برابر PCM16 با 24 kHz است؛
  G.711 mu-law با 8 kHz برای command pairهای legacy همچنان در دسترس است.
- `chrome.audioBridgeCommand`: یک command پل خارجی مالک کل مسیر صوتی محلی است
  و باید پس از شروع یا اعتبارسنجی daemon خود خارج شود.

برای صدای duplex تمیز، خروجی Meet و میکروفون Meet را از دستگاه‌های مجازی جداگانه
یا یک گراف دستگاه مجازی به سبک Loopback عبور دهید. یک دستگاه BlackHole مشترک واحد
می‌تواند صدای دیگر participants را دوباره به تماس echo کند.

با command-pair Chrome bridge، `chrome.bargeInInputCommand` می‌تواند به یک میکروفون
محلی جداگانه گوش دهد و وقتی انسان شروع به صحبت می‌کند، پخش assistant را پاک کند.
این باعث می‌شود گفتار انسان جلوتر از خروجی assistant قرار بگیرد، حتی وقتی ورودی
loopback مشترک BlackHole هنگام پخش assistant موقتا suppressed شده باشد.
مانند `chrome.audioInputCommand` و `chrome.audioOutputCommand`، این یک
command محلی پیکربندی‌شده توسط operator است. از یک مسیر command یا فهرست argument
صریح و قابل اعتماد استفاده کنید و آن را به scriptهای مکان‌های غیرقابل اعتماد اشاره ندهید.

`googlemeet speak` پل صوتی realtime فعال را برای یک session Chrome trigger می‌کند.
`googlemeet leave` آن bridge را متوقف می‌کند. برای sessionهای Twilio که از طریق
Voice Call plugin delegate شده‌اند، `leave` همچنین تماس صوتی زیربنایی را hang up می‌کند.
وقتی می‌خواهید conference فعال Google Meet را هم برای یک space مدیریت‌شده با API ببندید،
از `googlemeet end-active-conference` استفاده کنید.

## مرتبط

- [Voice call plugin](/fa/plugins/voice-call)
- [حالت Talk](/fa/nodes/talk)
- [ساختن pluginها](/fa/plugins/building-plugins)
