---
read_when:
    - می‌خواهید یک نوبت agent را از اسکریپت‌ها اجرا کنید (و به‌صورت اختیاری پاسخ را تحویل دهید)
summary: مرجع CLI برای `openclaw agent` (ارسال یک نوبت عامل از طریق Gateway)
title: عامل
x-i18n:
    generated_at: "2026-06-27T17:21:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

اجرای یک نوبت عامل از طریق Gateway (برای حالت تعبیه‌شده از `--local` استفاده کنید).
برای هدف‌گیری مستقیم یک عامل پیکربندی‌شده، از `--agent <id>` استفاده کنید.

حداقل یک انتخابگر نشست را وارد کنید:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

مرتبط:

- ابزار ارسال عامل: [ارسال عامل](/fa/tools/agent-send)

## گزینه‌ها

- `-m, --message <text>`: بدنه پیام
- `--message-file <path>`: خواندن بدنه پیام از یک فایل UTF-8
- `-t, --to <dest>`: گیرنده‌ای که برای استخراج کلید نشست استفاده می‌شود
- `--session-key <key>`: کلید نشست صریح برای استفاده در مسیریابی
- `--session-id <id>`: شناسه نشست صریح
- `--agent <id>`: شناسه عامل؛ اتصال‌های مسیریابی را بازنویسی می‌کند
- `--model <id>`: بازنویسی مدل برای این اجرا (`provider/model` یا شناسه مدل)
- `--thinking <level>`: سطح تفکر عامل (`off`، `minimal`، `low`، `medium`، `high`، به‌علاوه سطح‌های سفارشی پشتیبانی‌شده توسط ارائه‌دهنده مانند `xhigh`، `adaptive`، یا `max`)
- `--verbose <on|off>`: پایدارسازی سطح پرجزئیات برای نشست
- `--channel <channel>`: کانال تحویل؛ برای استفاده از کانال اصلی نشست حذف کنید
- `--reply-to <target>`: بازنویسی مقصد تحویل
- `--reply-channel <channel>`: بازنویسی کانال تحویل
- `--reply-account <id>`: بازنویسی حساب تحویل
- `--local`: اجرای مستقیم عامل تعبیه‌شده (پس از پیش‌بارگذاری رجیستری Plugin)
- `--deliver`: ارسال پاسخ به کانال/مقصد انتخاب‌شده
- `--timeout <seconds>`: بازنویسی مهلت زمانی عامل (پیش‌فرض 600 یا مقدار پیکربندی)
- `--json`: خروجی JSON

## مثال‌ها

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

## نکته‌ها

- دقیقاً یکی از `--message` یا `--message-file` را وارد کنید. `--message-file` پس از حذف یک UTF-8 BOM اختیاری، محتوای چندخطی فایل را حفظ می‌کند و فایل‌هایی را که UTF-8 معتبر نیستند رد می‌کند.
- حالت Gateway وقتی درخواست Gateway شکست بخورد به عامل تعبیه‌شده بازمی‌گردد. برای اجبار به اجرای تعبیه‌شده از ابتدا، از `--local` استفاده کنید.
- `--local` همچنان ابتدا رجیستری Plugin را پیش‌بارگذاری می‌کند، بنابراین ارائه‌دهنده‌ها، ابزارها و کانال‌های فراهم‌شده توسط Plugin هنگام اجراهای تعبیه‌شده در دسترس می‌مانند.
- اجراهای `--local` و بازگشت تعبیه‌شده به‌عنوان اجراهای تک‌مرحله‌ای در نظر گرفته می‌شوند. منابع loopback بسته‌بندی‌شده MCP و نشست‌های گرم Claude stdio که برای آن فرایند محلی باز شده‌اند پس از پاسخ بازنشسته می‌شوند، بنابراین فراخوانی‌های اسکریپتی فرایندهای فرزند محلی را زنده نگه نمی‌دارند.
- اجراهای متکی بر Gateway منابع loopback متعلق به Gateway در MCP را زیر فرایند Gateway در حال اجرا باقی می‌گذارند؛ کلاینت‌های قدیمی‌تر ممکن است همچنان پرچم تاریخی پاک‌سازی را ارسال کنند، اما Gateway آن را به‌عنوان یک عملیات بی‌اثر سازگاری می‌پذیرد.
- `--channel`، `--reply-channel` و `--reply-account` بر تحویل پاسخ اثر می‌گذارند، نه مسیریابی نشست.
- `--session-key` یک کلید نشست صریح را انتخاب می‌کند. کلیدهای دارای پیشوند عامل باید از `agent:<agent-id>:<session-key>` استفاده کنند، و وقتی هر دو ارائه شده‌اند، `--agent` باید با شناسه عامل کلید مطابقت داشته باشد. کلیدهای خام غیر sentinel هنگام ارائه `--agent` به آن محدود می‌شوند، یا در غیر این صورت به عامل پیش‌فرض پیکربندی‌شده محدود می‌شوند؛ برای مثال، `--agent ops --session-key incident-42` به `agent:ops:incident-42` مسیریابی می‌شود. مقادیر لفظی `global` و `unknown` فقط وقتی هیچ `--agent` ارائه نشده باشد بدون محدوده می‌مانند؛ در آن حالت، بازگشت تعبیه‌شده و مالکیت store از عامل پیش‌فرض پیکربندی‌شده استفاده می‌کنند.
- `--json` stdout را برای پاسخ JSON رزرو نگه می‌دارد. عیب‌یابی‌های Gateway، Plugin و بازگشت تعبیه‌شده به stderr هدایت می‌شوند تا اسکریپت‌ها بتوانند stdout را مستقیم تجزیه کنند.
- JSON بازگشت تعبیه‌شده شامل `meta.transport: "embedded"` و `meta.fallbackFrom: "gateway"` است تا اسکریپت‌ها بتوانند اجراهای بازگشتی را از اجراهای Gateway تشخیص دهند.
- اگر Gateway اجرای عامل را بپذیرد اما CLI هنگام انتظار برای پاسخ نهایی دچار timeout شود، بازگشت تعبیه‌شده از یک شناسه نشست/اجرای صریح و تازه `gateway-fallback-*` استفاده می‌کند و `meta.fallbackReason: "gateway_timeout"` به‌علاوه فیلدهای نشست بازگشتی را گزارش می‌دهد. این کار از رقابت با قفل رونوشت متعلق به Gateway یا جایگزینی بی‌صدای نشست گفت‌وگوی مسیریابی‌شده اصلی جلوگیری می‌کند.
- برای اجراهای متکی بر Gateway، `SIGTERM` و `SIGINT` درخواست CLI در حال انتظار را قطع می‌کنند. اگر Gateway قبلاً اجرا را پذیرفته باشد، CLI همچنین پیش از خروج `chat.abort` را برای آن شناسه اجرای پذیرفته‌شده ارسال می‌کند. اجراهای محلی `--local` و اجراهای بازگشت تعبیه‌شده همان سیگنال abort را دریافت می‌کنند، اما `chat.abort` ارسال نمی‌کنند. اگر یک `--run-id` تکراری در حالی به Gateway برسد که اجرای عامل اصلی هنوز فعال است، پاسخ تکراری `status: "in_flight"` را گزارش می‌دهد و CLI غیر JSON به‌جای یک پاسخ خالی، یک عیب‌یابی در stderr چاپ می‌کند. برای wrapperهای خارجی cron/systemd، یک پشتیبان hard-kill بیرونی مانند `timeout -k 60 600 openclaw agent ...` نگه دارید تا اگر خاموش‌سازی نتواند تخلیه شود، supervisor همچنان بتواند فرایند را جمع‌آوری کند.
- وقتی این فرمان بازتولید `models.json` را فعال می‌کند، اعتبارنامه‌های ارائه‌دهنده مدیریت‌شده با SecretRef به‌صورت نشانگرهای غیرمحرمانه پایدار می‌شوند (برای مثال نام‌های env var، `secretref-env:ENV_VAR_NAME`، یا `secretref-managed`)، نه متن ساده محرمانه resolveشده.
- نوشتن نشانگرها از نظر منبع authoritative است: OpenClaw نشانگرها را از snapshot پیکربندی منبع فعال پایدار می‌کند، نه از مقدارهای محرمانه resolveشده در runtime.

