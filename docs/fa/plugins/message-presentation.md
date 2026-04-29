---
read_when:
    - افزودن یا تغییر نحوهٔ رندر کارت پیام، دکمه یا منوی انتخاب
    - ساخت یک Plugin کانال که از پیام‌های خروجی غنی پشتیبانی می‌کند
    - تغییر نحوهٔ ارائهٔ ابزار پیام یا قابلیت‌های تحویل آن
    - اشکال‌زدایی پسرفت‌های رندر کارت/بلوک/کامپوننتِ مختص ارائه‌دهنده
summary: کارت‌های پیام معنایی، دکمه‌ها، فهرست‌های انتخاب، متن جایگزین، و راهنماهای تحویل برای Pluginهای کانال
title: نمایش پیام
x-i18n:
    generated_at: "2026-04-29T23:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

ارائهٔ پیام، قرارداد مشترک OpenClaw برای رابط کاربری غنی چت خروجی است.
این امکان را به عامل‌ها، فرمان‌های CLI، جریان‌های تأیید و Pluginها می‌دهد که
هدف پیام را یک‌بار توصیف کنند، در حالی که هر Plugin کانال بهترین شکل بومی ممکن را رندر می‌کند.

از ارائه برای رابط کاربری قابل‌حمل پیام استفاده کنید:

- بخش‌های متنی
- متن کوچک زمینه/پاورقی
- جداکننده‌ها
- دکمه‌ها
- منوهای انتخاب
- عنوان و لحن کارت

فیلدهای بومی جدیدِ ارائه‌دهنده مانند Discord `components`، Slack
`blocks`، Telegram `buttons`، Teams `card` یا Feishu `card` را به ابزار مشترک
پیام اضافه نکنید. این‌ها خروجی‌های رندرکننده هستند که مالکیتشان با Plugin کانال است.

## قرارداد

نویسندگان Plugin قرارداد عمومی را از اینجا import می‌کنند:

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

- `value` مقدار اقدام برنامه است که وقتی کانال از کنترل‌های قابل کلیک پشتیبانی می‌کند،
  از مسیر تعامل موجود همان کانال بازگردانده می‌شود.
- `url` دکمهٔ پیوند است. می‌تواند بدون `value` وجود داشته باشد.
- `label` الزامی است و در جایگزین متنی نیز استفاده می‌شود.
- `style` راهنماست. رندرکننده‌ها باید سبک‌های پشتیبانی‌نشده را به یک پیش‌فرض
  امن نگاشت کنند، نه اینکه ارسال را ناموفق کنند.

معنای انتخاب:

- `options[].value` مقدار انتخاب‌شدهٔ برنامه است.
- `placeholder` راهنماست و ممکن است کانال‌هایی که پشتیبانی بومی از انتخاب ندارند
  آن را نادیده بگیرند.
- اگر کانالی از انتخاب‌ها پشتیبانی نکند، متن جایگزین برچسب‌ها را فهرست می‌کند.

## مثال‌های تولیدکننده

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

Pluginهای کانال، پشتیبانی رندر را روی آداپتر خروجی خود اعلام می‌کنند:

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

فیلدهای قابلیت عمداً booleanهای ساده هستند. آن‌ها توصیف می‌کنند رندرکننده چه چیزی را
می‌تواند تعاملی کند، نه همهٔ محدودیت‌های بومی هر پلتفرم را. رندرکننده‌ها همچنان
مالک محدودیت‌های خاص پلتفرم مانند بیشینهٔ تعداد دکمه، تعداد بلوک و اندازهٔ کارت هستند.

## جریان رندر هسته

وقتی یک `ReplyPayload` یا اقدام پیام شامل `presentation` باشد، هسته:

1. payload ارائه را نرمال‌سازی می‌کند.
2. آداپتر خروجی کانال هدف را resolve می‌کند.
3. `presentationCapabilities` را می‌خواند.
4. وقتی آداپتر بتواند payload را رندر کند، `renderPresentation` را فراخوانی می‌کند.
5. وقتی آداپتر وجود نداشته باشد یا نتواند رندر کند، به متن محافظه‌کارانه fallback می‌کند.
6. payload حاصل را از مسیر معمول تحویل کانال ارسال می‌کند.
7. فرادادهٔ تحویل مانند `delivery.pin` را پس از نخستین پیام موفقِ ارسال‌شده اعمال می‌کند.

هسته مالک رفتار fallback است تا تولیدکننده‌ها بتوانند مستقل از کانال بمانند. Pluginهای
کانال مالک رندر بومی و رسیدگی به تعامل هستند.

## قواعد تنزل

ارائه باید برای ارسال روی کانال‌های محدود امن باشد.

متن fallback شامل این موارد است:

- `title` به‌عنوان خط نخست
- بلوک‌های `text` به‌عنوان بندهای معمول
- بلوک‌های `context` به‌عنوان خط‌های فشردهٔ زمینه
- بلوک‌های `divider` به‌عنوان جداکنندهٔ بصری
- برچسب‌های دکمه، شامل URLها برای دکمه‌های پیوند
- برچسب‌های گزینهٔ انتخاب

کنترل‌های بومی پشتیبانی‌نشده باید تنزل پیدا کنند، نه اینکه کل ارسال را ناموفق کنند.
مثال‌ها:

- Telegram با دکمه‌های inline غیرفعال، متن fallback ارسال می‌کند.
- کانالی بدون پشتیبانی از انتخاب، گزینه‌های انتخاب را به‌صورت متن فهرست می‌کند.
- دکمهٔ فقط URL یا به یک دکمهٔ پیوند بومی تبدیل می‌شود یا به یک خط URL fallback.
- شکست‌های اختیاری سنجاق‌کردن، پیام تحویل‌شده را ناموفق نمی‌کنند.

