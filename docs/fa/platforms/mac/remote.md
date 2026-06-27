---
read_when:
    - راه‌اندازی یا اشکال‌زدایی کنترل مک از راه دور
summary: جریان برنامه macOS برای کنترل یک Gateway راه دور OpenClaw
title: کنترل از راه دور
x-i18n:
    generated_at: "2026-06-27T18:07:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

این جریان به برنامه macOS اجازه می‌دهد مانند یک کنترل از راه دور کامل برای Gateway مربوط به OpenClaw که روی میزبان دیگری (دسکتاپ/سرور) اجرا می‌شود عمل کند. برنامه می‌تواند مستقیماً به URLهای Gateway مورد اعتماد در LAN/Tailnet وصل شود یا وقتی Gateway راه‌دور فقط loopback است، یک تونل SSH را مدیریت کند. بررسی‌های سلامت، ارسال Voice Wake، و Web Chat از همان پیکربندی راه‌دور در _Settings → General_ استفاده می‌کنند.

## حالت‌ها

- **محلی (این Mac)**: همه‌چیز روی لپ‌تاپ اجرا می‌شود. SSH در کار نیست.
- **راه‌دور از طریق SSH (پیش‌فرض)**: دستورهای OpenClaw روی میزبان راه‌دور اجرا می‌شوند. برنامه mac با `-o BatchMode` به‌همراه هویت/کلید انتخابی شما و یک port-forward محلی، اتصال SSH باز می‌کند.
- **راه‌دور مستقیم (ws/wss)**: تونل SSH وجود ندارد. برنامه mac مستقیماً به URL مربوط به Gateway وصل می‌شود (برای مثال، از طریق LAN، Tailscale، Tailscale Serve، یا یک reverse proxy عمومی HTTPS).

## انتقال‌های راه‌دور

حالت راه‌دور از دو انتقال پشتیبانی می‌کند:

- **تونل SSH** (پیش‌فرض): از `ssh -N -L ...` برای forward کردن پورت Gateway به localhost استفاده می‌کند. Gateway نشانی IP مربوط به node را به‌صورت `127.0.0.1` می‌بیند، چون تونل loopback است.
- **مستقیم (ws/wss)**: مستقیماً به URL مربوط به Gateway وصل می‌شود. Gateway نشانی IP واقعی کلاینت را می‌بیند.

در حالت تونل SSH، نام‌های میزبان LAN/tailnet کشف‌شده به‌صورت
`gateway.remote.sshTarget` ذخیره می‌شوند. برنامه `gateway.remote.url` را روی
نقطه پایانی تونل محلی نگه می‌دارد، برای مثال `ws://127.0.0.1:18789`، تا CLI، Web Chat، و
سرویس محلی node-host همگی از همان انتقال امن loopback استفاده کنند.
اگر پورت تونل محلی با پورت Gateway راه‌دور متفاوت است،
`gateway.remote.remotePort` را روی پورت میزبان راه‌دور تنظیم کنید.

اتوماسیون مرورگر در حالت راه‌دور متعلق به میزبان CLI node است، نه node
بومی برنامه macOS. برنامه در صورت امکان سرویس میزبان node نصب‌شده را شروع می‌کند؛ اگر از آن Mac به کنترل مرورگر نیاز دارید، آن را با
`openclaw node install ...` و `openclaw node start` نصب/شروع کنید (یا
`openclaw node run ...` را در foreground اجرا کنید)، سپس همان node دارای قابلیت مرورگر را هدف بگیرید.

## پیش‌نیازها روی میزبان راه‌دور

1. Node + pnpm را نصب کنید و OpenClaw CLI را بسازید/نصب کنید (`pnpm install && pnpm build && pnpm link --global`).
2. مطمئن شوید `openclaw` برای shellهای غیرتعاملی روی PATH قرار دارد (در صورت نیاز به `/usr/local/bin` یا `/opt/homebrew/bin` symlink کنید).
3. فقط برای انتقال SSH: SSH را با احراز هویت کلیدی باز کنید. برای دسترسی پایدار خارج از LAN، نشانی‌های IP مربوط به **Tailscale** را توصیه می‌کنیم.

## راه‌اندازی برنامه macOS

برای پیکربندی اولیه برنامه بدون جریان خوش‌آمدگویی:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

برای Gatewayای که از قبل روی LAN یا Tailnet مورد اعتماد قابل دسترسی است، SSH را کاملاً رد کنید:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

این کار پیکربندی راه‌دور را می‌نویسد، onboarding را کامل‌شده علامت می‌زند، و به برنامه اجازه می‌دهد
هنگام شروع، مالک انتقال انتخاب‌شده باشد.

1. _Settings → General_ را باز کنید.
2. زیر **OpenClaw runs**، گزینه **Remote** را انتخاب کنید و تنظیم کنید:
   - **Transport**: **SSH tunnel** یا **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` اختیاری).
     - اگر Gateway روی همان LAN است و Bonjour را advertise می‌کند، آن را از فهرست کشف‌شده انتخاب کنید تا این فیلد خودکار پر شود.
   - **Gateway URL** (فقط Direct): `wss://gateway.example.ts.net` (یا `ws://...` برای محلی/LAN).
   - **Identity file** (پیشرفته): مسیر کلید شما.
   - **Project root** (پیشرفته): مسیر checkout راه‌دور که برای دستورها استفاده می‌شود.
   - **CLI path** (پیشرفته): مسیر اختیاری به یک entrypoint/باینری قابل اجرای `openclaw` (وقتی advertise شده باشد خودکار پر می‌شود).
