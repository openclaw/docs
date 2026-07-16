---
read_when:
    - راه‌اندازی Mattermost
    - اشکال‌زدایی مسیریابی Mattermost
sidebarTitle: Mattermost
summary: راه‌اندازی ربات Mattermost و پیکربندی OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T15:31:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

وضعیت: Plugin قابل‌دانلود (توکن ربات + رویدادهای WebSocket). کانال‌ها، کانال‌های خصوصی، پیام‌های مستقیم گروهی و پیام‌های مستقیم پشتیبانی می‌شوند. Mattermost یک پلتفرم پیام‌رسانی تیمی خودمیزبان‌پذیر است ([mattermost.com](https://mattermost.com)).

## نصب

<Tabs>
  <Tab title="رجیستری npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="نسخهٔ محلی">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

<Steps>
  <Step title="از در دسترس بودن Plugin مطمئن شوید">
    `@openclaw/mattermost` را با فرمان بالا نصب کنید، سپس اگر Gateway از قبل در حال اجراست، آن را بازراه‌اندازی کنید.
  </Step>
  <Step title="یک ربات Mattermost ایجاد کنید">
    یک حساب ربات Mattermost ایجاد کنید، **توکن ربات** را کپی کنید و ربات را به تیم‌ها و کانال‌هایی که باید بخواند اضافه کنید.
  </Step>
  <Step title="نشانی پایه را کپی کنید">
    **نشانی پایهٔ** Mattermost را کپی کنید (برای مثال، `https://chat.example.com`). پسوند `/api/v4` به‌طور خودکار حذف می‌شود.
  </Step>
  <Step title="OpenClaw را پیکربندی و Gateway را راه‌اندازی کنید">
    پیکربندی حداقلی:

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
برای Mattermost خودمیزبان روی یک نشانی خصوصی/LAN/tailnet: درخواست‌های خروجی API مربوط به Mattermost از یک محافظ SSRF عبور می‌کنند که به‌طور پیش‌فرض IPهای خصوصی و داخلی را مسدود می‌کند. با `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` اجازه دهید (برای هر حساب: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## فرمان‌های بومی اسلش

فرمان‌های بومی اسلش اختیاری هستند. در صورت فعال‌سازی، OpenClaw فرمان‌های اسلش `oc_*` را در هر تیمی که ربات عضو آن است ثبت می‌کند و POSTهای فراخوان برگشتی را روی سرور HTTP مربوط به Gateway دریافت می‌کند.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // زمانی استفاده کنید که Mattermost نتواند مستقیماً به Gateway دسترسی پیدا کند (پروکسی معکوس/نشانی عمومی).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

فرمان‌های ثبت‌شده: `/oc_status`، `/oc_model`، `/oc_models`، `/oc_new`، `/oc_help`، `/oc_think`، `/oc_reasoning`، `/oc_verbose`، `/oc_queue`. با `nativeSkills: true`، فرمان‌های Skills نیز به‌شکل `/oc_<skill>` ثبت می‌شوند.

<AccordionGroup>
  <Accordion title="نکات رفتاری">
    - `native` و `nativeSkills` به‌طور پیش‌فرض `"auto"` هستند که برای Mattermost به حالت غیرفعال تبدیل می‌شود. آن‌ها را صریحاً روی `true` تنظیم کنید.
    - `callbackPath` به‌طور پیش‌فرض `/api/channels/mattermost/command` است.
    - اگر `callbackUrl` حذف شده باشد، OpenClaw مقدار `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` را استخراج می‌کند. میزبان‌های اتصال عام (`0.0.0.0`، `::`) به `localhost` بازمی‌گردند.
    - برای راه‌اندازی‌های چندحسابی، `commands` را می‌توان در سطح بالا یا زیر `channels.mattermost.accounts.<id>.commands` تنظیم کرد (مقادیر حساب بر فیلدهای سطح بالا اولویت دارند).
    - فرمان‌های اسلش موجود با همان تریگر که توسط یکپارچه‌سازی‌های دیگر ایجاد شده‌اند دست‌نخورده باقی می‌مانند (ثبت از آن‌ها صرف‌نظر می‌کند)؛ فرمان‌هایی که ربات ایجاد کرده است، هنگام تغییر نشانی فراخوان برگشتی به‌روزرسانی یا دوباره ایجاد می‌شوند.
    - فراخوان‌های برگشتی فرمان با توکن‌های مخصوص هر فرمان که Mattermost هنگام ثبت فرمان‌های `oc_*` توسط OpenClaw برمی‌گرداند اعتبارسنجی می‌شوند.
    - OpenClaw پیش از پذیرش هر فراخوان برگشتی، ثبت فعلی فرمان Mattermost را تازه‌سازی می‌کند؛ بنابراین توکن‌های قدیمی فرمان‌های اسلش حذف‌شده یا دوباره تولیدشده، بدون بازراه‌اندازی Gateway دیگر پذیرفته نمی‌شوند.
    - اگر API مربوط به Mattermost نتواند تأیید کند که فرمان همچنان جاری است، اعتبارسنجی فراخوان برگشتی به‌صورت بسته شکست می‌خورد؛ اعتبارسنجی‌های ناموفق برای مدت کوتاهی کش می‌شوند، جست‌وجوهای هم‌زمان ادغام می‌شوند و شروع جست‌وجوی تازه برای هر فرمان دارای محدودیت نرخ است تا فشار بازپخش محدود شود.
    - هنگامی که ثبت ناموفق باشد، راه‌اندازی ناقص باشد یا توکن فراخوان برگشتی با توکن ثبت‌شدهٔ فرمان حل‌شده مطابقت نداشته باشد، فراخوان‌های برگشتی اسلش به‌صورت بسته شکست می‌خورند (توکنی که برای یک فرمان معتبر است نمی‌تواند برای فرمانی دیگر به اعتبارسنجی بالادستی برسد).
    - فراخوان‌های برگشتی پذیرفته‌شده با پاسخ موقت «در حال پردازش...» تأیید می‌شوند؛ پاسخ واقعی به‌شکل یک پیام عادی می‌رسد.

  </Accordion>
  <Accordion title="الزام دسترسی‌پذیری">
    نقطهٔ پایانی فراخوان برگشتی باید از سرور Mattermost قابل دسترسی باشد.

    - مگر اینکه Mattermost روی همان میزبان/فضای نام شبکهٔ OpenClaw اجرا شود، `callbackUrl` را روی `localhost` تنظیم نکنید.
    - نشانی پایهٔ Mattermost خود را برای `callbackUrl` تنظیم نکنید، مگر اینکه آن نشانی `/api/channels/mattermost/command` را با پروکسی معکوس به OpenClaw هدایت کند.
    - یک بررسی سریع `curl https://<gateway-host>/api/channels/mattermost/command` است؛ درخواست GET باید `405 Method Not Allowed` را از OpenClaw برگرداند، نه `404`.

  </Accordion>
  <Accordion title="فهرست مجاز خروجی Mattermost">
    اگر مقصد فراخوان برگشتی شما نشانی‌های خصوصی/tailnet/داخلی است، `ServiceSettings.AllowedUntrustedInternalConnections` مربوط به Mattermost را طوری تنظیم کنید که میزبان/دامنهٔ فراخوان برگشتی را شامل شود.

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
متغیرهای محیطی فقط بر حساب **پیش‌فرض** (`default`) اعمال می‌شوند. حساب‌های دیگر باید از مقادیر پیکربندی استفاده کنند.

`MATTERMOST_URL` را نمی‌توان از یک `.env` فضای کاری تنظیم کرد؛ [فایل‌های ‎.env فضای کاری](/fa/gateway/security) را ببینید.
</Note>

## حالت‌های گفت‌وگو

Mattermost به‌طور خودکار به پیام‌های مستقیم پاسخ می‌دهد. رفتار کانال با `chatmode` کنترل می‌شود:

<Tabs>
  <Tab title="oncall (پیش‌فرض)">
    فقط هنگام @اشاره در کانال‌ها پاسخ دهید.
  </Tab>
  <Tab title="onmessage">
    به هر پیام کانال پاسخ دهید.
  </Tab>
  <Tab title="onchar">
    هنگامی پاسخ دهید که پیام با پیشوند تریگر آغاز شود.
  </Tab>
</Tabs>

نمونهٔ پیکربندی:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // پیش‌فرض
    },
  },
}
```

نکات:

- `onchar` همچنان به @اشاره‌های صریح پاسخ می‌دهد.
- `channels.mattermost.requireMention` همچنان رعایت می‌شود، اما `chatmode` ترجیح داده می‌شود. تنظیمات `groups.<channelId>.requireMention` برای هر کانال بر هر دو اولویت دارند.
- پس از اینکه ربات پاسخی قابل مشاهده در یک رشتهٔ کانال ارسال کند، پیام‌های بعدی در همان رشته بدون @اشارهٔ جدید یا پیشوند `onchar` پاسخ داده می‌شوند؛ بنابراین مکالمات چندمرحله‌ای رشته بدون وقفه ادامه می‌یابند. مشارکت تا 7 روز پس از آخرین پاسخ ربات در آن رشته به خاطر سپرده می‌شود و در بازراه‌اندازی‌های Gateway نیز باقی می‌ماند. رشته‌هایی که ربات فقط مشاهده کرده است تحت‌تأثیر قرار نمی‌گیرند؛ برای اینکه دوباره به اشارهٔ صریح نیاز باشد، یک پیام جدید سطح بالا آغاز کنید.

## رشته‌ها و نشست‌ها

از `channels.mattermost.replyToMode` استفاده کنید تا مشخص شود پاسخ‌های کانال و گروه در کانال اصلی باقی بمانند یا زیر پست آغازگر یک رشته ایجاد کنند.

- `off` (پیش‌فرض): فقط زمانی در یک رشته پاسخ دهید که پست ورودی از قبل در یک رشته باشد.
- `first`: برای پست‌های سطح بالای کانال/گروه، زیر آن پست یک رشته ایجاد کنید و مکالمه را به نشستی با دامنهٔ رشته هدایت کنید.
- `all` و `batched`: در حال حاضر برای Mattermost رفتاری مشابه `first` دارند، زیرا پس از اینکه Mattermost ریشهٔ رشته داشته باشد، بخش‌های بعدی و رسانه‌ها در همان رشته ادامه می‌یابند.
- پیام‌های مستقیم حتی زمانی که `replyToMode` تنظیم شده باشد، به‌طور پیش‌فرض از `off` استفاده می‌کنند.

از `channels.mattermost.replyToModeByChatType` استفاده کنید تا حالت را برای گفت‌وگوهای `direct`، `group` یا `channel` بازنویسی کنید. برای وارد کردن پیام‌های مستقیم به رشته‌بندی، `direct` را تنظیم کنید:

- `off` (پیش‌فرض): پیام‌های مستقیم بدون رشته و در یک نشست پیوسته باقی می‌مانند.
- `first`، `all` یا `batched`: هر پیام مستقیم سطح بالا، یک رشتهٔ Mattermost را آغاز می‌کند که توسط نشستی تازه و مستقل پشتیبانی می‌شود.

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

- نشست‌های با دامنهٔ رشته از شناسهٔ پست آغازگر به‌عنوان ریشهٔ رشته استفاده می‌کنند.
- `first` و `all` در حال حاضر معادل‌اند، زیرا پس از اینکه Mattermost ریشهٔ رشته داشته باشد، بخش‌های بعدی و رسانه‌ها در همان رشته ادامه می‌یابند.
- بازنویسی‌های مخصوص هر نوع گفت‌وگو بر `replyToMode` اولویت دارند. بدون بازنویسی `direct`، استقرارهای موجود پیام‌های مستقیم را تخت و بدون رشته نگه می‌دارند.

## کنترل دسترسی (پیام‌های مستقیم)

- پیش‌فرض: `channels.mattermost.dmPolicy = "pairing"` (فرستندگان ناشناس یک کد جفت‌سازی دریافت می‌کنند). مقادیر دیگر: `allowlist`، `open`، `disabled`.
- تأیید از طریق:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- پیام‌های مستقیم عمومی: `channels.mattermost.dmPolicy="open"` به‌همراه `channels.mattermost.allowFrom=["*"]` (طرح‌وارهٔ پیکربندی نویسهٔ عام را الزامی می‌کند).
- `channels.mattermost.allowFrom` شناسه‌های کاربر (توصیه‌شده) و ورودی‌های `accessGroup:<name>` را می‌پذیرد. [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کانال‌ها (گروه‌ها)

- پیش‌فرض: `channels.mattermost.groupPolicy = "allowlist"` (مشروط به اشاره).
- فرستندگان را با `channels.mattermost.groupAllowFrom` در فهرست مجاز قرار دهید (شناسه‌های کاربر توصیه می‌شوند).
- `channels.mattermost.groupAllowFrom` ورودی‌های `accessGroup:<name>` را می‌پذیرد. [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.
- بازنویسی‌های اشاره برای هر کانال زیر `channels.mattermost.groups.<channelId>.requireMention` یا برای مقدار پیش‌فرض زیر `channels.mattermost.groups["*"].requireMention` قرار دارند.
- تطبیق `@username` تغییرپذیر است و فقط زمانی فعال می‌شود که `channels.mattermost.dangerouslyAllowNameMatching: true`.
- کانال‌های باز: `channels.mattermost.groupPolicy="open"` (مشروط به اشاره).
- ترتیب حل: `channels.mattermost.groupPolicy`، سپس `channels.defaults.groupPolicy`، سپس `"allowlist"`.
- نکتهٔ زمان اجرا: اگر بخش `channels.mattermost` کاملاً وجود نداشته باشد، زمان اجرا برای بررسی‌های گروه به‌صورت بسته به `groupPolicy="allowlist"` شکست می‌خورد (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد) و یک هشدار یک‌باره ثبت می‌کند.

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

از این قالب‌های مقصد همراه با `openclaw message send` یا cron/webhookها استفاده کنید:

| مقصد                               | تحویل به                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | کانال بر اساس شناسه                                              |
| `channel:<name>` یا `#channel-name` | کانال بر اساس نام، با جست‌وجو در همهٔ تیم‌هایی که ربات عضو آن‌هاست |
| `user:<id>` یا `mattermost:<id>`    | پیام مستقیم با آن کاربر                                          |
| `@username`                         | پیام مستقیم (نام کاربری از طریق API مربوط به Mattermost حل می‌شود) |

