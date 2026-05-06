---
read_when:
    - اجرای راه‌اندازی‌های Gateway راه دور یا عیب‌یابی آن‌ها
summary: دسترسی از راه دور با استفاده از تونل‌های SSH (Gateway WS) و شبکه‌های تیل‌نت
title: دسترسی از راه دور
x-i18n:
    generated_at: "2026-05-06T09:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

این مخزن از «راه دور از طریق SSH» با اجرای یک Gateway واحد (اصلی) روی یک میزبان اختصاصی (رایانه رومیزی/سرور) و اتصال کلاینت‌ها به آن پشتیبانی می‌کند.

- برای **اپراتورها (شما / برنامه macOS)**: تونل‌زنی SSH راهکار جایگزین همگانی است.
- برای **Nodeها (iOS/Android و دستگاه‌های آینده)**: به **WebSocket** متعلق به Gateway وصل شوید (LAN/tailnet یا تونل SSH در صورت نیاز).

## ایده اصلی

- WebSocket متعلق به Gateway روی پورت پیکربندی‌شده شما (به‌طور پیش‌فرض 18789) به **loopback** متصل می‌شود.
- برای استفاده راه دور، آن پورت loopback را از طریق SSH فوروارد می‌کنید (یا از یک tailnet/VPN استفاده می‌کنید و کمتر تونل می‌زنید).

## راه‌اندازی‌های رایج VPN و tailnet

**میزبان Gateway** را جایی در نظر بگیرید که agent در آن زندگی می‌کند. این میزبان مالک نشست‌ها، پروفایل‌های احراز هویت، کانال‌ها و وضعیت است. لپ‌تاپ، رایانه رومیزی و Nodeهای شما به آن میزبان وصل می‌شوند.

### Gateway همیشه‌روشن در tailnet شما

Gateway را روی یک میزبان پایدار (VPS یا سرور خانگی) اجرا کنید و از طریق **Tailscale** یا SSH به آن دسترسی بگیرید.

- **بهترین تجربه کاربری:** `gateway.bind: "loopback"` را نگه دارید و برای Control UI از **Tailscale Serve** استفاده کنید.
- **راهکار جایگزین:** loopback را همراه با تونل SSH از هر دستگاهی که به دسترسی نیاز دارد نگه دارید.
- **مثال‌ها:** [exe.dev](/fa/install/exe-dev) (VM آسان) یا [Hetzner](/fa/install/hetzner) (VPS تولیدی).

مناسب زمانی است که لپ‌تاپ شما اغلب به خواب می‌رود اما می‌خواهید agent همیشه روشن باشد.

### رایانه رومیزی خانگی Gateway را اجرا می‌کند

لپ‌تاپ **agent** را اجرا نمی‌کند. به‌صورت راه دور وصل می‌شود:

- از حالت **Remote over SSH** در برنامه macOS استفاده کنید (Settings → General → OpenClaw runs).
- برنامه تونل را باز و مدیریت می‌کند، بنابراین WebChat و بررسی‌های سلامت بدون کار اضافه انجام می‌شوند.

رهنمود عملیاتی: [دسترسی راه دور macOS](/fa/platforms/mac/remote).

### لپ‌تاپ Gateway را اجرا می‌کند

Gateway را محلی نگه دارید اما آن را ایمن در دسترس قرار دهید:

- از دستگاه‌های دیگر به لپ‌تاپ تونل SSH بزنید، یا
- Control UI را با Tailscale Serve ارائه کنید و Gateway را فقط loopback نگه دارید.

راهنماها: [Tailscale](/fa/gateway/tailscale) و [نمای کلی وب](/fa/web).

## جریان فرمان (چه چیزی کجا اجرا می‌شود)

یک سرویس Gateway مالک وضعیت + کانال‌ها است. Nodeها تجهیزات جانبی هستند.

نمونه جریان (Telegram → node):

- پیام Telegram به **Gateway** می‌رسد.
- Gateway، **agent** را اجرا می‌کند و تصمیم می‌گیرد آیا ابزار node را فراخوانی کند یا نه.
- Gateway از طریق WebSocket متعلق به Gateway، **node** را فراخوانی می‌کند (`node.*` RPC).
- Node نتیجه را برمی‌گرداند؛ Gateway پاسخ را دوباره به Telegram ارسال می‌کند.

نکات:

- **Nodeها سرویس gateway را اجرا نمی‌کنند.** در هر میزبان فقط یک gateway باید اجرا شود، مگر اینکه عمدا پروفایل‌های ایزوله اجرا کنید (نگاه کنید به [چند Gateway](/fa/gateway/multiple-gateways)).
- «حالت node» برنامه macOS فقط یک کلاینت node روی WebSocket متعلق به Gateway است.

