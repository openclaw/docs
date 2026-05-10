---
read_when:
    - شما در حال ساخت یک Plugin هستید که به before_tool_call، before_agent_reply، هوک‌های پیام یا هوک‌های چرخه حیات نیاز دارد
    - باید فراخوانی‌های ابزار از یک Plugin را مسدود یا بازنویسی کنید، یا آن‌ها را منوط به تأیید کنید
    - در حال تصمیم‌گیری بین هوک‌های داخلی و هوک‌های Plugin هستید
summary: 'هوک‌های Plugin: رهگیری رویدادهای چرخهٔ حیات عامل، ابزار، پیام، نشست و Gateway'
title: هوک‌های Plugin
x-i18n:
    generated_at: "2026-05-10T19:54:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

هوک‌های Plugin نقاط توسعهٔ درون‌فرآیندی برای Pluginهای OpenClaw هستند. از آن‌ها زمانی استفاده کنید که یک Plugin باید اجرای عامل، فراخوانی ابزارها، جریان پیام، چرخهٔ عمر نشست، مسیریابی زیرعامل، نصب‌ها یا راه‌اندازی Gateway را بررسی یا تغییر دهد.

در عوض، زمانی از [هوک‌های داخلی](/fa/automation/hooks) استفاده کنید که یک اسکریپت کوچک `HOOK.md` نصب‌شده توسط اپراتور برای رویدادهای فرمان و Gateway مانند `/new`، `/reset`، `/stop`، `agent:bootstrap` یا `gateway:startup` می‌خواهید.

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

هندلرهای هوک به‌ترتیب و بر اساس `priority` نزولی اجرا می‌شوند. هوک‌هایی با اولویت یکسان ترتیب ثبت را حفظ می‌کنند.

`api.on(name, handler, opts?)` این موارد را می‌پذیرد:

- `priority` - ترتیب هندلر؛ مقدار بالاتر زودتر اجرا می‌شود.
- `timeoutMs` - بودجهٔ اختیاری برای هر هوک. وقتی تنظیم شود، اجراکنندهٔ هوک پس از پایان این بودجه، آن هندلر را متوقف می‌کند و به‌جای اینکه اجازه دهد راه‌اندازی کند یا کار بازیابی، مهلت مدل پیکربندی‌شدهٔ فراخوان را مصرف کند، با مورد بعدی ادامه می‌دهد. آن را حذف کنید تا از مهلت پیش‌فرض مشاهده/تصمیم استفاده شود که اجراکنندهٔ هوک به‌صورت عمومی اعمال می‌کند.

اپراتورها همچنین می‌توانند بدون وصله کردن کد Plugin، بودجهٔ هوک‌ها را تنظیم کنند:

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

`hooks.timeouts.<hookName>` مقدار `hooks.timeoutMs` را بازنویسی می‌کند، و آن هم مقدار نوشته‌شده توسط Plugin در `api.on(..., { timeoutMs })` را بازنویسی می‌کند. هر مقدار پیکربندی‌شده باید یک عدد صحیح مثبت و حداکثر 600000 میلی‌ثانیه باشد. برای هوک‌های کند شناخته‌شده، بازنویسی‌های مخصوص هر هوک را ترجیح دهید تا یک Plugin در همه‌جا بودجهٔ طولانی‌تری نگیرد.

هر هوک `event.context.pluginConfig` را دریافت می‌کند؛ یعنی پیکربندی حل‌شده برای Pluginی که آن هندلر را ثبت کرده است. از آن برای تصمیم‌های هوک استفاده کنید که به گزینه‌های فعلی Plugin نیاز دارند؛ OpenClaw آن را برای هر هندلر تزریق می‌کند، بدون اینکه شیء رویداد مشترک دیده‌شده توسط Pluginهای دیگر را تغییر دهد.

## فهرست هوک‌ها

