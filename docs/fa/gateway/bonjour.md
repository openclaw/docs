---
read_when:
    - اشکال‌زدایی مشکلات کشف Bonjour در macOS/iOS
    - تغییر انواع سرویس mDNS، رکوردهای TXT یا تجربه کاربری کشف
summary: کشف و اشکال‌زدایی Bonjour/mDNS (بیکن‌های Gateway، کلاینت‌ها و حالت‌های رایج خرابی)
title: کشف Bonjour
x-i18n:
    generated_at: "2026-05-03T21:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# کشف Bonjour / mDNS

OpenClaw می‌تواند از Bonjour (mDNS / DNS-SD) برای کشف یک Gateway فعال (نقطهٔ پایانی WebSocket) استفاده کند.
مرور چندپخشی `local.` یک **سهولت فقط مخصوص LAN** است. Plugin همراه `bonjour`
مالک تبلیغ LAN است. این Plugin روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و روی
Linux، Windows، و استقرارهای Gateway کانتینری‌شده نیازمند فعال‌سازی اختیاری است. برای کشف بین‌شبکه‌ای، همین
beacon همچنین می‌تواند از طریق یک دامنهٔ DNS-SD گستردهٔ پیکربندی‌شده منتشر شود. کشف
همچنان best-effort است و جایگزین اتصال مبتنی بر SSH یا Tailnet **نمی‌شود**.

## Bonjour گسترده (Unicast DNS-SD) روی Tailscale

اگر node و gateway روی شبکه‌های متفاوتی باشند، mDNS چندپخشی از مرز
عبور نمی‌کند. می‌توانید با تغییر به **unicast DNS‑SD**
("Wide‑Area Bonjour") روی Tailscale همان تجربهٔ کشف را حفظ کنید.

گام‌های کلی:

1. یک سرور DNS روی میزبان gateway اجرا کنید (قابل دسترسی از طریق Tailnet).
2. رکوردهای DNS‑SD را برای `_openclaw-gw._tcp` زیر یک zone اختصاصی منتشر کنید
   (مثال: `openclaw.internal.`).
3. **split DNS** در Tailscale را پیکربندی کنید تا دامنهٔ انتخابی شما برای
   کلاینت‌ها (از جمله iOS) از طریق آن سرور DNS resolve شود.

OpenClaw از هر دامنهٔ کشفی پشتیبانی می‌کند؛ `openclaw.internal.` فقط یک مثال است.
nodeهای iOS/Android هم `local.` و هم دامنهٔ گستردهٔ پیکربندی‌شدهٔ شما را مرور می‌کنند.

### پیکربندی Gateway (توصیه‌شده)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### راه‌اندازی یک‌بارهٔ سرور DNS (میزبان gateway)

```bash
openclaw dns setup --apply
```

این دستور CoreDNS را نصب و آن را طوری پیکربندی می‌کند که:

- فقط روی پورت 53 و فقط روی interfaceهای Tailscale مربوط به gateway گوش کند
- دامنهٔ انتخابی شما (مثال: `openclaw.internal.`) را از `~/.openclaw/dns/<domain>.db` ارائه کند

از یک ماشین متصل به tailnet اعتبارسنجی کنید:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### تنظیمات DNS در Tailscale

در کنسول مدیر Tailscale:

- یک nameserver اضافه کنید که به IP tailnet مربوط به gateway اشاره کند (UDP/TCP 53).
- split DNS اضافه کنید تا دامنهٔ کشف شما از آن nameserver استفاده کند.

وقتی کلاینت‌ها DNS مربوط به tailnet را بپذیرند، nodeهای iOS و کشف CLI می‌توانند
`_openclaw-gw._tcp` را در دامنهٔ کشف شما بدون چندپخشی مرور کنند.

### امنیت listener مربوط به Gateway (توصیه‌شده)

پورت WS مربوط به Gateway (پیش‌فرض `18789`) به‌طور پیش‌فرض به loopback متصل می‌شود. برای دسترسی LAN/tailnet
به‌صراحت bind کنید و auth را فعال نگه دارید.

برای راه‌اندازی‌های فقط tailnet:

- `gateway.bind: "tailnet"` را در `~/.openclaw/openclaw.json` تنظیم کنید.
- Gateway را راه‌اندازی مجدد کنید (یا برنامهٔ menubar در macOS را راه‌اندازی مجدد کنید).

## چه چیزی تبلیغ می‌کند

