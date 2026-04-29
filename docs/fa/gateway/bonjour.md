---
read_when:
    - اشکال‌زدایی مشکلات کشف Bonjour در macOS/iOS
    - تغییر انواع سرویس mDNS، رکوردهای TXT، یا تجربه کاربری کشف
summary: کشف و اشکال‌زدایی Bonjour/mDNS (بیکن‌های Gateway، کلاینت‌ها، و حالت‌های رایج خرابی)
title: کشف Bonjour
x-i18n:
    generated_at: "2026-04-29T22:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# کشف Bonjour / mDNS

OpenClaw از Bonjour (mDNS / DNS‑SD) برای کشف یک Gateway فعال (نقطه پایانی WebSocket) استفاده می‌کند.
مرور Multicast در `local.` یک **امکان فقط برای LAN** است. Plugin همراه `bonjour`
مالک تبلیغ LAN است و به‌صورت پیش‌فرض فعال است. برای کشف بین شبکه‌ای،
همین beacon می‌تواند از طریق یک دامنه DNS-SD گسترده پیکربندی‌شده نیز منتشر شود.
کشف همچنان بهترین تلاش است و جایگزین اتصال مبتنی بر SSH یا Tailnet **نمی‌شود**.

## Bonjour گسترده (Unicast DNS-SD) از طریق Tailscale

اگر node و gateway روی شبکه‌های متفاوت باشند، multicast mDNS از مرز شبکه عبور نمی‌کند.
می‌توانید همان تجربه کشف را با تغییر به **unicast DNS‑SD**
("Wide‑Area Bonjour") از طریق Tailscale حفظ کنید.

گام‌های کلی:

1. یک DNS server روی میزبان gateway اجرا کنید (قابل دسترسی از طریق Tailnet).
2. رکوردهای DNS‑SD را برای `_openclaw-gw._tcp` زیر یک zone اختصاصی منتشر کنید
   (مثال: `openclaw.internal.`).
3. **split DNS** در Tailscale را پیکربندی کنید تا دامنه انتخابی شما برای clients
   (از جمله iOS) از طریق آن DNS server resolve شود.

OpenClaw از هر دامنه کشفی پشتیبانی می‌کند؛ `openclaw.internal.` فقط یک مثال است.
nodeهای iOS/Android هم `local.` و هم دامنه گسترده پیکربندی‌شده شما را مرور می‌کنند.

### پیکربندی Gateway (پیشنهادی)

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

این کار CoreDNS را نصب و آن را پیکربندی می‌کند تا:

- فقط روی port 53 در interfaceهای Tailscale مربوط به gateway گوش کند
- دامنه انتخابی شما (مثال: `openclaw.internal.`) را از `~/.openclaw/dns/<domain>.db` سرو کند

از یک ماشین متصل به tailnet اعتبارسنجی کنید:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### تنظیمات DNS در Tailscale

در کنسول مدیریت Tailscale:

- یک nameserver اضافه کنید که به IP tailnet مربوط به gateway اشاره کند (UDP/TCP 53).
- split DNS اضافه کنید تا دامنه کشف شما از آن nameserver استفاده کند.

وقتی clients، DNS مربوط به tailnet را بپذیرند، nodeهای iOS و کشف CLI می‌توانند
`_openclaw-gw._tcp` را در دامنه کشف شما بدون multicast مرور کنند.

### امنیت listener در Gateway (پیشنهادی)

port مربوط به Gateway WS (پیش‌فرض `18789`) به‌صورت پیش‌فرض به loopback متصل می‌شود. برای دسترسی LAN/tailnet
به‌صورت صریح bind کنید و auth را فعال نگه دارید.

برای راه‌اندازی‌های فقط tailnet:

- `gateway.bind: "tailnet"` را در `~/.openclaw/openclaw.json` تنظیم کنید.
- Gateway را restart کنید (یا app نوار منوی macOS را restart کنید).

## چه چیزی تبلیغ می‌شود

فقط Gateway، `_openclaw-gw._tcp` را تبلیغ می‌کند. تبلیغ multicast در LAN
توسط Plugin همراه `bonjour` فراهم می‌شود؛ انتشار DNS-SD گسترده همچنان
در مالکیت Gateway باقی می‌ماند.

## انواع service

- `_openclaw-gw._tcp` — beacon انتقال gateway (استفاده‌شده توسط nodeهای macOS/iOS/Android).

## کلیدهای TXT (راهنماهای غیرمحرمانه)

Gateway راهنماهای کوچک غیرمحرمانه‌ای را تبلیغ می‌کند تا flowهای UI راحت‌تر باشند:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط وقتی TLS فعال باشد)
- `gatewayTlsSha256=<sha256>` (فقط وقتی TLS فعال باشد و fingerprint در دسترس باشد)
- `canvasPort=<port>` (فقط وقتی canvas host فعال باشد؛ در حال حاضر همان `gatewayPort` است)
- `transport=gateway`
- `tailnetDns=<magicdns>` (فقط حالت کامل mDNS، راهنمای اختیاری وقتی Tailnet در دسترس باشد)
- `sshPort=<port>` (فقط حالت کامل mDNS؛ DNS-SD گسترده ممکن است آن را حذف کند)
- `cliPath=<path>` (فقط حالت کامل mDNS؛ DNS-SD گسترده همچنان آن را به‌عنوان راهنمای نصب از راه دور می‌نویسد)

