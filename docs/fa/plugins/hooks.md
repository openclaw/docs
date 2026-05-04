---
read_when:
    - شما در حال ساخت یک Plugin هستید که به before_tool_call، before_agent_reply، هوک‌های پیام یا هوک‌های چرخهٔ حیات نیاز دارد
    - باید فراخوانی‌های ابزار از یک Plugin را مسدود یا بازنویسی کنید، یا برای آن‌ها تأیید لازم بدانید.
    - در حال تصمیم‌گیری بین هوک‌های داخلی و هوک‌های Plugin هستید
summary: 'هوک‌های Plugin: رویدادهای چرخهٔ عمر عامل، ابزار، پیام، جلسه و Gateway را رهگیری کنید'
title: هوک‌های Plugin
x-i18n:
    generated_at: "2026-05-04T18:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

هوک‌های Plugin نقاط توسعهٔ درون‌فرآیندی برای Pluginهای OpenClaw هستند. وقتی از آن‌ها استفاده کنید که یک Plugin باید اجرای عامل‌ها، فراخوانی ابزارها، جریان پیام، چرخهٔ عمر نشست، مسیریابی زیرعامل، نصب‌ها، یا راه‌اندازی Gateway را بررسی یا تغییر دهد.

وقتی یک اسکریپت کوچک `HOOK.md` نصب‌شده توسط اپراتور برای رویدادهای فرمان و Gateway مانند `/new`، `/reset`، `/stop`، `agent:bootstrap`، یا `gateway:startup` می‌خواهید، به‌جای آن از [هوک‌های داخلی](/fa/automation/hooks) استفاده کنید.

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

گرداننده‌های هوک به‌ترتیب نزولی `priority` اجرا می‌شوند. هوک‌های دارای اولویت یکسان ترتیب ثبت را حفظ می‌کنند.

`api.on(name, handler, opts?)` این موارد را می‌پذیرد:

- `priority` — ترتیب گرداننده‌ها (مقدار بالاتر زودتر اجرا می‌شود).
- `timeoutMs` — بودجهٔ اختیاری برای هر هوک. وقتی تنظیم شود، اجراکنندهٔ هوک پس از پایان این بودجه آن گرداننده را متوقف می‌کند و به مورد بعدی ادامه می‌دهد، به‌جای اینکه راه‌اندازی کند یا کار بازیابی کند و زمان‌سنج مدل پیکربندی‌شدهٔ فراخوان را مصرف کند. آن را حذف کنید تا از زمان‌سنج پیش‌فرض مشاهده/تصمیم استفاده شود که اجراکنندهٔ هوک به‌صورت عمومی اعمال می‌کند.

اپراتورها همچنین می‌توانند بدون وصله کردن کد Plugin، بودجه‌های هوک را تنظیم کنند:

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

`hooks.timeouts.<hookName>` مقدار `hooks.timeoutMs` را بازنویسی می‌کند، و آن نیز مقدار نوشته‌شده توسط Plugin در `api.on(..., { timeoutMs })` را بازنویسی می‌کند. هر مقدار پیکربندی‌شده باید یک عدد صحیح مثبت و حداکثر 600000 میلی‌ثانیه باشد. برای هوک‌های کندِ شناخته‌شده، بازنویسی‌های مختص هر هوک را ترجیح دهید تا یک Plugin همه‌جا بودجهٔ طولانی‌تری نگیرد.

هر هوک `event.context.pluginConfig` را دریافت می‌کند؛ یعنی پیکربندی حل‌شده برای Pluginی که آن گرداننده را ثبت کرده است. از آن برای تصمیم‌های هوک استفاده کنید که به گزینه‌های فعلی Plugin نیاز دارند؛ OpenClaw آن را برای هر گرداننده تزریق می‌کند بدون اینکه شیء رویداد مشترکی را که سایر Pluginها می‌بینند تغییر دهد.

## فهرست هوک‌ها

هوک‌ها بر اساس سطحی که توسعه می‌دهند گروه‌بندی شده‌اند. نام‌های **پررنگ** نتیجهٔ تصمیم می‌پذیرند (مسدود کردن، لغو کردن، بازنویسی، یا درخواست تأیید)؛ بقیه فقط برای مشاهده هستند.

