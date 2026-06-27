---
read_when:
    - جفت‌سازی یا اتصال مجدد گره Android
    - اشکال‌زدایی کشف Gateway یا احراز هویت Android
    - تأیید برابری تاریخچه چت میان کلاینت‌ها
summary: 'برنامه Android (node): راهنمای عملیاتی اتصال + سطح فرمان Connect/Chat/Voice/Canvas'
title: برنامه Android
x-i18n:
    generated_at: "2026-06-27T18:05:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
برنامه رسمی Android در [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) در دسترس است. این برنامه یک نود همراه است و به یک OpenClaw Gateway در حال اجرا نیاز دارد. کد منبع نیز در [مخزن OpenClaw](https://github.com/openclaw/openclaw) زیر `apps/android` در دسترس است؛ برای دستورالعمل‌های ساخت، [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) را ببینید.
</Note>

## نمای کلی پشتیبانی

- نقش: برنامه نود همراه (Android میزبان Gateway نیست).
- Gateway لازم است: بله (آن را روی macOS، Linux، یا Windows از طریق WSL2 اجرا کنید).
- نصب: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) برای برنامه، [شروع به کار](/fa/start/getting-started) برای Gateway، سپس [جفت‌سازی](/fa/channels/pairing).
- Gateway: [راهنمای عملیاتی](/fa/gateway) + [پیکربندی](/fa/gateway/configuration).
  - پروتکل‌ها: [پروتکل Gateway](/fa/gateway/protocol) (نودها + صفحه کنترل).

## کنترل سیستم

کنترل سیستم (launchd/systemd) روی میزبان Gateway قرار دارد. [Gateway](/fa/gateway) را ببینید.

## راهنمای عملیاتی اتصال

برنامه نود Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android مستقیما به WebSocketِ Gateway متصل می‌شود و از جفت‌سازی دستگاه (`role: node`) استفاده می‌کند.

برای Tailscale یا میزبان‌های عمومی، Android به یک نقطه پایانی امن نیاز دارد:

- ترجیحی: Tailscale Serve / Funnel با `https://<magicdns>` / `wss://<magicdns>`
- همچنین پشتیبانی می‌شود: هر URL دیگر `wss://` برای Gateway با یک نقطه پایانی TLS واقعی
- `ws://` بدون رمزنگاری همچنان روی نشانی‌های LAN خصوصی / میزبان‌های `.local`، به‌علاوه `localhost`، `127.0.0.1`، و پل شبیه‌ساز Android (`10.0.2.2`) پشتیبانی می‌شود

### پیش‌نیازها

- می‌توانید Gateway را روی ماشین «اصلی» اجرا کنید.
- دستگاه/شبیه‌ساز Android می‌تواند به WebSocketِ Gateway دسترسی داشته باشد:
  - همان LAN با mDNS/NSD، **یا**
  - همان tailnet در Tailscale با استفاده از Wide-Area Bonjour / unicast DNS-SD (پایین را ببینید)، **یا**
  - میزبان/درگاه Gateway به‌صورت دستی (راه fallback)
- جفت‌سازی موبایل روی tailnet/عمومی از نقطه‌های پایانی خام tailnet IP با `ws://` استفاده **نمی‌کند**. به‌جای آن از Tailscale Serve یا یک URL دیگر `wss://` استفاده کنید.
- می‌توانید CLI (`openclaw`) را روی ماشین Gateway (یا از طریق SSH) اجرا کنید.

### 1) Gateway را شروع کنید

```bash
openclaw gateway --port 18789 --verbose
```

در لاگ‌ها تأیید کنید چیزی شبیه این می‌بینید:

- `listening on ws://0.0.0.0:18789`

برای دسترسی Android از راه دور از طریق Tailscale، به‌جای bind خام tailnet، Serve/Funnel را ترجیح دهید:

```bash
openclaw gateway --tailscale serve
```

این کار یک نقطه پایانی امن `wss://` / `https://` به Android می‌دهد. تنظیم ساده `gateway.bind: "tailnet"` برای جفت‌سازی اولیه Android از راه دور کافی نیست، مگر اینکه TLS را جداگانه هم terminate کنید.

### 2) کشف را تأیید کنید (اختیاری)

از ماشین Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