## تونل SSH (CLI + ابزارها)

یک تونل محلی به Gateway WS راه دور بسازید:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

وقتی تونل برقرار است:

- `openclaw health` و `openclaw status --deep` اکنون از طریق `ws://127.0.0.1:18789` به gateway راه دور می‌رسند.
- `openclaw gateway status`، `openclaw gateway health`، `openclaw gateway probe` و `openclaw gateway call` نیز در صورت نیاز می‌توانند URL فورواردشده را از طریق `--url` هدف بگیرند.

<Note>
`18789` را با `gateway.port` پیکربندی‌شده خود (یا `--port` یا `OPENCLAW_GATEWAY_PORT`) جایگزین کنید.
</Note>

<Warning>
وقتی `--url` را پاس می‌دهید، CLI به پیکربندی یا اعتبارنامه‌های محیط برنمی‌گردد. `--token` یا `--password` را صریح وارد کنید. نبود اعتبارنامه‌های صریح خطا است.
</Warning>

## پیش‌فرض‌های راه دور CLI

می‌توانید یک هدف راه دور را پایدار کنید تا فرمان‌های CLI به‌طور پیش‌فرض از آن استفاده کنند:

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

وقتی gateway فقط loopback است، URL را روی `ws://127.0.0.1:18789` نگه دارید و ابتدا تونل SSH را باز کنید.
در ترابری تونل SSH برنامه macOS، نام‌های میزبان gateway کشف‌شده باید در
`gateway.remote.sshTarget` قرار بگیرند؛ `gateway.remote.url` همان URL تونل محلی باقی می‌ماند.

## تقدم اعتبارنامه‌ها

حل اعتبارنامه Gateway در مسیرهای call/probe/status و پایش تایید اجرای Discord از یک قرارداد مشترک پیروی می‌کند. Node-host از همان قرارداد پایه با یک استثنای local-mode استفاده می‌کند (عمدا `gateway.remote.*` را نادیده می‌گیرد):

