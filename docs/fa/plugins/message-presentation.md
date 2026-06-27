---
read_when:
    - افزودن یا تغییر رندر کارت پیام، دکمه یا منوی انتخاب
    - ساخت یک Plugin کانال که از پیام‌های خروجی غنی پشتیبانی می‌کند
    - تغییر قابلیت‌های ارائه یا تحویل ابزار پیام
    - اشکال‌زدایی از پسرفت‌های رندر کارت/بلوک/مؤلفه مختص ارائه‌دهنده
summary: کارت‌های پیام معنایی، دکمه‌ها، انتخاب‌گرها، متن جایگزین، و راهنمایی‌های تحویل برای Pluginهای کانال
title: ارائهٔ پیام
x-i18n:
    generated_at: "2026-06-27T18:19:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

ارائه پیام، قرارداد مشترک OpenClaw برای رابط کاربری غنی چت خروجی است.
این امکان را می‌دهد که عامل‌ها، فرمان‌های CLI، جریان‌های تایید، و Pluginها قصد پیام
را یک‌بار توصیف کنند، در حالی که هر Plugin کانال بهترین شکل بومی ممکن را رندر می‌کند.

از ارائه برای رابط کاربری پیام قابل‌حمل استفاده کنید:

- بخش‌های متن
- متن کوتاه زمینه/پاورقی
- جداکننده‌ها
- دکمه‌ها
- منوهای انتخاب
- عنوان و لحن کارت