3. **Test remote** را بزنید. موفقیت نشان می‌دهد `openclaw status --json` راه‌دور درست اجرا می‌شود. شکست‌ها معمولاً به مشکلات PATH/CLI مربوط‌اند؛ کد خروج 127 یعنی CLI در راه‌دور پیدا نشده است.
4. بررسی‌های سلامت و Web Chat اکنون به‌طور خودکار از طریق انتقال انتخاب‌شده اجرا می‌شوند.

## Web Chat

- **تونل SSH**: Web Chat از طریق پورت کنترل WebSocket فورواردشده (پیش‌فرض 18789) به Gateway وصل می‌شود.
- **مستقیم (ws/wss)**: Web Chat مستقیماً به URL پیکربندی‌شده Gateway وصل می‌شود.
- دیگر سرور HTTP جداگانه‌ای برای WebChat وجود ندارد.

## مجوزها

- میزبان راه‌دور به همان تأییدهای TCC مانند حالت محلی نیاز دارد (Automation، Accessibility، Screen Recording، Microphone، Speech Recognition، Notifications). برای اعطای یک‌باره آن‌ها، onboarding را روی همان ماشین اجرا کنید.
- Nodeها وضعیت مجوز خود را از طریق `node.list` / `node.describe` اعلام می‌کنند تا عامل‌ها بدانند چه چیزهایی در دسترس است.

## نکات امنیتی

- bindهای loopback روی میزبان راه‌دور را ترجیح دهید و از طریق SSH، Tailscale Serve، یا یک URL مستقیم مورد اعتماد Tailnet/LAN وصل شوید.
- تونل‌زنی SSH از بررسی سخت‌گیرانه host-key استفاده می‌کند؛ ابتدا به کلید میزبان اعتماد کنید تا در `~/.ssh/known_hosts` وجود داشته باشد.
- اگر Gateway را به یک رابط غیر-loopback bind می‌کنید، احراز هویت معتبر Gateway را الزامی کنید: token، password، یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- [امنیت](/fa/gateway/security) و [Tailscale](/fa/gateway/tailscale) را ببینید.

## جریان ورود WhatsApp (راه‌دور)

- `openclaw channels login --verbose` را **روی میزبان راه‌دور** اجرا کنید. QR را با WhatsApp روی تلفن خود اسکن کنید.
- اگر احراز هویت منقضی شد، ورود را دوباره روی همان میزبان اجرا کنید. بررسی سلامت مشکلات لینک را نمایش می‌دهد.

## عیب‌یابی

- **exit 127 / not found**: `openclaw` برای shellهای غیر-login روی PATH نیست. آن را به `/etc/paths`، rc مربوط به shell خود اضافه کنید، یا به `/usr/local/bin`/`/opt/homebrew/bin` symlink کنید.
- **Health probe failed**: دسترسی‌پذیری SSH، PATH، و وارد بودن Baileys را بررسی کنید (`openclaw status --json`).
- **Web Chat stuck**: تأیید کنید Gateway روی میزبان راه‌دور در حال اجراست و پورت فورواردشده با پورت WS مربوط به Gateway مطابقت دارد؛ UI به یک اتصال WS سالم نیاز دارد.
- **Node IP shows 127.0.0.1**: با تونل SSH مورد انتظار است. اگر می‌خواهید Gateway نشانی IP واقعی کلاینت را ببیند، **Transport** را به **Direct (ws/wss)** تغییر دهید.
- **Dashboard works but Mac capabilities are offline**: این یعنی اتصال operator/control برنامه سالم است، اما اتصال node همراه وصل نیست یا سطح دستورهای آن موجود نیست. بخش دستگاه در menu bar را باز کنید و بررسی کنید آیا Mac به‌صورت `paired · disconnected` است یا نه. برای endpointهای `wss://*.ts.net` مربوط به Tailscale Serve، برنامه pinهای قدیمی TLS leaf را پس از rotation گواهی تشخیص می‌دهد، وقتی macOS به گواهی جدید اعتماد کند pin قدیمی را پاک می‌کند، و به‌طور خودکار دوباره تلاش می‌کند. اگر گواهی مورد اعتماد سیستم نیست یا میزبان نام Tailscale Serve نیست، `gateway.remote.tlsFingerprint` را روی fingerprint مورد انتظار گواهی تنظیم کنید، گواهی را بازبینی کنید، یا به **Remote over SSH** تغییر دهید.
- **Voice Wake**: عبارت‌های trigger در حالت راه‌دور به‌طور خودکار forward می‌شوند؛ forwarder جداگانه‌ای لازم نیست.

## صداهای اعلان

صداها را برای هر اعلان از اسکریپت‌ها با `openclaw` و `node.invoke` انتخاب کنید، برای مثال:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

دیگر toggle سراسری «default sound» در برنامه وجود ندارد؛ فراخوان‌ها برای هر درخواست یک صدا (یا هیچ‌کدام) انتخاب می‌کنند.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [دسترسی راه‌دور](/fa/gateway/remote)