**نوبت عامل**

- `before_model_resolve` — بازنویسی ارائه‌دهنده یا مدل پیش از بارگذاری پیام‌های نشست
- `agent_turn_prepare` — مصرف تزریق‌های نوبت Plugin در صف و افزودن زمینهٔ همان نوبت پیش از هوک‌های پرامپت
- `before_prompt_build` — افزودن زمینهٔ پویا یا متن پرامپت سیستمی پیش از فراخوانی مدل
- `before_agent_start` — فاز ترکیبی فقط برای سازگاری؛ دو هوک بالا را ترجیح دهید
- **`before_agent_reply`** — کوتاه‌کردن نوبت مدل با یک پاسخ ساختگی یا سکوت
- **`before_agent_finalize`** — بررسی پاسخ نهایی طبیعی و درخواست یک گذر دیگر مدل
- `agent_end` — مشاهدهٔ پیام‌های نهایی، وضعیت موفقیت، و مدت اجرای نوبت
- `heartbeat_prompt_contribution` — افزودن زمینهٔ فقط Heartbeat برای Pluginهای پایش پس‌زمینه و چرخهٔ عمر

**مشاهدهٔ مکالمه**

- `model_call_started` / `model_call_ended` — مشاهدهٔ فرادادهٔ پاک‌سازی‌شدهٔ فراخوانی ارائه‌دهنده/مدل، زمان‌بندی، نتیجه، و هش‌های محدود شناسهٔ درخواست بدون محتوای پرامپت یا پاسخ
- `llm_input` — مشاهدهٔ ورودی ارائه‌دهنده (پرامپت سیستمی، پرامپت، تاریخچه)
- `llm_output` — مشاهدهٔ خروجی ارائه‌دهنده

**ابزارها**

- **`before_tool_call`** — بازنویسی پارامترهای ابزار، مسدود کردن اجرا، یا درخواست تأیید
- `after_tool_call` — مشاهدهٔ نتایج ابزار، خطاها، و مدت‌زمان
- **`tool_result_persist`** — بازنویسی پیام دستیار تولیدشده از نتیجهٔ ابزار
- **`before_message_write`** — بررسی یا مسدود کردن نوشتن پیام درحال‌انجام (نادر)

**پیام‌ها و تحویل**

- **`inbound_claim`** — تصاحب یک پیام ورودی پیش از مسیریابی عامل (پاسخ‌های ساختگی)
- `message_received` — مشاهدهٔ محتوای ورودی، فرستنده، رشته، و فراداده
- **`message_sending`** — بازنویسی محتوای خروجی یا لغو تحویل
- `message_sent` — مشاهدهٔ موفقیت یا شکست تحویل خروجی
- **`before_dispatch`** — بررسی یا بازنویسی یک ارسال خروجی پیش از واگذاری به کانال
- **`reply_dispatch`** — مشارکت در خط لولهٔ نهایی ارسال پاسخ

**نشست‌ها و Compaction**

- `session_start` / `session_end` — ردیابی مرزهای چرخهٔ عمر نشست
- `before_compaction` / `after_compaction` — مشاهده یا حاشیه‌نویسی چرخه‌های Compaction
- `before_reset` — مشاهدهٔ رویدادهای بازنشانی نشست (`/reset`، بازنشانی‌های برنامه‌ای)

**زیرعامل‌ها**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — هماهنگی مسیریابی زیرعامل و تحویل تکمیل

**چرخهٔ عمر**

- `gateway_start` / `gateway_stop` — شروع یا توقف سرویس‌های متعلق به Plugin همراه با Gateway
- `cron_changed` — مشاهدهٔ تغییرات چرخهٔ عمر Cron متعلق به Gateway (افزوده‌شده، به‌روزرسانی‌شده، حذف‌شده، شروع‌شده، پایان‌یافته، زمان‌بندی‌شده)
- **`before_install`** — بررسی اسکن‌های نصب Skills یا Plugin و در صورت نیاز مسدود کردن

