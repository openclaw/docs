---
read_when:
    - اشکال‌زدایی مشکلات کشف Bonjour در macOS/iOS
    - تغییر انواع سرویس mDNS، رکوردهای TXT یا تجربه کاربری کشف
summary: کشف و عیب‌یابی Bonjour/mDNS (اعلان‌های Gateway، سرویس‌گیرنده‌ها، و حالت‌های رایج خرابی)
title: کشف Bonjour
x-i18n:
    generated_at: "2026-05-11T20:32:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw می‌تواند از Bonjour (mDNS / DNS-SD) برای کشف یک Gateway فعال (نقطهٔ پایانی WebSocket) استفاده کند.
مرور multicast روی `local.` یک **امکان صرفاً مخصوص LAN** است. Plugin همراه `bonjour`
مالک تبلیغ LAN است. روی میزبان‌های macOS خودکار شروع می‌شود و روی
Linux، Windows و استقرارهای Gateway کانتینری، اختیاری است. برای کشف بین شبکه‌ها، همان
beacon همچنین می‌تواند از طریق یک دامنهٔ wide-area DNS-SD پیکربندی‌شده منتشر شود. کشف
همچنان best-effort است و **جایگزین** اتصال مبتنی بر SSH یا Tailnet نمی‌شود.

## Wide-area Bonjour (Unicast DNS-SD) روی Tailscale

اگر node و gateway روی شبکه‌های متفاوتی باشند، multicast mDNS از
مرز عبور نمی‌کند. می‌توانید همان تجربهٔ کشف را با تغییر به **unicast DNS-SD**
("Wide-Area Bonjour") روی Tailscale حفظ کنید.

گام‌های کلی:

1. یک DNS server روی میزبان gateway اجرا کنید (قابل دسترسی از طریق Tailnet).
2. رکوردهای DNS-SD را برای `_openclaw-gw._tcp` زیر یک zone اختصاصی منتشر کنید
   (مثال: `openclaw.internal.`).
3. **split DNS** در Tailscale را پیکربندی کنید تا دامنهٔ انتخابی شما برای
   clientها (از جمله iOS) از طریق آن DNS server resolve شود.

OpenClaw از هر دامنهٔ کشفی پشتیبانی می‌کند؛ `openclaw.internal.` فقط یک مثال است.
nodeهای iOS/Android هم `local.` و هم دامنهٔ wide-area پیکربندی‌شدهٔ شما را مرور می‌کنند.

### پیکربندی Gateway (توصیه‌شده)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### راه‌اندازی یک‌بارهٔ DNS server (میزبان gateway)

```bash
openclaw dns setup --apply
```

این دستور CoreDNS را نصب و آن را طوری پیکربندی می‌کند که:

- فقط روی پورت 53 و فقط روی interfaceهای Tailscale مربوط به gateway گوش دهد
- دامنهٔ انتخابی شما (مثال: `openclaw.internal.`) را از `~/.openclaw/dns/<domain>.db` سرو کند

از یک ماشین متصل به tailnet اعتبارسنجی کنید:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### تنظیمات DNS در Tailscale

در کنسول مدیریت Tailscale:

- یک nameserver اضافه کنید که به IP مربوط به tailnet در gateway اشاره کند (UDP/TCP 53).
- split DNS اضافه کنید تا دامنهٔ کشف شما از آن nameserver استفاده کند.

وقتی clientها DNS مربوط به tailnet را بپذیرند، nodeهای iOS و کشف CLI می‌توانند
`_openclaw-gw._tcp` را در دامنهٔ کشف شما بدون multicast مرور کنند.

### امنیت listener در Gateway (توصیه‌شده)

پورت WS مربوط به Gateway (پیش‌فرض `18789`) به طور پیش‌فرض به loopback bind می‌شود. برای دسترسی LAN/tailnet،
به‌صورت صریح bind کنید و auth را فعال نگه دارید.

برای راه‌اندازی‌های فقط tailnet:

- `gateway.bind: "tailnet"` را در `~/.openclaw/openclaw.json` تنظیم کنید.
- Gateway را restart کنید (یا app نوار منوی macOS را restart کنید).

## چه چیزی advertise می‌کند

