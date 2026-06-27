---
read_when:
    - بازآرایی رابط کاربری پیام کانال، بارهای داده تعاملی، یا رندرکننده‌های بومی کانال
    - تغییر قابلیت‌های ابزار پیام، راهنماهای تحویل، یا نشانگرهای میان‌بافتی
    - اشکال‌زدایی fanout ایمپورت Carbon در Discord یا تنبلی زمان اجرای Plugin کانال
summary: ارائهٔ معنایی پیام را از رندرکننده‌های رابط کاربری بومی کانال جدا کنید.
title: برنامه بازآرایی ارائه کانال
x-i18n:
    generated_at: "2026-06-27T18:05:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## وضعیت

برای عامل مشترک، CLI، قابلیت Plugin و سطوح تحویل خروجی پیاده‌سازی شده است:

- `ReplyPayload.presentation` رابط کاربری معنایی پیام را حمل می‌کند.
- `ReplyPayload.delivery.pin` درخواست‌های سنجاق‌کردن پیام ارسال‌شده را حمل می‌کند.
- کنش‌های مشترک پیام به‌جای `components`،‏ `blocks`،‏ `buttons` یا `card` بومی ارائه‌دهنده، `presentation`،‏ `delivery` و `pin` را آشکار می‌کنند.
- هسته ارائه را از طریق قابلیت‌های خروجی اعلام‌شده توسط Plugin رندر می‌کند یا به‌صورت خودکار تنزل می‌دهد.
- رندرکننده‌های Discord، Slack، Telegram، Mattermost، Microsoft Teams و Feishu قرارداد عمومی را مصرف می‌کنند.
- کد صفحه کنترل کانال Discord دیگر کانتینرهای رابط کاربری مبتنی بر Carbon را import نمی‌کند.

مستندات مرجع اکنون در [ارائه پیام](/fa/plugins/message-presentation) قرار دارند.
این طرح را به‌عنوان زمینه تاریخی پیاده‌سازی نگه دارید؛ برای تغییرات قرارداد،
رندرکننده یا رفتار جایگزین، راهنمای مرجع را به‌روزرسانی کنید.

## مسئله

رابط کاربری کانال در حال حاضر میان چند سطح ناسازگار تقسیم شده است:

- هسته از طریق `buildCrossContextComponents` مالک یک hook رندرکننده میان‌زمینه‌ای با شکل Discord است.
- `channel.ts` مربوط به Discord می‌تواند از طریق `DiscordUiContainer` رابط کاربری بومی Carbon را import کند، که وابستگی‌های رابط کاربری زمان اجرا را وارد صفحه کنترل Plugin کانال می‌کند.
- عامل و CLI راه‌های فرار payload بومی مانند `components` در Discord،‏ `blocks` در Slack،‏ `buttons` در Telegram یا Mattermost، و `card` در Microsoft Teams یا Feishu را آشکار می‌کنند.
- `ReplyPayload.channelData` هم راهنمایی‌های انتقال و هم پوشش‌های رابط کاربری بومی را حمل می‌کند.
- مدل عمومی `interactive` وجود دارد، اما از چیدمان‌های غنی‌تری که هم‌اکنون توسط Discord، Slack، Microsoft Teams، Feishu، LINE، Telegram و Mattermost استفاده می‌شوند محدودتر است.

این وضعیت باعث می‌شود هسته از شکل‌های رابط کاربری بومی آگاه باشد، تنبلی زمان اجرای Plugin را تضعیف می‌کند، و به عامل‌ها راه‌های بیش از حد ارائه‌دهنده‌محور برای بیان نیت یکسان پیام می‌دهد.

## اهداف

- هسته بهترین ارائه معنایی را برای یک پیام بر اساس قابلیت‌های اعلام‌شده تصمیم‌گیری می‌کند.
- افزونه‌ها قابلیت‌ها را اعلام می‌کنند و ارائه معنایی را به payloadهای انتقال بومی رندر می‌کنند.
- رابط کاربری کنترل وب از رابط کاربری بومی چت جدا می‌ماند.
- payloadهای بومی کانال از طریق سطح پیام مشترک عامل یا CLI آشکار نمی‌شوند.
- ویژگی‌های ارائه پشتیبانی‌نشده به‌صورت خودکار به بهترین نمایش متنی تنزل می‌یابند.
- رفتار تحویل مانند سنجاق‌کردن یک پیام ارسال‌شده، فراداده عمومی تحویل است، نه ارائه.

## غیرهدف‌ها

- هیچ shim سازگاری عقب‌رو برای `buildCrossContextComponents` وجود ندارد.
- هیچ راه فرار بومی عمومی برای `components`،‏ `blocks`،‏ `buttons` یا `card` وجود ندارد.
- هیچ import هسته‌ای از کتابخانه‌های رابط کاربری بومی کانال وجود ندارد.
- هیچ سطح SDK ویژه ارائه‌دهنده برای کانال‌های بسته‌بندی‌شده وجود ندارد.

