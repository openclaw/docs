---
read_when:
    - می‌خواهید یک عامل OpenClaw به یک تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - در حال پیکربندی Chrome، Chrome Node یا Twilio به‌عنوان ترابری Google Meet هستید
summary: 'Plugin Google Meet: پیوستن به URLهای صریح Meet از طریق Chrome یا Twilio با پیش‌فرض‌های پاسخ‌گویی عامل'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T07:06:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet از شرکت‌کنندگان برای OpenClaw پشتیبانی می‌کند — این Plugin عمداً صریح طراحی شده است:

- فقط به یک URL صریح `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید بسازد، سپس به URL
  بازگردانده‌شده بپیوندد.
- `agent` حالت پیش‌فرض پاسخ‌گویی گفتاری است: رونویسی بلادرنگ گوش می‌دهد،
  عامل پیکربندی‌شده OpenClaw پاسخ می‌دهد، و TTS معمول OpenClaw داخل Meet صحبت می‌کند.
- `bidi` همچنان به‌عنوان حالت جایگزین مدل صدای بلادرنگ مستقیم در دسترس می‌ماند.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: از `agent` برای گوش‌دادن/پاسخ‌گویی
  زنده، از `bidi` برای جایگزین صدای بلادرنگ مستقیم، یا از `transcribe`
  برای پیوستن/کنترل مرورگر بدون پل پاسخ‌گویی گفتاری استفاده کنید.
- احراز هویت با OAuth شخصی Google یا یک نمایه Chrome که از قبل وارد شده است شروع می‌شود.
- اعلام رضایت خودکار وجود ندارد.
- پشتوانه صوتی پیش‌فرض Chrome برابر `BlackHole 2ch` است.
- Chrome می‌تواند محلی یا روی یک میزبان گره جفت‌شده اجرا شود.
- Twilio یک شماره تماس ورودی به‌همراه PIN اختیاری یا دنباله DTMF را می‌پذیرد؛
  نمی‌تواند مستقیماً با یک URL مربوط به Meet تماس بگیرد.
- فرمان CLI برابر `googlemeet` است؛ `meet` برای جریان‌های کاری گسترده‌تر
  کنفرانس تلفنی عامل رزرو شده است.

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
Homebrew پیش از آنکه macOS دستگاه را آشکار کند، به راه‌اندازی مجدد نیاز دارد:

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
نمایه Chrome، تثبیت گره، و برای پیوستن‌های بلادرنگ Chrome، پل صوتی
BlackHole/SoX و بررسی‌های معرفی بلادرنگِ با تأخیر را گزارش می‌کند. برای
پیوستن‌های فقط مشاهده، همان انتقال را با `--mode transcribe` بررسی کنید؛
آن حالت پیش‌نیازهای صوتی بلادرنگ را رد می‌کند، چون از طریق پل گوش نمی‌دهد
یا صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی تفویض Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌کند که آیا
Plugin `voice-call`، اعتبارنامه‌های Twilio، و دسترس‌پذیری عمومی Webhook آماده‌اند یا نه.
هر بررسی `ok: false` را پیش از درخواست از عامل برای پیوستن، برای انتقال و حالت
بررسی‌شده یک مانع در نظر بگیرید. برای اسکریپت‌ها یا خروجی قابل خواندن توسط ماشین
از `openclaw googlemeet setup --json` استفاده کنید. برای پیش‌بررسی یک انتقال مشخص
پیش از تلاش عامل، از `--transport chrome`، `--transport chrome-node`، یا
`--transport twilio` استفاده کنید.

برای Twilio، وقتی انتقال پیش‌فرض Chrome است، همیشه انتقال را صریحاً پیش‌بررسی کنید:

```bash
openclaw googlemeet setup --transport twilio
```

این کار سیم‌کشی گمشده `voice-call`، اعتبارنامه‌های Twilio، یا دسترس‌پذیری
غیرقابل دسترس Webhook را پیش از تلاش عامل برای شماره‌گیری جلسه پیدا می‌کند.

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

ابزار روبه‌روی عامل `google_meet` روی میزبان‌های غیر macOS برای جریان‌های
مصنوع، تقویم، راه‌اندازی، رونویسی، Twilio، و `chrome-node` در دسترس می‌ماند.
اقدام‌های پاسخ‌گویی گفتاری Chrome محلی در آنجا مسدود می‌شوند، چون مسیر صوتی
Chrome همراه فعلاً به `BlackHole 2ch` در macOS وابسته است. روی Linux، برای
مشارکت پاسخ‌گویی گفتاری Chrome از `mode: "transcribe"`، تماس ورودی Twilio،
یا یک میزبان macOS `chrome-node` استفاده کنید.

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

`OPEN` اجازه می‌دهد هر کسی با URL مربوط به Meet بدون درزدن بپیوندد. `TRUSTED`
به کاربران مورد اعتماد سازمان میزبان، کاربران خارجی دعوت‌شده، و کاربران تماس ورودی
اجازه می‌دهد بدون درزدن بپیوندند. `RESTRICTED` ورود بدون‌درزدن را به دعوت‌شده‌ها
محدود می‌کند. این تنظیمات فقط بر مسیر رسمی ساخت با Google Meet API اعمال می‌شوند،
پس اعتبارنامه‌های OAuth باید پیکربندی شده باشند.

اگر پیش از در دسترس بودن این گزینه Google Meet را احراز هویت کرده‌اید، پس از افزودن
دامنه `meetings.space.settings` به صفحه رضایت Google OAuth خود، دوباره
`openclaw googlemeet auth login --json` را اجرا کنید.

فقط URL را بدون پیوستن بسازید:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` دو مسیر دارد:

- ساخت با API: وقتی اعتبارنامه‌های OAuth مربوط به Google Meet پیکربندی شده باشند استفاده می‌شود. این
  قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- جایگزین مرورگر: وقتی اعتبارنامه‌های OAuth وجود نداشته باشند استفاده می‌شود. OpenClaw از گره
  Chrome تثبیت‌شده استفاده می‌کند، `https://meet.google.com/new` را باز می‌کند، منتظر می‌ماند Google به
  یک URL واقعی با کد جلسه هدایت کند، سپس آن URL را برمی‌گرداند. این مسیر نیاز دارد
  نمایه Chrome مربوط به OpenClaw روی گره از قبل وارد Google شده باشد.
  خودکارسازی مرورگر اعلان میکروفون اجرای نخست خود Meet را مدیریت می‌کند؛ آن اعلان
  به‌عنوان شکست ورود Google در نظر گرفته نمی‌شود.
  جریان‌های پیوستن و ساخت همچنین تلاش می‌کنند پیش از باز کردن یک زبانه جدید، از یک
  زبانه موجود Meet دوباره استفاده کنند. تطبیق، رشته‌های پرس‌وجوی بی‌ضرر URL مانند `authuser`
  را نادیده می‌گیرد، بنابراین تلاش دوباره عامل باید به‌جای ساخت یک زبانه دوم
  Chrome، جلسه‌ای را که از قبل باز است در کانون قرار دهد.

خروجی فرمان/ابزار شامل یک فیلد `source` است (`api` یا `browser`) تا عامل‌ها
بتوانند توضیح دهند کدام مسیر استفاده شده است. `create` به‌طور پیش‌فرض به جلسه جدید
می‌پیوندد و `joined: true` به‌همراه نشست پیوستن را برمی‌گرداند. برای فقط ضرب‌کردن URL،
در CLI از `create --no-join` استفاده کنید یا `"join": false` را به ابزار بدهید.

یا به یک عامل بگویید: «یک Google Meet بساز، با حالت پاسخ‌گویی گفتاری عامل به آن بپیوند،
و پیوند را برایم بفرست.» عامل باید `google_meet` را با
`action: "create"` فراخوانی کند و سپس `meetingUri` بازگردانده‌شده را به اشتراک بگذارد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

