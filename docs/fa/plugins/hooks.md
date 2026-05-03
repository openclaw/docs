---
read_when:
    - در حال ساخت یک Plugin هستید که به before_tool_call، before_agent_reply، هوک‌های پیام یا هوک‌های چرخهٔ عمر نیاز دارد
    - باید فراخوانی‌های ابزار از یک Plugin را مسدود کنید، بازنویسی کنید، یا برای آن‌ها تأیید الزامی کنید.
    - در حال انتخاب بین هوک‌های داخلی و هوک‌های Plugin هستید
summary: 'هوک‌های Plugin: رویدادهای چرخهٔ حیات عامل، ابزار، پیام، نشست و Gateway را رهگیری کنید'
title: هوک‌های Plugin
x-i18n:
    generated_at: "2026-05-03T21:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c4ed060f1b89917e1f2f46d2da9448cd562edbcd6ce03bc9b1a83da3ed9a591
    source_path: plugins/hooks.md
    workflow: 16
---

هوک‌های Plugin نقاط توسعه درون‌فرایندی برای Pluginهای OpenClaw هستند. از آن‌ها
زمانی استفاده کنید که یک Plugin باید اجرای عامل، فراخوانی‌های ابزار، جریان پیام،
چرخه عمر نشست، مسیریابی زیرعامل، نصب‌ها، یا راه‌اندازی Gateway را بررسی یا تغییر دهد.

در عوض، زمانی از [هوک‌های داخلی](/fa/automation/hooks) استفاده کنید که یک اسکریپت
کوچک `HOOK.md` نصب‌شده توسط اپراتور برای رویدادهای فرمان و Gateway مانند
`/new`، `/reset`، `/stop`، `agent:bootstrap`، یا `gateway:startup` می‌خواهید.

## شروع سریع

هوک‌های Plugin نوع‌دار را با `api.on(...)` از ورودی Plugin خود ثبت کنید:

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

مدیریت‌کننده‌های هوک به‌ترتیب نزولی `priority` اجرا می‌شوند. هوک‌هایی با اولویت
یکسان، ترتیب ثبت را حفظ می‌کنند.

`api.on(name, handler, opts?)` این موارد را می‌پذیرد:

- `priority` — ترتیب مدیریت‌کننده‌ها (عدد بالاتر زودتر اجرا می‌شود).
- `timeoutMs` — بودجه اختیاری برای هر هوک. وقتی تنظیم شود، اجراکننده هوک آن
  مدیریت‌کننده را پس از پایان بودجه لغو می‌کند و به مورد بعدی ادامه می‌دهد، به‌جای
  اینکه راه‌اندازی کند یا کار یادآوری کند بتواند مهلت مدل پیکربندی‌شده فراخواننده
  را مصرف کند. آن را حذف کنید تا از مهلت پیش‌فرض مشاهده/تصمیم‌گیری استفاده شود که
  اجراکننده هوک به‌صورت عمومی اعمال می‌کند.

