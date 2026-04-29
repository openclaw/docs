---
read_when:
    - می‌خواهید یک نوبت عامل را از طریق اسکریپت‌ها اجرا کنید (و به‌صورت اختیاری پاسخ را ارسال کنید)
summary: مرجع CLI برای `openclaw agent` (ارسال یک نوبت عامل از طریق Gateway)
title: عامل
x-i18n:
    generated_at: "2026-04-29T22:32:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

یک نوبت عامل را از طریق Gateway اجرا کنید (برای حالت تعبیه‌شده از `--local` استفاده کنید).
از `--agent <id>` برای هدف‌گیری مستقیم یک عامل پیکربندی‌شده استفاده کنید.

دست‌کم یک گزینش‌گر نشست را ارسال کنید:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

مرتبط:

- ابزار ارسال عامل: [ارسال عامل](/fa/tools/agent-send)

## گزینه‌ها

- `-m, --message <text>`: بدنه پیام الزامی
- `-t, --to <dest>`: گیرنده‌ای که برای استخراج کلید نشست استفاده می‌شود
- `--session-id <id>`: شناسه نشست صریح
- `--agent <id>`: شناسه عامل؛ اتصالات مسیریابی را نادیده می‌گیرد
- `--model <id>`: بازنویسی مدل برای این اجرا (`provider/model` یا شناسه مدل)
- `--thinking <level>`: سطح تفکر عامل (`off`, `minimal`, `low`, `medium`, `high`، به‌همراه سطح‌های سفارشی پشتیبانی‌شده توسط ارائه‌دهنده مانند `xhigh`, `adaptive` یا `max`)
- `--verbose <on|off>`: ماندگار کردن سطح پرجزئیات برای نشست
- `--channel <channel>`: کانال تحویل؛ برای استفاده از کانال اصلی نشست حذف کنید
- `--reply-to <target>`: بازنویسی هدف تحویل
- `--reply-channel <channel>`: بازنویسی کانال تحویل
- `--reply-account <id>`: بازنویسی حساب تحویل
- `--local`: اجرای مستقیم عامل تعبیه‌شده (پس از پیش‌بارگذاری رجیستری Plugin)
- `--deliver`: ارسال پاسخ به کانال/هدف انتخاب‌شده
- `--timeout <seconds>`: بازنویسی مهلت زمانی عامل (پیش‌فرض ۶۰۰ یا مقدار پیکربندی)
- `--json`: خروجی JSON

## مثال‌ها

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## نکته‌ها

- حالت Gateway وقتی درخواست Gateway شکست بخورد به عامل تعبیه‌شده بازمی‌گردد. برای اجبار اجرای تعبیه‌شده از ابتدا، از `--local` استفاده کنید.
- `--local` همچنان ابتدا رجیستری Plugin را پیش‌بارگذاری می‌کند، بنابراین ارائه‌دهنده‌ها، ابزارها و کانال‌های فراهم‌شده توسط Plugin در اجراهای تعبیه‌شده در دسترس می‌مانند.
- `--local` و اجراهای بازگشتی تعبیه‌شده به‌عنوان اجراهای یک‌باره در نظر گرفته می‌شوند. منابع loopback بسته‌بندی‌شده MCP و نشست‌های stdio گرم Claude که برای آن فرایند محلی باز شده‌اند پس از پاسخ بازنشسته می‌شوند، بنابراین فراخوانی‌های اسکریپتی فرایندهای فرزند محلی را زنده نگه نمی‌دارند.
- اجراهای پشتیبانی‌شده توسط Gateway منابع loopback MCP متعلق به Gateway را زیر فرایند در حال اجرای Gateway باقی می‌گذارند؛ کلاینت‌های قدیمی‌تر ممکن است همچنان پرچم پاک‌سازی تاریخی را ارسال کنند، اما Gateway آن را به‌عنوان no-op سازگاری می‌پذیرد.
- `--channel`، `--reply-channel` و `--reply-account` بر تحویل پاسخ اثر می‌گذارند، نه مسیریابی نشست.
- `--json` stdout را برای پاسخ JSON رزرو نگه می‌دارد. عیب‌یابی‌های Gateway، Plugin و بازگشت تعبیه‌شده به stderr هدایت می‌شوند تا اسکریپت‌ها بتوانند stdout را مستقیم تجزیه کنند.
- JSON بازگشت تعبیه‌شده شامل `meta.transport: "embedded"` و `meta.fallbackFrom: "gateway"` است تا اسکریپت‌ها بتوانند اجراهای بازگشتی را از اجراهای Gateway تشخیص دهند.
- اگر Gateway اجرای عامل را بپذیرد اما CLI هنگام انتظار برای پاسخ نهایی به مهلت زمانی برسد، بازگشت تعبیه‌شده از یک شناسه نشست/اجرای صریح و تازه `gateway-fallback-*` استفاده می‌کند و `meta.fallbackReason: "gateway_timeout"` به‌همراه فیلدهای نشست بازگشتی را گزارش می‌دهد. این کار از رقابت با قفل رونوشت متعلق به Gateway یا جایگزینی بی‌صدای نشست مکالمه مسیریابی‌شده اصلی جلوگیری می‌کند.
- وقتی این فرمان بازتولید `models.json` را راه‌اندازی می‌کند، اعتبارنامه‌های ارائه‌دهنده مدیریت‌شده با SecretRef به‌صورت نشانگرهای غیرمحرمانه ماندگار می‌شوند (برای مثال نام‌های متغیر محیطی، `secretref-env:ENV_VAR_NAME` یا `secretref-managed`)، نه متن ساده محرمانه حل‌شده.
- نوشتن نشانگرها از نظر منبع معتبر است: OpenClaw نشانگرها را از اسنپ‌شات پیکربندی منبع فعال ماندگار می‌کند، نه از مقدارهای محرمانه حل‌شده زمان اجرا.

## مرتبط

- [مرجع CLI](/fa/cli)
- [زمان اجرای عامل](/fa/concepts/agent)
