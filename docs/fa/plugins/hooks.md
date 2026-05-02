---
read_when:
    - در حال ساخت یک Plugin هستید که به before_tool_call، before_agent_reply، هوک‌های پیام یا هوک‌های چرخهٔ حیات نیاز دارد
    - باید فراخوانی‌های ابزار از یک Plugin را مسدود کنید، بازنویسی کنید، یا برایشان تأیید الزامی کنید.
    - در حال تصمیم‌گیری بین هوک‌های داخلی و هوک‌های Plugin هستید
summary: 'هوک‌های Plugin: رویدادهای چرخهٔ حیات عامل، ابزار، پیام، نشست و Gateway را رهگیری کنید'
title: هوک‌های Plugin
x-i18n:
    generated_at: "2026-05-02T11:55:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

هوک‌های Plugin نقطه‌های گسترش درون‌فرایندی برای Pluginهای OpenClaw هستند. از آن‌ها
زمانی استفاده کنید که یک Plugin باید اجرای عامل‌ها، فراخوانی ابزارها، جریان پیام،
چرخهٔ عمر نشست، مسیریابی زیرعامل، نصب‌ها یا راه‌اندازی Gateway را بررسی یا تغییر دهد.

به‌جای آن، زمانی از [هوک‌های داخلی](/fa/automation/hooks) استفاده کنید که یک اسکریپت
کوچک `HOOK.md` نصب‌شده توسط اپراتور برای رویدادهای فرمان و Gateway مانند
`/new`، `/reset`، `/stop`، `agent:bootstrap` یا `gateway:startup` می‌خواهید.

## شروع سریع

هوک‌های تایپ‌شدهٔ Plugin را با `api.on(...)` از ورودی Plugin خود ثبت کنید:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

گرداننده‌های هوک به‌ترتیب نزولی `priority` پشت‌سرهم اجرا می‌شوند. هوک‌های
با اولویت یکسان ترتیب ثبت را حفظ می‌کنند.

`api.on(name, handler, opts?)` این موارد را می‌پذیرد:

- `priority` — ترتیب گرداننده‌ها (عدد بالاتر زودتر اجرا می‌شود).
- `timeoutMs` — بودجهٔ اختیاری برای هر هوک. وقتی تنظیم شود، اجراکنندهٔ هوک پس از
  پایان بودجه آن گرداننده را لغو می‌کند و به گردانندهٔ بعدی ادامه می‌دهد، به‌جای
  اینکه اجازه دهد راه‌اندازی کند یا کار بازیابی زمان‌بر، مهلت زمانی مدل
  پیکربندی‌شدهٔ فراخواننده را مصرف کند. آن را حذف کنید تا از مهلت زمانی پیش‌فرض
  مشاهده/تصمیم استفاده شود که اجراکنندهٔ هوک به‌صورت عمومی اعمال می‌کند.

هر هوک `event.context.pluginConfig` را دریافت می‌کند، یعنی پیکربندی حل‌شده برای
Pluginی که آن گرداننده را ثبت کرده است. برای تصمیم‌های هوک که به گزینه‌های فعلی
Plugin نیاز دارند از آن استفاده کنید؛ OpenClaw آن را برای هر گرداننده تزریق
می‌کند، بدون اینکه شیء رویداد مشترک دیده‌شده توسط Pluginهای دیگر را تغییر دهد.

## فهرست هوک‌ها

هوک‌ها بر اساس سطحی که گسترش می‌دهند گروه‌بندی شده‌اند. نام‌های **پررنگ** یک
نتیجهٔ تصمیم را می‌پذیرند (مسدودسازی، لغو، بازنویسی یا الزام تأیید)؛ همهٔ موارد
دیگر فقط برای مشاهده هستند.

**نوبت عامل**

