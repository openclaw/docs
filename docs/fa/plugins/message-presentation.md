---
read_when:
    - افزودن یا تغییر رندر کردن کارت پیام، دکمه یا انتخابگر
    - ساخت یک Plugin کانال که از پیام‌های خروجی غنی پشتیبانی می‌کند
    - تغییر ارائهٔ ابزار پیام یا قابلیت‌های تحویل
    - اشکال‌زدایی پس‌رفت‌های رندر کارت/بلوک/مؤلفه مخصوص ارائه‌دهنده
summary: کارت‌های پیام معنایی، دکمه‌ها، انتخاب‌گرها، متن جایگزین، و راهنماهای تحویل برای Pluginهای کانال
title: ارائهٔ پیام
x-i18n:
    generated_at: "2026-07-02T22:40:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

ارائهٔ پیام قرارداد مشترک OpenClaw برای رابط کاربری گفت‌وگوی خروجی غنی است.
این امکان را به عامل‌ها، فرمان‌های CLI، جریان‌های تأیید و Pluginها می‌دهد که نیت پیام را
یک بار توصیف کنند، در حالی که هر Plugin کانال بهترین شکل بومی ممکن را رندر می‌کند.

از ارائه برای رابط کاربری پیام قابل‌حمل استفاده کنید:

- بخش‌های متن
- متن کوتاه زمینه/پاورقی
- جداکننده‌ها
- دکمه‌ها
- منوهای انتخاب
- عنوان و لحن کارت

فیلدهای بومیِ ارائه‌دهندهٔ جدید مانند Discord `components`، Slack
`blocks`، Telegram `buttons`، Teams `card` یا Feishu `card` را به ابزار پیام
مشترک اضافه نکنید. این‌ها خروجی‌های رندرکننده هستند که مالک آن‌ها Plugin کانال است.

## قرارداد

نویسندگان Plugin قرارداد عمومی را از این‌جا وارد می‌کنند:

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

- `action.type: "command"` یک فرمان اسلش بومی را از مسیر فرمان هسته اجرا می‌کند.
  از این برای دکمه‌ها و منوهای فرمان داخلی استفاده کنید.
- `action.type: "callback"` دادهٔ مبهم Plugin را از مسیر تعامل کانال عبور می‌دهد.
  Pluginهای کانال نباید دادهٔ callback را به‌عنوان فرمان‌های اسلش بازتفسیر کنند.
- `value` مقدار مبهم callback قدیمی است. کنترل‌های جدید باید از `action` استفاده کنند
  تا Pluginهای کانال بتوانند فرمان‌ها و callbackها را بدون حدس‌زدن از متن نگاشت کنند.
- `url` یک دکمهٔ پیوند است. می‌تواند بدون `value` وجود داشته باشد.
- `webApp` یک دکمهٔ وب‌اپ بومیِ کانال را توصیف می‌کند. Telegram این را
  به‌صورت `web_app` رندر می‌کند و فقط در گفت‌وگوهای خصوصی از آن پشتیبانی می‌کند. `web_app` هنوز
  برای سازگاری در payloadهای JSON آزاد پذیرفته می‌شود، اما تولیدکنندگان TypeScript
  باید از `webApp` استفاده کنند.
- `label` الزامی است و در fallback متنی نیز استفاده می‌شود.
- `style` پیشنهادی است. رندرکننده‌ها باید سبک‌های پشتیبانی‌نشده را به یک پیش‌فرض امن
  نگاشت کنند، نه اینکه ارسال را ناموفق کنند.
- `priority` اختیاری است. وقتی کانالی محدودیت‌های اقدام را اعلام می‌کند و کنترل‌ها
  باید حذف شوند، هسته ابتدا دکمه‌های با اولویت بالاتر را نگه می‌دارد و ترتیب
  اصلی را میان دکمه‌های با اولویت برابر حفظ می‌کند. وقتی همهٔ کنترل‌ها جا می‌شوند،
  ترتیب نوشته‌شده حفظ می‌شود.
- `disabled` اختیاری است. کانال‌ها باید با `supportsDisabled` صریحاً پشتیبانی را اعلام کنند؛ در غیر این صورت
  هسته کنترل غیرفعال را به متن fallback غیرتعاملی تنزل می‌دهد.
