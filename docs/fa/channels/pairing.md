---
read_when:
    - راه‌اندازی کنترل دسترسی پیام مستقیم
    - جفت‌سازی یک گره جدید iOS/Android
    - بررسی وضعیت امنیتی OpenClaw
summary: 'نمای کلی جفت‌سازی: تأیید کنید چه کسانی می‌توانند برایتان پیام مستقیم بفرستند + کدام Nodeها می‌توانند بپیوندند'
title: جفت‌سازی
x-i18n:
    generated_at: "2026-05-07T01:51:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

«Pairing» مرحلهٔ تأیید صریح دسترسی در OpenClaw است.
در دو جا استفاده می‌شود:

1. **Pairing پیام مستقیم** (چه کسی مجاز است با ربات صحبت کند)
2. **Pairing Node** (کدام دستگاه‌ها/Nodeها مجازند به شبکهٔ Gateway بپیوندند)

زمینهٔ امنیتی: [امنیت](/fa/gateway/security)

## 1) Pairing پیام مستقیم (دسترسی گفت‌وگوی ورودی)

وقتی یک کانال با سیاست پیام مستقیم `pairing` پیکربندی شده باشد، فرستنده‌های ناشناس یک کد کوتاه دریافت می‌کنند و پیام آن‌ها تا زمانی که شما تأیید نکنید **پردازش نمی‌شود**.

سیاست‌های پیش‌فرض پیام مستقیم در اینجا مستند شده‌اند: [امنیت](/fa/gateway/security)

`dmPolicy: "open"` فقط زمانی عمومی است که allowlist مؤثر پیام مستقیم شامل `"*"` باشد.
راه‌اندازی و اعتبارسنجی برای پیکربندی‌های public-open به آن wildcard نیاز دارند. اگر state موجود شامل `open` همراه با ورودی‌های مشخص `allowFrom` باشد، runtime همچنان فقط همان فرستنده‌ها را می‌پذیرد، و تأییدهای pairing-store دسترسی `open` را گسترده‌تر نمی‌کنند.

کدهای Pairing:

- ۸ نویسه، حروف بزرگ، بدون نویسه‌های مبهم (`0O1I`).
- **پس از ۱ ساعت منقضی می‌شوند**. ربات پیام pairing را فقط وقتی یک درخواست جدید ساخته شود می‌فرستد (تقریباً هر ساعت یک‌بار برای هر فرستنده).
- درخواست‌های در انتظار برای pairing پیام مستقیم به‌صورت پیش‌فرض به **۳ مورد برای هر کانال** محدودند؛ درخواست‌های بیشتر تا وقتی یکی منقضی یا تأیید شود نادیده گرفته می‌شوند.

### تأیید یک فرستنده

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

اگر هنوز مالک فرمانی پیکربندی نشده باشد، تأیید یک کد pairing پیام مستقیم همچنین `commands.ownerAllowFrom` را با فرستندهٔ تأییدشده راه‌اندازی اولیه می‌کند، مانند `telegram:123456789`.
این کار برای راه‌اندازی‌های بار اول یک مالک صریح برای فرمان‌های دارای امتیاز و promptهای تأیید exec فراهم می‌کند. پس از آنکه یک مالک وجود داشته باشد، تأییدهای pairing بعدی فقط دسترسی پیام مستقیم می‌دهند؛ مالک‌های بیشتری اضافه نمی‌کنند.

کانال‌های پشتیبانی‌شده: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### گروه‌های فرستندهٔ قابل استفادهٔ مجدد

وقتی همان مجموعهٔ فرستنده‌های مورد اعتماد باید برای چند کانال پیام‌رسانی یا هم برای allowlistهای پیام مستقیم و هم گروه اعمال شود، از `accessGroups` در سطح بالا استفاده کنید.

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

گروه‌های دسترسی به‌تفصیل اینجا مستند شده‌اند: [گروه‌های دسترسی](/fa/channels/access-groups)

### محل نگهداری state

زیر `~/.openclaw/credentials/` ذخیره می‌شود:

- درخواست‌های در انتظار: `<channel>-pairing.json`
- ذخیره‌گاه allowlist تأییدشده:
  - حساب پیش‌فرض: `<channel>-allowFrom.json`
  - حساب غیرپیش‌فرض: `<channel>-<accountId>-allowFrom.json`

رفتار scope حساب:

- حساب‌های غیرپیش‌فرض فقط فایل allowlist محدوده‌دار خودشان را می‌خوانند/می‌نویسند.
- حساب پیش‌فرض از فایل allowlist بدون scope و مخصوص کانال استفاده می‌کند.

با این‌ها به‌عنوان دادهٔ حساس رفتار کنید (زیرا دسترسی به دستیار شما را کنترل می‌کنند).

<Note>
ذخیره‌گاه allowlist مربوط به pairing برای دسترسی پیام مستقیم است. مجوزدهی گروه جداست.
تأیید یک کد pairing پیام مستقیم به‌طور خودکار به آن فرستنده اجازه نمی‌دهد فرمان‌های گروهی را اجرا کند یا ربات را در گروه‌ها کنترل کند. راه‌اندازی اولیهٔ مالک اول یک state پیکربندی جداگانه در `commands.ownerAllowFrom` است، و تحویل گفت‌وگوی گروهی همچنان از allowlistهای گروهی کانال پیروی می‌کند (برای مثال `groupAllowFrom`، `groups`، یا overrideهای برای هر گروه یا هر موضوع، بسته به کانال).
</Note>

## 2) Pairing دستگاه Node (iOS/Android/macOS/Nodeهای headless)

Nodeها به‌عنوان **دستگاه** با `role: node` به Gateway وصل می‌شوند. Gateway یک درخواست pairing دستگاه می‌سازد که باید تأیید شود.

### Pair از طریق Telegram (پیشنهادی برای iOS)

اگر از Plugin `device-pair` استفاده می‌کنید، می‌توانید pairing بار اول دستگاه را کاملاً از داخل Telegram انجام دهید:

1. در Telegram، به ربات خود پیام بدهید: `/pair`
2. ربات با دو پیام پاسخ می‌دهد: یک پیام دستورالعمل و یک پیام **کد راه‌اندازی** جداگانه (برای کپی/پیست در Telegram آسان است).
3. روی تلفن خود، برنامهٔ iOS OpenClaw را باز کنید ← Settings ← Gateway.
4. کد QR را اسکن کنید یا کد راه‌اندازی را جای‌گذاری کنید و وصل شوید.
5. دوباره در Telegram: `/pair pending` (شناسه‌های درخواست، نقش، و scopeها را بازبینی کنید)، سپس تأیید کنید.

کد راه‌اندازی یک payload JSON کدگذاری‌شده با base64 است که شامل این موارد است:

- `url`: نشانی WebSocket مربوط به Gateway (`ws://...` یا `wss://...`)
- `bootstrapToken`: یک توکن bootstrap کوتاه‌عمر و تک‌دستگاهی که برای handshake اولیهٔ pairing استفاده می‌شود

آن توکن bootstrap پروفایل bootstrap داخلی pairing را حمل می‌کند:

- توکن `node` واگذارشدهٔ اصلی روی `scopes: []` باقی می‌ماند
- هر توکن `operator` واگذارشده به allowlist مربوط به bootstrap محدود می‌ماند:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- بررسی‌های scope مربوط به bootstrap با پیشوند نقش انجام می‌شوند، نه یک مخزن scope تخت:
  ورودی‌های scope مربوط به operator فقط درخواست‌های operator را برآورده می‌کنند، و نقش‌های غیر-operator همچنان باید scopeها را زیر پیشوند نقش خودشان درخواست کنند
- چرخش/لغو توکن در آینده همچنان هم به قرارداد نقش تأییدشدهٔ دستگاه و هم به scopeهای operator مربوط به نشست فراخواننده محدود می‌ماند

تا وقتی کد راه‌اندازی معتبر است، با آن مثل گذرواژه رفتار کنید.

