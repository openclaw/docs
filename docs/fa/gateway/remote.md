---
read_when:
    - اجرای راه‌اندازی‌های Gateway راه‌دور یا عیب‌یابی آن‌ها
summary: دسترسی از راه دور با استفاده از Gateway WS، تونل‌های SSH و شبکه‌های tailnet
title: دسترسی از راه دور
x-i18n:
    generated_at: "2026-07-03T23:38:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

این مخزن با اجرای یک Gateway واحد (اصلی) روی یک میزبان اختصاصی (دسکتاپ/سرور) و اتصال کلاینت‌ها به آن، از دسترسی راه دور به gateway پشتیبانی می‌کند.

- برای **اپراتورها (شما / برنامه macOS)**: وقتی gateway قابل دسترسی است، وب‌سوکت مستقیم LAN/Tailnet ساده‌ترین گزینه است؛ تونل SSH جایگزین عمومی است.
- برای **گره‌ها (iOS/Android و دستگاه‌های آینده)**: در صورت نیاز، از طریق LAN/tailnet یا تونل SSH به **وب‌سوکت** Gateway وصل شوید.

## ایده اصلی

- وب‌سوکت Gateway معمولا روی **لوپ‌بک** در پورت پیکربندی‌شده شما bind می‌شود (پیش‌فرض 18789 است).
- برای استفاده راه دور، آن را از طریق Tailscale Serve یا یک bind مورد اعتماد LAN/Tailnet در دسترس قرار دهید، یا پورت لوپ‌بک را از طریق SSH فوروارد کنید.

## تنظیمات رایج VPN و tailnet

**میزبان Gateway** را جایی در نظر بگیرید که agent در آن زندگی می‌کند. این میزبان مالک نشست‌ها، پروفایل‌های احراز هویت، کانال‌ها و state است. لپ‌تاپ، دسکتاپ و گره‌های شما به آن میزبان وصل می‌شوند.

### Gateway همیشه‌روشن در tailnet شما

Gateway را روی یک میزبان پایدار (VPS یا سرور خانگی) اجرا کنید و از طریق **Tailscale** یا SSH به آن دسترسی پیدا کنید.

- **بهترین تجربه کاربری:** `gateway.bind: "loopback"` را نگه دارید و برای رابط کاربری کنترل از **Tailscale Serve** استفاده کنید.
- **LAN/Tailnet مورد اعتماد:** gateway را به یک رابط خصوصی bind کنید و با `gateway.remote.transport: "direct"` مستقیما وصل شوید.
- **جایگزین:** لوپ‌بک را نگه دارید و از هر ماشینی که به دسترسی نیاز دارد، تونل SSH بسازید.
- **نمونه‌ها:** [exe.dev](/fa/install/exe-dev) (VM آسان) یا [Hetzner](/fa/install/hetzner) (VPS تولیدی).

وقتی لپ‌تاپ شما زیاد به خواب می‌رود اما می‌خواهید agent همیشه روشن باشد، ایده‌آل است.

### دسکتاپ خانگی Gateway را اجرا می‌کند

لپ‌تاپ **agent** را اجرا نمی‌کند. از راه دور وصل می‌شود:

- از حالت راه دور برنامه macOS استفاده کنید (Settings → General → OpenClaw runs).
- وقتی gateway روی LAN/Tailnet قابل دسترسی باشد، برنامه مستقیما وصل می‌شود؛ یا وقتی SSH را انتخاب کنید، یک تونل SSH باز و مدیریت می‌کند.

Runbook: [دسترسی راه دور macOS](/fa/platforms/mac/remote).

### لپ‌تاپ Gateway را اجرا می‌کند

Gateway را محلی نگه دارید اما آن را ایمن در دسترس قرار دهید:

- از ماشین‌های دیگر به لپ‌تاپ تونل SSH بزنید، یا
- رابط کاربری کنترل را با Tailscale Serve ارائه کنید و Gateway را فقط روی لوپ‌بک نگه دارید.

