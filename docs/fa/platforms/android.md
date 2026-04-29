---
read_when:
    - جفت‌سازی یا اتصال مجدد Node مربوط به Android
    - عیب‌یابی کشف Gateway یا احراز هویت در Android
    - راستی‌آزمایی همسانی تاریخچهٔ گفت‌وگو در میان کلاینت‌ها
summary: 'برنامه Android (node): راهنمای عملیاتی اتصال + سطح فرمان Connect/Chat/Voice/Canvas'
title: برنامه Android
x-i18n:
    generated_at: "2026-04-29T23:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
برنامه Android هنوز به‌صورت عمومی منتشر نشده است. کد منبع در [مخزن OpenClaw](https://github.com/openclaw/openclaw) زیر `apps/android` در دسترس است. می‌توانید آن را با Java 17 و Android SDK (`./gradlew :app:assemblePlayDebug`) خودتان بسازید. برای دستورالعمل‌های ساخت، [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) را ببینید.
</Note>

## نمای کلی پشتیبانی

- نقش: برنامه گره همراه (Android میزبان Gateway نیست).
- Gateway لازم است: بله (آن را روی macOS، Linux، یا Windows از طریق WSL2 اجرا کنید).
- نصب: [شروع به کار](/fa/start/getting-started) + [جفت‌سازی](/fa/channels/pairing).
- Gateway: [Runbook](/fa/gateway) + [پیکربندی](/fa/gateway/configuration).
  - پروتکل‌ها: [پروتکل Gateway](/fa/gateway/protocol) (گره‌ها + صفحه کنترل).

## کنترل سیستم

کنترل سیستم (launchd/systemd) روی میزبان Gateway قرار دارد. [Gateway](/fa/gateway) را ببینید.

## Runbook اتصال

برنامه گره Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android مستقیما به WebSocket مربوط به Gateway وصل می‌شود و از جفت‌سازی دستگاه (`role: node`) استفاده می‌کند.

برای Tailscale یا میزبان‌های عمومی، Android به یک نقطه پایانی امن نیاز دارد:

- ترجیحی: Tailscale Serve / Funnel با `https://<magicdns>` / `wss://<magicdns>`
- همچنین پشتیبانی می‌شود: هر URL دیگر `wss://` برای Gateway با یک نقطه پایانی TLS واقعی
- `ws://` بدون رمزنگاری همچنان روی نشانی‌های LAN خصوصی / میزبان‌های `.local`، به‌علاوه `localhost`، `127.0.0.1`، و پل شبیه‌ساز Android (`10.0.2.2`) پشتیبانی می‌شود

### پیش‌نیازها

- می‌توانید Gateway را روی ماشین «اصلی» اجرا کنید.
- دستگاه/شبیه‌ساز Android می‌تواند به WebSocket مربوط به Gateway دسترسی پیدا کند:
  - همان LAN با mDNS/NSD، **یا**
  - همان tailnet در Tailscale با Wide-Area Bonjour / unicast DNS-SD (پایین را ببینید)، **یا**
  - میزبان/درگاه Gateway به‌صورت دستی (جایگزین)
- جفت‌سازی موبایل روی tailnet/عمومی از نقاط پایانی خام tailnet IP با `ws://` استفاده **نمی‌کند**. به‌جای آن از Tailscale Serve یا URL دیگری با `wss://` استفاده کنید.
- می‌توانید CLI (`openclaw`) را روی ماشین Gateway (یا از طریق SSH) اجرا کنید.

### 1) Gateway را شروع کنید

```bash
openclaw gateway --port 18789 --verbose
```

در لاگ‌ها تایید کنید چیزی شبیه این را می‌بینید:

- `listening on ws://0.0.0.0:18789`

برای دسترسی راه‌دور Android از طریق Tailscale، به‌جای bind خام tailnet، Serve/Funnel را ترجیح دهید:

```bash
openclaw gateway --tailscale serve
```

این کار یک نقطه پایانی امن `wss://` / `https://` به Android می‌دهد. راه‌اندازی ساده `gateway.bind: "tailnet"` برای جفت‌سازی اولیه راه‌دور Android کافی نیست، مگر اینکه TLS را جداگانه نیز خاتمه دهید.

### 2) کشف را بررسی کنید (اختیاری)

از ماشین Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

یادداشت‌های بیشتر برای اشکال‌زدایی: [Bonjour](/fa/gateway/bonjour).

اگر یک دامنه کشف wide-area نیز پیکربندی کرده‌اید، با این مقایسه کنید:

```bash
openclaw gateway discover --json
```

این دستور `local.` را به‌همراه دامنه wide-area پیکربندی‌شده در یک گذر نشان می‌دهد و به‌جای راهنمایی‌های فقط TXT، از نقطه پایانی سرویس resolve‌شده استفاده می‌کند.

#### کشف Tailnet (وین ⇄ لندن) از طریق unicast DNS-SD

کشف Android با NSD/mDNS از شبکه‌ها عبور نمی‌کند. اگر گره Android و Gateway شما روی شبکه‌های متفاوت هستند اما از طریق Tailscale وصل‌اند، به‌جای آن از Wide-Area Bonjour / unicast DNS-SD استفاده کنید.

کشف به‌تنهایی برای جفت‌سازی Android روی tailnet/عمومی کافی نیست. مسیر کشف‌شده همچنان به یک نقطه پایانی امن (`wss://` یا Tailscale Serve) نیاز دارد:

1. یک zone مربوط به DNS-SD (مثلا `openclaw.internal.`) روی میزبان Gateway راه‌اندازی کنید و رکوردهای `_openclaw-gw._tcp` را منتشر کنید.
2. split DNS در Tailscale را برای دامنه انتخابی خود پیکربندی کنید تا به آن سرور DNS اشاره کند.

جزئیات و نمونه پیکربندی CoreDNS: [Bonjour](/fa/gateway/bonjour).

### 3) از Android وصل شوید

در برنامه Android:

- برنامه اتصال خود به Gateway را از طریق یک **سرویس پیش‌زمینه** (اعلان پایدار) زنده نگه می‌دارد.
- زبانه **Connect** را باز کنید.
- از حالت **Setup Code** یا **Manual** استفاده کنید.
- اگر کشف مسدود است، از میزبان/درگاه دستی در **Advanced controls** استفاده کنید. برای میزبان‌های LAN خصوصی، `ws://` همچنان کار می‌کند. برای میزبان‌های Tailscale/عمومی، TLS را روشن کنید و از یک نقطه پایانی `wss://` / Tailscale Serve استفاده کنید.

پس از نخستین جفت‌سازی موفق، Android هنگام اجرا خودکار دوباره وصل می‌شود:

- نقطه پایانی دستی (اگر فعال باشد)، در غیر این صورت
- آخرین Gateway کشف‌شده (بهترین تلاش).

### Beaconهای زنده بودن Presence

پس از اتصال نشست گره احراز هویت‌شده، و زمانی که برنامه در پس‌زمینه می‌رود در حالی که سرویس پیش‌زمینه همچنان وصل است، Android با `event: "node.presence.alive"`، `node.event` را فراخوانی می‌کند. Gateway این را فقط پس از مشخص شدن هویت دستگاه گره احراز هویت‌شده، به‌عنوان `lastSeenAtMs`/`lastSeenReason` روی فراداده گره/دستگاه جفت‌شده ثبت می‌کند.

برنامه beacon را فقط زمانی با موفقیت ثبت‌شده حساب می‌کند که پاسخ Gateway شامل `handled: true` باشد. Gatewayهای قدیمی‌تر ممکن است `node.event` را با `{ "ok": true }` تایید کنند؛ آن پاسخ سازگار است اما به‌عنوان به‌روزرسانی پایدار last-seen حساب نمی‌شود.

### 4) جفت‌سازی را تایید کنید (CLI)

روی ماشین Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

جزئیات جفت‌سازی: [جفت‌سازی](/fa/channels/pairing).

اختیاری: اگر گره Android همیشه از یک زیرشبکه کاملا کنترل‌شده وصل می‌شود، می‌توانید با CIDRهای صریح یا IPهای دقیق، تایید خودکار گره در اولین بار را فعال کنید:

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

این به‌طور پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه `role: node` بدون scopeهای درخواست‌شده اعمال می‌شود. جفت‌سازی operator/browser و هر تغییر در نقش، scope، فراداده، یا کلید عمومی همچنان به تایید دستی نیاز دارد.

### 5) وصل بودن گره را بررسی کنید

- از طریق وضعیت گره‌ها:

  ```bash
  openclaw nodes status
  ```

- از طریق Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) گفتگو + تاریخچه

