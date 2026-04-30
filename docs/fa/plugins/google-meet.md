---
read_when:
    - می‌خواهید یک عامل OpenClaw به یک تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw یک تماس جدید Google Meet ایجاد کند
    - شما در حال پیکربندی Chrome، گره Chrome یا Twilio به‌عنوان انتقال‌دهندهٔ Google Meet هستید
summary: 'Plugin ‏Google Meet: پیوستن به URLهای صریح Meet از طریق Chrome یا Twilio با تنظیمات پیش‌فرض صدای بلادرنگ'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T09:39:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

پشتیبانی شرکت‌کننده Google Meet برای OpenClaw — این Plugin عمداً صریح طراحی شده است:

- فقط به یک URL مشخص از نوع `https://meet.google.com/...` می‌پیوندد.
- می‌تواند از طریق Google Meet API یک فضای Meet جدید ایجاد کند و سپس به URL
  بازگردانده‌شده بپیوندد.
- صدای `realtime` حالت پیش‌فرض است.
- صدای بلادرنگ می‌تواند وقتی استدلال عمیق‌تر یا ابزارها لازم باشند، دوباره به عامل کامل OpenClaw
  فراخوانی کند.
- عامل‌ها رفتار پیوستن را با `mode` انتخاب می‌کنند: از `realtime` برای
  شنیدن/پاسخ‌دادن زنده، یا از `transcribe` برای پیوستن/کنترل مرورگر بدون پل
  صدای بلادرنگ استفاده کنید.
- احراز هویت به‌صورت Google OAuth شخصی یا یک نمایه Chrome از پیش واردشده شروع می‌شود.
- اعلام رضایت خودکار وجود ندارد.
- بک‌اند صوتی پیش‌فرض Chrome برابر `BlackHole 2ch` است.
- Chrome می‌تواند محلی یا روی یک میزبان Node جفت‌شده اجرا شود.
- Twilio یک شماره تماس ورودی به‌همراه PIN یا دنباله DTMF اختیاری می‌پذیرد.
- فرمان CLI برابر `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر
  کنفرانس تلفنی عامل رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید و یک ارائه‌دهنده صدای بلادرنگ بک‌اند را
پیکربندی کنید. OpenAI پیش‌فرض است؛ Google Gemini Live نیز با
`realtime.provider: "google"` کار می‌کند:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند. نصب‌کننده
Homebrew قبل از اینکه macOS دستگاه را نمایش دهد، به راه‌اندازی مجدد نیاز دارد:

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

خروجی راه‌اندازی طوری در نظر گرفته شده که برای عامل قابل خواندن و نسبت به حالت آگاه باشد. این خروجی نمایه Chrome،
پین‌کردن Node و، برای پیوستن‌های بلادرنگ Chrome، پل صوتی BlackHole/SoX
و بررسی‌های مقدمه بلادرنگ با تأخیر را گزارش می‌کند. برای پیوستن‌های فقط مشاهده، همان
انتقال را با `--mode transcribe` بررسی کنید؛ آن حالت پیش‌نیازهای صوتی بلادرنگ را رد می‌کند
چون از طریق پل گوش نمی‌دهد یا از طریق آن صحبت نمی‌کند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری Twilio پیکربندی شده باشد، راه‌اندازی همچنین گزارش می‌دهد که آیا
Plugin `voice-call` و اعتبارنامه‌های Twilio آماده هستند یا نه. هر بررسی `ok: false`
را پیش از درخواست از عامل برای پیوستن، به‌عنوان مانعی برای انتقال و حالت بررسی‌شده
در نظر بگیرید. برای اسکریپت‌ها یا خروجی قابل خواندن توسط ماشین از `openclaw googlemeet setup --json`
استفاده کنید. برای پیش‌پرواز یک انتقال مشخص پیش از تلاش عامل، از
`--transport chrome`، `--transport chrome-node` یا `--transport twilio`
استفاده کنید.

به جلسه بپیوندید:

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

- ایجاد از طریق API: وقتی اعتبارنامه‌های Google Meet OAuth پیکربندی شده باشند استفاده می‌شود. این
  قطعی‌ترین مسیر است و به وضعیت UI مرورگر وابسته نیست.
- جایگزین مرورگر: وقتی اعتبارنامه‌های OAuth وجود نداشته باشند استفاده می‌شود. OpenClaw از
  Node پین‌شده Chrome استفاده می‌کند، `https://meet.google.com/new` را باز می‌کند، منتظر می‌ماند Google
  به یک URL واقعی دارای کد جلسه هدایت کند، سپس آن URL را برمی‌گرداند. این مسیر نیاز دارد
  نمایه Chrome مربوط به OpenClaw روی Node از قبل وارد Google شده باشد.
  خودکارسازی مرورگر اعلان میکروفون اجرای نخست خود Meet را مدیریت می‌کند؛ آن اعلان
  به‌عنوان شکست ورود Google در نظر گرفته نمی‌شود.
  جریان‌های پیوستن و ایجاد همچنین تلاش می‌کنند پیش از بازکردن یک تب جدید،
  از تب Meet موجود دوباره استفاده کنند. تطبیق، رشته‌های پرس‌وجوی بی‌ضرر URL مانند `authuser` را نادیده می‌گیرد، بنابراین
  تلاش دوباره عامل باید جلسه از قبل بازشده را متمرکز کند، نه اینکه یک تب Chrome دوم
  بسازد.

خروجی فرمان/ابزار شامل فیلد `source` (`api` یا `browser`) است تا عامل‌ها
بتوانند توضیح دهند کدام مسیر استفاده شده است. `create` به‌طور پیش‌فرض به جلسه جدید می‌پیوندد و
`joined: true` به‌همراه نشست پیوستن را برمی‌گرداند. برای اینکه فقط URL ساخته شود، در
CLI از `create --no-join` استفاده کنید یا `"join": false` را به ابزار بدهید.

یا به عامل بگویید: «یک Google Meet ایجاد کن، با صدای بلادرنگ به آن بپیوند، و
پیوندش را برای من بفرست.» عامل باید `google_meet` را با `action: "create"` فراخوانی کند و
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
و در جلسه پاسخ صوتی نمی‌دهد. پیوستن‌های Chrome در این حالت همچنین از
اعطای مجوز میکروفون/دوربین OpenClaw و مسیر **Use
microphone** در Meet پرهیز می‌کنند. اگر Meet یک میان‌صفحه انتخاب صدا نشان دهد، خودکارسازی
مسیر بدون میکروفون را امتحان می‌کند و در غیر این صورت به‌جای بازکردن
میکروفون محلی، یک اقدام دستی را گزارش می‌دهد.

