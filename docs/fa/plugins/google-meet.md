---
read_when:
    - می‌خواهید یک عامل OpenClaw به تماس Google Meet بپیوندد
    - می‌خواهید یک عامل OpenClaw تماس جدیدی در Google Meet ایجاد کند
    - در حال پیکربندی Chrome، Node کروم یا Twilio به‌عنوان انتقال‌دهنده Google Meet هستید
summary: 'Plugin ‏Google Meet: پیوستن به نشانی‌های صریح Meet از طریق Chrome یا Twilio با پیش‌فرض‌های پاسخ‌گویی گفتاری عامل'
title: Plugin گوگل میت
x-i18n:
    generated_at: "2026-07-16T17:16:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Plugin ‏`google-meet` به‌نمایندگی از یک عامل OpenClaw به نشانی‌های صریح Meet می‌پیوندد. دامنهٔ آن عمداً محدود است:

- این Plugin فقط به نشانی‌های `https://meet.google.com/...` می‌پیوندد؛ هرگز با استفاده از شماره تلفنی که خودش پیدا کرده است وارد جلسه نمی‌شود.
- `googlemeet create` می‌تواند از طریق Google Meet API (یا راهکار جایگزین مرورگر) یک نشانی Meet جدید ایجاد کند و به‌طور پیش‌فرض به آن بپیوندد.
- مشارکت از طریق Chrome از یک نمایهٔ واردشدهٔ Chrome استفاده می‌کند که می‌تواند روی یک Node جفت‌شده باشد. مشارکت از طریق Twilio با استفاده از شماره تلفن به‌همراه PIN/DTMF و از طریق [Plugin تماس صوتی](/fa/plugins/voice-call) شماره‌گیری می‌کند؛ این روش نمی‌تواند مستقیماً یک نشانی Meet را شماره‌گیری کند.
- `mode: "agent"` (پیش‌فرض) گفتار شرکت‌کنندگان را با یک ارائه‌دهندهٔ بلادرنگ رونویسی می‌کند، آن را به عامل پیکربندی‌شدهٔ OpenClaw می‌فرستد و پاسخ را با TTS معمول OpenClaw می‌خواند. `mode: "bidi"` به یک مدل صوتی بلادرنگ اجازه می‌دهد مستقیماً پاسخ دهد. `mode: "transcribe"` به‌صورت فقط‌ناظر و بدون پاسخ صوتی به جلسه می‌پیوندد.
- هنگام پیوستن Plugin به تماس، هیچ اعلام خودکار رضایتی پخش نمی‌شود.
- فرمان CLI برابر با `googlemeet` است؛ `meet` برای گردش‌کارهای گسترده‌تر کنفرانس تلفنی عامل رزرو شده است.

## شروع سریع

وابستگی‌های صوتی محلی را نصب کنید، سپس کلید یک ارائه‌دهندهٔ بلادرنگ را تنظیم کنید. OpenAI ارائه‌دهندهٔ پیش‌فرض رونویسی برای حالت `agent` است؛ Google Gemini Live نیز به‌عنوان ارائه‌دهندهٔ صوتی حالت `bidi` در دسترس است:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# فقط وقتی لازم است که realtime.voiceProvider برای حالت bidi برابر با "google" باشد
export GEMINI_API_KEY=...
```

`blackhole-2ch` دستگاه صوتی مجازی `BlackHole 2ch` را نصب می‌کند که Chrome صدا را از طریق آن مسیریابی می‌کند. نصب‌کنندهٔ Homebrew برای اینکه macOS دستگاه را در دسترس قرار دهد، به راه‌اندازی مجدد نیاز دارد:

```bash
sudo reboot
```

پس از راه‌اندازی مجدد، هر دو مؤلفه را بررسی کنید:

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

راه‌اندازی را بررسی کنید، سپس به جلسه بپیوندید:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

خروجی `setup` برای عامل قابل‌خواندن و از حالت و انتقال آگاه است: نمایهٔ Chrome، تثبیت Node و برای پیوستن‌های بلادرنگ Chrome، پل صوتی BlackHole/SoX و بررسی معرفی با تأخیر را گزارش می‌کند. پیوستن‌های فقط‌ناظر پیش‌نیازهای بلادرنگ را نادیده می‌گیرند:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

وقتی واگذاری به Twilio پیکربندی شده باشد، `setup` همچنین آماده‌بودن `voice-call`، اعتبارنامه‌های Twilio و دسترسی عمومی Webhook را گزارش می‌کند. پیش از پیوستن عامل، هر بررسی `ok: false` را برای آن انتقال/حالت یک عامل مسدودکننده در نظر بگیرید. برای خروجی قابل‌خواندن توسط ماشین از `--json` و برای بررسی پیشاپیش یک انتقال مشخص از `--transport chrome|chrome-node|twilio` استفاده کنید:

```bash
openclaw googlemeet setup --transport twilio
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

در میزبان‌های Gateway غیر macOS، ‏`google_meet` برای کنش‌های مصنوع، تقویم، راه‌اندازی، رونویسی، Twilio و `chrome-node` همچنان قابل‌مشاهده است، اما پاسخ صوتی Chrome محلی (`transport: "chrome"` با `mode: "agent"` یا `"bidi"`) پیش از رسیدن به پل صوتی مسدود می‌شود، زیرا این مسیر درحال‌حاضر به `BlackHole 2ch` در macOS وابسته است. در عوض از `mode: "transcribe"`، ورود تلفنی Twilio یا یک میزبان `chrome-node` مبتنی بر macOS استفاده کنید.

### ایجاد جلسه

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` دو مسیر دارد که در فیلد `source` نتیجه گزارش می‌شوند:

- **`api`**: وقتی اعتبارنامه‌های OAuth مربوط به Google Meet پیکربندی شده باشند استفاده می‌شود. قطعی است و به وضعیت رابط کاربری مرورگر وابسته نیست.
- **`browser`**: بدون اعتبارنامه‌های OAuth استفاده می‌شود. OpenClaw ‏`https://meet.google.com/new` را روی Node تثبیت‌شدهٔ Chrome باز می‌کند و منتظر می‌ماند تا Google به یک نشانی واقعی دارای کد جلسه هدایت کند؛ نمایهٔ Chrome متعلق به OpenClaw روی آن Node باید از قبل به Google وارد شده باشد. هم پیوستن و هم ایجاد، پیش از بازکردن برگه‌ای جدید، از برگهٔ موجود Meet (یا برگهٔ درحال‌انجام `.../new` / درخواست حساب Google) دوباره استفاده می‌کنند؛ تطبیق برگه رشته‌های پرس‌وجوی بی‌ضرری مانند `authuser` را نادیده می‌گیرد.

`create` به‌طور پیش‌فرض می‌پیوندد و `joined: true` را به‌همراه نشست پیوستن برمی‌گرداند. برای اینکه فقط نشانی ایجاد شود، `--no-join` (CLI) یا `"join": false` (ابزار) را ارسال کنید.

برای اتاق‌های ایجادشده از طریق API، به‌جای به‌ارث‌بردن پیش‌فرض حساب Google، یک سیاست دسترسی صریح تنظیم کنید:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | چه کسانی می‌توانند بدون درخواست ورود بپیوندند                         |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | هر کسی که نشانی Meet را داشته باشد                                  |
| `TRUSTED`       | کاربران مورداعتماد سازمان میزبان، کاربران خارجی دعوت‌شده و کاربران ورود تلفنی |
| `RESTRICTED`    | فقط دعوت‌شدگان                                                      |

این مورد فقط برای اتاق‌های ایجادشده از طریق API اعمال می‌شود، بنابراین OAuth باید پیکربندی شده باشد. اگر پیش از وجود این گزینه احراز هویت کرده‌اید، پس از افزودن محدودهٔ `meetings.space.settings` به صفحهٔ رضایت OAuth خود، `openclaw googlemeet auth login --json` را دوباره اجرا کنید.

اگر راهکار جایگزین مرورگر با مانع ورود به Google یا مجوز Meet روبه‌رو شود، ابزار `manualActionRequired: true` را به‌همراه `manualActionReason`، ‏`manualActionMessage` و `browser.nodeId`/`browser.targetId`/`browserUrl` برمی‌گرداند. آن پیام را گزارش کنید و تا زمانی که اپراتور مرحلهٔ مرورگر را تکمیل نکرده است، از بازکردن برگه‌های جدید Meet خودداری کنید.

### پیوستن فقط‌ناظر

برای نادیده‌گرفتن پل بلادرنگ دوطرفه (بدون نیاز به BlackHole/SoX و بدون پاسخ صوتی)، `"mode": "transcribe"` را تنظیم کنید. پیوستن‌های Chrome در حالت رونویسی نیز اعطای مجوز میکروفون/دوربین OpenClaw و مسیر **Use microphone** در Meet را نادیده می‌گیرند؛ اگر Meet صفحهٔ میانی انتخاب صدا را نمایش دهد، خودکارسازی ابتدا **Continue without microphone** را امتحان می‌کند. انتقال‌های مدیریت‌شدهٔ Chrome در این حالت یک ناظر زیرنویس Meet را به‌صورت بهترین تلاش نصب می‌کنند. `googlemeet status --json` و `googlemeet doctor` مقادیر `captioning`، ‏`captionsEnabledAttempted`، ‏`transcriptLines`، ‏`lastCaptionAt`، ‏`lastCaptionSpeaker`، ‏`lastCaptionText` و یک دنبالهٔ `recentTranscript` را گزارش می‌کنند.

