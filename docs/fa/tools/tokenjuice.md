---
read_when:
    - نتایج کوتاه‌تری برای ابزارهای `exec` یا `bash` در OpenClaw می‌خواهید
    - می‌خواهید Plugin همراه tokenjuice را فعال کنید
    - باید بدانید tokenjuice چه چیزهایی را تغییر می‌دهد و چه چیزهایی را خام باقی می‌گذارد
summary: نتایج پرنویز ابزارهای exec و bash را با یک Plugin بسته‌بندی‌شدهٔ اختیاری فشرده کنید.
title: توکن‌جوس
x-i18n:
    generated_at: "2026-04-29T23:46:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` یک Plugin بسته‌بندی‌شدهٔ اختیاری است که نتایج پرنویز ابزارهای `exec` و `bash`
را پس از اجرای فرمان فشرده می‌کند.

این ابزار `tool_result` بازگردانده‌شده را تغییر می‌دهد، نه خود فرمان را. Tokenjuice
ورودی پوسته را بازنویسی نمی‌کند، فرمان‌ها را دوباره اجرا نمی‌کند، و کدهای خروج را تغییر نمی‌دهد.

امروز این قابلیت برای اجراهای تعبیه‌شدهٔ PI و ابزارهای پویای OpenClaw در هارنس
app-server متعلق به Codex اعمال می‌شود. Tokenjuice به میان‌افزار نتیجهٔ ابزار OpenClaw متصل می‌شود و
خروجی را پیش از بازگشت به نشست فعال هارنس کوتاه می‌کند.

## فعال‌سازی Plugin

مسیر سریع:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

معادل آن:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw از پیش این Plugin را همراه خود ارائه می‌کند. مرحلهٔ جداگانه‌ای برای `plugins install`
یا `tokenjuice install openclaw` وجود ندارد.

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

## tokenjuice چه چیزی را تغییر می‌دهد

- نتایج پرنویز `exec` و `bash` را پیش از بازگرداندن به نشست فشرده می‌کند.
- اجرای اصلی فرمان را دست‌نخورده نگه می‌دارد.
- خواندن دقیق محتوای فایل و فرمان‌های دیگری را که tokenjuice باید خام رها کند حفظ می‌کند.
- اختیاری باقی می‌ماند: اگر خروجی واژه‌به‌واژه را همه‌جا می‌خواهید، Plugin را غیرفعال کنید.

## تأیید کارکرد آن

1. Plugin را فعال کنید.
2. نشستی را آغاز کنید که بتواند `exec` را فراخوانی کند.
3. یک فرمان پرنویز مانند `git status` را اجرا کنید.
4. بررسی کنید که نتیجهٔ ابزار بازگردانده‌شده کوتاه‌تر و ساختاریافته‌تر از خروجی خام پوسته باشد.

## غیرفعال‌سازی Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

یا:

```bash
openclaw plugins disable tokenjuice
```

## مرتبط

- [ابزار Exec](/fa/tools/exec)
- [سطوح تفکر](/fa/tools/thinking)
- [موتور زمینه](/fa/concepts/context-engine)