در طول نشست‌های بلادرنگ، وضعیت `google_meet` سلامت مرورگر و پل صوتی را
شامل مواردی مانند `inCall`، `manualActionRequired`، `providerConnected`،
`realtimeReady`، `audioInputActive`، `audioOutputActive`، زمان‌مهرهای آخرین ورودی/خروجی
، شمارنده‌های بایت، و وضعیت بسته‌شدن پل گزارش می‌کند. اگر اعلان امن صفحه Meet
ظاهر شود، خودکارسازی مرورگر هر وقت بتواند آن را مدیریت می‌کند. ورود، پذیرش میزبان، و
اعلان‌های مجوز مرورگر/OS به‌عنوان اقدام دستی با دلیل و
پیامی برای انتقال توسط عامل گزارش می‌شوند. نشست‌های مدیریت‌شده Chrome فقط پس از اینکه سلامت مرورگر
`inCall: true` را گزارش کند مقدمه یا عبارت آزمایشی را منتشر می‌کنند؛ در غیر این صورت وضعیت
`speechReady: false` را گزارش می‌کند و تلاش برای گفتار به‌جای وانمودکردن اینکه
عامل در جلسه صحبت کرده است، مسدود می‌شود.

پیوستن‌های محلی Chrome از طریق نمایه مرورگر OpenClaw که وارد شده است انجام می‌شوند. حالت بلادرنگ
برای مسیر میکروفون/بلندگوی استفاده‌شده توسط OpenClaw به `BlackHole 2ch` نیاز دارد. برای
صدای دوطرفه پاک، از دستگاه‌های مجازی جداگانه یا گرافی شبیه Loopback استفاده کنید؛ یک
دستگاه BlackHole برای نخستین آزمون دود کافی است، اما می‌تواند اکو ایجاد کند.

### Gateway محلی + Parallels Chrome

برای اینکه VM مالک Chrome باشد، **نیازی** به Gateway کامل OpenClaw یا کلید API مدل داخل macOS VM
ندارید. Gateway و عامل را محلی اجرا کنید، سپس یک
میزبان Node را در VM اجرا کنید. Plugin همراه را یک بار روی VM فعال کنید تا Node
فرمان Chrome را تبلیغ کند:

چه چیزی کجا اجرا می‌شود:

- میزبان Gateway: OpenClaw Gateway، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهنده بلادرنگ
  و پیکربندی Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/میزبان Node، Google Chrome، SoX، BlackHole 2ch،
  و یک نمایه Chrome که وارد Google شده است.
- در VM لازم نیست: سرویس Gateway، پیکربندی عامل، کلید OpenAI/GPT، یا راه‌اندازی
  ارائه‌دهنده مدل.

وابستگی‌های VM را نصب کنید:

```bash
brew install blackhole-2ch sox
```

پس از نصب BlackHole، VM را راه‌اندازی مجدد کنید تا macOS، `BlackHole 2ch` را نمایش دهد:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، بررسی کنید VM بتواند دستگاه صوتی و فرمان‌های SoX را ببیند:

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

اگر `<gateway-host>` یک IP شبکه LAN است و از TLS استفاده نمی‌کنید، Node
WebSocket متن ساده را رد می‌کند، مگر اینکه برای آن شبکه خصوصی مورد اعتماد اعلام رضایت کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

هنگام نصب Node به‌عنوان LaunchAgent از همان متغیر محیطی استفاده کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` محیط فرایند است، نه یک تنظیم
`openclaw.json`. وقتی این مقدار در فرمان نصب وجود داشته باشد، `openclaw node install` آن را در محیط LaunchAgent
ذخیره می‌کند.

Node را از میزبان Gateway تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

تأیید کنید Gateway، Node را می‌بیند و اینکه هر دو قابلیت `googlemeet.chrome`
و مرورگر/`browser.proxy` را تبلیغ می‌کند:

```bash
openclaw nodes status
```

Meet را از طریق آن Node روی میزبان Gateway مسیریابی کنید:

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

برای یک آزمون دود تک‌فرمانی که نشستی را ایجاد می‌کند یا دوباره استفاده می‌کند، عبارت شناخته‌شده‌ای را می‌گوید
و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

در طول پیوستن بلادرنگ، خودکارسازی مرورگر OpenClaw نام مهمان را پر می‌کند، روی
Join/Ask to join کلیک می‌کند، و وقتی اعلان اجرای نخست «Use microphone» در Meet
ظاهر شود آن را می‌پذیرد. در طول پیوستن فقط مشاهده یا ایجاد جلسه فقط مرورگر،
وقتی انتخاب بدون میکروفون موجود باشد از همان اعلان بدون میکروفون عبور می‌کند.
اگر نمایه مرورگر وارد نشده باشد، Meet منتظر پذیرش میزبان باشد،
Chrome برای پیوستن بلادرنگ به مجوز میکروفون/دوربین نیاز داشته باشد، یا Meet روی
اعلانی گیر کرده باشد که خودکارسازی نتوانسته حل کند، نتیجه join/test-speech مقدار
`manualActionRequired: true` را با `manualActionReason` و
`manualActionMessage` گزارش می‌کند. عامل‌ها باید تلاش دوباره برای پیوستن را متوقف کنند، همان پیام دقیق
به‌همراه `browserUrl`/`browserTitle` فعلی را گزارش کنند، و فقط پس از کامل‌شدن
اقدام دستی مرورگر دوباره تلاش کنند.

اگر `chromeNode.node` حذف شود، OpenClaw فقط زمانی به‌صورت خودکار انتخاب می‌کند که دقیقاً یک
Node متصل، هم `googlemeet.chrome` و هم کنترل مرورگر را تبلیغ کند. اگر
چند Node توانمند متصل باشند، `chromeNode.node` را روی شناسه Node،
نام نمایشی، یا IP راه دور تنظیم کنید.

بررسی‌های رایج شکست:

- `Configured Google Meet node ... is not usable: offline`: Node پین‌شده برای Gateway شناخته‌شده است اما در دسترس نیست. Agentها باید آن Node را به‌عنوان وضعیت عیب‌یابی در نظر بگیرند، نه به‌عنوان میزبان Chrome قابل استفاده، و به‌جای بازگشت به یک انتقال دیگر، مانع راه‌اندازی را گزارش کنند؛ مگر اینکه کاربر چنین چیزی خواسته باشد.
- `No connected Google Meet-capable node`: در VM، `openclaw node run` را اجرا کنید، جفت‌سازی را تأیید کنید، و مطمئن شوید `openclaw plugins enable google-meet` و `openclaw plugins enable browser` در VM اجرا شده‌اند. همچنین تأیید کنید میزبان Gateway هر دو فرمان Node را با این تنظیم مجاز می‌کند:
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: `blackhole-2ch` را روی میزبانی که بررسی می‌شود نصب کنید و پیش از استفاده از صدای Chrome محلی، راه‌اندازی مجدد انجام دهید.
- `BlackHole 2ch audio device not found on the node`: `blackhole-2ch` را در VM نصب کنید و VM را راه‌اندازی مجدد کنید.
- Chrome باز می‌شود اما نمی‌تواند وارد جلسه شود: در پروفایل مرورگر داخل VM وارد شوید، یا برای ورود مهمان، `chrome.guestName` را تنظیم‌شده نگه دارید. ورود خودکار مهمان از خودکارسازی مرورگر OpenClaw از طریق پروکسی مرورگر Node استفاده می‌کند؛ مطمئن شوید پیکربندی مرورگر Node به پروفایلی اشاره می‌کند که می‌خواهید، برای مثال
  `browser.defaultProfile: "user"` یا یک پروفایل نشست موجود با نام.
- زبانه‌های Meet تکراری: `chrome.reuseExistingTab: true` را فعال نگه دارید. OpenClaw پیش از باز کردن زبانه جدید، یک زبانه موجود برای همان URL مربوط به Meet را فعال می‌کند، و ایجاد جلسه از طریق مرورگر، پیش از باز کردن زبانه‌ای دیگر، از یک زبانه درحال‌انجام `https://meet.google.com/new` یا اعلان حساب Google دوباره استفاده می‌کند.
- بدون صدا: در Meet، میکروفون/بلندگو را از مسیر دستگاه صوتی مجازی که OpenClaw استفاده می‌کند عبور دهید؛ برای صدای دوطرفه تمیز، از دستگاه‌های مجازی جداگانه یا مسیریابی سبک Loopback استفاده کنید.

