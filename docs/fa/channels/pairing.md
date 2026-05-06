---
read_when:
    - راه‌اندازی کنترل دسترسی پیام مستقیم
    - جفت‌سازی یک Node جدید iOS/Android
    - بررسی وضعیت امنیتی OpenClaw
summary: 'مرور کلی جفت‌سازی: تأیید کنید چه کسانی می‌توانند برایتان پیام خصوصی بفرستند + کدام Nodeها می‌توانند بپیوندند'
title: جفت‌سازی
x-i18n:
    generated_at: "2026-05-06T09:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5543c10868418234714b175cd4bd373818be8dd40327121ac6c44819ed7519b2
    source_path: channels/pairing.md
    workflow: 16
---

«جفت‌سازی» گام تأیید دسترسی صریح OpenClaw است.
در دو جا استفاده می‌شود:

1. **جفت‌سازی DM** (چه کسی اجازه دارد با ربات صحبت کند)
2. **جفت‌سازی Node** (کدام دستگاه‌ها/Nodeها اجازه دارند به شبکه Gateway بپیوندند)

زمینه امنیتی: [امنیت](/fa/gateway/security)

## ۱) جفت‌سازی DM (دسترسی گفت‌وگوی ورودی)

وقتی یک کانال با سیاست DM به‌صورت `pairing` پیکربندی شده باشد، فرستنده‌های ناشناس یک کد کوتاه دریافت می‌کنند و پیامشان تا وقتی تأیید نکنید **پردازش نمی‌شود**.

سیاست‌های پیش‌فرض DM در اینجا مستند شده‌اند: [امنیت](/fa/gateway/security)

`dmPolicy: "open"` فقط وقتی عمومی است که allowlist مؤثر DM شامل `"*"` باشد.
راه‌اندازی و اعتبارسنجی برای پیکربندی‌های عمومی-باز به آن wildcard نیاز دارند. اگر state موجود شامل `open` همراه با ورودی‌های مشخص `allowFrom` باشد، runtime همچنان فقط همان فرستنده‌ها را می‌پذیرد و تأییدهای pairing-store دسترسی `open` را گسترده‌تر نمی‌کنند.

کدهای جفت‌سازی:

- ۸ نویسه، حروف بزرگ، بدون نویسه‌های مبهم (`0O1I`).
- **پس از ۱ ساعت منقضی می‌شوند**. ربات فقط وقتی پیام جفت‌سازی را می‌فرستد که درخواست تازه‌ای ایجاد شود (تقریباً یک‌بار در ساعت برای هر فرستنده).
- درخواست‌های جفت‌سازی DM در انتظار، به‌طور پیش‌فرض به **۳ مورد برای هر کانال** محدودند؛ درخواست‌های اضافی تا وقتی یکی منقضی یا تأیید شود نادیده گرفته می‌شوند.

### تأیید یک فرستنده

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

اگر هنوز مالک فرمانی پیکربندی نشده باشد، تأیید یک کد جفت‌سازی DM همچنین
`commands.ownerAllowFrom` را با فرستنده تأییدشده bootstrap می‌کند، مانند `telegram:123456789`.
این کار برای راه‌اندازی‌های نخستین، یک مالک صریح برای فرمان‌های دارای امتیاز و اعلان‌های تأیید exec فراهم می‌کند. پس از آنکه مالک وجود داشته باشد، تأییدهای بعدی جفت‌سازی فقط دسترسی DM می‌دهند؛ مالک‌های بیشتری اضافه نمی‌کنند.

کانال‌های پشتیبانی‌شده: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### گروه‌های فرستنده قابل استفاده مجدد

وقتی همان مجموعه فرستنده‌های مورد اعتماد باید برای چند کانال پیام یا هم برای allowlistهای DM و هم گروه اعمال شود، از `accessGroups` سطح بالا استفاده کنید.

گروه‌های ایستا از `type: "message.senders"` استفاده می‌کنند و از allowlistهای کانال با `accessGroup:<name>` ارجاع داده می‌شوند:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

گروه‌های دسترسی با جزئیات در اینجا مستند شده‌اند: [گروه‌های دسترسی](/fa/channels/access-groups)

### محل نگهداری state

