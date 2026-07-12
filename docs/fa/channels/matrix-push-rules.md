---
read_when:
    - راه‌اندازی استریم بی‌صدا در Matrix برای Synapse یا Tuwunel خودمیزبان
    - کاربران اعلان‌ها را فقط برای بلوک‌های تکمیل‌شده می‌خواهند، نه برای هر ویرایش پیش‌نمایش
summary: قواعد ارسال اعلان Matrix برای هر گیرنده جهت ویرایش‌های بی‌صدای پیش‌نمایش نهایی‌شده
title: قواعد پوش ماتریس برای پیش‌نمایش‌های بی‌صدا
x-i18n:
    generated_at: "2026-07-12T09:37:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

وقتی `channels.matrix.streaming` روی `"quiet"` تنظیم شده باشد، OpenClaw پاسخ را با ویرایش درجا و پیوستهٔ یک رویداد پیش‌نمایش واحد ارسال می‌کند. پیش‌نمایش‌ها به‌صورت رویدادهای بدون اعلان `m.notice` ارسال می‌شوند و ویرایش نهایی با `content["com.openclaw.finalized_preview"] = true` علامت‌گذاری می‌شود. کلاینت‌های Matrix تنها در صورتی برای آن ویرایش نهایی اعلان می‌فرستند که یک قانون ارسال اعلان مختص کاربر با این نشانگر مطابقت داشته باشد. این صفحه برای اپراتورهایی است که Matrix را به‌صورت خودمیزبان اجرا می‌کنند و می‌خواهند این قانون را برای حساب هر گیرنده نصب کنند.

`streaming: "progress"` پیش‌نویس‌های خود را از همان مسیر نهایی می‌کند، بنابراین همین قانون برای ویرایش‌های نهایی‌شده در حالت پیشرفت نیز فعال می‌شود.