- `reusable` اختیاری است. کانال‌هایی که از callbackهای بومی قابل‌استفادهٔ مجدد پشتیبانی می‌کنند، می‌توانند
  اقدام را پس از یک تعامل موفق همچنان در دسترس نگه دارند. از آن برای
  اقدام‌های تکرارپذیر یا idempotent مانند تازه‌سازی، بازرسی یا جزئیات بیشتر استفاده کنید؛
  برای تأییدهای عادی یک‌باره و اقدام‌های مخرب آن را تنظیم‌نشده بگذارید.

معنای انتخاب:

- `options[].action` همان معنای فرمان/callback مانند `action` دکمه را دارد.
- `options[].value` مقدار برنامهٔ انتخاب‌شدهٔ قدیمی است.
- `placeholder` پیشنهادی است و ممکن است توسط کانال‌هایی که پشتیبانی انتخاب بومی ندارند
  نادیده گرفته شود.
- اگر کانالی از انتخاب‌ها پشتیبانی نکند، متن fallback برچسب‌ها را فهرست می‌کند.

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

دکمهٔ پیوند فقط-URL:

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

دکمهٔ Mini App در Telegram:

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

بولین‌های قابلیت توصیف می‌کنند که رندرکننده چه چیزهایی را می‌تواند تعاملی کند. `limits` اختیاری
پاکت عمومی‌ای را توصیف می‌کند که هسته می‌تواند پیش از فراخوانی
رندرکننده سازگار کند:

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
همچنان مالک اعتبارسنجی و برش نهاییِ ویژهٔ ارائه‌دهنده برای شمار بلوک بومی،
اندازهٔ کارت، محدودیت‌های URL، و ویژگی‌های خاص ارائه‌دهنده هستند که نمی‌توانند در
قرارداد عمومی بیان شوند. اگر محدودیت‌ها همهٔ کنترل‌ها را از یک بلوک حذف کنند، هسته
برچسب‌ها را به‌عنوان متن زمینهٔ غیرتعاملی نگه می‌دارد تا پیام تحویل‌شده همچنان یک
fallback قابل‌مشاهده داشته باشد.

## جریان رندر هسته

وقتی یک `ReplyPayload` یا اقدام پیام شامل `presentation` باشد، هسته:

1. payload ارائه را نرمال‌سازی می‌کند.
2. آداپتر خروجی کانال هدف را resolve می‌کند.
3. `presentationCapabilities` را می‌خواند.
4. محدودیت‌های قابلیت عمومی مانند شمار اقدام، طول برچسب و
   شمار گزینه‌های انتخاب را وقتی آداپتر آن‌ها را اعلام می‌کند اعمال می‌کند.
5. وقتی آداپتر بتواند payload را رندر کند، `renderPresentation` را فراخوانی می‌کند.
6. وقتی آداپتر وجود نداشته باشد یا نتواند رندر کند، به متن محافظه‌کارانه fallback می‌کند.
7. payload حاصل را از مسیر عادی تحویل کانال ارسال می‌کند.
8. metadata تحویل مانند `delivery.pin` را پس از نخستین پیام ارسال‌شدهٔ موفق
   اعمال می‌کند.

هسته مالک رفتار fallback است تا تولیدکنندگان بتوانند نسبت به کانال بی‌طرف بمانند. Pluginهای کانال
مالک رندر بومی و مدیریت تعامل هستند.

## قواعد تنزل

ارائه باید برای ارسال روی کانال‌های محدود امن باشد.

متن fallback شامل این‌هاست:

- `title` به‌عنوان خط اول
- بلوک‌های `text` به‌عنوان بندهای عادی
- بلوک‌های `context` به‌عنوان خط‌های زمینهٔ فشرده
- بلوک‌های `divider` به‌عنوان جداکنندهٔ بصری
- برچسب‌های دکمه، شامل URLها برای دکمه‌های پیوند
- برچسب‌های گزینهٔ انتخاب

### نمایانی fallback مقدار دکمه

وقتی کانالی نتواند کنترل‌های تعاملی را رندر کند، مقدارهای دکمه و انتخاب
به متن ساده fallback می‌کنند. رفتار fallback قابلیت استفاده را حفظ می‌کند و هم‌زمان
دادهٔ مبهم callback را خصوصی نگه می‌دارد:

- اقدام‌های دارای نوع **`command`** به‌صورت `label: \`command\`` رندر می‌شوند تا کاربران بتوانند
  فرمان را کپی کنند و آن را دستی در ورودی کانال اجرا کنند.
- اقدام‌های دارای نوع **`callback`** و فیلدهای **`value`** قدیمی فقط به‌صورت
  برچسب رندر می‌شوند. مقدار مبهم callback در متن fallback آشکار نمی‌شود.
