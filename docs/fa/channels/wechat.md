---
read_when:
    - می‌خواهید OpenClaw را به WeChat یا Weixin متصل کنید
    - شما در حال نصب یا عیب‌یابی Plugin کانال openclaw-weixin هستید
    - باید درک کنید که Pluginهای کانال خارجی چگونه در کنار Gateway اجرا می‌شوند
summary: راه‌اندازی کانال WeChat از طریق Plugin خارجی openclaw-weixin
title: وی‌چت
x-i18n:
    generated_at: "2026-07-12T09:40:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw از طریق افزونهٔ کانال خارجی Tencent با نام
`@tencent-weixin/openclaw-weixin` به WeChat متصل می‌شود.

وضعیت: افزونهٔ خارجی، نگهداری‌شده توسط تیم Tencent Weixin. گفت‌وگوهای مستقیم و
رسانه پشتیبانی می‌شوند. گفت‌وگوهای گروهی در فرادادهٔ قابلیت‌های افزونه اعلام
نشده‌اند (افزونه فقط گفت‌وگوهای مستقیم را اعلام می‌کند).

## نام‌گذاری

- **WeChat** نامی است که در این مستندات به کاربران نمایش داده می‌شود.
- **Weixin** نامی است که بستهٔ Tencent و شناسهٔ افزونه از آن استفاده می‌کنند.
- `openclaw-weixin` شناسهٔ کانال OpenClaw است (`weixin` و `wechat` نیز به‌عنوان نام مستعار کار می‌کنند).
- `@tencent-weixin/openclaw-weixin` بستهٔ npm است.

در فرمان‌های CLI و مسیرهای پیکربندی از `openclaw-weixin` استفاده کنید.

## نحوهٔ کار

کد WeChat در مخزن هستهٔ OpenClaw قرار ندارد. OpenClaw قرارداد عمومی افزونهٔ
کانال را فراهم می‌کند و افزونهٔ خارجی، محیط اجرای مختص WeChat را ارائه می‌دهد:

1. `openclaw plugins install` بستهٔ `@tencent-weixin/openclaw-weixin` را نصب می‌کند.
2. Gateway مانیفست افزونه را شناسایی و نقطهٔ ورود افزونه را بارگذاری می‌کند.
3. افزونه شناسهٔ کانال `openclaw-weixin` را ثبت می‌کند.
4. `openclaw channels login --channel openclaw-weixin` ورود با کد QR را آغاز می‌کند.
5. افزونه اطلاعات احراز هویت حساب را در پوشهٔ وضعیت OpenClaw ذخیره می‌کند
   (به‌طور پیش‌فرض `~/.openclaw`).
6. هنگام راه‌اندازی Gateway، افزونه برای هر حساب پیکربندی‌شده پایشگر Weixin خود
   را راه‌اندازی می‌کند.
7. پیام‌های ورودی WeChat از طریق قرارداد کانال نرمال‌سازی می‌شوند، به عامل
   انتخاب‌شدهٔ OpenClaw هدایت می‌شوند و از مسیر خروجی افزونه پاسخ داده می‌شوند.

این تفکیک مهم است: هستهٔ OpenClaw نسبت به کانال مستقل باقی می‌ماند. ورود WeChat،
فراخوانی‌های API سرویس Tencent iLink، بارگذاری و دریافت رسانه، توکن‌های زمینه
و پایش حساب بر عهدهٔ افزونهٔ خارجی هستند.

## نصب

نصب سریع:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

نصب دستی:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

پس از نصب، Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw gateway restart
```

## ورود

ورود با کد QR را در همان دستگاهی اجرا کنید که Gateway روی آن اجرا می‌شود:

```bash
openclaw channels login --channel openclaw-weixin
```

کد QR را با WeChat تلفن خود اسکن و ورود را تأیید کنید. افزونه پس از اسکن موفق،
توکن حساب را به‌صورت محلی ذخیره می‌کند.

برای افزودن حساب WeChat دیگری، همان فرمان ورود را دوباره اجرا کنید. برای چند
حساب، نشست‌های پیام مستقیم را بر اساس حساب، کانال و فرستنده تفکیک کنید:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## کنترل دسترسی

پیام‌های مستقیم از مدل معمول جفت‌سازی و فهرست مجاز OpenClaw برای افزونه‌های
کانال استفاده می‌کنند.

فرستندگان جدید را تأیید کنید:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

برای آشنایی با مدل کامل کنترل دسترسی، به [جفت‌سازی](/fa/channels/pairing) مراجعه کنید.

## سازگاری

افزونه هنگام راه‌اندازی، نسخهٔ OpenClaw میزبان را بررسی می‌کند.

| سری افزونه | نسخهٔ OpenClaw                                                  | برچسب npm |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (نسخهٔ فعلی 2.4.6؛ نسخه‌های اولیهٔ 2.x از `>=2026.3.22` پشتیبانی می‌کردند) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

اگر افزونه گزارش داد که نسخهٔ OpenClaw شما بیش از حد قدیمی است، OpenClaw را
به‌روزرسانی کنید یا سری قدیمی افزونه را نصب کنید:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## فرایند جانبی

افزونهٔ WeChat هنگام پایش API سرویس Tencent iLink می‌تواند در کنار Gateway،
کارهای کمکی را اجرا کند. در مسئلهٔ شمارهٔ 68451، این مسیر کمکی اشکالی را در
پاک‌سازی عمومی Gateway منقضی‌شده در OpenClaw آشکار کرد: یک فرایند فرزند ممکن
بود تلاش کند فرایند والد Gateway را پاک‌سازی کند و زیر نظر مدیران فرایند مانند
systemd باعث ایجاد چرخه‌های راه‌اندازی مجدد شود.

پاک‌سازی کنونی هنگام راه‌اندازی OpenClaw، فرایند جاری و فرایندهای اجداد آن را
مستثنا می‌کند؛ بنابراین یک فرایند کمکی کانال نمی‌تواند Gateway راه‌انداز خود را
از بین ببرد. این اصلاح عمومی است و در هسته مسیر مختص WeChat نیست.

## رفع اشکال

نصب و وضعیت را بررسی کنید:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

اگر کانال به‌صورت نصب‌شده نمایش داده می‌شود اما متصل نمی‌شود، از فعال بودن
افزونه مطمئن شوید و Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

اگر Gateway پس از فعال کردن WeChat مرتباً راه‌اندازی مجدد می‌شود، OpenClaw و
افزونه را به‌روزرسانی کنید:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

اگر هنگام راه‌اندازی گزارش شد که بستهٔ افزونهٔ نصب‌شدهٔ `requires compiled runtime
output for TypeScript entry`، بستهٔ npm بدون فایل‌های کامپایل‌شدهٔ محیط اجرای
JavaScript مورد نیاز OpenClaw منتشر شده است. پس از انتشار بستهٔ اصلاح‌شده توسط
ناشر افزونه، آن را به‌روزرسانی یا دوباره نصب کنید؛ یا موقتاً افزونه را غیرفعال
یا حذف کنید.

غیرفعال‌سازی موقت:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## مستندات مرتبط

- نمای کلی کانال: [کانال‌های گفت‌وگو](/fa/channels)
- جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)
- مسیریابی کانال: [مسیریابی کانال](/fa/channels/channel-routing)
- معماری افزونه: [معماری Plugin](/fa/plugins/architecture)
- SDK افزونهٔ کانال: [SDK افزونهٔ کانال](/fa/plugins/sdk-channel-plugins)
- بستهٔ خارجی: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