اپراتورها همچنین می‌توانند بودجه هوک‌ها را بدون وصله‌کردن کد Plugin تنظیم کنند:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` مقدار `hooks.timeoutMs` را بازنویسی می‌کند، و آن نیز
مقدار نوشته‌شده توسط Plugin در `api.on(..., { timeoutMs })` را بازنویسی می‌کند.
هر مقدار پیکربندی‌شده باید یک عدد صحیح مثبت و حداکثر 600000 میلی‌ثانیه باشد.
برای هوک‌های کند شناخته‌شده، بازنویسی‌های مخصوص هر هوک را ترجیح دهید تا یک Plugin
در همه‌جا بودجه طولانی‌تری نگیرد.

هر هوک `event.context.pluginConfig` را دریافت می‌کند؛ یعنی پیکربندی حل‌شده برای
Pluginی که آن مدیریت‌کننده را ثبت کرده است. از آن برای تصمیم‌های هوکی استفاده کنید
که به گزینه‌های فعلی Plugin نیاز دارند؛ OpenClaw آن را برای هر مدیریت‌کننده تزریق
می‌کند بدون اینکه شیء رویداد مشترک دیده‌شده توسط Pluginهای دیگر را تغییر دهد.

## فهرست هوک‌ها

هوک‌ها بر اساس سطحی که توسعه می‌دهند گروه‌بندی شده‌اند. نام‌های **پررنگ** نتیجه
تصمیم را می‌پذیرند (مسدودسازی، لغو، بازنویسی، یا نیاز به تأیید)؛ همه موارد دیگر
فقط برای مشاهده هستند.

**نوبت عامل**

- `before_model_resolve` — بازنویسی ارائه‌دهنده یا مدل پیش از بارگذاری پیام‌های نشست
- `agent_turn_prepare` — مصرف تزریق‌های نوبت Plugin در صف و افزودن زمینه همان نوبت پیش از هوک‌های پرامپت
- `before_prompt_build` — افزودن زمینه پویا یا متن پرامپت سیستمی پیش از فراخوانی مدل
- `before_agent_start` — فاز ترکیبی فقط برای سازگاری؛ دو هوک بالا را ترجیح دهید
- **`before_agent_reply`** — میان‌بُر زدن نوبت مدل با پاسخ مصنوعی یا سکوت
- **`before_agent_finalize`** — بررسی پاسخ نهایی طبیعی و درخواست یک گذر مدل دیگر
- `agent_end` — مشاهده پیام‌های نهایی، وضعیت موفقیت، و مدت اجرای کار
- `heartbeat_prompt_contribution` — افزودن زمینه فقط برای Heartbeat برای Pluginهای پایش پس‌زمینه و چرخه عمر

**مشاهده گفتگو**

- `model_call_started` / `model_call_ended` — مشاهده فراداده پاک‌سازی‌شده فراخوانی ارائه‌دهنده/مدل، زمان‌بندی، نتیجه، و هش‌های محدود شناسه درخواست بدون محتوای پرامپت یا پاسخ
- `llm_input` — مشاهده ورودی ارائه‌دهنده (پرامپت سیستمی، پرامپت، تاریخچه)
- `llm_output` — مشاهده خروجی ارائه‌دهنده

**ابزارها**

- **`before_tool_call`** — بازنویسی پارامترهای ابزار، مسدودکردن اجرا، یا نیازمند کردن تأیید
- `after_tool_call` — مشاهده نتایج ابزار، خطاها، و مدت‌زمان
- **`tool_result_persist`** — بازنویسی پیام دستیار تولیدشده از نتیجه ابزار
- **`before_message_write`** — بررسی یا مسدودکردن نوشتن پیام در حال انجام (نادر)

**پیام‌ها و تحویل**

- **`inbound_claim`** — مالکیت یک پیام ورودی پیش از مسیریابی عامل (پاسخ‌های مصنوعی)
- `message_received` — مشاهده محتوای ورودی، فرستنده، رشته گفتگو، و فراداده
- **`message_sending`** — بازنویسی محتوای خروجی یا لغو تحویل
- `message_sent` — مشاهده موفقیت یا شکست تحویل خروجی
- **`before_dispatch`** — بررسی یا بازنویسی یک ارسال خروجی پیش از واگذاری به کانال
- **`reply_dispatch`** — مشارکت در خط لوله نهایی ارسال پاسخ

**نشست‌ها و Compaction**

- `session_start` / `session_end` — ردیابی مرزهای چرخه عمر نشست
- `before_compaction` / `after_compaction` — مشاهده یا حاشیه‌نویسی چرخه‌های Compaction
- `before_reset` — مشاهده رویدادهای بازنشانی نشست (`/reset`، بازنشانی‌های برنامه‌ای)

**زیرعامل‌ها**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — هماهنگ‌کردن مسیریابی زیرعامل و تحویل تکمیل

**چرخه عمر**

- `gateway_start` / `gateway_stop` — شروع یا توقف سرویس‌های تحت مالکیت Plugin همراه با Gateway
- `cron_changed` — مشاهده تغییرات چرخه عمر Cron تحت مالکیت Gateway (افزوده‌شده، به‌روزشده، حذف‌شده، شروع‌شده، پایان‌یافته، زمان‌بندی‌شده)
- **`before_install`** — بررسی اسکن‌های نصب skill یا Plugin و مسدودسازی اختیاری

## سیاست فراخوانی ابزار

`before_tool_call` این موارد را دریافت می‌کند:

- `event.toolName`
- `event.params`
- `event.runId` اختیاری
- `event.toolCallId` اختیاری
- فیلدهای زمینه مانند `ctx.agentId`، `ctx.sessionKey`، `ctx.sessionId`،
  `ctx.runId`، `ctx.jobId` (روی اجراهای مبتنی بر Cron تنظیم می‌شود)، و
  `ctx.trace` تشخیصی

می‌تواند این مورد را برگرداند:

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

- `block: true` نهایی است و مدیریت‌کننده‌های با اولویت پایین‌تر را رد می‌کند.
- `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `params` پارامترهای ابزار را برای اجرا بازنویسی می‌کند.
- `requireApproval` اجرای عامل را متوقف می‌کند و از کاربر از طریق تأییدهای Plugin
  سؤال می‌پرسد. فرمان `/approve` می‌تواند هم تأییدهای exec و هم تأییدهای Plugin را تأیید کند.
