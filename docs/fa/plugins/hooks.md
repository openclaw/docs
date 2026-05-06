---
read_when:
    - شما در حال ساخت یک Plugin هستید که به before_tool_call، before_agent_reply، قلاب‌های پیام یا قلاب‌های چرخهٔ حیات نیاز دارد
    - لازم است فراخوانی‌های ابزار از یک Plugin را مسدود یا بازنویسی کنید، یا تأیید آن‌ها را الزامی کنید
    - در حال تصمیم‌گیری بین هوک‌های داخلی و هوک‌های Plugin هستید
summary: 'هوک‌های Plugin: رویدادهای چرخهٔ عمر عامل، ابزار، پیام، نشست و Gateway را رهگیری می‌کنند'
title: هوک‌های Plugin
x-i18n:
    generated_at: "2026-05-06T09:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

هوک‌های Plugin نقاط گسترش درون‌فرایندی برای Pluginهای OpenClaw هستند. از آن‌ها
زمانی استفاده کنید که یک Plugin لازم دارد اجرای agent، فراخوانی‌های ابزار، جریان پیام،
چرخهٔ حیات session، مسیریابی subagent، نصب‌ها، یا راه‌اندازی Gateway را بررسی یا تغییر دهد.

به‌جای آن، وقتی یک اسکریپت کوچک `HOOK.md` نصب‌شده توسط اپراتور برای رویدادهای فرمان و Gateway مانند
`/new`، `/reset`، `/stop`، `agent:bootstrap`، یا `gateway:startup` می‌خواهید، از [هوک‌های داخلی](/fa/automation/hooks) استفاده کنید.

## شروع سریع

هوک‌های Plugin تایپ‌شده را با `api.on(...)` از ورودی Plugin خود ثبت کنید:

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

مدیریت‌کننده‌های هوک به‌ترتیب نزولی `priority` به‌صورت متوالی اجرا می‌شوند. هوک‌های با اولویت یکسان
ترتیب ثبت را حفظ می‌کنند.

`api.on(name, handler, opts?)` می‌پذیرد:

- `priority` - ترتیب مدیریت‌کننده‌ها (مقدار بالاتر زودتر اجرا می‌شود).
- `timeoutMs` - بودجهٔ اختیاری برای هر هوک. وقتی تنظیم شود، اجراکنندهٔ هوک پس از پایان بودجه آن
  مدیریت‌کننده را متوقف می‌کند و به مورد بعدی ادامه می‌دهد، به‌جای آنکه اجازه دهد راه‌اندازی کند یا کار فراخوانی کند
  timeout مدل پیکربندی‌شدهٔ فراخواننده را مصرف کند. برای استفاده از timeout پیش‌فرض مشاهده/تصمیم که
  اجراکنندهٔ هوک به‌صورت عمومی اعمال می‌کند، آن را حذف کنید.

اپراتورها همچنین می‌توانند بودجه‌های هوک را بدون patch کردن کد Plugin تنظیم کنند:

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

`hooks.timeouts.<hookName>` مقدار `hooks.timeoutMs` را override می‌کند، و آن نیز مقدار
`api.on(..., { timeoutMs })` نوشته‌شده توسط نویسندهٔ Plugin را override می‌کند. هر مقدار پیکربندی‌شده باید
یک عدد صحیح مثبت و حداکثر برابر با 600000 میلی‌ثانیه باشد. برای هوک‌های کند شناخته‌شده،
overrideهای مخصوص هر هوک را ترجیح دهید تا یک Plugin در همه‌جا بودجهٔ طولانی‌تری نگیرد.

هر هوک `event.context.pluginConfig` را دریافت می‌کند؛ پیکربندی resolve‌شده برای
Pluginی که آن مدیریت‌کننده را ثبت کرده است. برای تصمیم‌های هوکی که به گزینه‌های فعلی Plugin نیاز دارند
از آن استفاده کنید؛ OpenClaw آن را برای هر مدیریت‌کننده تزریق می‌کند بدون اینکه object رویداد مشترک دیده‌شده توسط Pluginهای دیگر را تغییر دهد.

