---
read_when:
    - اجرای راه‌اندازی‌های Gateway راه‌دور یا عیب‌یابی آن‌ها
summary: دسترسی از راه دور با استفاده از Gateway WS، تونل‌های SSH و شبکه‌های Tailscale
title: دسترسی از راه دور
x-i18n:
    generated_at: "2026-07-12T10:05:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw یک Gateway (گره اصلی) را روی یک میزبان اجرا می‌کند و همهٔ کلاینت‌ها را به آن متصل می‌کند. Gateway مالک نشست‌ها، پروفایل‌های احراز هویت، کانال‌ها و وضعیت است؛ هر چیز دیگری یک کلاینت محسوب می‌شود.

- **اپراتورها** (شما یا برنامهٔ macOS): وقتی Gateway در دسترس باشد، WebSocket مستقیم از طریق LAN/Tailnet ساده‌ترین روش است؛ تونل‌سازی SSH راهکار جایگزین همگانی است.
- **Nodeها** (iOS/Android و دستگاه‌های دیگر): به **WebSocket** مربوط به Gateway متصل می‌شوند (از طریق LAN/tailnet یا تونل SSH).

## ایدهٔ اصلی

WebSocket مربوط به Gateway به‌طور پیش‌فرض روی **local loopback** و در پورت `18789` (`gateway.port`) متصل می‌شود. برای استفادهٔ راه‌دور، آن را از طریق Tailscale Serve یا اتصال مطمئن LAN-Tailnet در دسترس قرار دهید، یا پورت local loopback را از طریق SSH فوروارد کنید.

## گزینه‌های توپولوژی

| راه‌اندازی                           | محل اجرای Gateway                                                                                                 | مناسب برای                                                                                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gateway همیشه‌روشن در tailnet شما    | میزبان دائمی (VPS یا سرور خانگی) که از طریق Tailscale یا SSH در دسترس است                                          | لپ‌تاپ‌هایی که اغلب به حالت خواب می‌روند اما باید عامل همیشه روشن بماند. [exe.dev](/fa/install/exe-dev) (ماشین مجازی آسان) یا [Hetzner](/fa/install/hetzner) (VPS عملیاتی) را ببینید. |
| رایانهٔ رومیزی خانگی                 | رایانهٔ رومیزی؛ لپ‌تاپ از طریق حالت راه‌دور برنامهٔ macOS متصل می‌شود (تنظیمات ← اتصال ← محل اجرای OpenClaw)       | نگه‌داشتن عامل روی سخت‌افزاری که روشن می‌ماند. راهنمای اجرایی: [دسترسی راه‌دور macOS](/fa/platforms/mac/remote).                                                               |
| لپ‌تاپ                               | لپ‌تاپ که به‌صورت امن از طریق تونل SSH یا Tailscale Serve در دسترس قرار گرفته است (`gateway.bind: "loopback"` را حفظ کنید) | راه‌اندازی‌های تک‌ماشینه. [Tailscale](/fa/gateway/tailscale) و [وب](/fa/web) را ببینید.                                                                                          |

برای راه‌اندازی‌های همیشه‌روشن و لپ‌تاپ، بهتر است `gateway.bind: "loopback"` را حفظ کنید و برای رابط کاربری کنترل از **Tailscale Serve** یا اتصال مطمئن LAN/Tailnet همراه با `gateway.remote.transport: "direct"` استفاده کنید. تونل SSH راهکار جایگزینی است که از هر ماشینی کار می‌کند.

## جریان فرمان (هر بخش کجا اجرا می‌شود)

یک Gateway مالک وضعیت و کانال‌ها است؛ Nodeها تجهیزات جانبی هستند. نمونه (پیام Telegram که به ابزار یک Node هدایت می‌شود):

1. پیام Telegram به **Gateway** می‌رسد.
2. Gateway **عامل** را اجرا می‌کند و عامل تصمیم می‌گیرد که آیا ابزار یک Node را فراخوانی کند.
3. Gateway از طریق WebSocket مربوط به Gateway، **Node** را فراخوانی می‌کند (`node.invoke` RPC).
4. Node نتیجه را برمی‌گرداند؛ Gateway به Telegram پاسخ می‌دهد.