- یک `block: true` با اولویت پایین‌تر همچنان می‌تواند پس از اینکه یک هوک با اولویت
  بالاتر درخواست تأیید کرد، مسدود کند.
- `onResolution` تصمیم تأیید حل‌شده را دریافت می‌کند — `allow-once`،
  `allow-always`، `deny`، `timeout`، یا `cancelled`.

Pluginهای همراهی که به سیاست سطح میزبان نیاز دارند می‌توانند سیاست‌های ابزار
مورداعتماد را با `api.registerTrustedToolPolicy(...)` ثبت کنند. این‌ها پیش از
هوک‌های عادی `before_tool_call` و پیش از تصمیم‌های Plugin خارجی اجرا می‌شوند.
فقط برای دروازه‌های مورداعتماد میزبان مانند سیاست فضای کاری، اعمال بودجه، یا
ایمنی گردش‌کارهای رزروشده از آن‌ها استفاده کنید. Pluginهای خارجی باید از هوک‌های
عادی `before_tool_call` استفاده کنند.

### ماندگاری نتیجه ابزار

نتایج ابزار می‌توانند `details` ساختاریافته برای رندر UI، عیب‌یابی، مسیریابی رسانه،
یا فراداده تحت مالکیت Plugin داشته باشند. با `details` به‌عنوان فراداده زمان اجرا
رفتار کنید، نه محتوای پرامپت:

- OpenClaw پیش از بازپخش ارائه‌دهنده و ورودی Compaction، `toolResult.details` را
  حذف می‌کند تا فراداده به زمینه مدل تبدیل نشود.
- ورودی‌های نشست ماندگار فقط `details` محدود را نگه می‌دارند. details بیش‌ازحد
  بزرگ با خلاصه‌ای فشرده و `persistedDetailsTruncated: true` جایگزین می‌شوند.
- `tool_result_persist` و `before_message_write` پیش از سقف نهایی ماندگاری اجرا
  می‌شوند. هوک‌ها همچنان باید `details` برگشتی را کوچک نگه دارند و از قراردادن
  متن مرتبط با پرامپت فقط در `details` پرهیز کنند؛ خروجی ابزار قابل‌مشاهده برای
  مدل را در `content` قرار دهید.

## هوک‌های پرامپت و مدل

برای Pluginهای جدید از هوک‌های مخصوص فاز استفاده کنید:

- `before_model_resolve`: فقط پرامپت فعلی و فراداده پیوست را دریافت می‌کند.
  `providerOverride` یا `modelOverride` برگردانید.
- `agent_turn_prepare`: پرامپت فعلی، پیام‌های نشست آماده‌شده، و هر تزریق صف‌شده
  دقیقاً یک‌بار را که برای این نشست تخلیه شده‌اند دریافت می‌کند. `prependContext`
  یا `appendContext` برگردانید.
