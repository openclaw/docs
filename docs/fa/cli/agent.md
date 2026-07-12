---
read_when:
    - می‌خواهید یک نوبت عامل را از طریق اسکریپت‌ها اجرا کنید (و در صورت تمایل، پاسخ را تحویل دهید)
summary: مرجع CLI برای `openclaw agent` (ارسال یک نوبت عامل از طریق Gateway)
title: عامل
x-i18n:
    generated_at: "2026-07-12T09:48:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

یک نوبت عامل را از طریق Gateway اجرا می‌کند. اگر درخواست Gateway ناموفق باشد، به عامل تعبیه‌شده بازمی‌گردد؛ برای اجبار اجرای تعبیه‌شده از ابتدا، `--local` را ارسال کنید.

حداقل یک انتخاب‌گر نشست ارسال کنید: `--to`، `--session-key`، `--session-id` یا `--agent`.

مرتبط: [ابزار ارسال عامل](/fa/tools/agent-send)

## گزینه‌ها

- `-m, --message <text>`: بدنه پیام
- `--message-file <path>`: خواندن بدنه پیام از یک فایل UTF-8
- `-t, --to <dest>`: گیرنده‌ای که برای استخراج کلید نشست استفاده می‌شود
- `--session-key <key>`: کلید صریح نشست برای استفاده در مسیریابی
- `--session-id <id>`: شناسه صریح نشست
- `--agent <id>`: شناسه عامل؛ اتصال‌های مسیریابی را نادیده می‌گیرد
- `--model <id>`: جایگزینی مدل برای این اجرا (`provider/model` یا شناسه مدل)
- `--thinking <level>`: سطح تفکر عامل (`off`، `minimal`، `low`، `medium`، `high`، به‌علاوه سطوح سفارشی پشتیبانی‌شده توسط ارائه‌دهنده مانند `xhigh`، `adaptive` یا `max`)
- `--verbose <on|off>`: ماندگار کردن سطح گزارش مشروح برای نشست
- `--channel <channel>`: کانال تحویل؛ برای استفاده از کانال نشست اصلی آن را حذف کنید
- `--reply-to <target>`: جایگزینی مقصد تحویل
- `--reply-channel <channel>`: جایگزینی کانال تحویل
- `--reply-account <id>`: جایگزینی حساب تحویل
- `--local`: اجرای مستقیم عامل تعبیه‌شده (پس از پیش‌بارگذاری رجیستری Plugin)
- `--deliver`: ارسال پاسخ به کانال/مقصد انتخاب‌شده
- `--timeout <seconds>`: جایگزینی مهلت زمانی عامل (پیش‌فرض ۶۰۰ یا `agents.defaults.timeoutSeconds`)؛ `0` مهلت زمانی را غیرفعال می‌کند
- `--json`: خروجی JSON

## نمونه‌ها

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## نکات

- دقیقاً یکی از `--message` یا `--message-file` را ارسال کنید. `--message-file` یک BOM ابتدایی UTF-8 را حذف و محتوای چندخطی را حفظ می‌کند؛ فایل‌هایی را که UTF-8 معتبر نیستند رد می‌کند.
- فرمان‌های اسلش‌دار (برای مثال `/compact`) نمی‌توانند از طریق `--message` اجرا شوند. CLI آن‌ها را رد می‌کند و به‌جای آن شما را به فرمان مستقل مربوطه هدایت می‌کند (`openclaw sessions compact <key>` برای Compaction).
- اجراهای `--local` و بازگشت به عامل تعبیه‌شده یک‌باره هستند: منابع local loopback مربوط به MCP بسته‌بندی‌شده و نشست‌های گرم Claude stdio که برای اجرا باز شده‌اند، پس از پاسخ کنار گذاشته می‌شوند؛ بنابراین فراخوانی‌های اسکریپتی فرایندهای فرزند محلی را در حال اجرا باقی نمی‌گذارند. در مقابل، اجراهای متکی به Gateway منابع local loopback مربوط به MCP تحت مالکیت Gateway را در فرایند در حال اجرای Gateway نگه می‌دارند.
- هنگام استفاده هم‌زمان از `--agent`، `--channel` و `--to`، مسیریابی نشست از گیرنده متعارف کانال و `session.dmScope` پیروی می‌کند. کانال‌هایی که هویت گیرنده پایدار و فقط خروجی دارند، از نشستی تحت مالکیت ارائه‌دهنده استفاده می‌کنند که از نشست اصلی عامل جداست. `--reply-channel` و `--reply-account` فقط بر تحویل اثر می‌گذارند.
- `--session-key` یک کلید صریح نشست را انتخاب می‌کند. کلیدهایی که پیشوند عامل دارند باید از قالب `agent:<agent-id>:<session-key>` استفاده کنند و اگر `--agent` نیز ارائه شده باشد، باید با شناسه عامل کلید مطابقت داشته باشد. کلیدهای ساده و غیرنشانه‌ای، در صورت ارائه `--agent` در محدوده آن قرار می‌گیرند؛ در غیر این صورت در محدوده عامل پیش‌فرض پیکربندی‌شده قرار می‌گیرند. برای مثال، `--agent ops --session-key incident-42` به `agent:ops:incident-42` مسیریابی می‌شود. کلیدهای لفظی `global` و `unknown` فقط زمانی بدون محدوده باقی می‌مانند که `--agent` ارائه نشده باشد.
- `--json` خروجی استاندارد را برای پاسخ JSON رزرو می‌کند؛ عیب‌یابی‌های Gateway، Plugin و بازگشت تعبیه‌شده به خطای استاندارد می‌روند تا اسکریپت‌ها بتوانند خروجی استاندارد را مستقیماً تجزیه کنند.
- JSON بازگشت تعبیه‌شده شامل `meta.transport: "embedded"` و `meta.fallbackFrom: "gateway"` است تا اسکریپت‌ها بتوانند اجرای بازگشتی را تشخیص دهند.
- اگر Gateway یک اجرا را بپذیرد اما انتظار CLI برای پاسخ نهایی به پایان مهلت زمانی برسد، بازگشت تعبیه‌شده به‌جای رقابت با رونوشت تحت مالکیت Gateway یا جایگزینی بی‌سروصدای نشست اصلی، از شناسه نشست/اجرای تازه‌ای با الگوی `gateway-fallback-*` استفاده می‌کند و `meta.fallbackReason: "gateway_timeout"` را همراه با فیلدهای نشست بازگشتی گزارش می‌دهد.
- `SIGTERM`/`SIGINT` یک درخواست در انتظار و متکی به Gateway را متوقف می‌کنند؛ اگر Gateway پیش‌تر اجرا را پذیرفته باشد، CLI پیش از خروج برای آن شناسه اجرا `chat.abort` را نیز ارسال می‌کند. اجراهای `--local` و بازگشت تعبیه‌شده همان سیگنال را دریافت می‌کنند، اما `chat.abort` ارسال نمی‌کنند. اگر کلید داخلی حذف اجرای تکراری از قبل برای این نشست اجرای فعالی داشته باشد، پاسخ `status: "in_flight"` را گزارش می‌کند و CLI غیر JSON به‌جای پاسخ خالی، یک پیام عیب‌یابی در خطای استاندارد چاپ می‌کند. برای پوشش‌های خارجی cron/systemd، یک سازوکار پشتیبان برای خاتمه اجباری مانند `timeout -k 60 600 openclaw agent ...` نگه دارید تا اگر خاموش‌سازی نتواند عملیات را تخلیه کند، ناظر بتواند فرایند را جمع‌آوری کند.
- وقتی این فرمان بازتولید `models.json` را فعال می‌کند، اعتبارنامه‌های ارائه‌دهنده که توسط SecretRef مدیریت می‌شوند، به‌صورت نشانگرهای غیرمحرمانه ماندگار می‌شوند (برای مثال نام متغیر محیطی، `secretref-env:ENV_VAR_NAME` یا `secretref-managed`) و هرگز به متن ساده محرمانه تبدیل نمی‌شوند. نوشتن نشانگرها از تصویر لحظه‌ای پیکربندی منبع فعال انجام می‌شود، نه از مقادیر محرمانه حل‌شده در زمان اجرا.