## نکات نصب

پیش‌فرض بلادرنگ Chrome از دو ابزار خارجی استفاده می‌کند:

- `sox`: ابزار صوتی خط فرمان. Plugin برای پل صوتی پیش‌فرض 24 kHz PCM16 از فرمان‌های صریح دستگاه CoreAudio استفاده می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS. این درایور دستگاه صوتی `BlackHole 2ch` را ایجاد می‌کند که Chrome/Meet می‌تواند صدا را از آن عبور دهد.

OpenClaw هیچ‌کدام از این بسته‌ها را همراه خود ارائه یا بازتوزیع نمی‌کند. مستندات از کاربران می‌خواهد آن‌ها را به‌عنوان وابستگی‌های میزبان از طریق Homebrew نصب کنند. SoX با مجوز
`LGPL-2.0-only AND GPL-2.0-only` منتشر شده است؛ BlackHole تحت GPL-3.0 است. اگر نصاب یا applianceای می‌سازید که BlackHole را همراه با OpenClaw ارائه می‌کند، شرایط مجوز بالادستی BlackHole را بررسی کنید یا از Existential Audio مجوز جداگانه بگیرید.

## انتقال‌ها

### Chrome

انتقال Chrome، URL مربوط به Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و با پروفایل مرورگر OpenClaw که وارد سیستم شده است به جلسه می‌پیوندد. در macOS، Plugin پیش از اجرا وجود `BlackHole 2ch` را بررسی می‌کند. اگر پیکربندی شده باشد، پیش از باز کردن Chrome یک فرمان سلامت پل صوتی و فرمان شروع را نیز اجرا می‌کند. وقتی Chrome/صدا روی میزبان Gateway قرار دارد از `chrome` استفاده کنید؛ وقتی Chrome/صدا روی یک Node جفت‌شده مانند VM macOS در Parallels قرار دارد از `chrome-node` استفاده کنید. برای Chrome محلی، پروفایل را با `browser.defaultProfile` انتخاب کنید؛ `chrome.browserProfile` به میزبان‌های `chrome-node` ارسال می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون و بلندگوی Chrome را از پل صوتی محلی OpenClaw عبور دهید. اگر `BlackHole 2ch` نصب نشده باشد، ورود به جلسه به‌جای پیوستن بی‌صدا بدون مسیر صوتی، با خطای راه‌اندازی شکست می‌خورد.

### Twilio

انتقال Twilio یک برنامه شماره‌گیری سخت‌گیرانه است که به Plugin Voice Call واگذار می‌شود. این انتقال صفحات Meet را برای شماره تلفن‌ها تجزیه نمی‌کند.

وقتی مشارکت از طریق Chrome در دسترس نیست یا یک جایگزین شماره‌گیری تلفنی می‌خواهید، از این گزینه استفاده کنید. Google Meet باید برای جلسه یک شماره تماس تلفنی و PIN ارائه کند؛ OpenClaw آن‌ها را از صفحه Meet کشف نمی‌کند.

Plugin Voice Call را روی میزبان Gateway فعال کنید، نه روی Node مربوط به Chrome:

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

اعتبارنامه‌های Twilio را از طریق محیط یا پیکربندی ارائه کنید. محیط، اسرار را بیرون از `openclaw.json` نگه می‌دارد:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

پس از فعال کردن `voice-call`، Gateway را راه‌اندازی مجدد یا بارگذاری مجدد کنید؛ تغییرات پیکربندی Plugin تا زمانی که فرآیند Gateway درحال‌اجرا دوباره بارگذاری نشود، در آن ظاهر نمی‌شود.

سپس تأیید کنید:

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

وقتی جلسه به دنباله سفارشی نیاز دارد، از `--dtmf-sequence` استفاده کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth و پیش‌بررسی

OAuth برای ایجاد پیوند Meet اختیاری است، زیرا `googlemeet create` می‌تواند به خودکارسازی مرورگر بازگردد. وقتی ایجاد از طریق API رسمی، resolve کردن فضا، یا بررسی‌های پیش‌پرواز Meet Media API را می‌خواهید، OAuth را پیکربندی کنید.

دسترسی Google Meet API از OAuth کاربر استفاده می‌کند: یک کلاینت OAuth در Google Cloud ایجاد کنید، scopeهای لازم را درخواست کنید، یک حساب Google را مجاز کنید، سپس refresh token حاصل را در پیکربندی Plugin Google Meet ذخیره کنید یا متغیرهای محیطی `OPENCLAW_GOOGLE_MEET_*` را ارائه دهید.

OAuth جایگزین مسیر پیوستن Chrome نمی‌شود. انتقال‌های Chrome و Chrome-node همچنان هنگام استفاده از مشارکت مرورگر، از طریق یک پروفایل Chrome واردشده، BlackHole/SoX، و یک Node متصل به جلسه می‌پیوندند. OAuth فقط برای مسیر رسمی Google Meet API است: ایجاد فضاهای جلسه، resolve کردن فضاها، و اجرای بررسی‌های پیش‌پرواز Meet Media API.