برای پیوستن فقط مشاهده/کنترل مرورگر، `"mode": "transcribe"` را تنظیم کنید. این کار
پل صدای بلادرنگ دوطرفه را شروع نمی‌کند، به BlackHole یا SoX نیاز ندارد،
و در جلسه پاسخ گفتاری نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از اعطای
مجوز میکروفون/دوربین OpenClaw و مسیر **استفاده از میکروفون** در Meet پرهیز می‌کنند.
اگر Meet یک میان‌پرده انتخاب صدا نشان دهد، خودکارسازی مسیر بدون میکروفون را امتحان می‌کند
و در غیر این صورت به‌جای باز کردن میکروفون محلی، یک اقدام دستی را گزارش می‌کند.
در حالت رونویسی، انتقال‌های مدیریت‌شده Chrome همچنین یک مشاهده‌گر زیرنویس Meet
به‌صورت بهترین تلاش نصب می‌کنند. `googlemeet status --json` و
`googlemeet doctor` موارد `captioning`، `captionsEnabledAttempted`،
`transcriptLines`، `lastCaptionAt`، `lastCaptionSpeaker`، `lastCaptionText`،
و یک دنباله کوتاه `recentTranscript` را نشان می‌دهند تا اپراتورها بتوانند بفهمند
مرورگر به تماس پیوسته است یا نه و آیا زیرنویس‌های Meet متن تولید می‌کنند یا نه.
وقتی به یک بررسی بله/خیر نیاز دارید، از `openclaw googlemeet test-listen <meet-url> --transport chrome-node`
استفاده کنید: این فرمان در حالت رونویسی می‌پیوندد، منتظر حرکت تازه زیرنویس یا رونویسی می‌ماند،
و `listenVerified`، `listenTimedOut`، فیلدهای اقدام دستی، و آخرین وضعیت سلامت زیرنویس را
برمی‌گرداند.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` سلامت مرورگر و پل صوتی مانند
`inCall`، `manualActionRequired`، `providerConnected`،
`realtimeReady`، `audioInputActive`، `audioOutputActive`، آخرین مُهرهای زمانی
ورودی/خروجی، شمارنده‌های بایت، و وضعیت بسته‌شدن پل را شامل می‌شود. اگر یک اعلان
ایمن صفحه Meet ظاهر شود، خودکارسازی مرورگر تا جایی که بتواند آن را مدیریت می‌کند.
اعلان‌های ورود، پذیرش میزبان، و مجوز مرورگر/سیستم‌عامل به‌عنوان اقدام دستی با دلیل
و پیام برای انتقال توسط عامل گزارش می‌شوند. نشست‌های مدیریت‌شده Chrome فقط پس از آنکه
سلامت مرورگر `inCall: true` را گزارش کند، عبارت معرفی یا آزمون را منتشر می‌کنند؛
در غیر این صورت وضعیت `speechReady: false` را گزارش می‌کند و تلاش گفتار به‌جای
وانمود کردن اینکه عامل داخل جلسه صحبت کرده است، مسدود می‌شود.

پیوستن‌های Chrome محلی از طریق نمایه مرورگر OpenClaw که وارد شده است انجام می‌شوند.
حالت بلادرنگ برای مسیر میکروفون/بلندگوی مورد استفاده OpenClaw به `BlackHole 2ch`
نیاز دارد. برای صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا یک گراف به سبک
Loopback استفاده کنید؛ یک دستگاه BlackHole برای نخستین آزمون دود کافی است اما ممکن
است اکو ایجاد کند.

### Gateway محلی + Chrome در Parallels

فقط برای اینکه VM مالک Chrome باشد، به یک OpenClaw Gateway کامل یا کلید API مدل
داخل VM macOS نیاز ندارید. Gateway و عامل را محلی اجرا کنید، سپس یک میزبان گره
در VM اجرا کنید. Plugin همراه را یک‌بار روی VM فعال کنید تا گره فرمان Chrome را
اعلان کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهنده
  بلادرنگ، و پیکربندی Plugin مربوط به Google Meet.
- VM macOS در Parallels: OpenClaw CLI/میزبان گره، Google Chrome، SoX، BlackHole 2ch،
  و یک نمایه Chrome که وارد Google شده است.
- در VM لازم نیست: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا راه‌اندازی
  ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را راه‌اندازی مجدد کنید تا macOS دستگاه `BlackHole 2ch`
را آشکار کند:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، بررسی کنید که VM می‌تواند دستگاه صوتی و فرمان‌های SoX را ببیند:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

OpenClaw را در VM نصب یا به‌روزرسانی کنید، سپس Plugin همراه را آنجا فعال کنید:

```bash
openclaw plugins enable google-meet
```

میزبان گره را در VM شروع کنید:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP در LAN است و از TLS استفاده نمی‌کنید، گره WebSocket
متنی ساده را رد می‌کند مگر اینکه برای آن شبکه خصوصی مورد اعتماد اعلام موافقت کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

هنگام نصب گره به‌عنوان LaunchAgent از همان متغیر محیطی استفاده کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` محیط فرایند است، نه یک تنظیم
`openclaw.json`. وقتی `openclaw node install` این مقدار را در فرمان نصب حاضر ببیند،
آن را در محیط LaunchAgent ذخیره می‌کند.

گره را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید Gateway گره را می‌بیند و گره هم `googlemeet.chrome` و هم قابلیت
مرورگر/`browser.proxy` را اعلان می‌کند:

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

یا از عامل بخواهید از ابزار `google_meet` با `transport: "chrome-node"` استفاده کند.

برای یک آزمون دود تک‌فرمانی که یک نشست را می‌سازد یا دوباره استفاده می‌کند، یک عبارت
شناخته‌شده را می‌گوید، و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

هنگام پیوستن بلادرنگ، اتوماسیون مرورگر OpenClaw نام مهمان را پر می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان نخستین اجرای Meet برای گزینهٔ
"Use microphone" ظاهر شود، آن را می‌پذیرد. هنگام پیوستن فقط برای مشاهده یا
ایجاد جلسه فقط با مرورگر، وقتی همان گزینه در دسترس باشد، بدون میکروفون از همان
اعلان عبور می‌کند. اگر نمایهٔ مرورگر وارد نشده باشد، Meet منتظر پذیرش میزبان
باشد، Chrome برای پیوستن بلادرنگ به مجوز میکروفون/دوربین نیاز داشته باشد، یا
Meet روی اعلانی گیر کرده باشد که اتوماسیون نتوانسته حل کند، نتیجهٔ
join/test-speech مقدار `manualActionRequired: true` را همراه با
`manualActionReason` و `manualActionMessage` گزارش می‌کند. عامل‌ها باید تلاش
دوباره برای پیوستن را متوقف کنند، همان پیام دقیق را به‌همراه `browserUrl`/
`browserTitle` فعلی گزارش کنند، و فقط پس از کامل شدن اقدام دستی در مرورگر
دوباره تلاش کنند.

اگر `chromeNode.node` حذف شده باشد، OpenClaw فقط وقتی به‌صورت خودکار انتخاب
می‌کند که دقیقاً یک گرهٔ متصل هم `googlemeet.chrome` و هم کنترل مرورگر را
اعلام کرده باشد. اگر چند گرهٔ توانمند متصل باشند، `chromeNode.node` را روی
شناسهٔ گره، نام نمایشی، یا IP راه‌دور تنظیم کنید.

بررسی‌های رایج شکست:

- `Configured Google Meet node ... is not usable: offline`: گرهٔ پین‌شده برای
  Gateway شناخته شده است اما در دسترس نیست. عامل‌ها باید با آن گره به‌عنوان
  وضعیت عیب‌یابی رفتار کنند، نه میزبان Chrome قابل استفاده، و به‌جای برگشت به
  انتقال دیگر، مانع راه‌اندازی را گزارش کنند مگر اینکه کاربر چنین چیزی خواسته
  باشد.
- `No connected Google Meet-capable node`: در VM دستور `openclaw node run` را
  اجرا کنید، جفت‌سازی را تأیید کنید، و مطمئن شوید `openclaw plugins enable google-meet`
  و `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تأیید کنید
  میزبان Gateway هر دو فرمان گره را با
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` مجاز
  کرده است.
- `BlackHole 2ch audio device not found`: روی میزبانی که بررسی می‌شود
  `blackhole-2ch` را نصب کنید و پیش از استفاده از صوت Chrome محلی بازراه‌اندازی
  کنید.
- `BlackHole 2ch audio device not found on the node`: در VM مقدار
  `blackhole-2ch` را نصب کنید و VM را بازراه‌اندازی کنید.
- Chrome باز می‌شود اما نمی‌تواند بپیوندد: داخل VM وارد نمایهٔ مرورگر شوید، یا
  برای پیوستن مهمان `chrome.guestName` را تنظیم نگه دارید. پیوستن خودکار مهمان
  از اتوماسیون مرورگر OpenClaw از طریق پراکسی مرورگر گره استفاده می‌کند؛
  مطمئن شوید پیکربندی مرورگر گره به نمایه‌ای اشاره می‌کند که می‌خواهید، برای
  مثال `browser.defaultProfile: "user"` یا یک نمایهٔ نشست موجود با نام.