هوک‌ها بر اساس سطحی که توسعه می‌دهند گروه‌بندی شده‌اند. نام‌های **پررنگ** نتیجهٔ تصمیم را می‌پذیرند؛ یعنی مسدودسازی، لغو، بازنویسی یا درخواست تأیید. همهٔ موارد دیگر فقط برای مشاهده هستند.

**نوبت عامل**

- `before_model_resolve` - بازنویسی ارائه‌دهنده یا مدل پیش از بارگیری پیام‌های نشست
- `agent_turn_prepare` - مصرف تزریق‌های نوبت Plugin در صف و افزودن زمینهٔ همان نوبت پیش از هوک‌های پرامپت
- `before_prompt_build` - افزودن زمینهٔ پویا یا متن پرامپت سیستمی پیش از فراخوانی مدل
- `before_agent_start` - فاز ترکیبی فقط برای سازگاری؛ دو هوک بالا را ترجیح دهید
- **`before_agent_run`** - بررسی پرامپت نهایی و پیام‌های نشست پیش از ارسال به مدل و در صورت نیاز مسدود کردن اجرا
- **`before_agent_reply`** - کوتاه کردن نوبت مدل با یک پاسخ مصنوعی یا سکوت
- **`before_agent_finalize`** - بررسی پاسخ نهایی طبیعی و درخواست یک گذر دیگر از مدل
- `agent_end` - مشاهدهٔ پیام‌های نهایی، وضعیت موفقیت و مدت اجرا
- `heartbeat_prompt_contribution` - افزودن زمینهٔ فقط Heartbeat برای مانیتور پس‌زمینه و Pluginهای چرخهٔ عمر

**مشاهدهٔ گفتگو**

- `model_call_started` / `model_call_ended` - مشاهدهٔ فرادادهٔ پاک‌سازی‌شدهٔ فراخوانی ارائه‌دهنده/مدل، زمان‌بندی، نتیجه و هش‌های محدود شناسهٔ درخواست بدون محتوای پرامپت یا پاسخ
- `llm_input` - مشاهدهٔ ورودی ارائه‌دهنده؛ شامل پرامپت سیستمی، پرامپت و تاریخچه
- `llm_output` - مشاهدهٔ خروجی ارائه‌دهنده

**ابزارها**

- **`before_tool_call`** - بازنویسی پارامترهای ابزار، مسدود کردن اجرا یا درخواست تأیید
- `after_tool_call` - مشاهدهٔ نتایج ابزار، خطاها و مدت
- **`tool_result_persist`** - بازنویسی پیام دستیار تولیدشده از نتیجهٔ ابزار
- **`before_message_write`** - بررسی یا مسدود کردن نوشتن پیام در حال انجام؛ موردی نادر

**پیام‌ها و تحویل**

- **`inbound_claim`** - ادعای مالکیت یک پیام ورودی پیش از مسیریابی عامل؛ پاسخ‌های مصنوعی
- `message_received` - مشاهدهٔ محتوای ورودی، فرستنده، رشته و فراداده
- **`message_sending`** - بازنویسی محتوای خروجی یا لغو تحویل
- `message_sent` - مشاهدهٔ موفقیت یا شکست تحویل خروجی
- **`before_dispatch`** - بررسی یا بازنویسی یک ارسال خروجی پیش از تحویل به کانال
- **`reply_dispatch`** - مشارکت در خط لولهٔ نهایی ارسال پاسخ

**نشست‌ها و Compaction**

- `session_start` / `session_end` - ردیابی مرزهای چرخهٔ عمر نشست
- `before_compaction` / `after_compaction` - مشاهده یا حاشیه‌نویسی چرخه‌های Compaction
- `before_reset` - مشاهدهٔ رویدادهای بازنشانی نشست؛ مانند `/reset` و بازنشانی‌های برنامه‌نویسی‌شده

**زیرعامل‌ها**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - هماهنگ‌سازی مسیریابی زیرعامل و تحویل تکمیل