- دکمه‌های **`url` / `webApp`** متن URL را در کنار برچسب دکمه
  رندر می‌کنند، چون URL برای کاربر قابل‌مشاهده است.
- **گزینه‌های انتخاب** فقط به‌صورت برچسب رندر می‌شوند. مقدار گزینهٔ زیربنایی در
  متن fallback آشکار نمی‌شود.

آداپترهای کانالی که در رابط fallback خود راهنمای فرمان دستی اضافه می‌کنند (مثلاً
دستورالعمل‌های دیدگاه سند Feishu) باید بررسی وجود فرمان را از همان بلوک‌های ارائه‌ای
استخراج کنند که رندرکنندهٔ fallback استفاده می‌کند، تا متن راهنما فقط زمانی ظاهر شود
که یک فرمان دستی واقعاً نشان داده شده باشد.

کنترل‌های بومی پشتیبانی‌نشده باید تنزل پیدا کنند، نه اینکه کل ارسال را ناموفق کنند.
مثال‌ها:

- Telegram با دکمه‌های inline غیرفعال، fallback متنی ارسال می‌کند.
- کانالی بدون پشتیبانی انتخاب، گزینه‌های انتخاب را به‌صورت متن فهرست می‌کند.
- دکمهٔ فقط-URL یا به دکمهٔ پیوند بومی تبدیل می‌شود یا به خط URL fallback.
- شکست‌های اختیاری سنجاق‌کردن، پیام تحویل‌شده را ناموفق نمی‌کنند.

استثنای اصلی `delivery.pin.required: true` است؛ اگر سنجاق‌کردن به‌عنوان
الزامی درخواست شود و کانال نتواند پیام ارسال‌شده را سنجاق کند، تحویل شکست را گزارش می‌کند.

## نگاشت ارائه‌دهنده

رندرکننده‌های بسته‌بندی‌شدهٔ فعلی:

| کانال           | هدف رندر بومی                      | یادداشت‌ها                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | کامپوننت‌ها و کانتینرهای کامپوننت | `channelData.discord.components` قدیمی را برای تولیدکنندگان payload بومیِ provider موجود حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند. |
| Slack           | Block Kit                           | `channelData.slack.blocks` قدیمی را برای تولیدکنندگان payload بومیِ provider موجود حفظ می‌کند، اما ارسال‌های مشترک جدید باید از `presentation` استفاده کنند.       |
| Telegram        | متن به‌همراه صفحه‌کلیدهای درون‌خطی | دکمه‌ها/انتخاب‌گرها برای سطح هدف به قابلیت دکمه درون‌خطی نیاز دارند؛ در غیر این صورت از fallback متنی استفاده می‌شود.                                         |
| Mattermost      | متن به‌همراه props تعاملی          | بلاک‌های دیگر به متن تنزل پیدا می‌کنند.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | وقتی هر دو ارائه شوند، متن ساده `message` همراه کارت گنجانده می‌شود.                                                                            |
| Feishu          | کارت‌های تعاملی                    | سربرگ کارت می‌تواند از `title` استفاده کند؛ بدنه از تکرار آن عنوان پرهیز می‌کند.                                                                                  |
| کانال‌های ساده  | fallback متنی                       | کانال‌های بدون renderer همچنان خروجی خوانا دریافت می‌کنند.                                                                                            |

سازگاری payload بومیِ provider یک امکان گذار برای تولیدکنندگان پاسخ موجود
است. این دلیلی برای افزودن فیلدهای بومی مشترک جدید نیست.

## Presentation در برابر InteractiveReply

`InteractiveReply` زیرمجموعه داخلی قدیمی‌تری است که توسط helperهای تأیید و تعامل
استفاده می‌شود. از این موارد پشتیبانی می‌کند:

- متن
- دکمه‌ها
- انتخاب‌گرها

`MessagePresentation` قرارداد ارسال مشترک canonical است. این موارد را اضافه می‌کند:

- عنوان
- tone
- context
- جداکننده
- دکمه‌های فقط URL
- فراداده تحویل عمومی از طریق `ReplyPayload.delivery`

هنگام bridge کردن کد قدیمی‌تر، از helperهای `openclaw/plugin-sdk/interactive-runtime` استفاده کنید:
__OC_I18N_900011__
کد جدید باید `MessagePresentation` را مستقیماً بپذیرد یا تولید کند. payloadهای
`interactive` موجود زیرمجموعه‌ای deprecated از `presentation` هستند؛ پشتیبانی runtime
برای تولیدکنندگان قدیمی‌تر باقی می‌ماند.

