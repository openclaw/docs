---
read_when:
    - ساخت یا مهاجرت یک Plugin کانال پیام‌رسانی
    - تغییر فهرست‌های مجاز پیام مستقیم یا گروه، گیت‌های مسیر، احراز هویت فرمان، احراز هویت رویداد، یا فعال‌سازی با منشن
    - بازبینی مرزهای حذف اطلاعات حساس در ورودی کانال یا سازگاری SDK
sidebarTitle: Channel Ingress
summary: API آزمایشی ورودی کانال برای مجوزدهی پیام‌های ورودی
title: رابط برنامه‌نویسی کاربردی ورودی کانال
x-i18n:
    generated_at: "2026-05-10T19:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# API ورودی کانال

ورودی کانال مرز آزمایشی کنترل دسترسی برای رویدادهای ورودی کانال است. برای مسیرهای دریافت از `openclaw/plugin-sdk/channel-ingress-runtime` استفاده کنید. زیربخش قدیمی‌تر `openclaw/plugin-sdk/channel-ingress` همچنان به‌عنوان نمای سازگاری منسوخ‌شده برای Pluginهای شخص ثالث صادر می‌ماند.

Pluginها مالک واقعیت‌های پلتفرم و اثرات جانبی هستند. هسته مالک سیاست عمومی است: فهرست‌های مجاز DM/گروه، ورودی‌های DM در pairing-store، دروازه‌های مسیر، دروازه‌های فرمان، احراز رویداد، فعال‌سازی با منشن، عیب‌یابی‌های پوشیده‌شده، و پذیرش.

## حل‌کننده زمان اجرا

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

فهرست‌های مجاز مؤثر، مالکان فرمان، یا گروه‌های فرمان را از پیش محاسبه نکنید. حل‌کننده آن‌ها را از فهرست‌های مجاز خام، callbackهای ذخیره‌گاه، توصیف‌گرهای مسیر، گروه‌های دسترسی، سیاست، و نوع مکالمه استخراج می‌کند.

## نتیجه

Pluginهای همراه باید projectionهای مدرن را مستقیماً مصرف کنند:

- `ingress`: تصمیم مرتب‌شده دروازه و پذیرش
- `senderAccess`: فقط مجوز فرستنده/مکالمه
- `routeAccess`: projection مسیر و فرستنده مسیر
- `commandAccess`: مجوز فرمان؛ وقتی هیچ دروازه فرمانی اجرا نشده باشد false است
- `activationAccess`: نتیجه منشن/فعال‌سازی

مجوز رویداد همچنان روی `ingress.graph` مرتب‌شده و `ingress.reasonCode` تعیین‌کننده در دسترس می‌ماند؛ هیچ projection جداگانه‌ای برای رویداد منتشر نمی‌شود.

کمک‌کننده‌های منسوخ SDK شخص ثالث می‌توانند شکل‌های قدیمی‌تر را به‌صورت داخلی بازسازی کنند. مسیرهای دریافت همراه جدید نباید نتایج مدرن را دوباره به DTOهای محلی تبدیل کنند.

## گروه‌های دسترسی

ورودی‌های `accessGroup:<name>` پوشیده‌شده باقی می‌مانند. هسته خودش گروه‌های ایستای `message.senders` را حل می‌کند و `resolveAccessGroupMembership` را فقط برای گروه‌های پویایی فراخوانی می‌کند که به جست‌وجوی پلتفرم نیاز دارند. گروه‌های ناموجود، پشتیبانی‌نشده، و ناموفق به‌صورت بسته شکست می‌خورند.

## حالت‌های رویداد

| `authMode`       | معنی                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | دروازه‌های عادی فرستنده ورودی                    |
| `command`        | دروازه‌های فرمان برای callbackها یا دکمه‌های scoped |
| `origin-subject` | کنشگر باید با subject پیام اصلی مطابقت داشته باشد |
| `route-only`     | فقط دروازه‌های مسیر برای رویدادهای مورد اعتماد scoped به مسیر |
| `none`           | رویدادهای داخلی متعلق به Plugin از احراز مشترک عبور می‌کنند |

برای واکنش‌ها، دکمه‌ها، callbackها، و فرمان‌های بومی از `mayPair: false` استفاده کنید.

## مسیرها و فعال‌سازی

برای سیاست اتاق، موضوع، guild، thread، یا مسیر تودرتو از توصیف‌گرهای مسیر استفاده کنید:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

وقتی یک Plugin چند توصیف‌گر مسیر اختیاری دارد از `channelIngressRoutes(...)` استفاده کنید؛ شاخه‌های غیرفعال را فیلتر می‌کند و در عین حال واقعیت‌های مسیر را عمومی و مطابق `precedence` هر توصیف‌گر مرتب نگه می‌دارد.

دروازه‌گذاری منشن یک دروازه فعال‌سازی است. نبود منشن `admission: "skip"` برمی‌گرداند تا هسته turn یک turn فقط مشاهده‌ای را پردازش نکند. بیشتر کانال‌ها باید فعال‌سازی را پس از دروازه‌های فرستنده و فرمان باقی بگذارند. سطوح گفت‌وگوی عمومی که باید ترافیک بدون منشن را پیش از نویز فهرست مجاز فرستنده ساکت کنند، وقتی عبور فرمان متنی غیرفعال است، می‌توانند `activation.order: "before-sender"` را انتخاب کنند. کانال‌هایی با فعال‌سازی ضمنی، مانند پاسخ‌ها در threadهای بات، می‌توانند `activation.allowedImplicitMentionKinds` را ارسال کنند؛ سپس `activationAccess.shouldBypassMention` projected گزارش می‌دهد چه زمانی فرمان یا فعال‌سازی ضمنی از منشن صریح عبور کرده است.

## پوشاندن

مقادیر خام فرستنده و ورودی‌های خام فهرست مجاز فقط ورودی حل‌کننده هستند. آن‌ها نباید در وضعیت حل‌شده، تصمیم‌ها، عیب‌یابی‌ها، snapshotها، یا واقعیت‌های سازگاری ظاهر شوند. از شناسه‌های opaque برای subject، شناسه‌های ورودی، شناسه‌های مسیر، و شناسه‌های عیب‌یابی استفاده کنید.

## راستی‌آزمایی

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
