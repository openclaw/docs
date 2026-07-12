---
read_when:
    - بازآرایی رابط کاربری پیام‌های کانال، محموله‌های تعاملی یا رندرکننده‌های بومی کانال
    - تغییر قابلیت‌های ابزار پیام، راهنمایی‌های تحویل، یا نشانگرهای میان‌بافتی
    - اشکال‌زدایی از گسترش واردسازی Discord Carbon یا بارگذاری تنبل زمان اجرای Plugin کانال
summary: ارائهٔ معنایی پیام را از رندرکننده‌های رابط کاربری بومی کانال جدا کنید.
title: برنامه بازآرایی نمایش کانال
x-i18n:
    generated_at: "2026-07-12T10:17:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## وضعیت

برای عامل مشترک، CLI، قابلیت Plugin و سطوح ارسال خروجی پیاده‌سازی شده است:

- `ReplyPayload.presentation` رابط کاربری معنایی پیام را حمل می‌کند.
- `ReplyPayload.delivery.pin` درخواست‌های سنجاق‌کردن پیام ارسال‌شده را حمل می‌کند.
- کنش‌های مشترک پیام، به‌جای `components`، `blocks`، `buttons` یا `card` بومی ارائه‌دهنده، `presentation`، `delivery` و `pin` را در معرض قرار می‌دهند.
- هسته، ارائه را از طریق قابلیت‌های خروجی اعلام‌شده توسط Plugin رندر می‌کند یا به‌طور خودکار به قالب ساده‌تر تنزل می‌دهد.
- رندرکننده‌های Discord، Slack، Telegram، Mattermost، MS Teams و Feishu قرارداد عمومی را مصرف می‌کنند.
- کد صفحه کنترل کانال Discord دیگر کانتینرهای رابط کاربری مبتنی بر Carbon را وارد نمی‌کند.

مستندات مرجع اکنون در [ارائه پیام](/fa/plugins/message-presentation) قرار دارند.
این طرح را به‌عنوان زمینه تاریخی پیاده‌سازی نگه دارید؛ برای تغییرات قرارداد، رندرکننده یا رفتار جایگزین، راهنمای مرجع را به‌روزرسانی کنید.

## مشکل

رابط کاربری کانال در حال حاضر میان چند سطح ناسازگار تقسیم شده است:

- هسته از طریق `buildCrossContextComponents` مالک یک قلاب رندر میان‌زمینه‌ای با ساختار Discord است.
- فایل `channel.ts` در Discord می‌تواند رابط کاربری بومی Carbon را از طریق `DiscordUiContainer` وارد کند؛ این کار وابستگی‌های زمان اجرای رابط کاربری را وارد صفحه کنترل Plugin کانال می‌کند.
- عامل و CLI راه‌های گریز برای بارهای بومی مانند `components` در Discord،‏ `blocks` در Slack،‏ `buttons` در Telegram یا Mattermost و `card` در Teams یا Feishu در معرض قرار می‌دهند.
- `ReplyPayload.channelData` هم راهنمایی‌های انتقال و هم پوشش‌های رابط کاربری بومی را حمل می‌کند.
- مدل عمومی `interactive` وجود دارد، اما از چیدمان‌های غنی‌تری که هم‌اکنون در Discord، Slack، Teams، Feishu، LINE، Telegram و Mattermost استفاده می‌شوند، محدودتر است.

این وضعیت هسته را از ساختارهای رابط کاربری بومی آگاه می‌کند، بارگذاری تنبل زمان اجرای Plugin را تضعیف می‌کند و راه‌های مختص ارائه‌دهنده بیش از حدی برای بیان یک منظور پیام یکسان در اختیار عامل‌ها می‌گذارد.

## اهداف