فقط Gateway، `_openclaw-gw._tcp` را advertise می‌کند. تبلیغ multicast در LAN
وقتی Plugin فعال باشد توسط Plugin همراه `bonjour` ارائه می‌شود؛ انتشار
wide-area DNS-SD همچنان تحت مالکیت Gateway است.

## نوع‌های سرویس

- `_openclaw-gw._tcp` - beacon انتقال gateway (استفاده‌شده توسط nodeهای macOS/iOS/Android).

## کلیدهای TXT (راهنماهای غیرمحرمانه)

Gateway راهنماهای کوچک و غیرمحرمانه‌ای را advertise می‌کند تا جریان‌های UI راحت باشند:

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

- رکوردهای TXT در Bonjour/mDNS **احراز هویت نمی‌شوند**. clientها نباید TXT را به‌عنوان مسیر‌یابی معتبر در نظر بگیرند.
- clientها باید با استفاده از نقطهٔ پایانی resolveشدهٔ سرویس (SRV + A/AAAA) مسیر‌یابی کنند. `lanHost`، `tailnetDns`، `gatewayPort` و `gatewayTlsSha256` را فقط راهنما بدانید.
- هدف‌گیری خودکار SSH نیز باید از میزبان سرویس resolveشده استفاده کند، نه راهنماهای فقط TXT.
- TLS pinning هرگز نباید اجازه دهد `gatewayTlsSha256` advertiseشده یک pin ذخیره‌شدهٔ قبلی را override کند.
- nodeهای iOS/Android باید اتصال‌های مستقیم مبتنی بر کشف را **فقط TLS** بدانند و پیش از اعتماد به یک fingerprint برای نخستین بار، تأیید صریح کاربر را لازم بدانند.

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

اگر مرور کار می‌کند اما resolve شکست می‌خورد، معمولاً با یک policy مربوط به LAN یا
مشکل resolver در mDNS روبه‌رو هستید.

## اشکال‌زدایی در logهای Gateway

Gateway یک فایل log چرخشی می‌نویسد (در startup به‌صورت
`gateway log file: ...` چاپ می‌شود). دنبال خطوط `bonjour:` بگردید، به‌ویژه:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

watchdog وضعیت‌های فعال `probing`، `announcing` و conflict-renameهای تازه را
وضعیت‌های در جریان در نظر می‌گیرد. اگر سرویس هرگز به `announced` نرسد، OpenClaw در نهایت
advertiser را دوباره می‌سازد و پس از شکست‌های مکرر، به‌جای advertise دوباره برای همیشه، Bonjour را برای آن
فرایند Gateway غیرفعال می‌کند.

Bonjour برای میزبان `.local` advertiseشده، وقتی hostname سیستم یک DNS label
معتبر باشد، از hostname سیستم استفاده می‌کند. اگر hostname سیستم شامل فاصله، underscore یا نویسهٔ
نامعتبر دیگری برای DNS-label باشد، OpenClaw به `openclaw.local` fallback می‌کند. وقتی به یک
برچسب میزبان صریح نیاز دارید، پیش از شروع Gateway مقدار
`OPENCLAW_MDNS_HOSTNAME=<name>` را تنظیم کنید.

## اشکال‌زدایی روی node iOS

node iOS از `NWBrowser` برای کشف `_openclaw-gw._tcp` استفاده می‌کند.

برای capture کردن logها:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → بازتولید → **Copy**

log شامل تغییر وضعیت‌های browser و تغییرات result-set است.

## چه زمانی Bonjour را فعال کنیم

Bonjour برای startup با پیکربندی خالی Gateway روی میزبان‌های macOS خودکار شروع می‌شود، زیرا
app محلی و nodeهای نزدیک iOS/Android معمولاً به کشف روی همان LAN تکیه می‌کنند.

وقتی کشف خودکار روی همان LAN در Linux،
Windows یا یک میزبان غیر macOS دیگر مفید است، Bonjour را به‌صورت صریح فعال کنید:

```bash
openclaw plugins enable bonjour
```

وقتی فعال باشد، Bonjour از `discovery.mdns.mode` استفاده می‌کند تا تصمیم بگیرد چه مقدار metadata در TXT
منتشر کند. حالت پیش‌فرض `minimal` است؛ فقط وقتی clientهای محلی به راهنماهای
`cliPath` یا `sshPort` نیاز دارند از `full` استفاده کنید، و برای جلوگیری از multicast در LAN بدون
تغییر فعال بودن Plugin از `off` استفاده کنید.

