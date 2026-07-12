---
read_when:
    - می‌خواهید اجرای عامل را از طریق اسکریپت‌ها یا خط فرمان آغاز کنید
    - باید پاسخ‌های عامل را به‌صورت برنامه‌نویسی‌شده به یک کانال چت ارسال کنید
summary: نوبت‌های عامل را از CLI اجرا کنید و در صورت تمایل، پاسخ‌ها را به کانال‌ها ارسال کنید
title: ارسال عامل
x-i18n:
    generated_at: "2026-07-12T10:58:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` یک نوبت منفرد عامل را بدون پیام ورودیِ گفتگو از خط فرمان اجرا می‌کند. از آن برای گردش‌کارهای اسکریپتی، آزمایش و تحویل برنامه‌نویسی‌شده استفاده کنید. مرجع کامل پرچم‌ها و رفتار:
[مرجع CLI عامل](/fa/cli/agent).

## شروع سریع

<Steps>
  <Step title="اجرای یک نوبت ساده عامل">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    پیام را از طریق Gateway ارسال می‌کند و پاسخ را چاپ می‌کند.

  </Step>

  <Step title="ارسال یک درخواست چندخطی از فایل">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    یک فایل معتبر UTF-8 را به‌عنوان بدنه پیام عامل می‌خواند.

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

| پرچم                       | توضیحات                                                               |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | پیام درون‌خطی برای ارسال                                               |
| `--message-file <path>`     | خواندن پیام از یک فایل معتبر UTF-8                                    |
| `--to <dest>`               | استخراج کلید نشست از یک مقصد (تلفن، شناسه گفتگو)                       |
| `--session-key <key>`       | استفاده از یک کلید نشست صریح                                           |
| `--agent <id>`              | هدف‌گیری یک عامل پیکربندی‌شده (از نشست `main` آن استفاده می‌کند)         |
| `--session-id <id>`         | استفاده مجدد از یک نشست موجود بر اساس شناسه                            |
| `--model <id>`              | بازنویسی مدل برای این اجرا (`provider/model` یا شناسه مدل)              |
| `--local`                   | اجبار به اجرای محلیِ تعبیه‌شده (عبور نکردن از Gateway)                   |
| `--deliver`                 | ارسال پاسخ به یک کانال گفتگو                                           |
| `--channel <name>`          | کانال تحویل؛ همراه با `--agent` و `--to`، بر دامنه پیام مستقیم نیز اعمال می‌شود |
| `--reply-to <target>`       | بازنویسی مقصد تحویل                                                    |
| `--reply-channel <name>`    | بازنویسی کانال تحویل                                                   |
| `--reply-account <id>`      | بازنویسی شناسه حساب تحویل                                              |
| `--thinking <level>`        | تنظیم سطح تفکر برای نمایه مدل انتخاب‌شده                                |
| `--verbose <on\|full\|off>` | ذخیره پایدار سطح جزئیات برای نشست (`full` خروجی ابزار را نیز ثبت می‌کند) |
| `--timeout <seconds>`       | بازنویسی مهلت زمانی عامل (پیش‌فرض ۶۰۰ یا مقدار پیکربندی)                  |
| `--json`                    | خروجی JSON ساخت‌یافته                                                  |

## رفتار

- به‌طور پیش‌فرض، CLI **از طریق Gateway** اجرا می‌شود. برای اجبار به استفاده از زمان‌اجرای تعبیه‌شده روی دستگاه فعلی، `--local` را اضافه کنید.
- دقیقاً یکی از `--message` یا `--message-file` را ارائه دهید. پیام‌های فایل پس از حذف BOM اختیاری UTF-8، محتوای چندخطی را حفظ می‌کنند.
- اگر درخواست Gateway ناموفق باشد، CLI به اجرای تعبیه‌شده محلی **بازمی‌گردد**؛ پایان مهلت Gateway به‌جای رقابت با رونوشت اصلی، با یک نشست تازه به اجرای جایگزین بازمی‌گردد.
- انتخاب نشست: `--to` کلید نشست را استخراج می‌کند (مقصدهای گروه/کانال جداسازی را حفظ می‌کنند؛ گفتگوهای مستقیم به `main` فروکاسته می‌شوند). هنگام استفاده هم‌زمان از `--agent`، `--channel` و `--to`، مسیریابی از گیرنده متعارف کانال و `session.dmScope` پیروی می‌کند. هویت‌های پایدارِ صرفاً خروجی از نشستی متعلق به ارائه‌دهنده استفاده می‌کنند که از نشست اصلی عامل جدا است.
- `--session-key` یک کلید صریح را انتخاب می‌کند. کلیدهای دارای پیشوند عامل باید از قالب `agent:<agent-id>:<session-key>` استفاده کنند و اگر `--agent` نیز ارائه شده باشد، باید با شناسه همان عامل مطابقت داشته باشد. کلیدهای ساده غیرنشانگر، در صورت ارائه `--agent`، در دامنه آن قرار می‌گیرند؛ برای مثال، `--agent ops --session-key incident-42` به `agent:ops:incident-42` مسیریابی می‌شود. بدون `--agent`، کلیدهای ساده غیرنشانگر در دامنه عامل پیش‌فرض پیکربندی‌شده قرار می‌گیرند. مقادیر لفظی `global` و `unknown` فقط هنگامی بدون دامنه باقی می‌مانند که `--agent` ارائه نشده باشد؛ مسیر اجرای جایگزین تعبیه‌شده، این نشست‌های نشانگر را به عامل پیش‌فرض پیکربندی‌شده نگاشت می‌کند.
- `--reply-channel` و `--reply-account` فقط بر تحویل اثر می‌گذارند.
- پرچم‌های تفکر و جزئیات در مخزن نشست ذخیره می‌شوند.
- خروجی: به‌طور پیش‌فرض متن ساده، یا با `--json` محتوای ساخت‌یافته به‌همراه فراداده.
- با `--json --deliver`، خروجی JSON شامل وضعیت تحویل برای ارسال‌های انجام‌شده، سرکوب‌شده، جزئی و ناموفق است. به [وضعیت تحویل JSON](/fa/cli/agent#json-delivery-status) مراجعه کنید.

## نمونه‌ها

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

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
  <Card title="عامل‌های فرعی" href="/fa/tools/subagents" icon="users">
    ایجاد عامل فرعی در پس‌زمینه.
  </Card>
  <Card title="نشست‌ها" href="/fa/concepts/session" icon="comments">
    نحوه کار کلیدهای نشست و چگونگی نگاشت آن‌ها توسط `--to`، `--agent` و `--session-id`.
  </Card>
  <Card title="فرمان‌های اسلش" href="/fa/tools/slash-commands" icon="slash">
    فهرست فرمان‌های بومی مورد استفاده در نشست‌های عامل.
  </Card>
</CardGroup>