فیلدهای بومی ارائه‌دهنده جدید مانند Discord `components`، Slack
`blocks`، Telegram `buttons`، Teams `card`، یا Feishu `card` را به ابزار
پیام مشترک اضافه نکنید. این‌ها خروجی‌های رندرکننده هستند که مالکیتشان با Plugin کانال است.

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` یک فرمان slash بومی را از مسیر فرمان هسته اجرا می‌کند.
  از این برای دکمه‌ها و منوهای فرمان داخلی استفاده کنید.
- `action.type: "callback"` داده مات Plugin را از مسیر تعامل کانال عبور می‌دهد.
  Pluginهای کانال نباید داده callback را به‌عنوان فرمان‌های slash بازتفسیر کنند.
- `value` مقدار callback مات قدیمی است. کنترل‌های جدید باید از `action`
  استفاده کنند تا Pluginهای کانال بتوانند فرمان‌ها و callbackها را بدون حدس‌زدن از متن نگاشت کنند.
- `url` یک دکمه پیوند است. می‌تواند بدون `value` وجود داشته باشد.
- `webApp` یک دکمه وب‌اپ بومی کانال را توصیف می‌کند. Telegram این را
  به‌صورت `web_app` رندر می‌کند و فقط در چت‌های خصوصی از آن پشتیبانی می‌کند. `web_app` همچنان
  برای سازگاری در payloadهای JSON آزاد پذیرفته می‌شود، اما تولیدکنندگان TypeScript
  باید از `webApp` استفاده کنند.
- `label` الزامی است و در fallback متنی نیز استفاده می‌شود.
- `style` جنبه راهنما دارد. رندرکننده‌ها باید سبک‌های پشتیبانی‌نشده را به یک پیش‌فرض امن
  نگاشت کنند، نه اینکه ارسال را ناموفق کنند.
- `priority` اختیاری است. وقتی کانالی محدودیت‌های کنش را اعلام می‌کند و کنترل‌ها
  باید حذف شوند، هسته ابتدا دکمه‌های با اولویت بالاتر را نگه می‌دارد و
  ترتیب اصلی را میان دکمه‌های هم‌اولویت حفظ می‌کند. وقتی همه کنترل‌ها جا می‌شوند،
  ترتیب نوشته‌شده حفظ می‌شود.
- `disabled` اختیاری است. کانال‌ها باید با `supportsDisabled` به‌طور صریح پشتیبانی کنند؛ در غیر این صورت
  هسته کنترل غیرفعال را به متن fallback غیرتعاملی تنزل می‌دهد.
- `reusable` اختیاری است. کانال‌هایی که از callbackهای بومی قابل‌استفاده‌مجدد پشتیبانی می‌کنند ممکن است
  کنش را پس از یک تعامل موفق همچنان در دسترس نگه دارند. از آن برای
  کنش‌های تکرارپذیر یا idempotent مانند refresh، inspect، یا more details استفاده کنید؛
  برای تاییدهای یک‌باره عادی و کنش‌های مخرب آن را تنظیم نکنید.

معنای انتخاب:

- `options[].action` همان معنای فرمان/callback دکمه `action` را دارد.
- `options[].value` مقدار برنامه انتخاب‌شده قدیمی است.
- `placeholder` جنبه راهنما دارد و ممکن است توسط کانال‌های بدون پشتیبانی بومی
  انتخاب نادیده گرفته شود.
- اگر کانالی از انتخاب‌ها پشتیبانی نکند، متن fallback برچسب‌ها را فهرست می‌کند.

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

دکمه پیوند فقط-URL:

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

دکمه Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
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

ارسال CLI:

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
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

بولین‌های قابلیت توصیف می‌کنند که رندرکننده چه چیزی را می‌تواند تعاملی کند. `limits` اختیاری
پوشش عمومی‌ای را توصیف می‌کند که هسته می‌تواند پیش از فراخوانی
رندرکننده تطبیق دهد:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

هسته پیش از رندر، محدودیت‌های عمومی را روی کنترل‌های معنایی اعمال می‌کند. رندرکننده‌ها
همچنان مالک اعتبارسنجی و برش نهایی مختص ارائه‌دهنده برای تعداد block بومی،
اندازه کارت، محدودیت‌های URL، و ویژگی‌های خاص ارائه‌دهنده هستند که در
قرارداد عمومی قابل بیان نیستند. اگر محدودیت‌ها همه کنترل‌های یک block را حذف کنند، هسته
برچسب‌ها را به‌عنوان متن زمینه غیرتعاملی نگه می‌دارد تا پیام تحویل‌شده همچنان
یک fallback قابل مشاهده داشته باشد.

## جریان رندر هسته

وقتی یک `ReplyPayload` یا کنش پیام شامل `presentation` باشد، هسته:

1. payload ارائه را نرمال می‌کند.
2. آداپتر خروجی کانال مقصد را resolve می‌کند.
3. `presentationCapabilities` را می‌خواند.
4. وقتی آداپتر آن‌ها را اعلام کرده باشد، محدودیت‌های قابلیت عمومی مانند تعداد کنش، طول برچسب، و
   تعداد گزینه‌های انتخاب را اعمال می‌کند.
5. وقتی آداپتر بتواند payload را رندر کند، `renderPresentation` را فراخوانی می‌کند.
6. وقتی آداپتر غایب باشد یا نتواند رندر کند، به متن محافظه‌کارانه fallback می‌کند.
7. payload حاصل را از مسیر عادی تحویل کانال ارسال می‌کند.
8. پس از نخستین پیام ارسالی موفق، metadata تحویل مانند `delivery.pin` را اعمال می‌کند.

هسته مالک رفتار fallback است تا تولیدکنندگان بتوانند نسبت به کانال بی‌طرف بمانند. Pluginهای کانال
مالک رندر بومی و مدیریت تعامل هستند.

## قواعد تنزل

ارائه باید برای ارسال روی کانال‌های محدود امن باشد.

متن fallback شامل این موارد است:

- `title` به‌عنوان خط اول
- blockهای `text` به‌عنوان پاراگراف‌های عادی
- blockهای `context` به‌عنوان خطوط زمینه فشرده
- blockهای `divider` به‌عنوان جداکننده دیداری
- برچسب‌های دکمه، شامل URLها برای دکمه‌های پیوند
- برچسب‌های گزینه‌های انتخاب

کنترل‌های بومی پشتیبانی‌نشده باید تنزل پیدا کنند، نه اینکه کل ارسال را ناموفق کنند.
نمونه‌ها:

- Telegram با دکمه‌های inline غیرفعال، fallback متنی ارسال می‌کند.
- کانالی بدون پشتیبانی انتخاب، گزینه‌های انتخاب را به‌صورت متن فهرست می‌کند.
- یک دکمه فقط-URL یا به دکمه پیوند بومی تبدیل می‌شود یا به خط URL fallback.
- شکست‌های اختیاری سنجاق‌کردن، پیام تحویل‌شده را ناموفق نمی‌کنند.

استثنای اصلی `delivery.pin.required: true` است؛ اگر سنجاق‌کردن به‌عنوان
الزامی درخواست شود و کانال نتواند پیام ارسالی را سنجاق کند، تحویل شکست را گزارش می‌کند.

## نگاشت ارائه‌دهنده

رندرکننده‌های bundled فعلی:

| کانال           | هدف رندر بومی                      | نکات                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | کامپوننت‌ها و محفظه‌های کامپوننت    | `channelData.discord.components` قدیمی را برای تولیدکنندگان payload بومی ارائه‌دهنده موجود حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند. |
| Slack           | Block Kit                           | `channelData.slack.blocks` قدیمی را برای تولیدکنندگان payload بومی ارائه‌دهنده موجود حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند.       |
| Telegram        | متن همراه صفحه‌کلیدهای inline       | دکمه‌ها/انتخاب‌ها برای سطح مقصد به قابلیت دکمه inline نیاز دارند؛ در غیر این صورت از fallback متنی استفاده می‌شود.                                         |
| Mattermost      | متن همراه props تعاملی              | blockهای دیگر به متن تنزل پیدا می‌کنند.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | وقتی هر دو ارائه شوند، متن ساده `message` همراه کارت گنجانده می‌شود.                                                                            |
| Feishu          | کارت‌های تعاملی                     | header کارت می‌تواند از `title` استفاده کند؛ body از تکرار آن عنوان پرهیز می‌کند.                                                                                  |
| کانال‌های ساده  | fallback متنی                       | کانال‌های بدون رندرکننده همچنان خروجی خوانا دریافت می‌کنند.                                                                                            |

سازگاری payload بومی ارائه‌دهنده یک امکان گذار برای تولیدکنندگان پاسخ موجود است. این دلیلی برای افزودن فیلدهای بومی مشترک جدید نیست.

## ارائه در برابر InteractiveReply

`InteractiveReply` زیرمجموعه داخلی قدیمی‌تری است که توسط helperهای تأیید و تعامل استفاده می‌شود. از این موارد پشتیبانی می‌کند:

- متن
- دکمه‌ها
- انتخاب‌ها

`MessagePresentation` قرارداد ارسال مشترک canonical است. این موارد را اضافه می‌کند:

- عنوان
- لحن
- زمینه
- جداکننده
- دکمه‌های فقط URL
- فراداده تحویل عمومی از طریق `ReplyPayload.delivery`

هنگام اتصال کدهای قدیمی‌تر، از helperهای `openclaw/plugin-sdk/interactive-runtime` استفاده کنید:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

کد جدید باید مستقیماً `MessagePresentation` را بپذیرد یا تولید کند. payloadهای موجود `interactive` زیرمجموعه منسوخ‌شده‌ای از `presentation` هستند؛ پشتیبانی runtime برای تولیدکنندگان قدیمی‌تر باقی می‌ماند.

نوع‌های legacy `InteractiveReply*` و helperهای تبدیل در SDK با `@deprecated` علامت‌گذاری شده‌اند:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, و
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` و
`presentationToInteractiveControlsReply(...)` همچنان به‌عنوان پل‌های رندرکننده برای پیاده‌سازی‌های کانال legacy در دسترس هستند. کد تولیدکننده جدید نباید آن‌ها را فراخوانی کند؛ `presentation` را ارسال کنید و اجازه دهید تطبیق هسته/کانال رندر را مدیریت کند.

