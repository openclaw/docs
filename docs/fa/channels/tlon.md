---
read_when:
    - کار روی قابلیت‌های کانال Tlon/Urbit
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Tlon یک پیام‌رسان غیرمتمرکز است که بر پایه Urbit ساخته شده است. OpenClaw به کشتی Urbit شما وصل می‌شود و می‌تواند
به DMها و پیام‌های گفت‌وگوی گروهی پاسخ دهد. پاسخ‌های گروهی به‌طور پیش‌فرض به mention با @ نیاز دارند و می‌توانند
از طریق allowlistها بیشتر محدود شوند.

وضعیت: Plugin همراه. DMها، mentionهای گروهی، پاسخ‌های thread، قالب‌بندی متن غنی، و
بارگذاری تصویر پشتیبانی می‌شوند. واکنش‌ها و نظرسنجی‌ها هنوز پشتیبانی نمی‌شوند.

## Plugin همراه

Tlon در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin همراه عرضه می‌شود، بنابراین buildهای
بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.

اگر روی یک build قدیمی‌تر هستید یا نصب سفارشی‌ای دارید که Tlon را حذف کرده است، یک
بسته npm فعلی نصب کنید:

نصب از طریق CLI (رجیستری npm):

```bash
openclaw plugins install @openclaw/tlon
```

برای دنبال کردن تگ انتشار رسمی فعلی از بسته بدون نسخه استفاده کنید. فقط زمانی یک
نسخه دقیق را pin کنید که به نصب قابل بازتولید نیاز دارید.