**چرخهٔ عمر**

- `gateway_start` / `gateway_stop` - شروع یا توقف سرویس‌های مالکیت‌دار Plugin همراه با Gateway
- `cron_changed` - مشاهدهٔ تغییرات چرخهٔ عمر Cron تحت مالکیت Gateway؛ افزوده‌شده، به‌روزرسانی‌شده، حذف‌شده، شروع‌شده، پایان‌یافته، زمان‌بندی‌شده
- **`before_install`** - بررسی اسکن‌های نصب Skill یا Plugin و در صورت نیاز مسدود کردن

## سیاست فراخوانی ابزار

`before_tool_call` این موارد را دریافت می‌کند:

- `event.toolName`
- `event.params`
- `event.derivedPaths` اختیاری، شامل راهنمایی‌های best-effort مسیر هدف مشتق‌شده از میزبان برای پاکت‌های ابزار شناخته‌شده مانند `apply_patch`؛ در صورت وجود، این مسیرها ممکن است ناقص باشند یا بیش از حد تقریبی نشان دهند ابزار واقعاً چه چیزی را لمس خواهد کرد؛ برای مثال با ورودی‌های بدشکل یا جزئی
- `event.runId` اختیاری
- `event.toolCallId` اختیاری
- فیلدهای زمینه مانند `ctx.agentId`، `ctx.sessionKey`، `ctx.sessionId`، `ctx.runId`، `ctx.jobId` (در اجراهای هدایت‌شده با Cron تنظیم می‌شود) و `ctx.trace` تشخیصی

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

