---
read_when:
    - بازآرایی رابط کاربری پیام کانال، بارهای داده‌ای تعاملی، یا رندرکننده‌های بومی کانال
    - تغییر قابلیت‌های ابزار پیام، راهنمایی‌های تحویل، یا نشانگرهای میان‌زمینه‌ای
    - اشکال‌زدایی گسترش واردسازی Discord Carbon یا تنبل‌بودن زمان اجرای Plugin کانال
summary: ارائهٔ معنایی پیام را از رندرکننده‌های رابط کاربری بومی کانال جدا کنید.
title: طرح بازآرایی نمایش کانال
x-i18n:
    generated_at: "2026-04-29T23:10:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## وضعیت

برای عامل مشترک، CLI، قابلیت Plugin، و سطوح تحویل خروجی پیاده‌سازی شده است:

- `ReplyPayload.presentation` رابط کاربری معنایی پیام را حمل می‌کند.
- `ReplyPayload.delivery.pin` درخواست‌های سنجاق‌کردن پیام ارسال‌شده را حمل می‌کند.
- کنش‌های پیام مشترک به‌جای `components`، `blocks`، `buttons` یا `card` بومی ارائه‌دهنده، `presentation`، `delivery` و `pin` را ارائه می‌کنند.
- هسته، ارائه را از طریق قابلیت‌های خروجی اعلام‌شده توسط Plugin رندر می‌کند یا به‌صورت خودکار تنزل می‌دهد.
- رندرکننده‌های Discord، Slack، Telegram، Mattermost، MS Teams و Feishu قرارداد عمومی را مصرف می‌کنند.
- کد صفحه کنترل کانال Discord دیگر کانتینرهای رابط کاربری مبتنی بر Carbon را import نمی‌کند.

مستندات مرجع اکنون در [ارائه پیام](/fa/plugins/message-presentation) قرار دارند.
این طرح را به‌عنوان زمینه تاریخی پیاده‌سازی نگه دارید؛ برای تغییرات قرارداد، رندرکننده یا رفتار fallback، راهنمای مرجع را به‌روزرسانی کنید.

## مسئله

رابط کاربری کانال در حال حاضر میان چند سطح ناسازگار تقسیم شده است:

- هسته از طریق `buildCrossContextComponents` مالک یک hook رندرکننده میان‌بافتی با شکل Discord است.
- `channel.ts` مربوط به Discord می‌تواند رابط کاربری بومی Carbon را از طریق `DiscordUiContainer` import کند، که وابستگی‌های رابط کاربری زمان اجرا را وارد صفحه کنترل Plugin کانال می‌کند.
- عامل و CLI راه‌های خروج اضطراری payload بومی مانند `components` در Discord، `blocks` در Slack، `buttons` در Telegram یا Mattermost، و `card` در Teams یا Feishu را ارائه می‌کنند.
- `ReplyPayload.channelData` هم نکته‌های transport و هم envelopeهای رابط کاربری بومی را حمل می‌کند.
- مدل عمومی `interactive` وجود دارد، اما از layoutهای غنی‌تری که هم‌اکنون توسط Discord، Slack، Teams، Feishu، LINE، Telegram و Mattermost استفاده می‌شوند محدودتر است.

این موضوع باعث می‌شود هسته از شکل‌های رابط کاربری بومی آگاه باشد، تنبلی زمان اجرای Plugin را تضعیف می‌کند، و به عامل‌ها راه‌های بیش‌ازحد وابسته به ارائه‌دهنده می‌دهد تا یک intent پیام واحد را بیان کنند.

## اهداف

- هسته بهترین ارائه معنایی را برای یک پیام، براساس قابلیت‌های اعلام‌شده، انتخاب می‌کند.
- افزونه‌ها قابلیت‌ها را اعلام می‌کنند و ارائه معنایی را به payloadهای transport بومی رندر می‌کنند.
- رابط کاربری کنترل وب از رابط کاربری بومی چت جدا می‌ماند.
- payloadهای کانال بومی از طریق سطح پیام عامل مشترک یا CLI در معرض قرار نمی‌گیرند.
- ویژگی‌های پشتیبانی‌نشده ارائه به‌صورت خودکار به بهترین نمایش متنی تنزل می‌کنند.
- رفتار تحویل مانند سنجاق‌کردن یک پیام ارسال‌شده، metadata عمومی تحویل است، نه ارائه.

## غیرهدف‌ها