زبانه گفتگوی Android از انتخاب نشست پشتیبانی می‌کند (`main` پیش‌فرض، به‌علاوه نشست‌های موجود دیگر):

- تاریخچه: `chat.history` (نرمال‌سازی‌شده برای نمایش؛ برچسب‌های directive درون‌خطی از متن قابل مشاهده حذف می‌شوند، payloadهای XML مربوط به فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شده فراخوانی ابزار) و توکن‌های کنترل مدل لو رفته به‌صورت ASCII/تمام‌عرض حذف می‌شوند، ردیف‌های assistant فقط شامل توکن خاموش مانند دقیق `NO_REPLY` / `no_reply` حذف می‌شوند، و ردیف‌های بسیار بزرگ می‌توانند با placeholderها جایگزین شوند)
- ارسال: `chat.send`
- به‌روزرسانی‌های push (بهترین تلاش): `chat.subscribe` → `event:"chat"`

### 7) Canvas + دوربین

#### میزبان Gateway برای Canvas (برای محتوای وب توصیه می‌شود)

اگر می‌خواهید گره HTML/CSS/JS واقعی را نشان دهد که عامل بتواند روی دیسک ویرایش کند، گره را به میزبان Canvas در Gateway هدایت کنید.

<Note>
گره‌ها Canvas را از سرور HTTP مربوط به Gateway بارگذاری می‌کنند (همان درگاه `gateway.port`، مقدار پیش‌فرض `18789`).
</Note>

