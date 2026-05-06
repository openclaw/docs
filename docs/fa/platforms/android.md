---
read_when:
    - جفت‌سازی یا اتصال مجدد Node اندروید
    - اشکال‌زدایی کشف Gateway یا احراز هویت در Android
    - تأیید همسانی تاریخچهٔ چت در کلاینت‌ها
summary: 'برنامه Android (Node): دستورالعمل عملیاتی اتصال + سطح فرمان اتصال/گفتگو/صدا/بوم'
title: برنامه Android
x-i18n:
    generated_at: "2026-05-06T09:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
برنامه Android هنوز به‌صورت عمومی منتشر نشده است. کد منبع در [مخزن OpenClaw](https://github.com/openclaw/openclaw) زیر `apps/android` در دسترس است. می‌توانید آن را خودتان با Java 17 و Android SDK (`./gradlew :app:assemblePlayDebug`) بسازید. برای دستورالعمل‌های ساخت، [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) را ببینید.
</Note>

## نمای کلی پشتیبانی

- نقش: برنامه گره همراه (Android میزبان Gateway نیست).
- Gateway لازم است: بله (آن را روی macOS، Linux، یا Windows از طریق WSL2 اجرا کنید).
- نصب: [شروع به کار](/fa/start/getting-started) + [جفت‌سازی](/fa/channels/pairing).
- Gateway: [راهنمای عملیاتی](/fa/gateway) + [پیکربندی](/fa/gateway/configuration).
  - پروتکل‌ها: [پروتکل Gateway](/fa/gateway/protocol) (گره‌ها + سطح کنترل).

## کنترل سیستم

کنترل سیستم (launchd/systemd) روی میزبان Gateway قرار دارد. [Gateway](/fa/gateway) را ببینید.

## راهنمای عملیاتی اتصال

برنامه گره Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android مستقیماً به WebSocket Gateway وصل می‌شود و از جفت‌سازی دستگاه (`role: node`) استفاده می‌کند.

برای Tailscale یا میزبان‌های عمومی، Android به یک نقطه پایانی امن نیاز دارد:

- ترجیحی: Tailscale Serve / Funnel با `https://<magicdns>` / `wss://<magicdns>`
- همچنین پشتیبانی می‌شود: هر URL دیگر `wss://` برای Gateway با یک نقطه پایانی واقعی TLS
- `ws://` متنِ آشکار همچنان روی آدرس‌های LAN خصوصی / میزبان‌های `.local`، به‌علاوه `localhost`، `127.0.0.1`، و پل شبیه‌ساز Android (`10.0.2.2`) پشتیبانی می‌شود

### پیش‌نیازها

- می‌توانید Gateway را روی دستگاه «اصلی» اجرا کنید.
- دستگاه/شبیه‌ساز Android می‌تواند به WebSocket گیت‌وی دسترسی داشته باشد:
  - همان LAN با mDNS/NSD، **یا**
  - همان tailnet در Tailscale با Wide-Area Bonjour / unicast DNS-SD (پایین را ببینید)، **یا**
  - میزبان/درگاه دستی گیت‌وی (گزینه جایگزین)
- جفت‌سازی موبایل روی tailnet/عمومی از نقاط پایانی IP خام tailnet با `ws://` استفاده **نمی‌کند**. به‌جای آن از Tailscale Serve یا یک URL دیگر `wss://` استفاده کنید.
- می‌توانید CLI (`openclaw`) را روی دستگاه گیت‌وی (یا از طریق SSH) اجرا کنید.

### 1) Gateway را راه‌اندازی کنید

```bash
openclaw gateway --port 18789 --verbose
```

در لاگ‌ها تأیید کنید چیزی شبیه این می‌بینید:

- `listening on ws://0.0.0.0:18789`

برای دسترسی راه دور Android از طریق Tailscale، به‌جای اتصال خام به tailnet، Serve/Funnel را ترجیح دهید:

```bash
openclaw gateway --tailscale serve
```

این به Android یک نقطه پایانی امن `wss://` / `https://` می‌دهد. راه‌اندازی ساده `gateway.bind: "tailnet"` برای جفت‌سازی راه دور اولیه Android کافی نیست، مگر اینکه TLS را جداگانه خاتمه دهید.

### 2) کشف را تأیید کنید (اختیاری)

از دستگاه گیت‌وی:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

نکته‌های بیشتر برای عیب‌یابی: [Bonjour](/fa/gateway/bonjour).

اگر دامنه کشف گستره‌وسیع را هم پیکربندی کرده‌اید، با این مقایسه کنید:

```bash
openclaw gateway discover --json
```

این فرمان `local.` به‌علاوه دامنه گستره‌وسیع پیکربندی‌شده را در یک گذر نشان می‌دهد و به‌جای راهنمایی‌های فقط TXT، از نقطه پایانی سرویس resolveشده استفاده می‌کند.

#### کشف Tailnet (وین ⇄ لندن) از طریق unicast DNS-SD

کشف Android NSD/mDNS از شبکه‌ها عبور نمی‌کند. اگر گره Android و گیت‌وی روی شبکه‌های متفاوت هستند اما از طریق Tailscale متصل‌اند، به‌جای آن از Wide-Area Bonjour / unicast DNS-SD استفاده کنید.

کشف به‌تنهایی برای جفت‌سازی Android روی tailnet/عمومی کافی نیست. مسیر کشف‌شده همچنان به یک نقطه پایانی امن (`wss://` یا Tailscale Serve) نیاز دارد:

1. یک ناحیه DNS-SD (مثلاً `openclaw.internal.`) روی میزبان گیت‌وی راه‌اندازی کنید و رکوردهای `_openclaw-gw._tcp` را منتشر کنید.
2. split DNS در Tailscale را برای دامنه انتخابی خود پیکربندی کنید تا به آن سرور DNS اشاره کند.

جزئیات و نمونه پیکربندی CoreDNS: [Bonjour](/fa/gateway/bonjour).

### 3) از Android وصل شوید

در برنامه Android:

- برنامه اتصال گیت‌وی خود را از طریق یک **سرویس foreground** زنده نگه می‌دارد (اعلان پایدار).
- زبانه **Connect** را باز کنید.
- از حالت **Setup Code** یا **Manual** استفاده کنید.
- اگر کشف مسدود است، از میزبان/درگاه دستی در **Advanced controls** استفاده کنید. برای میزبان‌های LAN خصوصی، `ws://` همچنان کار می‌کند. برای میزبان‌های Tailscale/عمومی، TLS را روشن کنید و از یک نقطه پایانی `wss://` / Tailscale Serve استفاده کنید.

پس از نخستین جفت‌سازی موفق، Android هنگام اجرا به‌صورت خودکار دوباره وصل می‌شود:

- نقطه پایانی دستی (اگر فعال باشد)، در غیر این صورت
- آخرین گیت‌وی کشف‌شده (با بهترین تلاش).

### سیگنال‌های زنده بودن حضور

پس از اتصال نشست گره احراز هویت‌شده، و زمانی که برنامه به پس‌زمینه می‌رود در حالی که سرویس
foreground همچنان وصل است، Android با
`event: "node.presence.alive"`، `node.event` را فراخوانی می‌کند. گیت‌وی این را فقط پس از اینکه هویت دستگاه گره احراز هویت‌شده شناخته شود، به‌عنوان `lastSeenAtMs`/`lastSeenReason` روی فراداده
گره/دستگاه جفت‌شده ثبت می‌کند.

برنامه فقط زمانی سیگنال را با موفقیت ثبت‌شده حساب می‌کند که پاسخ گیت‌وی شامل
`handled: true` باشد. گیت‌وی‌های قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ
سازگار است، اما به‌عنوان به‌روزرسانی پایدار آخرین مشاهده حساب نمی‌شود.

### 4) جفت‌سازی را تأیید کنید (CLI)

روی دستگاه گیت‌وی:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

جزئیات جفت‌سازی: [جفت‌سازی](/fa/channels/pairing).

اختیاری: اگر گره Android همیشه از یک زیرشبکه کاملاً کنترل‌شده وصل می‌شود،
می‌توانید با CIDRهای صریح یا IPهای دقیق، تأیید خودکار اولیه گره را فعال کنید:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

این به‌صورت پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه `role: node` بدون
scopeهای درخواستی اعمال می‌شود. جفت‌سازی اپراتور/مرورگر و هرگونه تغییر نقش، scope، فراداده، یا
کلید عمومی همچنان به تأیید دستی نیاز دارد.

### 5) تأیید کنید گره وصل است

- از طریق وضعیت گره‌ها:

  ```bash
  openclaw nodes status
  ```

- از طریق Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) چت + تاریخچه

