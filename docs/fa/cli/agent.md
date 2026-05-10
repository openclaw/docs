---
read_when:
    - می‌خواهید یک نوبت عامل را از اسکریپت‌ها اجرا کنید (به‌صورت اختیاری پاسخ را تحویل دهید)
summary: مرجع CLI برای `openclaw agent` (ارسال یک نوبت عامل از طریق Gateway)
title: عامل
x-i18n:
    generated_at: "2026-05-10T19:30:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

یک نوبت agent را از طریق Gateway اجرا کنید (برای حالت تعبیه‌شده از `--local` استفاده کنید).
برای هدف‌گرفتن مستقیم یک agent پیکربندی‌شده، از `--agent <id>` استفاده کنید.

حداقل یک انتخابگر session را وارد کنید:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

مرتبط:

- ابزار ارسال Agent: [ارسال Agent](/fa/tools/agent-send)

## گزینه‌ها

- `-m, --message <text>`: متن پیام الزامی
- `-t, --to <dest>`: گیرنده‌ای که برای استخراج کلید session استفاده می‌شود
- `--session-id <id>`: شناسه صریح session
- `--agent <id>`: شناسه agent؛ bindingهای مسیریابی را override می‌کند
- `--model <id>`: override مدل برای این اجرا (`provider/model` یا شناسه مدل)
- `--thinking <level>`: سطح تفکر agent (`off`، `minimal`، `low`، `medium`، `high`، به‌علاوه سطح‌های سفارشی پشتیبانی‌شده توسط provider مانند `xhigh`، `adaptive`، یا `max`)
- `--verbose <on|off>`: سطح verbose را برای session پایدار می‌کند
- `--channel <channel>`: کانال تحویل؛ برای استفاده از کانال اصلی session حذفش کنید
- `--reply-to <target>`: override هدف تحویل
- `--reply-channel <channel>`: override کانال تحویل
- `--reply-account <id>`: override حساب تحویل
- `--local`: agent تعبیه‌شده را مستقیم اجرا می‌کند (پس از preload رجیستری Plugin)
- `--deliver`: پاسخ را به کانال/هدف انتخاب‌شده بازمی‌فرستد
- `--timeout <seconds>`: override زمان‌انتظار agent (پیش‌فرض 600 یا مقدار config)
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

- حالت Gateway وقتی درخواست Gateway ناموفق شود، به agent تعبیه‌شده fallback می‌کند. برای اجبار اجرای تعبیه‌شده از ابتدا، از `--local` استفاده کنید.
- `--local` همچنان ابتدا رجیستری Plugin را preload می‌کند، بنابراین providerها، ابزارها، و کانال‌های ارائه‌شده توسط Plugin هنگام اجراهای تعبیه‌شده در دسترس می‌مانند.
- `--local` و اجراهای fallback تعبیه‌شده به‌عنوان اجراهای یک‌باره در نظر گرفته می‌شوند. منابع loopback بسته‌بندی‌شده MCP و sessionهای گرم Claude stdio که برای آن فرایند local باز شده‌اند پس از پاسخ کنار گذاشته می‌شوند، بنابراین فراخوانی‌های اسکریپتی فرایندهای فرزند local را زنده نگه نمی‌دارند.
- اجراهای پشتیبانی‌شده توسط Gateway منابع loopback MCP متعلق به Gateway را زیر فرایند Gateway در حال اجرا باقی می‌گذارند؛ clientهای قدیمی‌تر ممکن است هنوز flag پاک‌سازی تاریخی را بفرستند، اما Gateway آن را به‌عنوان no-op سازگاری می‌پذیرد.
- `--channel`، `--reply-channel`، و `--reply-account` بر تحویل پاسخ اثر می‌گذارند، نه مسیریابی session.
- `--json` stdout را برای پاسخ JSON رزرو نگه می‌دارد. تشخیص‌های Gateway، Plugin، و fallback تعبیه‌شده به stderr هدایت می‌شوند تا اسکریپت‌ها بتوانند stdout را مستقیم parse کنند.
- JSON fallback تعبیه‌شده شامل `meta.transport: "embedded"` و `meta.fallbackFrom: "gateway"` است تا اسکریپت‌ها بتوانند اجراهای fallback را از اجراهای Gateway تشخیص دهند.
- اگر Gateway یک اجرای agent را بپذیرد اما CLI هنگام انتظار برای پاسخ نهایی timeout شود، fallback تعبیه‌شده از یک شناسه صریح session/run تازه با قالب `gateway-fallback-*` استفاده می‌کند و `meta.fallbackReason: "gateway_timeout"` به‌علاوه فیلدهای session fallback را گزارش می‌دهد. این کار از race با قفل transcript متعلق به Gateway یا جایگزینی بی‌صدای session گفت‌وگوی مسیریابی‌شده اصلی جلوگیری می‌کند.
- وقتی این فرمان بازتولید `models.json` را فعال می‌کند، اعتبارنامه‌های provider مدیریت‌شده با SecretRef به‌صورت markerهای غیرمحرمانه پایدار می‌شوند (برای مثال نام‌های env var، `secretref-env:ENV_VAR_NAME`، یا `secretref-managed`)، نه متن خام secret حل‌شده.
- نوشتن markerها منبع‌محور و authoritative است: OpenClaw markerها را از snapshot پیکربندی منبع فعال پایدار می‌کند، نه از مقدارهای secret زمان اجرا که resolve شده‌اند.