راهنماها: [Tailscale](/fa/gateway/tailscale) و [نمای کلی وب](/fa/web).

## جریان فرمان (چه چیزی کجا اجرا می‌شود)

یک سرویس gateway مالک state و کانال‌ها است. گره‌ها وسیله‌های جانبی هستند.

نمونه جریان (Telegram → گره):

- پیام Telegram به **Gateway** می‌رسد.
- Gateway **agent** را اجرا می‌کند و تصمیم می‌گیرد آیا یک ابزار گره را فراخوانی کند یا نه.
- Gateway از طریق وب‌سوکت Gateway با **گره** تماس می‌گیرد (`node.*` RPC).
- گره نتیجه را برمی‌گرداند؛ Gateway پاسخ را دوباره به Telegram ارسال می‌کند.

نکته‌ها:

- **گره‌ها سرویس gateway را اجرا نمی‌کنند.** مگر اینکه عمدا پروفایل‌های ایزوله اجرا کنید، روی هر میزبان فقط یک gateway باید اجرا شود (نگاه کنید به [چند Gateway](/fa/gateway/multiple-gateways)).
- «حالت گره» برنامه macOS فقط یک کلاینت گره روی وب‌سوکت Gateway است.

## تونل SSH (CLI + ابزارها)

یک تونل محلی به وب‌سوکت Gateway راه دور بسازید:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

وقتی تونل فعال است:

- `openclaw health` و `openclaw status --deep` اکنون از طریق `ws://127.0.0.1:18789` به gateway راه دور می‌رسند.
- `openclaw gateway status`، `openclaw gateway health`، `openclaw gateway probe` و `openclaw gateway call` هم می‌توانند در صورت نیاز با `--url` نشانی فورواردشده را هدف بگیرند.

<Note>
`18789` را با `gateway.port` پیکربندی‌شده خود (یا `--port` یا `OPENCLAW_GATEWAY_PORT`) جایگزین کنید.
</Note>

<Warning>
وقتی `--url` را پاس می‌دهید، CLI به اعتبارنامه‌های config یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحا وارد کنید. نبود اعتبارنامه صریح خطا است.
</Warning>

## پیش‌فرض‌های راه دور CLI

می‌توانید یک مقصد راه دور را پایدار کنید تا فرمان‌های CLI به‌طور پیش‌فرض از آن استفاده کنند:

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

وقتی gateway فقط روی لوپ‌بک است، URL را روی `ws://127.0.0.1:18789` نگه دارید و ابتدا تونل SSH را باز کنید.
در ترابری تونل SSH برنامه macOS، نام‌های میزبان gateway کشف‌شده باید در
`gateway.remote.sshTarget` قرار بگیرند؛ `gateway.remote.url` همان URL تونل محلی می‌ماند.
اگر این پورت‌ها متفاوت باشند، `gateway.remote.remotePort` را روی پورت gateway در
میزبان SSH تنظیم کنید.
راستی‌آزمایی host-key به‌طور پیش‌فرض سخت‌گیرانه است. نام‌های مستعار مدیریت‌شده می‌توانند صریحا از
سیاست اعتماد موثر OpenSSH خود با
`gateway.remote.sshHostKeyPolicy: "openssh"` استفاده کنند؛ پیش از فعال‌سازی، تنظیمات SSH کاربر و سیستم مطابق را بررسی کنید.

برای gateway که از قبل روی یک LAN یا Tailnet مورد اعتماد قابل دسترسی است، از حالت مستقیم استفاده کنید:

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

## اولویت اعتبارنامه

حل اعتبارنامه Gateway در مسیرهای call/probe/status و پایش تایید اجرای Discord از یک قرارداد مشترک پیروی می‌کند. میزبان گره از همان قرارداد پایه با یک استثنای حالت محلی استفاده می‌کند (عمدا `gateway.remote.*` را نادیده می‌گیرد):

