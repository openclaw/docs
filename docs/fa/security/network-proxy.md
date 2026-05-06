---
read_when:
    - می‌خواهید در برابر حملات SSRF و بازپیوند DNS دفاع در عمق داشته باشید
    - پیکربندی یک پروکسی فوروارد خارجی برای ترافیک زمان اجرای OpenClaw
summary: نحوهٔ هدایت ترافیک HTTP و WebSocket زمان اجرای OpenClaw از طریق یک پروکسی فیلترکننده مدیریت‌شده توسط اپراتور
title: پروکسی شبکه
x-i18n:
    generated_at: "2026-05-06T18:02:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw می‌تواند ترافیک HTTP و WebSocket زمان اجرا را از طریق یک forward proxy مدیریت‌شده توسط اپراتور مسیریابی کند. این یک دفاع اختیاریِ چندلایه برای استقرارهایی است که کنترل مرکزی خروجی، محافظت قوی‌تر در برابر SSRF و قابلیت ممیزی بهتر شبکه می‌خواهند.

OpenClaw هیچ proxyای را همراه خود عرضه، دانلود، اجرا، پیکربندی یا تأیید نمی‌کند. شما فناوری proxy مناسب محیط خود را اجرا می‌کنید و OpenClaw کلاینت‌های HTTP و WebSocket معمولیِ محلیِ فرایند را از طریق آن مسیریابی می‌کند.

## چرا از proxy استفاده کنیم

proxy به اپراتورها یک نقطه کنترل شبکه برای ترافیک خروجی HTTP و WebSocket می‌دهد. این حتی خارج از سخت‌سازی SSRF هم می‌تواند مفید باشد:

- سیاست مرکزی: به‌جای تکیه بر اینکه هر محل فراخوانی HTTP در برنامه قواعد شبکه را درست اعمال کند، یک سیاست خروجی را نگه‌داری کنید.
- بررسی‌های زمان اتصال: مقصد را پس از رفع DNS و بلافاصله پیش از اینکه proxy اتصال بالادستی را باز کند ارزیابی کنید.
- دفاع در برابر DNS rebinding: فاصله بین بررسی DNS در سطح برنامه و اتصال خروجی واقعی را کاهش دهید.
- پوشش گسترده‌تر JavaScript: کلاینت‌های معمولی `fetch`، `node:http`، `node:https`، WebSocket، axios، got، node-fetch و کلاینت‌های مشابه را از همان مسیر عبور دهید.
- قابلیت ممیزی: مقصدهای مجاز و ردشده را در مرز خروجی ثبت کنید.
- کنترل عملیاتی: بدون بازسازی OpenClaw، قواعد مقصد، بخش‌بندی شبکه، محدودیت‌های نرخ یا فهرست‌های مجاز خروجی را اعمال کنید.

مسیریابی proxy یک محافظ در سطح فرایند برای خروجی معمولی HTTP و WebSocket است. این به اپراتورها یک مسیر fail-closed برای مسیریابی کلاینت‌های HTTP پشتیبانی‌شده JavaScript از طریق proxy فیلترکننده خودشان می‌دهد، اما sandbox شبکه در سطح OS نیست و باعث نمی‌شود OpenClaw سیاست مقصد proxy را تأیید کند.

## OpenClaw چگونه ترافیک را مسیریابی می‌کند

وقتی `proxy.enabled=true` باشد و یک URL برای proxy پیکربندی شده باشد، فرایندهای زمان اجرای محافظت‌شده مانند `openclaw gateway run`، `openclaw node run` و `openclaw agent --local` خروجی معمولی HTTP و WebSocket را از طریق proxy پیکربندی‌شده مسیریابی می‌کنند:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

قرارداد عمومی، رفتار مسیریابی است، نه hookهای داخلی Node که برای پیاده‌سازی آن استفاده می‌شوند. کلاینت‌های WebSocket صفحه کنترل OpenClaw Gateway برای ترافیک RPC local loopback Gateway، وقتی URL Gateway از `localhost` یا یک IP loopback صریح مانند `127.0.0.1` یا `[::1]` استفاده کند، از یک مسیر مستقیم محدود استفاده می‌کنند. آن مسیر صفحه کنترل باید بتواند به Gatewayهای loopback برسد، حتی وقتی proxy اپراتور مقصدهای loopback را مسدود می‌کند. درخواست‌های HTTP و WebSocket معمولی زمان اجرا همچنان از proxy پیکربندی‌شده استفاده می‌کنند.