زیر `~/.openclaw/credentials/` ذخیره می‌شود:

- درخواست‌های در انتظار: `<channel>-pairing.json`
- store تأییدشده allowlist:
  - حساب پیش‌فرض: `<channel>-allowFrom.json`
  - حساب غیرپیش‌فرض: `<channel>-<accountId>-allowFrom.json`

رفتار دامنه‌بندی حساب:

- حساب‌های غیرپیش‌فرض فقط فایل allowlist دامنه‌بندی‌شده خودشان را می‌خوانند/می‌نویسند.
- حساب پیش‌فرض از فایل allowlist بدون دامنه‌بندی و دامنه‌بندی‌شده به کانال استفاده می‌کند.

با این‌ها به‌عنوان داده حساس برخورد کنید (دسترسی به دستیار شما را کنترل می‌کنند).

<Note>
store مربوط به allowlist جفت‌سازی برای دسترسی DM است. مجوزدهی گروه جداست.
تأیید یک کد جفت‌سازی DM به‌طور خودکار اجازه نمی‌دهد آن فرستنده فرمان‌های گروهی را اجرا کند یا ربات را در گروه‌ها کنترل کند. bootstrap نخستین مالک یک state پیکربندی جداگانه در `commands.ownerAllowFrom` است، و تحویل گفت‌وگوی گروهی همچنان از allowlistهای گروهی کانال پیروی می‌کند (برای مثال `groupAllowFrom`، `groups`، یا overrideهای هر گروه یا هر topic بسته به کانال).
</Note>

## ۲) جفت‌سازی دستگاه Node (Nodeهای iOS/Android/macOS/headless)

Nodeها به‌عنوان **دستگاه‌ها** با `role: node` به Gateway وصل می‌شوند. Gateway یک درخواست جفت‌سازی دستگاه ایجاد می‌کند که باید تأیید شود.

### جفت‌سازی از طریق Telegram (توصیه‌شده برای iOS)

اگر از Plugin `device-pair` استفاده می‌کنید، می‌توانید جفت‌سازی اولیه دستگاه را کاملاً از Telegram انجام دهید:

1. در Telegram به ربات خود پیام دهید: `/pair`
2. ربات با دو پیام پاسخ می‌دهد: یک پیام راهنما و یک پیام جداگانه **کد راه‌اندازی** (برای کپی/پیست در Telegram آسان است).
3. روی گوشی خود، اپ OpenClaw برای iOS را باز کنید ← Settings ← Gateway.
4. کد QR را اسکن کنید یا کد راه‌اندازی را paste کنید و وصل شوید.
5. دوباره در Telegram: `/pair pending` (شناسه‌های درخواست، نقش و scopes را بررسی کنید)، سپس تأیید کنید.

کد راه‌اندازی یک payload JSON کدگذاری‌شده با base64 است که شامل این موارد است:

- `url`: نشانی WebSocket مربوط به Gateway (`ws://...` یا `wss://...`)
- `bootstrapToken`: یک توکن bootstrap کوتاه‌عمر و تک‌دستگاهی که برای handshake اولیه جفت‌سازی استفاده می‌شود

آن توکن bootstrap پروفایل bootstrap داخلی جفت‌سازی را حمل می‌کند:

- توکن `node` اصلیِ واگذارشده، `scopes: []` باقی می‌ماند
- هر توکن `operator` واگذارشده به bootstrap allowlist محدود می‌ماند:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- بررسی‌های scope مربوط به bootstrap با پیشوند نقش هستند، نه یک مخزن scope تخت:
  ورودی‌های scope مربوط به operator فقط درخواست‌های operator را برآورده می‌کنند، و نقش‌های غیر-operator همچنان باید scopeها را زیر پیشوند نقش خودشان درخواست کنند
- چرخش/لغو بعدی توکن همچنان هم به قرارداد نقش تأییدشده دستگاه و هم به scopeهای operator نشست فراخواننده محدود می‌ماند

تا وقتی کد راه‌اندازی معتبر است با آن مانند گذرواژه رفتار کنید.