## مدل هدف

یک فیلد `presentation` تحت مالکیت هسته به `ReplyPayload` اضافه کنید.

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

`interactive` هنگام مهاجرت به زیرمجموعه‌ای از `presentation` تبدیل می‌شود:

- بلوک متن `interactive` به `presentation.blocks[].type = "text"` نگاشت می‌شود.
- بلوک دکمه‌های `interactive` به `presentation.blocks[].type = "buttons"` نگاشت می‌شود.
- بلوک انتخاب `interactive` به `presentation.blocks[].type = "select"` نگاشت می‌شود.

schemaهای عامل خارجی و CLI اکنون از `presentation` استفاده می‌کنند؛ `interactive` به‌عنوان یک کمک‌گیرنده parser/rendering قدیمی داخلی برای تولیدکنندگان پاسخ موجود باقی می‌ماند.
API عمومی روبه‌روی تولیدکننده، `interactive` را منسوخ‌شده تلقی می‌کند. پشتیبانی زمان اجرا
باقی می‌ماند تا کمک‌گیرنده‌های تأیید موجود و Pluginهای قدیمی‌تر همچنان کار کنند،
در حالی که کد جدید `presentation` منتشر می‌کند.

## فراداده تحویل

یک فیلد `delivery` تحت مالکیت هسته برای رفتار ارسال که رابط کاربری نیست اضافه کنید.

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
- مقدار پیش‌فرض `required` برابر `false` است؛ کانال‌های پشتیبانی‌نشده یا شکست در سنجاق‌کردن با ادامه تحویل به‌صورت خودکار تنزل می‌یابند.
- کنش‌های پیام دستی `pin`،‏ `unpin` و `list-pins` برای پیام‌های موجود باقی می‌مانند.

اتصال topic فعلی ACP در Telegram باید از `channelData.telegram.pin = true` به `delivery.pin = true` منتقل شود.

## قرارداد قابلیت زمان اجرا

hookهای رندر ارائه و تحویل را به سازگارگر خروجی زمان اجرا اضافه کنید، نه به Plugin کانال صفحه کنترل.

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

- کانال هدف و سازگارگر زمان اجرا را resolve کنید.
- قابلیت‌های ارائه را درخواست کنید.
- پیش از رندر، بلوک‌های پشتیبانی‌نشده را تنزل دهید و محدودیت‌های عمومی قابلیت را اعمال کنید.
- `renderPresentation` را فراخوانی کنید.
- اگر رندرکننده‌ای وجود ندارد، ارائه را به متن جایگزین تبدیل کنید.
- پس از ارسال موفق، وقتی `delivery.pin` درخواست شده و پشتیبانی می‌شود، `pinDeliveredMessage` را فراخوانی کنید.

## نگاشت کانال

Discord:

- `presentation` را به components v2 و کانتینرهای Carbon در ماژول‌های فقط زمان اجرا رندر کنید.
- کمک‌گیرنده‌های رنگ accent را در ماژول‌های سبک نگه دارید.
- importهای `DiscordUiContainer` را از کد صفحه کنترل Plugin کانال حذف کنید.

Slack:

- `presentation` را به Block Kit رندر کنید.
- ورودی `blocks` عامل و CLI را حذف کنید.

Telegram:

- متن، زمینه و جداکننده‌ها را به‌صورت متن رندر کنید.
- وقتی برای سطح هدف پیکربندی و مجاز شده باشد، کنش‌ها و انتخاب را به‌صورت صفحه‌کلیدهای inline رندر کنید.
- وقتی دکمه‌های inline غیرفعال هستند، از متن جایگزین استفاده کنید.
- سنجاق‌کردن topic مربوط به ACP را به `delivery.pin` منتقل کنید.

Mattermost:

- کنش‌ها را در صورت پیکربندی، به‌صورت دکمه‌های تعاملی رندر کنید.
- بلوک‌های دیگر را به‌صورت متن جایگزین رندر کنید.

Microsoft Teams:

- `presentation` را به Adaptive Cards رندر کنید.
- کنش‌های دستی pin/unpin/list-pins را نگه دارید.
- اگر پشتیبانی Graph برای گفت‌وگوی هدف قابل اتکا است، به‌صورت اختیاری `pinDeliveredMessage` را پیاده‌سازی کنید.

Feishu:

- `presentation` را به کارت‌های تعاملی رندر کنید.
- کنش‌های دستی pin/unpin/list-pins را نگه دارید.
- اگر رفتار API قابل اتکا است، به‌صورت اختیاری `pinDeliveredMessage` را برای سنجاق‌کردن پیام ارسال‌شده پیاده‌سازی کنید.

LINE:

- در صورت امکان، `presentation` را به پیام‌های Flex یا template رندر کنید.
- برای بلوک‌های پشتیبانی‌نشده به متن بازگردید.
- payloadهای رابط کاربری LINE را از `channelData` حذف کنید.

کانال‌های ساده یا محدود:

