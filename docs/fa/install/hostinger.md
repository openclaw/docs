---
read_when:
    - راه‌اندازی OpenClaw روی Hostinger
    - در جست‌وجوی یک VPS مدیریت‌شده برای OpenClaw هستید؟
    - استفاده از OpenClaw با نصب یک‌کلیکی Hostinger
summary: میزبانی OpenClaw در Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T10:10:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

یک Gateway پایدار OpenClaw را روی [Hostinger](https://www.hostinger.com/openclaw) اجرا کنید؛ چه به‌صورت استقرار مدیریت‌شده **۱-کلیکی** و چه به‌صورت نصب روی **VPS** که خودتان مدیریت می‌کنید.

## پیش‌نیازها

- حساب Hostinger ([ثبت‌نام](https://www.hostinger.com/openclaw))
- حدود ۵ تا ۱۰ دقیقه زمان

## گزینه الف: OpenClaw با ۱ کلیک

Hostinger زیرساخت، Docker و به‌روزرسانی‌های خودکار را مدیریت می‌کند. این سریع‌ترین راه برای راه‌اندازی یک نمونه در حال اجرا است.

<Steps>
  <Step title="خرید و راه‌اندازی">
    ۱. در [صفحه OpenClaw در Hostinger](https://www.hostinger.com/openclaw)، یکی از طرح‌های مدیریت‌شده OpenClaw را انتخاب و فرایند خرید را تکمیل کنید.

    <Note>
    هنگام خرید می‌توانید اعتبارهای **Ready-to-Use AI** را انتخاب کنید که از پیش خریداری شده‌اند و بلافاصله در OpenClaw ادغام می‌شوند؛ بنابراین به حساب خارجی یا کلید API از ارائه‌دهندگان دیگر نیازی ندارید و می‌توانید فوراً گفت‌وگو را آغاز کنید. همچنین می‌توانید هنگام راه‌اندازی، کلید خود را از Anthropic، OpenAI، Google Gemini یا xAI وارد کنید.
    </Note>

  </Step>

  <Step title="انتخاب کانال پیام‌رسانی">
    یک یا چند کانال را برای اتصال انتخاب کنید:

    - **WhatsApp** -- کد QR نمایش‌داده‌شده در راهنمای راه‌اندازی را اسکن کنید.
    - **Telegram** -- توکن ربات دریافتی از [BotFather](https://t.me/BotFather) را جای‌گذاری کنید.

  </Step>

  <Step title="تکمیل نصب">
    برای استقرار نمونه، روی **Finish** کلیک کنید. پس از آماده‌شدن، از بخش **OpenClaw Overview** در hPanel به داشبورد OpenClaw دسترسی پیدا کنید.
  </Step>

</Steps>

## گزینه ب: OpenClaw روی VPS

کنترل بیشتری بر سرور خواهید داشت. Hostinger، OpenClaw را از طریق Docker روی VPS شما مستقر می‌کند و شما آن را از طریق **Docker Manager** در hPanel مدیریت می‌کنید.

<Steps>
  <Step title="خرید VPS">
    ۱. در [صفحه OpenClaw در Hostinger](https://www.hostinger.com/openclaw)، یکی از طرح‌های OpenClaw روی VPS را انتخاب و فرایند خرید را تکمیل کنید.

    <Note>
    هنگام خرید می‌توانید اعتبارهای **Ready-to-Use AI** را انتخاب کنید. این اعتبارها از پیش خریداری شده‌اند و بلافاصله در OpenClaw ادغام می‌شوند؛ بنابراین بدون هیچ حساب خارجی یا کلید API از ارائه‌دهندگان دیگر می‌توانید گفت‌وگو را آغاز کنید.
    </Note>

  </Step>

  <Step title="پیکربندی OpenClaw">
    پس از آماده‌سازی VPS، فیلدهای پیکربندی را تکمیل کنید:

    - **Gateway token** -- به‌طور خودکار تولید می‌شود؛ آن را برای استفاده بعدی ذخیره کنید.
    - **WhatsApp number** -- شماره شما همراه با پیش‌شماره کشور (اختیاری).
    - **Telegram bot token** -- دریافتی از [BotFather](https://t.me/BotFather) (اختیاری).
    - **API keys** -- فقط در صورتی لازم است که هنگام خرید، اعتبارهای Ready-to-Use AI را انتخاب نکرده باشید.

  </Step>

  <Step title="راه‌اندازی OpenClaw">
    روی **Deploy** کلیک کنید. پس از اجراشدن، با کلیک روی **Open** در hPanel، داشبورد OpenClaw را باز کنید.
  </Step>

</Steps>

گزارش‌ها، راه‌اندازی‌های مجدد و به‌روزرسانی‌ها از طریق رابط Docker Manager در hPanel انجام می‌شوند. برای به‌روزرسانی، در Docker Manager روی **Update** کلیک کنید تا جدیدترین ایمیج دریافت شود.

## تأیید راه‌اندازی

در کانالی که متصل کرده‌اید، پیام «سلام» را برای دستیار خود ارسال کنید. OpenClaw پاسخ می‌دهد و شما را برای تنظیم ترجیحات اولیه راهنمایی می‌کند.

## عیب‌یابی

**داشبورد بارگیری نمی‌شود** -- چند دقیقه صبر کنید تا آماده‌سازی کانتینر به پایان برسد، سپس گزارش‌های Docker Manager را در hPanel بررسی کنید.

**کانتینر Docker مرتباً راه‌اندازی مجدد می‌شود** -- گزارش‌های Docker Manager را باز کنید و به‌دنبال خطاهای پیکربندی مانند توکن‌های مفقود یا کلیدهای API نامعتبر بگردید.

**ربات Telegram پاسخ نمی‌دهد** -- اگر جفت‌سازی پیام خصوصی الزامی باشد، فرستنده ناشناس به‌جای پاسخ، یک کد کوتاه جفت‌سازی دریافت می‌کند. آن را از گفت‌وگوی داشبورد OpenClaw تأیید کنید یا اگر به پوسته کانتینر دسترسی دارید، از `openclaw pairing approve telegram <CODE>` استفاده کنید. به [جفت‌سازی](/fa/channels/pairing) مراجعه کنید.

## مراحل بعدی

- [کانال‌ها](/fa/channels) -- Telegram، WhatsApp، Discord و موارد دیگر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی

## مرتبط

- [نمای کلی نصب](/fa/install)
- [میزبانی VPS](/fa/vps)
- [DigitalOcean](/fa/install/digitalocean)