نکات امنیتی:

- رکوردهای TXT در Bonjour/mDNS **احراز اصالت نشده‌اند**. clients نباید TXT را به‌عنوان routing معتبر در نظر بگیرند.
- clients باید با استفاده از endpoint سرویس resolveشده (SRV + A/AAAA) مسیریابی کنند. `lanHost`، `tailnetDns`، `gatewayPort` و `gatewayTlsSha256` را فقط راهنما بدانید.
- هدف‌گیری خودکار SSH نیز باید از service host resolveشده استفاده کند، نه راهنماهای فقط TXT.
- TLS pinning هرگز نباید اجازه دهد یک `gatewayTlsSha256` تبلیغ‌شده pin ذخیره‌شده قبلی را override کند.
- nodeهای iOS/Android باید اتصال‌های مستقیم مبتنی بر کشف را **فقط TLS** در نظر بگیرند و پیش از اعتماد به fingerprint برای اولین بار، تأیید صریح کاربر را الزامی کنند.

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
مشکل resolver مربوط به mDNS روبه‌رو هستید.

## اشکال‌زدایی در logهای Gateway

Gateway یک فایل log چرخشی می‌نویسد (در startup به‌صورت
`gateway log file: ...` چاپ می‌شود). به‌دنبال خط‌های `bonjour:` بگردید، به‌ویژه:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour وقتی system hostname یک DNS label معتبر باشد، از آن برای host تبلیغ‌شده `.local` استفاده می‌کند.
اگر system hostname شامل فاصله، underscore یا کاراکتر نامعتبر دیگری برای DNS-label باشد،
OpenClaw به `openclaw.local` fallback می‌کند. وقتی به یک host label
صریح نیاز دارید، پیش از شروع Gateway مقدار `OPENCLAW_MDNS_HOSTNAME=<name>` را تنظیم کنید.

## اشکال‌زدایی روی node iOS

node iOS از `NWBrowser` برای کشف `_openclaw-gw._tcp` استفاده می‌کند.

برای capture کردن logها:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → بازتولید → **Copy**

log شامل انتقال‌های state مربوط به browser و تغییرات result-set است.

## چه زمانی Bonjour را غیرفعال کنیم

Bonjour را فقط وقتی غیرفعال کنید که تبلیغ multicast در LAN در دسترس نیست یا زیان‌بار است.
مورد رایج، Gatewayی است که پشت Docker bridge networking، WSL یا
یک policy شبکه اجرا می‌شود که mDNS multicast را drop می‌کند. در این محیط‌ها Gateway
همچنان از طریق URL منتشرشده، SSH، Tailnet یا DNS-SD گسترده قابل دسترسی است،
اما auto-discovery در LAN قابل اعتماد نیست.

وقتی مشکل وابسته به deployment است، ترجیحاً از override محیطی موجود استفاده کنید:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

این کار تبلیغ multicast در LAN را بدون تغییر پیکربندی Plugin غیرفعال می‌کند.
برای Docker images، service files، launch scripts و اشکال‌زدایی موردی
امن است، چون تنظیم با حذف environment از بین می‌رود.

فقط وقتی از پیکربندی Plugin استفاده کنید که عمداً می‌خواهید Plugin کشف LAN
همراه را برای آن پیکربندی OpenClaw خاموش کنید:

```bash
openclaw plugins disable bonjour
```

## نکات مهم Docker

Plugin همراه Bonjour در containerهای شناسایی‌شده، وقتی `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد،
تبلیغ multicast در LAN را به‌صورت خودکار غیرفعال می‌کند. شبکه‌های Docker bridge
معمولاً mDNS multicast (`224.0.0.251:5353`) را بین container
و LAN forward نمی‌کنند، بنابراین تبلیغ از داخل container به‌ندرت باعث کار کردن discovery می‌شود.

نکات مهم:

- غیرفعال کردن Bonjour، Gateway را متوقف نمی‌کند. فقط تبلیغ multicast در LAN را متوقف می‌کند.
- غیرفعال کردن Bonjour، `gateway.bind` را تغییر نمی‌دهد؛ Docker همچنان به‌صورت پیش‌فرض
  `OPENCLAW_GATEWAY_BIND=lan` دارد تا port منتشرشده host بتواند کار کند.
- غیرفعال کردن Bonjour، DNS-SD گسترده را غیرفعال نمی‌کند. وقتی Gateway و node روی یک LAN نیستند،
  از کشف گسترده یا Tailnet استفاده کنید.
- استفاده دوباره از همان `OPENCLAW_CONFIG_DIR` بیرون از Docker، policy غیرفعال‌سازی خودکار
  container را ماندگار نمی‌کند.
- `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host networking، macvlan یا شبکه دیگری
  تنظیم کنید که عبور mDNS multicast در آن مشخصاً ممکن است؛ برای غیرفعال‌سازی اجباری آن را روی `1` بگذارید.