برای خواندن رونوشت محدود نشست، برگهٔ دقیق و ردیابی‌شدهٔ Meet را بخوانید:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

ناظر حداکثر 2,000 خط زیرنویس تکمیل‌شده را در صفحهٔ Meet نگه می‌دارد. متن تدریجی قابل‌مشاهده تا زمان تکمیل ردیف زیرنویس در دنبالهٔ سلامت وضعیت باقی می‌ماند؛ بنابراین ذخیرهٔ `nextIndex` نمی‌تواند گسترش بعدی متن را از قلم بیندازد؛ ترک جلسه ردیف‌های قابل‌مشاهده را پیش از ثبت تصویر نهایی می‌کند. `droppedLines` خطوط ازدست‌رفته از ابتدای رونوشت را هنگام عبور از سقف گزارش می‌کند. رونوشت چهار نشست پایان‌یافتهٔ اخیر تا زمان راه‌اندازی مجدد Gateway قابل‌خواندن باقی می‌مانند. رونوشت نشست‌های پایان‌یافتهٔ قدیمی‌تر `evicted: true` را برمی‌گردانند. این قابلیت عمداً حافظهٔ زمان اجرا است، نه ذخیره‌سازی ماندگار تاریخچهٔ جلسه: راه‌اندازی مجدد Gateway، بستن برگه پیش از ثبت تصویر یا عبور از سقف‌های مستندشده می‌تواند باعث ازدست‌رفتن زیرنویس‌ها شود.

برای یک کاوش شنیداری بله/خیر:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

این فرمان در حالت رونویسی می‌پیوندد، منتظر حرکت تازهٔ زیرنویس/رونوشت می‌ماند و `listenVerified`، ‏`listenTimedOut`، فیلدهای اقدام دستی و سلامت فعلی زیرنویس را برمی‌گرداند.

### سلامت نشست بلادرنگ

در طول نشست‌های دارای پاسخ صوتی، وضعیت `google_meet` سلامت Chrome/پل صوتی را گزارش می‌کند: `inCall`، ‏`manualActionRequired`، ‏`providerConnected`، ‏`realtimeReady`، ‏`audioInputActive`، ‏`audioOutputActive`، آخرین برچسب‌های زمانی ورودی/خروجی، شمارنده‌های بایت و وضعیت بسته‌بودن پل. نشست‌های مدیریت‌شدهٔ Chrome تنها پس از آن عبارت معرفی/آزمایش را می‌خوانند که سلامت، `inCall: true` را گزارش کند؛ در غیر این صورت `speechReady: false` و تلاش برای گفتار مسدود می‌شود، نه اینکه بی‌سروصدا هیچ کاری انجام ندهد.

پیوستن‌های محلی Chrome از نمایهٔ مرورگر واردشدهٔ OpenClaw استفاده می‌کنند و برای مسیر میکروفون/بلندگو به `BlackHole 2ch` نیاز دارند. یک دستگاه BlackHole برای نخستین آزمایش دود کافی است، اما ممکن است پژواک ایجاد کند؛ برای صدای دوطرفهٔ پاک از دستگاه‌های مجازی جداگانه یا یک گراف مشابه Loopback استفاده کنید.

## Gateway محلی + Chrome در Parallels

برای اینکه صرفاً Chrome در اختیار یک ماشین مجازی macOS قرار گیرد، وجود Gateway کامل یا کلید API مدل داخل ماشین مجازی لازم نیست. Gateway و عامل را به‌صورت محلی اجرا کنید؛ میزبان Node را در ماشین مجازی اجرا کنید.

| محل اجرا             | موارد اجراشده                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| میزبان Gateway       | Gateway متعلق به OpenClaw، فضای کاری عامل، کلیدهای مدل/API، ارائه‌دهندهٔ بلادرنگ، پیکربندی Plugin مربوط به Google Meet |
| ماشین مجازی macOS در Parallels | میزبان CLI/Node متعلق به OpenClaw، ‏Chrome، ‏SoX، ‏BlackHole 2ch و یک نمایهٔ Chrome واردشده به Google |
| موارد غیرضروری در ماشین مجازی | سرویس Gateway، پیکربندی عامل، راه‌اندازی ارائه‌دهندهٔ مدل                                      |

وابستگی‌های ماشین مجازی را نصب کنید، راه‌اندازی مجدد انجام دهید و بررسی کنید:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin را در ماشین مجازی فعال کنید و میزبان Node را راه‌اندازی کنید:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

اگر `<gateway-host>` یک IP شبکهٔ محلی بدون TLS است، استفاده از آن شبکهٔ خصوصی مورداعتماد را صریحاً بپذیرید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