### ایجاد اعتبارنامه‌های Google

در Google Cloud Console:

1. یک پروژه Google Cloud ایجاد یا انتخاب کنید.
2. **Google Meet REST API** را برای آن پروژه فعال کنید.
3. صفحه رضایت OAuth را پیکربندی کنید.
   - **Internal** برای یک سازمان Google Workspace ساده‌ترین گزینه است.
   - **External** برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا زمانی که برنامه در حالت Testing است، هر حساب Google را که قرار است برنامه را مجاز کند به‌عنوان کاربر آزمایشی اضافه کنید.
4. scopeهایی را که OpenClaw درخواست می‌کند اضافه کنید:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. یک OAuth client ID ایجاد کنید.
   - نوع برنامه: **Web application**.
   - URI تغییرمسیر مجاز:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client ID و client secret را کپی کنید.

`meetings.space.created` برای Google Meet `spaces.create` لازم است.
`meetings.space.readonly` به OpenClaw اجازه می‌دهد URLها/کدهای Meet را به فضاها resolve کند.
`meetings.conference.media.readonly` برای پیش‌پرواز Meet Media API و کار رسانه‌ای است؛ Google ممکن است برای استفاده واقعی از Media API نیازمند ثبت‌نام در Developer Preview باشد.
اگر فقط به پیوستن‌های مبتنی بر مرورگر Chrome نیاز دارید، OAuth را کاملاً رد کنید.

### صدور refresh token

`oauth.clientId` و در صورت نیاز `oauth.clientSecret` را پیکربندی کنید، یا آن‌ها را به‌عنوان متغیرهای محیطی ارسال کنید، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک بلوک پیکربندی `oauth` با refresh token چاپ می‌کند. از PKCE، callback محلی روی `http://localhost:8085/oauth2callback`، و با `--manual` از جریان کپی/چسباندن دستی استفاده می‌کند.

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
اگر هم مقادیر پیکربندی و هم مقادیر محیطی وجود داشته باشند، Plugin ابتدا پیکربندی را resolve می‌کند و سپس به محیط بازمی‌گردد.

رضایت OAuth شامل ایجاد فضای Meet، دسترسی خواندن فضای Meet، و دسترسی خواندن رسانه کنفرانس Meet است. اگر پیش از وجود پشتیبانی ایجاد جلسه احراز هویت کرده‌اید، `openclaw googlemeet auth login --json` را دوباره اجرا کنید تا refresh token دارای scope `meetings.space.created` باشد.

### تأیید OAuth با doctor

وقتی یک بررسی سلامت سریع و بدون افشای راز می‌خواهید، doctor مربوط به OAuth را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --json
```

این کار runtime مربوط به Chrome را بارگذاری نمی‌کند و به Node متصلِ Chrome نیاز ندارد. بررسی می‌کند که پیکربندی OAuth وجود دارد و refresh token می‌تواند access token صادر کند. گزارش JSON فقط فیلدهای وضعیت مانند `ok`، `configured`، `tokenSource`، `expiresAt`، و پیام‌های بررسی را شامل می‌شود؛ access token، refresh token، یا client secret را چاپ نمی‌کند.

نتایج رایج:

| بررسی                | معنا                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک access token کش‌شده، موجود است.       |
| `oauth-token`        | access token کش‌شده هنوز معتبر است، یا refresh token یک access token جدید صادر کرده است. |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای Meet موجود را resolve کرده است.                             |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای Meet جدید ایجاد کرده است.                               |

برای اثبات فعال بودن Google Meet API و scope مربوط به `spaces.create` نیز، بررسی ایجاد دارای اثر جانبی را اجرا کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` یک URL موقت Meet ایجاد می‌کند. وقتی لازم است تأیید کنید پروژه Google Cloud، Meet API را فعال کرده و حساب مجازشده scope `meetings.space.created` را دارد، از آن استفاده کنید.

برای اثبات دسترسی خواندن برای یک فضای جلسه موجود:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` و `resolve-space` دسترسی خواندن به یک فضای موجود را که حساب Google مجازشده می‌تواند به آن دسترسی داشته باشد اثبات می‌کنند. یک `403` از این بررسی‌ها معمولاً یعنی Google Meet REST API غیرفعال است، refresh token مورد رضایت scope لازم را ندارد، یا حساب Google نمی‌تواند به آن فضای Meet دسترسی داشته باشد. خطای refresh-token یعنی `openclaw googlemeet auth login
--json` را دوباره اجرا کنید و بلوک جدید `oauth` را ذخیره کنید.

برای بازگشت مرورگر، هیچ اعتبارنامه OAuth لازم نیست. در آن حالت، احراز هویت Google از پروفایل Chrome واردشده روی Node انتخاب‌شده می‌آید، نه از پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان fallback پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` یا `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` یا `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` یا
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` یا `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` یا `GOOGLE_MEET_PREVIEW_ACK`

یک نشانی Meet، کد، یا `spaces/{id}` را از طریق `spaces.get` resolve کنید:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

پیش از کار رسانه‌ای، preflight را اجرا کنید:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

پس از آنکه Meet رکوردهای کنفرانس را ایجاد کرد، artifactهای جلسه و حضور را فهرست کنید:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، `artifacts` و `attendance` به‌طور پیش‌فرض از جدیدترین رکورد کنفرانس
استفاده می‌کنند. وقتی همه‌ی رکوردهای نگهداری‌شده برای آن جلسه را می‌خواهید،
`--all-conference-records` را بفرستید.

جست‌وجوی Calendar می‌تواند پیش از خواندن artifactهای Meet، نشانی جلسه را از Google Calendar
resolve کند:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` در Calendar امروزِ `primary` برای رویداد Calendar دارای پیوند
Google Meet جست‌وجو می‌کند. برای جست‌وجو در متن رویدادهای منطبق، از `--event <query>` و
برای Calendar غیر اصلی از `--calendar <id>` استفاده کنید. جست‌وجوی Calendar به ورود OAuth تازه
نیاز دارد که scope فقط‌خواندنی رویدادهای Calendar را شامل شود.
`calendar-events` رویدادهای Meet منطبق را پیش‌نمایش می‌کند و رویدادی را که
`latest`، `artifacts`، `attendance` یا `export` انتخاب خواهد کرد علامت می‌زند.

اگر از قبل شناسه‌ی رکورد کنفرانس را می‌دانید، آن را مستقیم نشانی‌دهی کنید:

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

