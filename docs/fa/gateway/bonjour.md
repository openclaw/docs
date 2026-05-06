---
read_when:
    - عیب‌یابی مشکلات کشف Bonjour در macOS/iOS
    - تغییر انواع سرویس mDNS، رکوردهای TXT، یا تجربه کاربری کشف
summary: کشف و اشکال‌زدایی Bonjour/mDNS (اعلان‌های Gateway، کلاینت‌ها و حالت‌های رایج خرابی)
title: کشف Bonjour
x-i18n:
    generated_at: "2026-05-06T09:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw می‌تواند از Bonjour (mDNS / DNS-SD) برای کشف یک Gateway فعال (نقطه پایانی WebSocket) استفاده کند.
مرور multicast `local.` یک **امکان LAN-only** است. Plugin همراه `bonjour`
مالک اعلان LAN است. روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و روی
Linux، Windows و استقرارهای Gateway کانتینری اختیاری است. برای کشف بین شبکه‌ای، همان
beacon می‌تواند از طریق یک دامنه wide-area DNS-SD پیکربندی‌شده نیز منتشر شود. کشف
همچنان best-effort است و **جایگزین** اتصال مبتنی بر SSH یا Tailnet نمی‌شود.

## Bonjour ناحیه گسترده (Unicast DNS-SD) روی Tailscale

اگر node و gateway روی شبکه‌های متفاوت باشند، multicast mDNS از مرز شبکه
عبور نمی‌کند. می‌توانید با تغییر به **unicast DNS-SD**
("Wide-Area Bonjour") روی Tailscale همان تجربه کشف را حفظ کنید.

گام‌های کلی:

1. یک DNS server روی میزبان gateway اجرا کنید (قابل دسترسی از طریق Tailnet).
2. رکوردهای DNS-SD را برای `_openclaw-gw._tcp` زیر یک zone اختصاصی منتشر کنید
   (مثال: `openclaw.internal.`).
3. **split DNS** در Tailscale را پیکربندی کنید تا دامنه انتخابی شما برای clientها
   (از جمله iOS) از طریق آن DNS server resolve شود.

OpenClaw از هر دامنه کشفی پشتیبانی می‌کند؛ `openclaw.internal.` فقط یک مثال است.
nodeهای iOS/Android هم `local.` و هم دامنه ناحیه گسترده پیکربندی‌شده شما را مرور می‌کنند.

### پیکربندی Gateway (توصیه‌شده)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### راه‌اندازی یک‌باره DNS server (میزبان gateway)

```bash
openclaw dns setup --apply
```

این کار CoreDNS را نصب و آن را طوری پیکربندی می‌کند که:

- فقط روی پورت 53 و فقط روی interfaceهای Tailscale مربوط به gateway گوش دهد
- دامنه انتخابی شما (مثال: `openclaw.internal.`) را از `~/.openclaw/dns/<domain>.db` سرو کند

از یک ماشین متصل به tailnet اعتبارسنجی کنید:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### تنظیمات DNS در Tailscale

در کنسول مدیریت Tailscale:

- یک nameserver اضافه کنید که به IP مربوط به tailnet gateway اشاره کند (UDP/TCP 53).
- split DNS اضافه کنید تا دامنه کشف شما از آن nameserver استفاده کند.

پس از اینکه clientها DNS مربوط به tailnet را پذیرفتند، nodeهای iOS و کشف CLI می‌توانند
`_openclaw-gw._tcp` را در دامنه کشف شما بدون multicast مرور کنند.

### امنیت listener Gateway (توصیه‌شده)

پورت WS مربوط به Gateway (پیش‌فرض `18789`) به‌طور پیش‌فرض به loopback bind می‌شود. برای دسترسی LAN/tailnet،
به‌صورت صریح bind کنید و auth را فعال نگه دارید.

برای راه‌اندازی‌های فقط tailnet:

- مقدار `gateway.bind: "tailnet"` را در `~/.openclaw/openclaw.json` تنظیم کنید.
- Gateway را restart کنید (یا اپ menubar در macOS را restart کنید).

## چه چیزی اعلان می‌کند

فقط Gateway مقدار `_openclaw-gw._tcp` را اعلان می‌کند. اعلان LAN multicast
زمانی توسط Plugin همراه `bonjour` فراهم می‌شود که Plugin فعال باشد؛ انتشار wide-area
DNS-SD همچنان متعلق به Gateway است.

