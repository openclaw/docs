---
read_when:
    - راه‌اندازی Mattermost
    - اشکال‌زدایی مسیریابی Mattermost
sidebarTitle: Mattermost
summary: راه‌اندازی ربات Mattermost و پیکربندی OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T09:39:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

وضعیت: Plugin قابل دانلود (توکن ربات + رویدادهای WebSocket). کانال‌ها، کانال‌های خصوصی، پیام‌های مستقیم گروهی و پیام‌های مستقیم پشتیبانی می‌شوند. Mattermost یک پلتفرم پیام‌رسانی تیمی با قابلیت میزبانی شخصی است ([mattermost.com](https://mattermost.com)).

## نصب

<Tabs>
  <Tab title="رجیستری npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="نسخه محلی مخزن">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

<Steps>
  <Step title="از دردسترس‌بودن Plugin مطمئن شوید">
    با فرمان بالا `@openclaw/mattermost` را نصب کنید، سپس اگر Gateway از قبل در حال اجرا است، آن را راه‌اندازی مجدد کنید.
  </Step>
  <Step title="یک ربات Mattermost ایجاد کنید">
    یک حساب ربات Mattermost ایجاد کنید، **توکن ربات** را کپی کنید و ربات را به تیم‌ها و کانال‌هایی که باید بخواند اضافه کنید.
  </Step>
  <Step title="نشانی پایه را کپی کنید">
    **نشانی پایه** Mattermost را کپی کنید (برای نمونه، `https://chat.example.com`). پسوند `/api/v4` به‌طور خودکار حذف می‌شود.
  </Step>
  <Step title="OpenClaw را پیکربندی و Gateway را راه‌اندازی کنید">
    حداقل پیکربندی:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    روش جایگزین غیرتعاملی:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
برای Mattermost خودمیزبان روی نشانی خصوصی/LAN/tailnet: درخواست‌های خروجی API مربوط به Mattermost از محافظ SSRF عبور می‌کنند که به‌طور پیش‌فرض IPهای خصوصی و داخلی را مسدود می‌کند. با `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` آن را فعال کنید (برای هر حساب: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## فرمان‌های اسلش بومی

فرمان‌های اسلش بومی اختیاری هستند. وقتی فعال شوند، OpenClaw فرمان‌های اسلش `oc_*` را در همه تیم‌هایی که ربات عضو آن‌ها است ثبت می‌کند و درخواست‌های POST فراخوانی برگشتی را روی سرور HTTP مربوط به Gateway دریافت می‌کند.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

فرمان‌های ثبت‌شده: `/oc_status`، `/oc_model`، `/oc_models`، `/oc_new`، `/oc_help`، `/oc_think`، `/oc_reasoning`، `/oc_verbose`، `/oc_queue`. با `nativeSkills: true`، فرمان‌های Skills نیز به‌شکل `/oc_<skill>` ثبت می‌شوند.

<AccordionGroup>
  <Accordion title="نکات رفتاری">
    - مقدار پیش‌فرض `native` و `nativeSkills` برابر با `"auto"` است که برای Mattermost به حالت غیرفعال تبدیل می‌شود. آن‌ها را صریحاً روی `true` تنظیم کنید.
    - مقدار پیش‌فرض `callbackPath` برابر با `/api/channels/mattermost/command` است.
    - اگر `callbackUrl` مشخص نشده باشد، OpenClaw آن را به‌شکل `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` می‌سازد. میزبان‌های اتصال عام (`0.0.0.0`، `::`) به `localhost` برمی‌گردند.
    - در راه‌اندازی‌های چندحسابی، `commands` را می‌توان در سطح بالا یا زیر `channels.mattermost.accounts.<id>.commands` تنظیم کرد (مقادیر حساب، فیلدهای سطح بالا را لغو می‌کنند).
    - فرمان‌های اسلش موجود با محرک یکسان که توسط یکپارچه‌سازی‌های دیگر ایجاد شده‌اند، بدون تغییر باقی می‌مانند (هنگام ثبت نادیده گرفته می‌شوند)؛ فرمان‌هایی که ربات ایجاد کرده است، هنگام تغییر نشانی فراخوانی برگشتی به‌روزرسانی یا دوباره ایجاد می‌شوند.
    - فراخوانی‌های برگشتی فرمان با توکن اختصاصی هر فرمان که هنگام ثبت فرمان‌های `oc_*` توسط Mattermost بازگردانده می‌شود، اعتبارسنجی می‌شوند.
    - OpenClaw پیش از پذیرش هر فراخوانی برگشتی، ثبت فعلی فرمان Mattermost را تازه‌سازی می‌کند؛ بنابراین توکن‌های منسوخ فرمان‌های اسلش حذف‌شده یا بازتولیدشده، بدون نیاز به راه‌اندازی مجدد Gateway دیگر پذیرفته نمی‌شوند.
    - اگر API مربوط به Mattermost نتواند تأیید کند که فرمان همچنان فعلی است، اعتبارسنجی فراخوانی برگشتی به‌صورت بسته شکست می‌خورد؛ اعتبارسنجی‌های ناموفق برای مدت کوتاهی در حافظه نهان ذخیره می‌شوند، جست‌وجوهای هم‌زمان ادغام می‌شوند و شروع جست‌وجوی تازه برای هر فرمان محدودیت نرخ دارد تا فشار بازپخش مهار شود.
    - فراخوانی‌های برگشتی اسلش زمانی به‌صورت بسته شکست می‌خورند که ثبت ناموفق بوده، راه‌اندازی ناقص بوده یا توکن فراخوانی برگشتی با توکن ثبت‌شده فرمان حل‌شده مطابقت نداشته باشد (توکنی که برای یک فرمان معتبر است، نمی‌تواند برای فرمان دیگری به اعتبارسنجی بالادستی برسد).
    - دریافت فراخوانی‌های برگشتی پذیرفته‌شده با پاسخ موقت «در حال پردازش...» تأیید می‌شود؛ پاسخ واقعی به‌شکل یک پیام عادی می‌رسد.

  </Accordion>
  <Accordion title="الزام دسترسی‌پذیری">
    نقطه پایانی فراخوانی برگشتی باید از سرور Mattermost قابل دسترسی باشد.

    - `callbackUrl` را روی `localhost` تنظیم نکنید، مگر اینکه Mattermost در همان میزبان/فضای نام شبکه OpenClaw اجرا شود.
    - `callbackUrl` را روی نشانی پایه Mattermost خود تنظیم نکنید، مگر اینکه آن نشانی `/api/channels/mattermost/command` را از طریق پراکسی معکوس به OpenClaw هدایت کند.
    - برای بررسی سریع، از `curl https://<gateway-host>/api/channels/mattermost/command` استفاده کنید؛ یک درخواست GET باید از OpenClaw پاسخ `405 Method Not Allowed` دریافت کند، نه `404`.

  </Accordion>
  <Accordion title="فهرست مجاز خروجی Mattermost">
    اگر مقصد فراخوانی برگشتی شما نشانی‌های خصوصی/tailnet/داخلی است، `ServiceSettings.AllowedUntrustedInternalConnections` را در Mattermost طوری تنظیم کنید که میزبان/دامنه فراخوانی برگشتی را دربرگیرد.

    از ورودی‌های میزبان/دامنه استفاده کنید، نه نشانی‌های کامل.

    - درست: `gateway.tailnet-name.ts.net`
    - نادرست: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## متغیرهای محیطی (حساب پیش‌فرض)

اگر متغیرهای محیطی را ترجیح می‌دهید، این موارد را روی میزبان Gateway تنظیم کنید:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
متغیرهای محیطی فقط برای حساب **پیش‌فرض** (`default`) اعمال می‌شوند. حساب‌های دیگر باید از مقادیر پیکربندی استفاده کنند.

`MATTERMOST_URL` را نمی‌توان از فایل `.env` فضای کاری تنظیم کرد؛ [فایل‌های ‎.env فضای کاری](/fa/gateway/security) را ببینید.
</Note>

## حالت‌های گفتگو

Mattermost به‌طور خودکار به پیام‌های مستقیم پاسخ می‌دهد. رفتار کانال با `chatmode` کنترل می‌شود:

<Tabs>
  <Tab title="oncall (پیش‌فرض)">
    فقط هنگام اشاره با @ در کانال‌ها پاسخ بده.
  </Tab>
  <Tab title="onmessage">
    به همه پیام‌های کانال پاسخ بده.
  </Tab>
  <Tab title="onchar">
    وقتی پیام با پیشوند محرک شروع می‌شود پاسخ بده.
  </Tab>
</Tabs>

نمونه پیکربندی:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // default
    },
  },
}
```

نکات:

- `onchar` همچنان به اشاره‌های صریح با @ پاسخ می‌دهد.
- `channels.mattermost.requireMention` همچنان رعایت می‌شود، اما `chatmode` ترجیح داده می‌شود. تنظیمات مختص هر کانال در `groups.<channelId>.requireMention` بر هر دو اولویت دارند.
- پس از اینکه ربات در یک رشته کانال پاسخی قابل مشاهده ارسال کند، پیام‌های بعدی در همان رشته بدون اشاره جدید با @ یا پیشوند `onchar` پاسخ داده می‌شوند تا گفتگوهای چندنوبتی رشته بدون وقفه ادامه یابند. مشارکت تا ۷ روز پس از آخرین پاسخ ربات در آن رشته به خاطر سپرده می‌شود و پس از راه‌اندازی مجدد Gateway نیز باقی می‌ماند. رشته‌هایی که ربات فقط مشاهده کرده است، تحت تأثیر قرار نمی‌گیرند؛ برای اینکه دوباره اشاره صریح لازم باشد، یک پیام سطح‌بالای جدید آغاز کنید.

## رشته‌ها و نشست‌ها

از `channels.mattermost.replyToMode` استفاده کنید تا کنترل کنید پاسخ‌های کانال و گروه در کانال اصلی بمانند یا زیر پست محرک، رشته‌ای را آغاز کنند.

- `off` (پیش‌فرض): فقط زمانی در یک رشته پاسخ بده که پست ورودی از قبل در یک رشته باشد.
- `first`: برای پست‌های سطح‌بالای کانال/گروه، زیر آن پست یک رشته آغاز کن و گفتگو را به نشستی محدود به آن رشته هدایت کن.
- `all` و `batched`: در حال حاضر برای Mattermost رفتاری مشابه `first` دارند، زیرا وقتی Mattermost ریشه رشته داشته باشد، بخش‌های بعدی پاسخ و رسانه‌ها در همان رشته ادامه می‌یابند.
- حتی در صورت تنظیم `replyToMode`، مقدار پیش‌فرض پیام‌های مستقیم `off` است.

برای لغو حالت در گفتگوهای `direct`، `group` یا `channel` از `channels.mattermost.replyToModeByChatType` استفاده کنید. برای واردکردن پیام‌های مستقیم به حالت رشته‌ای، `direct` را تنظیم کنید:

- `off` (پیش‌فرض): پیام‌های مستقیم بدون رشته و در یک نشست پیوسته باقی می‌مانند.
- `first`، `all` یا `batched`: هر پیام مستقیم سطح‌بالا یک رشته Mattermost را آغاز می‌کند که از یک نشست تازه و مستقل پشتیبانی می‌شود.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

نکات:

- نشست‌های محدود به رشته، شناسه پست محرک را به‌عنوان ریشه رشته استفاده می‌کنند.
- `first` و `all` در حال حاضر یکسان هستند، زیرا وقتی Mattermost ریشه رشته داشته باشد، بخش‌های بعدی پاسخ و رسانه‌ها در همان رشته ادامه می‌یابند.
- لغوهای مختص نوع گفتگو بر `replyToMode` اولویت دارند. بدون لغو `direct`، استقرارهای موجود پیام‌های مستقیم را تخت و بدون رشته نگه می‌دارند.

## کنترل دسترسی (پیام‌های مستقیم)

- پیش‌فرض: `channels.mattermost.dmPolicy = "pairing"` (فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند). مقادیر دیگر: `allowlist`، `open`، `disabled`.
- تأیید از طریق:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- پیام‌های مستقیم عمومی: `channels.mattermost.dmPolicy="open"` به‌همراه `channels.mattermost.allowFrom=["*"]` (طرحواره پیکربندی استفاده از نویسه عام را الزامی می‌کند).
- `channels.mattermost.allowFrom` شناسه‌های کاربر (توصیه‌شده) و ورودی‌های `accessGroup:<name>` را می‌پذیرد. [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کانال‌ها (گروه‌ها)

- پیش‌فرض: `channels.mattermost.groupPolicy = "allowlist"` (نیازمند اشاره).
- فرستندگان را با `channels.mattermost.groupAllowFrom` در فهرست مجاز قرار دهید (شناسه کاربر توصیه می‌شود).
- `channels.mattermost.groupAllowFrom` ورودی‌های `accessGroup:<name>` را می‌پذیرد. [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.
- لغو نیاز به اشاره برای هر کانال در `channels.mattermost.groups.<channelId>.requireMention` قرار می‌گیرد؛ برای مقدار پیش‌فرض از `channels.mattermost.groups["*"].requireMention` استفاده کنید.
- تطبیق `@username` تغییرپذیر است و فقط هنگامی فعال می‌شود که `channels.mattermost.dangerouslyAllowNameMatching: true` باشد.
- کانال‌های باز: `channels.mattermost.groupPolicy="open"` (نیازمند اشاره).
- ترتیب حل: `channels.mattermost.groupPolicy`، سپس `channels.defaults.groupPolicy`، سپس `"allowlist"`.
- نکته زمان اجرا: اگر بخش `channels.mattermost` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروه به‌صورت بسته روی `groupPolicy="allowlist"` شکست می‌خورد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد) و یک هشدار یک‌باره ثبت می‌کند.

نمونه:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## مقصدهای تحویل خروجی

از این قالب‌های مقصد با `openclaw message send` یا Cron/Webhookها استفاده کنید:

| مقصد                                | تحویل به                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | کانال بر اساس شناسه                                            |
| `channel:<name>` یا `#channel-name` | کانال بر اساس نام، با جست‌وجو در تیم‌هایی که ربات عضو آن‌ها است |
| `user:<id>` یا `mattermost:<id>`    | پیام مستقیم با آن کاربر                                       |
| `@username`                         | پیام مستقیم (نام کاربری از طریق API مربوط به Mattermost حل می‌شود) |