`artifacts` فراداده‌ی رکورد کنفرانس به‌همراه فراداده‌ی منابع participant، recording،
transcript، transcript-entry ساختاریافته، و smart-note را، وقتی Google آن را برای جلسه
در دسترس قرار دهد، برمی‌گرداند. برای رد شدن از جست‌وجوی entry در جلسه‌های بزرگ، از
`--no-transcript-entries` استفاده کنید. `attendance` participantها را به ردیف‌های
participant-session با زمان‌های first/last seen، مدت کل نشست، پرچم‌های late/early-leave،
و منابع participant تکراری ادغام‌شده بر اساس کاربر واردشده یا نام نمایشی گسترش می‌دهد.
برای جدا نگه داشتن منابع خام participant، `--no-merge-duplicates` را بفرستید؛ برای تنظیم
تشخیص تأخیر از `--late-after-minutes`، و برای تنظیم تشخیص خروج زودهنگام از
`--early-before-minutes` استفاده کنید.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`،
`transcript.md`، `artifacts.json`، `attendance.json`، و `manifest.json` می‌نویسد.
`manifest.json` ورودی انتخاب‌شده، گزینه‌های export، رکوردهای کنفرانس،
فایل‌های خروجی، شمارش‌ها، منبع token، رویداد Calendar در صورت استفاده، و هرگونه
هشدار بازیابی ناقص را ثبت می‌کند. برای نوشتن یک بایگانی قابل‌حمل در کنار پوشه نیز
`--zip` را بفرستید. برای export کردن متن Google Docs پیوندشده‌ی transcript و
smart-note از طریق Google Drive `files.export`، `--include-doc-bodies` را بفرستید؛ این کار به
ورود OAuth تازه‌ای نیاز دارد که scope فقط‌خواندنی Drive Meet را شامل شود. بدون
`--include-doc-bodies`، exportها فقط فراداده‌ی Meet و entryهای transcript ساختاریافته
را شامل می‌شوند. اگر Google خطای artifact ناقص برگرداند، مانند خطای فهرست‌کردن smart-note،
transcript-entry، یا document-body در Drive، summary و manifest به‌جای شکست دادن کل export،
هشدار را نگه می‌دارند.
از `--dry-run` برای دریافت همان داده‌های artifact/attendance و چاپ
JSON مربوط به manifest بدون ایجاد پوشه یا ZIP استفاده کنید. این کار پیش از نوشتن
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

برای برگرداندن فقط export manifest و رد شدن از نوشتن فایل‌ها، `"dryRun": true` را تنظیم کنید.

آزمون دود زنده‌ی محافظت‌شده را در برابر یک جلسه‌ی واقعی نگهداری‌شده اجرا کنید:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

محیط آزمون دود زنده:

- `OPENCLAW_LIVE_TEST=1` آزمون‌های زنده‌ی محافظت‌شده را فعال می‌کند.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` به یک نشانی Meet، کد، یا
  `spaces/{id}` نگهداری‌شده اشاره می‌کند.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID` شناسه‌ی client مربوط به OAuth
  را فراهم می‌کند.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
  refresh token را فراهم می‌کند.
- اختیاری: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` از همان نام‌های fallback
  بدون پیشوند `OPENCLAW_` استفاده می‌کنند.

آزمون دود زنده‌ی پایه‌ی artifact/attendance به
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar
به `https://www.googleapis.com/auth/calendar.events.readonly` نیاز دارد. export کردن
document-body در Drive به
`https://www.googleapis.com/auth/drive.meet.readonly` نیاز دارد.

یک فضای Meet تازه ایجاد کنید:

```bash
openclaw googlemeet create
```

این فرمان `meeting uri` جدید، منبع، و نشست پیوستن را چاپ می‌کند. با اعتبارنامه‌های OAuth
از API رسمی Google Meet استفاده می‌کند. بدون اعتبارنامه‌های OAuth، از پروفایل مرورگر واردشده‌ی
Chrome node سنجاق‌شده به‌عنوان fallback استفاده می‌کند. agentها می‌توانند
از ابزار `google_meet` با `action: "create"` برای ایجاد و پیوستن در یک
مرحله استفاده کنند. برای ایجاد فقط URL، `"join": false` را بفرستید.

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

اگر fallback مرورگر پیش از آنکه بتواند URL را ایجاد کند به ورود Google یا مانع مجوز Meet برسد،
متد Gateway پاسخ ناموفق برمی‌گرداند و ابزار
`google_meet` به‌جای رشته‌ی ساده، جزئیات ساختاریافته برمی‌گرداند:

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

وقتی agent مقدار `manualActionRequired: true` را می‌بیند، باید
`manualActionMessage` را به‌همراه context مربوط به node/tab مرورگر گزارش کند و تا وقتی
operator مرحله‌ی مرورگر را کامل نکرده است، باز کردن tabهای جدید Meet را متوقف کند.

نمونه خروجی JSON از ایجاد از طریق API:

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

ایجاد یک Meet به‌طور پیش‌فرض همراه با پیوستن است. انتقال Chrome یا Chrome-node همچنان
برای پیوستن از طریق مرورگر به پروفایل Google Chrome واردشده نیاز دارد. اگر
پروفایل خارج شده باشد، OpenClaw مقدار `manualActionRequired: true` یا یک
خطای fallback مرورگر را گزارش می‌کند و از operator می‌خواهد پیش از تلاش دوباره،
ورود Google را کامل کند.

تنها پس از تأیید اینکه project در Cloud، principal مربوط به OAuth، و participantهای جلسه
در Google Workspace Developer Preview Program برای APIهای رسانه‌ی Meet ثبت‌نام شده‌اند،
`preview.enrollmentAcknowledged: true` را تنظیم کنید.

## پیکربندی

مسیر realtime مشترک Chrome فقط به Plugin فعال‌شده، BlackHole، SoX،
و کلید provider صدای realtime backend نیاز دارد. OpenAI پیش‌فرض است؛ برای استفاده از Google Gemini Live
`realtime.provider: "google"` را تنظیم کنید:

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
- `chrome.guestName: "OpenClaw Agent"`: نام استفاده‌شده در صفحه‌ی guest خارج‌شده‌ی Meet
- `chrome.autoJoin: true`: پر کردن نام guest و کلیک Join Now به‌صورت best-effort
  از طریق خودکارسازی مرورگر OpenClaw روی `chrome-node`
- `chrome.reuseExistingTab: true`: فعال کردن یک tab موجود Meet به‌جای
  باز کردن duplicateها
- `chrome.waitForInCallMs: 20000`: پیش از trigger شدن intro در realtime، منتظر می‌ماند تا tab مربوط به Meet
  وضعیت in-call را گزارش کند