- تب‌های تکراری Meet: گزینهٔ `chrome.reuseExistingTab: true` را فعال بگذارید.
  OpenClaw پیش از باز کردن تب جدید، تب موجود برای همان URL مربوط به Meet را
  فعال می‌کند، و ایجاد جلسه در مرورگر پیش از باز کردن تب دیگر، از تب در حال
  انجام `https://meet.google.com/new` یا اعلان حساب Google دوباره استفاده
  می‌کند.
- نبود صدا: در Meet، میکروفون/بلندگو را از مسیر دستگاه صوتی مجازی مورد استفادهٔ
  OpenClaw عبور دهید؛ برای صدای دوطرفهٔ تمیز از دستگاه‌های مجازی جداگانه یا
  مسیریابی به سبک Loopback استفاده کنید.

## یادداشت‌های نصب

پیش‌فرض پاسخ‌گویی صوتی Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin از فرمان‌های صریح دستگاه CoreAudio برای
  پل صوتی پیش‌فرض 24 kHz PCM16 استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این ابزار دستگاه صوتی
  `BlackHole 2ch` را ایجاد می‌کند که Chrome/Meet می‌تواند از طریق آن مسیریابی
  شود.

OpenClaw هیچ‌کدام از این بسته‌ها را همراه خود ارائه یا بازتوزیع نمی‌کند. مستندات
از کاربران می‌خواهد آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق Homebrew نصب
کنند. SoX تحت مجوز `LGPL-2.0-only AND GPL-2.0-only` است؛ BlackHole تحت GPL-3.0
است. اگر نصب‌کننده یا applianceای می‌سازید که BlackHole را همراه OpenClaw
بسته‌بندی می‌کند، شرایط مجوز بالادستی BlackHole را بررسی کنید یا از
Existential Audio مجوز جداگانه بگیرید.

## انتقال‌ها

### Chrome

انتقال Chrome، URL مربوط به Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و
با نمایهٔ مرورگر واردشدهٔ OpenClaw می‌پیوندد. روی macOS، Plugin پیش از اجرا
وجود `BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز کردن
Chrome یک فرمان سلامت پل صوتی و فرمان راه‌اندازی را نیز اجرا می‌کند. وقتی
Chrome/صدا روی میزبان Gateway اجرا می‌شود از `chrome` استفاده کنید؛ وقتی
Chrome/صدا روی یک گرهٔ جفت‌شده مانند VM macOS در Parallels اجرا می‌شود از
`chrome-node` استفاده کنید. برای Chrome محلی، نمایه را با `browser.defaultProfile`
انتخاب کنید؛ `chrome.browserProfile` به میزبان‌های `chrome-node` پاس داده
می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از طریق پل صوتی محلی OpenClaw عبور دهید. اگر
`BlackHole 2ch` نصب نشده باشد، پیوستن به‌جای اینکه بی‌صدا و بدون مسیر صوتی
انجام شود، با خطای راه‌اندازی شکست می‌خورد.

### Twilio

انتقال Twilio یک طرح شماره‌گیری سخت‌گیرانه است که به Plugin تماس صوتی واگذار
می‌شود. این انتقال صفحه‌های Meet را برای شماره تلفن‌ها تحلیل نمی‌کند.

وقتی مشارکت با Chrome در دسترس نیست یا یک fallback شماره‌گیری تلفنی می‌خواهید
از این استفاده کنید. Google Meet باید برای جلسه شمارهٔ تماس تلفنی و PIN ارائه
کند؛ OpenClaw آن‌ها را از صفحهٔ Meet کشف نمی‌کند.

Plugin تماس صوتی را روی میزبان Gateway فعال کنید، نه روی گرهٔ Chrome:

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

اگر ارائه‌دهندهٔ صدای بلادرنگ شما همین است، به‌جای آن از
`realtime.provider: "openai"` با Plugin ارائه‌دهندهٔ OpenAI و `OPENAI_API_KEY`
استفاده کنید.

پس از فعال کردن `voice-call`، Gateway را بازراه‌اندازی یا بارگذاری مجدد کنید؛
تغییرات پیکربندی Plugin تا وقتی فرایند Gateway در حال اجرا بارگذاری مجدد نشود
در آن ظاهر نمی‌شود.

سپس تأیید کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

وقتی واگذاری Twilio وصل شده باشد، `googlemeet setup` شامل بررسی‌های موفق
`twilio-voice-call-plugin`، `twilio-voice-call-credentials` و
`twilio-voice-call-webhook` می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وقتی جلسه به توالی سفارشی نیاز دارد، از `--dtmf-sequence` استفاده کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth و پیش‌پرواز

OAuth برای ایجاد لینک Meet اختیاری است، چون `googlemeet create` می‌تواند به
اتوماسیون مرورگر برگردد. وقتی ایجاد از طریق API رسمی، حل‌کردن space، یا
بررسی‌های پیش‌پرواز Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک کلاینت OAuth در
Google Cloud ایجاد کنید، scopeهای لازم را درخواست کنید، یک حساب Google را
مجاز کنید، سپس refresh token حاصل را در پیکربندی Plugin مربوط به Google Meet
ذخیره کنید یا متغیرهای محیطی `OPENCLAW_GOOGLE_MEET_*` را ارائه کنید.

OAuth جایگزین مسیر پیوستن Chrome نمی‌شود. انتقال‌های Chrome و Chrome-node
هنوز هنگام استفاده از مشارکت مرورگر، از طریق نمایهٔ واردشدهٔ Chrome،
BlackHole/SoX، و یک گرهٔ متصل می‌پیوندند. OAuth فقط برای مسیر رسمی Google Meet
API است: ایجاد spaceهای جلسه، حل‌کردن spaceها، و اجرای بررسی‌های پیش‌پرواز
Meet Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژهٔ Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحهٔ رضایت OAuth را پیکربندی کنید.
   - **Internal** برای یک سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا وقتی برنامه
     در حالت Testing است، هر حساب Google را که قرار است برنامه را مجاز کند
     به‌عنوان کاربر آزمایشی اضافه کنید.
4. scopeهایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک شناسهٔ کلاینت OAuth ایجاد کنید.
   - نوع برنامه: **Web application**.
   - URI مجاز تغییرمسیر:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. شناسهٔ کلاینت و secret کلاینت را کپی کنید.

`meetings.space.created` برای `spaces.create` در Google Meet لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به
spaceها حل کند. `meetings.space.settings` به OpenClaw اجازه می‌دهد هنگام ایجاد
اتاق از طریق API تنظیمات `SpaceConfig` مانند `accessType` را پاس دهد.
`meetings.conference.media.readonly` برای پیش‌پرواز Meet Media API و کار رسانه
است؛ Google ممکن است برای استفادهٔ واقعی از Media API به ثبت‌نام Developer
Preview نیاز داشته باشد. اگر فقط به پیوستن‌های Chrome مبتنی بر مرورگر نیاز
دارید، OAuth را کاملاً نادیده بگیرید.

### ساختن refresh token

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها
را به‌عنوان متغیرهای محیطی پاس دهید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک پیکربندی `oauth` با refresh token چاپ می‌کند. از PKCE،
callback محلی روی `http://localhost:8085/oauth2callback`، و جریان کپی/چسباندن
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
اگر هم مقدارهای پیکربندی و هم مقدارهای محیطی حاضر باشند، Plugin ابتدا
پیکربندی را حل می‌کند و سپس به fallback محیطی برمی‌گردد.

رضایت OAuth شامل ایجاد space در Meet، دسترسی خواندن به space در Meet، و
دسترسی خواندن رسانهٔ کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه
احراز هویت کرده‌اید، دوباره `openclaw googlemeet auth login --json` را اجرا
کنید تا refresh token دارای scope `meetings.space.created` باشد.

### تأیید OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون راز می‌خواهید، doctor مربوط به OAuth را اجرا
کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این فرمان runtime مربوط به Chrome را بارگذاری نمی‌کند و به گرهٔ Chrome متصل
نیاز ندارد. بررسی می‌کند که پیکربندی OAuth وجود داشته باشد و refresh token
بتواند access token بسازد. گزارش JSON فقط فیلدهای وضعیت مانند `ok`،
`configured`، `tokenSource`، `expiresAt` و پیام‌های بررسی را شامل می‌شود؛
access token، refresh token، یا secret کلاینت را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنی                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک نشانه دسترسی ذخیره‌شده، موجود است.       |
| `oauth-token`        | نشانه دسترسی ذخیره‌شده هنوز معتبر است، یا نشانه تازه‌سازی یک نشانه دسترسی جدید صادر کرده است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای Meet موجود را پیدا کرد.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای Meet جدید ایجاد کرد.                               |