برای Tailscale، عمومی، یا دیگر جفت‌سازی‌های موبایل راه‌دور، از Tailscale Serve/Funnel یا یک URL دیگر `wss://` برای Gateway استفاده کنید. کدهای راه‌اندازی plaintext با `ws://` فقط برای loopback، نشانی‌های LAN خصوصی، میزبان‌های Bonjour با `.local` و میزبان شبیه‌ساز Android پذیرفته می‌شوند. نشانی‌های Tailnet CGNAT، نام‌های `.ts.net` و میزبان‌های عمومی همچنان پیش از صدور QR/کد راه‌اندازی به‌صورت fail-closed رد می‌شوند.

### تأیید یک دستگاه Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

وقتی تأیید صریح به این دلیل رد شود که نشست دستگاه جفت‌شده تأییدکننده با scope فقط-جفت‌سازی باز شده بود، CLI همان درخواست را با `operator.admin` دوباره امتحان می‌کند. این به یک دستگاه جفت‌شده موجود با قابلیت admin اجازه می‌دهد بدون ویرایش دستی `devices/paired.json`، جفت‌سازی تازه Control UI/browser را بازیابی کند. Gateway همچنان اتصال دوباره‌امتحان‌شده را اعتبارسنجی می‌کند؛ توکن‌هایی که نمی‌توانند با `operator.admin` احراز هویت کنند همچنان مسدود می‌مانند.

اگر همان دستگاه با جزئیات auth متفاوت دوباره تلاش کند (برای مثال role/scopes/public key متفاوت)، درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ایجاد می‌شود.

<Note>
دستگاهی که از قبل جفت شده است بی‌صدا دسترسی گسترده‌تر دریافت نمی‌کند. اگر دوباره وصل شود و scopeهای بیشتر یا نقش گسترده‌تری بخواهد، OpenClaw تأیید موجود را همان‌طور که هست نگه می‌دارد و یک درخواست ارتقای تازه در انتظار ایجاد می‌کند. پیش از تأیید، از `openclaw devices list` برای مقایسه دسترسی تأییدشده فعلی با دسترسی تازه درخواست‌شده استفاده کنید.
</Note>

### تأیید خودکار اختیاری Node با CIDR مورد اعتماد

جفت‌سازی دستگاه به‌طور پیش‌فرض دستی می‌ماند. برای شبکه‌های Node کاملاً کنترل‌شده، می‌توانید با CIDRهای صریح یا IPهای دقیق، تأیید خودکار نخستین Node را فعال کنید:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

این فقط برای درخواست‌های تازه جفت‌سازی با `role: node` که scope درخواستی ندارند اعمال می‌شود. کلاینت‌های Operator، browser، Control UI و WebChat همچنان به تأیید دستی نیاز دارند. تغییرات نقش، scope، metadata و public-key همچنان به تأیید دستی نیاز دارند.

### ذخیره‌سازی state جفت‌سازی Node

زیر `~/.openclaw/devices/` ذخیره می‌شود:

- `pending.json` (کوتاه‌عمر؛ درخواست‌های در انتظار منقضی می‌شوند)
- `paired.json` (دستگاه‌های جفت‌شده + توکن‌ها)

### نکته‌ها

- API قدیمی `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) یک store جفت‌سازی جداگانه و متعلق به gateway است. Nodeهای WS همچنان به جفت‌سازی دستگاه نیاز دارند.
- رکورد جفت‌سازی منبع پایدار حقیقت برای نقش‌های تأییدشده است. توکن‌های فعال دستگاه به همان مجموعه نقش تأییدشده محدود می‌مانند؛ یک ورودی توکن پراکنده خارج از نقش‌های تأییدشده دسترسی تازه ایجاد نمی‌کند.

## مستندات مرتبط

- مدل امنیتی + تزریق prompt: [امنیت](/fa/gateway/security)
- به‌روزرسانی ایمن (اجرای doctor): [به‌روزرسانی](/fa/install/updating)
- پیکربندی‌های کانال:
  - Telegram: [Telegram](/fa/channels/telegram)
  - WhatsApp: [WhatsApp](/fa/channels/whatsapp)
  - Signal: [Signal](/fa/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/fa/channels/bluebubbles)
  - iMessage (قدیمی): [iMessage](/fa/channels/imessage)
  - Discord: [Discord](/fa/channels/discord)
  - Slack: [Slack](/fa/channels/slack)
