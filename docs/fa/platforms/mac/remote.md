---
read_when:
    - راه‌اندازی یا اشکال‌زدایی کنترل از راه دور مک
summary: جریان برنامه macOS برای کنترل یک Gateway راه‌دور OpenClaw
title: کنترل از راه دور
x-i18n:
    generated_at: "2026-06-28T00:13:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

این جریان به برنامه macOS امکان می‌دهد به‌عنوان یک کنترل از راه دور کامل برای OpenClaw gateway که روی میزبان دیگری (دسکتاپ/سرور) اجرا می‌شود عمل کند. برنامه می‌تواند مستقیماً به URLهای مورداعتماد Gateway در LAN/Tailnet وصل شود یا زمانی که Gateway راه‌دور فقط loopback است، یک تونل SSH را مدیریت کند. بررسی‌های سلامت، ارسال Voice Wake، و Web Chat از همان پیکربندی راه‌دور در _Settings → General_ استفاده می‌کنند.

## حالت‌ها

- **محلی (این Mac)**: همه‌چیز روی لپ‌تاپ اجرا می‌شود. SSH در کار نیست.
- **راه‌دور از طریق SSH (پیش‌فرض)**: فرمان‌های OpenClaw روی میزبان راه‌دور اجرا می‌شوند. برنامه Mac با `-o BatchMode` به‌همراه هویت/کلید انتخابی شما و یک port-forward محلی، اتصال SSH باز می‌کند.
- **راه‌دور مستقیم (ws/wss)**: بدون تونل SSH. برنامه Mac مستقیماً به URL Gateway وصل می‌شود (برای مثال، از طریق LAN، Tailscale، Tailscale Serve، یا یک reverse proxy عمومی HTTPS).

## انتقال‌های راه‌دور

حالت راه‌دور از دو انتقال پشتیبانی می‌کند:

- **تونل SSH** (پیش‌فرض): از `ssh -N -L ...` برای forward کردن پورت Gateway به localhost استفاده می‌کند. Gateway آدرس IP Node را `127.0.0.1` می‌بیند، چون تونل loopback است.
- **مستقیم (ws/wss)**: مستقیماً به URL Gateway وصل می‌شود. Gateway آدرس IP واقعی کلاینت را می‌بیند.

در حالت تونل SSH، نام‌های میزبان LAN/tailnet کشف‌شده به‌صورت
`gateway.remote.sshTarget` ذخیره می‌شوند. برنامه `gateway.remote.url` را روی endpoint
تونل محلی نگه می‌دارد، برای مثال `ws://127.0.0.1:18789`، تا CLI، Web Chat، و
سرویس محلی میزبان Node همگی از همان انتقال امن loopback استفاده کنند.
وقتی discovery هم IPهای خام Tailnet و هم نام‌های میزبان پایدار را برمی‌گرداند، برنامه
نام‌های Tailscale MagicDNS یا LAN را ترجیح می‌دهد تا اتصال‌های راه‌دور در برابر تغییر
آدرس‌ها پایدارتر بمانند.
اگر پورت تونل محلی با پورت Gateway راه‌دور متفاوت است،
`gateway.remote.remotePort` را روی پورت میزبان راه‌دور تنظیم کنید.

اتوماسیون مرورگر در حالت راه‌دور در مالکیت میزبان Node مربوط به CLI است، نه Node
برنامه بومی macOS. برنامه در صورت امکان سرویس میزبان Node نصب‌شده را راه‌اندازی می‌کند؛
اگر از آن Mac به کنترل مرورگر نیاز دارید، آن را با
`openclaw node install ...` و `openclaw node start` نصب/راه‌اندازی کنید (یا
`openclaw node run ...` را در foreground اجرا کنید)، سپس آن Node دارای قابلیت مرورگر را هدف بگیرید.

## پیش‌نیازها روی میزبان راه‌دور

1. Node + pnpm را نصب کنید و OpenClaw CLI را بسازید/نصب کنید (`pnpm install && pnpm build && pnpm link --global`).
2. مطمئن شوید `openclaw` برای shellهای غیرتعاملی روی PATH قرار دارد (در صورت نیاز به `/usr/local/bin` یا `/opt/homebrew/bin` symlink کنید).
3. فقط برای انتقال SSH: SSH را با احراز هویت کلیدی باز کنید. برای دسترسی پایدار خارج از LAN، IPهای **Tailscale** را توصیه می‌کنیم.

## راه‌اندازی برنامه macOS

برای پیکربندی اولیه برنامه بدون جریان خوشامدگویی:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

برای Gateway که از قبل روی یک LAN یا Tailnet مورداعتماد در دسترس است، SSH را کاملاً رد کنید:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

این کار پیکربندی راه‌دور را می‌نویسد، onboarding را کامل‌شده علامت می‌زند، و به برنامه اجازه می‌دهد
هنگام شروع، مالک انتقال انتخاب‌شده باشد.

1. _Settings → General_ را باز کنید.
2. زیر **OpenClaw runs**، **Remote** را انتخاب کنید و تنظیم کنید:
   - **Transport**: **SSH tunnel** یا **Direct (ws/wss)**.
   - **SSH target**: `user@host` (اختیاری `:port`).
     - اگر Gateway روی همان LAN است و Bonjour را advertise می‌کند، آن را از فهرست کشف‌شده انتخاب کنید تا این فیلد خودکار پر شود.
   - **Gateway URL** (فقط Direct): `wss://gateway.example.ts.net` (یا `ws://...` برای محلی/LAN).
   - **Identity file** (پیشرفته): مسیر کلید شما.
   - **Project root** (پیشرفته): مسیر checkout راه‌دور که برای فرمان‌ها استفاده می‌شود.
   - **CLI path** (پیشرفته): مسیر اختیاری به یک entrypoint/binary قابل اجرای `openclaw` (وقتی advertise شود، خودکار پر می‌شود).