- هیچ shim سازگاری عقب‌رو برای `buildCrossContextComponents` وجود ندارد.
- هیچ راه خروج اضطراری بومی عمومی برای `components`، `blocks`، `buttons` یا `card` وجود ندارد.
- هیچ import از کتابخانه‌های رابط کاربری بومی کانال در هسته وجود ندارد.
- هیچ seam مخصوص ارائه‌دهنده در SDK برای کانال‌های bundled وجود ندارد.

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

`interactive` در طول مهاجرت به زیرمجموعه‌ای از `presentation` تبدیل می‌شود:

- بلوک متنی `interactive` به `presentation.blocks[].type = "text"` نگاشت می‌شود.
- بلوک دکمه‌های `interactive` به `presentation.blocks[].type = "buttons"` نگاشت می‌شود.
- بلوک انتخاب `interactive` به `presentation.blocks[].type = "select"` نگاشت می‌شود.

schemaهای عامل خارجی و CLI اکنون از `presentation` استفاده می‌کنند؛ `interactive` به‌عنوان parser/helper رندر legacy داخلی برای تولیدکنندگان پاسخ موجود باقی می‌ماند.

## metadata تحویل

یک فیلد `delivery` متعلق به هسته برای رفتار ارسال که رابط کاربری نیست اضافه کنید.

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
- مقدار پیش‌فرض `required` برابر `false` است؛ کانال‌های پشتیبانی‌نشده یا شکست در سنجاق‌کردن با ادامه تحویل به‌صورت خودکار تنزل می‌کنند.
- کنش‌های پیام دستی `pin`، `unpin` و `list-pins` برای پیام‌های موجود باقی می‌مانند.

binding فعلی topic در Telegram ACP باید از `channelData.telegram.pin = true` به `delivery.pin = true` منتقل شود.

## قرارداد قابلیت زمان اجرا

hookهای رندر ارائه و تحویل را به adapter خروجی زمان اجرا اضافه کنید، نه به Plugin کانال صفحه کنترل.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

- کانال هدف و adapter زمان اجرا را resolve کند.
- قابلیت‌های ارائه را درخواست کند.
- بلوک‌های پشتیبانی‌نشده را پیش از رندر تنزل دهد.
- `renderPresentation` را فراخوانی کند.
- اگر رندرکننده‌ای وجود ندارد، ارائه را به fallback متنی تبدیل کند.
- پس از ارسال موفق، وقتی `delivery.pin` درخواست شده و پشتیبانی می‌شود، `pinDeliveredMessage` را فراخوانی کند.

## نگاشت کانال

Discord:

- `presentation` را در ماژول‌های فقط زمان اجرا به components v2 و کانتینرهای Carbon رندر کنید.
- helperهای رنگ accent را در ماژول‌های سبک نگه دارید.
- importهای `DiscordUiContainer` را از کد صفحه کنترل Plugin کانال حذف کنید.

Slack:

- `presentation` را به Block Kit رندر کنید.
- ورودی `blocks` عامل و CLI را حذف کنید.

Telegram:

- متن، context و dividerها را به‌صورت متن رندر کنید.
- کنش‌ها و select را وقتی برای سطح هدف پیکربندی و مجاز شده‌اند، به‌صورت صفحه‌کلیدهای inline رندر کنید.
- وقتی دکمه‌های inline غیرفعال هستند، از fallback متنی استفاده کنید.
- سنجاق‌کردن topic در ACP را به `delivery.pin` منتقل کنید.

Mattermost:

- کنش‌ها را در جایی که پیکربندی شده‌اند به‌صورت دکمه‌های تعاملی رندر کنید.
- سایر بلوک‌ها را به‌صورت fallback متنی رندر کنید.

MS Teams:

- `presentation` را به Adaptive Cards رندر کنید.
- کنش‌های دستی pin/unpin/list-pins را نگه دارید.
- در صورت قابل‌اعتمادبودن پشتیبانی Graph برای گفت‌وگوی هدف، در صورت نیاز `pinDeliveredMessage` را پیاده‌سازی کنید.

Feishu:

- `presentation` را به کارت‌های تعاملی رندر کنید.
- کنش‌های دستی pin/unpin/list-pins را نگه دارید.
- اگر رفتار API قابل‌اعتماد است، در صورت نیاز `pinDeliveredMessage` را برای سنجاق‌کردن پیام ارسال‌شده پیاده‌سازی کنید.

LINE:

- `presentation` را در صورت امکان به پیام‌های Flex یا template رندر کنید.
- برای بلوک‌های پشتیبانی‌نشده به متن fallback کنید.
- payloadهای رابط کاربری LINE را از `channelData` حذف کنید.

کانال‌های ساده یا محدود:

- ارائه را با قالب‌بندی محافظه‌کارانه به متن تبدیل کنید.