ارسال‌های خروجی حداکثر از یک پیوست در هر پیام پشتیبانی می‌کنند؛ چند فایل را در ارسال‌های جداگانه بفرستید.

<Warning>
شناسه‌های مبهم بدون پیشوند (مانند `64ifufp...`) در Mattermost **چندمعنا** هستند (شناسه کاربر یا شناسه کانال).

OpenClaw ابتدا آن‌ها را به‌عنوان **کاربر** حل می‌کند:

- اگر شناسه به‌عنوان کاربر وجود داشته باشد (`GET /api/v4/users/<id>` موفق شود)، OpenClaw با حل کانال مستقیم از طریق `/api/v4/channels/direct` یک **پیام مستقیم** ارسال می‌کند.
- در غیر این صورت، شناسه به‌عنوان **شناسه کانال** در نظر گرفته می‌شود.

اگر به رفتار قطعی نیاز دارید، همیشه از پیشوندهای صریح (`user:<id>` / `channel:<id>`) استفاده کنید.
</Warning>

## تلاش مجدد برای کانال پیام مستقیم

وقتی OpenClaw به مقصد پیام مستقیم Mattermost ارسال می‌کند و ابتدا باید کانال مستقیم را حل کند، به‌طور پیش‌فرض ایجاد ناموفق و موقتی کانال مستقیم را دوباره تلاش می‌کند.

