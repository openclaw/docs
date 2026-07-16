---
read_when:
    - پیکربندی SecretRefها برای اعتبارنامه‌های ارائه‌دهنده و ارجاع‌های `auth-profiles.json`
    - بازبارگذاری، ممیزی، پیکربندی و اعمال امن اسرار عملیاتی در محیط تولید
    - درک توقف سریع هنگام راه‌اندازی، پالایش سطوح غیرفعال و رفتار آخرین وضعیت سالم شناخته‌شده
sidebarTitle: Secrets management
summary: 'مدیریت اسرار: قرارداد SecretRef، رفتار اسنپ‌شات زمان اجرا و پاک‌سازی امن یک‌طرفه'
title: مدیریت اسرار
x-i18n:
    generated_at: "2026-07-16T16:29:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw از SecretRefهای افزایشی پشتیبانی می‌کند تا نیازی نباشد اعتبارنامه‌های پشتیبانی‌شده به‌صورت متن ساده در پیکربندی نگهداری شوند.

<Note>
متن ساده همچنان کار می‌کند. استفاده از SecretRef برای هر اعتبارنامه اختیاری است.
</Note>

<Warning>
اگر اعتبارنامه‌های متن ساده در فایل‌هایی باشند که عامل می‌تواند بررسی کند، از جمله `openclaw.json`، `auth-profiles.json`، `.env` یا فایل‌های `agents/*/agent/models.json` تولیدشده، همچنان برای عامل قابل‌خواندن خواهند بود. SecretRefها تنها زمانی دامنهٔ اثر محلی را کاهش می‌دهند که همهٔ اعتبارنامه‌های پشتیبانی‌شده مهاجرت کرده باشند و `openclaw secrets audit --check` هیچ بقایای متن ساده‌ای گزارش نکند.
</Warning>

## مدل زمان اجرا

- رازها هنگام فعال‌سازی، به‌صورت پیش‌دستانه و نه با تأخیر در مسیرهای درخواست، در یک عکس فوری درون‌حافظه‌ای زمان اجرا تفکیک می‌شوند.
- اگر یک SecretRef عملاً فعال قابل تفکیک نباشد، راه‌اندازی بلافاصله با شکست مواجه می‌شود.
- بارگذاری مجدد یک جابه‌جایی اتمی است: یا موفقیت کامل، یا حفظ آخرین عکس فوری سالم شناخته‌شده.
- نقض خط‌مشی‌ها (برای مثال، ترکیب یک نمایهٔ احراز هویت در حالت OAuth با ورودی SecretRef) پیش از جابه‌جایی زمان اجرا باعث شکست فعال‌سازی می‌شود.
- درخواست‌های زمان اجرا فقط عکس فوری درون‌حافظه‌ای فعال را می‌خوانند. اعتبارنامه‌های SecretRef ارائه‌دهندهٔ مدل تا زمان خروج، از طریق ذخیره‌سازی احراز هویت و گزینه‌های جریان به‌شکل نشانگرهای نگهبان محلیِ فرایند عبور می‌کنند. مسیرهای تحویل خروجی (تحویل پاسخ/رشته در Discord، ارسال کنش‌ها در Telegram) نیز همین عکس فوری را می‌خوانند و برای هر ارسال، ارجاع‌ها را دوباره تفکیک نمی‌کنند.

این کار اختلال ارائه‌دهندهٔ راز را از مسیرهای داغ درخواست دور نگه می‌دارد.

## تزریق هنگام خروج (نشانگرهای نگهبان)

برای اعتبارنامه‌های ارائه‌دهندهٔ مدل که با SecretRef پشتیبانی می‌شوند، OpenClaw هنگام تفکیک احراز هویت مدل یک نشانگر نگهبان مبهم و محلیِ فرایند ایجاد می‌کند. بنابراین ذخیره‌سازی احراز هویت، گزینه‌های جریان، پیکربندی SDK، گزارش‌ها، اشیای خطا و بیشتر قابلیت‌های وارسی زمان اجرا مقداری مانند `oc-sent-v1-...` را می‌بینند، نه اعتبارنامهٔ ارائه‌دهنده را. واکشی محافظت‌شدهٔ مدل و پروب‌های مدیریت‌شدهٔ سلامت ارائه‌دهندهٔ محلی، بلافاصله پیش از خروج هر درخواست از فرایند، نشانگرهای نگهبان شناخته‌شده را در مقادیر URL و سرآیند جایگزین می‌کنند.

مقادیر ناشناخته‌ای که شکل نشانگر نگهبان دارند، پیش از هرگونه فعالیت شبکه‌ای به‌صورت بسته با شکست مواجه می‌شوند. OpenClaw به‌جای فرستادن یک نشانگر نگهبان تفکیک‌نشده به ارائه‌دهنده، از ارسال درخواست خودداری می‌کند. مقادیر راز تفکیک‌شده نیز به‌عنوان یک اقدام دفاعی چندلایه برای حذف دقیق مقدار از گزارش‌ها ثبت می‌شوند.