checkout محلی (هنگام اجرا از یک مخزن git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی

1. مطمئن شوید Plugin ‏Tlon در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با دستورهای بالا به‌صورت دستی اضافه کنند.
2. URL کشتی و کد ورود خود را جمع‌آوری کنید.
3. `channels.tlon` را پیکربندی کنید.
4. Gateway را راه‌اندازی مجدد کنید.
5. به بات DM بدهید یا آن را در یک کانال گروهی mention کنید.

پیکربندی حداقلی (یک حساب):

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

## کشتی‌های خصوصی/LAN

OpenClaw به‌طور پیش‌فرض hostnameها و محدوده‌های IP خصوصی/داخلی را برای محافظت در برابر SSRF مسدود می‌کند.
اگر کشتی شما روی یک شبکه خصوصی اجرا می‌شود (localhost، IP شبکه LAN، یا hostname داخلی)،
باید صریحا opt in کنید:

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

این برای URLهایی مانند موارد زیر اعمال می‌شود:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ این گزینه را فقط اگر به شبکه محلی خود اعتماد دارید فعال کنید. این تنظیم محافظت‌های SSRF را
برای درخواست‌ها به URL کشتی شما غیرفعال می‌کند.

## کانال‌های گروهی

کشف خودکار به‌طور پیش‌فرض فعال است. همچنین می‌توانید کانال‌ها را به‌صورت دستی pin کنید:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

غیرفعال کردن کشف خودکار:

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

allowlist ‏DM (خالی = هیچ DM مجاز نیست، برای جریان تأیید از `ownerShip` استفاده کنید):

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

## مالک و سیستم تأیید

یک کشتی مالک تنظیم کنید تا وقتی کاربران غیرمجاز تلاش می‌کنند تعامل داشته باشند، درخواست‌های تأیید را دریافت کند:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

کشتی مالک **به‌طور خودکار همه‌جا مجاز است** — دعوت‌های DM به‌صورت خودکار پذیرفته می‌شوند و
پیام‌های کانال همیشه مجاز هستند. لازم نیست مالک را به `dmAllowlist` یا
`defaultAuthorizedShips` اضافه کنید.

وقتی تنظیم شده باشد، مالک برای موارد زیر اعلان‌های DM دریافت می‌کند:

- درخواست‌های DM از کشتی‌هایی که در allowlist نیستند
- mentionها در کانال‌های بدون مجوزدهی
- درخواست‌های دعوت گروهی

## تنظیمات پذیرش خودکار

پذیرش خودکار دعوت‌های DM (برای کشتی‌های موجود در dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

پذیرش خودکار دعوت‌های گروهی از کشتی‌های مورد اعتماد:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

وقتی `groupInviteAllowlist` خالی باشد، `autoAcceptGroupInvites` به‌صورت بسته شکست می‌خورد. allowlist را
روی کشتی‌هایی تنظیم کنید که دعوت‌های گروهی آن‌ها باید به‌طور خودکار پذیرفته شود.

## مقصدهای تحویل (CLI/cron)

از این‌ها با `openclaw message send` یا تحویل cron استفاده کنید:

- DM: `~sampel-palnet` یا `dm/~sampel-palnet`
- گروه: `chat/~host-ship/channel` یا `group:~host-ship/channel`

## Skill همراه

Plugin ‏Tlon شامل یک Skill همراه ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
است که دسترسی CLI به عملیات Tlon را فراهم می‌کند:

- **مخاطبین**: دریافت/به‌روزرسانی پروفایل‌ها، فهرست کردن مخاطبین
- **کانال‌ها**: فهرست کردن، ایجاد، ارسال پیام‌ها، واکشی تاریخچه
- **گروه‌ها**: فهرست کردن، ایجاد، مدیریت اعضا
- **DMها**: ارسال پیام‌ها، واکنش به پیام‌ها
- **واکنش‌ها**: افزودن/حذف واکنش‌های ایموجی به پست‌ها و DMها
- **تنظیمات**: مدیریت مجوزهای Plugin از طریق دستورهای slash

وقتی Plugin نصب شده باشد، Skill به‌طور خودکار در دسترس است.

## قابلیت‌ها

| قابلیت         | وضعیت                                  |
| --------------- | --------------------------------------- |
| پیام‌های مستقیم | ✅ پشتیبانی می‌شود                            |
| گروه‌ها/کانال‌ها | ✅ پشتیبانی می‌شود (به‌طور پیش‌فرض با mention کنترل می‌شود) |
| Threadها         | ✅ پشتیبانی می‌شود (پاسخ‌های خودکار در thread)   |
| متن غنی       | ✅ Markdown به قالب Tlon تبدیل می‌شود    |
| تصاویر          | ✅ در فضای ذخیره‌سازی Tlon بارگذاری می‌شود             |
| واکنش‌ها       | ✅ از طریق [Skill همراه](#bundled-skill)  |
| نظرسنجی‌ها           | ❌ هنوز پشتیبانی نمی‌شود                    |
| دستورهای بومی | ✅ پشتیبانی می‌شود (به‌طور پیش‌فرض فقط مالک)    |

## عیب‌یابی

ابتدا این نردبان را اجرا کنید:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

خرابی‌های رایج:

- **DMها نادیده گرفته می‌شوند**: فرستنده در `dmAllowlist` نیست و هیچ `ownerShip` برای جریان تأیید پیکربندی نشده است.
- **پیام‌های گروهی نادیده گرفته می‌شوند**: کانال کشف نشده یا فرستنده مجاز نیست.
- **خطاهای اتصال**: بررسی کنید URL کشتی قابل دسترس باشد؛ برای کشتی‌های محلی `allowPrivateNetwork` را فعال کنید.
- **خطاهای احراز هویت**: تأیید کنید کد ورود فعلی است (کدها می‌چرخند).

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های ارائه‌دهنده:

- `channels.tlon.enabled`: فعال/غیرفعال کردن راه‌اندازی کانال.
- `channels.tlon.ship`: نام کشتی Urbit بات (مثلا `~sampel-palnet`).
- `channels.tlon.url`: URL کشتی (مثلا `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: کد ورود کشتی.
- `channels.tlon.allowPrivateNetwork`: اجازه دادن به URLهای localhost/LAN (دور زدن SSRF).
- `channels.tlon.ownerShip`: کشتی مالک برای سیستم تأیید (همیشه مجاز).
- `channels.tlon.dmAllowlist`: کشتی‌هایی که مجاز به DM هستند (خالی = هیچ‌کدام).
- `channels.tlon.autoAcceptDmInvites`: پذیرش خودکار DMها از کشتی‌های موجود در allowlist.
- `channels.tlon.autoAcceptGroupInvites`: پذیرش خودکار دعوت‌های گروهی از کشتی‌های موجود در allowlist.
- `channels.tlon.groupInviteAllowlist`: کشتی‌هایی که دعوت‌های گروهی آن‌ها می‌تواند به‌طور خودکار پذیرفته شود.
- `channels.tlon.autoDiscoverChannels`: کشف خودکار کانال‌های گروهی (پیش‌فرض: true).
- `channels.tlon.groupChannels`: nestهای کانال pin شده به‌صورت دستی.
- `channels.tlon.defaultAuthorizedShips`: کشتی‌های مجاز برای همه کانال‌ها.
- `channels.tlon.authorization.channelRules`: قواعد احراز مجوز برای هر کانال.
- `channels.tlon.showModelSignature`: افزودن نام مدل به پیام‌ها.

## یادداشت‌ها

- پاسخ‌های گروهی برای پاسخ دادن به یک mention (مثلا `~your-bot-ship`) نیاز دارند.
- پاسخ‌های thread: اگر پیام ورودی در یک thread باشد، OpenClaw در همان thread پاسخ می‌دهد.
- متن غنی: قالب‌بندی Markdown (bold، italic، code، headers، lists) به قالب بومی Tlon تبدیل می‌شود.
- تصاویر: URLها در فضای ذخیره‌سازی Tlon بارگذاری می‌شوند و به‌صورت بلوک‌های تصویر جاسازی می‌شوند.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و کنترل با mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