برای Tailscale، public، یا دیگر pairingهای موبایل از راه دور، از Tailscale Serve/Funnel یا یک URL دیگر `wss://` برای Gateway استفاده کنید. کدهای راه‌اندازی plaintext `ws://` فقط برای loopback، نشانی‌های LAN خصوصی، میزبان‌های Bonjour با `.local`، و میزبان شبیه‌ساز Android پذیرفته می‌شوند. نشانی‌های Tailnet CGNAT، نام‌های `.ts.net`، و میزبان‌های عمومی همچنان پیش از صدور QR/کد راه‌اندازی بسته می‌شوند.

### تأیید یک دستگاه Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

وقتی یک تأیید صریح رد می‌شود چون نشست paired-device تأییدکننده با scope فقط-pairing باز شده بود، CLI همان درخواست را با `operator.admin` دوباره امتحان می‌کند. این کار به یک دستگاه pair‌شدهٔ موجود با قابلیت admin اجازه می‌دهد pairing جدید Control UI/مرورگر را بدون ویرایش دستی `devices/paired.json` بازیابی کند. Gateway همچنان اتصال دوباره‌امتحان‌شده را اعتبارسنجی می‌کند؛ توکن‌هایی که نمی‌توانند با `operator.admin` احراز هویت کنند مسدود می‌مانند.

اگر همان دستگاه با جزئیات auth متفاوت دوباره تلاش کند (برای مثال نقش/scopeها/کلید عمومی متفاوت)، درخواست در انتظار قبلی supersede می‌شود و یک `requestId` جدید ساخته می‌شود.

<Note>
یک دستگاهی که قبلاً pair شده است بی‌صدا دسترسی گسترده‌تر نمی‌گیرد. اگر دوباره وصل شود و scopeهای بیشتر یا نقش گسترده‌تری بخواهد، OpenClaw تأیید موجود را همان‌طور که هست نگه می‌دارد و یک درخواست upgrade تازه در حالت انتظار می‌سازد. پیش از تأیید، از `openclaw devices list` برای مقایسهٔ دسترسی فعلی تأییدشده با دسترسی تازه درخواست‌شده استفاده کنید.
</Note>

### تأیید خودکار اختیاری Node با CIDR مورد اعتماد

Pairing دستگاه به‌صورت پیش‌فرض دستی می‌ماند. برای شبکه‌های Node کاملاً کنترل‌شده، می‌توانید با CIDRهای صریح یا IPهای دقیق، تأیید خودکار بار اول Node را فعال کنید:

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

این فقط برای درخواست‌های تازهٔ pairing با `role: node` و بدون scopeهای درخواست‌شده اعمال می‌شود. کلاینت‌های Operator، مرورگر، Control UI، و WebChat همچنان به تأیید دستی نیاز دارند. تغییرات نقش، scope، metadata، و کلید عمومی همچنان به تأیید دستی نیاز دارند.

### ذخیره‌سازی state مربوط به pairing Node

زیر `~/.openclaw/devices/` ذخیره می‌شود:

- `pending.json` (کوتاه‌عمر؛ درخواست‌های در انتظار منقضی می‌شوند)
- `paired.json` (دستگاه‌های pair‌شده + توکن‌ها)

### نکات

- API قدیمی `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) یک ذخیره‌گاه pairing جداگانه و متعلق به gateway است. Nodeهای WS همچنان به pairing دستگاه نیاز دارند.
- رکورد pairing منبع حقیقت بادوام برای نقش‌های تأییدشده است. توکن‌های فعال دستگاه به همان مجموعه نقش تأییدشده محدود می‌مانند؛ یک ورودی توکن stray بیرون از نقش‌های تأییدشده دسترسی جدید ایجاد نمی‌کند.

## مستندات مرتبط

- مدل امنیتی + prompt injection: [امنیت](/fa/gateway/security)
- به‌روزرسانی امن (اجرای doctor): [به‌روزرسانی](/fa/install/updating)
- پیکربندی‌های کانال:
  - Telegram: [Telegram](/fa/channels/telegram)
  - WhatsApp: [WhatsApp](/fa/channels/whatsapp)
  - Signal: [Signal](/fa/channels/signal)
  - iMessage: [iMessage](/fa/channels/imessage)
  - BlueBubbles (پل قدیمی iMessage): [BlueBubbles](/fa/channels/bluebubbles)
  - Discord: [Discord](/fa/channels/discord)
  - Slack: [Slack](/fa/channels/slack)