آداپتورهای ارائه‌دهنده از آخرین نقطهٔ تزریقی که SDK آن‌ها پشتیبانی می‌کند استفاده می‌کنند:

- SDKهایی که گزینهٔ واکشی سفارشی دارند، واکشی محافظت‌شدهٔ OpenClaw را دریافت می‌کنند؛ بنابراین SDK نشانگر نگهبان را حفظ می‌کند.
- SDKهایی که گزینهٔ واکشی سفارشی ندارند، نشانگر نگهبان را بلافاصله پیش از ساخت کلاینت باز می‌کنند. جریان‌های ارائه‌دهندهٔ تحت مالکیت Plugin و مهارکننده‌های عامل، نشانگر را در آخرین نقطهٔ تحویل تحت مالکیت هسته باز می‌کنند، زیرا آن انتقال‌دهنده‌ها واکشی محافظت‌شدهٔ OpenClaw را به‌اشتراک نمی‌گذارند.

نشانگرهای نگهبان مواجهه با متن ساده را در سراسر زنجیرهٔ فراخوانی مدل کاهش می‌دهند، اما جداسازی فرایند نیستند. مقدار واقعی همچنان در حافظهٔ همان فرایند وجود دارد و در مرز نهایی آداپتور ظاهر می‌شود. اعتبارنامه‌های محیطی متن ساده که از طریق SecretRef پیکربندی نشده‌اند، همچنان متن ساده باقی می‌مانند و خارج از این سازوکار هستند.

برای غیرفعال‌کردن ایجاد نشانگر نگهبان هنگام پاسخ‌گویی به رخداد یا عیب‌یابی سازگاری، `OPENCLAW_SECRET_SENTINELS=off` را تنظیم کنید (`0` یا `false` نیز، بدون حساسیت به بزرگی و کوچکی حروف، پذیرفته می‌شوند). کلید توقف اضطراری، ثبت حذف دقیق مقدار را غیرفعال نمی‌کند.

## مرز دسترسی عامل

SecretRefها از ماندگارشدن اعتبارنامه‌ها در پیکربندی و فایل‌های مدل تولیدشده جلوگیری می‌کنند، اما مرز جداسازی فرایند نیستند. اعتبارنامهٔ متن ساده‌ای که در مسیری قابل‌خواندن برای عامل روی دیسک باقی مانده باشد، همچنان از طریق ابزارهای فایل یا پوسته قابل‌خواندن است و حذف اطلاعات در سطح API را دور می‌زند.

برای استقرارهای عملیاتی که فایل‌های قابل‌دسترسی برای عامل در محدوده قرار دارند، مهاجرت را تنها زمانی کامل در نظر بگیرید که همهٔ شرایط زیر برقرار باشند:

- اعتبارنامه‌های پشتیبانی‌شده به‌جای مقادیر متن ساده از SecretRef استفاده می‌کنند.
- بقایای قدیمی متن ساده از `openclaw.json`، `auth-profiles.json`، `.env` و فایل‌های `models.json` تولیدشده پاک شده‌اند.
- `openclaw secrets audit --check` پس از مهاجرت پاک است.
- هر اعتبارنامهٔ پشتیبانی‌نشده یا چرخشی باقی‌مانده با جداسازی سیستم‌عامل، جداسازی کانتینر یا یک پراکسی خارجی اعتبارنامه محافظت می‌شود.

به همین دلیل، گردش کار ممیزی/پیکربندی/اعمال یک دروازهٔ مهاجرت امنیتی است، نه صرفاً یک ابزار کمکی برای سهولت.

<Warning>
SecretRefها فایل‌های دلخواهِ قابل‌خواندن را امن نمی‌کنند. پشتیبان‌ها، پیکربندی‌های کپی‌شده، فهرست‌های قدیمی مدل تولیدشده و رده‌های پشتیبانی‌نشدهٔ اعتبارنامه تا زمانی که حذف نشوند، به خارج از مرز اعتماد عامل منتقل نشوند یا جداگانه ایزوله نشوند، رازهای عملیاتی باقی می‌مانند.
</Warning>

## پالایش سطح فعال

SecretRefها فقط در سطح‌های عملاً فعال اعتبارسنجی می‌شوند:

- **سطح‌های فعال**: ارجاع‌های تفکیک‌نشده راه‌اندازی/بارگذاری مجدد را مسدود می‌کنند.
- **سطح‌های غیرفعال**: ارجاع‌های تفکیک‌نشده راه‌اندازی/بارگذاری مجدد را مسدود نمی‌کنند؛ آن‌ها یک عیب‌یابی غیرکشندهٔ `SECRETS_REF_IGNORED_INACTIVE_SURFACE` منتشر می‌کنند.