فقط Gateway سرویس `_openclaw-gw._tcp` را تبلیغ می‌کند. تبلیغ چندپخشی LAN
وقتی Plugin فعال باشد توسط Plugin همراه `bonjour` فراهم می‌شود؛ انتشار DNS-SD گسترده
همچنان در مالکیت Gateway می‌ماند.

## نوع‌های سرویس

- `_openclaw-gw._tcp` — beacon انتقال gateway (استفاده‌شده توسط nodeهای macOS/iOS/Android).

## کلیدهای TXT (راهنمایی‌های غیرمحرمانه)

Gateway راهنمایی‌های کوچک و غیرمحرمانه‌ای را تبلیغ می‌کند تا جریان‌های UI راحت‌تر شوند:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط وقتی TLS فعال است)
- `gatewayTlsSha256=<sha256>` (فقط وقتی TLS فعال است و fingerprint در دسترس است)
- `canvasPort=<port>` (فقط وقتی میزبان canvas فعال است؛ در حال حاضر همان `gatewayPort` است)
- `transport=gateway`
- `tailnetDns=<magicdns>` (فقط حالت کامل mDNS، راهنمایی اختیاری وقتی Tailnet در دسترس است)
- `sshPort=<port>` (فقط حالت کامل mDNS؛ DNS-SD گسترده ممکن است آن را حذف کند)
- `cliPath=<path>` (فقط حالت کامل mDNS؛ DNS-SD گسترده همچنان آن را به‌عنوان راهنمای نصب راه‌دور می‌نویسد)

نکات امنیتی:

- رکوردهای TXT در Bonjour/mDNS **احراز اصالت نشده‌اند**. کلاینت‌ها نباید TXT را به‌عنوان routing معتبر در نظر بگیرند.
- کلاینت‌ها باید با استفاده از نقطهٔ پایانی سرویس resolve‌شده (SRV + A/AAAA) routing انجام دهند. `lanHost`، `tailnetDns`، `gatewayPort`، و `gatewayTlsSha256` را فقط به‌عنوان راهنمایی در نظر بگیرید.
- هدف‌گیری خودکار SSH نیز باید از میزبان سرویس resolve‌شده استفاده کند، نه راهنمایی‌های فقط TXT.
- TLS pinning هرگز نباید اجازه دهد `gatewayTlsSha256` تبلیغ‌شده یک pin ذخیره‌شدهٔ قبلی را override کند.
- nodeهای iOS/Android باید اتصال‌های مستقیم مبتنی بر کشف را **فقط TLS** در نظر بگیرند و پیش از اعتماد به fingerprint برای اولین بار، تأیید صریح کاربر را لازم بدانند.

## اشکال‌زدایی روی macOS

ابزارهای داخلی مفید:

- مرور instanceها:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- resolve کردن یک instance (به‌جای `<instance>` مقدار مناسب را بگذارید):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

اگر مرور کار می‌کند اما resolve شکست می‌خورد، معمولاً با یک policy در LAN یا
مشکل resolver در mDNS روبه‌رو هستید.

## اشکال‌زدایی در logهای Gateway

Gateway یک فایل log چرخشی می‌نویسد (در startup با عبارت
`gateway log file: ...` چاپ می‌شود). دنبال خط‌های `bonjour:` بگردید، به‌ویژه:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour وقتی hostname سیستم یک برچسب DNS معتبر باشد، از آن برای میزبان `.local` تبلیغ‌شده استفاده می‌کند. اگر hostname سیستم شامل فاصله، underscore، یا نویسهٔ نامعتبر دیگری برای برچسب DNS باشد، OpenClaw به `openclaw.local` fallback می‌کند. وقتی به یک برچسب میزبان صریح نیاز دارید، پیش از شروع Gateway مقدار
`OPENCLAW_MDNS_HOSTNAME=<name>` را تنظیم کنید.

## اشکال‌زدایی روی node iOS

node در iOS از `NWBrowser` برای کشف `_openclaw-gw._tcp` استفاده می‌کند.

برای ثبت logها:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → بازتولید → **Copy**

log شامل انتقال‌های وضعیت browser و تغییرات result-set است.

## چه زمانی Bonjour را فعال کنیم

Bonjour برای startup با پیکربندی خالی Gateway روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود، چون
برنامهٔ محلی و nodeهای iOS/Android نزدیک معمولاً به کشف در همان LAN متکی هستند.

وقتی کشف خودکار در همان LAN روی Linux،
Windows، یا میزبان غیر macOS دیگر مفید است، Bonjour را به‌صراحت فعال کنید:

```bash
openclaw plugins enable bonjour
```

