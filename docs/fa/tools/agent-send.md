---
read_when:
    - می‌خواهید اجراهای عامل را از اسکریپت‌ها یا خط فرمان راه‌اندازی کنید
    - باید پاسخ‌های عامل را به‌صورت برنامه‌نویسی به یک کانال چت ارسال کنید
summary: اجرای نوبت‌های عامل از CLI و ارسال اختیاری پاسخ‌ها به کانال‌ها
title: ارسال عامل
x-i18n:
    generated_at: "2026-05-06T09:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` یک نوبت اجرای عامل را از خط فرمان اجرا می‌کند، بدون آنکه به
پیام گفت‌وگوی ورودی نیاز باشد. از آن برای گردش‌کارهای اسکریپتی، آزمایش، و
تحویل برنامه‌پذیر استفاده کنید.

## شروع سریع

<Steps>
  <Step title="اجرای یک نوبت ساده عامل">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    این پیام را از طریق Gateway ارسال می‌کند و پاسخ را چاپ می‌کند.

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
| `--message \<text\>`          | پیام برای ارسال (الزامی)                                    |
| `--to \<dest\>`               | استخراج کلید نشست از یک مقصد (تلفن، شناسه گفت‌وگو)          |
| `--agent \<id\>`              | هدف‌گیری یک عامل پیکربندی‌شده (از نشست `main` آن استفاده می‌کند) |
| `--session-id \<id\>`         | استفاده دوباره از یک نشست موجود بر اساس شناسه               |
| `--local`                     | اجبار به اجرای تعبیه‌شده محلی (رد کردن Gateway)             |
| `--deliver`                   | ارسال پاسخ به یک کانال گفت‌وگو                              |
| `--channel \<name\>`          | کانال تحویل (whatsapp، telegram، discord، slack و غیره)     |
| `--reply-to \<target\>`       | بازنویسی مقصد تحویل                                        |
| `--reply-channel \<name\>`    | بازنویسی کانال تحویل                                       |
| `--reply-account \<id\>`      | بازنویسی شناسه حساب تحویل                                  |
| `--thinking \<level\>`        | تنظیم سطح تفکر برای پروفایل مدل انتخاب‌شده                 |
| `--verbose \<on\|full\|off\>` | تنظیم سطح پرجزئیات بودن                                    |
| `--timeout \<seconds\>`       | بازنویسی مهلت زمانی عامل                                   |
| `--json`                      | خروجی JSON ساختاریافته                                     |

## رفتار

- به‌طور پیش‌فرض، CLI **از طریق Gateway** عبور می‌کند. برای اجبار به استفاده از
  اجرای تعبیه‌شده روی ماشین فعلی، `--local` را اضافه کنید.
- اگر Gateway در دسترس نباشد، CLI **به اجرای تعبیه‌شده محلی بازمی‌گردد**.
- انتخاب نشست: `--to` کلید نشست را استخراج می‌کند (مقصدهای گروه/کانال
  جداسازی را حفظ می‌کنند؛ گفت‌وگوهای مستقیم به `main` ادغام می‌شوند).
- پرچم‌های تفکر و پرجزئیات بودن در ذخیره‌گاه نشست ماندگار می‌شوند.
- خروجی: به‌طور پیش‌فرض متن ساده، یا `--json` برای محموله ساختاریافته + فراداده.

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

<CardGroup cols={2}>
  <Card title="مرجع CLI عامل" href="/fa/cli/agent" icon="terminal">
    مرجع کامل پرچم‌ها و گزینه‌های `openclaw agent`.
  </Card>
  <Card title="زیرعامل‌ها" href="/fa/tools/subagents" icon="users">
    ایجاد زیرعامل‌ها در پس‌زمینه.
  </Card>
  <Card title="نشست‌ها" href="/fa/concepts/session" icon="comments">
    کلیدهای نشست چگونه کار می‌کنند و `--to`، `--agent`، و `--session-id` چگونه آن‌ها را حل می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" href="/fa/tools/slash-commands" icon="slash">
    کاتالوگ دستورهای بومی که داخل نشست‌های عامل استفاده می‌شود.
  </Card>
</CardGroup>