<Accordion title="نمونه‌هایی از سطح‌های غیرفعال">
- ورودی‌های کانال/حساب غیرفعال‌شده.
- اعتبارنامه‌های سطح بالای کانال که هیچ حساب فعالی آن‌ها را به ارث نمی‌برد.
- سطح‌های ابزار/قابلیت غیرفعال‌شده.
- کلیدهای ویژهٔ ارائه‌دهندهٔ جست‌وجوی وب که توسط `tools.web.search.provider` انتخاب نشده‌اند. در حالت خودکار (ارائه‌دهنده تنظیم نشده است)، برای تشخیص خودکار، کلیدها به‌ترتیب اولویت بررسی می‌شوند تا یکی تفکیک شود؛ پس از انتخاب، کلیدهای ارائه‌دهندگان انتخاب‌نشده غیرفعال هستند.
- اطلاعات احراز هویت SSH محیط ایزوله (`agents.defaults.sandbox.ssh.identityData`، `certificateData`، `knownHostsData`، به‌همراه بازنویسی‌های هر عامل) فقط زمانی فعال است که پشتیبان مؤثر محیط ایزوله `ssh` باشد و حالت محیط ایزوله برای عامل پیش‌فرض یا یک عامل فعال، `off` نباشد.
- SecretRefهای `gateway.remote.token` / `gateway.remote.password` در صورت برقراری هر یک از شرایط زیر فعال هستند:
  - `gateway.mode=remote`
  - `gateway.remote.url` پیکربندی شده است
  - `gateway.tailscale.mode` برابر با `serve` یا `funnel` است
  - در حالت محلی بدون آن سطح‌های راه دور: `gateway.remote.token` زمانی فعال است که احراز هویت توکنی بتواند برنده شود و هیچ توکن محیطی/احراز هویتی پیکربندی نشده باشد؛ `gateway.remote.password` تنها زمانی فعال است که احراز هویت گذرواژه‌ای بتواند برنده شود و هیچ گذرواژهٔ محیطی/احراز هویتی پیکربندی نشده باشد.
- هنگامی که `OPENCLAW_GATEWAY_TOKEN` تنظیم شده باشد، SecretRef مربوط به `gateway.auth.token` برای تفکیک احراز هویت هنگام راه‌اندازی غیرفعال است، زیرا ورودی توکن محیط برای آن زمان اجرا اولویت دارد.

</Accordion>

## عیب‌یابی سطح احراز هویت Gateway

هنگامی که یک SecretRef روی `gateway.auth.token`، `gateway.auth.password`، `gateway.remote.token` یا `gateway.remote.password` تنظیم شده باشد، راه‌اندازی/بارگذاری مجدد Gateway وضعیت سطح را با کد `SECRETS_GATEWAY_AUTH_SURFACE` ثبت می‌کند:

- `active`: SecretRef بخشی از سطح مؤثر احراز هویت است و باید تفکیک شود.
- `inactive`: سطح احراز هویت دیگری اولویت دارد، یا احراز هویت راه دور غیرفعال/غیر‌فعال است.

ورودی گزارش شامل دلیلی است که خط‌مشی سطح فعال استفاده کرده است.

## پیش‌بررسی ارجاع در راه‌اندازی اولیه

در راه‌اندازی اولیهٔ تعاملی، انتخاب ذخیره‌سازی SecretRef پیش از ذخیره‌کردن، اعتبارسنجی پیش‌بررسی را اجرا می‌کند:

- ارجاع‌های محیط: نام متغیر محیطی را اعتبارسنجی می‌کند و تأیید می‌کند که هنگام راه‌اندازی، مقداری غیرخالی قابل‌مشاهده است.
- ارجاع‌های ارائه‌دهنده (`file` یا `exec`): انتخاب ارائه‌دهنده را اعتبارسنجی می‌کند، `id` را تفکیک می‌کند و نوع مقدار تفکیک‌شده را بررسی می‌کند.
- گردش کار شروع سریع: هنگامی که `gateway.auth.token` از قبل یک SecretRef باشد، راه‌اندازی اولیه با استفاده از همان دروازهٔ شکست سریع، پیش از راه‌اندازی پروب/داشبورد آن را تفکیک می‌کند (برای ارجاع‌های `env`، `file` و `exec`).

شکست اعتبارسنجی خطا را نمایش می‌دهد و امکان تلاش مجدد را فراهم می‌کند.

## قرارداد SecretRef

یک شکل شیء در همه‌جا:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    رشته‌های کوتاه‌شده نیز در فیلدهای SecretInput پذیرفته می‌شوند:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    اعتبارسنجی:

    - `provider` باید با `^[a-z][a-z0-9_-]{0,63}$` مطابقت داشته باشد
    - `id` باید با `^[A-Z][A-Z0-9_]{0,127}$` مطابقت داشته باشد

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    اعتبارسنجی:

    - `provider` باید با `^[a-z][a-z0-9_-]{0,63}$` مطابقت داشته باشد
    - `id` باید یک اشاره‌گر مطلق JSON (`/...`) یا برای ارائه‌دهندگان `singleValue`، مقدار تحت‌اللفظی `value` باشد
    - نویسه‌گریزی RFC 6901 در بخش‌ها: `~` به `~0` و `/` به `~1` تبدیل می‌شود

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    اعتبارسنجی:

    - `provider` باید با `^[a-z][a-z0-9_-]{0,63}$` مطابقت داشته باشد
    - `id` باید با `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` مطابقت داشته باشد (از انتخابگرهایی مانند `secret#json_key` پشتیبانی می‌کند)
    - `id` نباید شامل `.` یا `..` به‌عنوان بخش‌های مسیر جداشده با ممیز باشد (برای مثال، `a/../b` رد می‌شود)

  </Tab>