برای تنظیم این رفتار به‌صورت سراسری برای Plugin مربوط به Mattermost از `channels.mattermost.dmChannelRetry` و برای یک حساب از `channels.mattermost.accounts.<id>.dmChannelRetry` استفاده کنید. مقادیر پیش‌فرض:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

نکات:

- این تنظیم فقط برای ایجاد کانال پیام مستقیم (`/api/v4/channels/direct`) اعمال می‌شود، نه برای همهٔ فراخوانی‌های API در Mattermost.
- تلاش‌های مجدد از عقب‌نشینی نمایی همراه با نوسان تصادفی استفاده می‌کنند و برای خطاهای گذرا مانند محدودیت نرخ، پاسخ‌های 5xx و خطاهای شبکه یا مهلت زمانی اعمال می‌شوند.
- خطاهای سمت کاربر 4xx به‌جز `429` دائمی در نظر گرفته می‌شوند و دوباره امتحان نمی‌شوند.

## پخش جریانی پیش‌نمایش

Mattermost فرایند تفکر، فعالیت ابزار و متن ناقص پاسخ را در یک **پست پیش‌نویس پیش‌نمایش** به‌صورت جریانی نمایش می‌دهد؛ این پست هنگامی که ارسال پاسخ نهایی ایمن باشد، در همان محل نهایی می‌شود. در حالت `partial`، پیش‌نمایش با همان شناسهٔ پست به‌روزرسانی می‌شود و به‌جای پر کردن کانال با پیام‌های جداگانه برای هر قطعه، همان پست را ویرایش می‌کند. در حالت `block`، پیش‌نمایش میان متن تکمیل‌شده و بلوک‌های فعالیت ابزار جابه‌جا می‌شود؛ بنابراین بلوک‌های قبلی به‌صورت پست‌های مستقل قابل مشاهده می‌مانند و بلوک بعدی آن‌ها را بازنویسی نمی‌کند. پاسخ‌های نهایی حاوی رسانه یا خطا، ویرایش‌های معلق پیش‌نمایش را لغو می‌کنند و به‌جای نهایی‌سازی یک پست پیش‌نمایش دورریختنی، از تحویل عادی استفاده می‌کنند.

