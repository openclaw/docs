---
read_when:
    - کار روی قابلیت‌های کانال Tlon/Urbit
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon یک پیام‌رسان غیرمتمرکز است که روی Urbit ساخته شده است. OpenClaw به ship شما در Urbit متصل می‌شود و می‌تواند
به DMها و پیام‌های چت گروهی پاسخ دهد. پاسخ‌های گروهی به‌طور پیش‌فرض به mention با @ نیاز دارند و می‌توانند
از طریق allowlistها بیشتر محدود شوند.

وضعیت: Plugin همراه. DMها، mentionهای گروهی، پاسخ‌های thread، قالب‌بندی rich text، و
آپلود تصویر پشتیبانی می‌شوند. reactionها و pollها هنوز پشتیبانی نمی‌شوند.

## Plugin همراه

Tlon در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin همراه عرضه می‌شود، بنابراین buildهای
بسته‌بندی‌شده عادی به نصب جداگانه نیاز ندارند.

اگر از یک build قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Tlon را شامل نمی‌شود، یک
بسته npm فعلی نصب کنید:

نصب از طریق CLI (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

برای دنبال‌کردن tag انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید. فقط زمانی یک
نسخه دقیق را pin کنید که به نصب قابل‌بازتولید نیاز دارید.

checkout محلی (وقتی از یک git repo اجرا می‌کنید):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی

1. مطمئن شوید Plugin Tlon در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با دستورهای بالا به‌صورت دستی اضافه کنند.
2. URL و login code مربوط به ship خود را جمع‌آوری کنید.
3. `channels.tlon` را پیکربندی کنید.
4. Gateway را restart کنید.
5. به bot پیام DM بدهید یا در یک channel گروهی آن را mention کنید.

پیکربندی حداقلی (یک account):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## shipهای خصوصی/LAN

به‌طور پیش‌فرض، OpenClaw برای محافظت در برابر SSRF، hostnameها و rangeهای IP خصوصی/داخلی را مسدود می‌کند.
اگر ship شما روی یک شبکه خصوصی اجرا می‌شود (localhost، IP شبکه LAN، یا hostname داخلی)،
باید صراحتا opt in کنید:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

این مورد برای URLهایی مانند موارد زیر اعمال می‌شود:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ فقط در صورتی این را فعال کنید که به شبکه محلی خود اعتماد دارید. این تنظیم محافظت‌های SSRF را
برای requestها به URL مربوط به ship شما غیرفعال می‌کند.

## channelهای گروهی

کشف خودکار به‌طور پیش‌فرض فعال است. همچنین می‌توانید channelها را به‌صورت دستی pin کنید:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

غیرفعال‌کردن کشف خودکار:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## کنترل دسترسی

allowlist برای DM (خالی = هیچ DMای مجاز نیست، برای approval flow از `ownerShip` استفاده کنید):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

مجوزدهی گروهی (به‌طور پیش‌فرض محدود):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## سیستم مالک و تأیید

یک owner ship تنظیم کنید تا وقتی کاربران غیرمجاز تلاش می‌کنند تعامل کنند، requestهای تأیید را دریافت کند:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship **همه‌جا به‌طور خودکار مجاز است** — inviteهای DM به‌طور خودکار پذیرفته می‌شوند و
پیام‌های channel همیشه مجاز هستند. لازم نیست owner را به `dmAllowlist` یا
`defaultAuthorizedShips` اضافه کنید.

وقتی تنظیم شده باشد، owner برای موارد زیر notificationهای DM دریافت می‌کند:

- requestهای DM از shipهایی که در allowlist نیستند
- mentionها در channelهای بدون مجوز
- requestهای invite گروهی

## تنظیمات پذیرش خودکار

پذیرش خودکار inviteهای DM (برای shipهای موجود در dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

پذیرش خودکار inviteهای گروهی:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## مقصدهای تحویل (CLI/Cron)

این‌ها را با `openclaw message send` یا تحویل Cron استفاده کنید:

- DM: `~sampel-palnet` یا `dm/~sampel-palnet`
- گروه: `chat/~host-ship/channel` یا `group:~host-ship/channel`

## مهارت همراه

Plugin Tlon شامل یک مهارت همراه ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
است که دسترسی CLI به عملیات Tlon را فراهم می‌کند:

- **مخاطبان**: دریافت/به‌روزرسانی profileها، فهرست‌کردن مخاطبان
- **channelها**: فهرست‌کردن، ایجاد، ارسال پیام‌ها، واکشی history
- **گروه‌ها**: فهرست‌کردن، ایجاد، مدیریت اعضا
- **DMها**: ارسال پیام‌ها، واکنش نشان‌دادن به پیام‌ها
- **reactionها**: افزودن/حذف reactionهای emoji به postها و DMها
- **تنظیمات**: مدیریت مجوزهای Plugin از طریق slash commandها

این مهارت وقتی Plugin نصب باشد، به‌طور خودکار در دسترس است.

## قابلیت‌ها

| ویژگی         | وضعیت                                  |
| --------------- | --------------------------------------- |
| پیام‌های مستقیم | ✅ پشتیبانی می‌شود                            |
| گروه‌ها/channelها | ✅ پشتیبانی می‌شود (به‌طور پیش‌فرض mention-gated) |
| threadها         | ✅ پشتیبانی می‌شود (پاسخ‌های خودکار در thread)   |
| rich text       | ✅ Markdown به قالب Tlon تبدیل می‌شود    |
| تصاویر          | ✅ در storage مربوط به Tlon آپلود می‌شود             |
| reactionها       | ✅ از طریق [مهارت همراه](#bundled-skill)  |
| pollها           | ❌ هنوز پشتیبانی نمی‌شود                    |
| commandهای native | ✅ پشتیبانی می‌شود (به‌طور پیش‌فرض فقط owner)    |

## عیب‌یابی

ابتدا این ladder را اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

خرابی‌های رایج:

- **DMها نادیده گرفته می‌شوند**: فرستنده در `dmAllowlist` نیست و هیچ `ownerShip`ای برای approval flow پیکربندی نشده است.
- **پیام‌های گروهی نادیده گرفته می‌شوند**: channel کشف نشده یا فرستنده مجاز نیست.
- **خطاهای اتصال**: بررسی کنید URL مربوط به ship قابل‌دسترسی باشد؛ برای shipهای محلی `allowPrivateNetwork` را فعال کنید.
- **خطاهای auth**: تأیید کنید login code فعلی است (codeها rotate می‌شوند).

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های provider:

- `channels.tlon.enabled`: فعال/غیرفعال‌کردن startup channel.
- `channels.tlon.ship`: نام ship در Urbit برای bot (مثلا `~sampel-palnet`).
- `channels.tlon.url`: URL مربوط به ship (مثلا `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: login code مربوط به ship.
- `channels.tlon.allowPrivateNetwork`: اجازه‌دادن به URLهای localhost/LAN (SSRF bypass).
- `channels.tlon.ownerShip`: owner ship برای سیستم تأیید (همیشه مجاز).
- `channels.tlon.dmAllowlist`: shipهای مجاز به DM (خالی = هیچ‌کدام).
- `channels.tlon.autoAcceptDmInvites`: پذیرش خودکار DMها از shipهای allowlisted.
- `channels.tlon.autoAcceptGroupInvites`: پذیرش خودکار همه inviteهای گروهی.
- `channels.tlon.autoDiscoverChannels`: کشف خودکار channelهای گروهی (پیش‌فرض: true).
- `channels.tlon.groupChannels`: nestهای channel که به‌صورت دستی pin شده‌اند.
- `channels.tlon.defaultAuthorizedShips`: shipهای مجاز برای همه channelها.
- `channels.tlon.authorization.channelRules`: ruleهای auth به‌ازای هر channel.
- `channels.tlon.showModelSignature`: افزودن نام model به پیام‌ها.

## نکات

- پاسخ‌های گروهی برای پاسخ‌دادن به یک mention نیاز دارند (مثلا `~your-bot-ship`).
- پاسخ‌های thread: اگر پیام ورودی در یک thread باشد، OpenClaw داخل همان thread پاسخ می‌دهد.
- rich text: قالب‌بندی Markdown (bold، italic، code، headerها، listها) به قالب native مربوط به Tlon تبدیل می‌شود.
- تصاویر: URLها در storage مربوط به Tlon آپلود می‌شوند و به‌صورت image blockها embed می‌شوند.

## مرتبط

- [نمای کلی channelها](/fa/channels) — همه channelهای پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و pairing flow
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و mention gating
- [مسیریابی channel](/fa/channels/channel-routing) — مسیریابی session برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و hardening