## وضعیت تحویل JSON

وقتی `--json --deliver` استفاده شود، پاسخ JSON در CLI ممکن است شامل `deliveryStatus` در سطح بالا باشد تا اسکریپت‌ها بتوانند ارسال‌های تحویل‌شده، سرکوب‌شده، جزئی، و ناموفق را تشخیص دهند:

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

`deliveryStatus.status` یکی از `sent`، `suppressed`، `partial_failed`، یا `failed` است. `suppressed` یعنی تحویل عمدا ارسال نشده است، برای مثال یک hook ارسال پیام آن را لغو کرده یا نتیجه قابل‌مشاهده‌ای وجود نداشته است؛ این همچنان یک نتیجه نهایی بدون retry است. `partial_failed` یعنی حداقل یک payload پیش از شکست payload بعدی ارسال شده است. `failed` یعنی هیچ ارسال پایدار تکمیل نشده یا preflight تحویل ناموفق بوده است.

پاسخ‌های CLI پشتیبانی‌شده توسط Gateway همچنین شکل خام نتیجه Gateway را حفظ می‌کنند، که همان شیء در `result.deliveryStatus` در دسترس است.

فیلدهای رایج:

- `requested`: وقتی شیء وجود دارد همیشه `true` است.
- `attempted`: پس از اجرای مسیر ارسال پایدار `true` است؛ برای شکست‌های preflight یا نبود payloadهای قابل‌مشاهده `false` است.
- `succeeded`: `true`، `false`، یا `"partial"`؛ `"partial"` همراه با `status: "partial_failed"` می‌آید.
- `reason`: دلیل lowercase snake-case از تحویل پایدار یا اعتبارسنجی preflight. دلیل‌های شناخته‌شده شامل `cancelled_by_message_sending_hook`، `no_visible_payload`، `no_visible_result`، `channel_resolved_to_internal`، `unknown_channel`، `invalid_delivery_target`، و `no_delivery_target` هستند؛ ارسال‌های پایدار ناموفق ممکن است مرحله ناموفق را نیز گزارش کنند. مقدارهای ناشناخته را opaque در نظر بگیرید، چون این مجموعه می‌تواند گسترش یابد.
- `resultCount`: تعداد نتایج ارسال کانال در صورت در دسترس بودن.
- `sentBeforeError`: وقتی یک شکست جزئی پیش از خطا حداقل یک payload را ارسال کرده باشد `true` است.
- `error`: مقدار بولی `true` برای ارسال‌های ناموفق یا جزئی‌ناموفق.
- `errorMessage`: فقط وقتی شامل می‌شود که پیام خطای تحویل زیربنایی capture شده باشد. شکست‌های preflight دارای `error` و `reason` هستند اما `errorMessage` ندارند.
- `payloadOutcomes`: نتایج اختیاری به‌ازای هر payload با `index`، `status`، `reason`، `resultCount`، `error`، `stage`، `sentBeforeError`، یا metadata مربوط به hook در صورت دسترس بودن.

## مرتبط

- [مرجع CLI](/fa/cli)
- [زمان اجرای Agent](/fa/concepts/agent)