پخش جریانی پیش‌نمایش در حالت `partial` **به‌طور پیش‌فرض فعال است**. آن را از طریق `channels.mattermost.streaming` پیکربندی کنید (یک رشتهٔ حالت، مقدار بولی یا شیئی مانند `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="حالت‌های پخش جریانی">
    - `partial` (پیش‌فرض): یک پست پیش‌نمایش که با افزایش متن پاسخ ویرایش می‌شود و سپس با پاسخ کامل نهایی می‌شود.
    - `block` پیش‌نمایش را میان متن تکمیل‌شده و بلوک‌های فعالیت ابزار جابه‌جا می‌کند؛ بنابراین هر بلوک به‌صورت پست مستقل قابل مشاهده می‌ماند و در همان محل بازنویسی نمی‌شود. به‌روزرسانی‌های موازی و متوالی ابزار از پست فعلی فعالیت ابزار به‌طور مشترک استفاده می‌کنند.
    - `progress` هنگام تولید، پیش‌نمایش وضعیت را نشان می‌دهد و پاسخ نهایی را فقط پس از تکمیل ارسال می‌کند.
    - `off` پخش جریانی پیش‌نمایش را غیرفعال می‌کند. با `blockStreaming: true`، بلوک‌های تکمیل‌شدهٔ دستیار همچنان به‌صورت پاسخ‌های بلوکی عادی (پست‌های جداگانه) تحویل داده می‌شوند، نه یک پست نهایی ادغام‌شده.

  </Accordion>
  <Accordion title="نکات رفتار پخش جریانی">
    - اگر جریان را نتوان در همان محل نهایی کرد (برای مثال، پست در میانهٔ جریان حذف شده باشد)، OpenClaw برای جلوگیری از ازدست‌رفتن پاسخ، یک پست نهایی تازه ارسال می‌کند.
    - محتوای صرفاً مربوط به تفکر از پست‌های کانال حذف می‌شود؛ از جمله متنی که به‌شکل نقل‌قول بلوکی `> Thinking` می‌رسد. برای مشاهدهٔ تفکر در سطوح دیگر، `/reasoning on` را تنظیم کنید؛ پست نهایی Mattermost فقط پاسخ را نگه می‌دارد.
    - برای ماتریس نگاشت کانال، به [پخش جریانی](/fa/concepts/streaming#preview-streaming-modes) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## واکنش‌ها (ابزار پیام)

- از `message action=react` با `channel=mattermost` استفاده کنید.
- `messageId` شناسهٔ پست Mattermost است.
- `emoji` نام‌هایی مانند `thumbsup` یا `:+1:` را می‌پذیرد (دونقطه‌ها اختیاری هستند).
- برای حذف یک واکنش، `remove=true` (بولی) را تنظیم کنید.
- رویدادهای افزودن/حذف واکنش، با رعایت همان بررسی‌های سیاست پیام مستقیم/گروه که برای پیام‌ها اعمال می‌شود، به‌صورت رویداد سیستمی به نشست عامل مسیریابی‌شده فرستاده می‌شوند.

مثال‌ها:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

پیکربندی:

- `channels.mattermost.actions.reactions`: فعال/غیرفعال‌کردن کنش‌های واکنش (پیش‌فرض true).
- بازنویسی برای هر حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## دکمه‌های تعاملی (ابزار پیام)

پیام‌هایی با دکمه‌های قابل کلیک ارسال کنید. وقتی کاربر روی دکمه‌ای کلیک می‌کند، عامل انتخاب را دریافت می‌کند و می‌تواند پاسخ دهد.

دکمه‌ها از محتوای معنایی `presentation` می‌آیند (در پاسخ‌های عادی عامل و در `message action=send`). OpenClaw دکمه‌های دارای مقدار را به‌صورت دکمه‌های تعاملی Mattermost نمایش می‌دهد، دکمه‌های URL را در متن پیام قابل مشاهده نگه می‌دارد و منوهای انتخاب را به متن خوانا تنزل می‌دهد.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

فیلدهای دکمهٔ ارائه:

<ParamField path="label" type="string" required>
  برچسب نمایشی (نام مستعار: `text`).
</ParamField>
<ParamField path="value" type="string">
  مقداری که هنگام کلیک بازگردانده می‌شود و به‌عنوان شناسهٔ کنش استفاده می‌شود (نام‌های مستعار: `callback_data`، `callbackData`). برای دکمهٔ قابل کلیک الزامی است، مگر اینکه `url` تنظیم شده باشد.
</ParamField>
<ParamField path="url" type="string">
  دکمهٔ پیوند؛ به‌جای دکمهٔ تعاملی، در بدنهٔ پیام به‌صورت متن `label: url` نمایش داده می‌شود.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  سبک دکمه. Mattermost برای مقادیری که پشتیبانی نمی‌کند، سبک پیش‌فرض را اعمال می‌کند.
</ParamField>

برای اعلام پشتیبانی از دکمه‌ها در اعلان سیستمی عامل، `inlineButtons` را به قابلیت‌های کانال اضافه کنید:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

هنگامی که کاربر روی دکمه‌ای کلیک می‌کند:

<Steps>
  <Step title="بررسی دسترسی">
    کلیک‌کننده باید همان بررسی‌های سیاست پیام مستقیم/گروه را که برای فرستندهٔ پیام اعمال می‌شود با موفقیت بگذراند؛ کلیک‌های غیرمجاز یک اعلان موقت دریافت می‌کنند و نادیده گرفته می‌شوند.
  </Step>
  <Step title="جایگزینی دکمه‌ها با تأیید">
    همهٔ دکمه‌ها با یک خط تأیید جایگزین می‌شوند (برای مثال، «✓ **Yes** توسط @user انتخاب شد»).
  </Step>
  <Step title="عامل انتخاب را دریافت می‌کند">
    عامل انتخاب را به‌صورت پیام ورودی (به‌همراه یک رویداد سیستمی) دریافت می‌کند و پاسخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="نکات پیاده‌سازی">
    - فراخوان‌های برگشتی دکمه از اعتبارسنجی HMAC-SHA256 استفاده می‌کنند (خودکار و بدون نیاز به پیکربندی).
    - هنگام کلیک، کل بلوک پیوست جایگزین می‌شود؛ بنابراین همهٔ دکمه‌ها باهم حذف می‌شوند و حذف جزئی ممکن نیست.
    - شناسه‌های کنش حاوی خط تیره یا زیرخط به‌طور خودکار پاک‌سازی می‌شوند (محدودیت مسیریابی Mattermost).
    - کلیک‌هایی که `action_id` آن‌ها با هیچ کنشی در پست اصلی مطابقت ندارد، با `403` («کنش ناشناخته») رد می‌شوند.

  </Accordion>
  <Accordion title="پیکربندی و دسترس‌پذیری">
    - `channels.mattermost.capabilities`: آرایه‌ای از رشته‌های قابلیت. برای فعال‌کردن توضیحات ابزار دکمه‌ها در اعلان سیستمی عامل، `"inlineButtons"` را اضافه کنید.
    - `channels.mattermost.interactions.callbackBaseUrl`: نشانی پایهٔ خارجی اختیاری برای فراخوان‌های برگشتی دکمه (برای مثال `https://gateway.example.com`). وقتی Mattermost نمی‌تواند مستقیماً در میزبان اتصال به Gateway دسترسی پیدا کند، از این گزینه استفاده کنید.
    - در پیکربندی‌های چندحسابی، می‌توانید همین فیلد را زیر `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` نیز تنظیم کنید.
    - اگر `interactions.callbackBaseUrl` حذف شود، OpenClaw نشانی فراخوان برگشتی را از `gateway.customBindHost` + `gateway.port` (پیش‌فرض 18789) استخراج می‌کند و سپس به `http://localhost:<port>` بازمی‌گردد. مسیر فراخوان برگشتی `/mattermost/interactions/<accountId>` است.
    - قاعدهٔ دسترس‌پذیری: نشانی فراخوان برگشتی دکمه باید از سرور Mattermost قابل دسترسی باشد. `localhost` فقط زمانی کار می‌کند که Mattermost و OpenClaw در یک میزبان/فضای نام شبکه اجرا شوند.
    - `channels.mattermost.interactions.allowedSourceIps`: فهرست مجاز IPهای مبدأ برای فراخوان‌های برگشتی دکمه. بدون آن، فقط مبدأهای local loopback (`127.0.0.1`، `::1`) پذیرفته می‌شوند؛ بنابراین سرور راه‌دور Mattermost باید در اینجا مجاز شود، وگرنه کلیک‌های آن با `403` رد می‌شوند. پشت پراکسی معکوس، `gateway.trustedProxies` را نیز تنظیم کنید تا IP واقعی کاربر از سرآیندهای هدایت‌شده استخراج شود.
    - اگر مقصد فراخوان برگشتی شما خصوصی/شبکهٔ Tailscale/داخلی است، میزبان/دامنهٔ آن را به `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

### یکپارچه‌سازی مستقیم API (اسکریپت‌های خارجی)

اسکریپت‌ها و Webhookهای خارجی می‌توانند به‌جای عبور از ابزار `message` عامل، دکمه‌ها را مستقیماً از طریق REST API در Mattermost ارسال کنند. در صورت امکان از `buildButtonAttachments()` در Plugin استفاده کنید؛ اگر JSON خام ارسال می‌کنید، این قواعد را رعایت کنید:

**ساختار محتوای ارسالی:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**قواعد حیاتی**

1. پیوست‌ها در `props.attachments` قرار می‌گیرند، نه در `attachments` سطح بالا (که بی‌سروصدا نادیده گرفته می‌شود).
2. هر کنش به `type: "button"` نیاز دارد؛ بدون آن، کلیک‌ها بی‌سروصدا نادیده گرفته می‌شوند.
3. هر کنش به فیلد `id` نیاز دارد؛ Mattermost کنش‌های بدون شناسه را نادیده می‌گیرد.
4. `id` کنش باید **فقط شامل حروف و اعداد** باشد (`[a-zA-Z0-9]`). خط تیره و زیرخط مسیریابی سمت سرور کنش در Mattermost را مختل می‌کنند (پاسخ 404). پیش از استفاده آن‌ها را حذف کنید.
5. `context.action_id` باید با `id` دکمه مطابقت داشته باشد؛ Gateway کلیک‌هایی را که `action_id` آن‌ها در پست وجود ندارد رد می‌کند.
6. `context.action_id` الزامی است؛ کنترل‌کنندهٔ تعامل بدون آن 400 برمی‌گرداند.
7. IP مبدأ فراخوان برگشتی باید مجاز باشد (به `interactions.allowedSourceIps` در بالا مراجعه کنید).

</Warning>

**تولید توکن HMAC**

Gateway کلیک‌های دکمه را با HMAC-SHA256 اعتبارسنجی می‌کند. اسکریپت‌های خارجی باید توکن‌هایی تولید کنند که با منطق اعتبارسنجی Gateway مطابقت داشته باشند:

<Steps>
  <Step title="استخراج راز از توکن ربات">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`، با رمزگذاری هگزادسیمال.
  </Step>
  <Step title="ساخت شیء زمینه">
    شیء زمینه را با همهٔ فیلدها **به‌جز** `_token` بسازید.
  </Step>
  <Step title="سریال‌سازی با کلیدهای مرتب‌شده">
    آن را با **کلیدهای مرتب‌شده به‌صورت بازگشتی** و **بدون فاصله** سریال‌سازی کنید (Gateway اشیای تو‌در‌تو را نیز متعارف می‌کند و JSON فشرده تولید می‌کند).
  </Step>
  <Step title="امضای محتوای ارسالی">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="افزودن توکن">
    چکیدهٔ هگزادسیمال حاصل را با نام `_token` به زمینه اضافه کنید.
  </Step>
</Steps>

مثال Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="خطاهای رایج HMAC">
    - `json.dumps` در Python به‌طور پیش‌فرض فاصله اضافه می‌کند (`{"key": "val"}`). برای تطبیق با خروجی فشردهٔ JavaScript (`{"key":"val"}`)، از `separators=(",", ":")` استفاده کنید.
    - همیشه **همهٔ** فیلدهای زمینه (به‌جز `_token`) را امضا کنید. Gateway ابتدا `_token` را حذف می‌کند و سپس همهٔ موارد باقی‌مانده را امضا می‌کند. امضای یک زیرمجموعه باعث شکست بی‌سروصدای اعتبارسنجی می‌شود.
    - از `sort_keys=True` استفاده کنید؛ Gateway کلیدها را پیش از امضا مرتب می‌کند و Mattermost ممکن است هنگام ذخیرهٔ محتوای ارسالی، ترتیب فیلدهای زمینه را تغییر دهد.
    - راز را از توکن ربات استخراج کنید (به‌صورت قطعی)، نه از بایت‌های تصادفی. راز باید در فرایندی که دکمه‌ها را ایجاد می‌کند و Gateway که آن‌ها را اعتبارسنجی می‌کند یکسان باشد.

  </Accordion>
</AccordionGroup>

## آداپتور فهرست راهنما

Plugin مربوط به Mattermost شامل یک آداپتور فهرست راهنما است که نام کانال‌ها و کاربران را از طریق API در Mattermost تفکیک می‌کند. این قابلیت استفاده از مقصدهای `#channel-name` و `@username` را در `openclaw message send` و تحویل‌های Cron/Webhook ممکن می‌سازد.

هیچ پیکربندی‌ای لازم نیست؛ آداپتور از توکن ربات موجود در پیکربندی حساب استفاده می‌کند.

## چندحسابی

Mattermost از چند حساب زیر `channels.mattermost.accounts` پشتیبانی می‌کند:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "اصلی", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "هشدارها", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

مقادیر حساب، فیلدهای سطح بالا را بازنویسی می‌کنند؛ `channels.mattermost.defaultAccount` تعیین می‌کند وقتی حسابی مشخص نشده است، از کدام حساب استفاده شود.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="در کانال‌ها پاسخی دریافت نمی‌شود">
    مطمئن شوید ربات در کانال حضور دارد و به آن اشاره کنید (oncall)، از یک پیشوند فعال‌ساز استفاده کنید (onchar)، یا `chatmode: "onmessage"` را تنظیم کنید.
  </Accordion>
  <Accordion title="خطاهای احراز هویت یا چندحسابی">
    - توکن ربات، نشانی پایه و فعال بودن حساب را بررسی کنید.
    - مشکلات چندحسابی: متغیرهای محیطی فقط برای حساب `default` اعمال می‌شوند.
    - میزبان‌های خصوصی/LAN متعلق به Mattermost به `network.dangerouslyAllowPrivateNetwork: true` نیاز دارند (محافظ SSRF به‌طور پیش‌فرض IPهای خصوصی را مسدود می‌کند).

  </Accordion>
  <Accordion title="فرمان‌های اسلش بومی ناموفق هستند">
    - `Unauthorized: invalid command token.`:‏ OpenClaw توکن فراخوانی برگشتی را نپذیرفته است. علت‌های معمول:
      - ثبت فرمان اسلش هنگام راه‌اندازی ناموفق بوده یا فقط بخشی از آن تکمیل شده است
      - فراخوانی برگشتی به Gateway یا حساب اشتباه می‌رسد
      - Mattermost همچنان فرمان‌های قدیمی را دارد که به مقصد فراخوانی برگشتی قبلی اشاره می‌کنند
      - Gateway بدون فعال‌سازی دوباره فرمان‌های اسلش راه‌اندازی مجدد شده است
    - اگر فرمان‌های اسلش بومی از کار افتادند، گزارش‌ها را برای `mattermost: failed to register slash commands` یا `mattermost: native slash commands enabled but no commands could be registered` بررسی کنید.
    - اگر `callbackUrl` حذف شده باشد و گزارش‌ها هشدار دهند که فراخوانی برگشتی به یک نشانی local loopback مانند `http://localhost:18789/...` تفکیک شده است، احتمالاً آن نشانی فقط زمانی قابل دسترسی است که Mattermost در همان میزبان/فضای نام شبکه OpenClaw اجرا شود. در عوض، یک `commands.callbackUrl` صریح و قابل دسترسی از بیرون تنظیم کنید.

  </Accordion>
  <Accordion title="مشکلات دکمه‌ها">
    - دکمه‌ها به‌شکل کادرهای سفید نمایش داده می‌شوند یا اصلاً نمایش داده نمی‌شوند: داده دکمه بدساخت است. هر دکمه نمایشی به یک `label` و یک `value` نیاز دارد (دکمه‌هایی که یکی از این دو را نداشته باشند، حذف می‌شوند).
    - دکمه‌ها نمایش داده می‌شوند، اما کلیک‌ها هیچ کاری نمی‌کنند: بررسی کنید Gateway از سرور Mattermost قابل دسترسی باشد، IP سرور Mattermost در `channels.mattermost.interactions.allowedSourceIps` قرار داشته باشد (بدون آن فقط local loopback پذیرفته می‌شود) و `ServiceSettings.AllowedUntrustedInternalConnections` برای مقصدهای خصوصی شامل میزبان فراخوانی برگشتی باشد.
    - دکمه‌ها هنگام کلیک خطای 404 برمی‌گردانند: احتمالاً `id` دکمه شامل خط تیره یا زیرخط است. مسیریاب کنش Mattermost با شناسه‌های غیرالفبایی‌عددی دچار اختلال می‌شود. فقط از `[a-zA-Z0-9]` استفاده کنید.
    - گزارش‌های Gateway عبارت `rejected callback source` را نشان می‌دهند: کلیک از IPای خارج از `interactions.allowedSourceIps` آمده است. سرور Mattermost یا ورودی شبکه خود را در فهرست مجاز قرار دهید و هنگام استفاده از پراکسی معکوس، `gateway.trustedProxies` را تنظیم کنید.
    - گزارش‌های Gateway عبارت `invalid _token` را نشان می‌دهند: عدم تطابق HMAC. بررسی کنید همه فیلدهای زمینه را امضا می‌کنید (نه فقط زیرمجموعه‌ای از آن‌ها)، از کلیدهای مرتب‌شده استفاده می‌کنید و JSON فشرده (بدون فاصله) به‌کار می‌برید. بخش HMAC در بالا را ببینید.
    - گزارش‌های Gateway عبارت `missing _token in context` را نشان می‌دهند: فیلد `_token` در زمینه دکمه وجود ندارد. هنگام ساخت بار یکپارچه‌سازی، مطمئن شوید این فیلد گنجانده شده است.
    - Gateway کلیک را با `Unknown action` رد می‌کند: `context.action_id` با هیچ `id` کنشی در پست مطابقت ندارد. هر دو را روی یک مقدار پاک‌سازی‌شده یکسان تنظیم کنید.
    - عامل دکمه‌ای ارائه نمی‌کند: `capabilities: ["inlineButtons"]` را به پیکربندی کانال Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل اشاره
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام خصوصی و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
