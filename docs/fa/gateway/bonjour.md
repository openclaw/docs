---
read_when:
    - اشکال‌زدایی مشکلات کشف Bonjour در macOS/iOS
    - تغییر انواع سرویس mDNS، رکوردهای TXT، یا تجربهٔ کاربری کشف
summary: کشف و اشکال‌زدایی Bonjour/mDNS (بیکن‌های Gateway، کلاینت‌ها، و حالت‌های رایج خرابی)
title: کشف Bonjour
x-i18n:
    generated_at: "2026-05-12T12:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw می‌تواند از Bonjour (mDNS / DNS-SD) برای کشف یک Gateway فعال (نقطهٔ پایانی WebSocket) استفاده کند.
مرور چندپخشی `local.` یک **امکان صرفاً LAN** است. Plugin همراه `bonjour`
مالک اعلام حضور در LAN است. روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و روی
Linux، Windows و استقرارهای Gateway کانتینری، اختیاری است. برای کشف بین شبکه‌ای، همان
beacon را می‌توان از طریق یک دامنهٔ wide-area DNS-SD پیکربندی‌شده نیز منتشر کرد. کشف
همچنان best-effort است و جایگزین اتصال‌پذیری مبتنی بر SSH یا Tailnet نمی‌شود.

## Wide-area Bonjour (Unicast DNS-SD) روی Tailscale

اگر node و gateway روی شبکه‌های متفاوت باشند، mDNS چندپخشی از مرز شبکه عبور نمی‌کند.
می‌توانید همان تجربهٔ کشف را با تغییر به **unicast DNS-SD**
("Wide-Area Bonjour") روی Tailscale حفظ کنید.

گام‌های کلی:

1. یک سرور DNS روی میزبان gateway اجرا کنید (قابل دسترسی از طریق Tailnet).
2. رکوردهای DNS-SD را برای `_openclaw-gw._tcp` زیر یک zone اختصاصی منتشر کنید
   (نمونه: `openclaw.internal.`).
3. **split DNS** در Tailscale را پیکربندی کنید تا دامنهٔ انتخابی شما از طریق آن
   سرور DNS برای clients (از جمله iOS) resolve شود.

OpenClaw از هر دامنهٔ کشفی پشتیبانی می‌کند؛ `openclaw.internal.` فقط یک نمونه است.
nodeهای iOS/Android هم `local.` و هم دامنهٔ wide-area پیکربندی‌شدهٔ شما را مرور می‌کنند.

### پیکربندی Gateway (توصیه‌شده)

```json5
{
  gateway: { bind: "tailnet" }, // فقط tailnet (توصیه‌شده)
  discovery: { wideArea: { enabled: true } }, // انتشار wide-area DNS-SD را فعال می‌کند
}
```

### راه‌اندازی یک‌بارهٔ سرور DNS (میزبان gateway)

```bash
openclaw dns setup --apply
```

این دستور CoreDNS را نصب و آن را طوری پیکربندی می‌کند که:

- فقط روی پورت 53 و فقط روی interfaceهای Tailscale مربوط به gateway گوش دهد
- دامنهٔ انتخابی شما (نمونه: `openclaw.internal.`) را از `~/.openclaw/dns/<domain>.db` ارائه کند

از یک ماشین متصل به tailnet اعتبارسنجی کنید:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### تنظیمات DNS در Tailscale

در کنسول مدیریت Tailscale:

- یک nameserver اضافه کنید که به IP مربوط به tailnet روی gateway اشاره کند (UDP/TCP 53).
- split DNS اضافه کنید تا دامنهٔ کشف شما از آن nameserver استفاده کند.

وقتی clients، DNS مربوط به tailnet را بپذیرند، nodeهای iOS و کشف CLI می‌توانند
`_openclaw-gw._tcp` را در دامنهٔ کشف شما بدون چندپخشی مرور کنند.

### امنیت listener در Gateway (توصیه‌شده)

پورت WS مربوط به Gateway (پیش‌فرض `18789`) به‌صورت پیش‌فرض به loopback متصل می‌شود. برای دسترسی LAN/tailnet،
به‌صورت صریح bind کنید و auth را فعال نگه دارید.

برای راه‌اندازی‌های فقط tailnet:

- `gateway.bind: "tailnet"` را در `~/.openclaw/openclaw.json` تنظیم کنید.
- Gateway را restart کنید (یا اپ menubar در macOS را restart کنید).

## چه چیزی اعلام حضور می‌کند