## مراحل refactor

1. fix انتشار Discord را دوباره اعمال کنید که `ui-colors.ts` را از رابط کاربری مبتنی بر Carbon جدا می‌کند و `DiscordUiContainer` را از `extensions/discord/src/channel.ts` حذف می‌کند.
2. `presentation` و `delivery` را به `ReplyPayload`، نرمال‌سازی payload خروجی، خلاصه‌های تحویل، و payloadهای hook اضافه کنید.
3. schema و helperهای parser مربوط به `MessagePresentation` را در یک subpath محدود SDK/runtime اضافه کنید.
4. قابلیت‌های پیام `buttons`، `cards`، `components` و `blocks` را با قابلیت‌های ارائه معنایی جایگزین کنید.
5. hookهای adapter خروجی زمان اجرا را برای رندر ارائه و سنجاق‌کردن تحویل اضافه کنید.
6. ساخت component میان‌بافتی را با `buildCrossContextPresentation` جایگزین کنید.
7. `src/infra/outbound/channel-adapters.ts` را حذف کنید و `buildCrossContextComponents` را از نوع‌های Plugin کانال بردارید.
8. `maybeApplyCrossContextMarker` را تغییر دهید تا به‌جای پارامترهای بومی، `presentation` را attach کند.
9. مسیرهای ارسال plugin-dispatch را به‌روزرسانی کنید تا فقط ارائه معنایی و metadata تحویل را مصرف کنند.
10. پارامترهای payload بومی عامل و CLI را حذف کنید: `components`، `blocks`، `buttons` و `card`.
11. helperهای SDK را که schemaهای ابزار پیام بومی می‌سازند حذف کنید و آن‌ها را با helperهای schema ارائه جایگزین کنید.
12. envelopeهای رابط کاربری/بومی را از `channelData` حذف کنید؛ تا زمانی که هر فیلد باقی‌مانده بررسی شود، فقط metadata مربوط به transport را نگه دارید.
13. رندرکننده‌های Discord، Slack، Telegram، Mattermost، MS Teams، Feishu و LINE را مهاجرت دهید.
14. مستندات CLI پیام، صفحه‌های کانال، Plugin SDK و cookbook قابلیت را به‌روزرسانی کنید.
15. برای Discord و entrypointهای کانال‌های تحت‌تأثیر، profiling مربوط به fanout import را اجرا کنید.

مراحل 1 تا 11 و 13 تا 14 در این refactor برای قراردادهای عامل مشترک، CLI، قابلیت Plugin و adapter خروجی پیاده‌سازی شده‌اند. مرحله 12 همچنان یک pass پاک‌سازی داخلی عمیق‌تر برای envelopeهای transport خصوصی ارائه‌دهنده در `channelData` باقی می‌ماند. مرحله 15 اگر فراتر از gate نوع/تست، عددهای کمی fanout import بخواهیم، به‌عنوان اعتبارسنجی بعدی باقی می‌ماند.

## تست‌ها

اضافه یا به‌روزرسانی کنید:

- تست‌های نرمال‌سازی ارائه.
- تست‌های تنزل خودکار ارائه برای بلوک‌های پشتیبانی‌نشده.
- تست‌های marker میان‌بافتی برای مسیرهای plugin dispatch و تحویل هسته.
- تست‌های ماتریس رندر کانال برای Discord، Slack، Telegram، Mattermost، MS Teams، Feishu، LINE و fallback متنی.
- تست‌های schema ابزار پیام که ثابت می‌کنند فیلدهای بومی حذف شده‌اند.
- تست‌های CLI که ثابت می‌کنند flagهای بومی حذف شده‌اند.
- regression مربوط به تنبلی import در entrypoint Discord که Carbon را پوشش می‌دهد.
- تست‌های سنجاق‌کردن تحویل که Telegram و fallback عمومی را پوشش می‌دهند.

## پرسش‌های باز

- آیا `delivery.pin` باید در گذر نخست برای Discord، Slack، MS Teams و Feishu پیاده‌سازی شود، یا ابتدا فقط برای Telegram؟
- آیا `delivery` در نهایت باید فیلدهای موجود مانند `replyToId`، `replyToCurrent`، `silent` و `audioAsVoice` را هم جذب کند، یا روی رفتارهای پس از ارسال متمرکز بماند؟
- آیا ارائه باید مستقیما از تصویرها یا ارجاع‌های فایل پشتیبانی کند، یا رسانه فعلا باید جدا از layout رابط کاربری باقی بماند؟

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels)
- [ارائه پیام](/fa/plugins/message-presentation)