برای اثبات فعال بودن Google Meet API و محدوده `spaces.create` نیز، بررسی
ایجاد دارای اثر جانبی را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL موقت Meet ایجاد می‌کند. زمانی از آن استفاده کنید که باید تأیید کنید
Google Cloud project دارای Meet API فعال است و حساب مجاز
محدوده `meetings.space.created` را دارد.

برای اثبات دسترسی خواندن برای یک فضای جلسه موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک فضای موجود را
که حساب Google مجاز می‌تواند به آن دسترسی داشته باشد اثبات می‌کنند. یک `403` از این بررسی‌ها
معمولاً یعنی Google Meet REST API غیرفعال است، نشانه تازه‌سازی رضایت‌داده‌شده
محدوده لازم را ندارد، یا حساب Google نمی‌تواند به آن فضای Meet
دسترسی داشته باشد. خطای نشانه تازه‌سازی یعنی `openclaw googlemeet auth login
--json` را دوباره اجرا کنید و بلوک جدید `oauth` را ذخیره کنید.

برای جایگزین مرورگر به هیچ اعتبارنامه OAuth نیازی نیست. در آن حالت، احراز هویت Google
از پروفایل Chrome واردشده در گره انتخاب‌شده می‌آید، نه از
پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان جایگزین پذیرفته می‌شوند:

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

پس از آنکه Meet رکوردهای کنفرانس را ایجاد کرد، مصنوعات جلسه و حضور را فهرست کنید:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، `artifacts` و `attendance` به‌طور پیش‌فرض از آخرین رکورد کنفرانس
استفاده می‌کنند. وقتی همه رکوردهای نگه‌داری‌شده برای آن جلسه را می‌خواهید،
`--all-conference-records` را ارسال کنید.

جست‌وجوی Calendar می‌تواند URL جلسه را پیش از خواندن مصنوعات Meet از Google Calendar
حل کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` در تقویم `primary` امروز به‌دنبال یک رویداد Calendar با پیوند
Google Meet می‌گردد. برای جست‌وجوی متن رویدادهای منطبق از `--event <query>` و
برای یک تقویم غیر اصلی از `--calendar <id>` استفاده کنید. جست‌وجوی Calendar به ورود OAuth تازه‌ای نیاز دارد
که شامل محدوده فقط‌خواندنی رویدادهای Calendar باشد.
`calendar-events` رویدادهای Meet منطبق را پیش‌نمایش می‌کند و رویدادی را که
`latest`، `artifacts`، `attendance` یا `export` انتخاب خواهد کرد علامت می‌زند.

اگر از قبل شناسه رکورد کنفرانس را می‌دانید، مستقیماً به آن آدرس‌دهی کنید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

وقتی می‌خواهید پس از تماس اتاق را ببندید، یک کنفرانس فعال را برای فضایی که با API ایجاد شده است پایان دهید:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

این کار Google Meet `spaces.endActiveConference` را فراخوانی می‌کند و به OAuth با
محدوده `meetings.space.created` برای فضایی نیاز دارد که حساب مجاز بتواند آن را مدیریت کند.
OpenClaw ورودی URL، کد جلسه، یا `spaces/{id}` مربوط به Meet را می‌پذیرد و پیش از پایان دادن به کنفرانس فعال،
آن را به منبع فضای API حل می‌کند.
این از `googlemeet leave` جداست: `leave` مشارکت محلی/نشستی OpenClaw را متوقف می‌کند،
در حالی که `end-active-conference` از Google Meet می‌خواهد کنفرانس فعال را برای فضا پایان دهد.

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

`artifacts` فراداده رکورد کنفرانس را به‌همراه فراداده منابع شرکت‌کننده، ضبط،
رونوشت، ورودی رونوشت ساختاریافته، و یادداشت هوشمند، وقتی Google آن را برای جلسه ارائه کند،
برمی‌گرداند. برای رد کردن جست‌وجوی ورودی در جلسات بزرگ از `--no-transcript-entries` استفاده کنید.
`attendance` شرکت‌کنندگان را به ردیف‌های نشست شرکت‌کننده با زمان‌های اولین/آخرین مشاهده،
مدت کل نشست، پرچم‌های دیررس/ترک زودهنگام، و منابع شرکت‌کننده تکراری ادغام‌شده بر اساس
کاربر واردشده یا نام نمایشی گسترش می‌دهد. برای جدا نگه‌داشتن منابع خام شرکت‌کننده
`--no-merge-duplicates`، برای تنظیم تشخیص دیررس `--late-after-minutes` و
برای تنظیم تشخیص ترک زودهنگام `--early-before-minutes` را ارسال کنید.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`،
`transcript.md`، `artifacts.json`، `attendance.json` و `manifest.json` می‌نویسد.
`manifest.json` ورودی انتخاب‌شده، گزینه‌های خروجی، رکوردهای کنفرانس،
فایل‌های خروجی، شمارش‌ها، منبع نشانه، رویداد Calendar در صورت استفاده، و هرگونه
هشدار بازیابی جزئی را ثبت می‌کند. برای نوشتن یک آرشیو قابل‌حمل کنار پوشه نیز
`--zip` را ارسال کنید. برای خروجی گرفتن متن Google Docs رونوشت‌ها و
یادداشت‌های هوشمند پیوندشده از طریق Google Drive `files.export`، `--include-doc-bodies` را ارسال کنید؛ این به
ورود OAuth تازه‌ای نیاز دارد که شامل محدوده فقط‌خواندنی Drive Meet باشد. بدون
`--include-doc-bodies`، خروجی‌ها فقط شامل فراداده Meet و ورودی‌های رونوشت ساختاریافته هستند.
اگر Google یک شکست جزئی مصنوع برگرداند، مانند خطای فهرست‌کردن یادداشت هوشمند،
ورودی رونوشت، یا بدنه سند Drive، خلاصه و
manifest هشدار را به‌جای شکست دادن کل خروجی نگه می‌دارند.
برای واکشی همان داده‌های مصنوعات/حضور و چاپ JSON مربوط به
manifest بدون ایجاد پوشه یا ZIP از `--dry-run` استفاده کنید. این کار پیش از نوشتن
یک خروجی بزرگ یا وقتی یک عامل فقط به شمارش‌ها، رکوردهای انتخاب‌شده و
هشدارها نیاز دارد مفید است.

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

برای برگرداندن فقط manifest خروجی و رد کردن نوشتن فایل‌ها، `"dryRun": true` را تنظیم کنید.

عامل‌ها همچنین می‌توانند یک اتاق مبتنی بر API با سیاست دسترسی صریح ایجاد کنند:

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

برای اعتبارسنجی ابتدا-گوش‌دادن، عامل‌ها باید پیش از ادعای مفید بودن جلسه از `test_listen` استفاده کنند:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

اسموک زنده محافظت‌شده را در برابر یک جلسه واقعی نگه‌داری‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

کاوشگر مرورگر زنده ابتدا-گوش‌دادن را در برابر جلسه‌ای اجرا کنید که در آن کسی صحبت خواهد کرد
و زیرنویس‌های Meet در دسترس هستند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

محیط اسموک زنده:

- `OPENCLAW_LIVE_TEST=1` آزمون‌های زنده محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک URL، کد، یا
  `spaces/{id}` نگه‌داری‌شده Meet اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه کلاینت OAuth را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN` نشانه تازه‌سازی را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های جایگزین
  بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

اسموک زنده پایه مصنوعات/حضور به
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar
به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. خروجی گرفتن از
بدنه سند Drive به
`https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای Meet تازه ایجاد کنید:

```bash
openclaw googlemeet create
```

فرمان `meeting uri` جدید، منبع، و نشست پیوستن را چاپ می‌کند. با اعتبارنامه‌های OAuth
از Google Meet API رسمی استفاده می‌کند. بدون اعتبارنامه‌های OAuth،
از پروفایل مرورگر واردشده گره Chrome سنجاق‌شده به‌عنوان جایگزین استفاده می‌کند. عامل‌ها می‌توانند
با `action: "create"` از ابزار `google_meet` برای ایجاد و پیوستن در یک
مرحله استفاده کنند. برای ایجاد فقط URL، `"join": false` را ارسال کنید.

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

اگر جایگزین مرورگر پیش از آنکه بتواند URL را ایجاد کند به ورود Google یا مانع مجوز Meet برخورد کند،
متد Gateway پاسخی ناموفق برمی‌گرداند و ابزار
`google_meet` جزئیات ساختاریافته را به‌جای یک رشته ساده برمی‌گرداند:

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
`manualActionMessage` را به‌همراه زمینه گره/زبانه مرورگر گزارش کند و تا زمانی که اپراتور مرحله مرورگر را کامل کند،
باز کردن زبانه‌های جدید Meet را متوقف کند.

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

