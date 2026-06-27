---
read_when:
    - اجرای راه‌اندازی‌های Gateway راه دور یا عیب‌یابی آن‌ها
summary: دسترسی از راه دور با استفاده از Gateway WS، تونل‌های SSH، و tailnetها
title: دسترسی از راه دور
x-i18n:
    generated_at: "2026-06-27T17:48:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

این مخزن با نگه داشتن یک Gateway واحد (اصلی) روی یک میزبان اختصاصی (دسکتاپ/سرور) و اتصال کلاینت‌ها به آن، از دسترسی Gateway از راه دور پشتیبانی می‌کند.

- برای **اپراتورها (شما / برنامه macOS)**: وقتی Gateway در دسترس است، WebSocket مستقیم LAN/Tailnet ساده‌ترین گزینه است؛ تونل‌زنی SSH گزینه پشتیبان عمومی است.
- برای **گره‌ها (iOS/Android و دستگاه‌های آینده)**: در صورت نیاز، به **WebSocket** Gateway (LAN/tailnet یا تونل SSH) وصل شوید.

## ایده اصلی

- WebSocket Gateway معمولاً روی **loopback** و پورت پیکربندی‌شده شما bind می‌شود (پیش‌فرض 18789 است).
- برای استفاده از راه دور، آن را از طریق Tailscale Serve یا یک bind قابل اعتماد LAN/Tailnet در معرض دسترسی قرار دهید، یا پورت loopback را از طریق SSH forward کنید.

## راه‌اندازی‌های رایج VPN و tailnet

**میزبان Gateway** را جایی در نظر بگیرید که عامل در آن زندگی می‌کند. این میزبان مالک نشست‌ها، پروفایل‌های احراز هویت، کانال‌ها و وضعیت است. لپ‌تاپ، دسکتاپ و گره‌های شما به آن میزبان وصل می‌شوند.

### Gateway همیشه‌روشن در tailnet شما

Gateway را روی یک میزبان پایدار (VPS یا سرور خانگی) اجرا کنید و از طریق **Tailscale** یا SSH به آن دسترسی پیدا کنید.

- **بهترین تجربه کاربری:** `gateway.bind: "loopback"` را نگه دارید و برای رابط کاربری کنترل از **Tailscale Serve** استفاده کنید.
- **LAN/Tailnet قابل اعتماد:** Gateway را به یک رابط خصوصی bind کنید و مستقیماً با `gateway.remote.transport: "direct"` وصل شوید.
- **گزینه پشتیبان:** loopback را همراه با تونل SSH از هر ماشینی که به دسترسی نیاز دارد نگه دارید.
- **نمونه‌ها:** [exe.dev](/fa/install/exe-dev) (VM آسان) یا [Hetzner](/fa/install/hetzner) (VPS تولیدی).

ایده‌آل وقتی لپ‌تاپ شما اغلب به خواب می‌رود اما می‌خواهید عامل همیشه روشن باشد.

### دسکتاپ خانگی Gateway را اجرا می‌کند

لپ‌تاپ **عامل را اجرا نمی‌کند**. از راه دور وصل می‌شود:

- از حالت راه دور برنامه macOS استفاده کنید (Settings → General → OpenClaw runs).
- وقتی Gateway روی LAN/Tailnet در دسترس باشد، برنامه مستقیماً وصل می‌شود، یا وقتی SSH را انتخاب کنید، یک تونل SSH را باز و مدیریت می‌کند.

Runbook: [دسترسی راه دور macOS](/fa/platforms/mac/remote).

### لپ‌تاپ Gateway را اجرا می‌کند

Gateway را محلی نگه دارید اما آن را ایمن در معرض دسترسی قرار دهید:

- از ماشین‌های دیگر به لپ‌تاپ تونل SSH بزنید، یا
- رابط کاربری کنترل را با Tailscale Serve ارائه کنید و Gateway را فقط loopback نگه دارید.

راهنماها: [Tailscale](/fa/gateway/tailscale) و [نمای کلی وب](/fa/web).

## جریان فرمان (چه چیزی کجا اجرا می‌شود)

یک سرویس Gateway مالک وضعیت + کانال‌ها است. گره‌ها پیرامونی هستند.

نمونه جریان (Telegram → گره):

- پیام Telegram به **Gateway** می‌رسد.
- Gateway **عامل** را اجرا می‌کند و تصمیم می‌گیرد آیا یک ابزار گره را فراخوانی کند یا نه.
- Gateway از طریق WebSocket Gateway (`node.*` RPC) **گره** را فراخوانی می‌کند.
- گره نتیجه را برمی‌گرداند؛ Gateway پاسخ را دوباره به Telegram ارسال می‌کند.

نکته‌ها:

- **گره‌ها سرویس Gateway را اجرا نمی‌کنند.** برای هر میزبان فقط یک Gateway باید اجرا شود، مگر اینکه عمداً پروفایل‌های ایزوله اجرا کنید (ببینید [چند Gateway](/fa/gateway/multiple-gateways)).
- «حالت گره» برنامه macOS فقط یک کلاینت گره روی WebSocket Gateway است.

