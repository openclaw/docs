---
read_when:
    - ساخت یا مهاجرت یک Plugin کانال پیام‌رسانی
    - تغییر فهرست‌های مجاز پیام مستقیم یا گروه، دروازه‌های مسیریابی، احراز هویت فرمان، احراز هویت رویداد یا فعال‌سازی با اشاره‌کردن
    - بازبینی مرزهای حذف اطلاعات حساس در ورودی کانال یا سازگاری SDK
sidebarTitle: Channel Ingress
summary: API آزمایشی ورودی کانال برای مجوزدهی پیام‌های ورودی
title: API ورودی کانال
x-i18n:
    generated_at: "2026-07-16T17:05:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

ورود کانال، مرز آزمایشی کنترل دسترسی برای رویدادهای ورودی
کانال است. Pluginها مالک واقعیت‌های پلتفرم و اثرات جانبی هستند؛ هسته مالک
سیاست عمومی است: فهرست‌های مجاز پیام خصوصی/گروه، ورودی‌های پیام خصوصی در مخزن جفت‌سازی، گیت‌های مسیر،
گیت‌های فرمان، احراز هویت رویداد، فعال‌سازی با اشاره، عیب‌یابی ویرایش‌شده، و
پذیرش.

برای مسیرهای دریافت از `openclaw/plugin-sdk/channel-ingress-runtime` استفاده کنید.

## تفکیک‌کننده زمان اجرا

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
تفکیک‌کننده آن‌ها را از فهرست‌های مجاز خام، فراخوان‌های برگشتی مخزن، توصیف‌گرهای
مسیر، گروه‌های دسترسی، سیاست و نوع مکالمه استخراج می‌کند.

## نتیجه

Pluginهای همراه باید مستقیماً تصویرهای مدرن را مصرف کنند:

| فیلد              | معنا                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | تصمیم مرتب‌شده گیت و پذیرش                                |
| `senderAccess`     | فقط مجوز فرستنده/مکالمه                             |
| `routeAccess`      | تصویر مسیر و فرستنده مسیر                                  |
| `commandAccess`    | مجوز فرمان؛ `requested: false` هنگامی که هیچ گیت فرمانی اجرا نشد |
| `activationAccess` | نتیجه اشاره/فعال‌سازی                                          |

مجوز رویداد در `ingress.graph` مرتب‌شده و
`ingress.reasonCode` تعیین‌کننده همچنان در دسترس است؛ تصویر جداگانه‌ای برای رویداد تولید نمی‌شود.

کمک‌تابع‌های منسوخ‌شده SDK شخص ثالث ممکن است شکل‌های قدیمی‌تر را به‌صورت داخلی بازسازی کنند. مسیرهای
دریافت همراه جدید نباید نتایج مدرن را دوباره به
DTOهای محلی تبدیل کنند.

## گروه‌های دسترسی

ورودی‌های `accessGroup:<name>` ویرایش‌شده باقی می‌مانند. هسته گروه‌های ایستای
`message.senders` را خودش تفکیک می‌کند و `resolveAccessGroupMembership` را فقط
برای گروه‌های پویایی فراخوانی می‌کند که به جست‌وجوی پلتفرم نیاز دارند. گروه‌های مفقود، پشتیبانی‌نشده و
ناموفق به‌صورت بسته رد می‌شوند.

## حالت‌های رویداد

| `authMode`       | معنا                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | گیت‌های عادی فرستنده ورودی                      |
| `command`        | گیت‌های فرمان برای فراخوان‌های برگشتی یا دکمه‌های محدودشده    |
| `origin-subject` | کنشگر باید با موضوع پیام اصلی مطابقت داشته باشد    |
| `route-only`     | فقط گیت‌های مسیر برای رویدادهای معتمد محدود به مسیر |
| `none`           | رویدادهای داخلی تحت مالکیت Plugin، احراز هویت مشترک را دور می‌زنند  |

برای واکنش‌ها، دکمه‌ها، فراخوان‌های برگشتی و فرمان‌های بومی از `mayPair: false` استفاده کنید.

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

هنگامی که یک Plugin چندین توصیف‌گر اختیاری مسیر دارد، از `channelIngressRoutes(...)`
استفاده کنید؛ این مورد شاخه‌های غیرفعال را فیلتر می‌کند و درعین‌حال واقعیت‌های مسیر را عمومی
و براساس `precedence` هر توصیف‌گر مرتب نگه می‌دارد.

گیت اشاره، یک گیت فعال‌سازی است. ناموفق‌بودن اشاره
`admission: "skip"` را برمی‌گرداند تا هسته نوبت، نوبتی صرفاً نظارتی را پردازش نکند.
بیشتر کانال‌ها باید فعال‌سازی را پس از گیت‌های فرستنده و فرمان قرار دهند. سطوح
گفت‌وگوی عمومی که باید ترافیک بدون اشاره را پیش از نویز فهرست مجاز فرستنده
ساکت کنند، هنگامی که دورزدن فرمان متنی غیرفعال است می‌توانند `activation.order: "before-sender"` را برگزینند. کانال‌هایی با فعال‌سازی ضمنی، مانند پاسخ‌ها در
رشته‌های ربات، می‌توانند `activation.allowedImplicitMentionKinds` را ارسال کنند؛ سپس تصویر
`activationAccess.shouldBypassMention` گزارش می‌دهد که چه زمانی فرمان یا فعال‌سازی
ضمنی، اشاره صریح را دور زده است.

## ویرایش اطلاعات حساس

مقادیر خام فرستنده و ورودی‌های خام فهرست مجاز فقط ورودی تفکیک‌کننده هستند. آن‌ها
نباید در وضعیت تفکیک‌شده، تصمیم‌ها، عیب‌یابی‌ها، عکس‌های فوری یا
واقعیت‌های سازگاری ظاهر شوند. از شناسه‌های مات موضوع، شناسه‌های ورودی، شناسه‌های مسیر و
شناسه‌های عیب‌یابی استفاده کنید.

## راستی‌آزمایی

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
