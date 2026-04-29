---
read_when:
    - اجرای راه‌اندازی‌های Gateway از راه دور یا عیب‌یابی آن‌ها
summary: دسترسی از راه دور با استفاده از تونل‌های SSH (Gateway WS) و tailnetها
title: دسترسی از راه دور
x-i18n:
    generated_at: "2026-04-29T22:55:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

این مخزن از «راه‌دور از طریق SSH» پشتیبانی می‌کند؛ به این صورت که یک Gateway واحد (اصلی) روی یک میزبان اختصاصی (دسکتاپ/سرور) در حال اجرا نگه داشته می‌شود و کلاینت‌ها به آن وصل می‌شوند.

- برای **اپراتورها (شما / برنامه macOS)**: تونل‌زنی SSH راهکار جایگزین همگانی است.
- برای **گره‌ها (iOS/Android و دستگاه‌های آینده)**: به **WebSocket** مربوط به Gateway وصل شوید (LAN/tailnet یا تونل SSH در صورت نیاز).

## ایده اصلی

- WebSocket مربوط به Gateway روی **لوپ‌بک** در پورت پیکربندی‌شده شما bind می‌شود (پیش‌فرض 18789 است).
- برای استفاده راه‌دور، آن پورت لوپ‌بک را از طریق SSH فوروارد می‌کنید (یا از tailnet/VPN استفاده می‌کنید و کمتر تونل می‌زنید).

## راه‌اندازی‌های رایج VPN و tailnet

**میزبان Gateway** را جایی در نظر بگیرید که agent در آن زندگی می‌کند. این میزبان مالک نشست‌ها، پروفایل‌های احراز هویت، کانال‌ها و وضعیت است. لپ‌تاپ، دسکتاپ و گره‌های شما به آن میزبان وصل می‌شوند.

### Gateway همیشه‌روشن در tailnet شما

Gateway را روی یک میزبان پایدار (VPS یا سرور خانگی) اجرا کنید و از طریق **Tailscale** یا SSH به آن دسترسی داشته باشید.

- **بهترین تجربه کاربری:** `gateway.bind: "loopback"` را نگه دارید و برای Control UI از **Tailscale Serve** استفاده کنید.
- **راهکار جایگزین:** لوپ‌بک را نگه دارید و از هر ماشینی که نیاز به دسترسی دارد، تونل SSH برقرار کنید.
- **نمونه‌ها:** [exe.dev](/fa/install/exe-dev) (VM آسان) یا [Hetzner](/fa/install/hetzner) (VPS تولیدی).

مناسب زمانی است که لپ‌تاپ شما زیاد به خواب می‌رود، اما می‌خواهید agent همیشه روشن باشد.

### دسکتاپ خانگی Gateway را اجرا می‌کند

لپ‌تاپ **agent** را اجرا نمی‌کند. به‌صورت راه‌دور وصل می‌شود:

- از حالت **Remote over SSH** برنامه macOS استفاده کنید (Settings → General → OpenClaw runs).
- برنامه تونل را باز و مدیریت می‌کند، بنابراین WebChat و بررسی‌های سلامت بدون دردسر کار می‌کنند.

راهنما: [دسترسی راه‌دور macOS](/fa/platforms/mac/remote).

### لپ‌تاپ Gateway را اجرا می‌کند

Gateway را محلی نگه دارید اما آن را به‌شکل امن در دسترس قرار دهید:

- از ماشین‌های دیگر به لپ‌تاپ تونل SSH بزنید، یا
- Control UI را با Tailscale Serve ارائه کنید و Gateway را فقط روی لوپ‌بک نگه دارید.

راهنماها: [Tailscale](/fa/gateway/tailscale) و [نمای کلی وب](/fa/web).

## جریان دستورها (چه چیزی کجا اجرا می‌شود)

یک سرویس Gateway مالک وضعیت + کانال‌ها است. گره‌ها پیرامونی هستند.

نمونه جریان (Telegram → گره):

- پیام Telegram به **Gateway** می‌رسد.
- Gateway، **agent** را اجرا می‌کند و تصمیم می‌گیرد آیا باید ابزار یک گره را صدا بزند یا نه.
- Gateway از طریق WebSocket مربوط به Gateway، **گره** را صدا می‌زند (`node.*` RPC).
- گره نتیجه را برمی‌گرداند؛ Gateway پاسخ را دوباره به Telegram ارسال می‌کند.

نکته‌ها:

- **گره‌ها سرویس Gateway را اجرا نمی‌کنند.** مگر اینکه عمداً پروفایل‌های ایزوله اجرا کنید، روی هر میزبان فقط باید یک Gateway اجرا شود (ببینید [چند Gateway](/fa/gateway/multiple-gateways)).
- «حالت گره» برنامه macOS فقط یک کلاینت گره روی WebSocket مربوط به Gateway است.

