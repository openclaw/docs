---
read_when:
    - می‌خواهید اجرای عامل‌ها را از اسکریپت‌ها یا خط فرمان فعال کنید
    - باید پاسخ‌های عامل را به‌صورت برنامه‌نویسی‌شده به یک کانال چت تحویل دهید
summary: نوبت‌های عامل را از CLI اجرا کنید و در صورت تمایل پاسخ‌ها را به کانال‌ها تحویل دهید
title: ارسال عامل
x-i18n:
    generated_at: "2026-05-10T20:08:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` یک نوبت عامل را از خط فرمان اجرا می‌کند، بدون اینکه به
پیام چت ورودی نیاز داشته باشد. از آن برای جریان‌های کاری اسکریپتی، آزمایش و
تحویل برنامه‌نویسی‌شده استفاده کنید.

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

| پرچم                          | توضیح                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | پیام برای ارسال (الزامی)                                  |
| `--to \<dest\>`               | مشتق‌کردن کلید نشست از یک مقصد (تلفن، شناسه چت)           |
| `--agent \<id\>`              | هدف‌گیری یک عامل پیکربندی‌شده (از نشست `main` آن استفاده می‌کند)         |
| `--session-id \<id\>`         | استفاده دوباره از یک نشست موجود بر اساس شناسه                             |
| `--local`                     | اجبار به زمان اجرای تعبیه‌شده محلی (ردکردن Gateway)                 |
| `--deliver`                   | ارسال پاسخ به یک کانال چت                            |
| `--channel \<name\>`          | کانال تحویل (whatsapp، telegram، discord، slack و غیره) |
| `--reply-to \<target\>`       | بازنویسی مقصد تحویل                                    |
| `--reply-channel \<name\>`    | بازنویسی کانال تحویل                                   |
| `--reply-account \<id\>`      | بازنویسی شناسه حساب تحویل                                |
| `--thinking \<level\>`        | تنظیم سطح تفکر برای پروفایل مدل انتخاب‌شده           |
| `--verbose \<on\|full\|off\>` | تنظیم سطح پرگویی                                           |
| `--timeout \<seconds\>`       | بازنویسی مهلت زمانی عامل                                      |
| `--json`                      | خروجی JSON ساخت‌یافته                                      |

## رفتار

- به‌صورت پیش‌فرض، CLI **از طریق Gateway** عبور می‌کند. برای اجبار به زمان اجرای
  تعبیه‌شده روی ماشین فعلی، `--local` را اضافه کنید.
- اگر Gateway در دسترس نباشد، CLI **به اجرای تعبیه‌شده محلی بازمی‌گردد**.
- انتخاب نشست: `--to` کلید نشست را مشتق می‌کند (هدف‌های گروه/کانال
  جداسازی را حفظ می‌کنند؛ چت‌های مستقیم به `main` فروکاسته می‌شوند).
- پرچم‌های تفکر و پرگویی در ذخیره‌گاه نشست ماندگار می‌شوند.
- خروجی: به‌صورت پیش‌فرض متن ساده، یا `--json` برای محموله ساخت‌یافته همراه با فراداده.
- با `--json --deliver`، JSON شامل وضعیت تحویل برای ارسال‌های ارسال‌شده،
  سرکوب‌شده، جزئی و ناموفق است. به
  [وضعیت تحویل JSON](/fa/cli/agent#json-delivery-status) مراجعه کنید.

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
    ایجاد زیرعامل در پس‌زمینه.
  </Card>
  <Card title="نشست‌ها" href="/fa/concepts/session" icon="comments">
    کلیدهای نشست چگونه کار می‌کنند و `--to`، `--agent` و `--session-id` چگونه آن‌ها را حل می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" href="/fa/tools/slash-commands" icon="slash">
    کاتالوگ دستورهای بومی که داخل نشست‌های عامل استفاده می‌شود.
  </Card>
</CardGroup>
