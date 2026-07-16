---
read_when:
    - راه‌اندازی استریم بی‌صدای Matrix برای Synapse یا Tuwunel خودمیزبان‌شده
    - کاربران اعلان‌ها را فقط برای بلوک‌های تکمیل‌شده می‌خواهند، نه برای هر ویرایش پیش‌نمایش
summary: قواعد ارسال Matrix برای هر گیرنده جهت ویرایش‌های بی‌صدای پیش‌نمایش نهایی‌شده
title: قواعد ارسال اعلان Matrix برای پیش‌نمایش‌های بی‌صدا
x-i18n:
    generated_at: "2026-07-16T16:02:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

وقتی `channels.matrix.streaming.mode` برابر با `"quiet"` باشد، OpenClaw پاسخ را با ویرایش درجا و پیوستهٔ یک رویداد پیش‌نمایش واحد ارسال می‌کند. پیش‌نمایش‌ها به‌صورت رویدادهای بدون اعلان `m.notice` ارسال می‌شوند و ویرایش نهایی‌شده با `content["com.openclaw.finalized_preview"] = true` علامت‌گذاری می‌شود. کلاینت‌های Matrix فقط در صورتی برای آن ویرایش نهایی اعلان می‌دهند که یک قانون ارسال اعلان مختص کاربر با این نشانگر مطابقت داشته باشد. این صفحه برای اپراتورهایی است که Matrix را به‌صورت خودمیزبان اجرا می‌کنند و می‌خواهند این قانون را برای حساب هر گیرنده نصب کنند.

`streaming.mode: "progress"` پیش‌نویس‌های خود را از همان مسیر نهایی می‌کند، بنابراین همان قانون برای ویرایش‌های نهایی‌شده در حالت پیشرفت نیز فعال می‌شود.

اگر فقط رفتار استاندارد اعلان Matrix را می‌خواهید، از `streaming.mode: "partial"` استفاده کنید یا پخش پیوسته را غیرفعال نگه دارید. به [راه‌اندازی کانال Matrix](/fa/channels/matrix#streaming-previews) مراجعه کنید.

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
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="توکن دسترسی گیرنده را دریافت کنید">
    در صورت امکان، از توکن نشست موجود یک کلاینت دوباره استفاده کنید. برای ساخت توکنی جدید:

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

  <Step title="قانون ارسال اعلان override را نصب کنید">
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

    - `https://matrix.example.org`: نشانی پایهٔ homeserver شما
    - `$USER_ACCESS_TOKEN`: توکن دسترسی کاربر گیرنده
    - `openclaw-finalized-preview-botname`: شناسهٔ قانونی یکتا برای هر ربات و هر گیرنده (الگو: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`:‏ MXID ربات OpenClaw شما، نه MXID گیرنده

  </Step>

  <Step title="بررسی کنید">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

سپس یک پاسخ پخش‌شده را آزمایش کنید. در حالت بی‌صدا، اتاق یک پیش‌نمایش بی‌صدای پیش‌نویس را نشان می‌دهد و پس از پایان بلوک یا نوبت، یک‌بار اعلان می‌دهد.

  </Step>
</Steps>

برای حذف قانون در آینده، نشانی همان قانون را با توکن گیرنده `DELETE` کنید.

## نکات مربوط به چند ربات

قوانین ارسال اعلان با `ruleId` کلیدگذاری می‌شوند: اجرای دوبارهٔ `PUT` برای همان شناسه، یک قانون واحد را به‌روزرسانی می‌کند. برای چند ربات OpenClaw که به یک گیرنده اعلان می‌دهند، برای هر ربات قانونی جداگانه با تطبیق فرستندهٔ متمایز ایجاد کنید.

قوانین `override` جدیدی که کاربر تعریف می‌کند، پیش از قوانین جلوگیری پیش‌فرض سرور درج می‌شوند؛ بنابراین به پارامتر ترتیب دیگری نیاز نیست. این قانون فقط بر ویرایش‌های پیش‌نمایش صرفاً متنی اثر می‌گذارد که می‌توان آن‌ها را درجا نهایی کرد؛ پاسخ‌های رسانه‌ای، مسیرهای جایگزین پیش‌نمایش منقضی‌شده و متن‌های نهایی‌ای که اشاره‌های Matrix را فعال می‌کنند، در عوض به‌صورت پیام‌های اعلان‌دهندهٔ عادی تحویل می‌شوند.

## نکات homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    هیچ تغییر خاصی در `homeserver.yaml` لازم نیست. اگر اعلان‌های عادی Matrix از قبل به این کاربر می‌رسند، توکن گیرنده به‌همراه فراخوانی `pushrules` بالا، مرحلهٔ اصلی راه‌اندازی است.

    اگر Synapse را پشت پراکسی معکوس یا workerها اجرا می‌کنید، مطمئن شوید `/_matrix/client/.../pushrules/` به‌درستی به Synapse می‌رسد. تحویل اعلان‌ها توسط فرایند اصلی یا `synapse.app.pusher` /‏ workerهای پیکربندی‌شدهٔ ارسال اعلان انجام می‌شود؛ از سالم‌بودن آن‌ها مطمئن شوید.

    این قانون از شرط قانون ارسال اعلان `event_property_is` ‏(MSC3758، قانون ارسال اعلان v1.10) استفاده می‌کند که در سال 2023 به Synapse اضافه شد. نسخه‌های قدیمی‌تر Synapse فراخوانی `PUT pushrules/...` را می‌پذیرند، اما بدون هیچ خطایی هرگز با این شرط مطابقت پیدا نمی‌کنند؛ اگر برای ویرایش پیش‌نمایش نهایی‌شده اعلانی دریافت نمی‌شود، Synapse را ارتقا دهید.

  </Accordion>

  <Accordion title="Tuwunel">
    روند همانند Synapse است؛ برای نشانگر پیش‌نمایش نهایی‌شده به پیکربندی مختص Tuwunel نیازی نیست.

    اگر هنگامی که کاربر در دستگاه دیگری فعال است اعلان‌ها ناپدید می‌شوند، بررسی کنید آیا `suppress_push_when_active` فعال است یا خیر. Tuwunel این گزینه را در نسخهٔ 1.4.2 (سپتامبر 2025) اضافه کرد و این گزینه می‌تواند هنگام فعال‌بودن یک دستگاه، اعلان‌ها به دستگاه‌های دیگر را عمداً متوقف کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راه‌اندازی کانال Matrix](/fa/channels/matrix)
- [مفاهیم پخش پیوسته](/fa/concepts/streaming)
