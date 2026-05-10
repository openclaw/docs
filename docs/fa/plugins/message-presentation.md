---
read_when:
    - افزودن یا تغییر رندر کارت پیام، دکمه یا منوی انتخاب
    - ساخت یک Plugin کانال که از پیام‌های خروجی غنی پشتیبانی می‌کند
    - تغییر نحوهٔ نمایش ابزار پیام یا قابلیت‌های تحویل
    - اشکال‌زدایی از پس‌رفت‌های رندر کارت/بلوک/مؤلفه مختص ارائه‌دهنده
summary: کارت‌های پیام معنایی، دکمه‌ها، انتخاب‌گرها، متن جایگزین، و راهنماهای تحویل برای Pluginهای کانال
title: نمایش پیام
x-i18n:
    generated_at: "2026-05-10T19:56:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

ارائهٔ پیام، قرارداد مشترک OpenClaw برای رابط کاربری گفت‌وگوی خروجی غنی است.
این امکان را می‌دهد که عامل‌ها، فرمان‌های CLI، جریان‌های تأیید، و Pluginها نیت پیام
را یک بار توصیف کنند، در حالی که هر Plugin کانال بهترین شکل بومی ممکن را رندر می‌کند.

از ارائه برای رابط کاربری پیام قابل‌حمل استفاده کنید:

- بخش‌های متنی
- متن کوتاه زمینه/پاورقی
- جداکننده‌ها
- دکمه‌ها
- منوهای انتخاب
- عنوان و لحن کارت

فیلدهای بومیِ ارائه‌دهندهٔ جدید مانند Discord `components`، Slack
`blocks`، Telegram `buttons`، Teams `card`، یا Feishu `card` را به ابزار پیام
مشترک اضافه نکنید. این‌ها خروجی‌های رندرکننده هستند که مالکیتشان با Plugin کانال است.

## قرارداد

نویسندگان Plugin قرارداد عمومی را از اینجا وارد می‌کنند:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

شکل:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

معنای دکمه‌ها:

- `value` مقدار یک کنش برنامه است که وقتی کانال از کنترل‌های قابل‌کلیک پشتیبانی می‌کند،
  از مسیر تعامل موجود همان کانال برگردانده می‌شود.
- `url` دکمهٔ پیوند است. می‌تواند بدون `value` وجود داشته باشد.
- `label` الزامی است و در جایگزین متنی نیز استفاده می‌شود.
- `style` جنبهٔ راهنمایی دارد. رندرکننده‌ها باید سبک‌های پشتیبانی‌نشده را به یک
  پیش‌فرض امن نگاشت کنند، نه اینکه ارسال را ناموفق کنند.

معنای انتخاب:

- `options[].value` مقدار برنامهٔ انتخاب‌شده است.
- `placeholder` جنبهٔ راهنمایی دارد و ممکن است در کانال‌هایی که پشتیبانی بومی
  انتخاب ندارند نادیده گرفته شود.
- اگر کانالی از انتخاب‌ها پشتیبانی نکند، متن جایگزین برچسب‌ها را فهرست می‌کند.

## نمونه‌های تولیدکننده

کارت ساده:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

دکمهٔ پیوند فقط با URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

منوی انتخاب:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

ارسال با CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

تحویل سنجاق‌شده:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

تحویل سنجاق‌شده با JSON صریح:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## قرارداد رندرکننده

Pluginهای کانال پشتیبانی رندر را روی آداپتر خروجی خود اعلام می‌کنند:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

فیلدهای قابلیت عمداً بولی‌های ساده هستند. آن‌ها توصیف می‌کنند رندرکننده چه چیزی
را می‌تواند تعاملی کند، نه همهٔ محدودیت‌های بومی پلتفرم را. رندرکننده‌ها همچنان
مالک محدودیت‌های ویژهٔ پلتفرم مانند بیشینهٔ تعداد دکمه، تعداد بلوک، و اندازهٔ
کارت هستند.

## جریان رندر هسته

وقتی یک `ReplyPayload` یا کنش پیام شامل `presentation` باشد، هسته:

1. بار ارائه را نرمال‌سازی می‌کند.
2. آداپتر خروجی کانال مقصد را حل می‌کند.
3. `presentationCapabilities` را می‌خواند.
4. وقتی آداپتر بتواند بار را رندر کند، `renderPresentation` را فراخوانی می‌کند.
5. وقتی آداپتر وجود ندارد یا نمی‌تواند رندر کند، به متن محافظه‌کارانه برمی‌گردد.
6. بار حاصل را از مسیر عادی تحویل کانال ارسال می‌کند.
7. فرادادهٔ تحویل مانند `delivery.pin` را پس از نخستین پیام ارسال‌شدهٔ موفق اعمال می‌کند.

هسته مالک رفتار جایگزین است تا تولیدکننده‌ها بتوانند نسبت به کانال بی‌طرف بمانند. Pluginهای
کانال مالک رندر بومی و مدیریت تعامل هستند.

## قواعد افت کیفیت

ارائه باید برای ارسال روی کانال‌های محدود امن باشد.

متن جایگزین شامل موارد زیر است:

- `title` به‌عنوان خط نخست
- بلوک‌های `text` به‌عنوان پاراگراف‌های عادی
- بلوک‌های `context` به‌عنوان خط‌های زمینهٔ فشرده
- بلوک‌های `divider` به‌عنوان جداکنندهٔ دیداری
- برچسب‌های دکمه، شامل URLها برای دکمه‌های پیوند
- برچسب‌های گزینه‌های انتخاب

کنترل‌های بومی پشتیبانی‌نشده باید افت کیفیت پیدا کنند، نه اینکه کل ارسال را ناموفق کنند.
نمونه‌ها:

- Telegram با دکمه‌های درون‌خطی غیرفعال، متن جایگزین ارسال می‌کند.
- کانالی بدون پشتیبانی انتخاب، گزینه‌های انتخاب را به‌صورت متن فهرست می‌کند.
- دکمه‌ای فقط با URL یا به دکمهٔ پیوند بومی تبدیل می‌شود یا به خط URL جایگزین.
- شکست‌های اختیاری سنجاق‌کردن، پیام تحویل‌شده را ناموفق نمی‌کنند.

استثنای اصلی `delivery.pin.required: true` است؛ اگر سنجاق‌کردن به‌صورت الزامی
درخواست شود و کانال نتواند پیام ارسال‌شده را سنجاق کند، تحویل شکست را گزارش می‌کند.

## نگاشت ارائه‌دهنده

رندرکننده‌های بسته‌بندی‌شدهٔ فعلی:

| کانال           | هدف رندر بومی                       | یادداشت‌ها                                                                                                                                       |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | مؤلفه‌ها و کانتینرهای مؤلفه         | برای تولیدکننده‌های بار بومیِ ارائه‌دهندهٔ موجود، `channelData.discord.components` قدیمی را حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند. |
| Slack           | Block Kit                           | برای تولیدکننده‌های بار بومیِ ارائه‌دهندهٔ موجود، `channelData.slack.blocks` قدیمی را حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند.       |
| Telegram        | متن به‌همراه صفحه‌کلیدهای درون‌خطی | دکمه‌ها/انتخاب‌ها برای سطح مقصد به قابلیت دکمهٔ درون‌خطی نیاز دارند؛ در غیر این صورت از متن جایگزین استفاده می‌شود.                            |
| Mattermost      | متن به‌همراه props تعاملی           | بلوک‌های دیگر به متن افت کیفیت پیدا می‌کنند.                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | وقتی هر دو ارائه شوند، متن سادهٔ `message` همراه کارت گنجانده می‌شود.                                                                            |
| Feishu          | کارت‌های تعاملی                     | سرصفحهٔ کارت می‌تواند از `title` استفاده کند؛ بدنه از تکرار آن عنوان پرهیز می‌کند.                                                               |
| کانال‌های ساده  | متن جایگزین                         | کانال‌های بدون رندرکننده همچنان خروجی خوانا دریافت می‌کنند.                                                                                      |

سازگاری بار بومیِ ارائه‌دهنده یک امکان گذار برای تولیدکننده‌های پاسخ موجود است.
این دلیلی برای افزودن فیلدهای بومی مشترک جدید نیست.

## Presentation در برابر InteractiveReply

`InteractiveReply` زیرمجموعهٔ داخلی قدیمی‌تری است که توسط کمک‌کارهای تأیید و تعامل
استفاده می‌شود. پشتیبانی می‌کند از:

- متن
- دکمه‌ها
- انتخاب‌ها

`MessagePresentation` قرارداد متعارف ارسال مشترک است. اضافه می‌کند:

- عنوان
- لحن
- زمینه
- جداکننده
- دکمه‌های فقط URL
- فرادادهٔ تحویل عمومی از طریق `ReplyPayload.delivery`

هنگام پل‌زدن کد قدیمی‌تر، از کمک‌کارهای `openclaw/plugin-sdk/interactive-runtime` استفاده کنید:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

کد جدید باید `MessagePresentation` را مستقیماً بپذیرد یا تولید کند.

`presentationToInteractiveReply(...)` با نگاشت عنوان، متن، زمینه، دکمه‌ها، و انتخاب‌ها
به شکل قدیمی‌تر `InteractiveReply`، متن قابل‌مشاهدهٔ ارائه را حفظ می‌کند. رندرکننده‌های
مؤلفه‌ای که از قبل بلوک‌های عنوان، متن، زمینه، و جداکننده را به‌صورت بومی رسم می‌کنند
باید به‌جای آن از `presentationToInteractiveControlsReply(...)` استفاده کنند، سپس فقط
کنترل‌های دکمه و انتخاب را اضافه کنند.

`renderMessagePresentationFallbackText(...)` برای بلوک‌های ارائه‌ای که جایگزین متنی
ندارند، مانند ارائه‌ای که فقط جداکننده دارد، رشتهٔ خالی برمی‌گرداند. انتقال‌هایی که
بدنهٔ ارسال غیرخالی لازم دارند می‌توانند `emptyFallback` را بفرستند تا بدون تغییر
قرارداد پیش‌فرض جایگزین، یک بدنهٔ حداقلی را انتخاب کنند.

## سنجاق تحویل

سنجاق‌کردن رفتار تحویل است، نه ارائه. به‌جای فیلدهای بومی ارائه‌دهنده مانند
`channelData.telegram.pin` از `delivery.pin` استفاده کنید.

معنا:

- `pin: true` نخستین پیام تحویل‌داده‌شدهٔ موفق را سنجاق می‌کند.
- `pin.notify` به‌صورت پیش‌فرض `false` است.
- `pin.required` به‌صورت پیش‌فرض `false` است.
- شکست‌های اختیاری سنجاق‌کردن افت کیفیت پیدا می‌کنند و پیام ارسال‌شده را دست‌نخورده می‌گذارند.
- شکست‌های الزامی سنجاق‌کردن، تحویل را ناموفق می‌کنند.
- پیام‌های چندبخشی نخستین بخش تحویل‌داده‌شده را سنجاق می‌کنند، نه بخش پایانی را.

کنش‌های دستی پیام `pin`، `unpin`، و `pins` همچنان برای پیام‌های موجودی که ارائه‌دهنده
از آن عملیات پشتیبانی می‌کند وجود دارند.

## چک‌لیست نویسندهٔ Plugin

- وقتی کانال می‌تواند ارائهٔ معنایی را رندر کند یا به‌صورت امن افت کیفیت دهد،
  `presentation` را از `describeMessageTool(...)` اعلام کنید.
- `presentationCapabilities` را به آداپتر خروجی runtime اضافه کنید.
- `renderPresentation` را در کد runtime پیاده‌سازی کنید، نه در کد راه‌اندازی
  Plugin سطح کنترل.
- کتابخانه‌های رابط کاربری بومی را از مسیرهای داغ راه‌اندازی/کاتالوگ بیرون نگه دارید.
- محدودیت‌های پلتفرم را در رندرکننده و آزمون‌ها حفظ کنید.
- آزمون‌های جایگزین را برای دکمه‌های پشتیبانی‌نشده، انتخاب‌ها، دکمه‌های URL،
  تکرار عنوان/متن، و ارسال‌های ترکیبی `message` به‌همراه `presentation` اضافه کنید.
- پشتیبانی سنجاق تحویل را از طریق `deliveryCapabilities.pin` و `pinDeliveredMessage`
  فقط زمانی اضافه کنید که ارائه‌دهنده بتواند شناسهٔ پیام ارسال‌شده را سنجاق کند.
- فیلدهای کارت/بلوک/مؤلفه/دکمهٔ بومی ارائه‌دهندهٔ جدید را از طریق شِمای کنش پیام
  مشترک در معرض قرار ندهید.

## مستندات مرتبط

- [CLI پیام](/fa/cli/message)
- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [معماری Plugin](/fa/plugins/architecture-internals#message-tool-schemas)
- [طرح بازآرایی ارائهٔ کانال](/fa/plan/ui-channels)
