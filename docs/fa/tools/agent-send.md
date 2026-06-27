---
read_when:
    - می‌خواهید اجراهای عامل را از اسکریپت‌ها یا خط فرمان فعال کنید
    - باید پاسخ‌های عامل را به‌صورت برنامه‌نویسی‌شده به یک کانال گفت‌وگو تحویل دهید.
summary: اجرای نوبت‌های عامل از CLI و تحویل اختیاری پاسخ‌ها به کانال‌ها
title: ارسال عامل
x-i18n:
    generated_at: "2026-06-27T18:55:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` یک نوبت واحد عامل را از خط فرمان اجرا می‌کند، بدون اینکه به
پیام چت ورودی نیاز داشته باشد. از آن برای گردش‌کارهای اسکریپتی، آزمایش، و
تحویل برنامه‌نویسی‌شده استفاده کنید.

## شروع سریع

<Steps>
  <Step title="اجرای یک نوبت ساده عامل">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    این پیام را از طریق Gateway ارسال می‌کند و پاسخ را چاپ می‌کند.

  </Step>

  <Step title="ارسال یک پرامپت چندخطی از فایل">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    این فرمان یک فایل معتبر UTF-8 را به‌عنوان بدنه پیام عامل می‌خواند.

  </Step>

  <Step title="هدف‌گیری یک عامل یا نشست مشخص">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
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

| پرچم                          | توضیح                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | پیام درون‌خطی برای ارسال                                    |
| `--message-file \<path\>`     | خواندن پیام از یک فایل معتبر UTF-8                          |
| `--to \<dest\>`               | استخراج کلید نشست از یک مقصد (تلفن، شناسه چت)               |
| `--session-key \<key\>`       | استفاده از یک کلید نشست صریح                                |
| `--agent \<id\>`              | هدف‌گیری یک عامل پیکربندی‌شده (از نشست `main` آن استفاده می‌کند) |
| `--session-id \<id\>`         | استفاده دوباره از یک نشست موجود بر اساس شناسه               |
| `--local`                     | اجبار به runtime تعبیه‌شده محلی (نادیده گرفتن Gateway)       |
| `--deliver`                   | ارسال پاسخ به یک کانال چت                                   |
| `--channel \<name\>`          | کانال تحویل (whatsapp، telegram، discord، slack و غیره)     |
| `--reply-to \<target\>`       | بازنویسی مقصد تحویل                                         |
| `--reply-channel \<name\>`    | بازنویسی کانال تحویل                                        |
| `--reply-account \<id\>`      | بازنویسی شناسه حساب تحویل                                   |
| `--thinking \<level\>`        | تنظیم سطح تفکر برای پروفایل مدل انتخاب‌شده                 |
| `--verbose \<on\|full\|off\>` | تنظیم سطح پرگویی                                            |
| `--timeout \<seconds\>`       | بازنویسی مهلت زمانی عامل                                    |
| `--json`                      | خروجی JSON ساخت‌یافته                                       |

## رفتار

- به‌صورت پیش‌فرض، CLI **از طریق Gateway** اجرا می‌شود. برای اجبار به استفاده از
  runtime تعبیه‌شده روی ماشین فعلی، `--local` را اضافه کنید.
- دقیقاً یکی از `--message` یا `--message-file` را بدهید. پیام‌های فایل پس از
  حذف BOM اختیاری UTF-8، محتوای چندخطی را حفظ می‌کنند.
- اگر Gateway در دسترس نباشد، CLI **به اجرای تعبیه‌شده محلی fallback می‌کند**.
- انتخاب نشست: `--to` کلید نشست را استخراج می‌کند (هدف‌های گروه/کانال
  جداسازی را حفظ می‌کنند؛ چت‌های مستقیم به `main` فروکاسته می‌شوند).
- `--session-key` یک کلید صریح را انتخاب می‌کند. کلیدهای دارای پیشوند عامل باید از
  `agent:<agent-id>:<session-key>` استفاده کنند، و وقتی هر دو ارائه شوند،
  `--agent` باید با همان شناسه عامل مطابقت داشته باشد. کلیدهای خام غیر sentinel
  وقتی `--agent` ارائه شود در محدوده آن قرار می‌گیرند؛ برای مثال،
  `--agent ops --session-key incident-42` به `agent:ops:incident-42` مسیریابی می‌شود.
  بدون `--agent`، کلیدهای خام غیر sentinel در محدوده عامل پیش‌فرض پیکربندی‌شده
  قرار می‌گیرند. مقدارهای لفظی `global` و `unknown` فقط وقتی `--agent` ارائه نشده
  باشد بدون محدوده باقی می‌مانند؛ در آن حالت، fallback تعبیه‌شده و مالکیت store
  از عامل پیش‌فرض پیکربندی‌شده استفاده می‌کنند.
- پرچم‌های تفکر و پرگویی در store نشست پایدار می‌مانند.
- خروجی: به‌صورت پیش‌فرض متن ساده، یا `--json` برای payload ساخت‌یافته + metadata.
- با `--json --deliver`، JSON وضعیت تحویل را برای ارسال‌های انجام‌شده،
  سرکوب‌شده، جزئی، و ناموفق شامل می‌شود. [وضعیت تحویل JSON](/fa/cli/agent#json-delivery-status)
  را ببینید.

## نمونه‌ها

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

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
    نحوه کار کلیدهای نشست و اینکه `--to`، `--agent` و `--session-id` چگونه آن‌ها را resolve می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" href="/fa/tools/slash-commands" icon="slash">
    کاتالوگ فرمان‌های native که داخل نشست‌های عامل استفاده می‌شود.
  </Card>
</CardGroup>