## سیاست فراخوانی ابزار

`before_tool_call` این موارد را دریافت می‌کند:

- `event.toolName`
- `event.params`
- `event.runId` اختیاری
- `event.toolCallId` اختیاری
- فیلدهای زمینه مانند `ctx.agentId`، `ctx.sessionKey`، `ctx.sessionId`، `ctx.runId`، `ctx.jobId` (در اجراهای مبتنی بر Cron تنظیم می‌شود)، و `ctx.trace` تشخیصی

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
- `requireApproval` اجرای عامل را مکث می‌کند و از طریق تأییدهای Plugin از کاربر می‌پرسد. فرمان `/approve` می‌تواند هم تأییدهای exec و هم تأییدهای Plugin را تأیید کند.
- یک `block: true` با اولویت پایین‌تر همچنان می‌تواند پس از اینکه یک هوک با اولویت بالاتر درخواست تأیید کرده است مسدود کند.
- `onResolution` تصمیم تأیید حل‌شده را دریافت می‌کند — `allow-once`، `allow-always`، `deny`، `timeout`، یا `cancelled`.

Pluginهای همراه که به سیاست سطح میزبان نیاز دارند می‌توانند سیاست‌های ابزار مورد اعتماد را با `api.registerTrustedToolPolicy(...)` ثبت کنند. این‌ها پیش از هوک‌های معمولی `before_tool_call` و پیش از تصمیم‌های Pluginهای خارجی اجرا می‌شوند. از آن‌ها فقط برای دروازه‌های مورد اعتماد میزبان مانند سیاست فضای کاری، اعمال بودجه، یا ایمنی گردش‌کارهای رزروشده استفاده کنید. Pluginهای خارجی باید از هوک‌های عادی `before_tool_call` استفاده کنند.

### ماندگارسازی نتیجهٔ ابزار

نتایج ابزار می‌توانند شامل `details` ساختاریافته برای رندر UI، تشخیص، مسیریابی رسانه، یا فرادادهٔ متعلق به Plugin باشند. با `details` به‌عنوان فرادادهٔ زمان اجرا رفتار کنید، نه محتوای پرامپت:

- OpenClaw پیش از بازپخش ارائه‌دهنده و ورودی Compaction، `toolResult.details` را حذف می‌کند تا فراداده به زمینهٔ مدل تبدیل نشود.
- ورودی‌های نشست ماندگارشده فقط `details` محدود را نگه می‌دارند. جزئیات بیش‌ازحد بزرگ با یک خلاصهٔ فشرده و `persistedDetailsTruncated: true` جایگزین می‌شوند.
- `tool_result_persist` و `before_message_write` پیش از سقف نهایی ماندگارسازی اجرا می‌شوند. هوک‌ها همچنان باید `details` برگشتی را کوچک نگه دارند و از قرار دادن متن مرتبط با پرامپت فقط در `details` پرهیز کنند؛ خروجی ابزار قابل مشاهده برای مدل را در `content` قرار دهید.

## هوک‌های پرامپت و مدل

برای Pluginهای جدید از هوک‌های مختص فاز استفاده کنید:

- `before_model_resolve`: فقط پرامپت فعلی و فرادادهٔ پیوست را دریافت می‌کند. `providerOverride` یا `modelOverride` را برگردانید.
- `agent_turn_prepare`: پرامپت فعلی، پیام‌های نشست آماده‌شده، و هر تزریق صف‌شدهٔ دقیقاً یک‌بار مصرف‌شده برای این نشست را دریافت می‌کند. `prependContext` یا `appendContext` را برگردانید.
- `before_prompt_build`: پرامپت فعلی و پیام‌های نشست را دریافت می‌کند. `prependContext`، `appendContext`، `systemPrompt`، `prependSystemContext`، یا `appendSystemContext` را برگردانید.
- `heartbeat_prompt_contribution`: فقط برای نوبت‌های Heartbeat اجرا می‌شود و `prependContext` یا `appendContext` را برمی‌گرداند. برای پایشگرهای پس‌زمینه‌ای در نظر گرفته شده است که باید وضعیت فعلی را بدون تغییر دادن نوبت‌های آغازشده توسط کاربر خلاصه کنند.

