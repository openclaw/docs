---
read_when:
    - می‌خواهید OpenClaw را به یک فضای کاری Raft متصل کنید
    - شما در حال پیکربندی یک عامل خارجی Raft هستید
    - شما در حال اشکال‌زدایی تحویل بیدارسازی Raft هستید
sidebarTitle: Raft
summary: پشتیبانی از عامل خارجی Raft از طریق پل بیدارسازی CLI Raft
title: قایق بادی
x-i18n:
    generated_at: "2026-06-27T17:14:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

پشتیبانی Raft یک عامل OpenClaw را از طریق CLI محلی Raft به یک عامل خارجی Raft متصل می‌کند. Raft اعلان‌های بیدارسازی احرازهویت‌شده را به Gateway می‌فرستد. سپس عامل از CLI‏ Raft برای بررسی و ارسال پیام‌ها استفاده می‌کند.

## نصب

Raft یک Plugin خارجی رسمی است. آن را روی میزبان Gateway نصب کنید:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

جزئیات: [Plugins](/fa/tools/plugin)

## پیش‌نیازها

- یک فضای کاری Raft با یک عامل خارجی.
- CLI‏ Raft نصب‌شده روی همان میزبانی که Gateway‏ OpenClaw روی آن قرار دارد.
- یک پروفایل CLI‏ Raft که از قبل وارد شده و با آن عامل خارجی مرتبط است.

Plugin اعتبارنامه‌های Raft را ذخیره نمی‌کند. CLI‏ Raft این احراز هویت را
در پروفایل خودش نگه می‌دارد.

## پیکربندی

پروفایل را در پیکربندی تنظیم کنید:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

برای حساب پیش‌فرض، می‌توانید به‌جای آن `RAFT_PROFILE` را در محیط Gateway
تنظیم کنید:

```bash
RAFT_PROFILE=openclaw
```

وقتی یک Gateway به بیش از یک عامل خارجی Raft متصل می‌شود، از یک حساب نام‌گذاری‌شده استفاده کنید:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

روند راه‌اندازی تعاملی همان پروفایل را ثبت می‌کند:

```bash
openclaw channels setup raft
```

## نحوه کار

وقتی Gateway شروع به کار می‌کند، Plugin:

1. یک نقطه پایانی HTTP بیدارسازی فقط local loopback را روی یک درگاه موقت باز می‌کند.
2. `raft --profile <profile> agent bridge` را با آن نقطه پایانی و یک
   توکن مخصوص هر فرایند شروع می‌کند.
3. فقط اعلان‌های بیدارسازی احرازهویت‌شده و بدون محتوا را که دارای هویت بازپخش از پل محلی هستند می‌پذیرد.
4. وجود یکی از `eventId`،‏ `attemptId`،‏ `messageId`،‏ `delivery_id`،‏ `wake_id`، یا `id` را الزامی می‌کند.
5. تحویل‌های بیدارسازی تکرارشده اخیر را بر اساس شناسه رویداد پل، حتی در میان راه‌اندازی‌های دوباره Gateway، حذف تکراری می‌کند.
6. یک نشست زمان‌اجرای پایدار برای پل فعلی و یک دسته تخلیه فعالیت خالی برای پروتکل CLI‏ Raft برمی‌گرداند.
7. برای هر بیدارسازی پذیرفته‌شده، یک نوبت سریالی عامل OpenClaw را شروع می‌کند.

پل مالک تلاش‌های مجدد تحویل Raft و اتصال‌های دوباره است. نوبت OpenClaw
فقط یک اعلان بیدارسازی دریافت می‌کند، نه بدنه کپی‌شده پیام Raft. برای خواندن
پیام‌های در انتظار و ارسال پاسخ خود از CLI استفاده می‌کند:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft یک انتقال معمول پیام فشاری نیست. OpenClaw متن نهایی مدل را به‌طور خودکار
از طریق پل برنمی‌گرداند، بنابراین عامل باید پس از پردازش یک بیدارسازی از
CLI‏ Raft استفاده کند.
</Note>

## تأیید

بررسی کنید که OpenClaw بتواند CLI را پیدا کند و یک پروفایل پیکربندی‌شده داشته باشد:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

سپس پیامی به عامل خارجی Raft بفرستید. لاگ Gateway باید شروع شدن
پل Raft و سپس یک بیدارسازی ورودی را نشان دهد. عامل باید از پروفایل
پیکربندی‌شده Raft برای بررسی پیام‌های در انتظار خود استفاده کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="CLI‏ Raft موجود نیست">
    CLI‏ Raft را روی میزبان Gateway نصب کنید و `raft` را در `PATH`
    سرویس در دسترس قرار دهید. آن را با `raft --help` تأیید کنید، سپس Gateway را دوباره راه‌اندازی کنید.
  </Accordion>
  <Accordion title="پل بلافاصله خارج می‌شود">
    تأیید کنید پروفایل پیکربندی‌شده وارد شده است و به عامل خارجی
    Raft موردنظر تعلق دارد. `raft --profile <profile> agent bridge` را مستقیماً اجرا کنید
    تا تشخیص CLI را ببینید.
  </Accordion>
  <Accordion title="بیدارسازی می‌رسد اما هیچ پاسخ Raft ارسال نمی‌شود">
    وقتی عامل CLI‏ Raft را فراخوانی نمی‌کند، این رفتار مورد انتظار است. پل بیدارسازی
    بدنه پیام‌ها یا پاسخ‌های نهایی خودکار را حمل نمی‌کند. سیاست ابزار
    عامل را بررسی کنید و مطمئن شوید که می‌تواند `raft --profile <profile> message
    check` و `message send` را اجرا کند.
  </Accordion>
</AccordionGroup>

## منابع

- [Raft](https://raft.build/)
- [مستندات Raft](https://docs.raft.build/welcome/)
- [یکپارچه‌سازی Hermes Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
