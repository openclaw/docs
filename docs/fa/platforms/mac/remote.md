---
read_when:
    - راه‌اندازی یا اشکال‌زدایی کنترل از راه دور مک
summary: جریان برنامه macOS برای کنترل یک Gateway راه‌دور OpenClaw
title: کنترل از راه دور
x-i18n:
    generated_at: "2026-07-03T23:39:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

این جریان به اپ macOS اجازه می‌دهد مانند یک کنترل از راه دور کامل برای Gateway OpenClaw که روی میزبان دیگری (دسکتاپ/سرور) اجرا می‌شود عمل کند. اپ می‌تواند مستقیماً به URLهای Gateway قابل‌اعتماد LAN/Tailnet وصل شود یا وقتی Gateway راه دور فقط loopback است، یک تونل SSH را مدیریت کند. بررسی‌های سلامت، ارسال بیدارباش صوتی، و چت وب از همان پیکربندی راه دور در _Settings → General_ استفاده می‌کنند.

## حالت‌ها

- **محلی (همین Mac)**: همه‌چیز روی لپ‌تاپ اجرا می‌شود. SSH دخیل نیست.
- **راه دور از طریق SSH (پیش‌فرض)**: فرمان‌های OpenClaw روی میزبان راه دور اجرا می‌شوند. اپ مک یک اتصال SSH با `-o BatchMode` به‌علاوه هویت/کلید انتخابی شما و یک port-forward محلی باز می‌کند.
- **راه دور مستقیم (ws/wss)**: تونل SSH وجود ندارد. اپ مک مستقیماً به URL Gateway وصل می‌شود (برای مثال، از طریق LAN، Tailscale، Tailscale Serve، یا یک reverse proxy عمومی HTTPS).

## ترابری‌های راه دور

حالت راه دور از دو ترابری پشتیبانی می‌کند:

- **تونل SSH** (پیش‌فرض): از `ssh -N -L ...` برای ارسال پورت Gateway به localhost استفاده می‌کند. Gateway آدرس IP نود را به‌صورت `127.0.0.1` می‌بیند چون تونل loopback است.
- **مستقیم (ws/wss)**: مستقیماً به URL Gateway وصل می‌شود. Gateway آدرس IP واقعی کلاینت را می‌بیند.

اپ برای فرایندهای SSH متعلق به اپ، multiplexing اتصال SSH و رفتن به پس‌زمینه پس از احراز هویت را غیرفعال می‌کند تا بتواند همان فرایند دقیق را حتی وقتی alias انتخاب‌شده `ControlMaster` یا `ForkAfterAuthentication` را فعال کرده است، پایش و بازراه‌اندازی کند.

راستی‌آزمایی کلید میزبان SSH به‌طور پیش‌فرض سخت‌گیرانه است چون اعتبارنامه‌های Gateway از طریق این تونل عبور می‌کنند. برای یک alias مدیریت‌شده SSH که رفتار اعتماد آن را عمداً می‌خواهید استفاده کنید، با `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` فعال کنید یا `gateway.remote.sshHostKeyPolicy` را روی `"openssh"` تنظیم کنید. این فعال‌سازی از سیاست مؤثر کلید میزبان OpenSSH استفاده می‌کند؛ ابتدا alias و هر پیکربندی منطبق `Host *` یا پیکربندی سیستمی را بررسی کنید. تغییر هدف SSH در اپ یا با `configure-remote` سیاست را به `strict` بازنشانی می‌کند، مگر اینکه دوباره صراحتاً آن را فعال کنید.

در حالت تونل SSH، نام‌های میزبان LAN/tailnet کشف‌شده به‌عنوان
`gateway.remote.sshTarget` ذخیره می‌شوند. اپ `gateway.remote.url` را روی نقطه پایانی تونل محلی
نگه می‌دارد، برای مثال `ws://127.0.0.1:18789`، تا CLI، چت وب، و
سرویس میزبان نود محلی همگی از همان ترابری loopback امن استفاده کنند.
وقتی کشف هم IPهای خام Tailnet و هم نام‌های میزبان پایدار را برمی‌گرداند، اپ
نام‌های Tailscale MagicDNS یا LAN را ترجیح می‌دهد تا اتصال‌های راه دور در برابر
تغییر آدرس بهتر دوام بیاورند.
اگر پورت تونل محلی با پورت Gateway راه دور متفاوت است،
`gateway.remote.remotePort` را روی پورت میزبان راه دور تنظیم کنید.