helperهای تأیید نیز جایگزین‌های presentation-first دارند:

- به‌جای `buildApprovalInteractiveReplyFromActionDescriptors(...)` از `buildApprovalPresentationFromActionDescriptors(...)` استفاده کنید
- به‌جای `buildApprovalInteractiveReply(...)` از `buildApprovalPresentation(...)` استفاده کنید
- به‌جای `buildExecApprovalInteractiveReply(...)` از `buildExecApprovalPresentation(...)` استفاده کنید

`renderMessagePresentationFallbackText(...)` برای بلوک‌های ارائه‌ای که fallback متنی ندارند، مانند ارائه‌ای که فقط جداکننده دارد، رشته خالی برمی‌گرداند. transportهایی که بدنه ارسال غیرخالی لازم دارند می‌توانند `emptyFallback` را پاس بدهند تا بدون تغییر قرارداد fallback پیش‌فرض، یک بدنه حداقلی را انتخاب کنند.

## پین تحویل

پین کردن رفتار تحویل است، نه ارائه. به‌جای فیلدهای بومی ارائه‌دهنده مانند `channelData.telegram.pin` از `delivery.pin` استفاده کنید.

معناشناسی:

- `pin: true` نخستین پیام با تحویل موفق را پین می‌کند.
- مقدار پیش‌فرض `pin.notify` برابر `false` است.
- مقدار پیش‌فرض `pin.required` برابر `false` است.
- شکست‌های اختیاری پین degrade می‌شوند و پیام ارسال‌شده را دست‌نخورده باقی می‌گذارند.
- شکست‌های پین الزامی باعث شکست تحویل می‌شوند.
- پیام‌های قطعه‌بندی‌شده نخستین قطعه تحویل‌شده را پین می‌کنند، نه قطعه پایانی را.