- ارائه را با قالب‌بندی محافظه‌کارانه به متن تبدیل کنید.

## مراحل بازآرایی

1. اصلاح انتشار Discord را دوباره اعمال کنید که `ui-colors.ts` را از رابط کاربری مبتنی بر Carbon جدا می‌کند و `DiscordUiContainer` را از `extensions/discord/src/channel.ts` حذف می‌کند.
2. `presentation` و `delivery` را به `ReplyPayload`، عادی‌سازی payload خروجی، خلاصه‌های تحویل و payloadهای hook اضافه کنید.
3. schema و کمک‌گیرنده‌های parser مربوط به `MessagePresentation` را در یک زیرمسیر محدود SDK/زمان اجرا اضافه کنید.
4. قابلیت‌های پیام `buttons`،‏ `cards`،‏ `components` و `blocks` را با قابلیت‌های ارائه معنایی جایگزین کنید.
5. hookهای سازگارگر خروجی زمان اجرا را برای رندر ارائه و سنجاق‌کردن تحویل اضافه کنید.
6. ساخت مؤلفه میان‌زمینه‌ای را با `buildCrossContextPresentation` جایگزین کنید.
7. `src/infra/outbound/channel-adapters.ts` را حذف کنید و `buildCrossContextComponents` را از types مربوط به Plugin کانال بردارید.
8. `maybeApplyCrossContextMarker` را تغییر دهید تا به‌جای پارامترهای بومی، `presentation` را الصاق کند.
9. مسیرهای ارسال plugin-dispatch را به‌روزرسانی کنید تا فقط ارائه معنایی و فراداده تحویل را مصرف کنند.
10. پارامترهای payload بومی عامل و CLI را حذف کنید: `components`،‏ `blocks`،‏ `buttons` و `card`.
11. کمک‌گیرنده‌های SDK را که schemaهای ابزار پیام بومی می‌سازند حذف کنید و آن‌ها را با کمک‌گیرنده‌های schema ارائه جایگزین کنید.
12. پوشش‌های رابط کاربری/بومی را از `channelData` حذف کنید؛ فقط فراداده انتقال را تا زمان بازبینی هر فیلد باقی‌مانده نگه دارید.
13. رندرکننده‌های Discord، Slack، Telegram، Mattermost، Microsoft Teams، Feishu و LINE را مهاجرت دهید.
14. مستندات CLI پیام، صفحه‌های کانال، SDK مربوط به Plugin و cookbook قابلیت را به‌روزرسانی کنید.
15. برای Discord و entrypointهای کانال تحت تأثیر، پروفایل‌گیری fanout مربوط به import را اجرا کنید.

مراحل 1 تا 11 و 13 تا 14 در این بازآرایی برای عامل مشترک، CLI، قابلیت Plugin و قراردادهای سازگارگر خروجی پیاده‌سازی شده‌اند. مرحله 12 همچنان یک گذر پاک‌سازی داخلی عمیق‌تر برای پوشش‌های انتقال `channelData` خصوصی ارائه‌دهنده باقی می‌ماند. مرحله 15 اگر بخواهیم فراتر از gate نوع/تست، عددهای کمّی import-fanout داشته باشیم، اعتبارسنجی پیگیری محسوب می‌شود.

## تست‌ها

اضافه یا به‌روزرسانی کنید:

- تست‌های عادی‌سازی ارائه.
- تست‌های تنزل خودکار ارائه برای بلوک‌های پشتیبانی‌نشده.
- تست‌های نشانگر میان‌زمینه‌ای برای plugin dispatch و مسیرهای تحویل هسته.
- تست‌های ماتریس رندر کانال برای Discord، Slack، Telegram، Mattermost، Microsoft Teams، Feishu، LINE و متن جایگزین.
- تست‌های schema ابزار پیام که ثابت می‌کنند فیلدهای بومی حذف شده‌اند.
- تست‌های CLI که ثابت می‌کنند flagهای بومی حذف شده‌اند.
- رگرسیون تنبلی import مربوط به entrypoint در Discord که Carbon را پوشش می‌دهد.
- تست‌های سنجاق‌کردن تحویل که Telegram و جایگزین عمومی را پوشش می‌دهند.

## پرسش‌های باز

- آیا `delivery.pin` باید در گذر اول برای Discord، Slack، Microsoft Teams و Feishu پیاده‌سازی شود، یا ابتدا فقط Telegram؟
- آیا `delivery` در نهایت باید فیلدهای موجود مانند `replyToId`،‏ `replyToCurrent`،‏ `silent` و `audioAsVoice` را جذب کند، یا روی رفتارهای پس از ارسال متمرکز بماند؟
- آیا ارائه باید مستقیماً از تصویرها یا ارجاع‌های فایل پشتیبانی کند، یا فعلاً رسانه باید جدا از چیدمان رابط کاربری باقی بماند؟

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels)
- [ارائه پیام](/fa/plugins/message-presentation)