- `before_model_resolve` — بازنویسی ارائه‌دهنده یا مدل پیش از بارگذاری پیام‌های نشست
- `agent_turn_prepare` — مصرف تزریق‌های نوبت Plugin در صف و افزودن زمینهٔ همان نوبت پیش از هوک‌های پرامپت
- `before_prompt_build` — افزودن زمینهٔ پویا یا متن پرامپت سیستم پیش از فراخوانی مدل
- `before_agent_start` — مرحلهٔ ترکیبی فقط برای سازگاری؛ دو هوک بالا را ترجیح دهید
- **`before_agent_reply`** — قطع کوتاه نوبت مدل با پاسخ ساختگی یا سکوت
- **`before_agent_finalize`** — بررسی پاسخ نهایی طبیعی و درخواست یک گذر دیگر مدل
- `agent_end` — مشاهدهٔ پیام‌های نهایی، وضعیت موفقیت و مدت اجرای کار
- `heartbeat_prompt_contribution` — افزودن زمینهٔ مخصوص Heartbeat برای Pluginهای پایش پس‌زمینه و چرخهٔ عمر

**مشاهدهٔ مکالمه**

- `model_call_started` / `model_call_ended` — مشاهدهٔ فرادادهٔ پاک‌سازی‌شدهٔ فراخوانی ارائه‌دهنده/مدل، زمان‌بندی، نتیجه و هش‌های محدود شناسهٔ درخواست، بدون محتوای پرامپت یا پاسخ
- `llm_input` — مشاهدهٔ ورودی ارائه‌دهنده (پرامپت سیستم، پرامپت، تاریخچه)
- `llm_output` — مشاهدهٔ خروجی ارائه‌دهنده

**ابزارها**

- **`before_tool_call`** — بازنویسی پارامترهای ابزار، مسدودسازی اجرا یا الزام تأیید
- `after_tool_call` — مشاهدهٔ نتایج ابزار، خطاها و مدت زمان
- **`tool_result_persist`** — بازنویسی پیام دستیار تولیدشده از نتیجهٔ ابزار
- **`before_message_write`** — بررسی یا مسدودسازی نوشتن پیام در حال انجام (نادر)

**پیام‌ها و تحویل**

- **`inbound_claim`** — تصاحب یک پیام ورودی پیش از مسیریابی عامل (پاسخ‌های ساختگی)
- `message_received` — مشاهدهٔ محتوای ورودی، فرستنده، رشتهٔ گفتگو و فراداده
- **`message_sending`** — بازنویسی محتوای خروجی یا لغو تحویل
- `message_sent` — مشاهدهٔ موفقیت یا شکست تحویل خروجی
- **`before_dispatch`** — بررسی یا بازنویسی یک ارسال خروجی پیش از تحویل به کانال
- **`reply_dispatch`** — مشارکت در خط لولهٔ نهایی ارسال پاسخ

**نشست‌ها و Compaction**

- `session_start` / `session_end` — پیگیری مرزهای چرخهٔ عمر نشست
- `before_compaction` / `after_compaction` — مشاهده یا یادداشت‌گذاری چرخه‌های Compaction
- `before_reset` — مشاهدهٔ رویدادهای بازنشانی نشست (`/reset`، بازنشانی‌های برنامه‌ای)

**زیرعامل‌ها**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — هماهنگ‌سازی مسیریابی زیرعامل و تحویل تکمیل

**چرخهٔ عمر**

- `gateway_start` / `gateway_stop` — راه‌اندازی یا توقف سرویس‌های متعلق به Plugin همراه با Gateway
- `cron_changed` — مشاهدهٔ تغییرات چرخهٔ عمر Cron متعلق به Gateway (افزوده‌شده، به‌روزرسانی‌شده، حذف‌شده، شروع‌شده، پایان‌یافته، زمان‌بندی‌شده)
- **`before_install`** — بررسی اسکن‌های نصب مهارت یا Plugin و در صورت نیاز مسدودسازی

## سیاست فراخوانی ابزار

`before_tool_call` این موارد را دریافت می‌کند:

- `event.toolName`
- `event.params`
- `event.runId` اختیاری
- `event.toolCallId` اختیاری
- فیلدهای زمینه مانند `ctx.agentId`، `ctx.sessionKey`، `ctx.sessionId`،
  `ctx.runId`، `ctx.jobId` (تنظیم‌شده در اجراهای مبتنی بر Cron) و `ctx.trace` تشخیصی

می‌تواند این را برگرداند:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

قواعد:

- `block: true` نهایی است و گرداننده‌های با اولویت پایین‌تر را رد می‌کند.
- `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `params` پارامترهای ابزار را برای اجرا بازنویسی می‌کند.
- `requireApproval` اجرای عامل را متوقف می‌کند و از طریق تأییدهای Plugin از
  کاربر می‌پرسد. فرمان `/approve` می‌تواند هم تأییدهای exec و هم تأییدهای Plugin را تأیید کند.
- یک `block: true` با اولویت پایین‌تر همچنان می‌تواند پس از درخواست تأیید توسط
  یک هوک با اولویت بالاتر، مسدود کند.
- `onResolution` تصمیم تأیید حل‌شده را دریافت می‌کند — `allow-once`،
  `allow-always`، `deny`، `timeout` یا `cancelled`.

Pluginهای همراهی که به سیاست سطح میزبان نیاز دارند می‌توانند سیاست‌های ابزار
مورد اعتماد را با `api.registerTrustedToolPolicy(...)` ثبت کنند. این‌ها پیش از
هوک‌های معمولی `before_tool_call` و پیش از تصمیم‌های Plugin خارجی اجرا می‌شوند.
فقط برای دروازه‌های مورد اعتماد میزبان مانند سیاست فضای کاری، اعمال بودجه یا
ایمنی گردش‌کارهای رزروشده از آن‌ها استفاده کنید. Pluginهای خارجی باید از هوک‌های
معمولی `before_tool_call` استفاده کنند.

### پایداری نتیجهٔ ابزار

نتایج ابزار می‌توانند شامل `details` ساختاریافته برای رندر UI، عیب‌یابی،
مسیریابی رسانه یا فرادادهٔ متعلق به Plugin باشند. با `details` به‌عنوان
فرادادهٔ زمان اجرا رفتار کنید، نه محتوای پرامپت:

- OpenClaw پیش از بازپخش ارائه‌دهنده و ورودی Compaction، `toolResult.details`
  را حذف می‌کند تا فراداده به زمینهٔ مدل تبدیل نشود.
- ورودی‌های نشست پایدارشده فقط `details` محدود را نگه می‌دارند. جزئیات بیش‌ازحد
  بزرگ با خلاصه‌ای فشرده و `persistedDetailsTruncated: true` جایگزین می‌شوند.
- `tool_result_persist` و `before_message_write` پیش از سقف نهایی پایداری اجرا
  می‌شوند. هوک‌ها همچنان باید `details` برگشتی را کوچک نگه دارند و از قرار دادن
  متن مرتبط با پرامپت فقط در `details` پرهیز کنند؛ خروجی ابزار قابل‌مشاهده برای
  مدل را در `content` قرار دهید.

## هوک‌های پرامپت و مدل

برای Pluginهای جدید از هوک‌های ویژهٔ هر مرحله استفاده کنید:

- `before_model_resolve`: فقط پرامپت فعلی و فرادادهٔ پیوست را دریافت می‌کند.
  `providerOverride` یا `modelOverride` برگردانید.
- `agent_turn_prepare`: پرامپت فعلی، پیام‌های آماده‌شدهٔ نشست و هر تزریق صف‌شدهٔ
  دقیقاً یک‌باره که برای این نشست تخلیه شده است را دریافت می‌کند. `prependContext`
  یا `appendContext` برگردانید.
- `before_prompt_build`: پرامپت فعلی و پیام‌های نشست را دریافت می‌کند.
  `prependContext`، `appendContext`، `systemPrompt`،
  `prependSystemContext` یا `appendSystemContext` برگردانید.
- `heartbeat_prompt_contribution`: فقط برای نوبت‌های Heartbeat اجرا می‌شود و
  `prependContext` یا `appendContext` برمی‌گرداند. برای پایشگرهای پس‌زمینه‌ای
  در نظر گرفته شده است که باید وضعیت فعلی را بدون تغییر دادن نوبت‌های آغازشده
  توسط کاربر خلاصه کنند.

`before_agent_start` برای سازگاری باقی مانده است. هوک‌های صریح بالا را ترجیح
دهید تا Plugin شما به یک مرحلهٔ ترکیبی قدیمی وابسته نشود.

`before_agent_start` و `agent_end` وقتی OpenClaw بتواند اجرای فعال را شناسایی
کند، شامل `event.runId` هستند. همان مقدار روی `ctx.runId` نیز در دسترس است.
اجراهای مبتنی بر Cron همچنین `ctx.jobId` (شناسهٔ کار Cron مبدأ) را آشکار
می‌کنند تا هوک‌های Plugin بتوانند سنجه‌ها، اثرات جانبی یا وضعیت را به یک کار
زمان‌بندی‌شدهٔ مشخص محدود کنند.

برای اجراهای برخاسته از کانال، `ctx.messageProvider` سطح ارائه‌دهنده‌ای مانند
`discord` یا `telegram` است، در حالی که `ctx.channelId` شناسهٔ مقصد گفتگو است
وقتی OpenClaw بتواند آن را از کلید نشست یا فرادادهٔ تحویل استخراج کند.

`agent_end` یک هوک مشاهده است و پس از نوبت به‌صورت fire-and-forget اجرا می‌شود.
اجراکنندهٔ هوک یک مهلت زمانی ۳۰ ثانیه‌ای اعمال می‌کند تا یک Plugin گیرکرده یا
نقطهٔ پایانی embedding نتواند promise هوک را برای همیشه معلق نگه دارد. مهلت
زمانی ثبت می‌شود و OpenClaw ادامه می‌دهد؛ کار شبکه‌ای متعلق به Plugin را لغو
نمی‌کند مگر اینکه خود Plugin نیز از سیگنال لغو خودش استفاده کند.

برای دورسنجی فراخوانی ارائه‌دهنده که نباید پرامپت‌های خام، تاریخچه، پاسخ‌ها،
سرآیندها، بدنه‌های درخواست یا شناسه‌های درخواست ارائه‌دهنده را دریافت کند، از
`model_call_started` و `model_call_ended` استفاده کنید. این هوک‌ها شامل فرادادهٔ
پایدار مانند `runId`، `callId`، `provider`، `model`، `api`/`transport` اختیاری،
`durationMs`/`outcome` پایانی و `upstreamRequestIdHash` هستند، وقتی OpenClaw
بتواند یک هش محدود شناسهٔ درخواست ارائه‌دهنده را استخراج کند.

`before_agent_finalize` فقط وقتی اجرا می‌شود که یک harness در آستانهٔ پذیرش پاسخ
نهایی طبیعی دستیار باشد. این مسیر لغو `/stop` نیست و وقتی کاربر یک نوبت را لغو
می‌کند اجرا نمی‌شود. برای درخواست یک گذر دیگر مدل پیش از نهایی‌سازی، `{ action:
"revise", reason }` را برگردانید؛ برای تحمیل نهایی‌سازی، `{ action:
"finalize", reason? }` را برگردانید؛ یا برای ادامه، نتیجه‌ای برنگردانید.
هوک‌های بومی `Stop` در Codex به‌عنوان تصمیم‌های `before_agent_finalize` در
OpenClaw به این هوک منتقل می‌شوند.

Pluginهای غیرهمراهی که به `llm_input`، `llm_output`،
`before_agent_finalize` یا `agent_end` نیاز دارند باید این را تنظیم کنند:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

هوک‌های تغییردهندهٔ پرامپت و تزریق‌های پایدار نوبت بعدی را می‌توان برای هر Plugin
با `plugins.entries.<id>.hooks.allowPromptInjection=false` غیرفعال کرد.

### گسترش‌های نشست و تزریق‌های نوبت بعدی

Pluginهای گردش‌کار می‌توانند وضعیت نشست کوچک و سازگار با JSON را با
`api.registerSessionExtension(...)` پایدار کنند و آن را از طریق متد
`sessions.pluginPatch` در Gateway به‌روزرسانی کنند. ردیف‌های نشست وضعیت گسترش
ثبت‌شده را از طریق `pluginExtensions` نمایش می‌دهند و به Control UI و کلاینت‌های
دیگر اجازه می‌دهند وضعیت متعلق به Plugin را بدون دانستن جزئیات داخلی Plugin
رندر کنند.

وقتی یک Plugin نیاز دارد زمینهٔ پایدار دقیقاً یک‌بار به نوبت بعدی مدل برسد، از
`api.enqueueNextTurnInjection(...)` استفاده کنید. OpenClaw تزریق‌های صف‌شده را
پیش از هوک‌های پرامپت تخلیه می‌کند، تزریق‌های منقضی‌شده را حذف می‌کند و بر اساس
`idempotencyKey` برای هر Plugin حذف تکراری انجام می‌دهد. این نقطهٔ اتصال مناسب
برای ازسرگیری تأییدها، خلاصه‌های سیاست، دلتاهای پایشگر پس‌زمینه و ادامه‌های
فرمانی است که باید در نوبت بعدی برای مدل قابل‌مشاهده باشند، اما نباید به متن
دائمی پرامپت سیستم تبدیل شوند.

معناشناسی پاک‌سازی بخشی از قرارداد است. callbackهای پاک‌سازی گسترش نشست و
پاک‌سازی چرخهٔ عمر زمان اجرا، `reset`، `delete`، `disable` یا `restart` را
دریافت می‌کنند. میزبان وضعیت گسترش نشست پایدار متعلق به Plugin و تزریق‌های
نوبت بعدی در انتظار را برای reset/delete/disable حذف می‌کند؛ restart وضعیت
نشست پایدار را حفظ می‌کند، در حالی که callbackهای پاک‌سازی به Pluginها اجازه
می‌دهند کارهای زمان‌بند، زمینهٔ اجرا و دیگر منابع خارج از باند را برای نسل
زمان اجرای قدیمی آزاد کنند.

## هوک‌های پیام

از هوک‌های پیام برای مسیریابی سطح کانال و سیاست تحویل استفاده کنید:

- `message_received`: مشاهدهٔ محتوای ورودی، فرستنده، `threadId`، `messageId`،
  `senderId`، همبستگی اختیاری اجرا/نشست، و فراداده.
- `message_sending`: بازنویسی `content` یا برگرداندن `{ cancel: true }`.
- `message_sent`: مشاهدهٔ موفقیت یا شکست نهایی.

برای پاسخ‌های TTS فقط‌صوتی، `content` ممکن است شامل رونوشت گفتاری پنهان باشد،
حتی وقتی payload کانال متن/کپشن قابل‌مشاهده‌ای ندارد. بازنویسی آن
`content` فقط رونوشت قابل‌مشاهده برای هوک را به‌روزرسانی می‌کند؛ به‌عنوان
کپشن رسانه نمایش داده نمی‌شود.

زمینه‌های هوک پیام، در صورت موجود بودن، فیلدهای همبستگی پایدار را در اختیار می‌گذارند:
`ctx.sessionKey`، `ctx.runId`، `ctx.messageId`، `ctx.senderId`، `ctx.trace`،
`ctx.traceId`، `ctx.spanId`، `ctx.parentSpanId`، و `ctx.callDepth`. پیش از
خواندن فرادادهٔ قدیمی، این فیلدهای درجه‌اول را ترجیح دهید.

پیش از استفاده از فرادادهٔ اختصاصی کانال، فیلدهای تایپ‌شدهٔ `threadId` و
`replyToId` را ترجیح دهید.

قواعد تصمیم‌گیری:

- `message_sending` با `cancel: true` نهایی است.
- `message_sending` با `cancel: false` به‌عنوان نبودِ تصمیم در نظر گرفته می‌شود.
- `content` بازنویسی‌شده به هوک‌های با اولویت پایین‌تر ادامه می‌دهد، مگر اینکه
  هوک بعدی تحویل را لغو کند.

## نصب هوک‌ها

`before_install` پس از اسکن داخلی برای نصب‌های skill و Plugin اجرا می‌شود.
برای متوقف کردن نصب، یافته‌های اضافی یا `{ block: true, blockReason }` را
برگردانید.

`block: true` نهایی است. `block: false` به‌عنوان نبودِ تصمیم در نظر گرفته می‌شود.

## چرخهٔ عمر Gateway

برای سرویس‌های Plugin که به وضعیت تحت مالکیت Gateway نیاز دارند، از `gateway_start`
استفاده کنید. زمینه، `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` را برای
بازرسی و به‌روزرسانی‌های cron در اختیار می‌گذارد. برای پاک‌سازی منابع بلندمدت
از `gateway_stop` استفاده کنید.

برای سرویس‌های زمان اجرای تحت مالکیت Plugin، به هوک داخلی `gateway:startup`
تکیه نکنید.

`cron_changed` برای رویدادهای چرخهٔ عمر cron تحت مالکیت Gateway با payload
رویداد تایپ‌شده‌ای اجرا می‌شود که دلایل `added`، `updated`، `removed`،
`started`، `finished`، و `scheduled` را پوشش می‌دهد. رویداد یک snapshot از
`PluginHookGatewayCronJob` (شامل `state.nextRunAtMs`، `state.lastRunStatus`، و
`state.lastError` در صورت وجود) به‌همراه یک `PluginHookGatewayCronDeliveryStatus`
با مقدار `not-requested` | `delivered` | `not-delivered` | `unknown` حمل می‌کند.
رویدادهای حذف‌شده همچنان snapshot کار حذف‌شده را حمل می‌کنند تا زمان‌بندهای
خارجی بتوانند وضعیت را همگام‌سازی کنند. هنگام همگام‌سازی زمان‌بندهای بیدارباش
خارجی، از `ctx.getCron?.()` و `ctx.config` از زمینهٔ زمان اجرا استفاده کنید، و
OpenClaw را به‌عنوان منبع حقیقت برای بررسی‌های سررسید و اجرا نگه دارید.

## موارد منسوخ‌شدن پیشِ رو

چند سطح مجاور هوک منسوخ شده‌اند، اما همچنان پشتیبانی می‌شوند. پیش از انتشار
اصلی بعدی مهاجرت کنید:

- **پاکت‌های کانال متن ساده** در handlerهای `inbound_claim` و `message_received`.
  به‌جای parse کردن متن پاکت تخت، `BodyForAgent` و بلوک‌های ساختاریافتهٔ زمینهٔ
  کاربر را بخوانید. ببینید
  [پاکت‌های کانال متن ساده → BodyForAgent](/fa/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** برای سازگاری باقی می‌ماند. Pluginهای جدید باید به‌جای
  فاز ترکیبی از `before_model_resolve` و `before_prompt_build` استفاده کنند.
- **`onResolution` در `before_tool_call`** اکنون به‌جای یک `string` آزاد، از union
  تایپ‌شدهٔ `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) استفاده می‌کند.

برای فهرست کامل — ثبت قابلیت حافظه، profile فکرکردن provider، providerهای احراز
هویت خارجی، نوع‌های کشف provider، accessorهای زمان اجرای وظیفه، و تغییر نام
`command-auth` → `command-status` — ببینید
[مهاجرت Plugin SDK → موارد منسوخ فعال](/fa/plugins/sdk-migration#active-deprecations).

## مرتبط

- [مهاجرت Plugin SDK](/fa/plugins/sdk-migration) — موارد منسوخ فعال و زمان‌بندی حذف
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [هوک‌های داخلی](/fa/automation/hooks)
- [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals)