- `chrome.audioFormat: "pcm16-24khz"`: قالب صدای جفت‌فرمان. از
  `"g711-ulaw-8khz"` فقط برای جفت‌فرمان‌های legacy/custom که هنوز صدای
  telephony تولید می‌کنند استفاده کنید.
- `chrome.audioInputCommand`: فرمان SoX که از CoreAudio `BlackHole 2ch`
  می‌خواند و صدا را در `chrome.audioFormat` می‌نویسد
- `chrome.audioOutputCommand`: فرمان SoX که صدا را در `chrome.audioFormat`
  می‌خواند و در CoreAudio `BlackHole 2ch` می‌نویسد
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: پاسخ‌های گفتاری کوتاه، با
  `openclaw_agent_consult` برای پاسخ‌های عمیق‌تر
- `realtime.introMessage`: بررسی آمادگی گفتاری کوتاه هنگام اتصال bridge مربوط به realtime؛
  برای پیوستن بی‌صدا، آن را روی `""` تنظیم کنید
- `realtime.agentId`: شناسه‌ی agent اختیاری OpenClaw برای
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

`voiceCall.enabled` به‌طور پیش‌فرض `true` است؛ با انتقال Twilio، تماس واقعی PSTN و DTMF را به
Plugin مربوط به Voice Call واگذار می‌کند. اگر `voice-call` فعال نباشد،
Google Meet همچنان می‌تواند dial plan را اعتبارسنجی و ثبت کند، اما نمی‌تواند
تماس Twilio را برقرار کند.

## ابزار

agentها می‌توانند از ابزار `google_meet` استفاده کنند:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

از `transport: "chrome"` زمانی استفاده کنید که Chrome روی میزبان Gateway اجرا می‌شود. از
`transport: "chrome-node"` زمانی استفاده کنید که Chrome روی یک Node جفت‌شده مانند
VMِ Parallels اجرا می‌شود. در هر دو حالت، مدل بی‌درنگ و `openclaw_agent_consult` روی
میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا می‌مانند.

از `action: "status"` برای فهرست‌کردن نشست‌های فعال یا بررسی یک شناسه نشست استفاده کنید. از
`action: "speak"` همراه با `sessionId` و `message` استفاده کنید تا عامل بی‌درنگ
بلافاصله صحبت کند. از `action: "test_speech"` برای ساختن یا استفاده دوباره از نشست،
فعال‌کردن یک عبارت شناخته‌شده، و برگرداندن سلامت `inCall` وقتی میزبان Chrome می‌تواند
آن را گزارش کند استفاده کنید. `test_speech` همیشه `mode: "realtime"` را اجباری می‌کند و اگر از آن خواسته شود
در `mode: "transcribe"` اجرا شود، شکست می‌خورد، چون نشست‌های فقط مشاهده عمدا نمی‌توانند
گفتار تولید کنند. نتیجه `speechOutputVerified` آن بر اساس افزایش بایت‌های خروجی صوتی بی‌درنگ
در طول همین فراخوانی آزمایشی است، بنابراین یک نشست دوباره‌استفاده‌شده با صوت قدیمی‌تر
به‌عنوان یک بررسی گفتار موفق و تازه حساب نمی‌شود. از `action: "leave"` برای علامت‌گذاری
پایان‌یافته بودن یک نشست استفاده کنید.

`status` وقتی در دسترس باشد، سلامت Chrome را هم شامل می‌شود:

- `inCall`: به نظر می‌رسد Chrome داخل تماس Meet است
- `micMuted`: وضعیت میکروفون Meet به‌صورت بهترین تلاش
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: نمایه
  مرورگر پیش از کارکردن گفتار به ورود دستی، پذیرش توسط میزبان Meet، مجوزها، یا
  تعمیر کنترل مرورگر نیاز دارد
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: اینکه آیا
  گفتار Chrome مدیریت‌شده اکنون مجاز است یا نه. `speechReady: false` یعنی OpenClaw
  عبارت معرفی/آزمایش را به پل صوتی نفرستاد.
- `providerConnected` / `realtimeReady`: وضعیت پل صدای بی‌درنگ
- `lastInputAt` / `lastOutputAt`: آخرین صوت دیده‌شده از پل یا فرستاده‌شده به پل

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## مشاوره عامل بی‌درنگ

حالت بی‌درنگ Chrome برای یک حلقه صدای زنده بهینه شده است. ارائه‌دهنده صدای بی‌درنگ
صدای جلسه را می‌شنود و از طریق پل صوتی پیکربندی‌شده صحبت می‌کند.
وقتی مدل بی‌درنگ به استدلال عمیق‌تر، اطلاعات فعلی، یا ابزارهای عادی
OpenClaw نیاز دارد، می‌تواند `openclaw_agent_consult` را فراخوانی کند.

ابزار مشاوره، عامل عادی OpenClaw را در پشت صحنه با زمینه رونوشت اخیر
جلسه اجرا می‌کند و یک پاسخ گفتاری کوتاه به نشست صدای بی‌درنگ برمی‌گرداند. سپس مدل صدا می‌تواند آن پاسخ را داخل جلسه بیان کند.
این ابزار از همان ابزار مشاوره بی‌درنگ مشترک Voice Call استفاده می‌کند.

به‌صورت پیش‌فرض، مشاوره‌ها روی عامل `main` اجرا می‌شوند. وقتی یک مسیر Meet باید با
فضای کاری عامل اختصاصی OpenClaw، پیش‌فرض‌های مدل، سیاست ابزار، حافظه، و تاریخچه نشست
مشاوره کند، `realtime.agentId` را تنظیم کنید.

`realtime.toolPolicy` اجرای مشاوره را کنترل می‌کند:

- `safe-read-only`: ابزار مشاوره را در معرض استفاده قرار دهید و عامل عادی را به
  `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، و
  `memory_get` محدود کنید.
- `owner`: ابزار مشاوره را در معرض استفاده قرار دهید و اجازه دهید عامل عادی از سیاست ابزار معمول
  عامل استفاده کند.
- `none`: ابزار مشاوره را در اختیار مدل صدای بی‌درنگ قرار ندهید.

کلید نشست مشاوره برای هر نشست Meet محدوده‌بندی شده است، بنابراین فراخوانی‌های بعدی مشاوره
می‌توانند در همان جلسه از زمینه مشاوره قبلی دوباره استفاده کنند.

برای اجباری‌کردن یک بررسی آمادگی گفتاری پس از اینکه Chrome کاملا به تماس ملحق شد:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

برای آزمون دود کاملِ پیوستن و صحبت‌کردن:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## چک‌لیست آزمایش زنده

پیش از سپردن یک جلسه به عامل بدون نظارت، از این دنباله استفاده کنید:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت مورد انتظار Chrome-node:

- `googlemeet setup` تماما سبز است.
- وقتی Chrome-node ترابری پیش‌فرض است یا یک Node سنجاق شده، `googlemeet setup` شامل `chrome-node-connected` است.
- `nodes status` نشان می‌دهد Node انتخاب‌شده متصل است.
- Node انتخاب‌شده هر دو `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- زبانه Meet به تماس ملحق می‌شود و `test-speech` سلامت Chrome را با
  `inCall: true` برمی‌گرداند.