یادداشت‌های بیشتر برای اشکال‌زدایی: [Bonjour](/fa/gateway/bonjour).

اگر یک دامنه کشف گسترده را هم پیکربندی کرده‌اید، با این مقایسه کنید:

```bash
openclaw gateway discover --json
```

این دستور `local.` به‌علاوه دامنه گسترده پیکربندی‌شده را در یک عبور نشان می‌دهد و به‌جای hintهای فقط TXT، از نقطه پایانی سرویس resolve‌شده استفاده می‌کند.

#### کشف tailnet (وین ⇄ لندن) از طریق unicast DNS-SD

کشف NSD/mDNS در Android از شبکه‌ها عبور نمی‌کند. اگر نود Android و Gateway شما روی شبکه‌های متفاوت هستند اما از طریق Tailscale متصل‌اند، به‌جای آن از Wide-Area Bonjour / unicast DNS-SD استفاده کنید.

کشف به‌تنهایی برای جفت‌سازی Android روی tailnet/عمومی کافی نیست. مسیر کشف‌شده همچنان به یک نقطه پایانی امن (`wss://` یا Tailscale Serve) نیاز دارد:

1. یک zone برای DNS-SD (مثلا `openclaw.internal.`) روی میزبان Gateway راه‌اندازی کنید و رکوردهای `_openclaw-gw._tcp` را منتشر کنید.
2. split DNS در Tailscale را برای دامنه انتخابی خود، با اشاره به آن سرور DNS، پیکربندی کنید.

جزئیات و نمونه پیکربندی CoreDNS: [Bonjour](/fa/gateway/bonjour).

### 3) از Android متصل شوید

در برنامه Android:

- برنامه اتصال Gateway خود را از طریق یک **سرویس foreground** زنده نگه می‌دارد (اعلان پایدار).
- برگه **اتصال** را باز کنید.
- از حالت **کد راه‌اندازی** یا **دستی** استفاده کنید.
- اگر کشف مسدود است، از میزبان/درگاه دستی در **کنترل‌های پیشرفته** استفاده کنید. برای میزبان‌های LAN خصوصی، `ws://` همچنان کار می‌کند. برای میزبان‌های Tailscale/عمومی، TLS را روشن کنید و از یک نقطه پایانی `wss://` / Tailscale Serve استفاده کنید.

پس از نخستین جفت‌سازی موفق، Android هنگام اجرا به‌صورت خودکار دوباره وصل می‌شود:

- نقطه پایانی دستی (اگر فعال باشد)، در غیر این صورت
- آخرین Gateway کشف‌شده (بهترین تلاش).

### Beaconهای زنده بودن حضور

پس از اتصال نشست نود احراز هویت‌شده، و هنگامی که برنامه در حالی به پس‌زمینه می‌رود که سرویس foreground هنوز متصل است، Android `node.event` را با `event: "node.presence.alive"` فراخوانی می‌کند. Gateway این را تنها پس از شناخته شدن هویت دستگاه نود احراز هویت‌شده، به‌عنوان `lastSeenAtMs`/`lastSeenReason` در فراداده نود/دستگاه جفت‌شده ثبت می‌کند.

برنامه beacon را فقط زمانی با موفقیت ثبت‌شده حساب می‌کند که پاسخ Gateway شامل `handled: true` باشد. Gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تأیید کنند؛ آن پاسخ سازگار است، اما به‌عنوان به‌روزرسانی پایدار last-seen حساب نمی‌شود.

### 4) جفت‌سازی را تأیید کنید (CLI)

روی ماشین Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

جزئیات جفت‌سازی: [جفت‌سازی](/fa/channels/pairing).

اختیاری: اگر نود Android همیشه از یک زیرشبکه کاملا کنترل‌شده متصل می‌شود، می‌توانید با CIDRهای صریح یا IPهای دقیق، تأیید خودکار نود در نخستین اتصال را فعال کنید:

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

این قابلیت به‌صورت پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه `role: node` بدون scopeهای درخواستی اعمال می‌شود. جفت‌سازی operator/browser و هرگونه تغییر در نقش، scope، فراداده، یا کلید عمومی همچنان به تأیید دستی نیاز دارد.

### 5) تأیید کنید نود متصل است

- از طریق وضعیت نودها:

  ```bash
  openclaw nodes status
  ```