- اعتبارنامه‌های صریح (`--token`، `--password` یا ابزار `gatewayToken`) همیشه در مسیرهای call که احراز هویت صریح را می‌پذیرند برنده هستند.
- ایمنی بازنویسی URL:
  - بازنویسی‌های URL در CLI (`--url`) هرگز از اعتبارنامه‌های ضمنی پیکربندی/محیط دوباره استفاده نمی‌کنند.
  - بازنویسی‌های URL محیط (`OPENCLAW_GATEWAY_URL`) فقط می‌توانند از اعتبارنامه‌های محیط استفاده کنند (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- پیش‌فرض‌های حالت محلی:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (بازگشت راه دور فقط وقتی ورودی توکن احراز هویت محلی تنظیم نشده باشد اعمال می‌شود)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (بازگشت راه دور فقط وقتی ورودی گذرواژه احراز هویت محلی تنظیم نشده باشد اعمال می‌شود)
- پیش‌فرض‌های حالت راه دور:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثنای local-mode برای Node-host: `gateway.remote.token` / `gateway.remote.password` نادیده گرفته می‌شوند.
- بررسی‌های توکن probe/status راه دور به‌طور پیش‌فرض سخت‌گیرانه هستند: هنگام هدف‌گیری حالت راه دور فقط از `gateway.remote.token` استفاده می‌کنند (بدون بازگشت به توکن محلی).
- بازنویسی‌های محیط Gateway فقط از `OPENCLAW_GATEWAY_*` استفاده می‌کنند.

## Chat UI از طریق SSH

WebChat دیگر از پورت HTTP جداگانه استفاده نمی‌کند. UI چت SwiftUI مستقیما به WebSocket متعلق به Gateway وصل می‌شود.

- `18789` را از طریق SSH فوروارد کنید (بالا را ببینید)، سپس کلاینت‌ها را به `ws://127.0.0.1:18789` وصل کنید.
- در macOS، حالت "Remote over SSH" برنامه را ترجیح دهید که تونل را خودکار مدیریت می‌کند.

## Remote over SSH در برنامه macOS

برنامه نوار منوی macOS می‌تواند همین راه‌اندازی را از ابتدا تا انتها هدایت کند (بررسی‌های وضعیت راه دور، WebChat و فوروارد کردن Voice Wake).

رهنمود عملیاتی: [دسترسی راه دور macOS](/fa/platforms/mac/remote).

## قوانین امنیتی (راه دور/VPN)

نسخه کوتاه: **Gateway را فقط loopback نگه دارید** مگر اینکه مطمئن باشید به bind نیاز دارید.

- **Loopback + SSH/Tailscale Serve** امن‌ترین پیش‌فرض است (بدون در معرض عموم قرار گرفتن).
- متن ساده `ws://` به‌طور پیش‌فرض فقط loopback است. برای شبکه‌های خصوصی مورد اعتماد،
  روی فرایند کلاینت `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را به‌عنوان
  راهکار اضطراری تنظیم کنید. معادل `openclaw.json` وجود ندارد؛ این باید محیط
  فرایند برای کلاینتی باشد که اتصال WebSocket را برقرار می‌کند.
- **Bindهای غیر loopback** (`lan`/`tailnet`/`custom`، یا `auto` وقتی loopback در دسترس نیست) باید از احراز هویت gateway استفاده کنند: توکن، گذرواژه، یا reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` منابع اعتبارنامه کلاینت هستند. آن‌ها به‌تنهایی احراز هویت سرور را پیکربندی نمی‌کنند.
- مسیرهای call محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` صریحا از طریق SecretRef پیکربندی شده و حل‌نشده باشد، حل اعتبارنامه بسته شکست می‌خورد (بدون پوشاندن با fallback راه دور).
- `gateway.remote.tlsFingerprint` هنگام استفاده از `wss://` گواهی TLS راه دور را pin می‌کند.
- **Tailscale Serve** می‌تواند ترافیک Control UI/WebSocket را از طریق headerهای هویت احراز هویت کند
  وقتی `gateway.auth.allowTailscale: true` باشد؛ endpointهای HTTP API از آن
  احراز هویت header مربوط به Tailscale استفاده نمی‌کنند و در عوض از حالت احراز هویت
  HTTP معمول gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان gateway مورد اعتماد است. اگر می‌خواهید
  همه‌جا احراز هویت shared-secret داشته باشید، آن را روی
  `false` تنظیم کنید.
- احراز هویت **Trusted-proxy** به‌طور پیش‌فرض انتظار راه‌اندازی‌های proxy آگاه از هویت غیر loopback را دارد.
  reverse proxyهای loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
- کنترل مرورگر را مانند دسترسی اپراتور در نظر بگیرید: فقط tailnet + جفت‌سازی عمدی node.

بررسی عمیق: [امنیت](/fa/gateway/security).

### macOS: تونل SSH پایدار از طریق LaunchAgent

برای کلاینت‌های macOS که به gateway راه دور وصل می‌شوند، آسان‌ترین راه‌اندازی پایدار از یک ورودی پیکربندی SSH `LocalForward` به‌همراه LaunchAgent استفاده می‌کند تا تونل در برابر راه‌اندازی دوباره و crash زنده بماند.

#### گام 1: افزودن پیکربندی SSH

`~/.ssh/config` را ویرایش کنید:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` و `<REMOTE_USER>` را با مقادیر خود جایگزین کنید.

#### گام 2: کپی کلید SSH (یک‌بار)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### گام 3: پیکربندی توکن gateway

توکن را در پیکربندی ذخیره کنید تا پس از راه‌اندازی‌های دوباره پایدار بماند:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### گام 4: ایجاد LaunchAgent

این را به‌عنوان `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` ذخیره کنید:

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

تونل هنگام ورود به سیستم به‌طور خودکار شروع می‌شود، پس از crash دوباره راه‌اندازی می‌شود و پورت فورواردشده را زنده نگه می‌دارد.

<Note>
اگر یک LaunchAgent باقی‌مانده `com.openclaw.ssh-tunnel` از یک راه‌اندازی قدیمی‌تر دارید، آن را unload و حذف کنید.
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

| ورودی پیکربندی                       | کارکرد                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | پورت محلی 18789 را به پورت راه دور 18789 فوروارد می‌کند    |
| `ssh -N`                             | SSH بدون اجرای فرمان‌های راه دور (فقط port-forwarding)      |
| `KeepAlive`                          | اگر تونل crash کند، آن را به‌طور خودکار دوباره راه‌اندازی می‌کند |
| `RunAtLoad`                          | وقتی LaunchAgent هنگام ورود بارگذاری می‌شود، تونل را شروع می‌کند |

## مرتبط

- [Tailscale](/fa/gateway/tailscale)
- [احراز هویت](/fa/gateway/authentication)
- [راه‌اندازی gateway راه دور](/fa/gateway/remote-gateway-readme)