ارسال‌های خروجی حداکثر از یک پیوست در هر پیام پشتیبانی می‌کنند؛ چند فایل را به ارسال‌های جداگانه تقسیم کنید.

<Warning>
شناسه‌های مبهم بدون پیشوند (مانند `64ifufp...`) در Mattermost **چندمعنا** هستند (شناسهٔ کاربر یا شناسهٔ کانال).

OpenClaw آن‌ها را **ابتدا به‌عنوان کاربر** حل می‌کند:

- اگر شناسه به‌عنوان کاربر وجود داشته باشد (`GET /api/v4/users/<id>` موفق شود)، OpenClaw با حل کانال مستقیم از طریق `/api/v4/channels/direct` یک **پیام مستقیم** ارسال می‌کند.
- در غیر این صورت، شناسه به‌عنوان **شناسهٔ کانال** در نظر گرفته می‌شود.

اگر به رفتار قطعی نیاز دارید، همیشه از پیشوندهای صریح (`user:<id>` / `channel:<id>`) استفاده کنید.
</Warning>

## تلاش مجدد کانال پیام مستقیم

وقتی OpenClaw به مقصد پیام خصوصی Mattermost ارسال می‌کند و لازم است ابتدا کانال مستقیم را شناسایی کند، به‌طور پیش‌فرض خطاهای موقت ایجاد کانال مستقیم را دوباره امتحان می‌کند.

