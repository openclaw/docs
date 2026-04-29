---
read_when:
    - می‌خواهید اجرای عامل‌ها را از اسکریپت‌ها یا خط فرمان راه‌اندازی کنید
    - باید پاسخ‌های عامل را به‌صورت برنامه‌ای به یک کانال گفتگو تحویل دهید
summary: نوبت‌های عامل را از CLI اجرا کنید و به‌صورت اختیاری پاسخ‌ها را به کانال‌ها ارسال کنید
title: ارسال عامل
x-i18n:
    generated_at: "2026-04-29T23:38:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` یک نوبت عامل را از خط فرمان اجرا می‌کند، بدون اینکه به پیام چت ورودی نیاز باشد. از آن برای گردش‌کارهای اسکریپت‌شده، آزمایش، و تحویل برنامه‌نویسی‌شده استفاده کنید.

## شروع سریع

<Steps>
  <Step title="اجرای یک نوبت ساده عامل">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    این پیام را از طریق Gateway می‌فرستد و پاسخ را چاپ می‌کند.

  </Step>

  <Step title="هدف‌گیری یک عامل یا نشست مشخص">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="تحویل پاسخ به یک کانال">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## پرچم‌ها

| پرچم                         | توضیح                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | پیام برای ارسال (الزامی)                                   |
| `--to \<dest\>`               | استخراج کلید نشست از یک مقصد (تلفن، شناسه چت)              |
| `--agent \<id\>`              | هدف‌گیری یک عامل پیکربندی‌شده (از نشست `main` آن استفاده می‌کند) |
| `--session-id \<id\>`         | استفاده دوباره از یک نشست موجود بر اساس شناسه              |
| `--local`                     | اجبار به زمان‌اجرای تعبیه‌شده محلی (رد شدن از Gateway)     |
| `--deliver`                   | ارسال پاسخ به یک کانال چت                                  |
| `--channel \<name\>`          | کانال تحویل (whatsapp، telegram، discord، slack و غیره)     |
| `--reply-to \<target\>`       | بازنویسی مقصد تحویل                                        |
| `--reply-channel \<name\>`    | بازنویسی کانال تحویل                                       |
| `--reply-account \<id\>`      | بازنویسی شناسه حساب تحویل                                  |
| `--thinking \<level\>`        | تنظیم سطح تفکر برای نمایه مدل انتخاب‌شده                   |
| `--verbose \<on\|full\|off\>` | تنظیم سطح خروجی مفصل                                       |
| `--timeout \<seconds\>`       | بازنویسی مهلت زمانی عامل                                   |
| `--json`                      | خروجی JSON ساخت‌یافته                                      |

## رفتار

- به‌طور پیش‌فرض، CLI **از طریق Gateway** عبور می‌کند. `--local` را اضافه کنید تا زمان‌اجرای تعبیه‌شده روی ماشین فعلی اجباری شود.
- اگر Gateway در دسترس نباشد، CLI **به اجرای تعبیه‌شده محلی بازمی‌گردد**.
- انتخاب نشست: `--to` کلید نشست را استخراج می‌کند (مقصدهای گروه/کانال جداسازی را حفظ می‌کنند؛ چت‌های مستقیم به `main` جمع می‌شوند).
- پرچم‌های تفکر و خروجی مفصل در مخزن نشست پایدار می‌مانند.
- خروجی: به‌طور پیش‌فرض متن ساده، یا `--json` برای بار داده ساخت‌یافته + فراداده.

## نمونه‌ها

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## مرتبط

- [مرجع CLI عامل](/fa/cli/agent)
- [عامل‌های فرعی](/fa/tools/subagents) — ایجاد عامل فرعی در پس‌زمینه
- [نشست‌ها](/fa/concepts/session) — کلیدهای نشست چگونه کار می‌کنند