اتوماسیون مرورگر در حالت راه دور متعلق به میزبان نود CLI است، نه
نود بومی اپ macOS. اپ هر زمان ممکن باشد سرویس میزبان نود نصب‌شده را شروع می‌کند؛
اگر از آن Mac به کنترل مرورگر نیاز دارید، آن را با
`openclaw node install ...` و `openclaw node start` نصب/شروع کنید (یا
`openclaw node run ...` را در foreground اجرا کنید)، سپس همان نود دارای قابلیت مرورگر
را هدف بگیرید.

## پیش‌نیازها روی میزبان راه دور

1. Node + pnpm را نصب کنید و CLI OpenClaw را بسازید/نصب کنید (`pnpm install && pnpm build && pnpm link --global`).
2. مطمئن شوید `openclaw` برای shellهای غیرتعاملی روی PATH است (در صورت نیاز به `/usr/local/bin` یا `/opt/homebrew/bin` symlink کنید).
3. فقط برای ترابری SSH: SSH را با احراز هویت کلیدی باز کنید. برای دسترسی‌پذیری پایدار خارج از LAN، IPهای **Tailscale** را توصیه می‌کنیم.

## راه‌اندازی اپ macOS

برای پیش‌پیکربندی اپ بدون جریان خوشامدگویی:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

برای Gateway که همین حالا روی یک LAN یا Tailnet قابل‌اعتماد در دسترس است، SSH را کاملاً رد کنید:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

این کار پیکربندی راه دور را می‌نویسد، onboarding را کامل‌شده علامت می‌زند، و به اپ اجازه می‌دهد هنگام شروع،
ترابری انتخاب‌شده را مالک شود.

1. _Settings → General_ را باز کنید.
2. زیر **OpenClaw runs**، **Remote** را انتخاب کنید و تنظیم کنید:
   - **Transport**: **SSH tunnel** یا **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` اختیاری).
     - اگر Gateway روی همان LAN است و Bonjour را advertise می‌کند، آن را از فهرست کشف‌شده انتخاب کنید تا این فیلد خودکار پر شود.
   - **Gateway URL** (فقط Direct): `wss://gateway.example.ts.net` (یا `ws://...` برای محلی/LAN).
   - **Identity file** (پیشرفته): مسیر کلید شما.
   - **Project root** (پیشرفته): مسیر checkout راه دور که برای فرمان‌ها استفاده می‌شود.
   - **CLI path** (پیشرفته): مسیر اختیاری به یک entrypoint/باینری قابل‌اجرای `openclaw` (وقتی advertise شود خودکار پر می‌شود).
3. **Test remote** را بزنید. موفقیت نشان می‌دهد `openclaw status --json` راه دور درست اجرا می‌شود. شکست‌ها معمولاً به معنی مشکلات PATH/CLI هستند؛ کد خروج 127 یعنی CLI در راه دور پیدا نشده است.
4. بررسی‌های سلامت و چت وب اکنون خودکار از طریق ترابری انتخاب‌شده اجرا می‌شوند.

## چت وب

- **تونل SSH**: چت وب از طریق پورت کنترل WebSocket ارسال‌شده (پیش‌فرض 18789) به Gateway وصل می‌شود.
- **مستقیم (ws/wss)**: چت وب مستقیماً به URL پیکربندی‌شده Gateway وصل می‌شود.
- دیگر سرور HTTP جداگانه‌ای برای WebChat وجود ندارد.

## مجوزها

- میزبان راه دور به همان تأییدیه‌های TCC حالت محلی نیاز دارد (Automation، Accessibility، Screen Recording، Microphone، Speech Recognition، Notifications). onboarding را روی همان ماشین اجرا کنید تا یک‌بار آن‌ها را اعطا کنید.
- نودها وضعیت مجوز خود را از طریق `node.list` / `node.describe` advertise می‌کنند تا agentها بدانند چه چیزهایی در دسترس است.