`before_agent_start` برای سازگاری باقی مانده است. هوک‌های صریح بالا را ترجیح دهید تا Plugin شما به یک فاز ترکیبی قدیمی وابسته نباشد.

`before_agent_start` و `agent_end` وقتی OpenClaw بتواند اجرای فعال را شناسایی کند، شامل `event.runId` هستند. همان مقدار روی `ctx.runId` نیز در دسترس است. اجراهای مبتنی بر Cron همچنین `ctx.jobId` (شناسهٔ کار Cron مبدأ) را نمایش می‌دهند تا هوک‌های Plugin بتوانند معیارها، اثرات جانبی، یا وضعیت را به یک کار زمان‌بندی‌شدهٔ مشخص محدود کنند.

برای اجراهای منشأگرفته از کانال، `ctx.messageProvider` سطح ارائه‌دهنده مانند `discord` یا `telegram` است، درحالی‌که `ctx.channelId` شناسهٔ هدف مکالمه است، وقتی OpenClaw بتواند آن را از کلید نشست یا فرادادهٔ تحویل استخراج کند.

`agent_end` یک هوک مشاهده است و پس از نوبت به‌صورت fire-and-forget اجرا می‌شود. اجراکنندهٔ هوک یک زمان‌سنج 30 ثانیه‌ای اعمال می‌کند تا یک Plugin گیرکرده یا endpoint جاسازی نتواند promise هوک را برای همیشه معلق بگذارد. زمان‌سنج در لاگ ثبت می‌شود و OpenClaw ادامه می‌دهد؛ این کار عملیات شبکهٔ متعلق به Plugin را لغو نمی‌کند مگر اینکه خود Plugin نیز از سیگنال لغو خودش استفاده کند.

برای تله‌متری فراخوانی ارائه‌دهنده که نباید پرامپت‌های خام، تاریخچه، پاسخ‌ها، سرآیندها، بدنه‌های درخواست، یا شناسه‌های درخواست ارائه‌دهنده را دریافت کند، از `model_call_started` و `model_call_ended` استفاده کنید. این هوک‌ها شامل فرادادهٔ پایدار مانند `runId`، `callId`، `provider`، `model`، `api`/`transport` اختیاری، `durationMs`/`outcome` پایانی، و `upstreamRequestIdHash` هستند وقتی OpenClaw بتواند یک هش محدود از شناسهٔ درخواست ارائه‌دهنده استخراج کند.

`before_agent_finalize` فقط وقتی اجرا می‌شود که یک harness در آستانهٔ پذیرش پاسخ نهایی طبیعی دستیار باشد. این مسیر لغو `/stop` نیست و وقتی کاربر یک نوبت را لغو می‌کند اجرا نمی‌شود. برای درخواست یک گذر دیگر مدل پیش از نهایی‌سازی، `{ action: "revise", reason }` را برگردانید؛ برای اجبار نهایی‌سازی، `{ action:
"finalize", reason? }` را برگردانید؛ یا برای ادامه، نتیجه‌ای حذف کنید. هوک‌های native `Stop` در Codex به‌عنوان تصمیم‌های `before_agent_finalize` در OpenClaw به این هوک منتقل می‌شوند.