## عیب‌یابی Bonjour غیرفعال

اگر پس از راه‌اندازی Docker، یک node دیگر Gateway را به‌صورت خودکار کشف نمی‌کند:

1. تأیید کنید Gateway در حالت خودکار، forced-on یا forced-off اجرا می‌شود:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأیید کنید خود Gateway از طریق port منتشرشده قابل دسترسی است:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. وقتی Bonjour غیرفعال است، از target مستقیم استفاده کنید:
   - Control UI یا ابزارهای local: `http://127.0.0.1:18789`
   - clients در LAN: `http://<gateway-host>:18789`
   - clients بین شبکه‌ای: Tailnet MagicDNS، IP مربوط به Tailnet، SSH tunnel یا
     DNS-SD گسترده

4. اگر عمداً Bonjour را در Docker با
   `OPENCLAW_DISABLE_BONJOUR=0` فعال کرده‌اید، multicast را از host تست کنید:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   اگر مرور خالی است یا logهای Gateway لغوهای مکرر ciao watchdog را نشان می‌دهند،
   `OPENCLAW_DISABLE_BONJOUR=1` را بازگردانید و از مسیر مستقیم یا
   Tailnet استفاده کنید.

## حالت‌های رایج شکست

- **Bonjour از شبکه‌ها عبور نمی‌کند**: از Tailnet یا SSH استفاده کنید.
- **Multicast مسدود است**: بعضی شبکه‌های Wi‑Fi، mDNS را غیرفعال می‌کنند.
- **Advertiser در probing/announcing گیر کرده است**: hostهایی با multicast مسدود،
  container bridges، WSL یا تغییرات interface می‌توانند ciao advertiser را در
  state اعلام‌نشده رها کنند. OpenClaw چند بار retry می‌کند و سپس به‌جای restart کردن همیشگی advertiser،
  Bonjour را برای process فعلی Gateway غیرفعال می‌کند.
- **Docker bridge networking**: Bonjour در containerهای شناسایی‌شده به‌صورت خودکار غیرفعال می‌شود.
  `OPENCLAW_DISABLE_BONJOUR=0` را فقط برای host، macvlan یا شبکه دیگری
  که قابلیت mDNS دارد تنظیم کنید.
- **Sleep / تغییرات interface**: macOS ممکن است نتایج mDNS را موقتاً حذف کند؛ retry کنید.
- **Browse کار می‌کند اما resolve شکست می‌خورد**: نام ماشین‌ها را ساده نگه دارید (از emoji یا
  نشانه‌گذاری پرهیز کنید)، سپس Gateway را restart کنید. نام service instance از
  host name مشتق می‌شود، بنابراین نام‌های بیش‌ازحد پیچیده می‌توانند بعضی resolverها را گیج کنند.

## نام‌های instance با escape (`\032`)

Bonjour/DNS‑SD اغلب byteها را در نام‌های service instance به‌صورت دنباله‌های decimal `\DDD`
escape می‌کند (برای مثال فاصله‌ها به `\032` تبدیل می‌شوند).

- این در سطح protocol عادی است.
- UIها باید برای نمایش decode کنند (iOS از `BonjourEscapes.decode` استفاده می‌کند).

## غیرفعال‌سازی / پیکربندی

- `openclaw plugins disable bonjour` تبلیغ multicast در LAN را با غیرفعال کردن Plugin همراه غیرفعال می‌کند.
- `openclaw plugins enable bonjour` Plugin پیش‌فرض کشف LAN را بازمی‌گرداند.
- `OPENCLAW_DISABLE_BONJOUR=1` تبلیغ multicast در LAN را بدون تغییر config Plugin غیرفعال می‌کند؛ مقادیر truthy پذیرفته‌شده `1`، `true`، `yes` و `on` هستند (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` تبلیغ multicast در LAN را اجباراً روشن می‌کند، از جمله داخل containerهای شناسایی‌شده؛ مقادیر falsy پذیرفته‌شده `0`، `false`، `no` و `off` هستند.
- وقتی `OPENCLAW_DISABLE_BONJOUR` تنظیم نشده باشد، Bonjour روی hostهای عادی تبلیغ می‌کند و داخل containerهای شناسایی‌شده به‌صورت خودکار غیرفعال می‌شود.
- `gateway.bind` در `~/.openclaw/openclaw.json` حالت bind مربوط به Gateway را کنترل می‌کند.
- `OPENCLAW_SSH_PORT` هنگام تبلیغ شدن `sshPort`، port مربوط به SSH را override می‌کند (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` وقتی حالت کامل mDNS فعال باشد، یک راهنمای MagicDNS در TXT منتشر می‌کند (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` مسیر CLI تبلیغ‌شده را override می‌کند (legacy: `OPENCLAW_CLI_PATH`).

## مستندات مرتبط

- policy کشف و انتخاب transport: [کشف](/fa/gateway/discovery)
- pairing node + approvals: [pairing Gateway](/fa/gateway/pairing)