ایجاد یک Meet به‌صورت پیش‌فرض به جلسه می‌پیوندد. انتقال Chrome یا Chrome-node همچنان
برای پیوستن از طریق مرورگر به یک نمایه Google Chrome واردشده نیاز دارد. اگر
نمایه خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک
خطای جایگزین مرورگر را گزارش می‌کند و از اپراتور می‌خواهد پیش از
تلاش دوباره، ورود به Google را کامل کند.

`preview.enrollmentAcknowledged: true` را فقط پس از تأیید این‌که پروژه Cloud،
اصل OAuth، و شرکت‌کنندگان جلسه شما در Google Workspace Developer Preview Program
برای APIهای رسانه Meet ثبت‌نام شده‌اند تنظیم کنید.

## پیکربندی

مسیر رایج عامل Chrome فقط به فعال بودن Plugin، BlackHole، SoX، یک
کلید ارائه‌دهنده رونویسی بی‌درنگ، و یک ارائه‌دهنده TTS پیکربندی‌شده OpenClaw نیاز دارد.
OpenAI ارائه‌دهنده پیش‌فرض رونویسی است؛ برای استفاده از Google Gemini Live در حالت `bidi`
بدون تغییر ارائه‌دهنده پیش‌فرض رونویسی حالت عامل، `realtime.voiceProvider` را روی
`"google"` و `realtime.model` را تنظیم کنید:

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
- `defaultMode: "agent"` (`"realtime"` فقط به‌عنوان یک نام مستعار سازگاری قدیمی
  برای `"agent"` پذیرفته می‌شود؛ فراخوانی‌های جدید ابزار باید `"agent"` بگویند)
- `chromeNode.node`: شناسه/نام/IP اختیاری Node برای `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: نامی که در صفحه مهمان خارج‌شده Meet
  استفاده می‌شود
- `chrome.autoJoin: true`: تکمیل نام مهمان و کلیک روی Join Now به‌صورت بهترین‌تلاش
  از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال‌سازی یک برگه موجود Meet به‌جای
  باز کردن موارد تکراری
- `chrome.waitForInCallMs: 20000`: انتظار برای این‌که برگه Meet پیش از
  فعال شدن معرفی گفت‌وگوی برگشتی، وضعیت حضور در تماس را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صوتی جفت‌فرمان. از
  `"g711-ulaw-8khz"` فقط برای جفت‌فرمان‌های قدیمی/سفارشی استفاده کنید که هنوز
  صوت تلفنی تولید می‌کنند.
- `chrome.audioBufferBytes: 4096`: بافر پردازش SoX برای فرمان‌های صوتی
  جفت‌فرمان Chrome تولیدشده. این مقدار نصف بافر پیش‌فرض 8192 بایتی SoX است،
  که تأخیر پیش‌فرض لوله را کاهش می‌دهد و در عین حال امکان افزایش آن را روی میزبان‌های شلوغ باقی می‌گذارد.
  مقادیر کمتر از حداقل SoX به 17 بایت محدود می‌شوند.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch`
  می‌خواند و صوت را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صوت را در `chrome.audioFormat`
  می‌خواند و به CoreAudio `BlackHole 2ch` می‌نویسد
- `chrome.bargeInInputCommand`: فرمان اختیاری میکروفون محلی که برای تشخیص ورود گفتار انسان
  هنگام فعال بودن پخش دستیار، PCM مونو 16 بیتی little-endian علامت‌دار می‌نویسد.
  این در حال حاضر برای پل جفت‌فرمان `chrome` میزبانی‌شده در Gateway اعمال می‌شود.
- `chrome.bargeInRmsThreshold: 650`: سطح RMS که در
  `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی شمرده می‌شود
- `chrome.bargeInPeakThreshold: 2500`: سطح اوج که در
  `chrome.bargeInInputCommand` به‌عنوان وقفه انسانی شمرده می‌شود
- `chrome.bargeInCooldownMs: 900`: حداقل تأخیر بین پاک‌سازی‌های تکراری
  وقفه انسانی
- `mode: "agent"`: حالت پیش‌فرض گفت‌وگوی برگشتی. گفتار شرکت‌کننده توسط
  ارائه‌دهنده رونویسی بی‌درنگ پیکربندی‌شده رونویسی می‌شود، به عامل
  پیکربندی‌شده OpenClaw در یک نشست زیرعامل برای هر جلسه فرستاده می‌شود، و از طریق
  زمان‌اجرای عادی TTS OpenClaw بازگو می‌شود.
- `mode: "bidi"`: حالت جایگزین مدل بی‌درنگ دوسویه مستقیم. ارائه‌دهنده
  صدای بی‌درنگ مستقیماً به گفتار شرکت‌کننده پاسخ می‌دهد و ممکن است برای
  پاسخ‌های عمیق‌تر/پشتیبانی‌شده با ابزار `openclaw_agent_consult` را فراخوانی کند.
- `mode: "transcribe"`: حالت فقط مشاهده بدون پل گفت‌وگوی برگشتی.
- `realtime.provider: "openai"`: جایگزین سازگاری که وقتی فیلدهای ارائه‌دهنده
  محدوده‌دار زیر تنظیم نشده‌اند استفاده می‌شود.
- `realtime.transcriptionProvider: "openai"`: شناسه ارائه‌دهنده‌ای که حالت `agent`
  برای رونویسی بی‌درنگ استفاده می‌کند.
- `realtime.voiceProvider`: شناسه ارائه‌دهنده‌ای که حالت `bidi` برای صدای
  بی‌درنگ مستقیم استفاده می‌کند. برای استفاده از Gemini Live در حالی که رونویسی
  حالت عامل روی OpenAI باقی می‌ماند، این را روی `"google"` تنظیم کنید.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، همراه با
  `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی آمادگی گفتاری کوتاه هنگام اتصال پل بی‌درنگ؛
  آن را روی `""` تنظیم کنید تا بی‌صدا بپیوندد
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

ElevenLabs برای گوش دادن و صحبت کردن در حالت عامل:

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
`messages.tts.providers.elevenlabs.voiceId` می‌آید. پاسخ‌های عامل همچنین می‌توانند از
دستورهای ویژه هر پاسخ مانند `[[tts:voiceId=... model=eleven_v3]]` استفاده کنند،
وقتی بازنویسی‌های مدل TTS فعال باشند، اما پیکربندی پیش‌فرض قطعی برای جلسه‌ها است.
هنگام پیوستن، گزارش‌ها باید `transcriptionProvider=elevenlabs` را نشان دهند و هر
پاسخ گفتاری باید `provider=elevenlabs model=eleven_v3 voice=<voiceId>` را ثبت کند.

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

مقدار پیش‌فرض `voiceCall.enabled` برابر `true` است؛ با انتقال Twilio، تماس
واقعی PSTN، DTMF، و خوشامدگویی آغازین را به Plugin تماس صوتی واگذار می‌کند. تماس صوتی
پیش از باز کردن جریان رسانه بی‌درنگ، توالی DTMF را پخش می‌کند، سپس از متن
آغازین ذخیره‌شده به‌عنوان خوشامدگویی بی‌درنگ اولیه استفاده می‌کند. اگر `voice-call`
فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را اعتبارسنجی و ثبت کند،
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