## چه زمانی Bonjour را غیرفعال کنیم

وقتی تبلیغ multicast در LAN غیرضروری، در دسترس نبودنی،
یا زیان‌بار است، Bonjour را غیرفعال نگه دارید. موارد رایج عبارت‌اند از سرورهای غیر macOS، Docker bridge networking،
WSL، یا policy شبکه‌ای که multicast mDNS را drop می‌کند. در این محیط‌ها
Gateway همچنان از طریق URL منتشرشده، SSH، Tailnet یا wide-area
DNS-SD قابل دسترسی است، اما کشف خودکار LAN قابل اعتماد نیست.

وقتی مشکل محدود به deployment است، override موجود در environment را ترجیح دهید:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

این کار تبلیغ multicast در LAN را بدون تغییر پیکربندی Plugin غیرفعال می‌کند.
برای Docker imageها، service fileها، launch scriptها و اشکال‌زدایی‌های یک‌باره
ایمن است، زیرا با حذف environment این تنظیم هم از بین می‌رود.

وقتی عمداً می‌خواهید Plugin کشف LAN همراه را برای آن پیکربندی OpenClaw خاموش کنید،
از پیکربندی Plugin استفاده کنید:

```bash
openclaw plugins disable bonjour
```

## نکات مهم Docker

Plugin همراه Bonjour در containerهای شناسایی‌شده، وقتی `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد،
تبلیغ multicast در LAN را خودکار غیرفعال می‌کند. شبکه‌های Docker bridge
معمولاً multicast mDNS (`224.0.0.251:5353`) را بین container
و LAN forward نمی‌کنند، بنابراین advertise از داخل container به‌ندرت باعث کار کردن discovery می‌شود.

نکات مهم:

- Bonjour روی میزبان‌های macOS خودکار شروع می‌شود و در جای دیگر opt-in است. غیرفعال نگه داشتن آن
  Gateway را متوقف نمی‌کند؛ فقط تبلیغ multicast در LAN را skip می‌کند.
- غیرفعال کردن Bonjour، `gateway.bind` را تغییر نمی‌دهد؛ Docker همچنان به‌طور پیش‌فرض
  `OPENCLAW_GATEWAY_BIND=lan` است تا پورت منتشرشدهٔ میزبان بتواند کار کند.
- غیرفعال کردن Bonjour، wide-area DNS-SD را غیرفعال نمی‌کند. وقتی Gateway و node روی یک LAN نیستند،
  از wide-area discovery
  یا Tailnet استفاده کنید.
- استفادهٔ دوباره از همان `OPENCLAW_CONFIG_DIR` بیرون از Docker، policy غیرفعال‌سازی خودکار
  container را persist نمی‌کند.
- `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host networking، macvlan یا شبکهٔ دیگری
  تنظیم کنید که مشخص است multicast mDNS از آن عبور می‌کند؛ برای force-disable آن را روی `1` تنظیم کنید.

## عیب‌یابی Bonjour غیرفعال‌شده

اگر پس از راه‌اندازی Docker، یک node دیگر Gateway را خودکار discover نمی‌کند:

1. بررسی کنید Gateway در حالت auto، forced-on یا forced-off اجرا می‌شود:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. بررسی کنید خود Gateway از طریق پورت منتشرشده قابل دسترسی است:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. وقتی Bonjour غیرفعال است، از یک target مستقیم استفاده کنید:
   - Control UI یا ابزارهای محلی: `http://127.0.0.1:18789`
   - clientهای LAN: `http://<gateway-host>:18789`
   - clientهای بین شبکه‌ای: Tailnet MagicDNS، IP مربوط به Tailnet، تونل SSH، یا
     wide-area DNS-SD

4. اگر عمداً Plugin Bonjour را در Docker فعال کرده‌اید و advertise را با
   `OPENCLAW_DISABLE_BONJOUR=0` force کرده‌اید، multicast را از میزبان تست کنید:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   اگر مرور خالی است یا logهای Gateway لغوهای مکرر ciao watchdog را نشان می‌دهند،
   `OPENCLAW_DISABLE_BONJOUR=1` را بازگردانید و از یک مسیر مستقیم یا
   Tailnet استفاده کنید.