## کاتالوگ هوک

هوک‌ها بر اساس سطحی که گسترش می‌دهند گروه‌بندی شده‌اند. نام‌های **پررنگ** نتیجهٔ تصمیم
(مسدود کردن، لغو، override، یا درخواست تأیید) را می‌پذیرند؛ همهٔ موارد دیگر فقط برای مشاهده هستند.

**نوبت Agent**

- `before_model_resolve` - provider یا model را پیش از بارگذاری پیام‌های session override می‌کند
- `agent_turn_prepare` - تزریق‌های نوبت Plugin صف‌شده را مصرف می‌کند و پیش از هوک‌های prompt، context همان نوبت را اضافه می‌کند
- `before_prompt_build` - پیش از فراخوانی model، context پویا یا متن system-prompt را اضافه می‌کند
- `before_agent_start` - فاز ترکیبی فقط برای سازگاری؛ دو هوک بالا را ترجیح دهید
- **`before_agent_reply`** - نوبت model را با یک پاسخ synthetic یا سکوت short-circuit می‌کند
- **`before_agent_finalize`** - پاسخ نهایی طبیعی را بررسی می‌کند و یک گذر دیگر model درخواست می‌کند
- `agent_end` - پیام‌های نهایی، وضعیت موفقیت، و مدت اجرای run را مشاهده می‌کند
- `heartbeat_prompt_contribution` - context مخصوص Heartbeat را برای monitor پس‌زمینه و Pluginهای چرخهٔ حیات اضافه می‌کند

**مشاهدهٔ مکالمه**

- `model_call_started` / `model_call_ended` - metadata پاک‌سازی‌شدهٔ فراخوانی provider/model، زمان‌بندی، نتیجه، و hashهای محدود request-id را بدون محتوای prompt یا response مشاهده می‌کند
- `llm_input` - ورودی provider را مشاهده می‌کند (system prompt، prompt، history)
- `llm_output` - خروجی provider را مشاهده می‌کند

**ابزارها**

- **`before_tool_call`** - params ابزار را بازنویسی می‌کند، اجرا را مسدود می‌کند، یا تأیید درخواست می‌کند
- `after_tool_call` - نتایج ابزار، خطاها، و مدت را مشاهده می‌کند
- **`tool_result_persist`** - پیام assistant تولیدشده از نتیجهٔ ابزار را بازنویسی می‌کند
- **`before_message_write`** - نوشتن پیام در حال انجام را بررسی یا مسدود می‌کند (نادر)

**پیام‌ها و تحویل**

- **`inbound_claim`** - یک پیام ورودی را پیش از مسیریابی agent claim می‌کند (پاسخ‌های synthetic)
- `message_received` - محتوای ورودی، فرستنده، thread، و metadata را مشاهده می‌کند
- **`message_sending`** - محتوای خروجی را بازنویسی می‌کند یا تحویل را لغو می‌کند
- `message_sent` - موفقیت یا شکست تحویل خروجی را مشاهده می‌کند
- **`before_dispatch`** - یک dispatch خروجی را پیش از تحویل به channel بررسی یا بازنویسی می‌کند
- **`reply_dispatch`** - در pipeline نهایی reply-dispatch مشارکت می‌کند

**Sessionها و Compaction**

- `session_start` / `session_end` - مرزهای چرخهٔ حیات session را ردیابی می‌کند
- `before_compaction` / `after_compaction` - چرخه‌های Compaction را مشاهده یا annotate می‌کند
- `before_reset` - رویدادهای reset کردن session را مشاهده می‌کند (`/reset`، resetهای برنامه‌ای)

**Subagentها**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - مسیریابی subagent و تحویل تکمیل را هماهنگ می‌کند

**چرخهٔ حیات**