## وضعیت تحویل JSON

با `--json --deliver`، پاسخ JSON در CLI شامل `deliveryStatus` در سطح بالا است تا اسکریپت‌ها بتوانند ارسال‌های تحویل‌شده، سرکوب‌شده، جزئی و ناموفق را از یکدیگر تشخیص دهند:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

پاسخ‌های CLI متکی به Gateway همچنین شکل خام نتیجه Gateway را در `result.deliveryStatus` حفظ می‌کنند.

`deliveryStatus.status` یکی از موارد زیر است:

| وضعیت           | معنا                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | تحویل تکمیل شد.                                                                                                                        |
| `suppressed`     | تحویل عمداً ارسال نشد (برای مثال، یک هوک ارسال پیام آن را لغو کرد یا نتیجه قابل‌مشاهده‌ای وجود نداشت). نهایی است و تلاش مجدد انجام نمی‌شود. |
| `partial_failed` | پیش از ناموفق شدن یک بار داده بعدی، حداقل یک بار داده ارسال شد.                                                                                   |
| `failed`         | هیچ ارسال ماندگاری تکمیل نشد یا بررسی پیش از تحویل ناموفق بود.                                                                                   |

فیلدهای رایج:

- `requested`: وقتی شیء وجود دارد، همیشه `true` است.
- `attempted`: پس از اجرای مسیر ارسال ماندگار `true` است؛ برای شکست‌های بررسی مقدماتی یا نبود بار داده قابل‌مشاهده `false` است.
- `succeeded`: برابر با `true`، `false` یا `"partial"`؛ مقدار `"partial"` با `status: "partial_failed"` همراه است.
- `reason`: دلیل با حروف کوچک و قالب snake-case که از تحویل ماندگار یا اعتبارسنجی مقدماتی می‌آید. مقادیر شناخته‌شده شامل `cancelled_by_message_sending_hook`، `no_visible_payload`، `no_visible_result`، `channel_resolved_to_internal`، `unknown_channel`، `invalid_delivery_target` و `no_delivery_target` هستند؛ ارسال‌های ماندگار ناموفق ممکن است مرحله ناموفق را نیز گزارش کنند. مقادیر ناشناخته را غیرشفاف در نظر بگیرید، زیرا این مجموعه ممکن است گسترش یابد.
- `resultCount`: تعداد نتایج ارسال کانال، در صورت موجود بودن.
- `sentBeforeError`: اگر در یک شکست جزئی پیش از وقوع خطا حداقل یک بار داده ارسال شده باشد، `true` است.
- `error`: برای ارسال‌های ناموفق یا تاحدی ناموفق `true` است.
- `errorMessage`: فقط زمانی وجود دارد که پیام خطای زیربنایی تحویل ثبت شده باشد. شکست‌های بررسی مقدماتی دارای `error`/`reason` هستند، اما `errorMessage` ندارند.
- `payloadOutcomes`: نتایج اختیاری برای هر بار داده، شامل `index`، `status`، `reason`، `resultCount`، `error`، `stage`، `sentBeforeError` یا فراداده هوک در صورت موجود بودن.

## مرتبط

- [مرجع CLI](/fa/cli)
- [زمان اجرای عامل](/fa/concepts/agent)