استثنای اصلی `delivery.pin.required: true` است؛ اگر سنجاق‌کردن به‌صورت
الزامی درخواست شده باشد و کانال نتواند پیام ارسال‌شده را سنجاق کند، تحویل شکست را گزارش می‌کند.

## نگاشت ارائه‌دهنده

رندرکننده‌های بسته‌بندی‌شدهٔ فعلی:

| کانال           | هدف رندر بومی                       | نکات                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | مؤلفه‌ها و کانتینرهای مؤلفه         | برای تولیدکننده‌های موجود payload بومیِ ارائه‌دهنده، `channelData.discord.components` قدیمی را حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند. |
| Slack           | Block Kit                           | برای تولیدکننده‌های موجود payload بومیِ ارائه‌دهنده، `channelData.slack.blocks` قدیمی را حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند.       |
| Telegram        | متن به‌همراه صفحه‌کلیدهای inline    | دکمه‌ها/انتخاب‌ها برای سطح هدف به قابلیت دکمهٔ inline نیاز دارند؛ در غیر این صورت از متن fallback استفاده می‌شود.                                         |
| Mattermost      | متن به‌همراه props تعاملی           | بلوک‌های دیگر به متن تنزل پیدا می‌کنند.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | وقتی هم متن سادهٔ `message` و هم کارت ارائه شوند، متن نیز همراه کارت درج می‌شود.                                                                            |
| Feishu          | کارت‌های تعاملی                     | سربرگ کارت می‌تواند از `title` استفاده کند؛ بدنه از تکرار آن عنوان پرهیز می‌کند.                                                                                  |
| کانال‌های ساده  | متن fallback                        | کانال‌های بدون رندرکننده همچنان خروجی خوانا دریافت می‌کنند.                                                                                            |

سازگاری payload بومیِ ارائه‌دهنده، امکانی انتقالی برای تولیدکننده‌های reply موجود است.
این دلیلی برای افزودن فیلدهای بومی مشترک جدید نیست.

## Presentation در برابر InteractiveReply

`InteractiveReply` زیرمجموعهٔ داخلی قدیمی‌تری است که توسط کمک‌کننده‌های تأیید و تعامل
استفاده می‌شود. از این موارد پشتیبانی می‌کند:

- متن
- دکمه‌ها
- انتخاب‌ها

`MessagePresentation` قرارداد canonical مشترک ارسال است. این موارد را اضافه می‌کند:

- عنوان
- لحن
- زمینه
- جداکننده
- دکمه‌های فقط URL
- فرادادهٔ عمومی تحویل از طریق `ReplyPayload.delivery`

هنگام پل‌زدن از کد قدیمی‌تر، از helperهای `openclaw/plugin-sdk/interactive-runtime` استفاده کنید:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

کد جدید باید مستقیماً `MessagePresentation` را بپذیرد یا تولید کند.

## سنجاق تحویل

سنجاق‌کردن رفتار تحویل است، نه ارائه. به‌جای فیلدهای بومی ارائه‌دهنده مانند
`channelData.telegram.pin` از `delivery.pin` استفاده کنید.

معناشناسی:

- `pin: true` نخستین پیام تحویل‌شدهٔ موفق را سنجاق می‌کند.
- مقدار پیش‌فرض `pin.notify` برابر `false` است.
- مقدار پیش‌فرض `pin.required` برابر `false` است.
- شکست‌های اختیاری سنجاق‌کردن تنزل پیدا می‌کنند و پیام ارسال‌شده را دست‌نخورده باقی می‌گذارند.
- شکست‌های الزامی سنجاق‌کردن باعث شکست تحویل می‌شوند.
- پیام‌های چندبخشی نخستین بخش تحویل‌شده را سنجاق می‌کنند، نه بخش پایانی را.

اقدام‌های دستی پیام برای `pin`، `unpin` و `pins` همچنان برای پیام‌های موجود
در جایی که ارائه‌دهنده از آن عملیات‌ها پشتیبانی می‌کند وجود دارند.

## چک‌لیست نویسندهٔ Plugin

- وقتی کانال می‌تواند ارائهٔ معنایی را رندر کند یا به‌طور امن تنزل دهد، `presentation` را از `describeMessageTool(...)` اعلام کنید.
- `presentationCapabilities` را به آداپتر خروجی runtime اضافه کنید.
- `renderPresentation` را در کد runtime پیاده‌سازی کنید، نه در کد راه‌اندازی Plugin در control-plane.
- کتابخانه‌های UI بومی را از مسیرهای داغ setup/catalog دور نگه دارید.
- محدودیت‌های پلتفرم را در رندرکننده و تست‌ها حفظ کنید.
- برای دکمه‌های پشتیبانی‌نشده، انتخاب‌ها، دکمه‌های URL، تکرار عنوان/متن، و ارسال‌های ترکیبی `message` به‌همراه `presentation` تست fallback اضافه کنید.
- پشتیبانی از سنجاق تحویل را فقط وقتی از طریق `deliveryCapabilities.pin` و
  `pinDeliveredMessage` اضافه کنید که ارائه‌دهنده بتواند id پیام ارسال‌شده را سنجاق کند.
- فیلدهای کارت/بلوک/مؤلفه/دکمهٔ بومیِ ارائه‌دهندهٔ جدید را از طریق schema اقدام پیام مشترک expose نکنید.

## مستندات مرتبط

- [CLI پیام](/fa/cli/message)
- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [معماری Plugin](/fa/plugins/architecture-internals#message-tool-schemas)
- [طرح بازآرایی ارائهٔ کانال](/fa/plan/ui-channels)