- هسته بر اساس قابلیت‌های اعلام‌شده، بهترین ارائه معنایی را برای پیام انتخاب می‌کند.
- افزونه‌ها قابلیت‌های خود را اعلام می‌کنند و ارائه معنایی را به بارهای بومی انتقال رندر می‌کنند.
- رابط کاربری کنترل وب از رابط کاربری بومی گفت‌وگو جدا باقی می‌ماند.
- بارهای بومی کانال از طریق سطح مشترک پیام عامل یا CLI در معرض قرار نمی‌گیرند.
- ویژگی‌های پشتیبانی‌نشده ارائه به‌طور خودکار به بهترین نمایش متنی تنزل می‌یابند.
- رفتار تحویل، مانند سنجاق‌کردن پیام ارسال‌شده، فراداده عمومی تحویل است، نه ارائه.

## موارد خارج از هدف

- هیچ لایه سازگاری با نسخه‌های قبلی برای `buildCrossContextComponents` وجود ندارد.
- هیچ راه گریز بومی عمومی برای `components`،‏ `blocks`،‏ `buttons` یا `card` وجود ندارد.
- هسته هیچ کتابخانه رابط کاربری بومی کانال را وارد نمی‌کند.
- برای کانال‌های همراه، هیچ سطح SDK مختص ارائه‌دهنده‌ای وجود ندارد.

## مدل هدف

یک فیلد `presentation` متعلق به هسته به `ReplyPayload` اضافه کنید.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

در جریان مهاجرت، `interactive` به زیرمجموعه‌ای از `presentation` تبدیل می‌شود:

- بلوک متنی `interactive` به `presentation.blocks[].type = "text"` نگاشت می‌شود.
- بلوک دکمه‌های `interactive` به `presentation.blocks[].type = "buttons"` نگاشت می‌شود.
- بلوک انتخاب `interactive` به `presentation.blocks[].type = "select"` نگاشت می‌شود.

طرح‌واره‌های خارجی عامل و CLI اکنون از `presentation` استفاده می‌کنند؛ `interactive` برای تولیدکنندگان پاسخ موجود، به‌عنوان یک ابزار کمکی داخلی و قدیمی برای تجزیه و رندر باقی می‌ماند.
API عمومی مخصوص تولیدکننده، `interactive` را منسوخ‌شده در نظر می‌گیرد. پشتیبانی زمان اجرا باقی می‌ماند تا ابزارهای کمکی تأیید موجود و Plugin‌های قدیمی همچنان کار کنند، درحالی‌که کد جدید `presentation` تولید می‌کند.

## فراداده تحویل

برای رفتار ارسالی که رابط کاربری نیست، یک فیلد `delivery` متعلق به هسته اضافه کنید.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

معناشناسی:

- `delivery.pin = true` یعنی نخستین پیام با تحویل موفق سنجاق شود.
- مقدار پیش‌فرض `notify` برابر `false` است.
- مقدار پیش‌فرض `required` برابر `false` است؛ کانال‌های پشتیبانی‌نشده یا شکست در سنجاق‌کردن، با ادامه تحویل به‌طور خودکار تنزل می‌یابند.
- کنش‌های دستی پیام `pin`،‏ `unpin` و `list-pins` برای پیام‌های موجود باقی می‌مانند.

اتصال فعلی موضوع ACP در Telegram باید از `channelData.telegram.pin = true` به `delivery.pin = true` منتقل شود.

## قرارداد قابلیت زمان اجرا

قلاب‌های رندر ارائه و تحویل را به آداپتور خروجی زمان اجرا اضافه کنید، نه به Plugin کانال صفحه کنترل.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

رفتار هسته:

- کانال مقصد و آداپتور زمان اجرا را تعیین کنید.
- قابلیت‌های ارائه را درخواست کنید.
- بلوک‌های پشتیبانی‌نشده را تنزل دهید و محدودیت‌های عمومی قابلیت را پیش از رندر اعمال کنید.
- `renderPresentation` را فراخوانی کنید.
- اگر هیچ رندرکننده‌ای وجود ندارد، ارائه را به متن جایگزین تبدیل کنید.
- پس از ارسال موفق، هنگامی که `delivery.pin` درخواست شده و پشتیبانی می‌شود، `pinDeliveredMessage` را فراخوانی کنید.