1. روی میزبان Gateway فایل `~/.openclaw/workspace/canvas/index.html` را ایجاد کنید.

2. گره را به آن هدایت کنید (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختیاری): اگر هر دو دستگاه روی Tailscale هستند، به‌جای `.local` از نام MagicDNS یا IP مربوط به tailnet استفاده کنید، مثلا `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

این سرور یک کلاینت live-reload را به HTML تزریق می‌کند و هنگام تغییر فایل‌ها reload می‌کند.
میزبان A2UI در `http://<gateway-host>:18789/__openclaw__/a2ui/` قرار دارد.

دستورهای Canvas (فقط در پیش‌زمینه):

- `canvas.eval`، `canvas.snapshot`، `canvas.navigate` (برای بازگشت به scaffold پیش‌فرض از `{"url":""}` یا `{"url":"/"}` استفاده کنید). `canvas.snapshot` مقدار `{ format, base64 }` را برمی‌گرداند (`format="jpeg"` به‌طور پیش‌فرض).
- A2UI: `canvas.a2ui.push`، `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` نام مستعار قدیمی)

دستورهای دوربین (فقط در پیش‌زمینه؛ وابسته به مجوز):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

برای پارامترها و helperهای CLI، [گره دوربین](/fa/nodes/camera) را ببینید.

### 8) صدا + سطح گسترده‌تر دستورهای Android