## حالت‌های رایج شکست

- **Bonjour از شبکه‌ها عبور نمی‌کند**: از Tailnet یا SSH استفاده کنید.
- **Multicast مسدود شده است**: برخی شبکه‌های Wi-Fi، mDNS را غیرفعال می‌کنند.
- **Advertiser در probing/announcing گیر کرده است**: میزبان‌هایی با multicast مسدود،
  container bridgeها، WSL یا تغییرات interface می‌توانند advertiser مربوط به ciao را در
  وضعیت اعلام‌نشده رها کنند. OpenClaw چند بار retry می‌کند و سپس به‌جای restart کردن همیشگی advertiser،
  Bonjour را برای فرایند فعلی Gateway غیرفعال می‌کند.
- **Docker bridge networking**: Bonjour در containerهای شناسایی‌شده خودکار غیرفعال می‌شود.
  `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host، macvlan یا شبکهٔ دیگری
  که قابلیت mDNS دارد تنظیم کنید.
- **Sleep / تغییرات interface**: macOS ممکن است نتایج mDNS را موقتاً drop کند؛ retry کنید.
- **مرور کار می‌کند اما resolve شکست می‌خورد**: نام ماشین‌ها را ساده نگه دارید (از emoji یا
  نشانه‌گذاری پرهیز کنید)، سپس Gateway را restart کنید. نام instance سرویس از
  نام میزبان گرفته می‌شود، بنابراین نام‌های بیش از حد پیچیده می‌توانند برخی resolverها را سردرگم کنند.

## نام‌های instance escapeشده (`\032`)

Bonjour/DNS-SD اغلب byteها را در نام‌های instance سرویس به‌صورت دنباله‌های ده‌دهی `\DDD`
escape می‌کند (مثلاً فاصله‌ها به `\032` تبدیل می‌شوند).

- این در سطح protocol طبیعی است.
- UIها باید برای نمایش decode کنند (iOS از `BonjourEscapes.decode` استفاده می‌کند).

## فعال‌سازی / غیرفعال‌سازی / پیکربندی

- میزبان‌های macOS به‌طور پیش‌فرض Plugin کشف LAN همراه را به‌صورت خودکار راه‌اندازی می‌کنند.
- `openclaw plugins enable bonjour` Plugin کشف LAN همراه را روی میزبان‌هایی که به‌طور پیش‌فرض فعال نیستند فعال می‌کند.
- `openclaw plugins disable bonjour` با غیرفعال کردن Plugin همراه، تبلیغ چندپخشی LAN را غیرفعال می‌کند.
- `OPENCLAW_DISABLE_BONJOUR=1` تبلیغ چندپخشی LAN را بدون تغییر پیکربندی Plugin غیرفعال می‌کند؛ مقادیر truthy پذیرفته‌شده `1`، `true`، `yes` و `on` هستند (قدیمی: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` تبلیغ چندپخشی LAN را، از جمله داخل کانتینرهای شناسایی‌شده، اجبارا فعال می‌کند؛ مقادیر falsy پذیرفته‌شده `0`، `false`، `no` و `off` هستند.
- وقتی Plugin Bonjour فعال باشد و `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد، Bonjour روی میزبان‌های عادی تبلیغ می‌کند و داخل کانتینرهای شناسایی‌شده به‌طور خودکار غیرفعال می‌شود.
- `gateway.bind` در `~/.openclaw/openclaw.json` حالت bind مربوط به Gateway را کنترل می‌کند.
- `OPENCLAW_SSH_PORT` هنگامی که `sshPort` تبلیغ می‌شود، پورت SSH را بازنویسی می‌کند (قدیمی: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` هنگامی که حالت کامل mDNS فعال باشد، یک راهنمای MagicDNS را در TXT منتشر می‌کند (قدیمی: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` مسیر CLI تبلیغ‌شده را بازنویسی می‌کند (قدیمی: `OPENCLAW_CLI_PATH`).

## مستندات مرتبط

- سیاست کشف و انتخاب انتقال: [کشف](/fa/gateway/discovery)
- جفت‌سازی Node + تأییدیه‌ها: [جفت‌سازی Gateway](/fa/gateway/pairing)