برای یک میزبان Chrome راه‌دور مانند VMِ Parallels macOS، این کوتاه‌ترین
بررسی ایمن پس از به‌روزرسانی Gateway یا VM است:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این ثابت می‌کند که Pluginِ Gateway بارگذاری شده، Nodeِ VM با توکن فعلی
متصل است، و پل صوتی Meet پیش از اینکه یک عامل زبانه جلسه واقعی را باز کند
در دسترس است.

برای آزمون دود Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را ارائه می‌دهد:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin` و
  `twilio-voice-call-credentials` است.
- پس از بارگذاری دوباره Gateway، `voicecall` در CLI در دسترس است.
- نشست برگشتی `transport: "twilio"` و یک `twilio.voiceCallId` دارد.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin در پیکربندی Gateway فعال است و Gateway را دوباره بارگذاری کنید:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

اگر همین حالا `plugins.entries.google-meet` را ویرایش کرده‌اید، Gateway را بازراه‌اندازی یا دوباره بارگذاری کنید.
عامل در حال اجرا فقط ابزارهای Plugin را می‌بیند که توسط فرایند فعلی Gateway
ثبت شده‌اند.

### هیچ Node متصل و سازگار با Google Meet وجود ندارد

روی میزبان Node اجرا کنید:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

روی میزبان Gateway، Node را تأیید کنید و دستورها را بررسی کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node باید متصل باشد و `googlemeet.chrome` به‌علاوه `browser.proxy` را فهرست کند.
پیکربندی Gateway باید آن دستورهای Node را مجاز کند:

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
`gateway token mismatch` را نشان می‌دهد، Node را با توکن فعلی Gateway دوباره نصب یا بازراه‌اندازی کنید.
برای یک Gateway در LAN، این معمولا یعنی:

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

### مرورگر باز می‌شود اما عامل نمی‌تواند ملحق شود

`googlemeet test-speech` را اجرا کنید و سلامت Chrome برگشتی را بررسی کنید. اگر
`manualActionRequired: true` را گزارش می‌کند، `manualActionMessage` را به اپراتور نشان دهید
و تا تکمیل اقدام مرورگر، تلاش دوباره را متوقف کنید.

اقدام‌های دستی رایج:

- وارد نمایه Chrome شوید.
- مهمان را از حساب میزبان Meet بپذیرید.
- وقتی اعلان مجوز بومی Chrome ظاهر می‌شود، مجوزهای میکروفون/دوربین Chrome را بدهید.
- یک گفت‌وگوی مجوز Meet گیرکرده را ببندید یا تعمیر کنید.

فقط به این دلیل که Meet نشان می‌دهد "Do you want people to
hear you in the meeting?" گزارش "وارد نشده" ندهید. این میان‌پرده انتخاب صوتی Meet است؛ OpenClaw
وقتی در دسترس باشد، از طریق خودکارسازی مرورگر روی **Use microphone** کلیک می‌کند و
همچنان منتظر وضعیت واقعی جلسه می‌ماند. برای جایگزین مرورگر فقط-ساخت، OpenClaw
ممکن است روی **Continue without microphone** کلیک کند، چون ساختن URL به
مسیر صوتی بی‌درنگ نیاز ندارد.

### ساخت جلسه شکست می‌خورد

`googlemeet create` ابتدا وقتی اعتبارنامه‌های OAuth پیکربندی شده باشند از endpoint
‏Google Meet API `spaces.create` استفاده می‌کند. بدون اعتبارنامه‌های OAuth، به
مرورگر Nodeِ Chrome سنجاق‌شده برمی‌گردد. تأیید کنید:

- برای ساخت از طریق API: `oauth.clientId` و `oauth.refreshToken` پیکربندی شده‌اند،
  یا متغیرهای محیطی مطابق `OPENCLAW_GOOGLE_MEET_*` وجود دارند.
- برای ساخت از طریق API: توکن تازه‌سازی پس از افزوده‌شدن پشتیبانی ساخت
  صادر شده است. توکن‌های قدیمی‌تر ممکن است scopeِ `meetings.space.created` را نداشته باشند؛ دوباره
  `openclaw googlemeet auth login --json` را اجرا کنید و پیکربندی Plugin را به‌روزرسانی کنید.
- برای جایگزین مرورگر: `defaultTransport: "chrome-node"` و
  `chromeNode.node` به یک Node متصل با `browser.proxy` و
  `googlemeet.chrome` اشاره می‌کنند.
- برای جایگزین مرورگر: نمایه Chromeِ OpenClaw روی آن Node به Google وارد شده
  و می‌تواند `https://meet.google.com/new` را باز کند.
- برای جایگزین مرورگر: تلاش‌های دوباره پیش از بازکردن یک زبانه جدید، از زبانه موجود `https://meet.google.com/new`
  یا زبانه اعلان حساب Google دوباره استفاده می‌کنند. اگر عامل زمانش تمام شد،
  به‌جای بازکردن دستی یک زبانه Meet دیگر، فراخوانی ابزار را دوباره امتحان کنید.
- برای جایگزین مرورگر: اگر ابزار `manualActionRequired: true` را برمی‌گرداند، از
  `browser.nodeId`، `browser.targetId`، `browserUrl`، و
  `manualActionMessage` برگشتی برای راهنمایی اپراتور استفاده کنید. تا وقتی آن
  اقدام کامل نشده، در حلقه تلاش دوباره نکنید.
- برای جایگزین مرورگر: اگر Meet نشان می‌دهد "Do you want people to hear you in the
  meeting?"، زبانه را باز بگذارید. OpenClaw باید از طریق خودکارسازی مرورگر روی **Use microphone** یا، برای
  جایگزین فقط-ساخت، **Continue without microphone** کلیک کند و منتظر URL تولیدشده Meet بماند. اگر نتواند، خطا
  باید به `meet-audio-choice-required` اشاره کند، نه `google-login-required`.

### عامل ملحق می‌شود اما صحبت نمی‌کند

