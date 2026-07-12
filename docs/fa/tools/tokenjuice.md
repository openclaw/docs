---
read_when:
    - شما در OpenClaw به نتایج کوتاه‌تر ابزار `exec` یا `bash` نیاز دارید
    - می‌خواهید Plugin ‏Tokenjuice را نصب یا فعال کنید
    - باید بدانید tokenjuice چه چیزهایی را تغییر می‌دهد و چه چیزهایی را دست‌نخورده باقی می‌گذارد
summary: نتایج پرازدحام ابزارهای exec و bash را با Plugin اختیاری Tokenjuice فشرده کنید
title: توکن‌جویس
x-i18n:
    generated_at: "2026-07-12T10:59:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` یک Plugin خارجی اختیاری است که نتایج پرحجم و شلوغ ابزارهای `exec` و `bash`
را پس از اجرای فرمان فشرده می‌کند.

این Plugin مقدار بازگردانده‌شدهٔ `tool_result` را تغییر می‌دهد، نه خود فرمان را. Tokenjuice
ورودی پوسته را بازنویسی نمی‌کند، فرمان‌ها را دوباره اجرا نمی‌کند و کدهای خروج را تغییر نمی‌دهد.

در حال حاضر، این قابلیت برای اجراهای تعبیه‌شدهٔ OpenClaw و ابزارهای پویای OpenClaw در چارچوب
app-server برنامهٔ Codex اعمال می‌شود. Tokenjuice به میان‌افزار نتیجهٔ ابزار OpenClaw متصل می‌شود و
پیش از بازگرداندن خروجی به نشست فعال چارچوب، آن را کوتاه می‌کند.

## فعال‌کردن Plugin

یک‌بار نصب کنید:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

سپس آن را فعال کنید:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

معادل آن:

```bash
openclaw plugins enable tokenjuice
```

اگر ترجیح می‌دهید پیکربندی را مستقیماً ویرایش کنید:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## تغییراتی که tokenjuice ایجاد می‌کند

- نتایج پرحجم و شلوغ `exec` و `bash` را پیش از بازگرداندن به نشست فشرده می‌کند.
- اجرای فرمان اصلی را بدون تغییر نگه می‌دارد.
- سیاست فهرست‌برداری ایمن را اعمال می‌کند: خواندن دقیق محتوای فایل‌ها به‌صورت خام باقی می‌ماند، فرمان‌های مستقل فهرست‌برداری مخزن می‌توانند فشرده شوند و توالی‌های ترکیبی ناامن فرمان‌ها به‌صورت خام باقی می‌مانند.
- اختیاری باقی می‌ماند: اگر در همه‌جا خروجی عیناً و بدون تغییر می‌خواهید، Plugin را غیرفعال کنید.

## اطمینان از عملکرد صحیح

1. Plugin را فعال کنید.
2. نشستی را آغاز کنید که بتواند `exec` را فراخوانی کند.
3. یک فرمان با خروجی شلوغ، مانند `git status`، اجرا کنید.
4. بررسی کنید که نتیجهٔ بازگردانده‌شدهٔ ابزار از خروجی خام پوسته کوتاه‌تر و ساختاریافته‌تر باشد.

## غیرفعال‌کردن Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

یا:

```bash
openclaw plugins disable tokenjuice
```

## مطالب مرتبط

- [ابزار Exec](/fa/tools/exec)
- [سطوح تفکر](/fa/tools/thinking)
- [موتور زمینه](/fa/concepts/context-engine)