## انواع service

- `_openclaw-gw._tcp` - beacon انتقال gateway (استفاده‌شده توسط nodeهای macOS/iOS/Android).

## کلیدهای TXT (راهنماهای غیرمحرمانه)

Gateway راهنماهای کوچک و غیرمحرمانه‌ای را اعلان می‌کند تا flowهای UI راحت باشند:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط وقتی TLS فعال باشد)
- `gatewayTlsSha256=<sha256>` (فقط وقتی TLS فعال باشد و fingerprint در دسترس باشد)
- `canvasPort=<port>` (فقط وقتی میزبان canvas فعال باشد؛ در حال حاضر همان `gatewayPort` است)
- `transport=gateway`
- `tailnetDns=<magicdns>` (فقط حالت کامل mDNS، راهنمای اختیاری وقتی Tailnet در دسترس باشد)
- `sshPort=<port>` (فقط حالت کامل mDNS؛ wide-area DNS-SD ممکن است آن را حذف کند)
- `cliPath=<path>` (فقط حالت کامل mDNS؛ wide-area DNS-SD همچنان آن را به‌عنوان راهنمای نصب remote می‌نویسد)

نکات امنیتی:

- رکوردهای TXT مربوط به Bonjour/mDNS **احراز هویت نشده‌اند**. Clientها نباید TXT را routing معتبر تلقی کنند.
- Clientها باید با استفاده از endpoint سرویس resolve‌شده (SRV + A/AAAA) route کنند. `lanHost`، `tailnetDns`، `gatewayPort` و `gatewayTlsSha256` را فقط به‌عنوان راهنما تلقی کنید.
- هدف‌گیری خودکار SSH نیز باید از میزبان سرویس resolve‌شده استفاده کند، نه راهنماهای فقط TXT.
- TLS pinning هرگز نباید اجازه دهد `gatewayTlsSha256` اعلان‌شده یک pin ذخیره‌شده قبلی را override کند.
- nodeهای iOS/Android باید اتصال‌های مستقیم مبتنی بر کشف را **فقط TLS** تلقی کنند و پیش از اعتماد به fingerprint برای اولین بار، تایید صریح کاربر را الزامی کنند.

## Debugging در macOS

ابزارهای داخلی مفید:

- مرور instanceها:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- resolve کردن یک instance (جایگزین کردن `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

اگر مرور کار می‌کند اما resolve شکست می‌خورد، معمولاً با یک policy مربوط به LAN یا
مشکل resolver در mDNS روبه‌رو هستید.

## Debugging در لاگ‌های Gateway

Gateway یک فایل لاگ چرخشی می‌نویسد (در startup به‌صورت
`gateway log file: ...` چاپ می‌شود). به‌دنبال خط‌های `bonjour:` بگردید، به‌ویژه:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour از hostname سیستم برای میزبان `.local` اعلان‌شده استفاده می‌کند، وقتی که
یک DNS label معتبر باشد. اگر hostname سیستم شامل فاصله، underscore، یا کاراکتر
نامعتبر دیگری برای DNS-label باشد، OpenClaw به `openclaw.local` برمی‌گردد. وقتی به یک
host label صریح نیاز دارید، پیش از شروع Gateway مقدار
`OPENCLAW_MDNS_HOSTNAME=<name>` را تنظیم کنید.

## Debugging روی node iOS

node iOS از `NWBrowser` برای کشف `_openclaw-gw._tcp` استفاده می‌کند.

برای گرفتن لاگ‌ها:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → بازتولید → **Copy**

لاگ شامل گذارهای وضعیت browser و تغییرات result-set است.

## چه زمانی Bonjour را فعال کنید

Bonjour برای startup Gateway با پیکربندی خالی روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود، چون
اپ محلی و nodeهای iOS/Android نزدیک معمولاً به کشف روی همان LAN متکی هستند.

وقتی کشف خودکار روی همان LAN در Linux،
Windows، یا میزبان غیر macOS دیگری مفید است، Bonjour را صریحاً فعال کنید:

```bash
openclaw plugins enable bonjour
```

وقتی فعال باشد، Bonjour از `discovery.mdns.mode` استفاده می‌کند تا تصمیم بگیرد چه مقدار metadata
TXT منتشر کند. حالت پیش‌فرض `minimal` است؛ فقط وقتی clientهای محلی به راهنماهای
`cliPath` یا `sshPort` نیاز دارند از `full` استفاده کنید، و برای سرکوب LAN multicast بدون
تغییر فعال‌سازی Plugin از `off` استفاده کنید.

## چه زمانی Bonjour را غیرفعال کنید

وقتی اعلان LAN multicast غیرضروری، در دسترس نبودنی،
یا مضر است Bonjour را غیرفعال نگه دارید. موارد رایج شامل سرورهای غیر macOS، شبکه Docker bridge،
WSL، یا policy شبکه‌ای است که mDNS multicast را drop می‌کند. در این محیط‌ها
Gateway همچنان از طریق URL منتشرشده، SSH، Tailnet یا wide-area
DNS-SD قابل دسترسی است، اما کشف خودکار LAN قابل اتکا نیست.

وقتی مشکل مربوط به scope استقرار است، override محیطی موجود را ترجیح دهید:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

این کار اعلان LAN multicast را بدون تغییر پیکربندی Plugin غیرفعال می‌کند.
برای imageهای Docker، service fileها، scriptهای launch و debugging یک‌باره
امن است، چون وقتی environment از بین برود، setting هم ناپدید می‌شود.

وقتی عمداً می‌خواهید Plugin کشف LAN همراه را برای آن پیکربندی OpenClaw خاموش کنید،
از پیکربندی Plugin استفاده کنید:

```bash
openclaw plugins disable bonjour
```

## نکات Docker

Plugin همراه Bonjour اعلان LAN multicast را در containerهای شناسایی‌شده، وقتی
`OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد، به‌صورت خودکار غیرفعال می‌کند. شبکه‌های Docker bridge
معمولاً mDNS multicast (`224.0.0.251:5353`) را بین container
و LAN forward نمی‌کنند، بنابراین اعلان از داخل container به‌ندرت باعث کار کردن کشف می‌شود.

نکات مهم:

- Bonjour روی میزبان‌های macOS به‌صورت خودکار شروع می‌شود و در جاهای دیگر opt-in است. غیرفعال گذاشتن آن
  Gateway را متوقف نمی‌کند؛ فقط اعلان LAN multicast را رد می‌کند.
- غیرفعال کردن Bonjour مقدار `gateway.bind` را تغییر نمی‌دهد؛ Docker همچنان به‌صورت پیش‌فرض از
  `OPENCLAW_GATEWAY_BIND=lan` استفاده می‌کند تا پورت منتشرشده میزبان بتواند کار کند.
- غیرفعال کردن Bonjour، wide-area DNS-SD را غیرفعال نمی‌کند. وقتی Gateway و node روی یک LAN نیستند،
  از کشف wide-area یا Tailnet استفاده کنید.
- استفاده دوباره از همان `OPENCLAW_CONFIG_DIR` خارج از Docker، policy auto-disable مربوط به
  container را پایدار نمی‌کند.
- مقدار `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host networking، macvlan، یا شبکه دیگری
  که مشخص است mDNS multicast از آن عبور می‌کند تنظیم کنید؛ برای force-disable آن را روی `1` بگذارید.

## عیب‌یابی Bonjour غیرفعال

اگر یک node پس از راه‌اندازی Docker دیگر Gateway را به‌صورت خودکار کشف نمی‌کند:

1. تأیید کنید Gateway در حالت auto، forced-on یا forced-off اجرا می‌شود:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأیید کنید خود Gateway از طریق پورت منتشرشده قابل دسترسی است:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. وقتی Bonjour غیرفعال است از target مستقیم استفاده کنید:
   - Control UI یا ابزارهای محلی: `http://127.0.0.1:18789`
   - Clientهای LAN: `http://<gateway-host>:18789`
   - Clientهای بین‌شبکه‌ای: Tailnet MagicDNS، IP مربوط به Tailnet، تونل SSH، یا
     wide-area DNS-SD

4. اگر عمداً Plugin مربوط به Bonjour را در Docker فعال کرده‌اید و اعلان را با
   `OPENCLAW_DISABLE_BONJOUR=0` اجباری کرده‌اید، multicast را از میزبان test کنید:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   اگر مرور خالی است یا لاگ‌های Gateway لغوهای مکرر watchdog مربوط به ciao را نشان می‌دهند،
   مقدار `OPENCLAW_DISABLE_BONJOUR=1` را برگردانید و از یک route مستقیم یا
   Tailnet استفاده کنید.

## حالت‌های رایج شکست

- **Bonjour از شبکه‌ها عبور نمی‌کند**: از Tailnet یا SSH استفاده کنید.
- **Multicast مسدود شده است**: برخی شبکه‌های Wi-Fi، mDNS را غیرفعال می‌کنند.
- **Advertiser در probing/announcing گیر کرده است**: میزبان‌هایی با multicast مسدودشده،
  bridgeهای container، WSL، یا churn در interface می‌توانند advertiser مربوط به ciao را در یک
  وضعیت non-announced باقی بگذارند. OpenClaw چند بار retry می‌کند و سپس Bonjour را
  برای process فعلی Gateway غیرفعال می‌کند، به‌جای اینکه advertiser را برای همیشه restart کند.
- **Docker bridge networking**: Bonjour در containerهای شناسایی‌شده به‌صورت خودکار غیرفعال می‌شود.
  مقدار `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host، macvlan، یا شبکه دیگری
  که قابلیت mDNS دارد تنظیم کنید.
- **Sleep / churn در interface**: macOS ممکن است موقتاً resultهای mDNS را drop کند؛ retry کنید.
- **مرور کار می‌کند اما resolve شکست می‌خورد**: نام ماشین‌ها را ساده نگه دارید (از emoji یا
  punctuation پرهیز کنید)، سپس Gateway را restart کنید. نام instance سرویس از
  نام host مشتق می‌شود، بنابراین نام‌های بیش از حد پیچیده می‌توانند برخی resolverها را سردرگم کنند.

## نام‌های instance escape‌شده (`\032`)

Bonjour/DNS-SD اغلب byteها را در نام‌های service instance به‌صورت دنباله‌های اعشاری `\DDD`
escape می‌کند (مثلاً فاصله‌ها به `\032` تبدیل می‌شوند).

- این در سطح protocol عادی است.
- UIها باید برای نمایش decode کنند (iOS از `BonjourEscapes.decode` استفاده می‌کند).

## فعال‌سازی / غیرفعال‌سازی / پیکربندی

- میزبان‌های macOS به‌صورت پیش‌فرض Plugin کشف LAN همراه را خودکار شروع می‌کنند.
- `openclaw plugins enable bonjour`، Plugin کشف LAN همراه را روی میزبان‌هایی که به‌صورت پیش‌فرض فعال نیست فعال می‌کند.
- `openclaw plugins disable bonjour` با غیرفعال کردن Plugin همراه، اعلان LAN multicast را غیرفعال می‌کند.
- `OPENCLAW_DISABLE_BONJOUR=1` اعلان LAN multicast را بدون تغییر config مربوط به Plugin غیرفعال می‌کند؛ مقدارهای truthy پذیرفته‌شده `1`، `true`، `yes` و `on` هستند (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` اعلان LAN multicast را روشن می‌کند، از جمله داخل containerهای شناسایی‌شده؛ مقدارهای falsy پذیرفته‌شده `0`، `false`، `no` و `off` هستند.
- وقتی Plugin مربوط به Bonjour فعال است و `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده، Bonjour روی میزبان‌های معمولی اعلان می‌کند و داخل containerهای شناسایی‌شده خودکار غیرفعال می‌شود.
- `gateway.bind` در `~/.openclaw/openclaw.json` حالت bind مربوط به Gateway را کنترل می‌کند.
- `OPENCLAW_SSH_PORT` وقتی `sshPort` اعلان می‌شود پورت SSH را override می‌کند (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` وقتی حالت کامل mDNS فعال باشد یک راهنمای MagicDNS را در TXT منتشر می‌کند (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` مسیر CLI اعلان‌شده را override می‌کند (legacy: `OPENCLAW_CLI_PATH`).

## مستندات مرتبط

- policy کشف و انتخاب transport: [کشف](/fa/gateway/discovery)
- pairing مربوط به Node + تأییدها: [pairing Gateway](/fa/gateway/pairing)