- `before_prompt_build`: پرامپت فعلی و پیام‌های نشست را دریافت می‌کند.
  `prependContext`، `appendContext`، `systemPrompt`،
  `prependSystemContext`، یا `appendSystemContext` برگردانید.
- `heartbeat_prompt_contribution`: فقط برای نوبت‌های Heartbeat اجرا می‌شود و
  `prependContext` یا `appendContext` برمی‌گرداند. برای پایشگرهای پس‌زمینه‌ای
  در نظر گرفته شده است که باید وضعیت فعلی را بدون تغییر نوبت‌های آغازشده توسط
  کاربر خلاصه کنند.

`before_agent_start` برای سازگاری باقی می‌ماند. هوک‌های صریح بالا را ترجیح دهید
تا Plugin شما به یک فاز ترکیبی قدیمی وابسته نشود.

`before_agent_start` و `agent_end` زمانی شامل `event.runId` می‌شوند که OpenClaw
بتواند اجرای فعال را شناسایی کند. همان مقدار روی `ctx.runId` نیز در دسترس است.
اجراهای مبتنی بر Cron همچنین `ctx.jobId` (شناسه کار Cron مبدأ) را آشکار می‌کنند
تا هوک‌های Plugin بتوانند معیارها، اثرات جانبی، یا وضعیت را به یک کار زمان‌بندی‌شده
خاص محدود کنند.

برای اجراهایی که از کانال سرچشمه می‌گیرند، `ctx.messageProvider` سطح ارائه‌دهنده
مانند `discord` یا `telegram` است، در حالی که `ctx.channelId` شناسه مقصد گفتگو
است وقتی OpenClaw بتواند آن را از کلید نشست یا فراداده تحویل استخراج کند.

`agent_end` یک هوک مشاهده است و پس از نوبت به‌صورت fire-and-forget اجرا می‌شود.
اجراکننده هوک مهلت 30 ثانیه‌ای اعمال می‌کند تا یک Plugin یا نقطه پایانی embedding
گیرکرده نتواند promise هوک را برای همیشه معلق بگذارد. مهلت ثبت می‌شود و OpenClaw
ادامه می‌دهد؛ این کار شبکه تحت مالکیت Plugin را لغو نمی‌کند مگر اینکه خود Plugin
نیز از سیگنال abort خودش استفاده کند.

برای دورسنجی فراخوانی ارائه‌دهنده که نباید پرامپت‌های خام، تاریخچه، پاسخ‌ها،
سرآیندها، بدنه‌های درخواست، یا شناسه‌های درخواست ارائه‌دهنده را دریافت کند، از
`model_call_started` و `model_call_ended` استفاده کنید. این هوک‌ها فراداده پایدار
مانند `runId`، `callId`، `provider`، `model`، `api`/`transport` اختیاری،
`durationMs`/`outcome` پایانی، و `upstreamRequestIdHash` را زمانی شامل می‌شوند
که OpenClaw بتواند یک هش محدود شناسه درخواست ارائه‌دهنده استخراج کند.

`before_agent_finalize` فقط زمانی اجرا می‌شود که یک harness در آستانه پذیرش پاسخ
نهایی طبیعی دستیار باشد. این مسیر لغو `/stop` نیست و وقتی کاربر یک نوبت را abort
می‌کند اجرا نمی‌شود. برای درخواست یک گذر مدل دیگر پیش از نهایی‌سازی
`{ action: "revise", reason }` را برگردانید، برای اجبار نهایی‌سازی `{ action:
"finalize", reason? }` را برگردانید، یا برای ادامه نتیجه‌ای برنگردانید. هوک‌های
بومی `Stop` در Codex به‌عنوان تصمیم‌های `before_agent_finalize` در OpenClaw به
این هوک منتقل می‌شوند.

Pluginهای غیرهمراهی که به `llm_input`، `llm_output`،
`before_agent_finalize`، یا `agent_end` نیاز دارند باید این را تنظیم کنند:

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