- اعتبارنامه‌های صریح (`--token`، `--password` یا ابزار `gatewayToken`) همیشه در مسیرهای call که احراز هویت صریح می‌پذیرند برنده‌اند.
- ایمنی override کردن URL:
  - overrideهای URL در CLI (`--url`) هرگز اعتبارنامه‌های ضمنی config/env را دوباره استفاده نمی‌کنند.
  - overrideهای URL محیط (`OPENCLAW_GATEWAY_URL`) فقط می‌توانند از اعتبارنامه‌های محیط استفاده کنند (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- پیش‌فرض‌های حالت محلی:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback راه دور فقط وقتی اعمال می‌شود که ورودی توکن احراز هویت محلی تنظیم نشده باشد)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback راه دور فقط وقتی اعمال می‌شود که ورودی رمز عبور احراز هویت محلی تنظیم نشده باشد)
- پیش‌فرض‌های حالت راه دور:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثنای حالت محلی میزبان گره: `gateway.remote.token` / `gateway.remote.password` نادیده گرفته می‌شوند.
- بررسی‌های توکن probe/status راه دور به‌طور پیش‌فرض سخت‌گیرانه‌اند: وقتی حالت راه دور را هدف می‌گیرند، فقط از `gateway.remote.token` استفاده می‌کنند (بدون fallback به توکن محلی).
- overrideهای env برای Gateway فقط از `OPENCLAW_GATEWAY_*` استفاده می‌کنند.

## دسترسی راه دور رابط کاربری چت

WebChat دیگر از پورت HTTP جداگانه استفاده نمی‌کند. رابط کاربری چت SwiftUI مستقیما به وب‌سوکت Gateway وصل می‌شود.

- `18789` را از طریق SSH فوروارد کنید (بالا را ببینید)، سپس کلاینت‌ها را به `ws://127.0.0.1:18789` وصل کنید.
- برای حالت مستقیم LAN/Tailnet، کلاینت‌ها را به URL خصوصی `ws://` یا امن `wss://` پیکربندی‌شده وصل کنید.
- در macOS، حالت راه دور برنامه را ترجیح دهید؛ این حالت ترابری انتخاب‌شده را به‌طور خودکار مدیریت می‌کند.

## حالت راه دور برنامه macOS

برنامه نوار منوی macOS می‌تواند همین تنظیمات را از ابتدا تا انتها هدایت کند (بررسی‌های وضعیت راه دور، WebChat و فوروارد Voice Wake).

Runbook: [دسترسی راه دور macOS](/fa/platforms/mac/remote).

## قواعد امنیتی (راه دور/VPN)

نسخه کوتاه: مگر اینکه مطمئنید به bind نیاز دارید، **Gateway را فقط روی لوپ‌بک نگه دارید**.