Nodeها سرویس Gateway را اجرا نمی‌کنند. در هر میزبان باید فقط یک Gateway اجرا شود، مگر اینکه عمداً پروفایل‌های مجزا اجرا کنید ([چند Gateway](/fa/gateway/multiple-gateways) را ببینید). «حالت Node» برنامهٔ macOS صرفاً یک کلاینت Node روی WebSocket مربوط به Gateway است.

## تونل SSH ‏(CLI و ابزارها)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

پس از برقراری تونل، `openclaw health` و `openclaw status --deep` از طریق `ws://127.0.0.1:18789` به Gateway راه‌دور دسترسی پیدا می‌کنند. `openclaw gateway status`،‏ `openclaw gateway health`،‏ `openclaw gateway probe` و `openclaw gateway call` نیز می‌توانند با استفاده از `--url` یک نشانی فورواردشده را هدف قرار دهند.

<Note>
`18789` را با `gateway.port` پیکربندی‌شدهٔ خود (یا `--port` / `OPENCLAW_GATEWAY_PORT`) جایگزین کنید.
</Note>

<Warning>
`--url` هرگز برای اطلاعات هویتی به پیکربندی یا محیط بازنمی‌گردد. `--token` یا `--password` را صریحاً ارسال کنید؛ بدون آن‌ها، کلاینت هیچ اطلاعات هویتی ارسال نمی‌کند و اگر Gateway مقصد به احراز هویت نیاز داشته باشد، اتصال ناموفق خواهد بود.
</Warning>

## پیش‌فرض‌های راه‌دور CLI

یک مقصد راه‌دور را ذخیره کنید تا فرمان‌های CLI به‌طور پیش‌فرض از آن استفاده کنند:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

وقتی Gateway فقط روی local loopback قرار دارد، نشانی را روی `ws://127.0.0.1:18789` نگه دارید و ابتدا تونل SSH را باز کنید. در انتقال تونل SSH برنامهٔ macOS، نام میزبان Gateway کشف‌شده در `gateway.remote.sshTarget` قرار می‌گیرد (`user@host` یا `user@host:port`)؛ `gateway.remote.url` همان نشانی تونل محلی باقی می‌ماند. اگر پورت راه‌دور با پورت محلی متفاوت است، `gateway.remote.remotePort` را تنظیم کنید.

اعتبارسنجی کلید میزبان به‌طور پیش‌فرض سخت‌گیرانه است (`gateway.remote.sshHostKeyPolicy: "strict"`). برای واگذاری آن به پیکربندی مؤثر OpenSSH خود، مقدار را روی `"openssh"` تنظیم کنید؛ پیش از فعال‌سازی، تنظیمات SSH کاربر و سیستم خود را بررسی کنید.

برای Gatewayای که از قبل در یک LAN یا Tailnet مطمئن در دسترس است، از حالت مستقیم استفاده کنید:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## اولویت اطلاعات هویتی

تفکیک اطلاعات هویتی Gateway در مسیرهای فراخوانی/کاوش/وضعیت و پایش تأیید اجرای Discord از یک قرارداد مشترک پیروی می‌کند. میزبان Node نیز با یک استثنا در حالت محلی از همین قرارداد استفاده می‌کند (`gateway.remote.*` را نادیده می‌گیرد).