## تونل SSH (CLI + ابزارها)

یک تونل محلی به WS Gateway راه دور بسازید:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

با فعال بودن تونل:

- `openclaw health` و `openclaw status --deep` اکنون از طریق `ws://127.0.0.1:18789` به Gateway راه دور می‌رسند.
- `openclaw gateway status`، `openclaw gateway health`، `openclaw gateway probe` و `openclaw gateway call` نیز در صورت نیاز می‌توانند URL forward‌شده را از طریق `--url` هدف بگیرند.

<Note>
`18789` را با `gateway.port` پیکربندی‌شده خود (یا `--port` یا `OPENCLAW_GATEWAY_PORT`) جایگزین کنید.
</Note>

<Warning>
وقتی `--url` را پاس می‌دهید، CLI به اعتبارنامه‌های config یا محیط برنمی‌گردد. `--token` یا `--password` را صریحاً وارد کنید. نبود اعتبارنامه صریح یک خطاست.
</Warning>

## پیش‌فرض‌های راه دور CLI

می‌توانید یک هدف راه دور را پایدار کنید تا فرمان‌های CLI به‌صورت پیش‌فرض از آن استفاده کنند:

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

وقتی Gateway فقط loopback است، URL را روی `ws://127.0.0.1:18789` نگه دارید و ابتدا تونل SSH را باز کنید.
در انتقال تونل SSH برنامه macOS، نام‌های میزبان Gateway کشف‌شده در
`gateway.remote.sshTarget` قرار می‌گیرند؛ `gateway.remote.url` همان URL تونل محلی می‌ماند.
اگر این پورت‌ها متفاوت هستند، `gateway.remote.remotePort` را روی پورت Gateway در
میزبان SSH تنظیم کنید.

برای Gateway که از قبل روی یک LAN یا Tailnet قابل اعتماد در دسترس است، از حالت مستقیم استفاده کنید:

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

## تقدم اعتبارنامه‌ها

حل اعتبارنامه Gateway در مسیرهای call/probe/status و پایش تأیید اجرای Discord از یک قرارداد مشترک پیروی می‌کند. node-host از همان قرارداد پایه با یک استثنای حالت محلی استفاده می‌کند (عمداً `gateway.remote.*` را نادیده می‌گیرد):

- اعتبارنامه‌های صریح (`--token`، `--password`، یا ابزار `gatewayToken`) همیشه در مسیرهای call که احراز هویت صریح را می‌پذیرند برنده می‌شوند.
- ایمنی بازنویسی URL:
  - بازنویسی‌های URL در CLI (`--url`) هرگز اعتبارنامه‌های ضمنی config/env را دوباره استفاده نمی‌کنند.
  - بازنویسی‌های URL محیط (`OPENCLAW_GATEWAY_URL`) فقط می‌توانند از اعتبارنامه‌های محیط استفاده کنند (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- پیش‌فرض‌های حالت محلی:
  - توکن: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback راه دور فقط وقتی اعمال می‌شود که ورودی توکن auth محلی تنظیم نشده باشد)
  - گذرواژه: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback راه دور فقط وقتی اعمال می‌شود که ورودی گذرواژه auth محلی تنظیم نشده باشد)
- پیش‌فرض‌های حالت راه دور:
  - توکن: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - گذرواژه: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثنای حالت محلی node-host: `gateway.remote.token` / `gateway.remote.password` نادیده گرفته می‌شوند.
- بررسی‌های توکن probe/status راه دور به‌صورت پیش‌فرض سخت‌گیرانه‌اند: هنگام هدف‌گیری حالت راه دور فقط از `gateway.remote.token` استفاده می‌کنند (بدون fallback به توکن محلی).
- بازنویسی‌های محیط Gateway فقط از `OPENCLAW_GATEWAY_*` استفاده می‌کنند.

## دسترسی راه دور رابط کاربری چت

WebChat دیگر از پورت HTTP جداگانه استفاده نمی‌کند. رابط کاربری چت SwiftUI مستقیماً به WebSocket Gateway وصل می‌شود.

- `18789` را از طریق SSH forward کنید (بالا را ببینید)، سپس کلاینت‌ها را به `ws://127.0.0.1:18789` وصل کنید.
- برای حالت مستقیم LAN/Tailnet، کلاینت‌ها را به URL خصوصی `ws://` پیکربندی‌شده یا URL امن `wss://` وصل کنید.
- در macOS، حالت راه دور برنامه را ترجیح دهید؛ این حالت انتقال انتخاب‌شده را به‌صورت خودکار مدیریت می‌کند.

## حالت راه دور برنامه macOS

برنامه نوار منوی macOS می‌تواند همین راه‌اندازی را از ابتدا تا انتها هدایت کند (بررسی‌های وضعیت راه دور، WebChat و forward کردن Voice Wake).

