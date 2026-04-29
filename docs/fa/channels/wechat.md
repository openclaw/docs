---
read_when:
    - می‌خواهید OpenClaw را به WeChat یا Weixin متصل کنید
    - شما در حال نصب یا عیب‌یابی Plugin کانال openclaw-weixin هستید
    - باید بدانید Pluginهای کانال خارجی چگونه در کنار Gateway اجرا می‌شوند
summary: راه‌اندازی کانال WeChat از طریق Plugin خارجی openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-29T22:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw از طریق Plugin کانال خارجی
`@tencent-weixin/openclaw-weixin` متعلق به Tencent به WeChat متصل می‌شود.

وضعیت: Plugin خارجی. چت‌های مستقیم و رسانه پشتیبانی می‌شوند. چت‌های گروهی در فرادادهٔ قابلیت Plugin فعلی اعلام نشده‌اند.

## نام‌گذاری

- **WeChat** نامی است که در این مستندات برای کاربران نمایش داده می‌شود.
- **Weixin** نامی است که در بستهٔ Tencent و شناسهٔ Plugin استفاده می‌شود.
- `openclaw-weixin` شناسهٔ کانال OpenClaw است.
- `@tencent-weixin/openclaw-weixin` بستهٔ npm است.

در فرمان‌های CLI و مسیرهای پیکربندی از `openclaw-weixin` استفاده کنید.

## نحوهٔ کار

کد WeChat در مخزن هستهٔ OpenClaw قرار ندارد. OpenClaw قرارداد عمومی Plugin کانال را فراهم می‌کند و Plugin خارجی runtime اختصاصی WeChat را ارائه می‌دهد:

1. `openclaw plugins install`، بستهٔ `@tencent-weixin/openclaw-weixin` را نصب می‌کند.
2. Gateway مانیفست Plugin را کشف می‌کند و نقطهٔ ورود Plugin را بارگذاری می‌کند.
3. Plugin شناسهٔ کانال `openclaw-weixin` را ثبت می‌کند.
4. `openclaw channels login --channel openclaw-weixin` ورود با QR را شروع می‌کند.
5. Plugin اعتبارنامه‌های حساب را زیر دایرکتوری وضعیت OpenClaw ذخیره می‌کند.
6. هنگام شروع Gateway، Plugin پایشگر Weixin خود را برای هر حساب پیکربندی‌شده شروع می‌کند.
7. پیام‌های ورودی WeChat از طریق قرارداد کانال نرمال‌سازی می‌شوند، به عامل انتخاب‌شدهٔ OpenClaw مسیریابی می‌شوند، و از طریق مسیر خروجی Plugin بازگردانده می‌شوند.

این جداسازی مهم است: هستهٔ OpenClaw باید نسبت به کانال‌ها بی‌طرف بماند. ورود WeChat، فراخوانی‌های Tencent iLink API، بارگذاری/دریافت رسانه، توکن‌های زمینه، و پایش حساب در مالکیت Plugin خارجی هستند.

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

پس از نصب، Gateway را بازراه‌اندازی کنید:

```bash
openclaw gateway restart
```

## ورود

ورود با QR را روی همان دستگاهی اجرا کنید که Gateway را اجرا می‌کند:

```bash
openclaw channels login --channel openclaw-weixin
```

کد QR را با WeChat روی تلفن خود اسکن کنید و ورود را تأیید کنید. Plugin پس از اسکن موفق، توکن حساب را به‌صورت محلی ذخیره می‌کند.

برای افزودن یک حساب WeChat دیگر، همان فرمان ورود را دوباره اجرا کنید. برای چند حساب، نشست‌های پیام مستقیم را بر اساس حساب، کانال، و فرستنده ایزوله کنید:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## کنترل دسترسی

پیام‌های مستقیم از مدل معمول جفت‌سازی و allowlist OpenClaw برای Pluginهای کانال استفاده می‌کنند.

فرستنده‌های جدید را تأیید کنید:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

برای مدل کامل کنترل دسترسی، [جفت‌سازی](/fa/channels/pairing) را ببینید.

## سازگاری

Plugin هنگام شروع، نسخهٔ OpenClaw میزبان را بررسی می‌کند.

| خط Plugin | نسخهٔ OpenClaw          | برچسب npm |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

اگر Plugin گزارش دهد که نسخهٔ OpenClaw شما بیش از حد قدیمی است، یا OpenClaw را به‌روزرسانی کنید یا خط legacy Plugin را نصب کنید:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## فرایند Sidecar

Plugin WeChat می‌تواند هنگام پایش Tencent iLink API، کارهای کمکی را در کنار Gateway اجرا کند. در issue #68451، آن مسیر کمکی یک باگ را در پاک‌سازی عمومی Gateway کهنه در OpenClaw آشکار کرد: یک فرایند فرزند می‌توانست تلاش کند فرایند والد Gateway را پاک‌سازی کند، که زیر مدیران فرایند مانند systemd باعث حلقه‌های بازراه‌اندازی می‌شد.

پاک‌سازی شروع فعلی OpenClaw، فرایند فعلی و اجداد آن را مستثنی می‌کند، بنابراین یک کمک‌کنندهٔ کانال نباید Gatewayای را که آن را راه‌اندازی کرده است بکشد. این اصلاح عمومی است؛ مسیر اختصاصی WeChat در هسته نیست.

## عیب‌یابی

نصب و وضعیت را بررسی کنید:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

اگر کانال به‌صورت نصب‌شده نمایش داده می‌شود اما متصل نمی‌شود، تأیید کنید که Plugin فعال است و بازراه‌اندازی کنید:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

اگر Gateway پس از فعال کردن WeChat به‌طور مکرر بازراه‌اندازی می‌شود، هم OpenClaw و هم Plugin را به‌روزرسانی کنید:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

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
- SDK Plugin کانال: [SDK Plugin کانال](/fa/plugins/sdk-channel-plugins)
- بستهٔ خارجی: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