وقتی فعال باشد، Bonjour از `discovery.mdns.mode` استفاده می‌کند تا تصمیم بگیرد چه مقدار metadata در TXT
منتشر کند. حالت پیش‌فرض `minimal` است؛ فقط وقتی کلاینت‌های محلی به راهنمایی‌های
`cliPath` یا `sshPort` نیاز دارند از `full` استفاده کنید، و برای سرکوب چندپخشی LAN بدون
تغییر فعال‌بودن Plugin از `off` استفاده کنید.

## چه زمانی Bonjour را غیرفعال کنیم

وقتی تبلیغ چندپخشی LAN غیرضروری، ناموجود،
یا مضر است، Bonjour را غیرفعال نگه دارید. موارد رایج شامل سرورهای غیر macOS، شبکه‌سازی Docker bridge،
WSL، یا policy شبکه‌ای است که چندپخشی mDNS را drop می‌کند. در آن محیط‌ها
Gateway همچنان از طریق URL منتشرشدهٔ خود، SSH، Tailnet، یا DNS-SD گسترده
قابل دسترسی است، اما کشف خودکار LAN قابل اتکا نیست.

وقتی مشکل مربوط به محدودهٔ استقرار است، override محیطی موجود را ترجیح دهید:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

این کار تبلیغ چندپخشی LAN را بدون تغییر پیکربندی Plugin غیرفعال می‌کند.
برای imageهای Docker، فایل‌های service، اسکریپت‌های launch، و اشکال‌زدایی‌های یک‌باره
امن است، چون تنظیم با از بین رفتن محیط ناپدید می‌شود.

وقتی عمداً می‌خواهید Plugin همراه کشف LAN را برای آن پیکربندی OpenClaw خاموش کنید، از پیکربندی Plugin استفاده کنید:

```bash
openclaw plugins disable bonjour
```

## نکات مهم Docker

Plugin همراه Bonjour در containerهای شناسایی‌شده وقتی `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد، تبلیغ چندپخشی LAN را به‌صورت خودکار غیرفعال می‌کند. شبکه‌های Docker bridge
معمولاً چندپخشی mDNS (`224.0.0.251:5353`) را بین container
و LAN forward نمی‌کنند، بنابراین تبلیغ از داخل container به‌ندرت باعث کار کردن کشف می‌شود.

نکات مهم:

- Bonjour روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و در جاهای دیگر نیازمند فعال‌سازی اختیاری است. غیرفعال گذاشتن آن
  Gateway را متوقف نمی‌کند؛ فقط تبلیغ چندپخشی LAN را رد می‌کند.
- غیرفعال کردن Bonjour مقدار `gateway.bind` را تغییر نمی‌دهد؛ Docker همچنان به‌صورت پیش‌فرض از
  `OPENCLAW_GATEWAY_BIND=lan` استفاده می‌کند تا پورت منتشرشدهٔ میزبان کار کند.
- غیرفعال کردن Bonjour، DNS-SD گسترده را غیرفعال نمی‌کند. وقتی Gateway و node روی یک LAN یکسان نیستند، از کشف گسترده
  یا Tailnet استفاده کنید.
- استفادهٔ دوباره از همان `OPENCLAW_CONFIG_DIR` بیرون از Docker، policy غیرفعال‌سازی خودکار container را پایدار نمی‌کند.
- `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host networking، macvlan، یا شبکهٔ دیگری
  تنظیم کنید که مشخص است چندپخشی mDNS از آن عبور می‌کند؛ برای غیرفعال‌سازی اجباری آن را روی `1` تنظیم کنید.

## عیب‌یابی Bonjour غیرفعال‌شده

اگر یک node پس از راه‌اندازی Docker دیگر Gateway را خودکار کشف نمی‌کند:

1. تأیید کنید Gateway در حالت خودکار، اجباری روشن، یا اجباری خاموش اجرا می‌شود:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأیید کنید خود Gateway از طریق پورت منتشرشده قابل دسترسی است:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. وقتی Bonjour غیرفعال است از هدف مستقیم استفاده کنید:
   - Control UI یا ابزارهای محلی: `http://127.0.0.1:18789`
   - کلاینت‌های LAN: `http://<gateway-host>:18789`
   - کلاینت‌های بین‌شبکه‌ای: Tailnet MagicDNS، IP مربوط به Tailnet، تونل SSH، یا
     DNS-SD گسترده