## نکات امنیتی

- bindهای loopback را روی میزبان راه دور ترجیح دهید و از طریق SSH، Tailscale Serve، یا یک URL مستقیم Tailnet/LAN قابل‌اعتماد وصل شوید.
- تونل‌زنی SSH به‌طور پیش‌فرض به یک کلید میزبان از قبل قابل‌اعتماد نیاز دارد. ابتدا به کلید میزبان اعتماد کنید تا در فایل known-hosts پیکربندی‌شده وجود داشته باشد، یا برای یک alias مدیریت‌شده که سیاست اعتماد OpenSSH آن را می‌پذیرید، صراحتاً `gateway.remote.sshHostKeyPolicy: "openssh"` را انتخاب کنید.
- اگر Gateway را به یک interface غیر-loopback bind می‌کنید، احراز هویت معتبر Gateway را الزامی کنید: token، password، یا یک reverse proxy آگاه از هویت با `gateway.auth.mode: "trusted-proxy"`.
- [امنیت](/fa/gateway/security) و [Tailscale](/fa/gateway/tailscale) را ببینید.

## جریان ورود WhatsApp (راه دور)

- `openclaw channels login --verbose` را **روی میزبان راه دور** اجرا کنید. QR را با WhatsApp روی گوشی خود اسکن کنید.
- اگر احراز هویت منقضی شد، ورود را دوباره روی همان میزبان اجرا کنید. بررسی سلامت مشکلات لینک را نمایش می‌دهد.

## عیب‌یابی

- **exit 127 / پیدا نشد**: `openclaw` برای shellهای غیر-login روی PATH نیست. آن را به `/etc/paths`، فایل rc شل خود اضافه کنید، یا به `/usr/local/bin`/`/opt/homebrew/bin` symlink کنید.
- **Health probe failed**: دسترسی‌پذیری SSH، PATH، و login بودن Baileys را بررسی کنید (`openclaw status --json`).
- **چت وب گیر کرده است**: تأیید کنید Gateway روی میزبان راه دور در حال اجراست و پورت ارسال‌شده با پورت WS Gateway مطابقت دارد؛ UI به اتصال سالم WS نیاز دارد.
- **IP نود 127.0.0.1 نشان داده می‌شود**: با تونل SSH مورد انتظار است. اگر می‌خواهید Gateway آدرس IP واقعی کلاینت را ببیند، **Transport** را به **Direct (ws/wss)** تغییر دهید.
- **داشبورد کار می‌کند اما قابلیت‌های Mac آفلاین‌اند**: یعنی اتصال operator/control اپ سالم است، اما اتصال نود همراه وصل نیست یا سطح فرمان خود را ندارد. بخش دستگاه در menu bar را باز کنید و بررسی کنید آیا Mac به‌صورت `paired · disconnected` است یا نه. برای endpointهای Tailscale Serve با `wss://*.ts.net`، اپ pinهای TLS leaf قدیمی مانده پس از چرخش گواهی را تشخیص می‌دهد، وقتی macOS به گواهی جدید اعتماد کند pin قدیمی را پاک می‌کند، و خودکار دوباره تلاش می‌کند. اگر گواهی مورد اعتماد سیستم نیست یا میزبان نام Tailscale Serve نیست، `gateway.remote.tlsFingerprint` را روی fingerprint گواهی مورد انتظار تنظیم کنید، گواهی را بررسی کنید، یا به **Remote over SSH** تغییر دهید.
- **بیدارباش صوتی**: عبارت‌های trigger در حالت راه دور خودکار ارسال می‌شوند؛ forwarder جداگانه‌ای لازم نیست.

## صداهای اعلان

برای هر اعلان، صداها را از اسکریپت‌ها با `openclaw` و `node.invoke` انتخاب کنید، برای مثال:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

دیگر toggle عمومی «صدای پیش‌فرض» در اپ وجود ندارد؛ فراخوان‌ها برای هر درخواست یک صدا (یا هیچ‌کدام) انتخاب می‌کنند.

## مرتبط

- [اپ macOS](/fa/platforms/macos)
- [دسترسی راه دور](/fa/gateway/remote)
