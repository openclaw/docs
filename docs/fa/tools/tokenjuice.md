---
read_when:
    - می‌خواهید نتایج ابزار `exec` یا `bash` در OpenClaw کوتاه‌تر باشند
    - می‌خواهید Plugin Tokenjuice را نصب یا فعال کنید
    - باید بفهمید tokenjuice چه چیزهایی را تغییر می‌دهد و چه چیزهایی را خام باقی می‌گذارد
summary: نتایج پرنویز ابزارهای exec و bash را با Plugin اختیاری Tokenjuice فشرده کنید
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T19:05:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` یک Plugin خارجی اختیاری است که نتایج پرنویز ابزارهای `exec` و `bash` را پس از اجرای فرمان فشرده‌سازی می‌کند.

این کار `tool_result` بازگردانده‌شده را تغییر می‌دهد، نه خود فرمان را. Tokenjuice ورودی shell را بازنویسی نمی‌کند، فرمان‌ها را دوباره اجرا نمی‌کند، و کدهای خروج را تغییر نمی‌دهد.

امروز این موضوع برای اجراهای تعبیه‌شده OpenClaw و ابزارهای پویای OpenClaw در هارنس app-server مربوط به Codex اعمال می‌شود. Tokenjuice به میان‌افزار نتیجه ابزار OpenClaw متصل می‌شود و خروجی را پیش از بازگشت به نشست فعال هارنس کوتاه می‌کند.

## فعال‌سازی Plugin

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

## tokenjuice چه چیزی را تغییر می‌دهد

- نتایج پرنویز `exec` و `bash` را پیش از بازگردانده‌شدن به نشست فشرده‌سازی می‌کند.
- اجرای فرمان اصلی را دست‌نخورده نگه می‌دارد.
- خواندن دقیق محتوای فایل و فرمان‌های دیگری را که tokenjuice باید خام رها کند، حفظ می‌کند.
- اختیاری باقی می‌ماند: اگر خروجی کلمه‌به‌کلمه را در همه‌جا می‌خواهید، Plugin را غیرفعال کنید.

## بررسی کنید که کار می‌کند

1. Plugin را فعال کنید.
2. نشستی را شروع کنید که بتواند `exec` را فراخوانی کند.
3. یک فرمان پرنویز مانند `git status` را اجرا کنید.
4. بررسی کنید که نتیجه ابزار بازگردانده‌شده کوتاه‌تر و ساختاریافته‌تر از خروجی خام shell باشد.

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