هنگام نصب به‌عنوان LaunchAgent نیز از همین پرچم استفاده کنید (این یک متغیر محیطی فرایند است که اگر در فرمان نصب وجود داشته باشد در محیط LaunchAgent ذخیره می‌شود، نه یک تنظیم `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Node را از میزبان Gateway تأیید کنید، سپس مطمئن شوید که هم `googlemeet.chrome` و هم قابلیت مرورگر/`browser.proxy` را اعلام می‌کند:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Meet را از طریق آن Node مسیریابی کنید:

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

اکنون به‌طور معمول از میزبان Gateway به جلسه بپیوندید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

برای یک آزمایش دود تک‌فرمانی که نشستی را ایجاد می‌کند یا دوباره به‌کار می‌گیرد، عبارتی شناخته‌شده را می‌خواند و سلامت نشست را چاپ می‌کند:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

هنگام پیوستن بلادرنگ، خودکارسازی مرورگر نام مهمان را وارد می‌کند، روی Join/Ask to join کلیک می‌کند و در صورت نمایش، درخواست بار نخست **Use microphone** در Meet را می‌پذیرد (یا هنگام پیوستن فقط‌ناظر و ایجاد جلسه فقط از طریق مرورگر، **Continue without microphone** را انتخاب می‌کند). اگر نمایه از حساب خارج شده باشد، Meet منتظر پذیرش میزبان باشد، Chrome به مجوز میکروفون/دوربین نیاز داشته باشد یا Meet روی یک درخواست حل‌نشده گیر کرده باشد، نتیجه `manualActionRequired: true` را به‌همراه `manualActionReason` و `manualActionMessage` گزارش می‌کند. تلاش مجدد را متوقف کنید، آن پیام را به‌همراه `browserUrl`/`browserTitle` گزارش کنید و فقط پس از تکمیل اقدام دستی دوباره تلاش کنید.

اگر `chromeNode.node` حذف شود، OpenClaw تنها زمانی به‌طور خودکار انتخاب می‌کند که دقیقاً یک Node متصل، هم `googlemeet.chrome` و هم کنترل مرورگر را اعلام کند؛ هنگامی که چند Node توانمند متصل‌اند، `chromeNode.node` (شناسه Node، نام نمایشی یا IP راه‌دور) را ثابت کنید.

### بررسی خطاهای رایج

| نشانه                                                  | راه‌حل                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Node ثابت‌شده شناخته شده، اما در دسترس نیست. مانع راه‌اندازی را گزارش کنید؛ مگر در صورت درخواست، بی‌سروصدا به انتقال دیگری بازنگردید.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | `openclaw node run` را در ماشین مجازی اجرا کنید، جفت‌سازی را تأیید کنید و `openclaw plugins enable google-meet` و `openclaw plugins enable browser` را در آنجا اجرا کنید. تأیید کنید که `gateway.nodes.allowCommands` شامل `googlemeet.chrome` و `browser.proxy` است.                              |
| `BlackHole 2ch audio device not found`                   | `blackhole-2ch` را روی میزبانی که بررسی می‌شود نصب و آن را راه‌اندازی مجدد کنید.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | `blackhole-2ch` را در ماشین مجازی نصب و ماشین مجازی را راه‌اندازی مجدد کنید.                                                                                                                                                                                                                |
| Chrome باز می‌شود، اما نمی‌تواند بپیوندد                             | در ماشین مجازی وارد نمایه مرورگر شوید، یا `chrome.guestName` را تنظیم‌شده نگه دارید. پیوستن خودکار مهمان از خودکارسازی مرورگر OpenClaw از طریق پراکسی مرورگر Node استفاده می‌کند؛ `browser.defaultProfile` مربوط به Node (یا یک نمایه نام‌گذاری‌شده نشست موجود) را به نمایه موردنظر هدایت کنید. |
| زبانه‌های تکراری Meet                                      | `chrome.reuseExistingTab: true` را رها کنید. OpenClaw یک زبانه موجود برای همان URL را فعال می‌کند و پیش از باز کردن زبانه‌ای دیگر، هنگام ایجاد از `.../new` در حال انجام یا زبانه اعلان حساب Google دوباره استفاده می‌کند.                                                                      |
| بدون صدا                                                 | میکروفون/بلندگوی Meet را از مسیر صوتی مجازی مورداستفاده OpenClaw عبور دهید؛ برای صدای دوطرفه شفاف از دستگاه‌های مجازی جداگانه یا مسیریابی به‌سبک Loopback استفاده کنید.                                                                                                              |

## نکات نصب

حالت پیش‌فرض پاسخ صوتی Chrome از دو ابزار خارجی استفاده می‌کند که OpenClaw آن‌ها را همراه خود ارائه یا بازتوزیع نمی‌کند؛ آن‌ها را از طریق Homebrew به‌عنوان وابستگی‌های میزبان نصب کنید:

- `sox`: ابزار صوتی خط فرمان. Plugin برای پل صوتی پیش‌فرض PCM16 با نرخ 24 kHz، فرمان‌های صریح دستگاه CoreAudio را صادر می‌کند.
- `blackhole-2ch`: درایور صوتی مجازی macOS که دستگاه `BlackHole 2ch` را فراهم می‌کند و Chrome/Meet از طریق آن مسیریابی می‌شود.

مجوز SoX از نوع `LGPL-2.0-only AND GPL-2.0-only` است؛ BlackHole تحت GPL-3.0 است. اگر نصب‌کننده یا دستگاهی می‌سازید که BlackHole را همراه OpenClaw ارائه می‌کند، مجوز بالادستی BlackHole را بررسی کنید یا مجوزی جداگانه از Existential Audio بگیرید.

## انتقال‌ها

| انتقال     | زمان استفاده                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | هنگامی که Chrome/صدا روی میزبان Gateway فعال است                                                        |
| `chrome-node` | هنگامی که Chrome/صدا روی یک Node جفت‌شده فعال است (برای مثال، یک ماشین مجازی macOS در Parallels)                        |
| `twilio`      | بازگشت جایگزین تماس تلفنی از طریق Plugin تماس صوتی، هنگامی که مشارکت با Chrome در دسترس نیست |

### Chrome

URL مربوط به Meet را از طریق کنترل مرورگر OpenClaw باز می‌کند و با نمایه واردشده مرورگر OpenClaw می‌پیوندد. در macOS، Plugin پیش از اجرا وجود `BlackHole 2ch` را بررسی می‌کند و در صورت پیکربندی، پیش از باز کردن Chrome فرمان سلامت/راه‌اندازی پل صوتی را اجرا می‌کند. برای Chrome محلی، نمایه را با `browser.defaultProfile` انتخاب کنید؛ در عوض، `chrome.browserProfile` به میزبان‌های `chrome-node` ارسال می‌شود.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

صدای میکروفون/بلندگوی Chrome از پل صوتی محلی OpenClaw عبور می‌کند. اگر `BlackHole 2ch` نصب نشده باشد، پیوستن به‌جای ورود بدون مسیر صوتی، با خطای راه‌اندازی ناموفق می‌شود.

### Twilio

یک طرح شماره‌گیری سخت‌گیرانه که به [Plugin تماس صوتی](/fa/plugins/voice-call) واگذار می‌شود. این طرح صفحات Meet را برای یافتن شماره تلفن تجزیه نمی‌کند؛ Google Meet باید شماره تماس ورودی تلفنی و PIN جلسه را نمایش دهد.

تماس صوتی را روی میزبان Gateway فعال کنید، نه روی Node مربوط به Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // یا اگر Twilio باید پیش‌فرض باشد، "twilio" را تنظیم کنید
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
            instructions: "به‌عنوان یک عامل OpenClaw به این Google Meet بپیوند. مختصر صحبت کن.",
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

برای خارج نگه‌داشتن اطلاعات اعتبارسنجی Twilio از `openclaw.json`، آن‌ها را از طریق محیط ارائه کنید:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

اگر OpenAI ارائه‌دهنده صدای بلادرنگ است، در عوض از `realtime.provider: "openai"` همراه با `OPENAI_API_KEY` استفاده کنید.

پس از فعال‌سازی `voice-call`، Gateway را راه‌اندازی مجدد یا بازبارگذاری کنید؛ تغییرات پیکربندی Plugin تا زمان بازبارگذاری اعمال نمی‌شوند. بررسی کنید:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

هنگامی که واگذاری Twilio متصل شده باشد، `googlemeet setup` شامل بررسی‌های `twilio-voice-call-plugin`، `twilio-voice-call-credentials` و `twilio-voice-call-webhook` است.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

برای یک توالی سفارشی از `--dtmf-sequence` استفاده کنید و برای مکث پیش از PIN، `w` ابتدایی یا ویرگول‌ها را به‌کار ببرید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth و پیش‌بررسی

OAuth برای ایجاد پیوند Meet اختیاری است، زیرا `googlemeet create` می‌تواند به خودکارسازی مرورگر بازگردد. OAuth را برای ایجاد از طریق API رسمی، تفکیک فضا یا پیش‌بررسی Meet Media API پیکربندی کنید. پیوستن‌های Chrome/Chrome-node هرگز به OAuth وابسته نیستند؛ آن‌ها در هر صورت از یک نمایه واردشده Chrome، ‏BlackHole/SoX و (برای `chrome-node`) یک Node متصل استفاده می‌کنند.

### ایجاد اطلاعات اعتبارسنجی Google

در Google Cloud Console:

<Steps>
<Step title="ایجاد یا انتخاب یک پروژه">
</Step>
<Step title="فعال‌سازی Google Meet REST API">
</Step>
<Step title="پیکربندی صفحه رضایت OAuth">
گزینه Internal برای یک سازمان Google Workspace ساده‌ترین است. گزینه External برای راه‌اندازی‌های شخصی/آزمایشی کار می‌کند؛ تا زمانی که برنامه در حالت Testing است، هر حساب Google را که قرار است آن را مجاز کند، به‌عنوان کاربر آزمایشی اضافه کنید.
</Step>
<Step title="افزودن دامنه‌های درخواستی">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (جست‌وجوی تقویم)
- `https://www.googleapis.com/auth/drive.meet.readonly` (برون‌بری متن سند رونوشت/یادداشت هوشمند)

</Step>
<Step title="ایجاد یک شناسه کارخواه OAuth">
نوع برنامه **Web application**. URI مجاز تغییرمسیر:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="کپی شناسه کارخواه و راز کارخواه">
</Step>
</Steps>

`meetings.space.created` برای `spaces.create` الزامی است. `meetings.space.readonly` نشانی‌ها/کدهای Meet را به فضاها تفکیک می‌کند. `meetings.space.settings` به OpenClaw اجازه می‌دهد تنظیمات `SpaceConfig` مانند `accessType` را هنگام ایجاد اتاق با API ارسال کند. `meetings.conference.media.readonly` برای پیش‌بررسی Meet Media API و کار با رسانه است؛ ممکن است Google برای استفاده واقعی از Media API ثبت‌نام در Developer Preview را الزامی کند. `calendar.events.readonly` فقط برای جست‌وجوی تقویم `--today`/`--event` لازم است. `drive.meet.readonly` فقط برای برون‌بری `--include-doc-bodies` لازم است. اگر فقط به پیوستن با Chrome مبتنی بر مرورگر نیاز دارید، OAuth را به‌طور کامل نادیده بگیرید.

### ایجاد توکن تازه‌سازی

`oauth.clientId` و در صورت تمایل `oauth.clientSecret` را پیکربندی کنید (یا آن‌ها را به‌عنوان متغیرهای محیطی ارسال کنید)، سپس اجرا کنید:

```bash
openclaw googlemeet auth login --json
```

این فرمان یک جریان PKCE را با فراخوان محلی روی `http://localhost:8085/oauth2callback` اجرا می‌کند و یک بلوک پیکربندی `oauth` حاوی توکن تازه‌سازی را چاپ می‌کند. هنگامی که مرورگر نمی‌تواند به فراخوان محلی دسترسی پیدا کند، برای جریان کپی/جای‌گذاری `--manual` را اضافه کنید:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

خروجی JSON:

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

شیء `oauth` را زیر پیکربندی Plugin ذخیره کنید:

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

اگر نمی‌خواهید توکن تازه‌سازی در پیکربندی باشد، متغیرهای محیطی را ترجیح دهید؛ ابتدا پیکربندی تفکیک می‌شود و سپس محیط به‌عنوان مسیر جایگزین استفاده می‌شود. اگر پیش از افزوده‌شدن پشتیبانی از ایجاد جلسه، جست‌وجوی تقویم یا برون‌بری متن سند احراز هویت کرده‌اید، `openclaw googlemeet auth login --json` را دوباره اجرا کنید تا توکن تازه‌سازی مجموعه دامنه‌های فعلی را پوشش دهد.

### بررسی OAuth با doctor

```bash
openclaw googlemeet doctor --oauth --json
```

این فرمان بدون بارگذاری زمان‌اجرای Chrome یا نیاز به Node متصل، وجود پیکربندی OAuth و توانایی توکن تازه‌سازی برای ایجاد توکن دسترسی را بررسی می‌کند. گزارش فقط شامل فیلدهای وضعیت (`ok`، `configured`، `tokenSource`، `expiresAt`، پیام‌های بررسی) است و هرگز توکن دسترسی، توکن تازه‌سازی یا راز کارخواه را چاپ نمی‌کند.

| بررسی                | معنا                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` به‌همراه `oauth.refreshToken`، یا یک توکن دسترسی ذخیره‌شده در حافظه نهان، موجود است |
| `oauth-token`        | توکن دسترسی ذخیره‌شده در حافظه نهان هنوز معتبر است، یا توکن تازه‌سازی توکن جدیدی ایجاد کرده است    |
| `meet-spaces-get`    | بررسی اختیاری `--meeting` یک فضای موجود Meet را تفکیک کرد                       |
| `meet-spaces-create` | بررسی اختیاری `--create-space` یک فضای جدید Meet ایجاد کرد                         |

فعال‌سازی Meet API و دامنهٔ `spaces.create` را با بررسی ایجادِ دارای اثر جانبی اثبات کنید:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

دسترسی خواندن به یک فضا‌ی موجود را اثبات کنید:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

یک `403` از این بررسی‌ها معمولاً به این معناست که Meet REST API غیرفعال است، توکن نوسازی دامنهٔ لازم را ندارد، یا حساب Google نمی‌تواند به آن فضا دسترسی پیدا کند. خطای توکن نوسازی یعنی `openclaw googlemeet auth login --json` را دوباره اجرا کنید و بلوک جدید `oauth` را ذخیره کنید.

برای روش جایگزین مرورگر نیازی به OAuth نیست؛ احراز هویت Google در آنجا از نمایهٔ واردشدهٔ Chrome روی Node انتخاب‌شده تأمین می‌شود، نه از پیکربندی OpenClaw.

این متغیرهای محیطی به‌عنوان مقادیر جایگزین پذیرفته می‌شوند:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` یا `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` یا `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` یا `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` یا `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` یا `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` یا `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` یا `GOOGLE_MEET_PREVIEW_ACK`

### رفع شناسه، بررسی پیش‌نیازها و خواندن مصنوعات

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

پس از اینکه Meet رکوردهای کنفرانس را ایجاد کرد:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

با `--meeting`، `artifacts` و `attendance` به‌طور پیش‌فرض از جدیدترین رکورد کنفرانس استفاده می‌شود؛ برای همهٔ رکوردهای نگه‌داری‌شده `--all-conference-records` را ارسال کنید.

جست‌وجوی تقویم پیش از خواندن مصنوعات، نشانی جلسه را از Google Calendar رفع می‌کند (به توکن نوسازی‌ای نیاز دارد که دامنهٔ فقط‌خواندنی رویدادهای Calendar را شامل شود):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` تقویم `primary` امروز را برای رویدادی دارای پیوند Meet جست‌وجو می‌کند؛ `--event <query>` متن رویداد منطبق را جست‌وجو می‌کند؛ `--calendar <id>` یک تقویم غیراصلی را هدف می‌گیرد. `calendar-events` پیش‌نمایش رویدادهای منطبق را نمایش می‌دهد و مشخص می‌کند `latest`/`artifacts`/`attendance`/`export` کدام‌یک را انتخاب خواهد کرد.

اگر شناسهٔ رکورد کنفرانس را از قبل می‌دانید، مستقیماً به آن ارجاع دهید:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

اتاق یک فضای ایجادشده با API را ببندید:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

`spaces.endActiveConference` را فراخوانی می‌کند و برای فضایی که حساب مجاز می‌تواند مدیریت کند، به OAuth با دامنهٔ `meetings.space.created` نیاز دارد. یک نشانی Meet، کد جلسه یا `spaces/{id}` را می‌پذیرد و ابتدا آن را به منبع فضای API رفع می‌کند. این کار از `googlemeet leave` جداست: `leave` مشارکت محلی/نشست OpenClaw را متوقف می‌کند؛ `end-active-conference` از Google Meet می‌خواهد کنفرانس فعال آن فضا را پایان دهد.

یک گزارش خوانا بنویسید:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` فرادادهٔ رکورد کنفرانس را به‌همراه فرادادهٔ منابع شرکت‌کننده، ضبط، رونوشت، ورودی‌های ساخت‌یافتهٔ رونوشت و یادداشت هوشمند، در صورت ارائه‌شدن آن‌ها توسط Google، برمی‌گرداند. `--no-transcript-entries` برای جلسه‌های بزرگ از جست‌وجوی ورودی‌ها صرف‌نظر می‌کند. `attendance` شرکت‌کنندگان را به ردیف‌های نشست شرکت‌کننده گسترش می‌دهد که شامل زمان اولین/آخرین مشاهده، مدت کل نشست، پرچم‌های تأخیر/ترک زودهنگام و ادغام منابع تکراری شرکت‌کننده بر اساس کاربر واردشده یا نام نمایشی است؛ `--no-merge-duplicates` منابع خام را جدا نگه می‌دارد و `--late-after-minutes`/`--early-before-minutes` آستانه‌ها را تنظیم می‌کنند.

`export` پوشه‌ای شامل `summary.md`، `attendance.csv`، `transcript.md`، `artifacts.json`، `attendance.json` و `manifest.json` می‌نویسد. `manifest.json` ورودی انتخاب‌شده، گزینه‌های برون‌بری، رکوردهای کنفرانس، فایل‌های خروجی، تعدادها، منبع توکن، هر رویداد Calendar استفاده‌شده و هشدارهای بازیابی جزئی را ثبت می‌کند. `--zip` همچنین یک بایگانی قابل‌حمل در کنار پوشه می‌نویسد. `--include-doc-bodies` متن Google Docs پیوندشدهٔ رونوشت/یادداشت هوشمند را از طریق Drive `files.export` برون‌بری می‌کند (به دامنهٔ فقط‌خواندنی Drive Meet نیاز دارد)؛ بدون آن، برون‌بری‌ها فقط شامل فرادادهٔ Meet و ورودی‌های ساخت‌یافتهٔ رونوشت خواهند بود. خرابی جزئی مصنوعات (خطای فهرست‌کردن یادداشت هوشمند، ورودی رونوشت یا بدنهٔ سند) به‌جای شکست کل برون‌بری، هشدار را در خلاصه/مانیفست نگه می‌دارد. `--dry-run` همان داده‌ها را دریافت می‌کند و بدون ایجاد پوشه یا ZIP، JSON مانیفست را چاپ می‌کند.

عامل‌ها از همان کنش‌ها از طریق ابزار `google_meet` استفاده می‌کنند (`export`، `create` با `accessType`، `end_active_conference`، `test_listen`)؛ [ابزار](#tool) را ببینید.

### آزمون دود زنده

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| متغیر                                                                                                                  | هدف                                                                |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | آزمون‌های زندهٔ محافظت‌شده را فعال می‌کند                                             |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | نشانی Meet، کد یا `spaces/{id}` نگه‌داری‌شده                              |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | شناسهٔ سرویس‌گیرندهٔ OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | توکن نوسازی                                                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`، `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | اختیاری؛ همان نام‌های جایگزین بدون پیشوند `OPENCLAW_` نیز کار می‌کنند |

آزمون دود پایهٔ مصنوعات/حضور به `meetings.space.readonly` و `meetings.conference.media.readonly` نیاز دارد. جست‌وجوی Calendar به `calendar.events.readonly` نیاز دارد. برون‌بری بدنهٔ سند Drive به `drive.meet.readonly` نیاز دارد.

### نمونه‌های ایجاد

```bash
openclaw googlemeet create
```

نشانی URI جلسهٔ جدید، منبع و نشست پیوستن را چاپ می‌کند. با OAuth از Meet API استفاده می‌کند؛ بدون آن از نمایهٔ واردشدهٔ Node سنجاق‌شدهٔ Chrome استفاده می‌کند. JSON روش جایگزین مرورگر:

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

اگر روش جایگزین مرورگر ابتدا به ورود Google یا مانع مجوز Meet برخورد کند، `google_meet` به‌جای یک رشتهٔ ساده، جزئیات ساخت‌یافته برمی‌گرداند:

```json
{
  "source": "browser",
  "error": "google-login-required: برای ایجاد دوبارهٔ جلسه، وارد حساب Google در پروفایل مرورگر OpenClaw شوید و سپس دوباره امتحان کنید.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "برای ایجاد دوبارهٔ جلسه، وارد حساب Google در پروفایل مرورگر OpenClaw شوید و سپس دوباره امتحان کنید.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "ورود - حساب‌های Google"
  }
}
```

JSON ایجاد با API:

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

ایجاد به‌طور پیش‌فرض به جلسه می‌پیوندد، اما Chrome/Chrome-node همچنان برای پیوستن از طریق مرورگر به یک نمایهٔ Google واردشده نیاز دارد؛ اگر از حساب خارج شده باشد، OpenClaw خطای `manualActionRequired: true` یا روش جایگزین مرورگر را گزارش می‌کند و از اپراتور می‌خواهد پیش از تلاش دوباره، ورود Google را تکمیل کند.

`preview.enrollmentAcknowledged: true` را فقط پس از تأیید اینکه پروژهٔ Cloud، هویت اصلی OAuth و شرکت‌کنندگان جلسه در Google Workspace Developer Preview Program برای Meet media APIs ثبت‌نام شده‌اند، تنظیم کنید.

## پیکربندی

مسیر رایج عامل Chrome فقط به Plugin فعال، BlackHole، SoX، یک کلید ارائه‌دهندهٔ بلادرنگ و یک ارائه‌دهندهٔ TTS پیکربندی‌شده در OpenClaw نیاز دارد:

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

### پیش‌فرض‌ها

| کلید                               | پیش‌فرض                                  | توضیحات                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` به‌عنوان نام مستعار قدیمی برای `"agent"` پذیرفته می‌شود؛ فراخوان‌های جدید باید از `"agent"` استفاده کنند                                                                                                                        |
| `chromeNode.node`                 | تنظیم‌نشده                                    | شناسه/نام/IP گره برای `chrome-node`؛ وقتی ممکن است بیش از یک گره واجد قابلیت متصل باشد، الزامی است                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Chrome را برای پیوستن اجرا می‌کند؛ فقط هنگام استفادهٔ مجدد از یک نشست ازپیش‌باز، `false` را تنظیم کنید                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | در صفحهٔ مهمان Meet در حالت خارج‌شده از حساب نمایش داده می‌شود                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | تلاش برای پرکردن نام مهمان و کلیک روی Join Now در `chrome-node`                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | به‌جای بازکردن زبانه‌های تکراری، یک زبانهٔ موجود Meet را فعال می‌کند                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | پیش از اجرای مقدمهٔ پاسخ صوتی، منتظر می‌ماند تا زبانهٔ Meet وضعیت حضور در تماس را گزارش کند                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | قالب صوتی جفت‌فرمان؛ `"g711-ulaw-8khz"` فقط برای جفت‌فرمان‌های قدیمی/سفارشی است که صوت تلفنی تولید می‌کنند                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | بافر پردازش SoX برای فرمان‌های صوتی جفت‌فرمان تولیدشده (نصف بافر پیش‌فرض 8192 بایتی SoX که تأخیر لوله را کاهش می‌دهد)؛ مقادیر به حداقل 17 بایت محدود می‌شوند                                         |
| `chrome.audioInputCommand`        | فرمان SoX تولیدشده                    | از CoreAudio `BlackHole 2ch` می‌خواند و صوت را در `chrome.audioFormat` می‌نویسد                                                                                                                                        |
| `chrome.audioOutputCommand`       | فرمان SoX تولیدشده                    | صوت را در `chrome.audioFormat` می‌خواند و در CoreAudio `BlackHole 2ch` می‌نویسد                                                                                                                                          |
| `chrome.bargeInInputCommand`      | تنظیم‌نشده                                    | فرمان اختیاری میکروفون محلی که برای تشخیص ورود کاربر به گفت‌وگو هنگام پخش صدای دستیار، PCM تک‌کانالهٔ 16 بیتی علامت‌دار با ترتیب بایت little-endian می‌نویسد؛ برای پل جفت‌فرمان میزبانی‌شده در Gateway اعمال می‌شود                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | سطح RMS که به‌عنوان مداخلهٔ انسان محسوب می‌شود                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | سطح اوج که به‌عنوان مداخلهٔ انسان محسوب می‌شود                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | حداقل تأخیر میان پاک‌سازی‌های مکرر مداخله                                                                                                                                                                |
| `mode` (برای هر درخواست)              | `"agent"`                                | حالت پاسخ صوتی؛ جدول [حالت‌های عامل و دوسویه](#agent-and-bidi-modes) را ببینید                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | جایگزین سازگاری که وقتی فیلدهای محدوده‌دار زیر تنظیم نشده باشند استفاده می‌شود                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | شناسهٔ ارائه‌دهنده‌ای که حالت `agent` برای رونویسی بی‌درنگ استفاده می‌کند                                                                                                                                                       |
| `realtime.voiceProvider`          | تنظیم‌نشده                                    | شناسهٔ ارائه‌دهنده‌ای که حالت `bidi` برای صدای مستقیم بی‌درنگ استفاده می‌کند؛ برای استفاده از Gemini Live همراه با حفظ رونویسی حالت عامل روی OpenAI، آن را روی `"google"` تنظیم کنید. برای انتخاب مدل مشخص Gemini Live، آن را با `realtime.model` همراه کنید. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | [حالت‌های عامل و دوسویه](#agent-and-bidi-modes) را ببینید                                                                                                                                                                 |
| `realtime.instructions`           | دستورالعمل‌های کوتاه برای پاسخ گفتاری          | به مدل می‌گوید کوتاه صحبت کند و برای پاسخ‌های عمیق‌تر از `openclaw_agent_consult` استفاده کند                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | هنگام اتصال پل بی‌درنگ یک‌بار گفته می‌شود؛ برای پیوستن بی‌صدا، آن را روی `""` تنظیم کنید                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | شناسهٔ عامل OpenClaw که برای `openclaw_agent_consult` استفاده می‌شود                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | تماس PSTN از طریق Twilio، DTMF و خوشامدگویی آغازین را به Plugin تماس صوتی واگذار می‌کند                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | زمان انتظار اولیه پیش از پخش دنبالهٔ DTMF استخراج‌شده از PIN از طریق Twilio                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | تأخیر پیش از درخواست خوشامدگویی آغازین بی‌درنگ، پس از آنکه تماس صوتی بخش Twilio را آغاز می‌کند                                                                                                                        |

`chrome.audioBridgeCommand` و `chrome.audioBridgeHealthCommand` به یک پل خارجی اجازه می‌دهند به‌جای `chrome.audioInputCommand`/`chrome.audioOutputCommand` مالک کل مسیر صوتی محلی باشد؛ برای محدودیت مربوط به حالتی که می‌تواند از آن‌ها استفاده کند، [نکات](#notes) را ببینید.

یک مهاجرت `openclaw doctor --fix` برای ساختار قدیمی `realtime.provider: "google"` وجود دارد: اگر فیلدهای `realtime.voiceProvider: "google"` و `realtime.transcriptionProvider: "openai"` از قبل تنظیم نشده باشند، این مقصود را به آن‌ها منتقل می‌کند.

### بازنویسی‌های اختیاری

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
    model: "gemini-3.1-flash-live-preview",
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

ElevenLabs برای شنیدن و صحبت‌کردن در حالت عامل:

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

صدای پایدار Meet از `messages.tts.providers.elevenlabs.speakerVoiceId` می‌آید. وقتی بازنویسی مدل TTS فعال باشد، پاسخ‌های عامل می‌توانند از دستورهای `[[tts:speakerVoiceId=... model=eleven_v3]]` مخصوص هر پاسخ نیز استفاده کنند، اما پیکربندی، پیش‌فرض قطعی برای جلسه‌ها است. هنگام پیوستن، گزارش‌ها `transcriptionProvider=elevenlabs` را نشان می‌دهند و هر پاسخ گفتاری، `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` را ثبت می‌کند.

پیکربندی مخصوص Twilio:

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

با `voiceCall.enabled: true` (پیش‌فرض) و انتقال Twilio، تماس صوتی پیش از بازکردن جریان رسانه‌ای بی‌درنگ، دنبالهٔ DTMF را برقرار می‌کند و سپس متن آغازین ذخیره‌شده را به‌عنوان خوشامدگویی اولیهٔ بی‌درنگ به‌کار می‌برد. اگر `voice-call` فعال نباشد، Google Meet همچنان می‌تواند طرح شماره‌گیری را اعتبارسنجی و ثبت کند، اما نمی‌تواند تماس Twilio را برقرار کند.

برای استفاده از زمان‌اجرای محلی و مورداعتماد Gateway که عامل فراخواننده را در کل تماس حفظ می‌کند، `voiceCall.gatewayUrl` را تنظیم‌نشده باقی بگذارید. URL پیکربندی‌شدهٔ Gateway همچنان یک مقصد صریح WebSocket است و نمی‌تواند منشأ Plugin را احراز هویت کند؛ پیوستن عامل‌های غیراصلی به‌جای استفادهٔ بی‌سروصدا از عاملی دیگر، به‌صورت بسته شکست می‌خورد. هنگامی که مسیریابی به‌ازای هر عامل لازم است، Google Meet و Voice Call را در یک فرایند Gateway اجرا کنید.

## ابزار

عامل‌ها از ابزار `google_meet` استفاده می‌کنند:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | کاربرد                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | پیوستن به یک URL صریح Meet                                                                         |
| `create`                | ایجاد یک فضا (و پیوستن به‌صورت پیش‌فرض)؛ از `accessType`/`entryPointAccess` پشتیبانی می‌کند                    |
| `status`                | فهرست‌کردن نشست‌های فعال، یا بررسی یکی از آن‌ها با `sessionId`                                               |
| `setup_status`          | اجرای همان بررسی‌های `googlemeet setup`                                                         |
| `resolve_space`         | رفع یک URL/کد/`spaces/{id}` از طریق `spaces.get`                                                 |
| `preflight`             | اعتبارسنجی پیش‌نیازهای OAuth و رفع جلسه                                                 |
| `latest`                | یافتن جدیدترین رکورد کنفرانس برای یک جلسه                                                   |
| `calendar_events`       | پیش‌نمایش رویدادهای Calendar دارای پیوند Meet                                                           |
| `artifacts`             | فهرست‌کردن رکوردهای کنفرانس و فرادادهٔ شرکت‌کننده/ضبط/رونویسی/یادداشت هوشمند                  |
| `attendance`            | فهرست‌کردن شرکت‌کنندگان و نشست‌های شرکت‌کنندگان                                                        |
| `export`                | نوشتن بستهٔ مصنوعات/حضور/رونویسی/مانیفست؛ برای فقط مانیفست، `"dryRun": true` را تنظیم کنید |
| `recover_current_tab`   | تمرکز روی/بررسی یک زبانهٔ موجود Meet بدون بازکردن زبانه‌ای جدید                                      |
| `transcript`            | خواندن رونویسی محدود زیرنویس؛ `sinceIndex` از `nextIndex` قبلی ادامه می‌دهد           |
| `leave`                 | پایان‌دادن به یک نشست (Chrome روی دکمهٔ Leave کلیک می‌کند؛ فقط زبانه‌هایی را می‌بندد که خودش باز کرده است؛ Twilio تماس را قطع می‌کند)                  |
| `end_active_conference` | پایان‌دادن به کنفرانس فعال Google Meet برای فضایی که با API مدیریت می‌شود                                    |
| `speak`                 | واداشتن عامل بلادرنگ به صحبت فوری، با دریافت `sessionId` و `message`                        |
| `test_speech`           | ایجاد/استفادهٔ مجدد از یک نشست، فعال‌کردن عبارتی شناخته‌شده و بازگرداندن وضعیت سلامت Chrome                              |
| `test_listen`           | ایجاد/استفادهٔ مجدد از یک نشست فقط‌نظارتی و انتظار برای حرکت زیرنویس/رونویسی                        |

`test_speech` همیشه `mode: "agent"` یا `"bidi"` را اجباری می‌کند و اگر از آن خواسته شود در `mode: "transcribe"` اجرا شود، شکست می‌خورد، زیرا نشست‌های فقط‌نظارتی نمی‌توانند گفتار تولید کنند. نتیجهٔ `speechOutputVerified` آن بر افزایش بایت‌های خروجی صوت بلادرنگ در طول همان فراخوانی مبتنی است، بنابراین نشست استفاده‌شدهٔ مجدد با صوت قدیمی، بررسی تازه محسوب نمی‌شود.

برای انتقال‌های Chrome، `leave` پس از کلیک روی دکمهٔ Leave تماس در Meet، زبانهٔ متعلق به کاربر را که دوباره استفاده شده است باز نگه می‌دارد. زبانه‌هایی که OpenClaw باز کرده است پس از خروج بسته می‌شوند.

وقتی Chrome روی میزبان Gateway اجرا می‌شود از `transport: "chrome"` و وقتی روی یک Node جفت‌شده اجرا می‌شود از `transport: "chrome-node"` استفاده کنید. در هر دو حالت، ارائه‌دهندگان مدل و `openclaw_agent_consult` روی میزبان Gateway اجرا می‌شوند، بنابراین اعتبارنامه‌های مدل همان‌جا باقی می‌مانند. گزارش‌های حالت عامل هنگام راه‌اندازی پل، ارائه‌دهنده/مدل رفع‌شدهٔ رونویسی و پس از هر پاسخ ترکیب‌شده، ارائه‌دهنده/مدل/صدا/قالب خروجی/نرخ نمونه‌برداری TTS را شامل می‌شوند. `mode: "realtime"` خام همچنان به‌عنوان نام مستعار سازگاری قدیمی برای `mode: "agent"` پذیرفته می‌شود، اما دیگر در enum مربوط به `mode` ابزار نمایش داده نمی‌شود.

`create` با اتاقی مبتنی بر API و سیاست دسترسی صریح:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

پایان‌دادن به کنفرانس فعال یک اتاق شناخته‌شده:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

اعتبارسنجی ابتدا-شنیدن پیش از ادعای مفیدبودن یک جلسه:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

صحبت‌کردن در صورت درخواست:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "دقیقاً بگو: من اینجا هستم و گوش می‌دهم."
}
```

`status` در صورت موجودبودن، وضعیت سلامت Chrome را شامل می‌شود:

| فیلد                                                                 | معنا                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | به نظر می‌رسد Chrome داخل تماس Meet است                                                                              |
| `micMuted`                                                            | وضعیت میکروفون Meet به‌صورت بهترین تلاش                                                                                      |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | پیش از کارکردن گفتار، نمایهٔ مرورگر به ورود دستی، پذیرش توسط میزبان Meet، مجوزها یا تعمیر کنترل مرورگر نیاز دارد |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | آیا گفتار Chrome مدیریت‌شده اکنون مجاز است؛ `speechReady: false` یعنی OpenClaw عبارت معرفی/آزمایش را ارسال نکرده است   |
| `providerConnected` / `realtimeReady`                                 | وضعیت پل صدای بلادرنگ                                                                                            |
| `lastInputAt` / `lastOutputAt`                                        | آخرین صوت مشاهده‌شده از/ارسال‌شده به پل                                                                                |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | آیا خروجی رسانهٔ زبانهٔ Meet به‌طور فعال به دستگاه BlackHole پل هدایت شده است                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | ورودی بازگشتی هنگام فعال‌بودن پخش دستیار نادیده گرفته می‌شود                                                              |

## حالت‌های عامل و دوسویه

| حالت    | چه کسی پاسخ را تعیین می‌کند        | مسیر خروجی گفتار                     | زمان استفاده                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | عامل پیکربندی‌شدهٔ OpenClaw | زمان‌اجرای عادی TTS در OpenClaw            | وقتی رفتار «عامل من در جلسه است» را می‌خواهید        |
| `bidi`  | مدل صدای بلادرنگ      | پاسخ صوتی ارائه‌دهندهٔ صدای بلادرنگ | وقتی حلقهٔ مکالمهٔ صوتی با کمترین تأخیر را می‌خواهید |

حالت `agent`: ارائه‌دهندهٔ رونویسی بلادرنگ صوت جلسه را می‌شنود، رونویسی‌های نهایی شرکت‌کننده از طریق عامل پیکربندی‌شدهٔ OpenClaw مسیریابی می‌شوند و پاسخ از طریق TTS معمول OpenClaw بیان می‌شود. قطعه‌های نزدیک رونویسی نهایی پیش از مشورت با هم ادغام می‌شوند تا یک نوبت گفتاری چندین پاسخ جزئی قدیمی ایجاد نکند؛ هنگام ادامهٔ پخش صوت صف‌شدهٔ دستیار، ورودی بلادرنگ سرکوب می‌شود و پژواک‌های اخیر رونویسی که شبیه گفتار دستیار هستند پیش از مشورت نادیده گرفته می‌شوند تا بازگشت BlackHole باعث نشود عامل به گفتار خودش پاسخ دهد.

حالت `bidi`: مدل صدای بلادرنگ مستقیماً پاسخ می‌دهد و می‌تواند برای استدلال عمیق‌تر، اطلاعات جاری یا ابزارهای عادی OpenClaw، `openclaw_agent_consult` را فراخوانی کند. ابزار مشورت در پشت صحنه عامل عادی OpenClaw را با بافت رونویسی اخیر جلسه اجرا می‌کند و پاسخی کوتاه و مناسب گفتار برمی‌گرداند؛ در حالت `agent`، OpenClaw آن پاسخ را مستقیماً به TTS می‌فرستد و در حالت `bidi` مدل صدای بلادرنگ می‌تواند آن را بازگو کند. این حالت از همان سازوکار مشترک مشورت Voice Call استفاده می‌کند.

به‌صورت پیش‌فرض، مشورت‌ها با عامل `main` اجرا می‌شوند؛ برای هدایت یک مسیر Meet به فضای کاری، پیش‌فرض‌های مدل، سیاست ابزار، حافظه و تاریخچهٔ نشست یک عامل اختصاصی، `realtime.agentId` را تنظیم کنید. مشورت‌های حالت عامل از کلید نشست `agent:<id>:subagent:google-meet:<session>` مختص هر جلسه استفاده می‌کنند تا پرسش‌های بعدی بافت جلسه را حفظ کنند و هم‌زمان سیاست عادی عامل را به ارث ببرند. وقتی یک عامل در حالت عامل `google_meet` را فراخوانی می‌کند، نشست مشاور پیش از پاسخ‌دادن به گفتار شرکت‌کننده، از رونویسی جاری فراخواننده انشعاب می‌گیرد؛ نشست Meet جدا باقی می‌ماند تا پرسش‌های بعدی جلسه مستقیماً رونویسی فراخواننده را تغییر ندهند.

`realtime.toolPolicy` اجرای مشورت را کنترل می‌کند:

| سیاست           | رفتار                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | ابزار مشورت را در دسترس قرار می‌دهد؛ عامل عادی را به `read`، `web_search`، `web_fetch`، `x_search`، `memory_search`، `memory_get` محدود می‌کند |
| `owner`          | ابزار مشورت را در دسترس قرار می‌دهد؛ به عامل عادی اجازه می‌دهد از سیاست ابزار معمول خود استفاده کند                                                        |
| `none`           | ابزار مشورت را در اختیار مدل صدای بلادرنگ قرار نمی‌دهد                                                                       |

کلید نشست مشورت به هر نشست Meet محدود است، بنابراین فراخوانی‌های مشورت بعدی در طول همان جلسه از بافت مشورت قبلی دوباره استفاده می‌کنند.

پس از آن‌که Chrome کاملاً پیوست، بررسی آمادگی گفتاری را اجباری کنید:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

آزمون دود کامل پیوستن و صحبت‌کردن:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## فهرست بررسی آزمایش زنده

پیش از سپردن یک جلسه به عامل بدون نظارت:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

وضعیت موردانتظار Chrome-node:

- `googlemeet setup` کاملاً سبز است و وقتی Chrome-node انتقال پیش‌فرض باشد یا یک Node سنجاق شده باشد، `chrome-node-connected` را شامل می‌شود.
- `nodes status` نشان می‌دهد Node انتخاب‌شده متصل است و هر دو `googlemeet.chrome` و `browser.proxy` را اعلام می‌کند.
- زبانهٔ Meet می‌پیوندد و `test-speech` وضعیت سلامت Chrome را همراه با `inCall: true` برمی‌گرداند.

برای میزبان راه‌دور Chrome، مانند یک ماشین مجازی macOS در Parallels، کوتاه‌ترین بررسی امن پس از به‌روزرسانی Gateway یا ماشین مجازی:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

این کار پیش از آن‌که عامل یک زبانهٔ واقعی جلسه را باز کند، ثابت می‌کند Plugin مربوط به Gateway بارگذاری شده، Node ماشین مجازی با توکن جاری متصل است و پل صوتی Meet در دسترس است.

برای آزمون دود Twilio، از جلسه‌ای استفاده کنید که جزئیات شماره‌گیری تلفنی را ارائه می‌دهد:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

وضعیت مورد انتظار Twilio:

- `googlemeet setup` شامل بررسی‌های سبز `twilio-voice-call-plugin`، `twilio-voice-call-credentials` و `twilio-voice-call-webhook` است.
- `voicecall` پس از بارگذاری مجدد Gateway در CLI دردسترس است.
- نشست بازگردانده‌شده دارای `transport: "twilio"` و یک `twilio.voiceCallId` است.
- `openclaw logs --follow` نشان می‌دهد که TwiML مربوط به DTMF پیش از TwiML بلادرنگ ارائه شده و سپس یک پل بلادرنگ با پیام خوشامدگویی اولیه در صف ایجاد شده است.
- `googlemeet leave <sessionId>` تماس صوتی واگذارشده را قطع می‌کند.

## عیب‌یابی

### عامل نمی‌تواند ابزار Google Meet را ببیند

تأیید کنید Plugin فعال است و Gateway را دوباره بارگذاری کنید؛ عامل در حال اجرا فقط ابزارهای Plugin ثبت‌شده توسط فرایند فعلی Gateway را می‌بیند:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

در میزبان‌های Gateway غیر از macOS، `google_meet` قابل‌مشاهده باقی می‌ماند، اما کنش‌های پاسخ صوتی محلی Chrome پیش از رسیدن به پل صوتی مسدود می‌شوند. به‌جای مسیر پیش‌فرض عامل محلی Chrome، از `mode: "transcribe"`، شماره‌گیری Twilio یا یک میزبان macOS با `chrome-node` استفاده کنید.

### هیچ Node متصل و سازگار با Google Meet وجود ندارد

در میزبان Node:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

در میزبان Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node باید متصل باشد و `googlemeet.chrome` و نیز `browser.proxy` را فهرست کند؛ پیکربندی Gateway باید هر دو را مجاز بداند:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

اگر `googlemeet setup` در `chrome-node-connected` ناموفق بود، یا گزارش Gateway حاوی `gateway token mismatch` بود، Node را با توکن فعلی Gateway دوباره نصب یا راه‌اندازی کنید:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

سپس سرویس Node را دوباره بارگذاری کنید و این موارد را مجدداً اجرا کنید:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### مرورگر باز می‌شود، اما عامل نمی‌تواند بپیوندد

برای پیوستن‌های فقط‌مشاهده، `googlemeet test-listen` و برای پیوستن‌های بلادرنگ، `googlemeet test-speech` را اجرا کنید، سپس سلامت Chrome بازگردانده‌شده را بررسی کنید. اگر هرکدام `manualActionRequired: true` را گزارش کرد، `manualActionMessage` را به اپراتور نشان دهید و تا تکمیل کنش مرورگر، تلاش مجدد را متوقف کنید.

کنش‌های دستی رایج: وارد نمایه Chrome شوید؛ مهمان را از حساب میزبان Meet بپذیرید؛ هنگام نمایش اعلان بومی، مجوزهای میکروفون/دوربین Chrome را اعطا کنید؛ کادر گفت‌وگوی مجوز Meet را که گیر کرده است ببندید یا اصلاح کنید.

صرفاً به‌دلیل اینکه Meet می‌پرسد «آیا می‌خواهید افراد حاضر در جلسه صدای شما را بشنوند؟»، «وارد نشده است» را گزارش نکنید؛ این صفحه میانی انتخاب صدا در Meet است. OpenClaw در صورت امکان از طریق خودکارسازی مرورگر روی **Use microphone** کلیک می‌کند و همچنان منتظر وضعیت واقعی جلسه می‌ماند؛ برای حالت جایگزین مرورگر که فقط ایجاد می‌کند، ممکن است به‌جای آن روی **Continue without microphone** کلیک کند، زیرا ساخت URL به مسیر صوتی بلادرنگ نیاز ندارد.

### ایجاد جلسه ناموفق است

`googlemeet create` هنگام پیکربندی OAuth از `spaces.create` مربوط به API ‏Meet و در غیر این صورت از مرورگر Chrome در Node سنجاق‌شده استفاده می‌کند. موارد زیر را تأیید کنید:

- **ایجاد با API**: ‏`oauth.clientId` و `oauth.refreshToken` (یا متغیرهای محیطی منطبق `OPENCLAW_GOOGLE_MEET_*`) موجود هستند و توکن نوسازی پس از افزوده‌شدن پشتیبانی ایجاد صادر شده است؛ توکن‌های قدیمی‌تر ممکن است فاقد `meetings.space.created` باشند، بنابراین `openclaw googlemeet auth login --json` را دوباره اجرا کنید.
- **حالت جایگزین مرورگر**: ‏`defaultTransport: "chrome-node"` و `chromeNode.node` به یک Node متصل دارای `browser.proxy` و `googlemeet.chrome` اشاره می‌کنند؛ نمایه Chrome متعلق به OpenClaw در آن Node وارد شده و می‌تواند `https://meet.google.com/new` را باز کند.
- **تلاش‌های مجدد حالت جایگزین مرورگر**: پیش از بازکردن زبانه‌ای جدید، از یک `.../new` موجود یا زبانه اعلان حساب Google دوباره استفاده کنید؛ به‌جای بازکردن دستی زبانه‌ای دیگر، فراخوانی ابزار را دوباره امتحان کنید.
- **کنش دستی**: اگر ابزار `manualActionRequired: true` را بازگرداند، برای راهنمایی اپراتور از `browser.nodeId`، `browser.targetId`، `browserUrl` و `manualActionMessage` استفاده کنید؛ در یک حلقه تلاش مجدد نکنید.
- **صفحه میانی انتخاب صدا**: اگر Meet عبارت «آیا می‌خواهید افراد حاضر در جلسه صدای شما را بشنوند؟» را نشان داد، زبانه را باز نگه دارید. OpenClaw باید روی **Use microphone** یا (فقط برای ایجاد) **Continue without microphone** کلیک کند و همچنان منتظر URL تولیدشده بماند؛ اگر نتواند، خطا باید به `meet-audio-choice-required` اشاره کند، نه `google-login-required`.

### عامل می‌پیوندد، اما صحبت نمی‌کند

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

برای مسیر STT -> عامل OpenClaw -> TTS از `mode: "agent"` و برای حالت جایگزین صوتی بلادرنگ مستقیم از `mode: "bidi"` استفاده کنید. `mode: "transcribe"` عمداً هیچ پل پاسخ صوتی‌ای را آغاز نمی‌کند. برای عیب‌یابی فقط‌مشاهده، پس از صحبت شرکت‌کنندگان `openclaw googlemeet status --json <session-id>` را اجرا کنید و `captioning`، `transcriptLines` و `lastCaptionText` را بررسی کنید. اگر `inCall` درست است، اما `transcriptLines` همچنان `0` باقی می‌ماند، ممکن است زیرنویس‌های Meet غیرفعال باشند، از زمان نصب مشاهده‌گر کسی صحبت نکرده باشد، رابط کاربری Meet تغییر کرده باشد، یا زیرنویس زنده برای زبان/حساب جلسه دردسترس نباشد.

`googlemeet test-speech` همیشه مسیر بلادرنگ را بررسی می‌کند و گزارش می‌دهد که آیا برای آن فراخوانی، بایت‌های خروجی پل مشاهده شده‌اند یا خیر. اگر `speechOutputVerified` نادرست و `speechOutputTimedOut` درست باشد، ممکن است ارائه‌دهنده بلادرنگ گفته را پذیرفته باشد، اما OpenClaw ندیده باشد که بایت‌های خروجی جدید به پل صوتی Chrome برسند.

همچنین تأیید کنید: یک کلید ارائه‌دهنده بلادرنگ (`OPENAI_API_KEY` یا `GEMINI_API_KEY`) در میزبان Gateway دردسترس است؛ `BlackHole 2ch` در میزبان Chrome قابل‌مشاهده است؛ `sox` در آنجا وجود دارد؛ میکروفون/بلندگوی Meet از مسیر صوتی مجازی عبور می‌کنند (`doctor` باید برای پیوستن‌های بلادرنگ محلی Chrome، ‏`meet output routed: yes` را نشان دهد).

`googlemeet doctor [session-id]` نشست، Node، وضعیت حضور در تماس، دلیل کنش دستی، اتصال ارائه‌دهنده بلادرنگ، `realtimeReady`، فعالیت ورودی/خروجی صدا، آخرین زمان‌های صوتی، شمارنده‌های بایت و URL مرورگر را چاپ می‌کند. برای JSON خام از `googlemeet status [session-id] --json` و برای تأیید نوسازی OAuth بدون افشای توکن‌ها از `googlemeet doctor --oauth` (با افزودن `--meeting` یا `--create-space`) استفاده کنید.

اگر زمان عامل تمام شده و یک زبانه Meet از قبل باز است، بدون بازکردن زبانه‌ای دیگر آن را بررسی کنید:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

کنش ابزار معادل، `recover_current_tab` است: بدون بازکردن زبانه یا نشست جدید، یک زبانه Meet موجود را برای انتقال انتخاب‌شده (کنترل مرورگر محلی برای `chrome`، ‏Node پیکربندی‌شده برای `chrome-node`) متمرکز و بررسی می‌کند و مانع فعلی (ورود، پذیرش، مجوزها، وضعیت انتخاب صدا) را گزارش می‌دهد. فرمان CLI با Gateway پیکربندی‌شده ارتباط برقرار می‌کند که باید در حال اجرا باشد؛ `chrome-node` همچنین مستلزم اتصال Node است.

### بررسی‌های راه‌اندازی Twilio ناموفق‌اند

`twilio-voice-call-plugin` زمانی ناموفق است که `voice-call` مجاز یا فعال نباشد: آن را به `plugins.allow` اضافه کنید، `plugins.entries.voice-call` را فعال کنید و Gateway را دوباره بارگذاری کنید.

`twilio-voice-call-credentials` زمانی ناموفق است که بخش پشتی Twilio فاقد SID حساب، توکن احراز هویت یا شماره تماس‌گیرنده باشد:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` زمانی ناموفق است که `voice-call` هیچ Webhook عمومی در معرض دسترسی نداشته باشد، یا `publicUrl` به فضای شبکه loopback/خصوصی اشاره کند. از `localhost`، ‏`127.0.0.1`، ‏`0.0.0.0`، ‏`10.x`، ‏`172.16.x`-`172.31.x`، ‏`192.168.x`، ‏`169.254.x`، ‏`fc00::/7` یا `fd00::/8` به‌عنوان `publicUrl` استفاده نکنید؛ فراخوانی‌های برگشتی اپراتور مخابراتی نمی‌توانند به آن‌ها دسترسی پیدا کنند. `plugins.entries.voice-call.config.publicUrl` را روی یک URL عمومی تنظیم کنید، یا یک تونل/دسترسی Tailscale پیکربندی کنید:

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

برای توسعه محلی، به‌جای URL میزبان خصوصی از تونل یا دسترسی Tailscale استفاده کنید:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // یا
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Gateway را دوباره راه‌اندازی یا بارگذاری کنید، سپس:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` به‌طور پیش‌فرض فقط آمادگی را بررسی می‌کند. برای یک شماره مشخص اجرای آزمایشی انجام دهید:

```bash
openclaw voicecall smoke --to "+15555550123"
```

فقط برای برقراری عمدی یک تماس خروجی واقعی، `--yes` را اضافه کنید:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تماس Twilio آغاز می‌شود، اما هرگز وارد جلسه نمی‌شود

تأیید کنید رویداد Meet جزئیات شماره‌گیری تلفنی را ارائه می‌کند و شماره دقیق شماره‌گیری را همراه با PIN یا یک توالی DTMF سفارشی وارد کنید:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

برای ایجاد مکث پیش از PIN، از `w` در ابتدای `--dtmf-sequence` یا ویرگول در آن استفاده کنید.

اگر تماس ایجاد شده است، اما فهرست حاضران Meet هرگز شرکت‌کننده شماره‌گیری‌شده را نشان نمی‌دهد:

- `openclaw googlemeet doctor <session-id>`: شناسه تماس واگذارشده Twilio، اینکه آیا DTMF در صف قرار گرفته است، و اینکه آیا پیام خوشامدگویی اولیه درخواست شده است را تأیید کنید.
- `openclaw voicecall status --call-id <id>`: تأیید کنید تماس همچنان فعال است.
- `openclaw voicecall tail`: تأیید کنید Webhookهای Twilio به Gateway می‌رسند.
- `openclaw logs --follow`: به‌دنبال توالی Twilio Meet بگردید: Google Meet پیوستن را واگذار می‌کند، Voice Call ‏TwiML مربوط به DTMF پیش از اتصال را ذخیره و ارائه می‌کند، Voice Call ‏TwiML بلادرنگ را برای تماس Twilio ارائه می‌کند، سپس Google Meet گفتار آغازین را با `voicecall.speak` درخواست می‌کند.
- `openclaw googlemeet setup --transport twilio` را دوباره اجرا کنید؛ بررسی سبز راه‌اندازی الزامی است، اما درست‌بودن توالی PIN جلسه را اثبات نمی‌کند.
- تأیید کنید شماره شماره‌گیری متعلق به همان دعوت‌نامه Meet و همان منطقه PIN است.
- اگر Meet دیر پاسخ می‌دهد یا رونوشت تماس پس از ارسال DTMF پیش از اتصال همچنان اعلان PIN را نشان می‌دهد، `voiceCall.dtmfDelayMs` را از مقدار پیش‌فرض 12 ثانیه افزایش دهید.
- اگر شرکت‌کننده می‌پیوندد، اما پیام خوشامدگویی را نمی‌شنوید، `openclaw logs --follow` را برای درخواست `voicecall.speak` پس از DTMF و نیز پخش TTS جریان رسانه یا حالت جایگزین Twilio با `<Say>` بررسی کنید. اگر رونوشت همچنان «PIN جلسه را وارد کنید» را نشان می‌دهد، بخش تلفنی هنوز به اتاق Meet نپیوسته است، بنابراین شرکت‌کنندگان گفتار را نخواهند شنید.

اگر Webhookها نمی‌رسند، ابتدا Plugin ‏Voice Call را عیب‌یابی کنید: ارائه‌دهنده باید بتواند به `plugins.entries.voice-call.config.publicUrl` یا تونل پیکربندی‌شده دسترسی پیدا کند. [عیب‌یابی تماس صوتی](/fa/plugins/voice-call#troubleshooting) را ببینید.

## یادداشت‌ها

API رسمی رسانه Google Meet دریافت‌محور است، بنابراین صحبت‌کردن در تماس همچنان به یک مسیر شرکت‌کننده نیاز دارد. این Plugin این مرز را آشکار نگه می‌دارد: Chrome مشارکت مرورگری و مسیریابی صوتی محلی را مدیریت می‌کند؛ Twilio مشارکت از طریق شماره‌گیری تلفنی را مدیریت می‌کند.

حالت‌های پاسخ صوتی Chrome به `BlackHole 2ch` به‌همراه یکی از موارد زیر نیاز دارند:

- `chrome.audioInputCommand` به‌همراه `chrome.audioOutputCommand`: ‏OpenClaw مالک پل ارتباطی است و بین این فرمان‌ها و ارائه‌دهندهٔ انتخاب‌شده، صدا را در `chrome.audioFormat` انتقال می‌دهد. حالت `agent` از رونویسی بلادرنگ به‌همراه TTS معمولی استفاده می‌کند؛ حالت `bidi` از ارائه‌دهندهٔ صدای بلادرنگ استفاده می‌کند. مسیر پیش‌فرض، PCM16 با نرخ 24 kHz و `chrome.audioBufferBytes: 4096` است؛ G.711 mu-law با نرخ 8 kHz همچنان برای جفت‌فرمان‌های قدیمی در دسترس است.
- `chrome.audioBridgeCommand`: یک فرمان پل ارتباطی خارجی مالک کل مسیر صوتی محلی است و باید پس از راه‌اندازی یا اعتبارسنجی دیمن خود خارج شود. فقط برای `bidi` معتبر است، زیرا حالت `agent` برای TTS به دسترسی مستقیم به جفت‌فرمان نیاز دارد.

با پل Chrome مبتنی بر جفت‌فرمان، `chrome.bargeInInputCommand` می‌تواند به یک میکروفون محلی جداگانه گوش دهد و هنگامی که انسانی شروع به صحبت می‌کند، پخش دستیار را قطع کند؛ در نتیجه، حتی وقتی ورودی مشترک لوپ‌بک BlackHole هنگام پخش دستیار موقتاً متوقف می‌شود، گفتار انسان بر خروجی دستیار تقدم دارد. مانند `chrome.audioInputCommand`/`chrome.audioOutputCommand`، این یک فرمان محلی است که اپراتور پیکربندی می‌کند: از یک مسیر فرمان مورداعتماد یا فهرست آرگومان صریح استفاده کنید و هرگز اسکریپتی را از مکانی نامطمئن به کار نبرید.

برای صدای دوطرفهٔ شفاف، خروجی Meet و میکروفون Meet را از طریق دستگاه‌های مجازی جداگانه یا یک گراف دستگاه مجازی به‌سبک Loopback مسیریابی کنید؛ یک دستگاه مشترک BlackHole می‌تواند صدای سایر شرکت‌کنندگان را به تماس بازتاب دهد.

`googlemeet speak` پل صوتی فعال پاسخ‌گویی را برای یک نشست Chrome فعال می‌کند؛ `googlemeet leave` آن را متوقف می‌کند (و برای نشست‌های Twilio که از طریق Voice Call واگذار شده‌اند، تماس زیربنایی را قطع می‌کند). برای بستن کنفرانس فعال Google Meet در فضایی که با API مدیریت می‌شود نیز از `googlemeet end-active-conference` استفاده کنید.

## مرتبط

- [Plugin تماس صوتی](/fa/plugins/voice-call)
- [حالت مکالمه](/fa/nodes/talk)
- [ساخت Pluginها](/fa/plugins/building-plugins)