Runbook: [دسترسی راه دور macOS](/fa/platforms/mac/remote).

## قواعد امنیتی (راه دور/VPN)

نسخه کوتاه: **Gateway را فقط loopback نگه دارید** مگر اینکه مطمئن باشید به bind نیاز دارید.

- **Loopback + SSH/Tailscale Serve** امن‌ترین پیش‌فرض است (بدون مواجهه عمومی).
- `ws://` متن ساده برای loopback، LAN، link-local، `.local`، `.ts.net` و میزبان‌های CGNAT Tailscale پذیرفته می‌شود. میزبان‌های عمومی راه دور باید از `wss://` استفاده کنند.
- **bindهای غیر loopback** (`lan`/`tailnet`/`custom`، یا `auto` وقتی loopback در دسترس نیست) باید از احراز هویت Gateway استفاده کنند: توکن، گذرواژه، یا reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` منابع اعتبارنامه کلاینت هستند. آن‌ها به‌تنهایی احراز هویت سرور را پیکربندی **نمی‌کنند**.
- مسیرهای call محلی فقط وقتی می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند که `gateway.auth.*` تنظیم نشده باشد.
- اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده و حل‌نشده باشد، حل اعتبارنامه fail-closed می‌شود (بدون پوشاندن با fallback راه دور).
- `gateway.remote.tlsFingerprint` هنگام استفاده از `wss://`، از جمله در حالت مستقیم macOS، گواهی TLS راه دور را pin می‌کند. بدون pin پیکربندی‌شده یا از قبل ذخیره‌شده، macOS فقط پس از موفقیت اعتماد عادی سیستم، گواهی اولین استفاده را pin می‌کند؛ Gatewayهای self-signed یا private-CA که macOS از قبل به آن‌ها اعتماد ندارد، به fingerprint صریح یا Remote over SSH نیاز دارند.
- **Tailscale Serve** می‌تواند ترافیک رابط کاربری کنترل/WebSocket را از طریق هدرهای هویت
  احراز هویت کند وقتی `gateway.auth.allowTailscale: true` باشد؛ endpointهای HTTP API از
  آن احراز هویت هدر Tailscale استفاده نمی‌کنند و در عوض از حالت auth عادی HTTP
  مربوط به Gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان Gateway قابل اعتماد است. اگر احراز هویت shared-secret را همه‌جا می‌خواهید، آن را روی
  `false` تنظیم کنید.
- احراز هویت **Trusted-proxy** به‌صورت پیش‌فرض انتظار راه‌اندازی‌های proxy آگاه از هویت غیر loopback را دارد.
  reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
- کنترل مرورگر را مانند دسترسی اپراتور تلقی کنید: فقط tailnet + جفت‌سازی عمدی گره.

بررسی عمیق: [امنیت](/fa/gateway/security).

### macOS: تونل SSH پایدار از طریق LaunchAgent

برای کلاینت‌های macOS که به یک Gateway راه دور وصل می‌شوند، آسان‌ترین راه‌اندازی پایدار از یک ورودی config با `LocalForward` در SSH به‌همراه یک LaunchAgent استفاده می‌کند تا تونل را در طول rebootها و crashها زنده نگه دارد.

#### گام 1: افزودن config SSH

`~/.ssh/config` را ویرایش کنید:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` و `<REMOTE_USER>` را با مقادیر خودتان جایگزین کنید.

#### گام 2: کپی کردن کلید SSH (یک‌بار)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### گام 3: پیکربندی توکن Gateway

توکن را در config ذخیره کنید تا در restartها پایدار بماند:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### گام 4: ساخت LaunchAgent

این را با نام `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` ذخیره کنید:

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

#### گام 5: بارگذاری LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

تونل به‌صورت خودکار هنگام ورود شروع می‌شود، در صورت crash دوباره راه‌اندازی می‌شود و پورت forward‌شده را فعال نگه می‌دارد.

<Note>
اگر یک LaunchAgent باقی‌مانده `com.openclaw.ssh-tunnel` از راه‌اندازی قدیمی‌تر دارید، آن را unload و حذف کنید.
</Note>

#### عیب‌یابی

بررسی کنید آیا تونل در حال اجراست:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

راه‌اندازی دوباره تونل:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

توقف تونل:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| ورودی config                         | کاری که انجام می‌دهد                                      |
| ------------------------------------ | --------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | پورت محلی 18789 را به پورت راه دور 18789 forward می‌کند  |
| `ssh -N`                             | SSH بدون اجرای فرمان‌های راه دور (فقط port-forwarding)   |
| `KeepAlive`                          | اگر تونل crash کند، آن را به‌صورت خودکار restart می‌کند   |
| `RunAtLoad`                          | وقتی LaunchAgent هنگام ورود load می‌شود، تونل را شروع می‌کند |

## مرتبط

- [Tailscale](/fa/gateway/tailscale)
- [احراز هویت](/fa/gateway/authentication)
- [راه‌اندازی Gateway راه دور](/fa/gateway/remote-gateway-readme)