برای تنظیم کلی این رفتار در Plugin مربوط به Mattermost از `channels.mattermost.dmChannelRetry` یا برای یک حساب از `channels.mattermost.accounts.<id>.dmChannelRetry` استفاده کنید. مقادیر پیش‌فرض:

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

- این تنظیم فقط برای ایجاد کانال پیام خصوصی (`/api/v4/channels/direct`) اعمال می‌شود، نه برای همه فراخوانی‌های API مربوط به Mattermost.
- تلاش‌های مجدد با پس‌روی نمایی همراه با نوسان تصادفی انجام می‌شوند و برای خطاهای موقت مانند محدودیت نرخ، پاسخ‌های 5xx و خطاهای شبکه یا پایان مهلت اعمال می‌شوند.
- خطاهای سمت کارخواه 4xx، به‌جز `429`، دائمی در نظر گرفته می‌شوند و دوباره امتحان نمی‌شوند.

## پخش جریانی پیش‌نمایش

Mattermost فرایند تفکر، فعالیت ابزار و متن جزئی پاسخ را به یک **پست پیش‌نویس پیش‌نمایش** منتقل می‌کند که وقتی ارسال پاسخ نهایی ایمن باشد، در همان محل نهایی می‌شود. در حالت `partial`، پیش‌نمایش به‌جای پر کردن کانال با پیام‌های جداگانه برای هر قطعه، روی همان شناسه پست به‌روزرسانی می‌شود. در حالت `block`، پیش‌نمایش میان متن تکمیل‌شده و بلوک‌های فعالیت ابزار جابه‌جا می‌شود تا بلوک‌های قبلی به‌جای بازنویسی‌شدن با بلوک بعدی، به‌صورت پست‌های مستقل قابل مشاهده بمانند. خروجی‌های نهایی رسانه‌ای یا خطا، ویرایش‌های در انتظار پیش‌نمایش را لغو می‌کنند و به‌جای نهایی‌کردن یک پست پیش‌نمایش موقتی، از تحویل عادی استفاده می‌کنند.