- `block: true` نهایی است و هندلرهای با اولویت پایین‌تر را رد می‌کند.
- `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `params` پارامترهای ابزار را برای اجرا بازنویسی می‌کند.
- `requireApproval` اجرای عامل را متوقف می‌کند و از طریق تأییدهای Plugin از کاربر می‌پرسد. فرمان `/approve` می‌تواند هم تأییدهای exec و هم تأییدهای Plugin را تأیید کند.
- یک `block: true` با اولویت پایین‌تر همچنان می‌تواند پس از درخواست تأیید توسط یک هوک با اولویت بالاتر، مسدود کند.
- `onResolution` تصمیم تأیید حل‌شده را دریافت می‌کند: `allow-once`، `allow-always`، `deny`، `timeout` یا `cancelled`.

Pluginهای همراه که به سیاست سطح میزبان نیاز دارند می‌توانند سیاست‌های ابزار مورد اعتماد را با `api.registerTrustedToolPolicy(...)` ثبت کنند. این‌ها پیش از هوک‌های عادی `before_tool_call` و پیش از تصمیم‌های Plugin خارجی اجرا می‌شوند. آن‌ها را فقط برای دروازه‌های مورد اعتماد میزبان مانند سیاست workspace، اجرای بودجه یا ایمنی جریان کاری رزرو‌شده استفاده کنید. Pluginهای خارجی باید از هوک‌های معمولی `before_tool_call` استفاده کنند.

### ماندگار کردن نتیجهٔ ابزار

نتایج ابزار می‌توانند شامل `details` ساختاریافته برای رندر UI، تشخیص، مسیریابی رسانه یا فرادادهٔ مالکیت‌دار Plugin باشند. با `details` به‌عنوان فرادادهٔ زمان اجرا رفتار کنید، نه محتوای پرامپت:

- OpenClaw پیش از بازپخش ارائه‌دهنده و ورودی Compaction، `toolResult.details` را حذف می‌کند تا فراداده به زمینهٔ مدل تبدیل نشود.
- ورودی‌های نشست ماندگارشده فقط `details` محدود را نگه می‌دارند. جزئیات بیش از حد بزرگ با یک خلاصهٔ فشرده و `persistedDetailsTruncated: true` جایگزین می‌شوند.
- `tool_result_persist` و `before_message_write` پیش از سقف نهایی ماندگاری اجرا می‌شوند. هوک‌ها همچنان باید `details` برگشتی را کوچک نگه دارند و از قرار دادن متن مرتبط با پرامپت فقط در `details` خودداری کنند؛ خروجی ابزار قابل مشاهده برای مدل را در `content` قرار دهید.

## هوک‌های پرامپت و مدل

برای Pluginهای جدید از هوک‌های مخصوص هر فاز استفاده کنید:

- `before_model_resolve`: فقط پرامپت فعلی و فرادادهٔ پیوست را دریافت می‌کند. `providerOverride` یا `modelOverride` را برگردانید.
- `agent_turn_prepare`: پرامپت فعلی، پیام‌های آماده‌شدهٔ نشست و هر تزریق دقیقاً یک‌بارهٔ صف‌شدهٔ تخلیه‌شده برای این نشست را دریافت می‌کند. `prependContext` یا `appendContext` را برگردانید.
- `before_prompt_build`: پرامپت فعلی و پیام‌های نشست را دریافت می‌کند. `prependContext`، `appendContext`، `systemPrompt`، `prependSystemContext` یا `appendSystemContext` را برگردانید.
- `heartbeat_prompt_contribution`: فقط برای نوبت‌های Heartbeat اجرا می‌شود و `prependContext` یا `appendContext` را برمی‌گرداند. این برای مانیتورهای پس‌زمینه‌ای در نظر گرفته شده است که باید وضعیت فعلی را بدون تغییر دادن نوبت‌های آغازشده توسط کاربر خلاصه کنند.

`before_agent_start` برای سازگاری باقی می‌ماند. هوک‌های صریح بالا را ترجیح دهید تا Plugin شما به یک فاز ترکیبی قدیمی وابسته نباشد.

`before_agent_run` پس از ساخت پرامپت و پیش از هر ورودی مدل اجرا می‌شود، از جمله بارگیری تصویر محلیِ پرامپت و مشاهدهٔ `llm_input`. ورودی فعلی کاربر را به‌صورت `prompt`، به‌همراه تاریخچهٔ نشست بارگیری‌شده در `messages` و پرامپت سیستمی فعال دریافت می‌کند. برای توقف اجرا پیش از اینکه مدل بتواند پرامپت را بخواند، `{ outcome: "block", reason, message? }` را برگردانید. `reason` داخلی است؛ `message` جایگزین قابل مشاهده برای کاربر است. تنها نتایج پشتیبانی‌شده `pass` و `block` هستند؛ شکل‌های تصمیم پشتیبانی‌نشده به‌صورت بسته شکست می‌خورند.

وقتی یک اجرا مسدود می‌شود، OpenClaw فقط متن جایگزین را در `message.content` به‌همراه فرادادهٔ غیرحساس مسدودسازی مانند شناسهٔ Plugin مسدودکننده و زمان‌مهر ذخیره می‌کند. متن اصلی کاربر در رونوشت یا زمینهٔ آینده نگه داشته نمی‌شود. دلایل داخلی مسدودسازی حساس تلقی می‌شوند و از بارهای رونوشت، تاریخچه، پخش، گزارش و تشخیص حذف می‌شوند. مشاهده‌پذیری باید از فیلدهای پاک‌سازی‌شده مانند شناسهٔ مسدودکننده، نتیجه، زمان‌مهر یا یک دستهٔ امن استفاده کند.

`before_agent_start` و `agent_end` وقتی OpenClaw بتواند اجرای فعال را شناسایی کند، شامل `event.runId` هستند. همان مقدار در `ctx.runId` نیز در دسترس است. اجراهای هدایت‌شده با Cron همچنین `ctx.jobId` (شناسهٔ کار Cron مبدأ) را در معرض قرار می‌دهند تا هوک‌های Plugin بتوانند معیارها، عوارض جانبی یا وضعیت را به یک کار زمان‌بندی‌شدهٔ مشخص محدود کنند.

برای اجراهای منشأگرفته از کانال، `ctx.messageProvider` سطح ارائه‌دهنده مانند `discord` یا `telegram` است، در حالی که `ctx.channelId` شناسهٔ هدف گفتگو است، زمانی که OpenClaw بتواند آن را از کلید نشست یا فرادادهٔ تحویل استخراج کند.

`agent_end` یک هوک مشاهده است و پس از نوبت به‌صورت fire-and-forget اجرا می‌شود. اجراکنندهٔ هوک یک مهلت 30 ثانیه‌ای اعمال می‌کند تا یک Plugin گیرکرده یا endpoint تعبیه‌سازی نتواند promise هوک را برای همیشه معلق بگذارد. timeout ثبت می‌شود و OpenClaw ادامه می‌دهد؛ کار شبکه‌ای مالکیت‌دار Plugin را لغو نمی‌کند مگر اینکه خود Plugin نیز از سیگنال abort خود استفاده کند.

برای تله‌متری فراخوانی ارائه‌دهنده که نباید پرامپت‌های خام، تاریخچه، پاسخ‌ها، headerها، بدنه‌های درخواست یا شناسه‌های درخواست ارائه‌دهنده را دریافت کند، از `model_call_started` و `model_call_ended` استفاده کنید. این هوک‌ها شامل فرادادهٔ پایدار مانند `runId`، `callId`، `provider`، `model`، `api`/`transport` اختیاری، `durationMs`/`outcome` پایانی، و `upstreamRequestIdHash` هستند، زمانی که OpenClaw بتواند یک هش محدود از شناسهٔ درخواست ارائه‌دهنده استخراج کند.

`before_agent_finalize` فقط زمانی اجرا می‌شود که یک harness در آستانه پذیرش پاسخ نهایی طبیعی assistant باشد. این مسیر لغو `/stop` نیست و وقتی کاربر یک نوبت را abort می‌کند اجرا نمی‌شود. برای درخواست یک گذر دیگر مدل از harness پیش از نهایی‌سازی، `{ action: "revise", reason }` را برگردانید؛ برای اجبار به نهایی‌سازی، `{ action:
"finalize", reason? }` را برگردانید؛ یا برای ادامه، نتیجه‌ای را حذف کنید. hookهای بومی `Stop` در Codex به‌صورت تصمیم‌های `before_agent_finalize` در OpenClaw به این hook منتقل می‌شوند.

هنگام برگرداندن `action: "revise"`، Pluginها می‌توانند metadata مربوط به `retry` را اضافه کنند تا گذر اضافی مدل محدود و برای بازپخش ایمن باشد:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` به دلیل بازبینی ارسال‌شده به harness افزوده می‌شود. `idempotencyKey` به میزبان اجازه می‌دهد تلاش‌های مجدد برای همان درخواست Plugin را در میان تصمیم‌های نهایی‌سازی معادل بشمارد، و `maxAttempts` تعداد گذرهای اضافی‌ای را که میزبان پیش از ادامه با پاسخ نهایی طبیعی مجاز می‌داند محدود می‌کند.