هوک‌های تغییردهنده پرامپت و تزریق‌های ماندگار نوبت بعدی را می‌توان برای هر Plugin
با `plugins.entries.<id>.hooks.allowPromptInjection=false` غیرفعال کرد.

### افزونه‌های نشست و تزریق‌های نوبت بعدی

Pluginهای گردش‌کار می‌توانند وضعیت نشست کوچک سازگار با JSON را با
`api.registerSessionExtension(...)` ماندگار کنند و آن را از طریق متد Gateway
`sessions.pluginPatch` به‌روزرسانی کنند. ردیف‌های نشست، وضعیت افزونه ثبت‌شده را
از طریق `pluginExtensions` نمایش می‌دهند و به Control UI و دیگر کلاینت‌ها اجازه
می‌دهند وضعیت تحت مالکیت Plugin را بدون شناخت داخلیات Plugin رندر کنند.

از `api.enqueueNextTurnInjection(...)` زمانی استفاده کنید که یک Plugin به زمینهٔ پایدار نیاز دارد تا دقیقاً یک‌بار به نوبت بعدی مدل برسد. OpenClaw تزریق‌های صف‌شده را پیش از قلاب‌های پرامپت تخلیه می‌کند، تزریق‌های منقضی‌شده را کنار می‌گذارد، و بر اساس `idempotencyKey` برای هر Plugin موارد تکراری را حذف می‌کند. این درز مناسب برای ازسرگیری‌های تأیید، خلاصه‌های سیاست، دلتاهای پایش پس‌زمینه، و ادامه‌های فرمان است که باید در نوبت بعدی برای مدل قابل مشاهده باشند اما نباید به متن دائمی پرامپت سیستم تبدیل شوند.

معناشناسی پاک‌سازی بخشی از قرارداد است. پاک‌سازی افزونهٔ نشست و فراخوان‌های پاک‌سازی چرخهٔ حیات زمان اجرا، `reset`، `delete`، `disable`، یا `restart` را دریافت می‌کنند. میزبان، وضعیت پایدار افزونهٔ نشست متعلق به Plugin و تزریق‌های معلق نوبت بعدی را برای reset/delete/disable حذف می‌کند؛ restart وضعیت پایدار نشست را نگه می‌دارد، در حالی که فراخوان‌های پاک‌سازی به Pluginها اجازه می‌دهند کارهای زمان‌بند، زمینهٔ اجرا، و دیگر منابع خارج از باند مربوط به نسل قدیمی زمان اجرا را آزاد کنند.

## قلاب‌های پیام

از قلاب‌های پیام برای مسیریابی و سیاست تحویل در سطح کانال استفاده کنید:

- `message_received`: محتوای ورودی، فرستنده، `threadId`، `messageId`، `senderId`، هم‌بستگی اختیاری اجرا/نشست، و فراداده را مشاهده می‌کند.
- `message_sending`: `content` را بازنویسی می‌کند یا `{ cancel: true }` برمی‌گرداند.
- `message_sent`: موفقیت یا شکست نهایی را مشاهده می‌کند.

برای پاسخ‌های TTS فقط-صوتی، `content` می‌تواند شامل رونوشت گفتاری پنهان باشد، حتی زمانی که payload کانال هیچ متن/زیرنویس قابل مشاهده‌ای ندارد. بازنویسی آن `content` فقط رونوشت قابل مشاهده برای قلاب را به‌روزرسانی می‌کند؛ این متن به‌عنوان زیرنویس رسانه رندر نمی‌شود.

زمینه‌های قلاب پیام، در صورت در دسترس بودن، فیلدهای هم‌بستگی پایدار را آشکار می‌کنند: `ctx.sessionKey`، `ctx.runId`، `ctx.messageId`، `ctx.senderId`، `ctx.trace`، `ctx.traceId`، `ctx.spanId`، `ctx.parentSpanId`، و `ctx.callDepth`. پیش از خواندن فرادادهٔ قدیمی، این فیلدهای درجه‌اول را ترجیح دهید.