- `gateway_start` / `gateway_stop` - سرویس‌های متعلق به Plugin را همراه با Gateway شروع یا متوقف می‌کند
- `cron_changed` - تغییرات چرخهٔ حیات Cron متعلق به gateway را مشاهده می‌کند (افزوده، به‌روزشده، حذف‌شده، شروع‌شده، تمام‌شده، زمان‌بندی‌شده)
- **`before_install`** - scanهای نصب skill یا Plugin را بررسی می‌کند و به‌صورت اختیاری مسدود می‌کند

## سیاست فراخوانی ابزار

`before_tool_call` دریافت می‌کند:

- `event.toolName`
- `event.params`
- `event.runId` اختیاری
- `event.toolCallId` اختیاری
- فیلدهای context مانند `ctx.agentId`، `ctx.sessionKey`، `ctx.sessionId`،
  `ctx.runId`، `ctx.jobId` (در runهای هدایت‌شده با Cron تنظیم می‌شود)، و `ctx.trace` تشخیصی

می‌تواند بازگرداند:

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
- `block: false` مانند نبود تصمیم در نظر گرفته می‌شود.
- `params` پارامترهای ابزار را برای اجرا بازنویسی می‌کند.
- `requireApproval` اجرای agent را متوقف می‌کند و از طریق تأییدهای Plugin از کاربر می‌پرسد. فرمان `/approve` می‌تواند هم تأییدهای exec و هم تأییدهای Plugin را تأیید کند.
- یک `block: true` با اولویت پایین‌تر همچنان می‌تواند پس از اینکه هوک با اولویت بالاتر درخواست تأیید کرد، مسدود کند.
- `onResolution` تصمیم تأیید resolve‌شده را دریافت می‌کند - `allow-once`،
  `allow-always`، `deny`، `timeout`، یا `cancelled`.

Pluginهای bundled که به سیاست سطح host نیاز دارند می‌توانند سیاست‌های ابزار trusted را با
`api.registerTrustedToolPolicy(...)` ثبت کنند. این‌ها پیش از هوک‌های معمولی
`before_tool_call` و پیش از تصمیم‌های Plugin خارجی اجرا می‌شوند. آن‌ها را فقط
برای gateهای trusted توسط host مانند سیاست workspace، اعمال بودجه، یا
ایمنی workflowهای reserved استفاده کنید. Pluginهای خارجی باید از هوک‌های عادی `before_tool_call`
استفاده کنند.

### پایدارسازی نتیجهٔ ابزار

نتایج ابزار می‌توانند شامل `details` ساختاریافته برای رندر UI، diagnostics،
مسیریابی media، یا metadata متعلق به Plugin باشند. با `details` به‌عنوان metadata زمان اجرا رفتار کنید،
نه محتوای prompt:

- OpenClaw پیش از replay provider و ورودی Compaction، `toolResult.details` را حذف می‌کند
  تا metadata به context مدل تبدیل نشود.
- ورودی‌های session پایدارشده فقط `details` محدودشده را نگه می‌دارند. details بیش از حد بزرگ
  با یک خلاصهٔ فشرده و `persistedDetailsTruncated: true` جایگزین می‌شوند.
- `tool_result_persist` و `before_message_write` پیش از cap نهایی پایداری اجرا می‌شوند.
  هوک‌ها همچنان باید `details` برگشتی را کوچک نگه دارند و از قرار دادن متن مرتبط با prompt فقط در `details` پرهیز کنند؛ خروجی ابزار قابل‌مشاهده برای model را
  در `content` قرار دهید.

## هوک‌های Prompt و model

برای Pluginهای جدید از هوک‌های مخصوص هر فاز استفاده کنید:

- `before_model_resolve`: فقط prompt فعلی و metadata پیوست را دریافت می‌کند.
  `providerOverride` یا `modelOverride` را بازگردانید.