Pluginهای غیرهمراهی که به hookهای خام مکالمه (`before_model_resolve`، `before_agent_reply`، `llm_input`، `llm_output`، `before_agent_finalize`، `agent_end`، یا `before_agent_run`) نیاز دارند باید این مقدار را تنظیم کنند:

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

hookهای تغییردهنده prompt و تزریق‌های پایدار نوبت بعدی را می‌توان برای هر Plugin با `plugins.entries.<id>.hooks.allowPromptInjection=false` غیرفعال کرد.

### افزونه‌های جلسه و تزریق‌های نوبت بعدی

Pluginهای گردش‌کار می‌توانند state کوچک و سازگار با JSON جلسه را با `api.registerSessionExtension(...)` پایدار کنند و آن را از طریق متد `sessions.pluginPatch` در Gateway به‌روزرسانی کنند. ردیف‌های جلسه state ثبت‌شده افزونه را از طریق `pluginExtensions` ارائه می‌کنند و به Control UI و سایر کلاینت‌ها اجازه می‌دهند وضعیت متعلق به Plugin را بدون آگاهی از جزئیات داخلی Plugin نمایش دهند.

وقتی یک Plugin به context پایداری نیاز دارد که دقیقاً یک‌بار به نوبت بعدی مدل برسد، از `api.enqueueNextTurnInjection(...)` استفاده کنید. OpenClaw تزریق‌های صف‌شده را پیش از hookهای prompt تخلیه می‌کند، تزریق‌های منقضی‌شده را حذف می‌کند، و به‌ازای هر Plugin بر اساس `idempotencyKey` موارد تکراری را حذف می‌کند. این seam درست برای ازسرگیری‌های تأیید، خلاصه‌های policy، deltaهای مانیتور پس‌زمینه، و ادامه‌های command است که باید در نوبت بعدی برای مدل قابل مشاهده باشند، اما نباید به متن دائمی system prompt تبدیل شوند.