در داخل، OpenClaw برای این قابلیت از دو hook مسیریابی در سطح فرایند استفاده می‌کند:

- مسیریابی dispatcher در Undici، `fetch`، کلاینت‌های مبتنی بر undici و transportهایی را پوشش می‌دهد که dispatcher undici خودشان را ارائه می‌کنند.
- مسیریابی `global-agent` فراخوان‌های هسته Node برای `node:http` و `node:https` را پوشش می‌دهد، از جمله بسیاری از کتابخانه‌هایی که روی `http.request`، `https.request`، `http.get` و `https.get` ساخته شده‌اند. حالت proxy مدیریت‌شده آن عامل سراسری را اجباری می‌کند تا عامل‌های صریح HTTP در Node به‌طور تصادفی proxy اپراتور را دور نزنند.

برخی Pluginها مالک transportهای سفارشی هستند که حتی وقتی مسیریابی در سطح فرایند وجود دارد، به سیم‌کشی صریح proxy نیاز دارند. برای مثال، transport مربوط به Bot API در Telegram از dispatcher HTTP/1 undici خودش استفاده می‌کند و بنابراین در آن مسیر transport مالک‌محور، env مربوط به proxy فرایند به‌همراه fallback مدیریت‌شده `OPENCLAW_PROXY_URL` را رعایت می‌کند.

خود URL مربوط به proxy باید از `http://` استفاده کند. مقصدهای HTTPS همچنان از طریق proxy با HTTP `CONNECT` پشتیبانی می‌شوند؛ این فقط یعنی OpenClaw انتظار یک شنونده forward-proxy ساده HTTP مانند `http://127.0.0.1:3128` را دارد.

وقتی proxy فعال است، OpenClaw مقادیر `no_proxy`، `NO_PROXY` و `GLOBAL_AGENT_NO_PROXY` را پاک می‌کند. این فهرست‌های دورزدن مبتنی بر مقصد هستند، بنابراین باقی گذاشتن `localhost` یا `127.0.0.1` در آن‌ها باعث می‌شود هدف‌های پرخطر SSRF از proxy فیلترکننده عبور نکنند.

هنگام خاموشی، OpenClaw محیط proxy قبلی را بازیابی می‌کند و وضعیت cache‌شده مسیریابی فرایند را بازنشانی می‌کند.

## اصطلاحات مرتبط proxy

