---
read_when:
    - می‌خواهید OpenClaw را به یک فضای کاری Raft متصل کنید
    - شما در حال پیکربندی یک عامل خارجی Raft هستید
    - در حال اشکال‌زدایی از تحویل بیدارباش Raft هستید
sidebarTitle: Raft
summary: پشتیبانی از عامل خارجی Raft از طریق پل بیدارباش CLI نرم‌افزار Raft
title: رَفت
x-i18n:
    generated_at: "2026-07-12T09:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft یک عامل OpenClaw را از طریق CLI محلی Raft به یک عامل خارجی Raft متصل می‌کند. Raft راهنمای بیدارباش احراز هویت‌شده را به Gateway ارسال می‌کند؛ سپس عامل از CLI ‏Raft برای بررسی و ارسال پیام‌ها استفاده می‌کند. فقط گفت‌وگوی مستقیم (بدون گروه).

## نصب

Raft یک Plugin خارجی رسمی است. آن را روی میزبان Gateway نصب کنید:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

جزئیات: [Pluginها](/fa/tools/plugin)

## پیش‌نیازها

- یک فضای کاری Raft دارای عامل خارجی.
- نصب بودن CLI ‏Raft روی همان میزبانی که Gateway ‏OpenClaw قرار دارد و در `PATH` سرویس.
- یک نمایه CLI ‏Raft که از قبل وارد حساب شده و به آن عامل خارجی مرتبط است.

Plugin اعتبارنامه‌های Raft را ذخیره نمی‌کند؛ CLI ‏Raft اطلاعات احراز هویت را در نمایهٔ خودش نگه می‌دارد.

## پیکربندی

نمایه را در پیکربندی تنظیم کنید:

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

برای حساب پیش‌فرض، می‌توانید به‌جای آن `RAFT_PROFILE` را در محیط Gateway تنظیم کنید:

```bash
RAFT_PROFILE=openclaw
```

وقتی یک Gateway به بیش از یک عامل خارجی Raft متصل می‌شود، از حساب نام‌دار استفاده کنید:

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

راه‌اندازی تعاملی همان نمایه را ثبت می‌کند:

```bash
openclaw channels add --channel raft
```

## نحوهٔ کار

هنگام شروع Gateway، این Plugin:

1. یک نقطهٔ پایانی HTTP بیدارباش را که فقط از local loopback قابل دسترسی است، روی یک درگاه موقت باز می‌کند.
2. دستور `raft --profile <profile> agent bridge` را با آن نقطهٔ پایانی و یک توکن مختص هر فرایند آغاز می‌کند.
3. فقط راهنمای بیدارباش احراز هویت‌شده و بدون محتوا را که دارای شناسهٔ بازپخش از پل محلی باشد، می‌پذیرد.
4. وجود یکی از `eventId`، `attemptId`، `messageId`، `delivery_id`، `wake_id` یا `id` را در هر بار بیدارباش الزامی می‌کند.
5. تحویل‌های مجدد بیدارباش را بر اساس شناسهٔ رویداد پل به‌مدت ۲۴ ساعت، حتی در میان راه‌اندازی‌های مجدد Gateway، حذف تکراری می‌کند.
6. یک نشست پایدار زمان اجرا برای پل فعلی و یک دستهٔ خالی تخلیهٔ فعالیت برای پروتکل CLI ‏Raft برمی‌گرداند.
7. به‌ازای هر بیدارباش پذیرفته‌شده، یک نوبت عامل OpenClaw را به‌صورت سریالی آغاز می‌کند.

پل مالک تلاش‌های مجدد تحویل و اتصال‌های مجدد Raft است. نوبت OpenClaw فقط اعلان بیدارباش را دریافت می‌کند، نه نسخه‌ای از بدنهٔ پیام Raft. عامل از CLI برای خواندن پیام‌های در انتظار و ارسال پاسخ خود استفاده می‌کند:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft یک انتقال‌دهندهٔ پیام فشاری نیست. OpenClaw متن نهایی مدل را به‌طور خودکار از طریق پل بازنمی‌گرداند؛ بنابراین عامل باید پس از پردازش بیدارباش از CLI ‏Raft استفاده کند.
</Note>

## راستی‌آزمایی

بررسی کنید که OpenClaw می‌تواند CLI را پیدا کند و یک نمایهٔ پیکربندی‌شده دارد:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

سپس پیامی به عامل خارجی Raft ارسال کنید. گزارش Gateway باید ابتدا شروع پل Raft و سپس یک بیدارباش ورودی را نشان دهد. عامل باید برای بررسی پیام‌های در انتظار خود از نمایهٔ پیکربندی‌شدهٔ Raft استفاده کند.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="CLI ‏Raft موجود نیست">
    CLI ‏Raft را روی میزبان Gateway نصب کنید و `raft` را در `PATH` سرویس در دسترس قرار دهید. آن را با `raft --help` راستی‌آزمایی کنید، سپس Gateway را دوباره راه‌اندازی کنید.
  </Accordion>
  <Accordion title="پل بلافاصله خارج می‌شود">
    بررسی کنید که نمایهٔ پیکربندی‌شده وارد حساب شده و به عامل خارجی Raft موردنظر تعلق دارد. برای مشاهدهٔ اطلاعات تشخیصی CLI، دستور `raft --profile <profile> agent bridge` را مستقیماً اجرا کنید.
  </Accordion>
  <Accordion title="یک بیدارباش می‌رسد، اما پاسخی از Raft ارسال نمی‌شود">
    وقتی عامل CLI ‏Raft را فراخوانی نکند، این رفتار مورد انتظار است. پل بیدارباش بدنهٔ پیام‌ها یا پاسخ‌های نهایی خودکار را منتقل نمی‌کند. سیاست ابزار عامل را بررسی کنید و مطمئن شوید که می‌تواند `raft --profile <profile>
    message check` و `message send` را اجرا کند.
  </Accordion>
</AccordionGroup>

## منابع

- [Raft](https://raft.build/)
- [مستندات Raft](https://docs.raft.build/welcome/)
- [یکپارچه‌سازی Hermes با Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
