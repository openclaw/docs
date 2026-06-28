---
read_when:
    - می‌خواهید OpenClaw را به WeChat یا Weixin متصل کنید
    - شما در حال نصب یا عیب‌یابی Plugin کانال openclaw-weixin هستید
    - باید بدانید که Pluginهای کانال خارجی چگونه در کنار Gateway اجرا می‌شوند
summary: راه‌اندازی کانال WeChat از طریق Plugin خارجی openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-05-06T09:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw از طریق Plugin کانال خارجی `@tencent-weixin/openclaw-weixin` متعلق به Tencent به WeChat متصل می‌شود.

وضعیت: Plugin خارجی. چت‌های مستقیم و رسانه پشتیبانی می‌شوند. چت‌های گروهی در فراداده قابلیت‌های Plugin فعلی تبلیغ نشده‌اند.

## نام‌گذاری

- **WeChat** نام کاربرپسند در این مستندات است.
- **Weixin** نامی است که بسته Tencent و شناسه Plugin از آن استفاده می‌کنند.
- `openclaw-weixin` شناسه کانال OpenClaw است.
- `@tencent-weixin/openclaw-weixin` بسته npm است.

از `openclaw-weixin` در دستورهای CLI و مسیرهای پیکربندی استفاده کنید.

## سازوکار

کد WeChat در مخزن هسته OpenClaw قرار ندارد. OpenClaw قرارداد عمومی Plugin کانال را فراهم می‌کند، و Plugin خارجی runtime ویژه WeChat را فراهم می‌کند:

1. `openclaw plugins install` بسته `@tencent-weixin/openclaw-weixin` را نصب می‌کند.
2. Gateway مانیفست Plugin را کشف می‌کند و نقطه ورود Plugin را بارگذاری می‌کند.
3. Plugin شناسه کانال `openclaw-weixin` را ثبت می‌کند.
4. `openclaw channels login --channel openclaw-weixin` ورود با QR را آغاز می‌کند.
5. Plugin اطلاعات ورود حساب را زیر دایرکتوری وضعیت OpenClaw ذخیره می‌کند.
6. هنگام شروع Gateway، Plugin پایشگر Weixin خود را برای هر حساب پیکربندی‌شده شروع می‌کند.
7. پیام‌های ورودی WeChat از طریق قرارداد کانال نرمال‌سازی می‌شوند، به عامل انتخاب‌شده OpenClaw هدایت می‌شوند، و از مسیر خروجی Plugin برگردانده می‌شوند.

این جداسازی مهم است: هسته OpenClaw باید نسبت به کانال‌ها بی‌طرف بماند. ورود WeChat، فراخوانی‌های Tencent iLink API، بارگذاری/دریافت رسانه، توکن‌های زمینه، و پایش حساب تحت مالکیت Plugin خارجی هستند.

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

پس از نصب، Gateway را دوباره راه‌اندازی کنید:

```bash
openclaw gateway restart
```

## ورود

ورود با QR را روی همان ماشینی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw channels login --channel openclaw-weixin
```

کد QR را با WeChat روی تلفن خود اسکن کنید و ورود را تأیید کنید. Plugin پس از اسکن موفق، توکن حساب را به‌صورت محلی ذخیره می‌کند.

برای افزودن یک حساب WeChat دیگر، همان دستور ورود را دوباره اجرا کنید. برای چند حساب، نشست‌های پیام مستقیم را بر اساس حساب، کانال، و فرستنده جدا کنید:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## کنترل دسترسی

پیام‌های مستقیم از مدل عادی جفت‌سازی و allowlist در OpenClaw برای Pluginهای کانال استفاده می‌کنند.

فرستنده‌های جدید را تأیید کنید:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

برای مدل کامل کنترل دسترسی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## سازگاری

Plugin هنگام راه‌اندازی، نسخه OpenClaw میزبان را بررسی می‌کند.

| خط Plugin | نسخه OpenClaw          | برچسب npm |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

اگر Plugin گزارش داد که نسخه OpenClaw شما بیش از حد قدیمی است، یا OpenClaw را به‌روزرسانی کنید یا خط legacy Plugin را نصب کنید:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## فرایند جانبی

Plugin مربوط به WeChat می‌تواند هنگام پایش Tencent iLink API، کارهای کمکی را در کنار Gateway اجرا کند. در issue #68451، آن مسیر کمکی یک باگ را در پاک‌سازی عمومی Gatewayهای کهنه در OpenClaw آشکار کرد: یک فرایند فرزند می‌توانست تلاش کند فرایند Gateway والد را پاک‌سازی کند، که زیر مدیرهای فرایند مانند systemd باعث حلقه‌های راه‌اندازی مجدد می‌شد.

پاک‌سازی راه‌اندازی فعلی OpenClaw فرایند فعلی و نیاکان آن را مستثنی می‌کند، بنابراین یک کمک‌کننده کانال نباید Gatewayای را که آن را راه‌اندازی کرده است بکشد. این اصلاح عمومی است؛ در هسته، مسیر ویژه WeChat نیست.

## عیب‌یابی

نصب و وضعیت را بررسی کنید:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

اگر کانال به‌صورت نصب‌شده نمایش داده می‌شود اما متصل نمی‌شود، تأیید کنید که Plugin فعال است و دوباره راه‌اندازی کنید:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

اگر Gateway پس از فعال‌سازی WeChat به‌طور مکرر دوباره راه‌اندازی می‌شود، هم OpenClaw و هم Plugin را به‌روزرسانی کنید:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

اگر راه‌اندازی گزارش داد که بسته Plugin نصب‌شده `requires compiled runtime
output for TypeScript entry`، بسته npm بدون فایل‌های runtime کامپایل‌شده JavaScript که OpenClaw نیاز دارد منتشر شده است. پس از اینکه منتشرکننده Plugin یک بسته اصلاح‌شده منتشر کرد، به‌روزرسانی/نصب مجدد کنید، یا به‌طور موقت Plugin را غیرفعال/حذف نصب کنید.

غیرفعال‌سازی موقت:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## مستندات مرتبط

- نمای کلی کانال: [کانال‌های چت](/fa/channels)
- جفت‌سازی: [جفت‌سازی](/fa/channels/pairing)
- مسیریابی کانال: [مسیریابی کانال](/fa/channels/channel-routing)
- معماری Plugin: [معماری Plugin](/fa/plugins/architecture)
- SDK مربوط به Plugin کانال: [SDK مربوط به Plugin کانال](/fa/plugins/sdk-channel-plugins)
- بسته خارجی: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