اگر فقط رفتار استاندارد اعلان‌های Matrix را می‌خواهید، از `streaming: "partial"` استفاده کنید یا ارسال پیوسته را غیرفعال بگذارید. به [راه‌اندازی کانال Matrix](/fa/channels/matrix#streaming-previews) مراجعه کنید.

## پیش‌نیازها

- کاربر گیرنده = شخصی که باید اعلان را دریافت کند
- کاربر ربات = حساب Matrix متعلق به OpenClaw که پاسخ را ارسال می‌کند
- برای فراخوانی‌های API زیر از توکن دسترسی کاربر گیرنده استفاده کنید
- مقدار `sender` در قانون ارسال اعلان را با MXID کامل کاربر ربات مطابقت دهید
- حساب گیرنده باید از قبل ارسال‌کننده‌های اعلان فعال داشته باشد؛ قوانین پیش‌نمایش بی‌صدا فقط زمانی کار می‌کنند که تحویل عادی اعلان‌های Matrix سالم باشد

## مراحل

<Steps>
  <Step title="پیش‌نمایش‌های بی‌صدا را پیکربندی کنید">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="توکن دسترسی گیرنده را دریافت کنید">
    در صورت امکان، از توکن نشست موجود یک کلاینت دوباره استفاده کنید. برای ایجاد توکن جدید:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="وجود ارسال‌کننده‌های اعلان را بررسی کنید">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

اگر هیچ ارسال‌کنندهٔ اعلانی برگردانده نشد، پیش از ادامه، تحویل عادی اعلان‌های Matrix را برای این حساب اصلاح کنید.

  </Step>

  <Step title="قانون ارسال اعلان با اولویت بالا را نصب کنید">
    قانونی نصب کنید که با نشانگر پیش‌نمایش نهایی‌شده و MXID ربات به‌عنوان فرستنده مطابقت داشته باشد:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    پیش از اجرا، موارد زیر را جایگزین کنید:

    - `https://matrix.example.org`: نشانی پایهٔ سرور خانگی شما
    - `$USER_ACCESS_TOKEN`: توکن دسترسی کاربر گیرنده
    - `openclaw-finalized-preview-botname`: شناسهٔ قانون یکتا برای هر ربات و هر گیرنده (الگو: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID ربات OpenClaw شما، نه MXID گیرنده

  </Step>

  <Step title="بررسی کنید">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

سپس یک پاسخ پیوسته را آزمایش کنید. در حالت بی‌صدا، اتاق یک پیش‌نمایش بی‌صدای پیش‌نویس را نشان می‌دهد و پس از پایان بلوک یا نوبت، یک بار اعلان می‌فرستد.

  </Step>
</Steps>

برای حذف قانون در آینده، با توکن گیرنده درخواست `DELETE` را به همان نشانی قانون ارسال کنید.

## نکات مربوط به چند ربات

قوانین ارسال اعلان با `ruleId` کلیدگذاری می‌شوند: اجرای دوبارهٔ `PUT` برای همان شناسه، یک قانون واحد را به‌روزرسانی می‌کند. برای چند ربات OpenClaw که به یک گیرنده اعلان می‌فرستند، برای هر ربات یک قانون با تطبیق فرستندهٔ مجزا ایجاد کنید.

قوانین جدید `override` تعریف‌شده توسط کاربر پیش از قوانین پیش‌فرض سرور برای سرکوب اعلان درج می‌شوند، بنابراین به پارامتر ترتیب‌دهی اضافی نیازی نیست. این قانون فقط بر ویرایش‌های پیش‌نمایش صرفاً متنی اثر می‌گذارد که بتوان آن‌ها را درجا نهایی کرد؛ پاسخ‌های رسانه‌ای، بازگشت‌های جایگزین ناشی از پیش‌نمایش منقضی و متن‌های نهایی‌ای که اشاره‌های Matrix را فعال می‌کنند، در عوض به‌صورت پیام‌های عادی همراه با اعلان تحویل داده می‌شوند.

## نکات سرور خانگی

<AccordionGroup>
  <Accordion title="Synapse">
    هیچ تغییر ویژه‌ای در `homeserver.yaml` لازم نیست. اگر اعلان‌های عادی Matrix از قبل به این کاربر می‌رسند، توکن گیرنده و فراخوانی `pushrules` در بالا، مرحلهٔ اصلی راه‌اندازی هستند.

    اگر Synapse را پشت پراکسی معکوس یا با فرایندهای کارگر اجرا می‌کنید، مطمئن شوید `/_matrix/client/.../pushrules/` به‌درستی به Synapse می‌رسد. تحویل اعلان توسط فرایند اصلی یا `synapse.app.pusher` / فرایندهای کارگر ارسال اعلانِ پیکربندی‌شده انجام می‌شود—از سالم‌بودن آن‌ها مطمئن شوید.

    این قانون از شرط `event_property_is` برای قانون ارسال اعلان استفاده می‌کند (MSC3758، نسخهٔ 1.10 قانون ارسال اعلان) که در سال ۲۰۲۳ به Synapse افزوده شد. نسخه‌های قدیمی‌تر Synapse فراخوانی `PUT pushrules/...` را می‌پذیرند، اما بی‌سروصدا هیچ‌گاه شرط را تطبیق نمی‌دهند—اگر برای ویرایش نهایی‌شدهٔ پیش‌نمایش اعلانی دریافت نمی‌شود، Synapse را ارتقا دهید.

  </Accordion>

  <Accordion title="Tuwunel">
    روند همانند Synapse است؛ برای نشانگر پیش‌نمایش نهایی‌شده، هیچ پیکربندی ویژهٔ Tuwunel لازم نیست.

    اگر هنگام فعال‌بودن کاربر در دستگاهی دیگر اعلان‌ها ناپدید می‌شوند، بررسی کنید که آیا `suppress_push_when_active` فعال است یا نه. Tuwunel این گزینه را در نسخهٔ 1.4.2 (سپتامبر ۲۰۲۵) اضافه کرد و این گزینه می‌تواند هنگامی که یک دستگاه فعال است، ارسال اعلان به دستگاه‌های دیگر را عمداً سرکوب کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راه‌اندازی کانال Matrix](/fa/channels/matrix)
- [مفاهیم ارسال پیوسته](/fa/concepts/streaming)