- `proxy.enabled` / `proxy.proxyUrl`: مسیریابی forward-proxy خروجی برای خروجی زمان اجرای OpenClaw. این صفحه این قابلیت را مستند می‌کند.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت reverse-proxy ورودی و آگاه از هویت برای دسترسی به Gateway. ببینید [احراز هویت proxy مورد اعتماد](/fa/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy اشکال‌زدایی محلی و بازرس capture برای توسعه و پشتیبانی. ببینید [openclaw proxy](/fa/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: گزینه opt-in برای `web_fetch` تا یک proxy محیطی HTTP(S) تحت کنترل اپراتور DNS را resolve کند، در حالی‌که pinning سخت‌گیرانه DNS و سیاست نام میزبان پیش‌فرض حفظ می‌شود. ببینید [Web fetch](/fa/tools/web-fetch#trusted-env-proxy).
- تنظیمات proxy خاص کانال یا provider: overrideهای مالک‌محور برای یک transport خاص. وقتی هدف کنترل مرکزی خروجی در سراسر زمان اجرا است، proxy شبکه مدیریت‌شده را ترجیح دهید.

## پیکربندی

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

همچنین می‌توانید URL را از طریق محیط ارائه کنید، در حالی‌که `proxy.enabled=true` را در config نگه می‌دارید:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` نسبت به `OPENCLAW_PROXY_URL` اولویت دارد.

### حالت loopback Gateway

کلاینت‌های صفحه کنترل Gateway محلی معمولاً به یک WebSocket loopback مانند `ws://127.0.0.1:18789` وصل می‌شوند. از `proxy.loopbackMode` استفاده کنید تا تعیین کنید این ترافیک هنگام فعال بودن proxy مدیریت‌شده چگونه رفتار کند:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (پیش‌فرض): OpenClaw مرجع loopback مربوط به Gateway را در کنترلر فعال `NO_PROXY` در `global-agent` ثبت می‌کند تا ترافیک WebSocket محلی Gateway بتواند مستقیم وصل شود. پورت‌های سفارشی loopback Gateway کار می‌کنند، چون میزبان و پورت URL فعال Gateway ثبت می‌شوند.
- `proxy`: OpenClaw هیچ مرجع loopback `NO_PROXY` مربوط به Gateway را ثبت نمی‌کند، بنابراین ترافیک محلی Gateway از طریق proxy مدیریت‌شده ارسال می‌شود. اگر proxy از راه دور باشد، باید مسیریابی ویژه‌ای برای سرویس loopback میزبان OpenClaw فراهم کند، مانند نگاشت آن به یک نام میزبان، IP یا tunnel قابل دسترس برای proxy. proxyهای راه دور استاندارد، `127.0.0.1` و `localhost` را از میزبان proxy resolve می‌کنند، نه از میزبان OpenClaw.
- `block`: OpenClaw پیش از باز کردن socket، اتصال‌های loopback صفحه کنترل Gateway را رد می‌کند.

اگر `enabled=true` باشد اما URL معتبر proxy پیکربندی نشده باشد، فرمان‌های محافظت‌شده به‌جای بازگشت به دسترسی مستقیم شبکه، در startup شکست می‌خورند.

برای سرویس‌های gateway مدیریت‌شده که با `openclaw gateway start` شروع می‌شوند، ذخیره URL در config را ترجیح دهید:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

fallback محیطی برای اجراهای foreground مناسب‌تر است. اگر آن را با یک سرویس نصب‌شده استفاده می‌کنید، `OPENCLAW_PROXY_URL` را در محیط پایدار سرویس، مانند `$OPENCLAW_STATE_DIR/.env` یا `~/.openclaw/.env` قرار دهید، سپس سرویس را دوباره نصب کنید تا launchd، systemd یا Scheduled Tasks gateway را با آن مقدار شروع کند.

برای فرمان‌های `openclaw --container ...`، OpenClaw وقتی `OPENCLAW_PROXY_URL` تنظیم شده باشد، آن را به CLI فرزند هدف‌گذاری‌شده برای container منتقل می‌کند. URL باید از داخل container قابل دسترس باشد؛ `127.0.0.1` به خود container اشاره می‌کند، نه میزبان. OpenClaw برای فرمان‌های هدف‌گذاری‌شده به container، URLهای proxy loopback را رد می‌کند، مگر اینکه آن بررسی ایمنی را صریحاً override کنید.

## الزامات proxy

سیاست proxy مرز امنیتی است. OpenClaw نمی‌تواند تأیید کند که proxy هدف‌های درست را مسدود می‌کند.

proxy را طوری پیکربندی کنید که:

- فقط به loopback یا یک interface خصوصی مورد اعتماد bind شود.
- دسترسی را محدود کند تا فقط فرایند، میزبان، container یا حساب سرویس OpenClaw بتواند از آن استفاده کند.
- مقصدها را خودش resolve کند و IPهای مقصد را پس از رفع DNS مسدود کند.
- سیاست را در زمان اتصال هم برای درخواست‌های HTTP ساده و هم برای tunnelهای HTTPS `CONNECT` اعمال کند.
- دورزدن‌های مبتنی بر مقصد را برای بازه‌های loopback، خصوصی، link-local، metadata، multicast، reserved یا documentation رد کند.
- از allowlistهای نام میزبان پرهیز کند، مگر اینکه به مسیر رفع DNS کاملاً اعتماد داشته باشید.
- مقصد، تصمیم، وضعیت و دلیل را بدون ثبت بدنه‌های درخواست، headerهای authorization، cookieها یا رازهای دیگر log کند.
- سیاست proxy را تحت version control نگه دارد و تغییرات را مانند پیکربندی حساس امنیتی بازبینی کند.

## مقصدهای پیشنهادی برای مسدودسازی

از این denylist به‌عنوان نقطه شروع برای هر forward proxy، firewall یا سیاست خروجی استفاده کنید.

منطق classifier در سطح برنامه OpenClaw در `src/infra/net/ssrf.ts` و `src/shared/net/ip.ts` قرار دارد. hookهای parity مرتبط `BLOCKED_HOSTNAMES`، `BLOCKED_IPV4_SPECIAL_USE_RANGES`، `BLOCKED_IPV6_SPECIAL_USE_RANGES`، `RFC2544_BENCHMARK_PREFIX` و handling sentinel داخلی IPv4 برای NAT64، 6to4، Teredo، ISATAP و شکل‌های IPv4-mapped هستند. آن فایل‌ها هنگام نگه‌داری یک سیاست proxy خارجی مرجع‌های مفیدی هستند، اما OpenClaw آن قواعد را به‌طور خودکار در proxy شما export یا enforce نمی‌کند.

| بازه یا میزبان                                                                        | دلیل مسدودسازی                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | loopback در IPv4                                        |
| `::1/128`                                                                            | loopback در IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | آدرس‌های نامشخص و این-شبکه               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | شبکه‌های خصوصی RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | آدرس‌های link-local و مسیرهای رایج metadata ابری |
| `169.254.169.254`, `metadata.google.internal`                                        | سرویس‌های metadata ابری                              |
| `100.64.0.0/10`                                                                      | فضای آدرس مشترک carrier-grade NAT               |
| `198.18.0.0/15`, `2001:2::/48`                                                       | بازه‌های benchmarking                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | بازه‌های special-use و documentation                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 رزروشده                                        |
| `fc00::/7`, `fec0::/10`                                                              | بازه‌های محلی/خصوصی IPv6                            |
| `100::/64`, `2001:20::/28`                                                           | بازه‌های discard و ORCHIDv2 در IPv6                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | پیشوندهای NAT64 با IPv4 تعبیه‌شده                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 و Teredo با IPv4 تعبیه‌شده                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 سازگار با IPv4 و IPv4-mapped                 |

اگر cloud provider یا پلتفرم شبکه شما میزبان‌های metadata یا بازه‌های reserved بیشتری را مستند کرده است، آن‌ها را هم اضافه کنید.

## اعتبارسنجی

proxy را از همان میزبان، container یا حساب سرویس که OpenClaw را اجرا می‌کند اعتبارسنجی کنید:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

به‌طور پیش‌فرض، وقتی مقصدهای سفارشی ارائه نشده باشند، فرمان بررسی می‌کند که `https://example.com/` موفق شود و یک نشانهٔ آزمایشی loopback موقت را شروع می‌کند که پراکسی نباید به آن برسد. بررسی رد پیش‌فرض وقتی موفق است که پراکسی یک پاسخ رد غیر 2xx برگرداند یا نشانهٔ آزمایشی را با خطای انتقال مسدود کند؛ اگر پاسخی موفق به نشانهٔ آزمایشی برسد، شکست می‌خورد. اگر هیچ پراکسی‌ای فعال و پیکربندی نشده باشد، اعتبارسنجی یک مشکل پیکربندی گزارش می‌کند؛ برای یک پیش‌پرواز موردی پیش از تغییر پیکربندی، از `--proxy-url` استفاده کنید. برای آزمودن انتظارهای ویژهٔ استقرار، از `--allowed-url` و `--denied-url` استفاده کنید. برای اینکه همچنین بررسی شود تحویل مستقیم APNs از طریق HTTP/2 می‌تواند یک تونل CONNECT را از مسیر پراکسی باز کند و یک پاسخ sandbox APNs دریافت کند، `--apns-reachable` را اضافه کنید؛ این کاوش از یک توکن ارائه‌دهندهٔ عمداً نامعتبر استفاده می‌کند، بنابراین `403 InvalidProviderToken` مورد انتظار است و به‌عنوان قابل‌دسترسی محسوب می‌شود. مقصدهای رد سفارشی به‌صورت بسته در حالت شکست عمل می‌کنند: هر پاسخ HTTP یعنی مقصد از طریق پراکسی قابل‌دسترسی بوده است، و هر خطای انتقال به‌عنوان نامشخص گزارش می‌شود، چون OpenClaw نمی‌تواند ثابت کند پراکسی یک مبدأ قابل‌دسترسی را مسدود کرده است. در صورت شکست اعتبارسنجی، فرمان با کد 1 خارج می‌شود.

برای خودکارسازی از `--json` استفاده کنید. خروجی JSON شامل نتیجهٔ کلی، منبع مؤثر پیکربندی پراکسی، هرگونه خطای پیکربندی، و هر بررسی مقصد است. اعتبارنامه‌های URL پراکسی در خروجی متنی و JSON پوشانده می‌شوند:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

همچنین می‌توانید به‌صورت دستی با `curl` اعتبارسنجی کنید:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

درخواست عمومی باید موفق شود. درخواست‌های loopback و فراداده باید توسط پراکسی مسدود شوند. برای `openclaw proxy validate`، نشانهٔ آزمایشی loopback داخلی می‌تواند رد شدن توسط پراکسی را از یک مبدأ قابل‌دسترسی تشخیص دهد. بررسی‌های سفارشی `--denied-url` آن نشانهٔ آزمایشی را ندارند، بنابراین هم پاسخ‌های HTTP و هم خطاهای انتقال مبهم را به‌عنوان شکست اعتبارسنجی در نظر بگیرید، مگر اینکه پراکسی شما یک نشانهٔ رد ویژهٔ استقرار ارائه کند که بتوانید جداگانه آن را راستی‌آزمایی کنید.

سپس مسیریابی پراکسی OpenClaw را فعال کنید:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

یا تنظیم کنید:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## محدودیت‌ها

- پراکسی پوشش را برای کلاینت‌های HTTP و WebSocket جاوااسکریپتِ محلیِ فرایند بهبود می‌دهد، اما sandbox شبکه در سطح سیستم‌عامل نیست.
- ترافیک صفحهٔ کنترل loopback در Gateway به‌طور پیش‌فرض از طریق `proxy.loopbackMode: "gateway-only"` با عبور مستقیم محلی انجام می‌شود. OpenClaw این عبور را با ثبت مرجع loopback فعال Gateway در کنترل‌کنندهٔ `NO_PROXY` مدیریت‌شدهٔ `global-agent` پیاده‌سازی می‌کند. اپراتورها می‌توانند `proxy.loopbackMode: "proxy"` را تنظیم کنند تا ترافیک loopback در Gateway از طریق پراکسی مدیریت‌شده ارسال شود، یا `proxy.loopbackMode: "block"` را تنظیم کنند تا اتصال‌های loopback در Gateway رد شوند. برای نکتهٔ احتیاطی پراکسی راه‌دور، [حالت Loopback در Gateway](#gateway-loopback-mode) را ببینید.
- سوکت‌های خام `net`، `tls` و `http2`، افزونه‌های بومی، و فرایندهای فرزند غیر OpenClaw ممکن است مسیریابی پراکسی در سطح Node را دور بزنند، مگر اینکه متغیرهای محیطی پراکسی را به ارث ببرند و رعایت کنند. CLIهای فرزند منشعب‌شدهٔ OpenClaw نشانی URL پراکسی مدیریت‌شده و وضعیت `proxy.loopbackMode` را به ارث می‌برند.
- IRC یک کانال TCP/TLS خام خارج از مسیریابی پراکسی روبه‌جلوی مدیریت‌شده توسط اپراتور است. در استقرارهایی که لازم است همهٔ خروجی‌ها از آن پراکسی روبه‌جلو عبور کنند، مگر اینکه خروجی مستقیم IRC صریحاً تأیید شده باشد، `channels.irc.enabled=false` را تنظیم کنید.
- پراکسی اشکال‌زدایی محلی ابزار تشخیصی است و ارسال مستقیم بالادستی آن برای درخواست‌های پراکسی و تونل‌های CONNECT به‌طور پیش‌فرض هنگام فعال بودن حالت پراکسی مدیریت‌شده غیرفعال است؛ ارسال مستقیم را فقط برای تشخیص‌های محلی تأییدشده فعال کنید.
- WebUIهای محلی کاربر و سرورهای مدل محلی باید در صورت نیاز در سیاست پراکسی اپراتور allowlist شوند؛ OpenClaw برای آن‌ها یک عبور عمومی از شبکهٔ محلی ارائه نمی‌کند.
- عبور پراکسی صفحهٔ کنترل Gateway عمداً به `localhost` و URLهای IP صریح loopback محدود شده است. برای اتصال‌های محلی مستقیم صفحهٔ کنترل Gateway از `ws://127.0.0.1:18789`، `ws://[::1]:18789`، یا `ws://localhost:18789` استفاده کنید؛ نام‌های میزبان دیگر مانند ترافیک عادی مبتنی بر نام میزبان مسیریابی می‌شوند.
- OpenClaw سیاست پراکسی شما را بازرسی، آزمون، یا گواهی نمی‌کند.
- تغییرات سیاست پراکسی را تغییرات عملیاتی حساس از نظر امنیتی در نظر بگیرید.