</Tabs>

## پیکربندی ارائه‌دهنده

ارائه‌دهندگان را زیر `secrets.providers` تعریف کنید:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<Accordion title="ارائه‌دهندهٔ محیط">
- فهرست مجاز اختیاری با تطابق دقیق نام از طریق `allowlist`.
- مقادیر محیطی مفقود یا خالی باعث شکست تفکیک می‌شوند.

</Accordion>

<Accordion title="ارائه‌دهندهٔ فایل">
- فایل محلی در `path` را می‌خواند.
- `mode: "json"` (پیش‌فرض) انتظار یک محتوای شیء JSON را دارد و `id` را به‌عنوان اشاره‌گر JSON تفکیک می‌کند.
- `mode: "singleValue"` انتظار شناسهٔ ارجاع `"value"` را دارد و محتوای خام فایل را برمی‌گرداند (خط جدید انتهایی حذف می‌شود).
- مسیر باید بررسی‌های مالکیت/مجوز را با موفقیت پشت سر بگذارد؛ `timeoutMs` (پیش‌فرض 5000) و `maxBytes` (پیش‌فرض 1 MiB) خواندن را محدود می‌کنند.
- شکست بسته در Windows: اگر تأیید ACL برای مسیر در دسترس نباشد، تفکیک شکست می‌خورد. فقط برای مسیرهای مورد اعتماد، `allowInsecurePath: true` را روی آن ارائه‌دهنده تنظیم کنید تا بررسی دور زده شود.

</Accordion>

<Accordion title="ارائه‌دهنده Exec">
- مسیر مطلق باینری پیکربندی‌شده را مستقیماً و بدون پوسته اجرا می‌کند.
- به‌طور پیش‌فرض `command` باید یک فایل معمولی باشد، نه پیوند نمادین. برای مجاز کردن مسیرهای فرمانِ پیوند نمادین (برای مثال واسط‌های Homebrew)، `allowSymlinkCommand: true` را تنظیم کنید و آن را با `trustedDirs` (برای مثال `["/opt/homebrew"]`) همراه کنید تا فقط مسیرهای مدیر بسته واجد شرایط باشند.
- از `timeoutMs` (پیش‌فرض 5000)، `noOutputTimeoutMs` (پیش‌فرض برابر با `timeoutMs`)، `maxOutputBytes` (پیش‌فرض 1 MiB)، فهرست مجاز `env`/`passEnv` و `trustedDirs` پشتیبانی می‌کند.
- `jsonOnly` به‌طور پیش‌فرض `true` است. با `jsonOnly: false` و درخواست یک شناسه، خروجی متنی ساده و غیر JSON به‌عنوان مقدار همان شناسه پذیرفته می‌شود.
- در Windows، شکست به‌صورت بسته است: اگر تأیید ACL برای مسیر فرمان در دسترس نباشد، تفکیک با شکست مواجه می‌شود. فقط برای مسیرهای مورداعتماد، `allowInsecurePath: true` را روی آن ارائه‌دهنده تنظیم کنید تا بررسی نادیده گرفته شود.
- ارائه‌دهندگان exec مدیریت‌شده توسط Plugin می‌توانند به‌جای نسخه‌ای کپی‌شده از `command`/`args` از `pluginIntegration` استفاده کنند. OpenClaw هنگام راه‌اندازی/بارگذاری مجدد، جزئیات فعلی فرمان را از مانیفست Plugin نصب‌شده تفکیک می‌کند؛ اگر Plugin غیرفعال، حذف‌شده، نامطمئن باشد یا دیگر یکپارچه‌سازی را اعلام نکند، SecretRefهای فعال آن ارائه‌دهنده به‌صورت بسته شکست می‌خورند.