- `agent_turn_prepare`: prompt فعلی، پیام‌های آماده‌شدهٔ session،
  و هر تزریق صف‌شدهٔ exactly-once تخلیه‌شده برای این session را دریافت می‌کند. `prependContext` یا `appendContext` را بازگردانید.
- `before_prompt_build`: prompt فعلی و پیام‌های session را دریافت می‌کند.
  `prependContext`، `appendContext`، `systemPrompt`،
  `prependSystemContext`، یا `appendSystemContext` را بازگردانید.
- `heartbeat_prompt_contribution`: فقط برای نوبت‌های Heartbeat اجرا می‌شود و
  `prependContext` یا `appendContext` را بازمی‌گرداند. این برای monitorهای پس‌زمینه در نظر گرفته شده است
  که باید وضعیت فعلی را بدون تغییر دادن نوبت‌های آغازشده توسط کاربر خلاصه کنند.

`before_agent_start` برای سازگاری باقی می‌ماند. هوک‌های صریح بالا را ترجیح دهید
تا Plugin شما به یک فاز ترکیبی legacy وابسته نباشد.

`before_agent_start` و `agent_end` وقتی OpenClaw بتواند run فعال را
شناسایی کند شامل `event.runId` هستند. همان مقدار روی `ctx.runId` نیز در دسترس است.
runهای هدایت‌شده با Cron همچنین `ctx.jobId` را expose می‌کنند (شناسهٔ cron job مبدأ) تا
هوک‌های Plugin بتوانند metricها، side effectها، یا state را به یک job زمان‌بندی‌شدهٔ خاص
محدود کنند.

برای runهایی که از channel سرچشمه می‌گیرند، `ctx.messageProvider` سطح provider مانند
`discord` یا `telegram` است، در حالی که `ctx.channelId` شناسهٔ هدف مکالمه است
وقتی OpenClaw بتواند آن را از session key یا metadata تحویل استخراج کند.

`agent_end` یک هوک مشاهده است و پس از نوبت به‌صورت fire-and-forget اجرا می‌شود. اجراکنندهٔ
هوک یک timeout برابر با 30 ثانیه اعمال می‌کند تا یک Plugin گیرکرده یا endpoint embedding
نتواند promise هوک را برای همیشه pending نگه دارد. timeout ثبت می‌شود و
OpenClaw ادامه می‌دهد؛ کار network متعلق به Plugin را لغو نمی‌کند مگر اینکه
Plugin از سیگنال abort خودش نیز استفاده کند.

از `model_call_started` و `model_call_ended` برای telemetry فراخوانی provider استفاده کنید
که نباید promptهای خام، history، responseها، headerها، request
bodyها، یا request IDهای provider را دریافت کند. این هوک‌ها metadata پایدار مانند
`runId`، `callId`، `provider`، `model`، `api`/`transport` اختیاری، مقادیر پایانی
`durationMs`/`outcome`، و `upstreamRequestIdHash` را وقتی OpenClaw بتواند یک
hash محدود provider request-id استخراج کند شامل می‌شوند.

`before_agent_finalize` فقط وقتی اجرا می‌شود که یک harness در آستانهٔ پذیرش یک پاسخ نهایی طبیعی
assistant باشد. این مسیر لغو `/stop` نیست و وقتی کاربر یک نوبت را abort می‌کند
اجرا نمی‌شود. برای درخواست یک گذر دیگر model پیش از finalization مقدار `{ action: "revise", reason }` را بازگردانید، برای اجبار finalization مقدار `{ action:
"finalize", reason? }` را بازگردانید، یا برای ادامه نتیجه‌ای حذف کنید.
هوک‌های native `Stop` در Codex به‌عنوان تصمیم‌های OpenClaw
`before_agent_finalize` به این هوک relay می‌شوند.