- **لوپ‌بک + SSH/Tailscale Serve** امن‌ترین پیش‌فرض است (بدون در معرض‌گذاری عمومی).
- `ws://` متن ساده برای لوپ‌بک، LAN، link-local، `.local`، `.ts.net` و میزبان‌های Tailscale CGNAT پذیرفته می‌شود. میزبان‌های راه دور عمومی باید از `wss://` استفاده کنند.
- **bindهای غیرلوپ‌بک** (`lan`/`tailnet`/`custom`، یا `auto` وقتی لوپ‌بک در دسترس نیست) باید از احراز هویت gateway استفاده کنند: توکن، رمز عبور، یا reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` منابع اعتبارنامه کلاینت هستند. آن‌ها به‌تنهایی احراز هویت سرور را پیکربندی نمی‌کنند.
- مسیرهای call محلی فقط وقتی `gateway.auth.*` تنظیم نشده باشد، می‌توانند از `gateway.remote.*` به‌عنوان fallback استفاده کنند.
- اگر `gateway.auth.token` / `gateway.auth.password` به‌صورت صریح از طریق SecretRef پیکربندی شده و resolve نشده باشد، resolution به‌صورت fail-closed شکست می‌خورد (بدون masking با fallback راه دور).
- `gateway.remote.tlsFingerprint` هنگام استفاده از `wss://`، از جمله در حالت مستقیم macOS، گواهی TLS راه دور را pin می‌کند. بدون pin پیکربندی‌شده یا ذخیره‌شده قبلی، macOS فقط پس از گذر اعتماد عادی سیستم، گواهی نخستین استفاده را pin می‌کند؛ gatewayهای self-signed یا private-CA که macOS از قبل به آن‌ها اعتماد ندارد، به fingerprint صریح یا Remote over SSH نیاز دارند.
- **Tailscale Serve** می‌تواند ترافیک رابط کاربری کنترل/وب‌سوکت را از طریق headerهای هویت احراز هویت کند
  وقتی `gateway.auth.allowTailscale: true` باشد؛ endpointهای HTTP API از آن احراز هویت header مربوط به Tailscale استفاده نمی‌کنند و در عوض از حالت احراز هویت HTTP عادی gateway پیروی می‌کنند. این جریان بدون توکن فرض می‌کند میزبان gateway مورد اعتماد است. اگر احراز هویت shared-secret را در همه‌جا می‌خواهید، آن را روی
  `false` تنظیم کنید.
- احراز هویت **trusted-proxy** به‌طور پیش‌فرض انتظار تنظیمات reverse proxy آگاه از هویت غیرلوپ‌بک را دارد.
  reverse proxyهای لوپ‌بک روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
- کنترل مرورگر را مثل دسترسی اپراتور در نظر بگیرید: فقط tailnet + pair کردن عمدی گره.

بررسی عمیق: [امنیت](/fa/gateway/security).

### macOS: تونل SSH پایدار از طریق LaunchAgent

برای کلاینت‌های macOS که به یک gateway راه دور وصل می‌شوند، آسان‌ترین تنظیم پایدار از یک ورودی config به نام SSH `LocalForward` به‌همراه یک LaunchAgent استفاده می‌کند تا تونل را در راه‌اندازی‌های دوباره و crashها زنده نگه دارد.

#### گام 1: افزودن config SSH

`~/.ssh/config` را ویرایش کنید:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` و `<REMOTE_USER>` را با مقادیر خود جایگزین کنید.

#### گام 2: کپی کردن کلید SSH (یک‌بار)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### گام 3: پیکربندی توکن gateway

توکن را در config ذخیره کنید تا در restartها باقی بماند:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### گام 4: ایجاد LaunchAgent

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

تونل هنگام ورود به سیستم به‌طور خودکار شروع می‌شود، پس از crash دوباره راه‌اندازی می‌شود و پورت فورواردشده را فعال نگه می‌دارد.

<Note>
اگر از یک تنظیم قدیمی، LaunchAgent باقی‌مانده `com.openclaw.ssh-tunnel` دارید، آن را unload و حذف کنید.
</Note>

#### عیب‌یابی

بررسی کنید تونل در حال اجراست یا نه:

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

| ورودی config                         | کاری که انجام می‌دهد                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | پورت محلی 18789 را به پورت راه دور 18789 فوروارد می‌کند               |
| `ssh -N`                             | SSH بدون اجرای فرمان‌های راه دور (فقط فوروارد پورت) |
| `KeepAlive`                          | اگر تونل crash کند، آن را به‌طور خودکار دوباره راه‌اندازی می‌کند              |
| `RunAtLoad`                          | هنگام بارگذاری LaunchAgent در ورود به سیستم، تونل را شروع می‌کند        |

## مرتبط

- [Tailscale](/fa/gateway/tailscale)
- [احراز هویت](/fa/gateway/authentication)
- [تنظیم gateway راه دور](/fa/gateway/remote-gateway-readme)