وقتی Chrome روی میزبان Gateway اجرا می‌شود از `transport: "chrome"` استفاده کنید. وقتی
Chrome روی یک Node جفت‌شده مانند VM Parallels اجرا می‌شود از
`transport: "chrome-node"` استفاده کنید. در هر دو حالت، ارائه‌دهندگان مدل و
`openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا می‌مانند.
با `mode: "agent"` پیش‌فرض، ارائه‌دهنده رونویسی بی‌درنگ گوش دادن را انجام می‌دهد،
عامل پیکربندی‌شده OpenClaw پاسخ را تولید می‌کند، و TTS عادی OpenClaw آن را در Meet
پخش می‌کند. وقتی می‌خواهید مدل صدای بی‌درنگ مستقیماً پاسخ دهد از
`mode: "bidi"` استفاده کنید.
`mode: "realtime"` خام همچنان به‌عنوان نام مستعار سازگاری قدیمی برای
`mode: "agent"` پذیرفته می‌شود، اما دیگر در شِمای ابزار عامل تبلیغ نمی‌شود.
گزارش‌های حالت عامل در زمان راه‌اندازی پل، ارائه‌دهنده/مدل رونویسی حل‌شده را
و پس از هر پاسخ ساخته‌شده، ارائه‌دهنده TTS، مدل، صدا، قالب خروجی، و نرخ نمونه‌برداری را شامل می‌شوند.

برای فهرست کردن نشست‌های فعال یا بررسی شناسه نشست از `action: "status"` استفاده کنید. از
`action: "speak"` همراه با `sessionId` و `message` استفاده کنید تا عامل بی‌درنگ
فوراً صحبت کند. برای ایجاد یا استفاده دوباره از نشست، فعال‌سازی یک عبارت شناخته‌شده،
و بازگرداندن سلامت `inCall` وقتی میزبان Chrome بتواند آن را گزارش کند، از
`action: "test_speech"` استفاده کنید. `test_speech` همیشه `mode: "agent"` را اجبار می‌کند
و اگر خواسته شود در `mode: "transcribe"` اجرا شود شکست می‌خورد، چون نشست‌های فقط مشاهده
عمداً نمی‌توانند گفتار تولید کنند. نتیجه `speechOutputVerified` آن بر پایه افزایش
بایت‌های خروجی صوت بی‌درنگ در طول این فراخوانی آزمایشی است، بنابراین یک نشست
استفاده‌شده دوباره با صوت قدیمی‌تر، به‌عنوان بررسی گفتار تازه و موفق شمرده نمی‌شود.
برای علامت‌گذاری پایان نشست از `action: "leave"` استفاده کنید.

وقتی در دسترس باشد، `status` سلامت Chrome را شامل می‌شود:

- `inCall`: به نظر می‌رسد Chrome داخل تماس Meet است
- `micMuted`: وضعیت میکروفون Meet به‌صورت بهترین‌تلاش
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: نمایه
  مرورگر پیش از کار کردن گفتار به ورود دستی، پذیرش توسط میزبان Meet، مجوزها، یا
  تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: این‌که آیا
  گفتار مدیریت‌شده Chrome اکنون مجاز است. `speechReady: false` یعنی OpenClaw
  عبارت آغازین/آزمایشی را به پل صوتی نفرستاده است.
- `providerConnected` / `realtimeReady`: وضعیت پل صدای بی‌درنگ
- `lastInputAt` / `lastOutputAt`: آخرین صوت دیده‌شده از پل یا فرستاده‌شده به آن
- `audioOutputRouted` / `audioOutputDeviceLabel`: این‌که آیا خروجی رسانه برگه Meet
  به‌طور فعال به دستگاه BlackHole استفاده‌شده توسط پل هدایت شده است
- `lastSuppressedInputAt` / `suppressedInputBytes`: ورودی loopback که هنگام فعال بودن
  پخش دستیار نادیده گرفته شده است

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## حالت‌های عامل و Bidi

حالت `agent` در Chrome برای رفتار «عامل من در جلسه است» بهینه شده است. ارائه‌دهنده
رونویسی بی‌درنگ صدای جلسه را می‌شنود، رونوشت‌های نهایی شرکت‌کنندگان از طریق عامل
پیکربندی‌شده OpenClaw مسیریابی می‌شوند، و پاسخ از طریق زمان‌اجرای عادی TTS OpenClaw
گفته می‌شود. وقتی می‌خواهید مدل صدای بی‌درنگ مستقیماً پاسخ دهد، `mode: "bidi"` را تنظیم کنید.
قطعه‌های رونوشت نهایی نزدیک به هم پیش از مشورت ادغام می‌شوند تا یک نوبت گفتاری
چند پاسخ جزئی کهنه تولید نکند. ورودی بی‌درنگ همچنین هنگام پخش شدن صوت دستیار
در صف سرکوب می‌شود،
و پژواک‌های اخیر رونوشت شبیه دستیار پیش از مشورت عامل نادیده گرفته می‌شوند
تا loopback مربوط به BlackHole باعث نشود عامل به گفتار خودش پاسخ دهد.

| حالت    | چه کسی پاسخ را تعیین می‌کند        | مسیر خروجی گفتار                     | زمان استفاده                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | عامل پیکربندی‌شده OpenClaw | زمان‌اجرای عادی TTS OpenClaw            | رفتار «عامل من در جلسه است» را می‌خواهید        |
| `bidi`  | مدل صدای بی‌درنگ      | پاسخ صوتی ارائه‌دهنده صدای بی‌درنگ | کم‌تأخیرترین چرخه صدای مکالمه‌ای را می‌خواهید |

در حالت `bidi`، وقتی مدل بی‌درنگ به استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی OpenClaw
نیاز داشته باشد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره، عامل معمولی OpenClaw را پشت صحنه با زمینهٔ رونوشت اخیر
جلسه اجرا می‌کند و یک پاسخ گفتاری کوتاه برمی‌گرداند. در حالت `agent`،
OpenClaw آن پاسخ را مستقیم به زمان‌اجرای TTS می‌فرستد؛ در حالت `bidi`، مدل
صدای بلادرنگ می‌تواند نتیجهٔ مشاوره را دوباره در جلسه بیان کند. این ابزار از
همان سازوکار مشاورهٔ مشترک تماس صوتی استفاده می‌کند.

به‌طور پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید
با یک فضای کاری عامل OpenClaw اختصاصی، پیش‌فرض‌های مدل، سیاست ابزار، حافظه و
تاریخچهٔ نشست مشاوره کند، `realtime.agentId` را تنظیم کنید.

مشاوره‌های حالت عامل از کلید نشست جداگانهٔ هر جلسه
`agent:<id>:subagent:google-meet:<session>` استفاده می‌کنند تا پرسش‌های
پیگیری، ضمن به ارث بردن سیاست معمول عامل از عامل پیکربندی‌شده، زمینهٔ جلسه را
حفظ کنند.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در دسترس قرار می‌دهد و عامل معمولی را به
  `read`، `web_search`، `web_fetch`، `x_search`، `memory_search` و
  `memory_get` محدود می‌کند.
- `owner`: ابزار مشاوره را در دسترس قرار می‌دهد و اجازه می‌دهد عامل معمولی از
  سیاست ابزار معمول عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صدای بلادرنگ قرار نمی‌دهد.

کلید نشست مشاوره برای هر نشست Meet محدود شده است، بنابراین فراخوانی‌های
مشاورهٔ پیگیری می‌توانند در همان جلسه از زمینهٔ مشاورهٔ قبلی دوباره استفاده
کنند.

برای اجبار به بررسی آمادگی گفتاری پس از اینکه Chrome کاملا به تماس پیوست:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای آزمون دود کامل پیوستن و صحبت کردن:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## فهرست بررسی آزمون زنده

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
- وقتی Chrome-node انتقال پیش‌فرض است یا یک گره پین شده است، `googlemeet setup`
  شامل `chrome-node-connected` می‌شود.
- `nodes status` نشان می‌دهد گره انتخاب‌شده متصل است.
- گره انتخاب‌شده هر دو قابلیت `googlemeet.chrome` و `browser.proxy` را اعلام
  می‌کند.
- زبانهٔ Meet به تماس می‌پیوندد و `test-speech` سلامت Chrome را با
  `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome دوردست مانند ماشین مجازی macOS در Parallels، این
کوتاه‌ترین بررسی امن پس از به‌روزرسانی Gateway یا ماشین مجازی است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند Plugin مربوط به Gateway بارگذاری شده، گره ماشین مجازی با توکن
فعلی متصل است، و پل صوتی Meet پیش از باز کردن یک زبانهٔ جلسهٔ واقعی توسط عامل
در دسترس است.

برای آزمون دود Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را
ارائه می‌دهد:

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
- پس از بارگذاری دوبارهٔ Gateway، `voicecall` در CLI در دسترس است.
- نشست برگشتی `transport: "twilio"` و یک `twilio.voiceCallId` دارد.
- `openclaw logs --follow` نشان می‌دهد TwiML مربوط به DTMF پیش از TwiML
  بلادرنگ ارائه شده، سپس یک پل بلادرنگ با خوشامدگویی اولیه در صف قرار گرفته
  است.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری
کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر به‌تازگی `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را
بازراه‌اندازی یا دوباره بارگذاری کنید. عامل در حال اجرا فقط ابزارهای Plugin را
می‌بیند که توسط فرایند فعلی Gateway ثبت شده‌اند.

روی میزبان‌های Gateway غیر macOS، ابزار روبه‌عامل `google_meet` همچنان قابل
مشاهده می‌ماند، اما کنش‌های گفت‌وگوی برگشتی Chrome محلی پیش از رسیدن به پل
صوتی مسدود می‌شوند. صدای گفت‌وگوی برگشتی Chrome محلی در حال حاضر به
`BlackHole 2ch` در macOS وابسته است، بنابراین عامل‌های Linux باید به جای مسیر
عامل Chrome محلی پیش‌فرض، از `mode: "transcribe"`، شماره‌گیری Twilio، یا یک
میزبان `chrome-node` روی macOS استفاده کنند.

### هیچ گره متصلِ دارای قابلیت Google Meet وجود ندارد

روی میزبان گره، اجرا کنید:

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

گره باید متصل باشد و `googlemeet.chrome` به‌علاوهٔ `browser.proxy` را فهرست
کند. پیکربندی Gateway باید اجازهٔ آن فرمان‌های گره را بدهد:

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
عبارت `gateway token mismatch` را نشان داد، گره را با توکن فعلی Gateway دوباره
نصب یا بازراه‌اندازی کنید. برای یک Gateway روی LAN، این معمولا یعنی:

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

برای پیوستن‌های فقط مشاهده، `googlemeet test-listen` را اجرا کنید، یا برای
پیوستن‌های بلادرنگ، `googlemeet test-speech` را اجرا کنید؛ سپس سلامت Chrome
برگشتی را بررسی کنید. اگر هر یک از این کاوش‌ها
`manualActionRequired: true` را گزارش کرد، `manualActionMessage` را به اپراتور
نشان دهید و تا کامل شدن کنش مرورگر، تلاش دوباره را متوقف کنید.

کنش‌های دستی رایج:

- به نمایهٔ Chrome وارد شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی درخواست مجوز بومی Chrome ظاهر شد، مجوزهای میکروفون/دوربین Chrome را
  بدهید.
- یک گفت‌وگوی مجوز Meet گیرکرده را ببندید یا تعمیر کنید.

صرفا به این دلیل که Meet نشان می‌دهد «Do you want people to hear you in the
meeting?» گزارش «وارد نشده‌اید» ندهید. این میان‌پردهٔ انتخاب صوت Meet است؛
OpenClaw وقتی در دسترس باشد، از طریق خودکارسازی مرورگر روی **Use microphone**
کلیک می‌کند و همچنان منتظر وضعیت واقعی جلسه می‌ماند. برای جایگزین مرورگر فقط
برای ایجاد، OpenClaw ممکن است روی **Continue without microphone** کلیک کند،
زیرا ایجاد URL به مسیر صوتی بلادرنگ نیاز ندارد.

### ایجاد جلسه شکست می‌خورد

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند از
نقطهٔ پایانی Google Meet API یعنی `spaces.create` استفاده می‌کند. بدون
اعتبارنامه‌های OAuth، به مرورگر گره Chrome پین‌شده برمی‌گردد. تأیید کنید:

- برای ایجاد از طریق API: `oauth.clientId` و `oauth.refreshToken` پیکربندی
  شده‌اند، یا متغیرهای محیطی مطابق `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ایجاد از طریق API: توکن تازه‌سازی پس از اضافه شدن پشتیبانی ایجاد صادر
  شده است. توکن‌های قدیمی‌تر ممکن است دامنهٔ `meetings.space.created` را
  نداشته باشند؛ `openclaw googlemeet auth login --json` را دوباره اجرا کنید و
  پیکربندی Plugin را به‌روزرسانی کنید.
- برای جایگزین مرورگر: `defaultTransport: "chrome-node"` و `chromeNode.node` به
  گره متصلی اشاره می‌کنند که `browser.proxy` و `googlemeet.chrome` دارد.
- برای جایگزین مرورگر: نمایهٔ OpenClaw Chrome روی آن گره به Google وارد شده
  است و می‌تواند `https://meet.google.com/new` را باز کند.
- برای جایگزین مرورگر: تلاش‌های دوباره پیش از باز کردن زبانهٔ جدید، از یک
  زبانهٔ موجود `https://meet.google.com/new` یا درخواست حساب Google دوباره
  استفاده می‌کنند. اگر مهلت عامل تمام شد، به جای باز کردن دستی یک زبانهٔ Meet
  دیگر، فراخوانی ابزار را دوباره تلاش کنید.
- برای جایگزین مرورگر: اگر ابزار `manualActionRequired: true` را برگرداند، از
  `browser.nodeId`، `browser.targetId`، `browserUrl` و
  `manualActionMessage` برگشتی برای راهنمایی اپراتور استفاده کنید. تا کامل شدن
  آن کنش، در یک حلقه دوباره تلاش نکنید.
- برای جایگزین مرورگر: اگر Meet نشان می‌دهد «Do you want people to hear you in
  the meeting?» زبانه را باز نگه دارید. OpenClaw باید از طریق خودکارسازی مرورگر
  روی **Use microphone** یا، برای جایگزین فقط ایجاد، روی **Continue without
  microphone** کلیک کند و به انتظار برای URL ایجادشدهٔ Meet ادامه دهد. اگر
  نتواند، خطا باید به `meet-audio-choice-required` اشاره کند، نه
  `google-login-required`.

### عامل می‌پیوندد اما صحبت نمی‌کند

مسیر بلادرنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای مسیر معمول گفت‌وگوی برگشتی STT -> عامل OpenClaw -> TTS از
`mode: "agent"` استفاده کنید، یا برای جایگزین صدای بلادرنگ مستقیم از
`mode: "bidi"` استفاده کنید. `mode: "transcribe"` عمدا پل گفت‌وگوی برگشتی را
شروع نمی‌کند. برای اشکال‌زدایی فقط مشاهده، پس از صحبت کردن شرکت‌کنندگان،
`openclaw googlemeet status --json <session-id>` را اجرا کنید و `captioning`،
`transcriptLines` و `lastCaptionText` را بررسی کنید. اگر `inCall` برابر true
است اما `transcriptLines` روی `0` می‌ماند، ممکن است زیرنویس‌های Meet غیرفعال
باشند، از زمان نصب مشاهده‌گر کسی صحبت نکرده باشد، رابط کاربری Meet تغییر کرده
باشد، یا زیرنویس زنده برای زبان/حساب جلسه در دسترس نباشد.

`googlemeet test-speech` همیشه مسیر بلادرنگ را بررسی می‌کند و گزارش می‌دهد آیا
برای آن فراخوانی، بایت‌های خروجی پل مشاهده شده‌اند یا نه. اگر
`speechOutputVerified` برابر false و `speechOutputTimedOut` برابر true باشد،
ارائه‌دهندهٔ بلادرنگ ممکن است گفتار را پذیرفته باشد اما OpenClaw بایت‌های
خروجی تازه‌ای را ندیده که به پل صوتی Chrome برسند.

همچنین بررسی کنید:

- یک کلید ارائه‌دهندهٔ بلادرنگ روی میزبان Gateway در دسترس است، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome قابل مشاهده است.
- `sox` روی میزبان Chrome وجود دارد.
- میکروفون و بلندگوی Meet از مسیر صوتی مجازی مورد استفادهٔ OpenClaw عبور داده
  شده‌اند. برای پیوستن‌های بلادرنگ Chrome محلی، `doctor` باید
  `meet output routed: yes` را نشان دهد.