4. اگر عمداً Plugin مربوط به Bonjour را در Docker فعال کرده‌اید و تبلیغ را
   با `OPENCLAW_DISABLE_BONJOUR=0` اجباری کرده‌اید، چندپخشی را از میزبان تست کنید:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   اگر مرور خالی است یا logهای Gateway لغوهای تکراری watchdog مربوط به ciao را نشان می‌دهند، `OPENCLAW_DISABLE_BONJOUR=1` را بازگردانید و از مسیر مستقیم یا
   Tailnet استفاده کنید.

## حالت‌های رایج خرابی

- **Bonjour از شبکه‌ها عبور نمی‌کند**: از Tailnet یا SSH استفاده کنید.
- **چندپخشی مسدود شده است**: برخی شبکه‌های Wi‑Fi، mDNS را غیرفعال می‌کنند.
- **Advertiser در probing/announcing گیر کرده است**: میزبان‌هایی با چندپخشی مسدود،
  bridgeهای container، WSL، یا نوسان interface می‌توانند advertiser مربوط به ciao را در وضعیت
  اعلام‌نشده رها کنند. OpenClaw چند بار retry می‌کند و سپس به‌جای راه‌اندازی مجدد advertiser برای همیشه، Bonjour
  را برای process فعلی Gateway غیرفعال می‌کند.
- **شبکه‌سازی Docker bridge**: Bonjour در containerهای شناسایی‌شده خودکار غیرفعال می‌شود.
  `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host، macvlan، یا شبکهٔ دیگری
  با قابلیت mDNS تنظیم کنید.
- **Sleep / نوسان interface**: macOS ممکن است موقتاً نتایج mDNS را drop کند؛ دوباره تلاش کنید.
- **مرور کار می‌کند اما resolve شکست می‌خورد**: نام ماشین‌ها را ساده نگه دارید (از emoji یا
  نشانه‌گذاری پرهیز کنید)، سپس Gateway را راه‌اندازی مجدد کنید. نام instance سرویس از
  نام میزبان گرفته می‌شود، بنابراین نام‌های بیش‌ازحد پیچیده می‌توانند برخی resolverها را سردرگم کنند.

## نام‌های instance escape‌شده (`\032`)

Bonjour/DNS‑SD اغلب byteها را در نام‌های instance سرویس به‌صورت sequenceهای ده‌دهی `\DDD`
escape می‌کند (برای مثال فاصله‌ها به `\032` تبدیل می‌شوند).

- این در سطح protocol عادی است.
- UIها باید برای نمایش decode کنند (iOS از `BonjourEscapes.decode` استفاده می‌کند).

## فعال‌سازی / غیرفعال‌سازی / پیکربندی

- میزبان‌های macOS به‌صورت پیش‌فرض Plugin همراه کشف LAN را خودکار شروع می‌کنند.
- `openclaw plugins enable bonjour`، Plugin همراه کشف LAN را روی میزبان‌هایی فعال می‌کند که به‌صورت پیش‌فرض فعال نیست.
- `openclaw plugins disable bonjour` با غیرفعال کردن Plugin همراه، تبلیغ چندپخشی LAN را غیرفعال می‌کند.
- `OPENCLAW_DISABLE_BONJOUR=1` تبلیغ چندپخشی LAN را بدون تغییر پیکربندی Plugin غیرفعال می‌کند؛ مقدارهای truthy پذیرفته‌شده `1`، `true`، `yes`، و `on` هستند (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` تبلیغ چندپخشی LAN را، حتی داخل containerهای شناسایی‌شده، اجباری روشن می‌کند؛ مقدارهای falsy پذیرفته‌شده `0`، `false`، `no`، و `off` هستند.
- وقتی Plugin مربوط به Bonjour فعال است و `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده، Bonjour روی میزبان‌های عادی تبلیغ می‌کند و داخل containerهای شناسایی‌شده خودکار غیرفعال می‌شود.
- `gateway.bind` در `~/.openclaw/openclaw.json` حالت bind مربوط به Gateway را کنترل می‌کند.
- `OPENCLAW_SSH_PORT` وقتی `sshPort` تبلیغ می‌شود، پورت SSH را override می‌کند (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` وقتی حالت کامل mDNS فعال است، یک راهنمای MagicDNS را در TXT منتشر می‌کند (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` مسیر CLI تبلیغ‌شده را override می‌کند (legacy: `OPENCLAW_CLI_PATH`).

## مستندات مرتبط

- policy کشف و انتخاب transport: [کشف](/fa/gateway/discovery)
- جفت‌سازی node + تأییدها: [جفت‌سازی Gateway](/fa/gateway/pairing)