- از طریق Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) چت + تاریخچه

برگه چت Android از انتخاب نشست پشتیبانی می‌کند (پیش‌فرض `main`، به‌علاوه نشست‌های موجود دیگر):

- تاریخچه: `chat.history` (برای نمایش نرمال‌سازی‌شده؛ تگ‌های directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML فراخوانی ابزار در متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شده فراخوانی ابزار) و توکن‌های کنترلی مدل به ASCII/تمام‌عرض که نشت کرده‌اند حذف می‌شوند، ردیف‌های assistant با توکن کاملا خاموش مانند `NO_REPLY` / `no_reply` دقیق نادیده گرفته می‌شوند، و ردیف‌های بیش‌ازحد بزرگ می‌توانند با placeholder جایگزین شوند)
- ارسال: `chat.send`
- به‌روزرسانی‌های push (بهترین تلاش): `chat.subscribe` → `event:"chat"`

### 7) Canvas + دوربین

#### میزبان Canvas در Gateway (توصیه‌شده برای محتوای وب)

اگر می‌خواهید نود HTML/CSS/JS واقعی را نشان دهد که agent بتواند روی دیسک ویرایش کند، نود را به میزبان canvas در Gateway اشاره دهید.

<Note>
نودها canvas را از سرور HTTP Gateway بارگذاری می‌کنند (همان درگاه `gateway.port`، پیش‌فرض `18789`).
</Note>

1. روی میزبان Gateway فایل `~/.openclaw/workspace/canvas/index.html` را ایجاد کنید.