- اطلاعات هویتی صریح (`--token`،‏ `--password` یا `gatewayToken` یک ابزار) در مسیرهای فراخوانی که احراز هویت صریح را می‌پذیرند، همیشه اولویت دارند.
- ایمنی بازنویسی نشانی:
  - گزینهٔ `--url` در CLI هرگز از اطلاعات هویتی ضمنی پیکربندی/محیط استفاده نمی‌کند.
  - متغیر محیطی `OPENCLAW_GATEWAY_URL` فقط می‌تواند از اطلاعات هویتی محیطی استفاده کند (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- پیش‌فرض‌های حالت محلی:
  - توکن: `OPENCLAW_GATEWAY_TOKEN` ← `gateway.auth.token` ← `gateway.remote.token` (بازگشت به مقدار راه‌دور فقط وقتی توکن محلی تنظیم نشده باشد)
  - گذرواژه: `OPENCLAW_GATEWAY_PASSWORD` ← `gateway.auth.password` ← `gateway.remote.password` (بازگشت به مقدار راه‌دور فقط وقتی گذرواژهٔ محلی تنظیم نشده باشد)
- پیش‌فرض‌های حالت راه‌دور:
  - توکن: `gateway.remote.token` ← `OPENCLAW_GATEWAY_TOKEN` ← `gateway.auth.token`
  - گذرواژه: `OPENCLAW_GATEWAY_PASSWORD` ← `gateway.remote.password` ← `gateway.auth.password`
- استثنای حالت محلی میزبان Node:‏ `gateway.remote.token` / `gateway.remote.password` نادیده گرفته می‌شوند.
- بررسی‌های توکن کاوش/وضعیت راه‌دور به‌طور پیش‌فرض سخت‌گیرانه‌اند: هنگام هدف‌گیری حالت راه‌دور فقط از `gateway.remote.token` استفاده می‌کنند (بدون بازگشت به توکن محلی).
- بازنویسی‌های محیطی Gateway فقط از `OPENCLAW_GATEWAY_*` استفاده می‌کنند.

## دسترسی راه‌دور به رابط کاربری گفت‌وگو

WebChat پورت HTTP جداگانه‌ای ندارد؛ رابط کاربری گفت‌وگوی SwiftUI مستقیماً به WebSocket مربوط به Gateway متصل می‌شود.

- پورت `18789` را از طریق SSH فوروارد کنید (بخش بالا را ببینید)، سپس کلاینت‌ها را به `ws://127.0.0.1:18789` متصل کنید.
- برای حالت مستقیم LAN/Tailnet، کلاینت‌ها را به نشانی خصوصی پیکربندی‌شدهٔ `ws://` یا نشانی امن `wss://` متصل کنید.
- در macOS، حالت راه‌دور برنامه انتقال انتخاب‌شده را به‌طور خودکار مدیریت می‌کند.

## حالت راه‌دور برنامهٔ macOS

برنامهٔ نوار منوی macOS همین راه‌اندازی را از ابتدا تا انتها مدیریت می‌کند: بررسی‌های وضعیت راه‌دور، WebChat و فورواردکردن Voice Wake. راهنمای اجرایی: [دسترسی راه‌دور macOS](/fa/platforms/mac/remote).

## قواعد امنیتی (راه‌دور/VPN)

Gateway را **فقط روی local loopback** نگه دارید، مگر اینکه مطمئن باشید به اتصال دیگری نیاز دارید.

- **local loopback همراه با SSH/Tailscale Serve** امن‌ترین حالت پیش‌فرض است (بدون قرارگیری در معرض دسترسی عمومی).
- `ws://` بدون رمزنگاری برای local loopback، شبکهٔ خصوصی/LAN ‏(RFC 1918)، پیوند محلی، CGNAT و میزبان‌های `.local` و `.ts.net` پذیرفته می‌شود. میزبان‌های عمومی راه‌دور باید از `wss://` استفاده کنند.
- **اتصال‌های غیر-local loopback** (`lan`/`tailnet`/`custom` یا `auto` وقتی local loopback در دسترس نیست) باید از احراز هویت Gateway استفاده کنند: توکن، گذرواژه یا پراکسی معکوس آگاه از هویت همراه با `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` منابع اطلاعات هویتی کلاینت هستند؛ این مقادیر به‌تنهایی احراز هویت سرور را پیکربندی نمی‌کنند.
- مسیرهای فراخوانی محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان مقدار جایگزین استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده اما قابل تفکیک نباشد، فرایند به‌صورت بسته و ناموفق پایان می‌یابد (مقدار جایگزین راه‌دور خطا را پنهان نمی‌کند).
- `gateway.remote.tlsFingerprint` گواهی TLS راه‌دور را برای `wss://`، از جمله حالت مستقیم macOS، سنجاق می‌کند. بدون اثر انگشت ذخیره‌شده، macOS فقط پس از موفقیت اعتماد معمول سیستم، در نخستین استفاده آن را سنجاق می‌کند؛ Gatewayهای خودامضا یا دارای مرجع صدور گواهی خصوصی به اثر انگشت صریح یا اتصال راه‌دور از طریق SSH نیاز دارند.
- **Tailscale Serve** می‌تواند ترافیک رابط کاربری کنترل/WebSocket را با سرآیندهای هویتی احراز کند، مشروط بر اینکه `gateway.auth.allowTailscale: true` باشد. نقاط پایانی HTTP API از این احراز هویت مبتنی بر سرآیند استفاده نمی‌کنند و در عوض از حالت عادی احراز هویت HTTP مربوط به Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway قابل اعتماد است؛ برای استفاده از احراز هویت با راز مشترک در همه‌جا، آن را روی `false` تنظیم کنید.
- احراز هویت **پراکسی مطمئن** به‌طور پیش‌فرض انتظار یک پراکسی غیر-local loopback و آگاه از هویت را دارد. پراکسی‌های معکوس local loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
- کنترل از طریق مرورگر را همانند دسترسی اپراتور در نظر بگیرید: فقط در tailnet و همراه با جفت‌سازی آگاهانهٔ Node.

بررسی عمیق: [امنیت](/fa/gateway/security).

### macOS: تونل دائمی SSH از طریق LaunchAgent

برای کلاینت‌های macOS، ساده‌ترین راه‌اندازی دائمی از یک ورودی پیکربندی SSH برای `LocalForward` به‌همراه یک LaunchAgent استفاده می‌کند که تونل را پس از راه‌اندازی مجدد و خرابی فعال نگه می‌دارد.

#### گام ۱: افزودن پیکربندی SSH

فایل `~/.ssh/config` را ویرایش کنید:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` و `<REMOTE_USER>` را با مقادیر خود جایگزین کنید.

#### گام ۲: کپی‌کردن کلید SSH (یک‌بار)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### گام ۳: پیکربندی توکن Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

اگر Gateway راه‌دور از احراز هویت با گذرواژه استفاده می‌کند، به‌جای آن از `gateway.remote.password` استفاده کنید. `OPENCLAW_GATEWAY_TOKEN` همچنان به‌عنوان بازنویسی در سطح پوسته معتبر است، اما راه‌اندازی پایدار کلاینت راه‌دور `gateway.remote.token` / `gateway.remote.password` است.

#### گام ۴: ایجاد LaunchAgent

آن را با نام `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` ذخیره کنید:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### گام ۵: بارگذاری LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

تونل هنگام ورود به سیستم به‌طور خودکار آغاز می‌شود، پس از خرابی دوباره راه‌اندازی می‌شود و پورت فورواردشده را فعال نگه می‌دارد.

<Note>
اگر از راه‌اندازی قدیمی یک LaunchAgent با نام `com.openclaw.ssh-tunnel` باقی مانده است، آن را از بار خارج و حذف کنید.
</Note>

#### عیب‌یابی

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| ورودی پیکربندی                       | کاری که انجام می‌دهد                                                       |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | پورت محلی ۱۸۷۸۹ را به پورت راه‌دور ۱۸۷۸۹ فوروارد می‌کند                    |
| `ssh -N`                             | اجرای SSH بدون اجرای فرمان‌های راه‌دور (فقط فورواردکردن پورت)              |
| `KeepAlive`                          | اگر تونل دچار خرابی شود، آن را به‌طور خودکار دوباره راه‌اندازی می‌کند       |
| `RunAtLoad`                          | هنگام بارگذاری LaunchAgent در زمان ورود به سیستم، تونل را آغاز می‌کند       |

## مطالب مرتبط

- [Tailscale](/fa/gateway/tailscale)
- [احراز هویت](/fa/gateway/authentication)
- [راه‌اندازی Gateway راه‌دور](/fa/gateway/remote-gateway-readme)