هنگام برگرداندن `action: "revise"`، Pluginها می‌توانند فرادادهٔ `retry` را اضافه کنند تا گذر اضافی مدل محدود و برای بازپخش ایمن باشد:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` به دلیل بازبینی ارسال‌شده به harness افزوده می‌شود. `idempotencyKey` به میزبان اجازه می‌دهد تلاش‌های دوباره را برای همان درخواست Plugin در تصمیم‌های نهایی‌سازی معادل بشمارد، و `maxAttempts` سقف تعداد گذرهای اضافی را تعیین می‌کند که میزبان پیش از ادامه با پاسخ نهایی طبیعی اجازه خواهد داد.

Pluginهای غیرهمراه که به `llm_input`، `llm_output`، `before_agent_finalize`، یا `agent_end` نیاز دارند باید این را تنظیم کنند:

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

هوک‌های تغییردهندهٔ پرامپت و تزریق‌های بادوام نوبت بعدی را می‌توان برای هر Plugin با `plugins.entries.<id>.hooks.allowPromptInjection=false` غیرفعال کرد.

### افزونه‌های نشست و تزریق‌های نوبت بعدی

Pluginهای گردش کار می‌توانند وضعیت نشست کوچکِ سازگار با JSON را با
`api.registerSessionExtension(...)` پایدار کنند و آن را از طریق متد
`sessions.pluginPatch` در Gateway به‌روزرسانی کنند. ردیف‌های نشست، وضعیت افزونهٔ ثبت‌شده را
از طریق `pluginExtensions` نمایش می‌دهند و به رابط کاربری کنترل و دیگر کلاینت‌ها اجازه می‌دهند
وضعیت متعلق به Plugin را بدون دانستن جزئیات داخلی Plugin رندر کنند.

وقتی یک Plugin نیاز دارد زمینهٔ پایدار دقیقاً یک‌بار به نوبت بعدی مدل برسد، از
`api.enqueueNextTurnInjection(...)` استفاده کنید. OpenClaw تزریق‌های صف‌شده را پیش از
قلاب‌های پرامپت تخلیه می‌کند، تزریق‌های منقضی‌شده را حذف می‌کند، و بر اساس `idempotencyKey`
برای هر Plugin موارد تکراری را حذف می‌کند. این درز مناسب برای ادامهٔ تاییدها، خلاصه‌های سیاست،
دلتاهای پایشگر پس‌زمینه، و ادامه‌های دستور است که باید در نوبت بعدی برای مدل قابل مشاهده باشند
اما نباید به متن دائمی پرامپت سیستم تبدیل شوند.

معناشناسی پاک‌سازی بخشی از قرارداد است. پاک‌سازی افزونهٔ نشست و
کالبک‌های پاک‌سازی چرخهٔ عمر زمان اجرا، `reset`، `delete`، `disable`، یا
`restart` را دریافت می‌کنند. میزبان، وضعیت پایدار افزونهٔ نشست متعلق به Plugin و
تزریق‌های معلق نوبت بعدی را برای reset/delete/disable حذف می‌کند؛ restart
وضعیت پایدار نشست را نگه می‌دارد، در حالی که کالبک‌های پاک‌سازی به Pluginها اجازه می‌دهند
کارهای زمان‌بند، زمینهٔ اجرا، و دیگر منابع خارج از باند را برای نسل قدیمی زمان اجرا آزاد کنند.

## قلاب‌های پیام

از قلاب‌های پیام برای مسیریابی و سیاست تحویل در سطح کانال استفاده کنید:

- `message_received`: محتوای ورودی، فرستنده، `threadId`، `messageId`،
  `senderId`، همبستگی اختیاری اجرا/نشست، و فراداده را مشاهده کنید.
- `message_sending`: `content` را بازنویسی کنید یا `{ cancel: true }` برگردانید.
- `message_sent`: موفقیت یا شکست نهایی را مشاهده کنید.

برای پاسخ‌های TTS فقط صوتی، `content` ممکن است شامل رونوشت گفتاری پنهان باشد
حتی وقتی payload کانال متن/زیرنویس قابل مشاهده‌ای ندارد. بازنویسی آن
`content` فقط رونوشت قابل مشاهده برای قلاب را به‌روزرسانی می‌کند؛ به‌عنوان
زیرنویس رسانه رندر نمی‌شود.

زمینه‌های قلاب پیام، وقتی در دسترس باشند، فیلدهای همبستگی پایدار را ارائه می‌کنند:
`ctx.sessionKey`، `ctx.runId`، `ctx.messageId`، `ctx.senderId`، `ctx.trace`،
`ctx.traceId`، `ctx.spanId`، `ctx.parentSpanId`، و `ctx.callDepth`. پیش از خواندن
فرادادهٔ قدیمی، این فیلدهای درجه‌اول را ترجیح دهید.

پیش از استفاده از فرادادهٔ اختصاصی کانال، فیلدهای تایپ‌شدهٔ `threadId` و `replyToId` را ترجیح دهید.

قواعد تصمیم‌گیری:

- `message_sending` با `cancel: true` نهایی است.
- `message_sending` با `cancel: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `content` بازنویسی‌شده به قلاب‌های با اولویت پایین‌تر ادامه می‌دهد، مگر اینکه قلابی بعدی تحویل را لغو کند.