## نگاشت کانال

Discord:

- `presentation` را در ماژول‌های صرفاً زمان اجرا به مؤلفه‌های نسخه ۲ و کانتینرهای Carbon رندر کنید.
- ابزارهای کمکی رنگ تأکیدی را در ماژول‌های سبک نگه دارید.
- واردکردن `DiscordUiContainer` را از کد صفحه کنترل Plugin کانال حذف کنید.

Slack:

- `presentation` را به Block Kit رندر کنید.
- ورودی `blocks` عامل و CLI را حذف کنید.

Telegram:

- متن، زمینه و جداکننده‌ها را به‌صورت متن رندر کنید.
- کنش‌ها و انتخاب را، در صورت پیکربندی و مجازبودن برای سطح مقصد، به‌صورت صفحه‌کلیدهای درون‌خطی رندر کنید.
- وقتی دکمه‌های درون‌خطی غیرفعال‌اند، از متن جایگزین استفاده کنید.
- سنجاق‌کردن موضوع ACP را به `delivery.pin` منتقل کنید.

Mattermost:

- در صورت پیکربندی، کنش‌ها را به‌صورت دکمه‌های تعاملی رندر کنید.
- سایر بلوک‌ها را به‌صورت متن جایگزین رندر کنید.

MS Teams:

- `presentation` را به Adaptive Cards رندر کنید.
- کنش‌های دستی سنجاق‌کردن/برداشتن سنجاق/فهرست سنجاق‌ها را نگه دارید.
- اگر پشتیبانی Graph برای گفت‌وگوی مقصد قابل‌اعتماد است، در صورت تمایل `pinDeliveredMessage` را پیاده‌سازی کنید.

Feishu:

- `presentation` را به کارت‌های تعاملی رندر کنید.
- کنش‌های دستی سنجاق‌کردن/برداشتن سنجاق/فهرست سنجاق‌ها را نگه دارید.
- اگر رفتار API قابل‌اعتماد است، در صورت تمایل `pinDeliveredMessage` را برای سنجاق‌کردن پیام ارسال‌شده پیاده‌سازی کنید.

LINE:

- در صورت امکان، `presentation` را به پیام‌های Flex یا الگو رندر کنید.
- برای بلوک‌های پشتیبانی‌نشده به متن برگردید.
- بارهای رابط کاربری LINE را از `channelData` حذف کنید.

کانال‌های ساده یا محدود:

- ارائه را با قالب‌بندی محافظه‌کارانه به متن تبدیل کنید.

## مراحل بازآرایی