زبانه Chat در Android از انتخاب نشست پشتیبانی می‌کند (پیش‌فرض `main`، به‌علاوه نشست‌های موجود دیگر):

- تاریخچه: `chat.history` (برای نمایش نرمال‌سازی‌شده؛ برچسب‌های دستورالعمل درون‌خطی
  از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (از جمله
  `<tool_call>...</tool_call>`، `<function_call>...</function_call>`،
  `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و
  بلوک‌های فراخوانی ابزار کوتاه‌شده) و توکن‌های کنترلی مدل ASCII/تمام‌عرض نشت‌کرده
  حذف می‌شوند، ردیف‌های دستیار با فقط توکن خاموش مانند `NO_REPLY` /
  `no_reply` دقیق حذف می‌شوند، و ردیف‌های بسیار بزرگ می‌توانند با جای‌نگهدار جایگزین شوند)
- ارسال: `chat.send`
- به‌روزرسانی‌های push (با بهترین تلاش): `chat.subscribe` → `event:"chat"`

### 7) Canvas + دوربین

#### میزبان Canvas در Gateway (توصیه‌شده برای محتوای وب)

اگر می‌خواهید گره HTML/CSS/JS واقعی را نشان دهد که عامل می‌تواند روی دیسک ویرایش کند، گره را به میزبان Canvas در Gateway اشاره دهید.

<Note>
گره‌ها Canvas را از سرور HTTP گیت‌وی بارگذاری می‌کنند (همان درگاه `gateway.port`، پیش‌فرض `18789`).
</Note>

1. فایل `~/.openclaw/workspace/canvas/index.html` را روی میزبان گیت‌وی ایجاد کنید.

2. گره را به آن هدایت کنید (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختیاری): اگر هر دو دستگاه روی Tailscale هستند، به‌جای `.local` از نام MagicDNS یا IP tailnet استفاده کنید، مثلاً `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

این سرور یک کلاینت live-reload را به HTML تزریق می‌کند و با تغییر فایل‌ها reload می‌شود.
میزبان A2UI در `http://<gateway-host>:18789/__openclaw__/a2ui/` قرار دارد.

فرمان‌های Canvas (فقط foreground):

- `canvas.eval`، `canvas.snapshot`، `canvas.navigate` (برای بازگشت به اسکفولد پیش‌فرض از `{"url":""}` یا `{"url":"/"}` استفاده کنید). `canvas.snapshot` مقدار `{ format, base64 }` را برمی‌گرداند (پیش‌فرض `format="jpeg"`).
- A2UI: `canvas.a2ui.push`، `canvas.a2ui.reset` (نام مستعار legacy یعنی `canvas.a2ui.pushJSONL`)

فرمان‌های دوربین (فقط foreground؛ وابسته به مجوز):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

برای پارامترها و کمک‌کننده‌های CLI، [گره دوربین](/fa/nodes/camera) را ببینید.

### 8) صدا + سطح فرمان گسترده Android

- زبانه Voice: Android دو حالت capture صریح دارد. **Mic** یک نشست دستی در زبانه Voice است که هر مکث را به‌عنوان یک نوبت چت ارسال می‌کند و وقتی برنامه از foreground خارج شود یا کاربر زبانه Voice را ترک کند، متوقف می‌شود. **Talk** حالت Talk Mode پیوسته است و تا زمانی که خاموش شود یا گره قطع شود به گوش دادن ادامه می‌دهد.
- Talk Mode پیش از شروع capture، سرویس foreground موجود را از `dataSync` به `dataSync|microphone` ارتقا می‌دهد، سپس وقتی Talk Mode متوقف می‌شود آن را پایین می‌آورد. Android 14+ به اعلان `FOREGROUND_SERVICE_MICROPHONE`، مجوز زمان اجرای `RECORD_AUDIO`، و نوع سرویس میکروفون در زمان اجرا نیاز دارد.
- پاسخ‌های گفتاری از `talk.speak` از طریق ارائه‌دهنده Talk پیکربندی‌شده در گیت‌وی استفاده می‌کنند. TTS محلی سیستم فقط زمانی استفاده می‌شود که `talk.speak` در دسترس نباشد.
- بیدارباش صوتی در UX/زمان اجرای Android غیرفعال می‌ماند.
- خانواده‌های فرمان اضافی Android (دسترس‌پذیری به دستگاه + مجوزها بستگی دارد):
  - `device.status`، `device.info`، `device.permissions`، `device.health`
  - `notifications.list`، `notifications.actions` (پایین‌تر [بازارسال اعلان‌ها](#notification-forwarding) را ببینید)
  - `photos.latest`
  - `contacts.search`، `contacts.add`
  - `calendar.events`، `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`، `motion.pedometer`

## نقاط ورود دستیار

Android از اجرای OpenClaw از طریق trigger دستیار سیستم (Google
Assistant) پشتیبانی می‌کند. وقتی پیکربندی شده باشد، نگه داشتن دکمه خانه یا گفتن "Hey Google, ask
OpenClaw..." برنامه را باز می‌کند و prompt را به composer چت تحویل می‌دهد.

این از فراداده **App Actions** در Android استفاده می‌کند که در manifest برنامه اعلام شده است. هیچ
پیکربندی اضافه‌ای در سمت گیت‌وی لازم نیست -- intent دستیار
کاملاً توسط برنامه Android مدیریت می‌شود و به‌عنوان پیام چت عادی بازارسال می‌شود.

<Note>
دسترس‌پذیری App Actions به دستگاه، نسخه Google Play Services،
و اینکه کاربر OpenClaw را به‌عنوان برنامه دستیار پیش‌فرض تنظیم کرده باشد بستگی دارد.
</Note>

## بازارسال اعلان‌ها

Android می‌تواند اعلان‌های دستگاه را به‌عنوان رویداد به گیت‌وی بازارسال کند. چندین کنترل به شما امکان می‌دهد مشخص کنید کدام اعلان‌ها و در چه زمانی بازارسال شوند.

| کلید                              | نوع           | توضیح                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | فقط اعلان‌های این نام‌های بسته بازارسال شوند. اگر تنظیم شود، همه بسته‌های دیگر نادیده گرفته می‌شوند.      |
| `notifications.denyPackages`     | string[]       | هرگز اعلان‌های این نام‌های بسته بازارسال نشوند. پس از `allowPackages` اعمال می‌شود.              |
| `notifications.quietHours.start` | string (HH:mm) | شروع بازه ساعت‌های سکوت (زمان محلی دستگاه). اعلان‌ها در طول این بازه سرکوب می‌شوند. |
| `notifications.quietHours.end`   | string (HH:mm) | پایان بازه ساعت‌های سکوت.                                                                        |
| `notifications.rateLimit`        | number         | بیشینه اعلان‌های بازارسال‌شده برای هر بسته در هر دقیقه. اعلان‌های اضافی حذف می‌شوند.         |

انتخابگر اعلان همچنین برای رویدادهای اعلان بازارسال‌شده رفتار امن‌تری به‌کار می‌گیرد و از بازارسال تصادفی اعلان‌های حساس سیستم جلوگیری می‌کند.

نمونه پیکربندی:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
بازارسال اعلان‌ها به مجوز Android Notification Listener نیاز دارد. برنامه هنگام راه‌اندازی این مورد را درخواست می‌کند.
</Note>

## مرتبط

- [برنامه iOS](/fa/platforms/ios)
- [گره‌ها](/fa/nodes)
- [عیب‌یابی گره Android](/fa/nodes/troubleshooting)