## تونل SSH ‏(CLI + ابزارها)

یک تونل محلی به WS مربوط به Gateway راه‌دور بسازید:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

وقتی تونل برقرار است:

- `openclaw health` و `openclaw status --deep` اکنون از طریق `ws://127.0.0.1:18789` به Gateway راه‌دور می‌رسند.
- `openclaw gateway status`، `openclaw gateway health`، `openclaw gateway probe` و `openclaw gateway call` نیز در صورت نیاز می‌توانند با `--url` نشانی فورواردشده را هدف بگیرند.

<Note>
`18789` را با `gateway.port` پیکربندی‌شده خود (یا `--port` یا `OPENCLAW_GATEWAY_PORT`) جایگزین کنید.
</Note>

<Warning>
وقتی `--url` را پاس می‌دهید، CLI به پیکربندی یا اعتبارنامه‌های محیطی fallback نمی‌کند. `--token` یا `--password` را صریحاً وارد کنید. نبود اعتبارنامه‌های صریح خطا است.
</Warning>

## پیش‌فرض‌های راه‌دور CLI

می‌توانید یک مقصد راه‌دور را پایدار کنید تا دستورهای CLI به‌صورت پیش‌فرض از آن استفاده کنند:

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

وقتی Gateway فقط روی لوپ‌بک است، URL را روی `ws://127.0.0.1:18789` نگه دارید و ابتدا تونل SSH را باز کنید.
در انتقال تونل SSH برنامه macOS، نام میزبان‌های کشف‌شده Gateway باید در
`gateway.remote.sshTarget` قرار بگیرند؛ `gateway.remote.url` همان URL تونل محلی باقی می‌ماند.

## تقدم اعتبارنامه‌ها

حل اعتبارنامه Gateway در مسیرهای call/probe/status و پایش تأیید اجرای Discord از یک قرارداد مشترک پیروی می‌کند. Node-host از همان قرارداد پایه با یک استثنای حالت محلی استفاده می‌کند (عمداً `gateway.remote.*` را نادیده می‌گیرد):

- اعتبارنامه‌های صریح (`--token`، `--password` یا ابزار `gatewayToken`) همیشه در مسیرهای call که احراز هویت صریح را می‌پذیرند اولویت دارند.
- ایمنی override کردن URL:
  - overrideهای URL در CLI (`--url`) هرگز اعتبارنامه‌های ضمنی config/env را دوباره استفاده نمی‌کنند.
  - overrideهای URL از env (`OPENCLAW_GATEWAY_URL`) فقط می‌توانند از اعتبارنامه‌های env استفاده کنند (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- پیش‌فرض‌های حالت محلی:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback راه‌دور فقط وقتی اعمال می‌شود که ورودی توکن احراز هویت محلی تنظیم نشده باشد)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback راه‌دور فقط وقتی اعمال می‌شود که ورودی گذرواژه احراز هویت محلی تنظیم نشده باشد)
- پیش‌فرض‌های حالت راه‌دور:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثنای حالت محلی Node-host: `gateway.remote.token` / `gateway.remote.password` نادیده گرفته می‌شوند.
- بررسی‌های token در probe/status راه‌دور به‌صورت پیش‌فرض سخت‌گیرانه هستند: هنگام هدف‌گیری حالت راه‌دور فقط از `gateway.remote.token` استفاده می‌کنند (بدون fallback به توکن محلی).
- overrideهای env مربوط به Gateway فقط از `OPENCLAW_GATEWAY_*` استفاده می‌کنند.

## Chat UI از طریق SSH

WebChat دیگر از پورت HTTP جداگانه استفاده نمی‌کند. رابط چت SwiftUI مستقیماً به WebSocket مربوط به Gateway وصل می‌شود.

- `18789` را از طریق SSH فوروارد کنید (بالا را ببینید)، سپس کلاینت‌ها را به `ws://127.0.0.1:18789` وصل کنید.
- در macOS، حالت “Remote over SSH” برنامه را ترجیح دهید؛ این حالت تونل را خودکار مدیریت می‌کند.

## Remote over SSH در برنامه macOS

برنامه نوار منوی macOS می‌تواند همین راه‌اندازی را از ابتدا تا انتها پیش ببرد (بررسی‌های وضعیت راه‌دور، WebChat و فوروارد کردن Voice Wake).

راهنما: [دسترسی راه‌دور macOS](/fa/platforms/mac/remote).

## قواعد امنیتی (راه‌دور/VPN)

نسخه کوتاه: **Gateway را فقط روی لوپ‌بک نگه دارید** مگر اینکه مطمئن باشید به bind نیاز دارید.

