---
read_when:
    - ساخت یا مهاجرت Plugin کانال پیام‌رسانی
    - تغییر فهرست‌های مجاز پیام خصوصی یا گروه، دروازه‌های مسیریابی، احراز هویت فرمان، احراز هویت رویداد یا فعال‌سازی با اشاره
    - بازبینی حذف اطلاعات حساس در ورودی کانال یا مرزهای سازگاری SDK
sidebarTitle: Channel Ingress
summary: API آزمایشی ورود کانال برای مجوزدهی پیام‌های ورودی
title: API ورودی کانال
x-i18n:
    generated_at: "2026-07-12T10:33:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

ورودی کانال مرز آزمایشی کنترل دسترسی برای رویدادهای ورودی
کانال است. Pluginها مالک واقعیت‌های پلتفرم و اثرات جانبی‌اند؛ هسته مالک
سیاست عمومی است: فهرست‌های مجاز پیام مستقیم/گروه، ورودی‌های پیام مستقیم در مخزن جفت‌سازی، گیت‌های مسیر،
گیت‌های فرمان، احراز هویت رویداد، فعال‌سازی با اشاره، عیب‌یابی‌های پوشیده‌شده و
پذیرش.

برای مسیرهای دریافت جدید از `openclaw/plugin-sdk/channel-ingress-runtime` استفاده کنید. زیرمسیر
قدیمی‌تر `openclaw/plugin-sdk/channel-ingress` همچنان به‌عنوان یک نمای سازگاری
منسوخ برای Pluginهای شخص ثالث صادر می‌شود.

## تفکیک‌گر زمان اجرا

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

فهرست‌های مجاز مؤثر، مالکان فرمان یا گروه‌های فرمان را از پیش محاسبه نکنید.
تفکیک‌گر آن‌ها را از فهرست‌های مجاز خام، فراخوان‌های بازگشتی مخزن، توصیف‌گرهای
مسیر، گروه‌های دسترسی، سیاست و نوع مکالمه استخراج می‌کند.

## نتیجه

Pluginهای همراه باید نگاشت‌های مدرن را مستقیماً مصرف کنند:

| فیلد               | معنا                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `ingress`          | تصمیم مرتب‌شده گیت‌ها و پذیرش                                         |
| `senderAccess`     | فقط مجوز فرستنده/مکالمه                                               |
| `routeAccess`      | نگاشت مسیر و فرستنده مسیر                                             |
| `commandAccess`    | مجوز فرمان؛ وقتی هیچ گیت فرمانی اجرا نشده باشد `requested: false` است |
| `activationAccess` | نتیجه اشاره/فعال‌سازی                                                 |

مجوز رویداد در `ingress.graph` مرتب‌شده و
`ingress.reasonCode` تعیین‌کننده در دسترس باقی می‌ماند؛ هیچ نگاشت جداگانه‌ای برای رویداد تولید نمی‌شود.

توابع کمکی منسوخ SDK برای شخص ثالث ممکن است شکل‌های قدیمی‌تر را درون خود بازسازی کنند. مسیرهای
دریافت همراه جدید نباید نتایج مدرن را دوباره به
DTOهای محلی تبدیل کنند.

## گروه‌های دسترسی

ورودی‌های `accessGroup:<name>` همچنان پوشیده می‌مانند. هسته گروه‌های ایستای
`message.senders` را خودش تفکیک می‌کند و `resolveAccessGroupMembership` را فقط
برای گروه‌های پویایی فراخوانی می‌کند که به جست‌وجوی پلتفرم نیاز دارند. گروه‌های موجودنبودن، پشتیبانی‌نشده و
ناموفق به‌صورت بسته رد می‌شوند.

## حالت‌های رویداد

| `authMode`       | معنا                                                        |
| ---------------- | ----------------------------------------------------------- |
| `inbound`        | گیت‌های عادی فرستنده ورودی                                  |
| `command`        | گیت‌های فرمان برای فراخوان‌های بازگشتی یا دکمه‌های محدودشده |
| `origin-subject` | عامل باید با موضوع پیام اصلی مطابقت داشته باشد              |
| `route-only`     | فقط گیت‌های مسیر برای رویدادهای معتمد محدود به مسیر         |
| `none`           | رویدادهای داخلی متعلق به Plugin از مجوز مشترک عبور می‌کنند  |

برای واکنش‌ها، دکمه‌ها، فراخوان‌های بازگشتی و فرمان‌های بومی از `mayPair: false` استفاده کنید.

## مسیرها و فعال‌سازی

برای سیاست اتاق، موضوع، انجمن، رشته یا مسیر تودرتو از توصیف‌گرهای مسیر استفاده کنید:

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

وقتی یک Plugin چند توصیف‌گر مسیر اختیاری دارد، از `channelIngressRoutes(...)` استفاده کنید؛
این تابع شاخه‌های غیرفعال را فیلتر می‌کند و در عین حال واقعیت‌های مسیر را عمومی نگه می‌دارد
و آن‌ها را براساس `precedence` هر توصیف‌گر مرتب می‌کند.

گیت‌گذاری اشاره یک گیت فعال‌سازی است. نبود اشاره
`admission: "skip"` را برمی‌گرداند تا هسته نوبت یک نوبت صرفاً مشاهده‌ای را پردازش نکند.
بیشتر کانال‌ها باید فعال‌سازی را پس از گیت‌های فرستنده و فرمان قرار دهند. سطوح
گفت‌وگوی عمومی که باید پیش از سروصدای فهرست مجاز فرستنده، ترافیک بدون اشاره را ساکت کنند،
وقتی عبور فرمان متنی غیرفعال است می‌توانند `activation.order: "before-sender"` را انتخاب کنند.
کانال‌های دارای فعال‌سازی ضمنی، مانند پاسخ‌ها در رشته‌های
بات، می‌توانند `activation.allowedImplicitMentionKinds` را ارسال کنند؛ سپس
`activationAccess.shouldBypassMention` نگاشت‌شده گزارش می‌دهد که چه زمانی فرمان یا فعال‌سازی
ضمنی، اشاره صریح را دور زده است.

## پوشاندن

مقادیر خام فرستنده و ورودی‌های خام فهرست مجاز فقط ورودی تفکیک‌گر هستند. آن‌ها
نباید در حالت تفکیک‌شده، تصمیم‌ها، عیب‌یابی‌ها، عکس‌های لحظه‌ای یا
واقعیت‌های سازگاری ظاهر شوند. از شناسه‌های مات موضوع، شناسه‌های ورودی، شناسه‌های مسیر و
شناسه‌های عیب‌یابی استفاده کنید.

## راستی‌آزمایی

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