معناشناسی پاک‌سازی بخشی از قرارداد است. callbackهای پاک‌سازی افزونه جلسه و پاک‌سازی چرخه‌عمر runtime مقدارهای `reset`، `delete`، `disable`، یا `restart` را دریافت می‌کنند. میزبان برای reset/delete/disable، state پایدار افزونه جلسه و تزریق‌های معلق نوبت بعدی مربوط به Plugin مالک را حذف می‌کند؛ restart state پایدار جلسه را نگه می‌دارد، در حالی که callbackهای پاک‌سازی به Pluginها اجازه می‌دهند jobهای زمان‌بند، context اجرا، و سایر منابع خارج از باند مربوط به نسل runtime قبلی را آزاد کنند.

## hookهای پیام

از hookهای پیام برای مسیریابی سطح کانال و policy تحویل استفاده کنید:

- `message_received`: محتوای ورودی، فرستنده، `threadId`، `messageId`، `senderId`، همبستگی اختیاری run/session، و metadata را مشاهده کنید.
- `message_sending`: `content` را بازنویسی کنید یا `{ cancel: true }` را برگردانید.
- `message_sent`: موفقیت یا شکست نهایی را مشاهده کنید.

برای پاسخ‌های TTS فقط صوتی، `content` ممکن است transcript گفتاری پنهان را در خود داشته باشد، حتی زمانی که payload کانال هیچ متن/کپشن قابل مشاهده‌ای ندارد. بازنویسی آن `content` فقط transcript قابل مشاهده برای hook را به‌روزرسانی می‌کند؛ این محتوا به‌عنوان کپشن رسانه رندر نمی‌شود.

contextهای hook پیام، وقتی در دسترس باشند، فیلدهای همبستگی پایدار را آشکار می‌کنند: `ctx.sessionKey`، `ctx.runId`، `ctx.messageId`، `ctx.senderId`، `ctx.trace`، `ctx.traceId`، `ctx.spanId`، `ctx.parentSpanId`، و `ctx.callDepth`. پیش از خواندن metadata قدیمی، این فیلدهای درجه‌اول را ترجیح دهید.

پیش از استفاده از metadata ویژه کانال، فیلدهای typed یعنی `threadId` و `replyToId` را ترجیح دهید.

قواعد تصمیم:

- `message_sending` با `cancel: true` نهایی است.
- `message_sending` با `cancel: false` به‌عنوان نبود تصمیم تلقی می‌شود.
- `content` بازنویسی‌شده به hookهای با اولویت پایین‌تر ادامه می‌دهد مگر اینکه hook بعدی تحویل را لغو کند.
- `message_sending` می‌تواند همراه با لغو، `cancelReason` و `metadata` محدودشده برگرداند. APIهای جدید چرخه‌عمر پیام این را به‌عنوان نتیجه تحویل سرکوب‌شده با دلیل `cancelled_by_message_sending_hook` آشکار می‌کنند؛ تحویل مستقیم قدیمی برای سازگاری همچنان یک آرایه نتیجه خالی برمی‌گرداند.
- `message_sent` فقط برای مشاهده است. شکست‌های handler لاگ می‌شوند و نتیجه تحویل را تغییر نمی‌دهند.

## hookهای نصب

`before_install` پس از اسکن داخلی برای نصب Skills و Plugin اجرا می‌شود. یافته‌های اضافی یا `{ block: true, blockReason }` را برای توقف نصب برگردانید.

`block: true` نهایی است. `block: false` به‌عنوان نبود تصمیم تلقی می‌شود.

## چرخه‌عمر Gateway

برای سرویس‌های Plugin که به state متعلق به Gateway نیاز دارند از `gateway_start` استفاده کنید. context مقدارهای `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` را برای بازرسی و به‌روزرسانی‌های cron آشکار می‌کند. برای پاک‌سازی منابع بلندمدت از `gateway_stop` استفاده کنید.

برای سرویس‌های runtime متعلق به Plugin به hook داخلی `gateway:startup` تکیه نکنید.

`cron_changed` برای رویدادهای چرخه‌عمر cron متعلق به gateway با payload رویداد typed اجرا می‌شود که دلیل‌های `added`، `updated`، `removed`، `started`، `finished`، و `scheduled` را پوشش می‌دهد. این رویداد یک snapshot از `PluginHookGatewayCronJob` (شامل `state.nextRunAtMs`، `state.lastRunStatus`، و `state.lastError` در صورت وجود) به‌همراه یک `PluginHookGatewayCronDeliveryStatus` با مقدارهای `not-requested` | `delivered` | `not-delivered` | `unknown` حمل می‌کند. رویدادهای حذف‌شده همچنان snapshot کار حذف‌شده را حمل می‌کنند تا زمان‌بندهای خارجی بتوانند state را تطبیق دهند. هنگام همگام‌سازی زمان‌بندهای بیدارباش خارجی، از `ctx.getCron?.()` و `ctx.config` در context runtime استفاده کنید، و OpenClaw را منبع حقیقت برای بررسی‌های سررسید و اجرا نگه دارید.

## منسوخ‌سازی‌های پیش‌رو

چند surface نزدیک به hook منسوخ شده‌اند اما همچنان پشتیبانی می‌شوند. پیش از انتشار major بعدی مهاجرت کنید:

- **envelopeهای کانال plaintext** در handlerهای `inbound_claim` و `message_received`.
  به‌جای parse کردن متن envelope تخت، `BodyForAgent` و بلوک‌های ساختاریافته user-context را بخوانید. ببینید:
  [envelopeهای کانال plaintext → BodyForAgent](/fa/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** برای سازگاری باقی می‌ماند. Pluginهای جدید باید به‌جای فاز ترکیبی، از `before_model_resolve` و `before_prompt_build` استفاده کنند.
- **`onResolution` در `before_tool_call`** اکنون به‌جای `string` آزاد، از union تایپ‌شده `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) استفاده می‌کند.

برای فهرست کامل، شامل ثبت capability حافظه، profile تفکر provider، providerهای احراز هویت خارجی، typeهای کشف provider، accessorهای runtime کار، و تغییر نام `command-auth` به `command-status`، ببینید:
[مهاجرت Plugin SDK → منسوخ‌سازی‌های فعال](/fa/plugins/sdk-migration#active-deprecations).

## مرتبط

- [مهاجرت Plugin SDK](/fa/plugins/sdk-migration) - منسوخ‌سازی‌های فعال و زمان‌بندی حذف
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [hookهای داخلی](/fa/automation/hooks)
- [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals)