- **Loopback + SSH/Tailscale Serve** امن‌ترین پیش‌فرض است (بدون در معرض عموم قرار گرفتن).
- متن ساده `ws://` به‌صورت پیش‌فرض فقط برای لوپ‌بک است. برای شبکه‌های خصوصی قابل اعتماد،
  روی فرایند کلاینت `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را به‌عنوان
  راهکار اضطراری تنظیم کنید. معادلی در `openclaw.json` وجود ندارد؛ این باید environment
  فرایند کلاینتی باشد که اتصال WebSocket را برقرار می‌کند.
- **bindهای غیر لوپ‌بک** (`lan`/`tailnet`/`custom`، یا `auto` وقتی لوپ‌بک در دسترس نیست) باید از احراز هویت Gateway استفاده کنند: token، password یا reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` منابع اعتبارنامه کلاینت هستند. آن‌ها به‌تنهایی احراز هویت سرور را پیکربندی نمی‌کنند.
- مسیرهای call محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` صریحاً از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution بسته و ایمن شکست می‌خورد (بدون پوشاندن با fallback راه‌دور).
- `gateway.remote.tlsFingerprint` هنگام استفاده از `wss://` گواهی TLS راه‌دور را pin می‌کند.
- **Tailscale Serve** می‌تواند ترافیک Control UI/WebSocket را از طریق headerهای هویت
  احراز هویت کند، وقتی `gateway.auth.allowTailscale: true` باشد؛ endpointهای HTTP API از
  آن احراز هویت header مربوط به Tailscale استفاده نمی‌کنند و در عوض از حالت احراز هویت HTTP
  عادی Gateway پیروی می‌کنند. این جریان بدون token فرض می‌کند میزبان Gateway قابل اعتماد است. اگر
  احراز هویت shared-secret را همه‌جا می‌خواهید، آن را روی
  `false` بگذارید.
- احراز هویت **Trusted-proxy** به‌صورت پیش‌فرض انتظار راه‌اندازی‌های proxy آگاه از هویت و غیر لوپ‌بک را دارد.
  reverse proxyهای لوپ‌بک روی همان میزبان نیازمند `gateway.auth.trustedProxy.allowLoopback = true` صریح هستند.
- کنترل مرورگر را مانند دسترسی اپراتور در نظر بگیرید: فقط tailnet + جفت‌سازی عمدی گره.

بررسی عمیق: [امنیت](/fa/gateway/security).

### macOS: تونل SSH پایدار از طریق LaunchAgent

برای کلاینت‌های macOS که به یک Gateway راه‌دور وصل می‌شوند، آسان‌ترین راه‌اندازی پایدار از یک ورودی پیکربندی SSH `LocalForward` به‌همراه یک LaunchAgent استفاده می‌کند تا تونل در طول rebootها و crashها زنده بماند.

#### مرحله 1: افزودن پیکربندی SSH

`~/.ssh/config` را ویرایش کنید:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` و `<REMOTE_USER>` را با مقادیر خود جایگزین کنید.

#### مرحله 2: کپی کردن کلید SSH (یک‌بار)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### مرحله 3: پیکربندی token مربوط به Gateway

token را در پیکربندی ذخیره کنید تا در restartها پایدار بماند:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### مرحله 4: ساخت LaunchAgent

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

#### مرحله 5: بارگذاری LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

تونل هنگام ورود به سیستم به‌صورت خودکار شروع می‌شود، پس از crash دوباره راه‌اندازی می‌شود و پورت فورواردشده را زنده نگه می‌دارد.

<Note>
اگر یک LaunchAgent باقی‌مانده `com.openclaw.ssh-tunnel` از راه‌اندازی قدیمی‌تر دارید، آن را unload و حذف کنید.
</Note>

#### عیب‌یابی

بررسی کنید تونل در حال اجرا است یا نه:

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

| ورودی پیکربندی                       | کاری که انجام می‌دهد                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | پورت محلی 18789 را به پورت راه‌دور 18789 فوروارد می‌کند |
| `ssh -N`                             | SSH بدون اجرای دستورهای راه‌دور (فقط port-forwarding) |
| `KeepAlive`                          | اگر تونل crash کند، آن را به‌صورت خودکار دوباره راه‌اندازی می‌کند |
| `RunAtLoad`                          | هنگام بارگذاری LaunchAgent در زمان ورود به سیستم، تونل را شروع می‌کند |

## مرتبط

- [Tailscale](/fa/gateway/tailscale)
- [احراز هویت](/fa/gateway/authentication)
- [راه‌اندازی Gateway راه‌دور](/fa/gateway/remote-gateway-readme)