`googlemeet doctor [session-id]` نشست، گره، وضعیت داخل تماس، دلیل کنش دستی،
اتصال ارائه‌دهندهٔ بلادرنگ، `realtimeReady`، فعالیت ورودی/خروجی صوتی، آخرین
مهرهای زمانی صوت، شمارنده‌های بایت و URL مرورگر را چاپ می‌کند. وقتی به JSON
خام نیاز دارید از `googlemeet status [session-id] --json` استفاده کنید. وقتی
باید تازه‌سازی OAuth مربوط به Google Meet را بدون افشای توکن‌ها بررسی کنید از
`googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API هم
نیاز دارید، `--meeting` یا `--create-space` را اضافه کنید.

اگر مهلت عامل تمام شده و می‌بینید که یک زبانهٔ Meet از قبل باز است، همان زبانه
را بدون باز کردن زبانه‌ای دیگر بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

کنش ابزار معادل `recover_current_tab` است. این کنش یک زبانهٔ Meet موجود را برای
انتقال انتخاب‌شده متمرکز و بررسی می‌کند. با `chrome`، از کنترل مرورگر محلی از
طریق Gateway استفاده می‌کند؛ با `chrome-node`، از گره Chrome پیکربندی‌شده
استفاده می‌کند. زبانهٔ جدید باز نمی‌کند و نشست جدید نمی‌سازد؛ مانع فعلی را
گزارش می‌دهد، مانند وضعیت ورود، پذیرش، مجوزها یا انتخاب صوت. فرمان CLI با
Gateway پیکربندی‌شده صحبت می‌کند، بنابراین Gateway باید در حال اجرا باشد؛
`chrome-node` همچنین نیاز دارد گره Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

وقتی `voice-call` مجاز یا فعال نباشد، `twilio-voice-call-plugin` شکست می‌خورد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید
و Gateway را دوباره بارگذاری کنید.

وقتی پشتیبان Twilio شناسهٔ حساب، توکن احراز هویت یا شمارهٔ تماس‌گیرنده را
نداشته باشد، `twilio-voice-call-credentials` شکست می‌خورد. این‌ها را روی
میزبان Gateway تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

وقتی `voice-call` در معرض Webhook عمومی نباشد، یا وقتی `publicUrl` به local loopback
یا فضای شبکهٔ خصوصی اشاره کند، `twilio-voice-call-webhook` شکست می‌خورد.
`plugins.entries.voice-call.config.publicUrl` را روی URL عمومی ارائه‌دهنده
تنظیم کنید یا یک تونل/نمایش Tailscale برای `voice-call` پیکربندی کنید.

URLهای loopback و خصوصی برای callbackهای اپراتور مخابراتی معتبر نیستند. از
`localhost`، `127.0.0.1`، `0.0.0.0`، `10.x`، `172.16.x`-`172.31.x`،
`192.168.x`، `169.254.x`، `fc00::/7`، یا `fd00::/8` به عنوان `publicUrl`
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

برای توسعهٔ محلی، به‌جای URL میزبان خصوصی، از تونل یا در معرض‌گذاری Tailscale استفاده کنید:

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

سپس Gateway را بازراه‌اندازی یا بازبارگذاری کنید و اجرا کنید:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌صورت پیش‌فرض فقط آمادگی را بررسی می‌کند. برای اجرای آزمایشی یک شمارهٔ مشخص بدون برقراری تماس واقعی:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط زمانی `--yes` را اضافه کنید که عمداً می‌خواهید یک تماس اعلان خروجی زنده برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید که رویداد Meet جزئیات تماس تلفنی ورودی را ارائه می‌کند. شمارهٔ دقیق تماس ورودی و PIN یا یک توالی DTMF سفارشی را بدهید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر ارائه‌دهنده پیش از وارد کردن PIN به مکث نیاز دارد، در `--dtmf-sequence` از `w` ابتدایی یا ویرگول استفاده کنید.

اگر تماس تلفنی ایجاد می‌شود اما فهرست اعضای Meet هرگز شرکت‌کنندهٔ تماس ورودی را نشان نمی‌دهد:

- `openclaw googlemeet doctor <session-id>` را اجرا کنید تا شناسهٔ تماس Twilio واگذارشده، اینکه آیا DTMF در صف قرار گرفته است، و اینکه آیا پیام خوشامدگویی درخواستی ثبت شده است یا نه را تأیید کنید.
- `openclaw voicecall status --call-id <id>` را اجرا کنید و تأیید کنید که تماس هنوز فعال است.
- `openclaw voicecall tail` را اجرا کنید و بررسی کنید که Webhookهای Twilio به Gateway می‌رسند.
- `openclaw logs --follow` را اجرا کنید و دنبال توالی Twilio Meet بگردید: Google Meet پیوستن را واگذار می‌کند، Voice Call بخش تلفنی را شروع می‌کند، Google Meet به‌اندازهٔ `voiceCall.dtmfDelayMs` صبر می‌کند، DTMF را با `voicecall.dtmf` می‌فرستد، به‌اندازهٔ `voiceCall.postDtmfSpeechDelayMs` صبر می‌کند، سپس با `voicecall.speak` گفتار معرفی را درخواست می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ بررسی راه‌اندازی سبز لازم است، اما درست بودن توالی PIN جلسه را ثابت نمی‌کند.
- تأیید کنید شمارهٔ تماس ورودی متعلق به همان دعوت‌نامه و منطقهٔ Meet مربوط به PIN است.
- اگر Meet کند پاسخ می‌دهد یا رونوشت تماس هنوز پس از ارسال DTMF درخواست PIN را نشان می‌دهد، `voiceCall.dtmfDelayMs` را افزایش دهید.
- اگر شرکت‌کننده وارد می‌شود اما پیام خوشامدگویی را نمی‌شنوید، در `openclaw logs --follow` درخواست `voicecall.speak` پس از DTMF و سپس پخش TTS جریان رسانه یا جایگزین `<Say>` در Twilio را بررسی کنید. اگر رونوشت تماس هنوز شامل "enter the meeting PIN" است، بخش تلفنی هنوز به اتاق Meet نپیوسته است، بنابراین شرکت‌کنندگان جلسه گفتار را نخواهند شنید.

اگر Webhookها نمی‌رسند، ابتدا Plugin تماس صوتی را اشکال‌زدایی کنید: ارائه‌دهنده باید بتواند به `plugins.entries.voice-call.config.publicUrl` یا تونل پیکربندی‌شده دسترسی پیدا کند. [عیب‌یابی تماس صوتی](/fa/plugins/voice-call#troubleshooting) را ببینید.

## یادداشت‌ها

API رسانهٔ رسمی Google Meet دریافت‌محور است، بنابراین صحبت کردن داخل تماس Meet همچنان به مسیر شرکت‌کننده نیاز دارد. این Plugin این مرز را شفاف نگه می‌دارد: Chrome مشارکت مرورگر و مسیریابی صوتی محلی را مدیریت می‌کند؛ Twilio مشارکت تماس ورودی تلفنی را مدیریت می‌کند.

حالت‌های پاسخ‌گویی Chrome به `BlackHole 2ch` به‌علاوهٔ یکی از این موارد نیاز دارند:

- `chrome.audioInputCommand` به‌علاوهٔ `chrome.audioOutputCommand`: OpenClaw مالک پل است و صدا را با `chrome.audioFormat` بین آن فرمان‌ها و ارائه‌دهندهٔ انتخاب‌شده لوله‌کشی می‌کند. حالت agent از رونویسی بلادرنگ به‌علاوهٔ TTS معمولی استفاده می‌کند؛ حالت bidi از ارائه‌دهندهٔ صدای بلادرنگ استفاده می‌کند. مسیر پیش‌فرض Chrome برابر با PCM16 با 24 kHz و `chrome.audioBufferBytes: 4096` است؛ G.711 mu-law با 8 kHz همچنان برای جفت‌فرمان‌های قدیمی در دسترس است.
- `chrome.audioBridgeCommand`: یک فرمان پل خارجی مالک کل مسیر صوتی محلی است و باید پس از شروع یا اعتبارسنجی daemon خود خارج شود. این فقط برای `bidi` معتبر است، چون حالت `agent` برای TTS به دسترسی مستقیم جفت‌فرمان نیاز دارد.

وقتی یک عامل ابزار `google_meet` را در حالت agent فراخوانی می‌کند، نشست مشاور جلسه پیش از پاسخ دادن به گفتار شرکت‌کننده، رونوشت فعلی فراخواننده را fork می‌کند. نشست Meet همچنان جدا می‌ماند (`agent:<agentId>:subagent:google-meet:<sessionId>`) تا پیگیری‌های جلسه مستقیماً رونوشت فراخواننده را تغییر ندهند.

برای صدای دوسویهٔ تمیز، خروجی Meet و میکروفن Meet را از طریق دستگاه‌های مجازی جداگانه یا یک گراف دستگاه مجازی سبک Loopback مسیریابی کنید. یک دستگاه مشترک BlackHole می‌تواند صدای دیگر شرکت‌کنندگان را دوباره به تماس بازتاب دهد.

با پل Chrome مبتنی بر جفت‌فرمان، `chrome.bargeInInputCommand` می‌تواند به یک میکروفن محلی جداگانه گوش دهد و وقتی انسان شروع به صحبت می‌کند، پخش دستیار را پاک کند. این باعث می‌شود گفتار انسان حتی زمانی که ورودی مشترک BlackHole loopback هنگام پخش دستیار موقتاً سرکوب شده است، جلوتر از خروجی دستیار بماند. مانند `chrome.audioInputCommand` و `chrome.audioOutputCommand`، این یک فرمان محلی پیکربندی‌شده توسط اپراتور است. از مسیر فرمان یا فهرست آرگومان صریح و مورد اعتماد استفاده کنید و آن را به اسکریپت‌هایی از مکان‌های نامطمئن اشاره ندهید.

`googlemeet speak` پل صوتی پاسخ‌گویی فعال را برای یک نشست Chrome فعال می‌کند. `googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق Plugin تماس صوتی واگذار شده‌اند، `leave` تماس صوتی زیربنایی را هم قطع می‌کند. وقتی می‌خواهید کنفرانس فعال Google Meet را هم برای یک فضای مدیریت‌شده با API ببندید، از `googlemeet end-active-conference` استفاده کنید.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت گفتگو](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