3. **Test remote** را بزنید. موفقیت نشان می‌دهد `openclaw status --json` راه‌دور درست اجرا می‌شود. خرابی‌ها معمولاً به معنی مشکل PATH/CLI هستند؛ exit 127 یعنی CLI در راه‌دور پیدا نشده است.
4. بررسی‌های سلامت و Web Chat اکنون به‌طور خودکار از طریق انتقال انتخاب‌شده اجرا می‌شوند.

## Web Chat

- **تونل SSH**: Web Chat از طریق پورت کنترل WebSocket فورواردشده (پیش‌فرض 18789) به Gateway وصل می‌شود.
- **مستقیم (ws/wss)**: Web Chat مستقیماً به URL پیکربندی‌شده Gateway وصل می‌شود.
- دیگر هیچ سرور HTTP جداگانه‌ای برای WebChat وجود ندارد.

## مجوزها

- میزبان راه‌دور به همان تأییدهای TCC محلی نیاز دارد (Automation، Accessibility، Screen Recording، Microphone، Speech Recognition، Notifications). onboarding را روی آن ماشین اجرا کنید تا یک‌بار آن‌ها را اعطا کنید.
- Nodeها وضعیت مجوزهای خود را از طریق `node.list` / `node.describe` advertise می‌کنند تا agentها بدانند چه چیزی در دسترس است.

## نکات امنیتی

- bindهای loopback روی میزبان راه‌دور را ترجیح دهید و از طریق SSH، Tailscale Serve، یا یک URL مستقیم مورداعتماد Tailnet/LAN وصل شوید.
- تونل‌زنی SSH از بررسی سخت‌گیرانه host-key استفاده می‌کند؛ ابتدا به کلید میزبان اعتماد کنید تا در `~/.ssh/known_hosts` وجود داشته باشد.
- اگر Gateway را به یک رابط غیر-loopback bind می‌کنید، احراز هویت معتبر Gateway را الزامی کنید: token، password، یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- [امنیت](/fa/gateway/security) و [Tailscale](/fa/gateway/tailscale) را ببینید.

## جریان ورود WhatsApp (راه‌دور)

- `openclaw channels login --verbose` را **روی میزبان راه‌دور** اجرا کنید. QR را با WhatsApp روی تلفن خود اسکن کنید.
- اگر auth منقضی شد، login را دوباره روی همان میزبان اجرا کنید. Health check مشکلات link را نمایش می‌دهد.

## عیب‌یابی

- **exit 127 / پیدا نشد**: `openclaw` برای shellهای غیر-login روی PATH نیست. آن را به `/etc/paths`، shell rc خود اضافه کنید، یا به `/usr/local/bin`/`/opt/homebrew/bin` symlink کنید.
- **Health probe failed**: دسترسی SSH، PATH، و login بودن Baileys را بررسی کنید (`openclaw status --json`).
- **Web Chat گیر کرده است**: تأیید کنید Gateway روی میزبان راه‌دور اجرا می‌شود و پورت فورواردشده با پورت WS مربوط به Gateway مطابقت دارد؛ UI به یک اتصال WS سالم نیاز دارد.
- **IP مربوط به Node مقدار 127.0.0.1 را نشان می‌دهد**: با تونل SSH مورد انتظار است. اگر می‌خواهید Gateway آدرس IP واقعی کلاینت را ببیند، **Transport** را به **Direct (ws/wss)** تغییر دهید.
- **Dashboard کار می‌کند اما قابلیت‌های Mac آفلاین هستند**: یعنی اتصال operator/control برنامه سالم است، اما اتصال Node همراه وصل نیست یا command surface آن را ندارد. بخش دستگاه در menu bar را باز کنید و بررسی کنید آیا Mac به‌صورت `paired · disconnected` است. برای endpointهای Tailscale Serve از نوع `wss://*.ts.net`، برنامه پس از چرخش certificate، pinهای TLS leaf قدیمی را تشخیص می‌دهد، وقتی macOS به certificate جدید اعتماد کرد pin قدیمی را پاک می‌کند، و به‌طور خودکار دوباره تلاش می‌کند. اگر certificate مورداعتماد سیستم نیست یا میزبان نام Tailscale Serve نیست، `gateway.remote.tlsFingerprint` را روی اثرانگشت certificate مورد انتظار تنظیم کنید، certificate را بازبینی کنید، یا به **Remote over SSH** تغییر دهید.
- **Voice Wake**: عبارت‌های trigger در حالت راه‌دور به‌طور خودکار forward می‌شوند؛ forwarder جداگانه لازم نیست.

## صداهای اعلان

برای هر اعلان از scriptها با `openclaw` و `node.invoke` صدا انتخاب کنید، مانند:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

دیگر هیچ toggle سراسری «default sound» در برنامه وجود ندارد؛ فراخوان‌ها برای هر درخواست یک صدا (یا هیچ‌کدام) انتخاب می‌کنند.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [دسترسی راه‌دور](/fa/gateway/remote)