نوع‌های قدیمی `InteractiveReply*` و helperهای تبدیل در SDK با
`@deprecated` علامت‌گذاری شده‌اند:

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
`presentationToInteractiveControlsReply(...)` همچنان به‌عنوان bridgeهای renderer
برای پیاده‌سازی‌های قدیمی کانال در دسترس می‌مانند. کد تولیدکننده جدید نباید آن‌ها را
فراخوانی کند؛ `presentation` را ارسال کنید و اجازه دهید adaptation هسته/کانال رندر را انجام دهد.

helperهای تأیید نیز جایگزین‌های presentation-first دارند:

- به‌جای `buildApprovalInteractiveReplyFromActionDescriptors(...)` از
  `buildApprovalPresentationFromActionDescriptors(...)` استفاده کنید
- به‌جای `buildApprovalInteractiveReply(...)` از
  `buildApprovalPresentation(...)` استفاده کنید
- به‌جای `buildExecApprovalInteractiveReply(...)` از
  `buildExecApprovalPresentation(...)` استفاده کنید

`renderMessagePresentationFallbackText(...)` برای بلاک‌های presentation که fallback
متنی ندارند، مانند presentation فقط شامل جداکننده، رشته خالی برمی‌گرداند. transportهایی
که به بدنه ارسال غیرخالی نیاز دارند می‌توانند `emptyFallback` را پاس بدهند تا بدون تغییر
قرارداد fallback پیش‌فرض، از یک بدنه حداقلی استفاده کنند.

## پین تحویل

پین کردن رفتار تحویل است، نه presentation. به‌جای فیلدهای بومیِ provider مانند
`channelData.telegram.pin` از `delivery.pin` استفاده کنید.

معناشناسی:

- `pin: true` نخستین پیام با تحویل موفق را پین می‌کند.
- مقدار پیش‌فرض `pin.notify` برابر `false` است.
- مقدار پیش‌فرض `pin.required` برابر `false` است.
- شکست‌های اختیاری پین degrade می‌شوند و پیام ارسال‌شده را دست‌نخورده باقی می‌گذارند.
- شکست‌های پین اجباری باعث شکست تحویل می‌شوند.
- پیام‌های chunk شده نخستین chunk تحویل‌شده را پین می‌کنند، نه chunk پایانی.

اکشن‌های پیام دستی `pin`، `unpin` و `pins` همچنان برای پیام‌های موجودی که provider
از آن عملیات‌ها پشتیبانی می‌کند وجود دارند.

## چک‌لیست نویسنده Plugin

- وقتی کانال می‌تواند presentation معنایی را رندر کند یا به‌طور ایمن degrade کند،
  `presentation` را از `describeMessageTool(...)` اعلام کنید.
- `presentationCapabilities` را به آداپتر outbound runtime اضافه کنید.
- `renderPresentation` را در کد runtime پیاده‌سازی کنید، نه در کد setup مربوط به Plugin در control-plane.
- کتابخانه‌های UI بومی را از مسیرهای hot setup/catalog دور نگه دارید.
- وقتی محدودیت‌های capability عمومی شناخته‌شده هستند، آن‌ها را روی `presentationCapabilities.limits` اعلام کنید.
- محدودیت‌های نهایی پلتفرم را در renderer و تست‌ها حفظ کنید.
- برای دکمه‌ها، انتخاب‌گرها، دکمه‌های URL، تکرار عنوان/متن و ارسال‌های ترکیبی `message` به‌علاوه `presentation` که پشتیبانی نمی‌شوند، تست fallback اضافه کنید.
- پشتیبانی پین تحویل را فقط وقتی provider می‌تواند شناسه پیام ارسال‌شده را پین کند، از طریق `deliveryCapabilities.pin` و
  `pinDeliveredMessage` اضافه کنید.
- فیلدهای کارت/بلاک/کامپوننت/دکمه بومیِ provider جدید را از طریق schema اکشن پیام مشترک expose نکنید.

## مستندات مرتبط

- [Message CLI](/fa/cli/message)
- [مرور کلی SDK Plugin](/fa/plugins/sdk-overview)
- [معماری Plugin](/fa/plugins/architecture-internals#message-tool-schemas)
- [طرح بازطراحی Presentation کانال](/fa/plan/ui-channels)