- زبانه Voice: Android دو حالت capture صریح دارد. **Mic** یک نشست دستی در زبانه Voice است که هر مکث را به‌عنوان یک نوبت گفتگو ارسال می‌کند و وقتی برنامه از پیش‌زمینه خارج شود یا کاربر زبانه Voice را ترک کند متوقف می‌شود. **Talk** حالت Talk Mode پیوسته است و تا زمانی که خاموش شود یا گره قطع شود به شنیدن ادامه می‌دهد.
- Talk Mode پیش از شروع capture، سرویس پیش‌زمینه موجود را از `dataSync` به `dataSync|microphone` ارتقا می‌دهد، سپس وقتی Talk Mode متوقف شود آن را تنزل می‌دهد. Android 14+ به اعلان `FOREGROUND_SERVICE_MICROPHONE`، مجوز runtime به نام `RECORD_AUDIO`، و نوع سرویس microphone در زمان اجرا نیاز دارد.
- پاسخ‌های گفتاری از طریق ارائه‌دهنده Talk پیکربندی‌شده در Gateway از `talk.speak` استفاده می‌کنند. TTS سیستم محلی فقط زمانی استفاده می‌شود که `talk.speak` در دسترس نباشد.
- wake صوتی در UX/runtime مربوط به Android غیرفعال باقی می‌ماند.
- خانواده‌های اضافی دستور Android (در دسترس بودن به دستگاه + مجوزها بستگی دارد):
  - `device.status`، `device.info`، `device.permissions`، `device.health`
  - `notifications.list`، `notifications.actions` (پایین، [ارسال اعلان‌ها](#notification-forwarding) را ببینید)
  - `photos.latest`
  - `contacts.search`، `contacts.add`
  - `calendar.events`، `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`، `motion.pedometer`

## نقاط ورود Assistant

Android از اجرای OpenClaw از طریق trigger دستیار سیستم (Google Assistant) پشتیبانی می‌کند. وقتی پیکربندی شده باشد، نگه داشتن دکمه خانه یا گفتن "Hey Google, ask OpenClaw..." برنامه را باز می‌کند و prompt را به composer گفتگو تحویل می‌دهد.

این کار از فراداده **App Actions** در Android استفاده می‌کند که در manifest برنامه اعلام شده است. هیچ پیکربندی اضافه‌ای در سمت Gateway لازم نیست -- intent دستیار کاملا توسط برنامه Android مدیریت می‌شود و به‌عنوان یک پیام گفتگوی عادی forward می‌شود.

<Note>
دسترس‌پذیری App Actions به دستگاه، نسخه Google Play Services، و اینکه کاربر OpenClaw را به‌عنوان برنامه دستیار پیش‌فرض تنظیم کرده باشد یا نه بستگی دارد.
</Note>

## ارسال اعلان‌ها

Android می‌تواند اعلان‌های دستگاه را به‌عنوان رویداد به Gateway forward کند. چند کنترل به شما امکان می‌دهد محدوده اعلان‌هایی را که forward می‌شوند و زمان آن را تعیین کنید.

| کلید                             | نوع            | توضیح                                                                                             |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | فقط اعلان‌های این نام‌های package را forward کنید. اگر تنظیم شود، همه packageهای دیگر نادیده گرفته می‌شوند. |
| `notifications.denyPackages`     | string[]       | هرگز اعلان‌های این نام‌های package را forward نکنید. پس از `allowPackages` اعمال می‌شود.          |
| `notifications.quietHours.start` | string (HH:mm) | شروع بازه ساعت‌های سکوت (زمان محلی دستگاه). اعلان‌ها در این بازه سرکوب می‌شوند.                  |
| `notifications.quietHours.end`   | string (HH:mm) | پایان بازه ساعت‌های سکوت.                                                                         |
| `notifications.rateLimit`        | number         | بیشترین تعداد اعلان‌های forwardشده برای هر package در هر دقیقه. اعلان‌های اضافی حذف می‌شوند.     |

انتخابگر اعلان نیز برای رویدادهای اعلان forwardشده از رفتار امن‌تری استفاده می‌کند و از forward شدن تصادفی اعلان‌های حساس سیستم جلوگیری می‌کند.

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
ارسال اعلان‌ها به مجوز Android Notification Listener نیاز دارد. برنامه در زمان راه‌اندازی این مجوز را درخواست می‌کند.
</Note>

## مرتبط

- [برنامه iOS](/fa/platforms/ios)
- [گره‌ها](/fa/nodes)
- [عیب‌یابی گره Android](/fa/nodes/troubleshooting)