هنگام بازگرداندن `action: "revise"`، Pluginها می‌توانند metadata `retry` را شامل کنند تا
گذر اضافی model محدود و replay-safe باشد:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` به دلیل revision ارسال‌شده به harness افزوده می‌شود.
`idempotencyKey` به host اجازه می‌دهد retryها را برای همان درخواست Plugin در میان
تصمیم‌های finalize معادل بشمارد، و `maxAttempts` تعداد گذرهای اضافی‌ای را که
host پیش از ادامه با پاسخ نهایی طبیعی اجازه می‌دهد محدود می‌کند.

Pluginهای non-bundled که به `llm_input`، `llm_output`،
`before_agent_finalize`، یا `agent_end` نیاز دارند باید تنظیم کنند:

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

هوک‌های تغییردهندهٔ prompt و تزریق‌های پایدار نوبت بعدی را می‌توان برای هر Plugin
با `plugins.entries.<id>.hooks.allowPromptInjection=false` غیرفعال کرد.

### گسترش‌های Session و تزریق‌های نوبت بعدی

Pluginهای گردش کار می‌توانند وضعیت جلسهٔ کوچک و سازگار با JSON را با
`api.registerSessionExtension(...)` پایدار کنند و آن را از طریق متد
`sessions.pluginPatch` در Gateway به‌روزرسانی کنند. ردیف‌های جلسه وضعیت extension ثبت‌شده را
از طریق `pluginExtensions` نمایش می‌دهند و به Control UI و سایر clientها اجازه می‌دهند
وضعیت متعلق به Plugin را بدون دانستن جزئیات داخلی Plugin رندر کنند.

وقتی یک Plugin نیاز دارد context پایدار دقیقاً یک‌بار به نوبت مدل بعدی برسد، از
`api.enqueueNextTurnInjection(...)` استفاده کنید. OpenClaw تزریق‌های صف‌شده را پیش از
hookهای prompt تخلیه می‌کند، تزریق‌های منقضی‌شده را حذف می‌کند، و بر اساس `idempotencyKey`
برای هر Plugin deduplicate می‌کند. این seam مناسب برای resumeهای تأیید، خلاصه‌های policy،
deltaهای مانیتور پس‌زمینه، و ادامهٔ commandهایی است که باید در نوبت بعدی برای
مدل قابل مشاهده باشند اما نباید به متن دائمی system prompt تبدیل شوند.

معناشناسی cleanup بخشی از contract است. cleanup مربوط به session extension و
callbackهای cleanup چرخهٔ عمر runtime مقدارهای `reset`، `delete`، `disable`، یا
`restart` را دریافت می‌کنند. host وضعیت session extension پایدار متعلق به Plugin مالک
و تزریق‌های pending نوبت بعدی را برای reset/delete/disable حذف می‌کند؛ restart وضعیت
session پایدار را نگه می‌دارد، در حالی که callbackهای cleanup به Pluginها اجازه می‌دهند
jobهای scheduler، context اجرا، و سایر resourceهای خارج از باند مربوط به generation قدیمی
runtime را آزاد کنند.

## hookهای پیام

از hookهای پیام برای routing سطح کانال و policy تحویل استفاده کنید:

- `message_received`: محتوای ورودی، فرستنده، `threadId`، `messageId`،
  `senderId`، ارتباط اختیاری run/session، و metadata را مشاهده کنید.
- `message_sending`: مقدار `content` را بازنویسی کنید یا `{ cancel: true }` برگردانید.
- `message_sent`: موفقیت یا شکست نهایی را مشاهده کنید.

برای پاسخ‌های TTS فقط صوتی، `content` ممکن است transcript گفتاری پنهان را داشته باشد
حتی وقتی payload کانال متن/caption قابل مشاهده‌ای ندارد. بازنویسی آن
`content` فقط transcript قابل مشاهده برای hook را به‌روزرسانی می‌کند؛ به‌عنوان
caption رسانه رندر نمی‌شود.

contextهای hook پیام، وقتی در دسترس باشند، fieldهای correlation پایدار را expose می‌کنند:
`ctx.sessionKey`، `ctx.runId`، `ctx.messageId`، `ctx.senderId`، `ctx.trace`,
`ctx.traceId`، `ctx.spanId`، `ctx.parentSpanId`، و `ctx.callDepth`. پیش از خواندن
metadata قدیمی، این fieldهای first-class را ترجیح دهید.

پیش از استفاده از metadata اختصاصی کانال، fieldهای typed `threadId` و `replyToId` را ترجیح دهید.

قواعد تصمیم:

- `message_sending` با `cancel: true` نهایی است.
- `message_sending` با `cancel: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `content` بازنویسی‌شده به hookهای با اولویت پایین‌تر ادامه می‌یابد، مگر اینکه hook بعدی
  تحویل را لغو کند.