2. نود را به آن هدایت کنید (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختیاری): اگر هر دو دستگاه روی Tailscale هستند، به‌جای `.local` از نام MagicDNS یا tailnet IP استفاده کنید، مثلا `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

این سرور یک کلاینت live-reload را به HTML تزریق می‌کند و هنگام تغییر فایل‌ها دوباره بارگذاری می‌کند.
Gateway همچنین `/__openclaw__/a2ui/` را سرو می‌کند، اما برنامه Android صفحه‌های A2UI راه دور را فقط برای render در نظر می‌گیرد. فرمان‌های A2UI دارای action، پیش از اعمال پیام‌ها، از صفحه A2UI متعلق به برنامه و همراه برنامه استفاده می‌کنند.

فرمان‌های Canvas (فقط foreground):

- `canvas.eval`، `canvas.snapshot`، `canvas.navigate` (برای بازگشت به scaffold پیش‌فرض از `{"url":""}` یا `{"url":"/"}` استفاده کنید). `canvas.snapshot` مقدار `{ format, base64 }` را برمی‌گرداند (پیش‌فرض `format="jpeg"`).
- A2UI: `canvas.a2ui.push`، `canvas.a2ui.reset` (alias قدیمی `canvas.a2ui.pushJSONL`). این فرمان‌ها برای render دارای action از صفحه A2UI متعلق به برنامه و همراه برنامه استفاده می‌کنند.

فرمان‌های دوربین (فقط foreground؛ وابسته به مجوز):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

برای پارامترها و helperهای CLI، [نود دوربین](/fa/nodes/camera) را ببینید.

### 8) صدا + سطح فرمان گسترش‌یافته Android

- برگه صدا: Android دو حالت capture صریح دارد. **میکروفون** یک نشست دستی در برگه صدا است که هر مکث را به‌عنوان یک نوبت چت ارسال می‌کند و وقتی برنامه foreground را ترک کند یا کاربر از برگه صدا خارج شود متوقف می‌شود. **گفتگو** حالت Talk Mode پیوسته است و تا زمانی که خاموش شود یا نود قطع شود، به شنیدن ادامه می‌دهد.
- Talk Mode پیش از شروع capture، سرویس foreground موجود را از `connectedDevice` به `connectedDevice|microphone` ارتقا می‌دهد، سپس وقتی Talk Mode متوقف شد آن را تنزل می‌دهد. سرویس نود `FOREGROUND_SERVICE_CONNECTED_DEVICE` را همراه با `CHANGE_NETWORK_STATE` اعلام می‌کند؛ Android 14+ همچنین به اعلان `FOREGROUND_SERVICE_MICROPHONE`، اعطای runtime برای `RECORD_AUDIO`، و نوع سرویس microphone در زمان اجرا نیاز دارد.
- به‌صورت پیش‌فرض، Android Talk از تشخیص گفتار بومی، چت Gateway، و `talk.speak` از طریق provider پیکربندی‌شده Talk در Gateway استفاده می‌کند. TTS محلی سیستم فقط زمانی استفاده می‌شود که `talk.speak` در دسترس نباشد.
- Android Talk فقط زمانی از relay بلادرنگ Gateway استفاده می‌کند که `talk.realtime.mode` برابر `realtime` و `talk.realtime.transport` برابر `gateway-relay` باشد.
- wake صوتی در UX/runtime اندروید غیرفعال باقی می‌ماند.
- خانواده‌های فرمان اضافی Android (در دسترس بودن به دستگاه، مجوزها، و تنظیمات کاربر بستگی دارد):
  - `device.status`، `device.info`، `device.permissions`، `device.health`
  - `device.apps` فقط وقتی **تنظیمات > قابلیت‌های تلفن > برنامه‌های نصب‌شده** فعال باشد؛ به‌صورت پیش‌فرض برنامه‌های قابل مشاهده در launcher را فهرست می‌کند.
  - `notifications.list`، `notifications.actions` (در پایین [بازارسال اعلان‌ها](#notification-forwarding) را ببینید)
  - `photos.latest`
  - `contacts.search`، `contacts.add`
  - `calendar.events`، `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`، `motion.pedometer`

## نقطه‌های ورود assistant

Android از اجرای OpenClaw از طریق trigger دستیار سیستم (Google Assistant) پشتیبانی می‌کند. وقتی پیکربندی شده باشد، نگه داشتن دکمه home یا گفتن «Hey Google, ask OpenClaw...» برنامه را باز می‌کند و prompt را وارد composer چت می‌کند.

این کار از فراداده **App Actions** در Android که در manifest برنامه اعلام شده استفاده می‌کند. هیچ پیکربندی اضافه‌ای در سمت Gateway لازم نیست -- intent دستیار کاملا توسط برنامه Android مدیریت و به‌عنوان یک پیام چت عادی بازارسال می‌شود.

<Note>
در دسترس بودن App Actions به دستگاه، نسخه Google Play Services، و اینکه کاربر OpenClaw را به‌عنوان برنامه دستیار پیش‌فرض تنظیم کرده باشد بستگی دارد.
</Note>

## بازارسال اعلان‌ها

Android می‌تواند اعلان‌های دستگاه را به‌عنوان event به Gateway بازارسال کند. چند کنترل به شما اجازه می‌دهند مشخص کنید کدام اعلان‌ها و در چه زمانی بازارسال شوند.

| کلید                             | نوع           | توضیح                                                                                             |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | فقط اعلان‌های این نام‌های package را بازارسال کن. اگر تنظیم شود، همه packageهای دیگر نادیده گرفته می‌شوند. |
| `notifications.denyPackages`     | string[]       | هرگز اعلان‌های این نام‌های package را بازارسال نکن. پس از `allowPackages` اعمال می‌شود.           |
| `notifications.quietHours.start` | string (HH:mm) | شروع بازه ساعات سکوت (زمان محلی دستگاه). اعلان‌ها در طول این بازه سرکوب می‌شوند.                 |
| `notifications.quietHours.end`   | string (HH:mm) | پایان بازه ساعات سکوت.                                                                           |
| `notifications.rateLimit`        | number         | حداکثر اعلان‌های بازارسال‌شده برای هر package در هر دقیقه. اعلان‌های اضافه drop می‌شوند.         |

انتخاب‌گر اعلان همچنین برای eventهای اعلان بازارسال‌شده، رفتار امن‌تری به‌کار می‌گیرد و از بازارسال تصادفی اعلان‌های حساس سیستم جلوگیری می‌کند.

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
ارسال اعلان‌ها نیازمند مجوز Android Notification Listener است. برنامه در هنگام راه‌اندازی این مجوز را درخواست می‌کند.
</Note>

## مرتبط

- [برنامه iOS](/fa/platforms/ios)
- [گره‌ها](/fa/nodes)
- [عیب‌یابی گره Android](/fa/nodes/troubleshooting)