مسیر بی‌درنگ را بررسی کنید:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای گوش‌دادن/پاسخ‌دادن گفتاری از `mode: "realtime"` استفاده کنید. `mode: "transcribe"` عمدا
پل صدای بی‌درنگ دوسویه را شروع نمی‌کند. `googlemeet test-speech`
همیشه مسیر بی‌درنگ را بررسی می‌کند و گزارش می‌دهد که آیا برای همان فراخوانی، بایت‌های خروجی پل
مشاهده شده‌اند یا نه. اگر `speechOutputVerified` نادرست و
`speechOutputTimedOut` درست باشد، ارائه‌دهنده بی‌درنگ ممکن است
گفته را پذیرفته باشد اما OpenClaw بایت‌های خروجی جدیدی را ندیده که به پل صوتی Chrome
برسد.

همچنین تأیید کنید:

- یک کلید ارائه‌دهنده بی‌درنگ روی میزبان Gateway در دسترس است، مانند
  `OPENAI_API_KEY` یا `GEMINI_API_KEY`.
- `BlackHole 2ch` روی میزبان Chrome دیده می‌شود.
- `sox` روی میزبان Chrome وجود دارد.
- میکروفون و بلندگوی Meet از مسیر صوتی مجازی استفاده‌شده توسط
  OpenClaw عبور داده شده‌اند.

`googlemeet doctor [session-id]` نشست، Node، وضعیت داخل-تماس،
دلیل اقدام دستی، اتصال ارائه‌دهنده بی‌درنگ، `realtimeReady`، فعالیت ورودی/خروجی
صوت، آخرین زمان‌های صوت، شمارنده‌های بایت، و URL مرورگر را چاپ می‌کند.
وقتی JSON خام لازم دارید از `googlemeet status [session-id]` استفاده کنید. وقتی نیاز دارید
تازه‌سازی OAuthِ Google Meet را بدون افشای توکن‌ها بررسی کنید از
`googlemeet doctor --oauth` استفاده کنید؛ وقتی به اثبات Google Meet API هم نیاز دارید
`--meeting` یا `--create-space` را اضافه کنید.

اگر زمان عامل تمام شد و می‌توانید یک زبانه Meet را ببینید که از قبل باز است، آن زبانه را
بدون بازکردن زبانه‌ای دیگر بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

اقدام ابزار معادل `recover_current_tab` است. این کار برای ترابری انتخاب‌شده، یک
زبانه Meet موجود را متمرکز و بررسی می‌کند. با `chrome`، از کنترل مرورگر محلی
از طریق Gateway استفاده می‌کند؛ با `chrome-node`، از Nodeِ Chrome پیکربندی‌شده استفاده می‌کند.
این کار زبانه جدید باز نمی‌کند یا نشست جدید نمی‌سازد؛ مانع فعلی را گزارش می‌کند،
مانند ورود، پذیرش، مجوزها، یا وضعیت انتخاب صوتی.
دستور CLI با Gateway پیکربندی‌شده صحبت می‌کند، بنابراین Gateway باید در حال اجرا باشد؛
`chrome-node` همچنین نیاز دارد Nodeِ Chrome متصل باشد.

### بررسی‌های راه‌اندازی Twilio شکست می‌خورند

`twilio-voice-call-plugin` زمانی ناموفق می‌شود که `voice-call` مجاز یا فعال نباشد.
آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید و
Gateway را دوباره بارگذاری کنید.

`twilio-voice-call-credentials` زمانی ناموفق می‌شود که بک‌اند Twilio فاقد SID حساب،
توکن احراز هویت، یا شماره تماس‌گیرنده باشد. این موارد را روی میزبان Gateway تنظیم کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

سپس Gateway را راه‌اندازی مجدد یا دوباره بارگذاری کنید و اجرا کنید:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌طور پیش‌فرض فقط آمادگی را بررسی می‌کند. برای اجرای آزمایشی یک شماره مشخص بدون برقراری تماس واقعی:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط زمانی `--yes` را اضافه کنید که عمداً می‌خواهید یک تماس اعلان خروجی زنده برقرار کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio شروع می‌شود اما هرگز وارد جلسه نمی‌شود

تأیید کنید که رویداد Meet جزئیات شماره‌گیری تلفنی را ارائه می‌کند. شماره دقیق
شماره‌گیری و PIN یا یک توالی DTMF سفارشی را ارسال کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

اگر ارائه‌دهنده پیش از وارد کردن PIN به مکث نیاز دارد، در `--dtmf-sequence` از
`w` ابتدایی یا ویرگول استفاده کنید.

## یادداشت‌ها

API رسمی رسانه Google Meet دریافت‌محور است، بنابراین صحبت کردن در یک تماس Meet
هنوز به مسیر مشارکت‌کننده نیاز دارد. این Plugin این مرز را آشکار نگه می‌دارد:
Chrome مشارکت مرورگر و مسیریابی صدای محلی را انجام می‌دهد؛ Twilio مشارکت از طریق
شماره‌گیری تلفنی را انجام می‌دهد.

حالت بی‌درنگ Chrome به `BlackHole 2ch` به‌همراه یکی از این موارد نیاز دارد:

- `chrome.audioInputCommand` به‌همراه `chrome.audioOutputCommand`: OpenClaw مالک پل
  مدل بی‌درنگ است و صدا را در `chrome.audioFormat` بین این فرمان‌ها و ارائه‌دهنده
  صدای بی‌درنگ انتخاب‌شده منتقل می‌کند. مسیر پیش‌فرض Chrome برابر با PCM16 در
  24 kHz است؛ G.711 mu-law در 8 kHz همچنان برای جفت‌فرمان‌های قدیمی در دسترس است.
- `chrome.audioBridgeCommand`: یک فرمان پل خارجی مالک کل مسیر صدای محلی است و باید
  پس از شروع یا اعتبارسنجی daemon خود خارج شود.

برای صدای دوطرفه تمیز، خروجی Meet و میکروفون Meet را از طریق دستگاه‌های مجازی
جداگانه یا یک گراف دستگاه مجازی به سبک Loopback مسیریابی کنید. یک دستگاه مشترک
BlackHole می‌تواند صدای سایر مشارکت‌کنندگان را دوباره به تماس بازتاب دهد.

`googlemeet speak` پل صوتی بی‌درنگ فعال را برای یک نشست Chrome فعال می‌کند.
`googlemeet leave` آن پل را متوقف می‌کند. برای نشست‌های Twilio که از طریق Plugin
تماس صوتی واگذار شده‌اند، `leave` همچنین تماس صوتی زیربنایی را قطع می‌کند.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت گفت‌وگو](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