## hookهای نصب

`before_install` پس از scan داخلی برای نصب‌های skill و Plugin اجرا می‌شود.
یافته‌های اضافی یا `{ block: true, blockReason }` را برای متوقف کردن
نصب برگردانید.

`block: true` نهایی است. `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.

## چرخهٔ عمر Gateway

برای serviceهای Plugin که به وضعیت متعلق به Gateway نیاز دارند، از `gateway_start` استفاده کنید.
context مقدارهای `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` را برای
بازرسی و به‌روزرسانی‌های cron expose می‌کند. برای پاک‌سازی resourceهای طولانی‌مدت
از `gateway_stop` استفاده کنید.

برای serviceهای runtime متعلق به Plugin به hook داخلی `gateway:startup` تکیه نکنید.

`cron_changed` برای رویدادهای چرخهٔ عمر cron متعلق به gateway با یک payload رویداد typed
برای دلایل `added`، `updated`، `removed`، `started`، `finished`،
و `scheduled` اجرا می‌شود. رویداد یک snapshot از `PluginHookGatewayCronJob`
(شامل `state.nextRunAtMs`، `state.lastRunStatus`، و
`state.lastError` در صورت وجود) به‌همراه یک `PluginHookGatewayCronDeliveryStatus`
از `not-requested` | `delivered` | `not-delivered` | `unknown` را حمل می‌کند. رویدادهای حذف‌شده
همچنان snapshot job حذف‌شده را حمل می‌کنند تا schedulerهای خارجی بتوانند
وضعیت را reconcile کنند. هنگام همگام‌سازی wake schedulerهای خارجی، از `ctx.getCron?.()` و
`ctx.config` در context runtime استفاده کنید، و OpenClaw را به‌عنوان
منبع حقیقت برای due checkها و اجرا نگه دارید.

## deprecationهای آینده

چند سطح hook-adjacent منسوخ شده‌اند اما همچنان پشتیبانی می‌شوند. پیش از
انتشار major بعدی migrate کنید:

- **envelopeهای plaintext کانال** در handlerهای `inbound_claim` و `message_received`.
  به‌جای parse کردن متن envelope تخت، `BodyForAgent` و بلوک‌های ساختاریافتهٔ user-context را
  بخوانید. ببینید:
  [envelopeهای plaintext کانال → BodyForAgent](/fa/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** برای سازگاری باقی می‌ماند. Pluginهای جدید باید به‌جای phase ترکیبی
  از `before_model_resolve` و `before_prompt_build` استفاده کنند.
- **`onResolution` در `before_tool_call`** اکنون به‌جای `string` آزاد، از union typed
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) استفاده می‌کند.

برای فهرست کامل - ثبت capability حافظه، profile تفکر provider،
providerهای auth خارجی، typeهای کشف provider، accessorهای runtime task،
و تغییر نام `command-auth` → `command-status` - ببینید
[مهاجرت Plugin SDK → deprecationهای فعال](/fa/plugins/sdk-migration#active-deprecations).

## مرتبط

- [مهاجرت Plugin SDK](/fa/plugins/sdk-migration) - deprecationهای فعال و timeline حذف
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [hookهای داخلی](/fa/automation/hooks)
- [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals)