## قلاب‌های نصب

`before_install` پس از اسکن داخلی برای نصب‌های skill و Plugin اجرا می‌شود.
برای توقف نصب، یافته‌های اضافی یا `{ block: true, blockReason }` را برگردانید.

`block: true` نهایی است. `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.

## چرخهٔ عمر Gateway

برای سرویس‌های Plugin که به وضعیت متعلق به Gateway نیاز دارند، از `gateway_start` استفاده کنید. زمینه،
`ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` را برای بازرسی و به‌روزرسانی Cron
ارائه می‌کند. برای پاک‌سازی منابع طولانی‌مدت از `gateway_stop` استفاده کنید.

برای سرویس‌های زمان اجرای متعلق به Plugin به قلاب داخلی `gateway:startup` متکی نباشید.

`cron_changed` برای رویدادهای چرخهٔ عمر Cron متعلق به gateway با payload رویداد تایپ‌شده
فعال می‌شود که دلایل `added`، `updated`، `removed`، `started`، `finished`،
و `scheduled` را پوشش می‌دهد. رویداد، یک snapshot از `PluginHookGatewayCronJob`
(شامل `state.nextRunAtMs`، `state.lastRunStatus`، و
`state.lastError` در صورت وجود) به‌همراه یک `PluginHookGatewayCronDeliveryStatus`
از `not-requested` | `delivered` | `not-delivered` | `unknown` حمل می‌کند. رویدادهای حذف‌شده
همچنان snapshot کار حذف‌شده را حمل می‌کنند تا زمان‌بندهای خارجی بتوانند
وضعیت را سازگار کنند. هنگام همگام‌سازی زمان‌بندهای بیدارسازی خارجی، از `ctx.getCron?.()` و
`ctx.config` در زمینهٔ زمان اجرا استفاده کنید، و OpenClaw را
منبع حقیقت برای بررسی‌های موعددار و اجرا نگه دارید.

## منسوخ‌سازی‌های آینده

چند سطح مجاور قلاب منسوخ شده‌اند اما همچنان پشتیبانی می‌شوند. پیش از انتشار اصلی بعدی مهاجرت کنید:

- **envelopeهای کانال متن ساده** در handlerهای `inbound_claim` و `message_received`.
  به‌جای parse کردن متن تخت envelope، `BodyForAgent` و بلوک‌های ساختاریافتهٔ زمینهٔ کاربر
  را بخوانید. ببینید
  [envelopeهای کانال متن ساده → BodyForAgent](/fa/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** برای سازگاری باقی مانده است. Pluginهای جدید باید به‌جای فاز
  ترکیبی، از `before_model_resolve` و `before_prompt_build` استفاده کنند.
- **`onResolution` در `before_tool_call`** اکنون به‌جای یک `string` آزاد،
  از union تایپ‌شدهٔ `PluginApprovalResolution` استفاده می‌کند
  (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`).

برای فهرست کامل، شامل ثبت قابلیت حافظه، پروفایل تفکر ارائه‌دهنده،
ارائه‌دهندگان احراز هویت خارجی، انواع کشف ارائه‌دهنده، accessorهای زمان اجرای وظیفه،
و تغییر نام `command-auth` → `command-status`، ببینید
[مهاجرت Plugin SDK → منسوخ‌سازی‌های فعال](/fa/plugins/sdk-migration#active-deprecations).

## مرتبط

- [مهاجرت Plugin SDK](/fa/plugins/sdk-migration) — منسوخ‌سازی‌های فعال و جدول زمانی حذف
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [قلاب‌های داخلی](/fa/automation/hooks)
- [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals)