## وضعیت تحویل JSON

وقتی از `--json --deliver` استفاده می‌شود، پاسخ JSON در CLI ممکن است شامل `deliveryStatus` در سطح بالا باشد تا اسکریپت‌ها بتوانند ارسال‌های تحویل‌شده، سرکوب‌شده، جزئی و ناموفق را تشخیص دهند:

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

`deliveryStatus.status` یکی از `sent`، `suppressed`، `partial_failed` یا `failed` است. `suppressed` یعنی تحویل عمداً ارسال نشده است، برای مثال یک hook ارسال پیام آن را لغو کرده یا هیچ نتیجه قابل‌مشاهده‌ای وجود نداشته است؛ همچنان یک نتیجه پایانی بدون تلاش مجدد است. `partial_failed` یعنی حداقل یک payload پیش از شکست payload بعدی ارسال شده است. `failed` یعنی هیچ ارسال پایداری کامل نشده یا preflight تحویل شکست خورده است.

پاسخ‌های CLI متکی بر Gateway همچنین شکل خام نتیجه Gateway را حفظ می‌کنند، که همان شیء در `result.deliveryStatus` در دسترس است.

فیلدهای رایج:

- `requested`: وقتی شیء وجود داشته باشد همیشه `true` است.
- `attempted`: پس از اجرای مسیر ارسال پایدار `true` است؛ برای شکست‌های preflight یا نبود payload قابل‌مشاهده `false` است.
- `succeeded`: `true`، `false`، یا `"partial"`؛ `"partial"` با `status: "partial_failed"` همراه می‌شود.
- `reason`: یک دلیل snake-case با حروف کوچک از تحویل پایدار یا اعتبارسنجی preflight. دلایل شناخته‌شده شامل `cancelled_by_message_sending_hook`، `no_visible_payload`، `no_visible_result`، `channel_resolved_to_internal`، `unknown_channel`، `invalid_delivery_target` و `no_delivery_target` هستند؛ ارسال‌های پایدار ناموفق ممکن است مرحله شکست‌خورده را نیز گزارش کنند. با مقادیر ناشناخته به‌صورت opaque رفتار کنید، چون این مجموعه می‌تواند گسترش یابد.
- `resultCount`: تعداد نتایج ارسال کانال، وقتی در دسترس باشد.
- `sentBeforeError`: وقتی یک شکست جزئی پیش از خطا حداقل یک payload ارسال کرده باشد `true` است.
- `error`: مقدار بولی `true` برای ارسال‌های ناموفق یا جزئی‌ناموفق.
- `errorMessage`: فقط وقتی پیام خطای تحویل زیربنایی ثبت شده باشد گنجانده می‌شود. شکست‌های preflight دارای `error` و `reason` هستند اما `errorMessage` ندارند.
- `payloadOutcomes`: نتایج اختیاری برای هر payload با `index`، `status`، `reason`، `resultCount`، `error`، `stage`، `sentBeforeError`، یا metadata مربوط به hook وقتی در دسترس باشد.

## مرتبط

- [مرجع CLI](/fa/cli)
- [runtime عامل](/fa/concepts/agent)