فقط Gateway، `_openclaw-gw._tcp` را اعلام حضور می‌کند. اعلام حضور چندپخشی LAN
وقتی Plugin فعال باشد توسط Plugin همراه `bonjour` فراهم می‌شود؛ انتشار wide-area
DNS-SD همچنان در مالکیت Gateway می‌ماند.

## نوع‌های service

- `_openclaw-gw._tcp` - beacon انتقال gateway (استفاده‌شده توسط nodeهای macOS/iOS/Android).

## کلیدهای TXT (hintهای غیرمحرمانه)

Gateway hintهای کوچک و غیرمحرمانه‌ای را اعلام می‌کند تا جریان‌های UI آسان‌تر شوند:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط وقتی TLS فعال باشد)
- `gatewayTlsSha256=<sha256>` (فقط وقتی TLS فعال باشد و fingerprint در دسترس باشد)
- `canvasPort=<port>` (فقط وقتی میزبان canvas فعال باشد؛ در حال حاضر همان `gatewayPort` است)
- `transport=gateway`
- `tailnetDns=<magicdns>` (فقط حالت کامل mDNS، hint اختیاری وقتی Tailnet در دسترس باشد)
- `sshPort=<port>` (فقط حالت کامل؛ در حالت‌های minimal و off حذف می‌شود)
- `cliPath=<path>` (فقط حالت کامل؛ در حالت‌های minimal و off حذف می‌شود)

نکات امنیتی:

- رکوردهای TXT در Bonjour/mDNS **احراز اصالت نشده‌اند**. clients نباید TXT را routing معتبر تلقی کنند.
- clients باید با استفاده از نقطهٔ پایانی service resolveشده route کنند (SRV + A/AAAA). `lanHost`، `tailnetDns`، `gatewayPort` و `gatewayTlsSha256` را فقط hint بدانید.
- هدف‌گیری خودکار SSH نیز باید از میزبان service resolveشده استفاده کند، نه hintهای فقط TXT.
- TLS pinning هرگز نباید اجازه دهد `gatewayTlsSha256` اعلام‌شده یک pin ذخیره‌شدهٔ قبلی را override کند.
- nodeهای iOS/Android باید اتصال‌های مستقیم مبتنی بر کشف را **فقط TLS** در نظر بگیرند و پیش از اعتماد به fingerprint برای نخستین بار، تأیید صریح کاربر را الزامی کنند.

## اشکال‌زدایی روی macOS

ابزارهای داخلی مفید:

- مرور instanceها:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- resolve کردن یک instance (جایگزین کردن `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

اگر مرور کار می‌کند اما resolve ناموفق است، معمولاً با یک policy در LAN یا
مشکل resolver مربوط به mDNS روبه‌رو هستید.

## اشکال‌زدایی در logهای Gateway

Gateway یک فایل log چرخشی می‌نویسد (هنگام startup به‌صورت
`gateway log file: ...` چاپ می‌شود). به‌دنبال خطوط `bonjour:` بگردید، به‌ویژه:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

watchdog حالت‌های فعال `probing`، `announcing` و تغییرنام‌های تازهٔ ناشی از conflict را
حالت‌های در حال انجام در نظر می‌گیرد. اگر service هرگز به `announced` نرسد، OpenClaw در نهایت
advertiser را دوباره ایجاد می‌کند و پس از شکست‌های تکراری، به‌جای اعلام دوباره برای همیشه،
Bonjour را برای همان process مربوط به Gateway غیرفعال می‌کند.

Bonjour از hostname سیستم برای میزبان `.local` اعلام‌شده استفاده می‌کند وقتی یک
label معتبر DNS باشد. اگر hostname سیستم شامل فاصله، underscore یا نویسهٔ نامعتبر دیگری
برای DNS-label باشد، OpenClaw به `openclaw.local` fallback می‌کند. وقتی به یک
label صریح برای میزبان نیاز دارید، پیش از شروع Gateway مقدار
`OPENCLAW_MDNS_HOSTNAME=<name>` را تنظیم کنید.

## اشکال‌زدایی روی node iOS

node iOS از `NWBrowser` برای کشف `_openclaw-gw._tcp` استفاده می‌کند.

برای capture کردن logها:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → بازتولید → **Copy**

log شامل transitionهای وضعیت browser و تغییرات result-set است.

## چه زمانی Bonjour را فعال کنیم

Bonjour برای startup Gateway با پیکربندی خالی روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود، چون
اپ محلی و nodeهای نزدیک iOS/Android معمولاً به کشف روی همان LAN تکیه می‌کنند.

وقتی auto-discovery روی همان LAN در Linux،
Windows یا میزبان غیر macOS دیگری مفید است، Bonjour را صریحاً فعال کنید:

```bash
openclaw plugins enable bonjour
```

وقتی فعال باشد، Bonjour از `discovery.mdns.mode` استفاده می‌کند تا تصمیم بگیرد چه مقدار metadata در TXT
منتشر کند. همان mode، hintهای اختیاری TXT را در رکوردهای wide-area DNS-SD کنترل می‌کند.
mode پیش‌فرض `minimal` است؛ فقط وقتی clients به hintهای `cliPath` یا
`sshPort` نیاز دارند از `full` استفاده کنید. برای سرکوب چندپخشی LAN بدون تغییر در فعال بودن Plugin،
از `off` استفاده کنید؛ wide-area DNS-SD همچنان می‌تواند beacon حداقلی Gateway را وقتی
`discovery.wideArea.enabled` برابر true است منتشر کند.

## چه زمانی Bonjour را غیرفعال کنیم

وقتی اعلام حضور چندپخشی LAN غیرضروری، در دسترس نبودنی
یا زیان‌بار است، Bonjour را غیرفعال نگه دارید. موارد رایج عبارت‌اند از serverهای غیر macOS، شبکه‌بندی Docker bridge،
WSL یا policy شبکه‌ای که mDNS multicast را drop می‌کند. در آن محیط‌ها
Gateway همچنان از طریق URL منتشرشده، SSH، Tailnet یا wide-area
DNS-SD قابل دسترس است، اما auto-discovery در LAN قابل اعتماد نیست.

وقتی مشکل محدود به استقرار است، override محیطی موجود را ترجیح دهید:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

این کار اعلام حضور چندپخشی LAN را بدون تغییر پیکربندی Plugin غیرفعال می‌کند.
برای imageهای Docker، service fileها، launch scriptها و اشکال‌زدایی‌های موردی امن است،
چون با حذف environment، این تنظیم نیز از بین می‌رود.

وقتی عمداً می‌خواهید Plugin کشف LAN همراه را برای آن پیکربندی OpenClaw خاموش کنید،
از پیکربندی Plugin استفاده کنید:

```bash
openclaw plugins disable bonjour
```

## نکات مهم Docker

Plugin همراه Bonjour، وقتی `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد، اعلام حضور چندپخشی LAN را در
containerهای شناسایی‌شده به‌صورت خودکار غیرفعال می‌کند. شبکه‌های Docker bridge
معمولاً mDNS multicast (`224.0.0.251:5353`) را بین container
و LAN forward نمی‌کنند، بنابراین اعلام حضور از داخل container به‌ندرت کشف را عملی می‌کند.

نکات مهم:

- Bonjour روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و در جاهای دیگر opt-in است. غیرفعال گذاشتن آن
  Gateway را متوقف نمی‌کند؛ فقط اعلام حضور چندپخشی LAN را رد می‌کند.
- غیرفعال کردن Bonjour، `gateway.bind` را تغییر نمی‌دهد؛ Docker همچنان به‌صورت پیش‌فرض از
  `OPENCLAW_GATEWAY_BIND=lan` استفاده می‌کند تا پورت منتشرشدهٔ میزبان بتواند کار کند.
- غیرفعال کردن Bonjour، wide-area DNS-SD را غیرفعال نمی‌کند. وقتی Gateway و node روی یک LAN نیستند،
  از کشف wide-area یا Tailnet استفاده کنید.
- استفادهٔ دوباره از همان `OPENCLAW_CONFIG_DIR` بیرون از Docker، policy غیرفعال‌سازی خودکار container را
  پایدار نمی‌کند.
- `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host networking، macvlan یا شبکهٔ دیگری
  تنظیم کنید که عبور mDNS multicast در آن شناخته‌شده است؛ برای غیرفعال‌سازی اجباری آن را روی `1` تنظیم کنید.

## عیب‌یابی Bonjour غیرفعال‌شده

اگر یک node پس از راه‌اندازی Docker دیگر Gateway را به‌صورت خودکار کشف نمی‌کند:

1. تأیید کنید Gateway در mode خودکار، forced-on یا forced-off اجرا می‌شود:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأیید کنید خود Gateway از طریق پورت منتشرشده قابل دسترسی است:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. وقتی Bonjour غیرفعال است از یک target مستقیم استفاده کنید:
   - UI کنترل یا ابزارهای محلی: `http://127.0.0.1:18789`
   - clients در LAN: `http://<gateway-host>:18789`
   - clients بین شبکه‌ای: Tailnet MagicDNS، IP مربوط به Tailnet، تونل SSH، یا
     wide-area DNS-SD

4. اگر عمداً Plugin مربوط به Bonjour را در Docker فعال کرده‌اید و اعلام حضور را با
   `OPENCLAW_DISABLE_BONJOUR=0` اجباری کرده‌اید، multicast را از میزبان تست کنید:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   اگر browsing خالی است یا logهای Gateway لغوهای تکراری ciao watchdog را نشان می‌دهند،
   `OPENCLAW_DISABLE_BONJOUR=1` را بازگردانید و از یک route مستقیم یا
   Tailnet استفاده کنید.

## حالت‌های رایج شکست

- **Bonjour از شبکه‌ها عبور نمی‌کند**: از Tailnet یا SSH استفاده کنید.
- **Multicast مسدود شده است**: برخی شبکه‌های Wi-Fi، mDNS را غیرفعال می‌کنند.
- **Advertiser در probing/announcing گیر کرده است**: میزبان‌هایی با multicast مسدود،
  bridgeهای container، WSL یا تغییرات مکرر interface می‌توانند advertiser مربوط به ciao را در یک
  وضعیت non-announced رها کنند. OpenClaw چند بار retry می‌کند و سپس به‌جای restart کردن advertiser برای همیشه،
  Bonjour را برای process فعلی Gateway غیرفعال می‌کند.
- **شبکه‌بندی Docker bridge**: Bonjour در containerهای شناسایی‌شده به‌صورت خودکار غیرفعال می‌شود.
  `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host، macvlan یا شبکهٔ دیگری
  که قابلیت mDNS دارد تنظیم کنید.
- **Sleep / تغییرات interface**: macOS ممکن است نتایج mDNS را موقتاً drop کند؛ retry کنید.
- **Browse کار می‌کند اما resolve ناموفق است**: نام ماشین‌ها را ساده نگه دارید (از emoji یا
  punctuation پرهیز کنید)، سپس Gateway را restart کنید. نام instance مربوط به service از
  نام میزبان مشتق می‌شود، بنابراین نام‌های بیش از حد پیچیده می‌توانند برخی resolverها را سردرگم کنند.

## نام‌های instance escapeشده (`\032`)

Bonjour/DNS-SD اغلب byteها را در نام instanceهای service به‌صورت دنباله‌های اعشاری `\DDD`
escape می‌کند (برای مثال فاصله‌ها به `\032` تبدیل می‌شوند).

- این در سطح protocol طبیعی است.
- UIها باید برای نمایش decode کنند (iOS از `BonjourEscapes.decode` استفاده می‌کند).

## فعال‌سازی / غیرفعال‌سازی / پیکربندی

- میزبان‌های macOS به‌طور پیش‌فرض Plugin کشف LAN داخلی را به‌صورت خودکار راه‌اندازی می‌کنند.
- `openclaw plugins enable bonjour` Plugin کشف LAN داخلی را روی میزبان‌هایی که به‌طور پیش‌فرض فعال نیست، فعال می‌کند.
- `openclaw plugins disable bonjour` با غیرفعال کردن Plugin داخلی، اعلان چندپخشی LAN را غیرفعال می‌کند.
- `OPENCLAW_DISABLE_BONJOUR=1` اعلان چندپخشی LAN را بدون تغییر پیکربندی Plugin غیرفعال می‌کند؛ مقدارهای truthy پذیرفته‌شده `1`، `true`، `yes` و `on` هستند (قدیمی: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` اعلان چندپخشی LAN را، از جمله داخل کانتینرهای شناسایی‌شده، به‌اجبار فعال می‌کند؛ مقدارهای falsy پذیرفته‌شده `0`، `false`، `no` و `off` هستند.
- وقتی Plugin Bonjour فعال است و `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد، Bonjour روی میزبان‌های عادی اعلان می‌کند و داخل کانتینرهای شناسایی‌شده به‌طور خودکار غیرفعال می‌شود.
- `gateway.bind` در `~/.openclaw/openclaw.json` حالت اتصال Gateway را کنترل می‌کند.
- `OPENCLAW_SSH_PORT` وقتی `sshPort` اعلان می‌شود، درگاه SSH را بازنویسی می‌کند (قدیمی: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` وقتی حالت کامل mDNS فعال است، یک راهنمای MagicDNS را در TXT منتشر می‌کند (قدیمی: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` مسیر CLI اعلان‌شده را بازنویسی می‌کند (قدیمی: `OPENCLAW_CLI_PATH`).

## مستندات مرتبط

- سیاست کشف و انتخاب انتقال: [کشف](/fa/gateway/discovery)
- جفت‌سازی Node و تأییدها: [جفت‌سازی Gateway](/fa/gateway/pairing)