پیش از استفاده از فرادادهٔ اختصاصی کانال، فیلدهای تایپ‌شدهٔ `threadId` و `replyToId` را ترجیح دهید.

قواعد تصمیم‌گیری:

- `message_sending` با `cancel: true` نهایی است.
- `message_sending` با `cancel: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `content` بازنویسی‌شده به قلاب‌های با اولویت پایین‌تر ادامه می‌یابد، مگر اینکه قلابی بعدی تحویل را لغو کند.

## قلاب‌های نصب

`before_install` پس از اسکن داخلی برای نصب Skills و Plugin اجرا می‌شود. یافته‌های اضافی یا `{ block: true, blockReason }` را برگردانید تا نصب متوقف شود.

`block: true` نهایی است. `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.

## چرخهٔ حیات Gateway

از `gateway_start` برای سرویس‌های Plugin که به وضعیت متعلق به Gateway نیاز دارند استفاده کنید. زمینه، `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` را برای بازرسی و به‌روزرسانی‌های cron آشکار می‌کند. از `gateway_stop` برای پاک‌سازی منابع بلندمدت استفاده کنید.

برای سرویس‌های زمان اجرای متعلق به Plugin به قلاب داخلی `gateway:startup` تکیه نکنید.

`cron_changed` برای رویدادهای چرخهٔ حیات cron متعلق به gateway با payload رویداد تایپ‌شده‌ای فعال می‌شود که دلیل‌های `added`، `updated`، `removed`، `started`، `finished`، و `scheduled` را پوشش می‌دهد. رویداد یک snapshot از `PluginHookGatewayCronJob` را حمل می‌کند (شامل `state.nextRunAtMs`، `state.lastRunStatus`، و `state.lastError` در صورت وجود) به‌همراه یک `PluginHookGatewayCronDeliveryStatus` از `not-requested` | `delivered` | `not-delivered` | `unknown`. رویدادهای حذف‌شده همچنان snapshot کار حذف‌شده را حمل می‌کنند تا زمان‌بندهای خارجی بتوانند وضعیت را همگام کنند. هنگام همگام‌سازی زمان‌بندهای بیدارسازی خارجی، از `ctx.getCron?.()` و `ctx.config` از زمینهٔ زمان اجرا استفاده کنید و OpenClaw را منبع حقیقت برای بررسی‌های موعد و اجرا نگه دارید.

## منسوخ‌شدن‌های آینده

چند سطح مجاور قلاب منسوخ شده‌اند اما همچنان پشتیبانی می‌شوند. پیش از انتشار اصلی بعدی مهاجرت کنید:

- **پاکت‌های کانال متن ساده** در handlerهای `inbound_claim` و `message_received`. به‌جای تجزیهٔ متن تخت پاکت، `BodyForAgent` و بلوک‌های ساختاریافتهٔ زمینهٔ کاربر را بخوانید. ببینید
  [پاکت‌های کانال متن ساده → BodyForAgent](/fa/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** برای سازگاری باقی می‌ماند. Pluginهای جدید باید به‌جای فاز ترکیبی از `before_model_resolve` و `before_prompt_build` استفاده کنند.
- **`onResolution` در `before_tool_call`** اکنون به‌جای یک `string` آزاد، از union تایپ‌شدهٔ `PluginApprovalResolution` استفاده می‌کند (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`).

برای فهرست کامل — ثبت قابلیت حافظه، پروفایل تفکر ارائه‌دهنده، ارائه‌دهندگان احراز هویت خارجی، انواع کشف ارائه‌دهنده، دسترسی‌دهنده‌های زمان اجرای وظیفه، و تغییر نام `command-auth` به `command-status` — ببینید
[مهاجرت Plugin SDK → منسوخ‌شدن‌های فعال](/fa/plugins/sdk-migration#active-deprecations).

## مرتبط

- [مهاجرت Plugin SDK](/fa/plugins/sdk-migration) — منسوخ‌شدن‌های فعال و زمان‌بندی حذف
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [قلاب‌های داخلی](/fa/automation/hooks)
- [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals)