پخش جریانی پیش‌نمایش در حالت `partial` **به‌طور پیش‌فرض فعال است**. آن را از طریق `channels.mattermost.streaming.mode` پیکربندی کنید (مقادیر اسکالر/بولی قدیمی `streaming` توسط `openclaw doctor --fix` مهاجرت داده می‌شوند):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="حالت‌های پخش جریانی">
    - `partial` (پیش‌فرض): یک پست پیش‌نمایش که هم‌زمان با گسترش پاسخ ویرایش می‌شود و سپس با پاسخ کامل نهایی می‌شود.
    - `block` پیش‌نمایش را میان متن تکمیل‌شده و بلوک‌های فعالیت ابزار جابه‌جا می‌کند تا هر بلوک به‌جای بازنویسی‌شدن در همان محل، به‌صورت پست مستقل قابل مشاهده بماند. به‌روزرسانی‌های موازی و متوالی ابزار، پست فعلی فعالیت ابزار را به‌اشتراک می‌گذارند.
    - `progress` هنگام تولید، یک پیش‌نمایش وضعیت نمایش می‌دهد و پاسخ نهایی را فقط پس از تکمیل ارسال می‌کند.
    - `off` پخش جریانی پیش‌نمایش را غیرفعال می‌کند. با `streaming.block.enabled: true`، بلوک‌های تکمیل‌شده دستیار همچنان به‌صورت پاسخ‌های بلوکی عادی (پست‌های جداگانه) تحویل داده می‌شوند، نه یک پست نهایی ادغام‌شده.

  </Accordion>
  <Accordion title="نکات رفتار پخش جریانی">
    - اگر جریان نتواند در همان محل نهایی شود (برای مثال، پست در میانه جریان حذف شده باشد)، OpenClaw برای جلوگیری از ازدست‌رفتن پاسخ، یک پست نهایی جدید ارسال می‌کند.
    - محموله‌هایی که فقط شامل تفکر هستند، از پست‌های کانال حذف می‌شوند؛ از جمله متنی که به‌شکل نقل‌قول بلوکی `> Thinking` دریافت می‌شود. برای مشاهده تفکر در سطوح دیگر، `/reasoning on` را تنظیم کنید؛ پست نهایی Mattermost فقط پاسخ را نگه می‌دارد.
    - برای ماتریس نگاشت کانال، به [پخش جریانی](/fa/concepts/streaming#preview-streaming-modes) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## واکنش‌ها (ابزار پیام)

- از `message action=react` همراه با `channel=mattermost` استفاده کنید.
- `messageId` شناسه پست Mattermost است.
- `emoji` نام‌هایی مانند `thumbsup` یا `:+1:` را می‌پذیرد (دونقطه‌ها اختیاری هستند).
- برای حذف یک واکنش، `remove=true` (بولی) را تنظیم کنید.
- رویدادهای افزودن/حذف واکنش به‌عنوان رویدادهای سیستمی به نشست عامل مسیریابی‌شده فرستاده می‌شوند و همان بررسی‌های خط‌مشی پیام خصوصی/گروه که برای پیام‌ها اعمال می‌شود، درباره آن‌ها نیز برقرار است.

مثال‌ها:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

پیکربندی:

- `channels.mattermost.actions.reactions`: فعال/غیرفعال‌کردن کنش‌های واکنش (پیش‌فرض true).
- نادیده‌گیری برای هر حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## دکمه‌های تعاملی (ابزار پیام)

پیام‌هایی با دکمه‌های قابل کلیک ارسال کنید. وقتی کاربر روی دکمه‌ای کلیک می‌کند، عامل انتخاب را دریافت می‌کند و می‌تواند پاسخ دهد.

دکمه‌ها از محموله معنایی `presentation` می‌آیند (در پاسخ‌های عادی عامل و در `message action=send`). OpenClaw دکمه‌های مقداری را به‌صورت دکمه‌های تعاملی Mattermost رندر می‌کند، دکمه‌های URL را در متن پیام قابل مشاهده نگه می‌دارد و منوهای انتخاب را به متن خوانا تنزل می‌دهد.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

فیلدهای دکمه ارائه:

<ParamField path="label" type="string" required>
  برچسب نمایشی (نام مستعار: `text`).
</ParamField>
<ParamField path="value" type="string">
  مقداری که هنگام کلیک بازگردانده می‌شود و به‌عنوان شناسه کنش استفاده می‌شود (نام‌های مستعار: `callback_data`، `callbackData`). برای دکمه قابل کلیک الزامی است، مگر اینکه `url` تنظیم شده باشد.
</ParamField>
<ParamField path="url" type="string">
  دکمه پیوند؛ به‌جای دکمه تعاملی، به‌صورت متن `label: url` در بدنه پیام رندر می‌شود.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  سبک دکمه. Mattermost برای مقادیری که پشتیبانی نمی‌کند، سبک پیش‌فرض را اعمال می‌کند.
</ParamField>

برای اعلام پشتیبانی از دکمه در اعلان سیستمی عامل، `inlineButtons` را به قابلیت‌های کانال اضافه کنید:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

وقتی کاربر روی دکمه‌ای کلیک می‌کند:

<Steps>
  <Step title="بررسی دسترسی">
    کلیک‌کننده باید همان بررسی‌های خط‌مشی پیام خصوصی/گروه را که برای فرستنده پیام اعمال می‌شود با موفقیت بگذراند؛ کلیک‌های غیرمجاز یک اعلان موقت دریافت می‌کنند و نادیده گرفته می‌شوند.
  </Step>
  <Step title="جایگزینی دکمه‌ها با تأیید">
    همه دکمه‌ها با یک خط تأیید جایگزین می‌شوند (برای مثال، «✓ **Yes** توسط @user انتخاب شد»).
  </Step>
  <Step title="عامل انتخاب را دریافت می‌کند">
    عامل انتخاب را به‌صورت یک پیام ورودی (همراه با یک رویداد سیستمی) دریافت می‌کند و پاسخ می‌دهد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="نکات پیاده‌سازی">
    - فراخوانی‌های برگشتی دکمه از اعتبارسنجی HMAC-SHA256 استفاده می‌کنند (خودکار، بدون نیاز به پیکربندی).
    - با کلیک، کل بلوک پیوست جایگزین می‌شود؛ بنابراین همه دکمه‌ها با هم حذف می‌شوند و حذف جزئی ممکن نیست.
    - شناسه‌های کنش دارای خط تیره یا زیرخط به‌طور خودکار پاک‌سازی می‌شوند (محدودیت مسیریابی Mattermost).
    - کلیک‌هایی که `action_id` آن‌ها با هیچ کنشی در پست اصلی مطابقت ندارد، با `403` («کنش ناشناخته») رد می‌شوند.

  </Accordion>
  <Accordion title="پیکربندی و دسترس‌پذیری">
    - `channels.mattermost.capabilities`: آرایه‌ای از رشته‌های قابلیت. برای فعال‌کردن توضیح ابزار دکمه‌ها در اعلان سیستمی عامل، `"inlineButtons"` را اضافه کنید.
    - `channels.mattermost.interactions.callbackBaseUrl`: نشانی پایه خارجی اختیاری برای فراخوانی‌های برگشتی دکمه (برای مثال `https://gateway.example.com`). زمانی از آن استفاده کنید که Mattermost نتواند مستقیماً از طریق میزبان اتصال Gateway به آن دسترسی پیدا کند.
    - در راه‌اندازی‌های چندحسابی، می‌توانید همان فیلد را زیر `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` نیز تنظیم کنید.
    - اگر `interactions.callbackBaseUrl` حذف شده باشد، OpenClaw نشانی فراخوانی برگشتی را از `gateway.customBindHost` + `gateway.port` (پیش‌فرض 18789) استخراج می‌کند و سپس به `http://localhost:<port>` بازمی‌گردد. مسیر فراخوانی برگشتی `/mattermost/interactions/<accountId>` است.
    - قاعده دسترس‌پذیری: نشانی فراخوانی برگشتی دکمه باید از سرور Mattermost قابل دسترسی باشد. `localhost` فقط زمانی کار می‌کند که Mattermost و OpenClaw روی یک میزبان/فضای نام شبکه اجرا شوند.
    - `channels.mattermost.interactions.allowedSourceIps`: فهرست مجاز IP مبدأ برای فراخوانی‌های برگشتی دکمه. بدون آن، فقط مبدأهای حلقه برگشتی (`127.0.0.1`، `::1`) پذیرفته می‌شوند؛ بنابراین یک سرور Mattermost راه‌دور باید در اینجا به فهرست مجاز افزوده شود، وگرنه کلیک‌های آن با `403` رد می‌شوند. پشت پراکسی معکوس، `gateway.trustedProxies` را نیز تنظیم کنید تا IP واقعی کارخواه از سرآیندهای ارسال‌شده استخراج شود.
    - اگر مقصد فراخوانی برگشتی شما خصوصی/tailnet/داخلی است، میزبان/دامنه آن را به `ServiceSettings.AllowedUntrustedInternalConnections` در Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

### یکپارچه‌سازی مستقیم API (اسکریپت‌های خارجی)

اسکریپت‌ها و Webhookهای خارجی می‌توانند به‌جای عبور از ابزار `message` عامل، دکمه‌ها را مستقیماً از طریق API REST مربوط به Mattermost ارسال کنند. ابزار `message` متعلق به OpenClaw را ترجیح دهید. برای یکپارچه‌سازی‌های مستقیم، `buildButtonAttachments` را از `@openclaw/mattermost/api.js` وارد کنید؛ اگر JSON خام ارسال می‌کنید، این قواعد را رعایت کنید:

**ساختار محموله:**

```json5
{
  channel_id: "<channelId>",
  message: "یک گزینه انتخاب کنید:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // فقط نویسه‌های الفبایی‌عددی - پایین را ببینید
            type: "button", // الزامی است، وگرنه کلیک‌ها بی‌سروصدا نادیده گرفته می‌شوند
            name: "تأیید", // برچسب نمایشی
            style: "primary", // اختیاری: "default"، "primary"، "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // باید با شناسه دکمه مطابقت داشته باشد
                action: "approve",
                // ... هر فیلد سفارشی ...
                _token: "<hmac>", // بخش HMAC در پایین را ببینید
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

1. پیوست‌ها باید در `props.attachments` قرار گیرند، نه در `attachments` سطح بالا (بی‌سروصدا نادیده گرفته می‌شود).
2. هر کنش به `type: "button"` نیاز دارد؛ بدون آن، کلیک‌ها بی‌سروصدا بلعیده می‌شوند.
3. هر کنش به یک فیلد `id` نیاز دارد؛ Mattermost کنش‌های بدون شناسه را نادیده می‌گیرد.
4. `id` کنش باید **فقط الفبایی‌عددی** باشد (`[a-zA-Z0-9]`). خط تیره و زیرخط مسیریابی سمت سرور کنش در Mattermost را مختل می‌کنند (404 برمی‌گرداند). پیش از استفاده آن‌ها را حذف کنید.
5. `context.action_id` باید با `id` دکمه مطابقت داشته باشد؛ Gateway کلیک‌هایی را که `action_id` آن‌ها در پست وجود ندارد رد می‌کند.
6. `context.action_id` الزامی است؛ کنترل‌کننده تعامل بدون آن 400 برمی‌گرداند.
7. IP مبدأ فراخوانی برگشتی باید مجاز باشد (به `interactions.allowedSourceIps` در بالا مراجعه کنید).

</Warning>

**تولید توکن HMAC**

Gateway کلیک‌های دکمه را با HMAC-SHA256 اعتبارسنجی می‌کند. اسکریپت‌های خارجی باید توکن‌هایی تولید کنند که با منطق اعتبارسنجی Gateway مطابقت داشته باشند:

<Steps>
  <Step title="استخراج راز از توکن ربات">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`، با کدگذاری هگزادسیمال.
  </Step>
  <Step title="ساخت شیء زمینه">
    شیء زمینه را با همه فیلدها **به‌جز** `_token` بسازید.
  </Step>
  <Step title="سریال‌سازی با کلیدهای مرتب‌شده">
    با **کلیدهای مرتب‌شده به‌صورت بازگشتی** و **بدون فاصله** سریال‌سازی کنید (Gateway اشیای تو‌در‌تو را نیز متعارف‌سازی می‌کند و JSON فشرده تولید می‌کند).
  </Step>
  <Step title="امضای محموله">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="افزودن توکن">
    چکیده هگزادسیمال حاصل را به‌صورت `_token` به زمینه اضافه کنید.
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
    - تابع `json.dumps` در Python به‌طور پیش‌فرض فاصله اضافه می‌کند (`{"key": "val"}`). برای مطابقت با خروجی فشرده JavaScript (`{"key":"val"}`) از `separators=(",", ":")` استفاده کنید.
    - همیشه **همه** فیلدهای زمینه (به‌جز `_token`) را امضا کنید. Gateway ابتدا `_token` را حذف می‌کند و سپس همه موارد باقی‌مانده را امضا می‌کند. امضای تنها زیرمجموعه‌ای از فیلدها باعث شکست بی‌سروصدای اعتبارسنجی می‌شود.
    - از `sort_keys=True` استفاده کنید؛ Gateway کلیدها را پیش از امضا مرتب می‌کند و Mattermost ممکن است هنگام ذخیره محموله، ترتیب فیلدهای زمینه را تغییر دهد.
    - مقدار محرمانه را از توکن ربات استخراج کنید (به‌صورت قطعی)، نه از بایت‌های تصادفی. این مقدار باید در فرایندی که دکمه‌ها را ایجاد می‌کند و Gatewayی که آن‌ها را اعتبارسنجی می‌کند، یکسان باشد.

  </Accordion>
</AccordionGroup>

## آداپتور فهرست راهنما

Plugin مربوط به Mattermost شامل یک آداپتور فهرست راهنما است که نام کانال‌ها و کاربران را از طریق API مربوط به Mattermost تفکیک می‌کند. این قابلیت، استفاده از مقصدهای `#channel-name` و `@username` را در `openclaw message send` و تحویل‌های cron/webhook ممکن می‌سازد.

هیچ پیکربندی‌ای لازم نیست؛ آداپتور از توکن ربات موجود در پیکربندی حساب استفاده می‌کند.

## چندحسابی

Mattermost از چندین حساب در `channels.mattermost.accounts` پشتیبانی می‌کند:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

مقادیر حساب، فیلدهای سطح بالا را بازنویسی می‌کنند؛ `channels.mattermost.defaultAccount` مشخص می‌کند که در صورت تعیین‌نشدن حساب، از کدام حساب استفاده شود.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="کانال‌ها پاسخی دریافت نمی‌کنند">
    مطمئن شوید ربات در کانال حضور دارد و به آن اشاره کنید (oncall)، از پیشوند فعال‌ساز استفاده کنید (onchar)، یا `chatmode: "onmessage"` را تنظیم کنید.
  </Accordion>
  <Accordion title="خطاهای احراز هویت یا چندحسابی">
    - توکن ربات، نشانی پایه و فعال‌بودن حساب را بررسی کنید.
    - مشکلات چندحسابی: متغیرهای محیطی فقط برای حساب `default` اعمال می‌شوند.
    - میزبان‌های خصوصی/LAN مربوط به Mattermost به `network.dangerouslyAllowPrivateNetwork: true` نیاز دارند (محافظ SSRF به‌طور پیش‌فرض IPهای خصوصی را مسدود می‌کند).

  </Accordion>
  <Accordion title="دستورهای اسلش بومی ناموفق هستند">
    - `Unauthorized: invalid command token.`: OpenClaw توکن فراخوانی برگشتی را نپذیرفت. علت‌های معمول:
      - ثبت دستور اسلش هنگام راه‌اندازی ناموفق بوده یا فقط بخشی از آن تکمیل شده است
      - فراخوانی برگشتی به Gateway یا حساب اشتباه می‌رسد
      - در Mattermost همچنان دستورهای قدیمی وجود دارند که به مقصد فراخوانی برگشتی پیشین اشاره می‌کنند
      - Gateway بدون فعال‌سازی مجدد دستورهای اسلش راه‌اندازی مجدد شده است
    - اگر دستورهای اسلش بومی از کار افتادند، گزارش‌ها را برای `mattermost: failed to register slash commands` یا `mattermost: native slash commands enabled but no commands could be registered` بررسی کنید.
    - اگر `callbackUrl` حذف شده باشد و گزارش‌ها هشدار دهند که فراخوانی برگشتی به یک URL حلقه‌بازگشت مانند `http://localhost:18789/...` تفکیک شده است، احتمالاً آن URL فقط زمانی قابل دسترسی است که Mattermost در همان میزبان/فضای نام شبکه OpenClaw اجرا شود. به‌جای آن، یک `commands.callbackUrl` صریح و قابل دسترسی از بیرون تنظیم کنید.

  </Accordion>
  <Accordion title="مشکلات دکمه‌ها">
    - دکمه‌ها به‌شکل کادرهای سفید نمایش داده می‌شوند یا اصلاً نمایش داده نمی‌شوند: داده دکمه نادرست است. هر دکمه نمایشی به یک `label` و یک `value` نیاز دارد (دکمه‌هایی که هر یک از این موارد را نداشته باشند، حذف می‌شوند).
    - دکمه‌ها نمایش داده می‌شوند، اما کلیک روی آن‌ها کاری انجام نمی‌دهد: بررسی کنید Gateway از سرور Mattermost قابل دسترسی باشد، IP سرور Mattermost در `channels.mattermost.interactions.allowedSourceIps` قرار گرفته باشد (بدون آن فقط حلقه‌بازگشت پذیرفته می‌شود) و برای مقصدهای خصوصی، `ServiceSettings.AllowedUntrustedInternalConnections` شامل میزبان فراخوانی برگشتی باشد.
    - دکمه‌ها هنگام کلیک خطای 404 برمی‌گردانند: احتمالاً `id` دکمه شامل خط تیره یا زیرخط است. مسیریاب اقدام Mattermost با شناسه‌های غیرالفبایی‌عددی دچار مشکل می‌شود. فقط از `[a-zA-Z0-9]` استفاده کنید.
    - Gateway پیام `rejected callback source` را ثبت می‌کند: کلیک از IP خارج از `interactions.allowedSourceIps` آمده است. سرور Mattermost یا ورودی خود را در فهرست مجاز قرار دهید و در پشت پراکسی معکوس، `gateway.trustedProxies` را تنظیم کنید.
    - Gateway پیام `invalid _token` را ثبت می‌کند: HMAC مطابقت ندارد. بررسی کنید که همه فیلدهای زمینه (نه فقط زیرمجموعه‌ای از آن‌ها) را امضا کرده‌اید، از کلیدهای مرتب‌شده استفاده می‌کنید و JSON فشرده (بدون فاصله) به‌کار می‌برید. بخش HMAC در بالا را ببینید.
    - Gateway پیام `missing _token in context` را ثبت می‌کند: فیلد `_token` در زمینه دکمه وجود ندارد. مطمئن شوید هنگام ساخت محموله یکپارچه‌سازی، این فیلد لحاظ شده باشد.
    - Gateway کلیک را با `Unknown action` رد می‌کند: `context.action_id` با هیچ `id` اقدامی در پست مطابقت ندارد. هر دو را روی یک مقدار پاک‌سازی‌شده یکسان تنظیم کنید.
    - عامل دکمه‌ای ارائه نمی‌دهد: `capabilities: ["inlineButtons"]` را به پیکربندی کانال Mattermost اضافه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و کنترل اشاره
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