بار درخواست (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

بار پاسخ (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

خطاهای اختیاری برای هر شناسه:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` یک عیب‌یابی اختیاری و قابل‌خواندن توسط ماشین است. OpenClaw کدهای شناخته‌شده
`NOT_FOUND` و `AMBIGUOUS_DUPLICATE_KEY` را همراه با ارائه‌دهنده و شناسه مرجع نمایش می‌دهد. کدهای دیگر
و فیلدهای آزاد مانند `message` برای سازگاری با نسخه ۱ پروتکل پذیرفته می‌شوند،
اما نمایش داده نمی‌شوند، زیرا خروجی تفکیک‌کننده ممکن است حاوی اطلاعات اعتبارنامه باشد.

</Accordion>

## کلیدهای API مبتنی بر فایل

رشته‌های `file:...` را در بلوک `env` پیکربندی قرار ندهید. آن بلوک تحت‌اللفظی است و بازنویسی نمی‌شود، بنابراین `file:...` هرگز در آن تفکیک نمی‌شود.

در عوض، از یک SecretRef فایلی در فیلد اعتبارنامه پشتیبانی‌شده استفاده کنید:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

برای `mode: "singleValue"`، مقدار `id` در SecretRef برابر `"value"` است. برای `mode: "json"`، از یک اشاره‌گر مطلق JSON مانند `"/providers/xai/apiKey"` استفاده کنید.

برای مشاهده فیلدهایی که SecretRef را می‌پذیرند، به [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) مراجعه کنید.

## نمونه‌های یکپارچه‌سازی Exec

برای راهنمای اختصاصی 1Password شامل حساب‌های سرویس، مهارت عامل همراه و عیب‌یابی، به [1Password](/gateway/1password) مراجعه کنید.

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // برای باینری‌های پیوند نمادین Homebrew الزامی است
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    برای نگاشت شناسه‌های SecretRef به کلیدهای آیتم Bitwarden Secrets Manager، از یک پوشش تفکیک‌کننده استفاده کنید. مخزن شامل `scripts/secrets/openclaw-bws-resolver.mjs` است؛ آن را روی میزبانی که Gateway را اجرا می‌کند، در یک مسیر مطلق و مورداعتماد نصب یا کپی کنید.

    الزامات:

    - نصب بودن Bitwarden Secrets Manager CLI (`bws`) روی میزبان Gateway.
    - در دسترس بودن `BWS_ACCESS_TOKEN` برای سرویس Gateway.
    - ارسال `PATH` به تفکیک‌کننده، یا تنظیم `BWS_BIN` روی مسیر مطلق باینری `bws`.
    - هنگام استفاده از یک نمونه خودمیزبان Bitwarden، تنظیم بودن `BWS_SERVER_URL` در محیط.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    تفکیک‌کننده شناسه‌های درخواستی را دسته‌بندی می‌کند، `bws secret list` را اجرا می‌کند و مقادیر فیلدهای `key` رازهای منطبق را بازمی‌گرداند. از کلیدهایی استفاده کنید که قرارداد شناسه SecretRef از نوع exec را برآورده می‌کنند، مانند `openclaw/providers/openai/apiKey`؛ کلیدهایی به سبک متغیر محیطی که دارای زیرخط هستند، پیش از اجرای تفکیک‌کننده رد می‌شوند. اگر بیش از یک راز قابل‌مشاهده Bitwarden کلید درخواستی یکسانی داشته باشد، تفکیک‌کننده به‌جای حدس زدن، آن شناسه را به‌دلیل ابهام ناموفق اعلام می‌کند. پس از به‌روزرسانی پیکربندی، مسیر تفکیک‌کننده را تأیید کنید:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // برای باینری‌های پیوند نمادین Homebrew الزامی است
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    برای نگاشت مستقیم شناسه‌های SecretRef به ورودی‌های `pass`، از یک پوشش تفکیک‌کننده کوچک استفاده کنید. آن را به‌صورت یک فایل اجرایی در مسیری مطلق ذخیره کنید که بررسی‌های مسیر ارائه‌دهنده exec شما را با موفقیت پشت سر می‌گذارد؛ برای مثال `/usr/local/bin/openclaw-pass-resolver`. خط shebang مربوط به `#!/usr/bin/env node`، مقدار `node` را از `PATH` فرایند تفکیک‌کننده پیدا می‌کند؛ بنابراین `PATH` را در `passEnv` قرار دهید. اگر `pass` در آن `PATH` نیست، `PASS_BIN` را در محیط والد تنظیم کنید و آن را نیز در `passEnv` قرار دهید:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    سپس ارائه‌دهنده exec را پیکربندی کنید و `apiKey` را به مسیر ورودی `pass` اشاره دهید:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    راز را در خط نخست ورودی `pass` نگه دارید، یا پوشش را سفارشی کنید تا به‌جای آن، خروجی کامل `pass show` را بازگرداند. پس از به‌روزرسانی پیکربندی، هم ممیزی ایستا و هم مسیر تفکیک‌کننده exec را تأیید کنید:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // برای باینری‌های پیوند نمادین Homebrew الزامی است
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## متغیرهای محیطی سرور MCP

متغیرهای محیطی سرور MCP که از طریق `plugins.entries.acpx.config.mcpServers` پیکربندی می‌شوند، SecretInput را می‌پذیرند و کلیدهای API و توکن‌ها را خارج از پیکربندی متن ساده نگه می‌دارند:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

مقادیر رشته‌ای متن ساده همچنان کار می‌کنند. مراجع الگوی محیطی مانند `${MCP_SERVER_API_KEY}` و اشیای SecretRef هنگام فعال‌سازی gateway و پیش از ایجاد فرایند سرور MCP تفکیک می‌شوند. همانند دیگر سطوح SecretRef، مراجع تفکیک‌نشده فقط زمانی فعال‌سازی را مسدود می‌کنند که Plugin مربوط به `acpx` عملاً فعال باشد.

## اطلاعات احراز هویت SSH در محیط ایزوله

بک‌اند اصلی محیط ایزوله `ssh` از SecretRef برای اطلاعات احراز هویت SSH نیز پشتیبانی می‌کند:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

رفتار زمان اجرا:

- OpenClaw این ارجاع‌ها را هنگام فعال‌سازی sandbox برطرف می‌کند، نه به‌صورت تنبل در هر فراخوانی SSH.
- مقادیر برطرف‌شده با مجوزهای محدودکنندهٔ فایل (`0o600`) در یک دایرکتوری موقت نوشته می‌شوند و در پیکربندی SSH تولیدشده به‌کار می‌روند.
- اگر backend مؤثر sandbox برابر `ssh` نباشد (یا حالت sandbox برابر `off` باشد)، این ارجاع‌ها غیرفعال می‌مانند و مانع راه‌اندازی نمی‌شوند.

## سطح اعتبارنامهٔ پشتیبانی‌شده

اعتبارنامه‌های متعارف پشتیبانی‌شده و پشتیبانی‌نشده در [سطح اعتبارنامهٔ SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.

<Note>
اعتبارنامه‌های صادرشده در زمان اجرا یا چرخشی و داده‌های بازآوری OAuth عمداً از تفکیک فقط‌خواندنی SecretRef کنار گذاشته شده‌اند.
</Note>

## رفتار الزامی و تقدم

- فیلد بدون ارجاع: بدون تغییر.
- فیلد دارای ارجاع: هنگام فعال‌سازی در سطوح فعال الزامی است.
- اگر هم متن ساده و هم ارجاع وجود داشته باشند، در مسیرهای تقدم پشتیبانی‌شده ارجاع اولویت دارد.
- نشانگر ویرایش `__OPENCLAW_REDACTED__` برای ویرایش/بازیابی داخلی پیکربندی رزرو شده است و به‌عنوان دادهٔ پیکربندی تحت‌اللفظی ارسالی رد می‌شود.

سیگنال‌های هشدار و ممیزی:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (هشدار زمان اجرا)
- `REF_SHADOWED` (یافتهٔ ممیزی هنگامی که اعتبارنامه‌های `auth-profiles.json` بر ارجاع‌های `openclaw.json` تقدم دارند)

سازگاری Google Chat: ‏`serviceAccountRef` بر متن سادهٔ `serviceAccount` تقدم دارد؛ به‌محض تنظیم ارجاع هم‌سطح، مقدار متن ساده نادیده گرفته می‌شود.

## محرک‌های فعال‌سازی

فعال‌سازی راز در موارد زیر اجرا می‌شود:

- راه‌اندازی (بررسی اولیه به‌همراه فعال‌سازی نهایی)
- مسیر اعمال فوری بارگذاری مجدد پیکربندی
- مسیر بررسی راه‌اندازی مجدد در بارگذاری مجدد پیکربندی
- بارگذاری مجدد دستی از طریق `secrets.reload`
- بررسی اولیهٔ RPC نوشتن پیکربندی Gateway ‏(`config.set` / `config.apply` / `config.patch`) که پیش از ماندگار کردن ویرایش‌ها، قابلیت تفکیک SecretRef سطح فعال را در بار دادهٔ پیکربندی ارسالی بررسی می‌کند

قرارداد فعال‌سازی:

- در صورت موفقیت، snapshot به‌صورت اتمی جایگزین می‌شود.
- شکست راه‌اندازی، راه‌اندازی Gateway را متوقف می‌کند.
- در صورت شکست بارگذاری مجدد زمان اجرا، آخرین snapshot سالم حفظ می‌شود.
- شکست بررسی اولیهٔ RPC نوشتن، پیکربندی ارسالی را رد می‌کند؛ پیکربندی روی دیسک و snapshot فعال زمان اجرا هر دو بدون تغییر می‌مانند.
- ارائهٔ یک توکن کانال صریح برای هر فراخوانی به فراخوانی helper/ابزار خروجی، فعال‌سازی SecretRef را آغاز نمی‌کند؛ نقاط فعال‌سازی همچنان راه‌اندازی، بارگذاری مجدد و `secrets.reload` صریح هستند.

## سیگنال‌های تنزل و بازیابی

هنگامی که فعال‌سازی در زمان بارگذاری مجدد پس از یک وضعیت سالم شکست می‌خورد، OpenClaw وارد وضعیت تنزل‌یافتهٔ رازها می‌شود و رویدادهای یک‌بارهٔ سیستم و کدهای گزارش زیر را منتشر می‌کند:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

رفتار:

- تنزل‌یافته: زمان اجرا آخرین snapshot سالم را حفظ می‌کند.
- بازیابی‌شده: پس از فعال‌سازی موفق بعدی، یک‌بار منتشر می‌شود.
- شکست‌های تکراری درحالی‌که وضعیت از پیش تنزل‌یافته است، هشدارها را ثبت می‌کنند اما رویداد را دوباره منتشر نمی‌کنند.
- شکست سریع راه‌اندازی هرگز رویداد تنزل‌یافته منتشر نمی‌کند، زیرا زمان اجرا هیچ‌گاه فعال نشده است.

## تفکیک مسیر فرمان

مسیرهای فرمان می‌توانند از طریق یک RPC مربوط به snapshot در Gateway، تفکیک پشتیبانی‌شدهٔ SecretRef را فعال کنند. دو رفتار کلی اعمال می‌شود:

<Tabs>
  <Tab title="مسیرهای فرمان سخت‌گیرانه">
    برای نمونه، مسیرهای حافظهٔ راه‌دور `openclaw memory` و `openclaw qr --remote` هنگامی که به ارجاع‌های راز مشترک راه‌دور نیاز دارد. آن‌ها از snapshot فعال می‌خوانند و اگر یک SecretRef الزامی در دسترس نباشد، سریعاً شکست می‌خورند.
  </Tab>
  <Tab title="مسیرهای فرمان فقط‌خواندنی">
    برای نمونه، `openclaw status`،‏ `openclaw status --all`،‏ `openclaw channels status`،‏ `openclaw channels resolve`،‏ `openclaw security audit` و جریان‌های فقط‌خواندنی doctor/ترمیم پیکربندی. آن‌ها نیز snapshot فعال را ترجیح می‌دهند، اما اگر SecretRef هدف در دسترس نباشد به‌جای توقف تنزل می‌یابند.

    رفتار فقط‌خواندنی:

    - هنگامی که Gateway در حال اجراست، این فرمان‌ها ابتدا از snapshot فعال می‌خوانند.
    - اگر تفکیک Gateway ناقص باشد یا Gateway در دسترس نباشد، آن‌ها برای سطح همان فرمان یک راهکار جایگزین محلی هدفمند را امتحان می‌کنند.
    - اگر SecretRef هدف همچنان در دسترس نباشد، فرمان با خروجی فقط‌خواندنی تنزل‌یافته و یک پیام تشخیصی صریح ادامه می‌یابد که نشان می‌دهد ارجاع پیکربندی شده اما در این مسیر فرمان در دسترس نیست.
    - این رفتار تنزل‌یافته فقط به همان فرمان محدود است؛ راه‌اندازی زمان اجرا، بارگذاری مجدد یا مسیرهای ارسال/احراز هویت را تضعیف نمی‌کند.

  </Tab>
</Tabs>

نکات دیگر:

- بازآوری snapshot پس از چرخش راز در backend توسط `openclaw secrets reload` انجام می‌شود.
- متد RPC در Gateway که این مسیرهای فرمان استفاده می‌کنند: `secrets.resolve`.

## گردش‌کار ممیزی و پیکربندی

جریان پیش‌فرض اپراتور:

<Steps>
  <Step title="ممیزی وضعیت فعلی">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="پیکربندی و اعمال SecretRefها">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="ممیزی مجدد">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

تا زمانی که ممیزی مجدد پاک نباشد، انتقال را کامل تلقی نکنید. اگر ممیزی همچنان مقادیر متن سادهٔ ذخیره‌شده را گزارش کند، حتی وقتی APIهای زمان اجرا مقادیر ویرایش‌شده بازمی‌گردانند، خطر دسترسی عامل همچنان باقی است.

اگر در جریان `configure` به‌جای اعمال، طرحی را ذخیره کردید، پیش از ممیزی مجدد آن طرح ذخیره‌شده را با `openclaw secrets apply --from <plan-path>` اعمال کنید.

<AccordionGroup>
  <Accordion title="secrets audit">
    یافته‌ها شامل موارد زیرند:

    - مقادیر متن سادهٔ ذخیره‌شده (`openclaw.json`،‏ `auth-profiles.json`،‏ `.env` و `agents/*/agent/models.json` تولیدشده).
    - باقی‌مانده‌های متن سادهٔ سربرگ حساس ارائه‌دهنده در ورودی‌های `models.json` تولیدشده.
    - ارجاع‌های تفکیک‌نشده.
    - سایه‌اندازی تقدم (`auth-profiles.json` که بر ارجاع‌های `openclaw.json` اولویت دارد).
    - باقی‌مانده‌های قدیمی (`auth.json`، یادآورهای OAuth).

    نکتهٔ exec: ممیزی به‌طور پیش‌فرض بررسی‌های قابلیت تفکیک SecretRef مربوط به exec را برای جلوگیری از عوارض جانبی فرمان نادیده می‌گیرد. برای اجرای ارائه‌دهندگان exec هنگام ممیزی، از `openclaw secrets audit --allow-exec` استفاده کنید.

    نکتهٔ باقی‌ماندهٔ سربرگ: تشخیص سربرگ حساس ارائه‌دهنده مبتنی بر روش ابتکاری نام است (نام‌های رایج سربرگ احراز هویت/اعتبارنامه و بخش‌هایی مانند `authorization`،‏ `x-api-key`،‏ `token`،‏ `secret`،‏ `password` و `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    helper تعاملی که:

    - ابتدا `secrets.providers` را پیکربندی می‌کند (`env`/`file`/`exec`، افزودن/ویرایش/حذف).
    - امکان انتخاب فیلدهای پشتیبانی‌شدهٔ حاوی راز در `openclaw.json` به‌همراه `auth-profiles.json` را برای محدودهٔ یک عامل فراهم می‌کند.
    - می‌تواند نگاشت جدید `auth-profiles.json` را مستقیماً در انتخابگر هدف ایجاد کند.
    - جزئیات SecretRef را دریافت می‌کند (`source`،‏ `provider`،‏ `id`).
    - تفکیک اولیه را اجرا می‌کند و می‌تواند بلافاصله اعمال کند.

    نکتهٔ exec: بررسی اولیه، بررسی‌های SecretRef مربوط به exec را نادیده می‌گیرد مگر اینکه `--allow-exec` تنظیم شده باشد. اگر مستقیماً از `configure --apply` اعمال می‌کنید و طرح شامل ارجاع‌ها/ارائه‌دهندگان exec است، برای مرحلهٔ اعمال نیز `--allow-exec` را تنظیم‌شده نگه دارید.

    حالت‌های مفید:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    پیش‌فرض‌های اعمال `configure`:

    - اعتبارنامه‌های ایستای منطبق را برای ارائه‌دهندگان هدف از `auth-profiles.json` پاک می‌کند.
    - ورودی‌های ایستای قدیمی `api_key` را از `auth.json` پاک می‌کند.
    - خطوط راز شناخته‌شدهٔ منطبق را از `<config-dir>/.env` پاک می‌کند.

  </Accordion>
  <Accordion title="secrets apply">
    اعمال یک طرح ذخیره‌شده:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    نکتهٔ exec: اجرای آزمایشی، بررسی‌های exec را نادیده می‌گیرد مگر اینکه `--allow-exec` تنظیم شده باشد؛ حالت نوشتن، طرح‌های حاوی SecretRefها/ارائه‌دهندگان exec را رد می‌کند مگر اینکه `--allow-exec` تنظیم شده باشد.

    برای جزئیات قرارداد سخت‌گیرانهٔ هدف/مسیر و قواعد دقیق رد کردن، به [قرارداد طرح اعمال رازها](/fa/gateway/secrets-plan-contract) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## سیاست ایمنی یک‌طرفه

<Warning>
OpenClaw عمداً نسخه‌های پشتیبان بازگشتی حاوی مقادیر تاریخی راز به‌صورت متن ساده نمی‌نویسد.
</Warning>

مدل ایمنی:

- بررسی اولیه باید پیش از حالت نوشتن موفق شود.
- فعال‌سازی زمان اجرا پیش از ثبت اعتبارسنجی می‌شود.
- اعمال، فایل‌ها را با جایگزینی اتمی فایل به‌روزرسانی می‌کند و در صورت شکست، بازیابی را به بهترین شکل ممکن انجام می‌دهد.

## نکات سازگاری احراز هویت قدیمی

برای اعتبارنامه‌های ایستا، زمان اجرا دیگر به ذخیره‌سازی قدیمی احراز هویت به‌صورت متن ساده وابسته نیست.

- منبع اعتبارنامهٔ زمان اجرا، snapshot تفکیک‌شدهٔ درون‌حافظه‌ای است.
- ورودی‌های ایستای قدیمی `api_key` هنگام کشف پاک می‌شوند.
- رفتار سازگاری مرتبط با OAuth جداگانه باقی می‌ماند.

## نکتهٔ رابط کاربری وب

پیکربندی برخی unionهای SecretInput در حالت ویرایشگر خام آسان‌تر از حالت فرم است.

## مرتبط

- [احراز هویت](/fa/gateway/authentication) - راه‌اندازی احراز هویت
- [CLI: رازها](/fa/cli/secrets) - فرمان‌های CLI
- [SecretRefهای Vault](/fa/plugins/vault) - راه‌اندازی ارائه‌دهندهٔ HashiCorp Vault
- [متغیرهای محیطی](/fa/help/environment) - تقدم محیط
- [سطح اعتبارنامهٔ SecretRef](/fa/reference/secretref-credential-surface) - سطح اعتبارنامه
- [قرارداد طرح اعمال رازها](/fa/gateway/secrets-plan-contract) - جزئیات قرارداد طرح
- [امنیت](/fa/gateway/security) - وضعیت امنیتی