actionهای پیام دستی `pin`، `unpin` و `pins` همچنان برای پیام‌های موجودی که ارائه‌دهنده از آن عملیات پشتیبانی می‌کند وجود دارند.

## چک‌لیست نویسنده Plugin

- وقتی کانال می‌تواند ارائه معنایی را رندر کند یا به‌شکل امن degrade کند، `presentation` را از `describeMessageTool(...)` اعلام کنید.
- `presentationCapabilities` را به adapter خروجی runtime اضافه کنید.
- `renderPresentation` را در کد runtime پیاده‌سازی کنید، نه در کد راه‌اندازی Plugin در control-plane.
- کتابخانه‌های UI بومی را از مسیرهای داغ راه‌اندازی/کاتالوگ دور نگه دارید.
- وقتی محدودیت‌های قابلیت عمومی شناخته‌شده هستند، آن‌ها را روی `presentationCapabilities.limits` اعلام کنید.
- محدودیت‌های نهایی پلتفرم را در رندرکننده و تست‌ها حفظ کنید.
- برای دکمه‌های پشتیبانی‌نشده، انتخاب‌ها، دکمه‌های URL، تکرار عنوان/متن، و ارسال‌های ترکیبی `message` به‌همراه `presentation`، تست fallback اضافه کنید.
- پشتیبانی پین تحویل را از طریق `deliveryCapabilities.pin` و `pinDeliveredMessage` فقط زمانی اضافه کنید که ارائه‌دهنده بتواند شناسه پیام ارسال‌شده را پین کند.
- فیلدهای card/block/component/button بومی ارائه‌دهنده جدید را از طریق schema مشترک action پیام expose نکنید.

## اسناد مرتبط

- [CLI پیام](/fa/cli/message)
- [نمای کلی SDK Plugin](/fa/plugins/sdk-overview)
- [معماری Plugin](/fa/plugins/architecture-internals#message-tool-schemas)
- [طرح بازآرایی ارائه کانال](/fa/plan/ui-channels)