1. اصلاح انتشار Discord را که `ui-colors.ts` را از رابط کاربری مبتنی بر Carbon جدا و `DiscordUiContainer` را از `extensions/discord/src/channel.ts` حذف می‌کند، دوباره اعمال کنید.
2. `presentation` و `delivery` را به `ReplyPayload`، عادی‌سازی بار خروجی، خلاصه‌های تحویل و بارهای قلاب اضافه کنید.
3. طرح‌واره `MessagePresentation` و ابزارهای کمکی تجزیه را در یک زیرمسیر محدود SDK/زمان اجرا اضافه کنید.
4. قابلیت‌های پیام `buttons`،‏ `cards`،‏ `components` و `blocks` را با قابلیت‌های معنایی ارائه جایگزین کنید.
5. قلاب‌های آداپتور خروجی زمان اجرا را برای رندر ارائه و سنجاق‌کردن تحویل اضافه کنید.
6. ساخت مؤلفه میان‌زمینه‌ای را با `buildCrossContextPresentation` جایگزین کنید.
7. فایل `src/infra/outbound/channel-adapters.ts` را حذف و `buildCrossContextComponents` را از انواع Plugin کانال پاک کنید.
8. `maybeApplyCrossContextMarker` را تغییر دهید تا به‌جای پارامترهای بومی، `presentation` را پیوست کند.
9. مسیرهای ارسال توزیع Plugin را به‌روزرسانی کنید تا فقط ارائه معنایی و فراداده تحویل را مصرف کنند.
10. پارامترهای بومی بار عامل و CLI شامل `components`،‏ `blocks`،‏ `buttons` و `card` را حذف کنید.
11. ابزارهای کمکی SDK را که طرح‌واره‌های بومی ابزار پیام می‌سازند حذف و آن‌ها را با ابزارهای کمکی طرح‌واره ارائه جایگزین کنید.
12. پوشش‌های رابط کاربری/بومی را از `channelData` حذف کنید؛ تا زمان بررسی هر فیلد باقی‌مانده، فقط فراداده انتقال را نگه دارید.
13. رندرکننده‌های Discord، Slack، Telegram، Mattermost، MS Teams، Feishu و LINE را مهاجرت دهید.
14. مستندات CLI پیام، صفحات کانال، SDK مربوط به Plugin و راهنمای قابلیت‌ها را به‌روزرسانی کنید.
15. پروفایل‌گیری گسترش واردکردن را برای Discord و نقاط ورود کانال‌های تحت‌تأثیر اجرا کنید.

مراحل ۱ تا ۱۱ و ۱۳ تا ۱۴ در این بازآرایی برای عامل مشترک، CLI، قابلیت Plugin و قراردادهای آداپتور خروجی پیاده‌سازی شده‌اند. مرحله ۱۲ به‌عنوان یک گذر پاک‌سازی داخلی عمیق‌تر برای پوشش‌های انتقال `channelData` خصوصی ارائه‌دهنده باقی مانده است. مرحله ۱۵ نیز در صورتی که فراتر از دروازه نوع/آزمایش به اعداد کمّی گسترش واردکردن نیاز داشته باشیم، به‌عنوان اعتبارسنجی بعدی باقی می‌ماند.

## آزمایش‌ها

موارد زیر را اضافه یا به‌روزرسانی کنید:

- آزمایش‌های عادی‌سازی ارائه.
- آزمایش‌های تنزل خودکار ارائه برای بلوک‌های پشتیبانی‌نشده.
- آزمایش‌های نشانگر میان‌زمینه‌ای برای توزیع Plugin و مسیرهای تحویل هسته.
- آزمایش‌های ماتریس رندر کانال برای Discord، Slack، Telegram، Mattermost، MS Teams، Feishu، LINE و متن جایگزین.
- آزمایش‌های طرح‌واره ابزار پیام که حذف‌شدن فیلدهای بومی را اثبات می‌کنند.
- آزمایش‌های CLI که حذف‌شدن پرچم‌های بومی را اثبات می‌کنند.
- آزمون بازگشت‌ناپذیری بارگذاری تنبل نقطه ورود Discord که Carbon را پوشش می‌دهد.
- آزمایش‌های سنجاق‌کردن تحویل که Telegram و رفتار جایگزین عمومی را پوشش می‌دهند.

## پرسش‌های باز

- آیا `delivery.pin` باید در گذر نخست برای Discord، Slack، MS Teams و Feishu پیاده‌سازی شود یا ابتدا فقط برای Telegram؟
- آیا `delivery` باید در نهایت فیلدهای موجودی مانند `replyToId`،‏ `replyToCurrent`،‏ `silent` و `audioAsVoice` را نیز در بر بگیرد یا بر رفتارهای پس از ارسال متمرکز بماند؟
- آیا ارائه باید مستقیماً از تصاویر یا ارجاع‌های فایل پشتیبانی کند یا فعلاً رسانه از چیدمان رابط کاربری جدا بماند؟

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels)
- [ارائه پیام](/fa/plugins/message-presentation)
