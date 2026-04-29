---
read_when:
    - راه‌اندازی استریم بی‌صدا در Matrix برای Synapse یا Tuwunel خودمیزبان
    - کاربران فقط برای بلوک‌های تکمیل‌شده اعلان می‌خواهند، نه برای هر ویرایش پیش‌نمایش
summary: قوانین اعلان‌رسانی Matrix برای هر گیرنده برای ویرایش‌های بی‌صدای پیش‌نمایش نهایی‌شده
title: قوانین پوش Matrix برای پیش‌نمایش‌های بی‌صدا
x-i18n:
    generated_at: "2026-04-29T22:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

وقتی `channels.matrix.streaming` برابر `"quiet"` باشد، OpenClaw یک رویداد پیش‌نمایش واحد را درجا ویرایش می‌کند و ویرایش نهایی‌شده را با یک پرچم محتوای سفارشی علامت‌گذاری می‌کند. کلاینت‌های Matrix فقط زمانی برای ویرایش نهایی اعلان می‌فرستند که یک قانون push مخصوص هر کاربر با آن پرچم مطابقت داشته باشد. این صفحه برای اپراتورهایی است که Matrix را خودشان میزبانی می‌کنند و می‌خواهند آن قانون را برای هر حساب گیرنده نصب کنند.

اگر فقط رفتار اعلان استاندارد Matrix را می‌خواهید، از `streaming: "partial"` استفاده کنید یا استریمینگ را خاموش بگذارید. [راه‌اندازی کانال Matrix](/fa/channels/matrix#streaming-previews) را ببینید.

## پیش‌نیازها

- کاربر گیرنده = شخصی که باید اعلان را دریافت کند
- کاربر ربات = حساب Matrix متعلق به OpenClaw که پاسخ را ارسال می‌کند
- برای فراخوانی‌های API زیر از access token کاربر گیرنده استفاده کنید
- در قانون push، `sender` را با MXID کامل کاربر ربات مطابقت دهید
- حساب گیرنده باید از قبل pusherهای سالم داشته باشد — قوانین پیش‌نمایش بی‌صدا فقط وقتی کار می‌کنند که تحویل push معمول Matrix سالم باشد

## مراحل

<Steps>
  <Step title="پیکربندی پیش‌نمایش‌های بی‌صدا">

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

  <Step title="دریافت access token گیرنده">
    تا حد امکان از توکن یک نشست کلاینت موجود دوباره استفاده کنید. برای ساختن یک توکن تازه:

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

  <Step title="بررسی وجود pusherها">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

اگر هیچ pusherی برنگشت، قبل از ادامه، تحویل push معمول Matrix را برای این حساب درست کنید.

  </Step>

  <Step title="نصب قانون push از نوع override">
    OpenClaw ویرایش‌های پیش‌نمایش فقط‌متنی نهایی‌شده را با `content["com.openclaw.finalized_preview"] = true` علامت‌گذاری می‌کند. قانونی نصب کنید که هم با آن نشانگر و هم با MXID ربات به‌عنوان فرستنده مطابقت داشته باشد:

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

    قبل از اجرا جایگزین کنید:

    - `https://matrix.example.org`: URL پایه homeserver شما
    - `$USER_ACCESS_TOKEN`: access token کاربر گیرنده
    - `openclaw-finalized-preview-botname`: یک شناسه قانون که برای هر ربات و هر گیرنده یکتا است (الگو: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID ربات OpenClaw شما، نه MXID گیرنده

  </Step>

  <Step title="بررسی">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

سپس یک پاسخ استریم‌شده را آزمایش کنید. در حالت بی‌صدا، اتاق یک پیش‌نمایش پیش‌نویس بی‌صدا نشان می‌دهد و وقتی block یا نوبت تمام شد، یک‌بار اعلان می‌فرستد.

  </Step>
</Steps>

برای حذف قانون در آینده، همان URL قانون را با توکن گیرنده `DELETE` کنید.

## نکته‌های چندرباتی

قوانین push با `ruleId` کلیدگذاری می‌شوند: اجرای دوباره `PUT` روی همان شناسه، یک قانون واحد را به‌روزرسانی می‌کند. برای چند ربات OpenClaw که به یک گیرنده اعلان می‌فرستند، برای هر ربات یک قانون با مطابقت فرستنده متمایز بسازید.

قوانین `override` جدیدِ تعریف‌شده توسط کاربر پیش از قوانین پیش‌فرض سرکوب درج می‌شوند، بنابراین به پارامتر ترتیب‌دهی اضافه‌ای نیاز نیست. این قانون فقط روی ویرایش‌های پیش‌نمایش فقط‌متنی اثر می‌گذارد که می‌توانند درجا نهایی شوند؛ fallbackهای رسانه‌ای و fallbackهای پیش‌نمایش کهنه از تحویل معمول Matrix استفاده می‌کنند.

## نکته‌های homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    به تغییر ویژه‌ای در `homeserver.yaml` نیاز نیست. اگر اعلان‌های معمول Matrix از قبل به این کاربر می‌رسند، توکن گیرنده + فراخوانی `pushrules` بالا مرحله اصلی راه‌اندازی است.

    اگر Synapse را پشت reverse proxy یا workerها اجرا می‌کنید، مطمئن شوید `/_matrix/client/.../pushrules/` به‌درستی به Synapse می‌رسد. تحویل push توسط فرایند اصلی یا `synapse.app.pusher` / workerهای pusher پیکربندی‌شده انجام می‌شود — مطمئن شوید آن‌ها سالم هستند.

    این قانون از شرط قانون push به نام `event_property_is` استفاده می‌کند (MSC3758، قانون push v1.10) که در سال 2023 به Synapse اضافه شد. نسخه‌های قدیمی‌تر Synapse فراخوانی `PUT pushrules/...` را می‌پذیرند اما بی‌صدا هرگز شرط را match نمی‌کنند — اگر برای ویرایش پیش‌نمایش نهایی‌شده اعلانی نمی‌رسد، Synapse را ارتقا دهید.

  </Accordion>

  <Accordion title="Tuwunel">
    روند همانند Synapse است؛ برای نشانگر پیش‌نمایش نهایی‌شده به پیکربندی مخصوص Tuwunel نیاز نیست.

    اگر وقتی کاربر روی دستگاه دیگری فعال است اعلان‌ها ناپدید می‌شوند، بررسی کنید که آیا `suppress_push_when_active` فعال است یا نه. Tuwunel این گزینه را در 1.4.2 (سپتامبر 2025) اضافه کرد و می‌تواند عمداً pushها به دستگاه‌های دیگر را وقتی یک دستگاه فعال است سرکوب کند.

  </Accordion>
</AccordionGroup>

## مرتبط

- [راه‌اندازی کانال Matrix](/fa/channels/matrix)
- [مفاهیم استریمینگ](/fa/concepts/streaming)
