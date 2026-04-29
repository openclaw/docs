---
read_when:
    - شما در حال ساخت یک Plugin هستید که به `before_tool_call`، `before_agent_reply`، قلاب‌های پیام، یا قلاب‌های چرخهٔ حیات نیاز دارد
    - باید فراخوانی‌های ابزار از یک Plugin را مسدود کنید، بازنویسی کنید، یا برایشان تأیید الزامی کنید
    - در حال تصمیم‌گیری بین هوک‌های داخلی و هوک‌های Plugin هستید
summary: 'هوک‌های Plugin: رویدادهای چرخهٔ حیات عامل، ابزار، پیام، نشست و Gateway را رهگیری کنید'
title: هوک‌های Plugin
x-i18n:
    generated_at: "2026-04-29T23:15:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

هوک‌های Plugin نقاط گسترش درون‌فرایندی برای Pluginهای OpenClaw هستند. از آن‌ها زمانی استفاده کنید که یک Plugin باید اجرای agentها، فراخوانی ابزارها، جریان پیام،
چرخه عمر session، مسیریابی subagent، نصب‌ها، یا راه‌اندازی Gateway را بررسی یا تغییر دهد.

وقتی یک اسکریپت کوچک `HOOK.md` نصب‌شده توسط اپراتور برای رویدادهای command و Gateway مانند
`/new`، `/reset`، `/stop`، `agent:bootstrap`، یا `gateway:startup` می‌خواهید، به‌جای آن از [هوک‌های داخلی](/fa/automation/hooks) استفاده کنید.

## شروع سریع

هوک‌های تایپ‌شده Plugin را از entry Plugin خود با `api.on(...)` ثبت کنید:

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

handlerهای hook به‌ترتیب نزولی `priority` اجرا می‌شوند. هوک‌های دارای اولویت یکسان
ترتیب ثبت را حفظ می‌کنند.

`api.on(name, handler, opts?)` این موارد را می‌پذیرد:

- `priority` — ترتیب handler (عدد بزرگ‌تر زودتر اجرا می‌شود).
- `timeoutMs` — بودجه اختیاری برای هر hook. وقتی تنظیم شود، hook runner پس از پایان بودجه آن
  handler را متوقف می‌کند و به handler بعدی ادامه می‌دهد، به‌جای اینکه راه‌اندازی کند یا کار recall کند و timeout مدل پیکربندی‌شده caller را مصرف کند. آن را حذف کنید تا از timeout پیش‌فرض observation/decision که hook runner به‌صورت عمومی اعمال می‌کند استفاده شود.

هر hook مقدار `event.context.pluginConfig` را دریافت می‌کند؛ یعنی config نهایی‌شده برای
Pluginای که آن handler را ثبت کرده است. از آن برای تصمیم‌های hook که به گزینه‌های فعلی Plugin نیاز دارند استفاده کنید؛ OpenClaw آن را برای هر handler تزریق می‌کند بدون اینکه شیء event مشترک دیده‌شده توسط Pluginهای دیگر را mutate کند.

## فهرست hookها

Hookها بر اساس سطحی که گسترش می‌دهند گروه‌بندی شده‌اند. نام‌های **پررنگ** یک
نتیجه decision می‌پذیرند (block، cancel، override، یا require approval)؛ همه موارد دیگر فقط observation هستند.

**نوبت agent**

- `before_model_resolve` — پیش از بارگذاری پیام‌های session، provider یا model را override می‌کند
- `agent_turn_prepare` — injectionهای نوبت Plugin در صف را مصرف می‌کند و پیش از prompt hookها، context همان نوبت را اضافه می‌کند
- `before_prompt_build` — پیش از فراخوانی مدل، context پویا یا متن system prompt را اضافه می‌کند
- `before_agent_start` — مرحله ترکیبی فقط برای سازگاری؛ دو hook بالا را ترجیح دهید
- **`before_agent_reply`** — نوبت model را با یک پاسخ synthetic یا سکوت، short-circuit می‌کند
- **`before_agent_finalize`** — پاسخ نهایی طبیعی را بررسی می‌کند و یک pass دیگر مدل را درخواست می‌کند
- `agent_end` — پیام‌های نهایی، وضعیت موفقیت، و مدت اجرای run را observe می‌کند
- `heartbeat_prompt_contribution` — context مخصوص Heartbeat را برای monitorهای پس‌زمینه و Pluginهای lifecycle اضافه می‌کند

**Observation مکالمه**

- `model_call_started` / `model_call_ended` — metadata پاک‌سازی‌شده فراخوانی provider/model، زمان‌بندی، outcome، و hashهای محدود request-id را بدون محتوای prompt یا response observe می‌کند
- `llm_input` — ورودی provider را observe می‌کند (system prompt، prompt، history)
- `llm_output` — خروجی provider را observe می‌کند

**ابزارها**

- **`before_tool_call`** — پارامترهای ابزار را بازنویسی می‌کند، execution را block می‌کند، یا approval لازم می‌کند
- `after_tool_call` — نتایج ابزار، errorها، و مدت‌زمان را observe می‌کند
- **`tool_result_persist`** — پیام assistant تولیدشده از یک نتیجه ابزار را بازنویسی می‌کند
- **`before_message_write`** — نوشتن پیام در حال انجام را بررسی یا block می‌کند (نادر)

**پیام‌ها و تحویل**

- **`inbound_claim`** — یک پیام inbound را پیش از مسیریابی agent claim می‌کند (پاسخ‌های synthetic)
- `message_received` — content ورودی، sender، thread، و metadata را observe می‌کند
- **`message_sending`** — content خروجی را بازنویسی می‌کند یا delivery را cancel می‌کند
- `message_sent` — موفقیت یا شکست delivery خروجی را observe می‌کند
- **`before_dispatch`** — dispatch خروجی را پیش از تحویل به channel بررسی یا بازنویسی می‌کند
- **`reply_dispatch`** — در pipeline نهایی reply-dispatch مشارکت می‌کند

**Sessionها و Compaction**

- `session_start` / `session_end` — مرزهای lifecycle session را دنبال می‌کند
- `before_compaction` / `after_compaction` — cycleهای Compaction را observe یا annotate می‌کند
- `before_reset` — رویدادهای reset session را observe می‌کند (`/reset`، resetهای برنامه‌ای)

**Subagentها**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — مسیریابی subagent و تحویل completion را هماهنگ می‌کند

**Lifecycle**

- `gateway_start` / `gateway_stop` — سرویس‌های متعلق به Plugin را همراه Gateway شروع یا متوقف می‌کند
- `cron_changed` — تغییرات lifecycle Cron متعلق به gateway را observe می‌کند (added، updated، removed، started، finished، scheduled)
- **`before_install`** — scanهای نصب skill یا Plugin را بررسی می‌کند و در صورت نیاز block می‌کند

## سیاست فراخوانی ابزار

`before_tool_call` این موارد را دریافت می‌کند:

- `event.toolName`
- `event.params`
- `event.runId` اختیاری
- `event.toolCallId` اختیاری
- فیلدهای context مانند `ctx.agentId`، `ctx.sessionKey`، `ctx.sessionId`،
  `ctx.runId`، `ctx.jobId` (در runهای مبتنی بر Cron تنظیم می‌شود)، و diagnostic `ctx.trace`

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

- `block: true` terminal است و handlerهای با اولویت پایین‌تر را skip می‌کند.
- `block: false` به‌عنوان نبود decision در نظر گرفته می‌شود.
- `params` پارامترهای ابزار را برای execution بازنویسی می‌کند.
- `requireApproval` اجرای agent را pause می‌کند و از طریق approvalهای Plugin از کاربر می‌پرسد. command `/approve` می‌تواند هم approvalهای exec و هم approvalهای Plugin را تأیید کند.
- یک `block: true` با اولویت پایین‌تر همچنان می‌تواند پس از اینکه یک hook با اولویت بالاتر approval درخواست کرد، block کند.
- `onResolution` decision نهایی approval را دریافت می‌کند — `allow-once`،
  `allow-always`، `deny`، `timeout`، یا `cancelled`.

Pluginهای bundled که به سیاست host-level نیاز دارند می‌توانند policyهای ابزار trusted را با
`api.registerTrustedToolPolicy(...)` ثبت کنند. این‌ها پیش از hookهای عادی
`before_tool_call` و پیش از decisionهای Plugin خارجی اجرا می‌شوند. فقط برای gateهای مورد اعتماد host مانند سیاست workspace، enforcement بودجه، یا ایمنی workflowهای reserved از آن‌ها استفاده کنید. Pluginهای خارجی باید از hookهای معمول `before_tool_call` استفاده کنند.

### Persistence نتیجه ابزار

نتایج ابزار می‌توانند شامل `details` ساختاریافته برای rendering UI، diagnosticها،
مسیریابی media، یا metadata متعلق به Plugin باشند. با `details` به‌عنوان metadata runtime رفتار کنید،
نه content prompt:

- OpenClaw پیش از replay provider و ورودی Compaction، `toolResult.details` را حذف می‌کند تا metadata به context مدل تبدیل نشود.
- entryهای session persistشده فقط `details` محدود را نگه می‌دارند. details بزرگ‌تر از حد با یک summary فشرده و `persistedDetailsTruncated: true` جایگزین می‌شوند.
- `tool_result_persist` و `before_message_write` پیش از cap نهایی persistence اجرا می‌شوند. Hookها همچنان باید `details` بازگردانده‌شده را کوچک نگه دارند و از قرار دادن متن مرتبط با prompt فقط در `details` خودداری کنند؛ خروجی ابزار قابل مشاهده برای مدل را در `content` بگذارید.

## هوک‌های prompt و model

برای Pluginهای جدید از hookهای phase-specific استفاده کنید:

- `before_model_resolve`: فقط prompt فعلی و metadata attachment را دریافت می‌کند. `providerOverride` یا `modelOverride` برگردانید.
- `agent_turn_prepare`: prompt فعلی، پیام‌های session آماده‌شده،
  و هر injection دقیقاً یک‌بار در صف که برای این session تخلیه شده است را دریافت می‌کند. `prependContext` یا `appendContext` برگردانید.
- `before_prompt_build`: prompt فعلی و پیام‌های session را دریافت می‌کند.
  `prependContext`، `appendContext`، `systemPrompt`،
  `prependSystemContext`، یا `appendSystemContext` برگردانید.
- `heartbeat_prompt_contribution`: فقط برای نوبت‌های Heartbeat اجرا می‌شود و
  `prependContext` یا `appendContext` برمی‌گرداند. برای monitorهای پس‌زمینه‌ای در نظر گرفته شده است
  که باید وضعیت فعلی را بدون تغییر دادن نوبت‌های آغازشده توسط کاربر خلاصه کنند.

`before_agent_start` برای سازگاری باقی مانده است. hookهای صریح بالا را ترجیح دهید
تا Plugin شما به یک مرحله ترکیبی legacy وابسته نشود.

`before_agent_start` و `agent_end` وقتی OpenClaw بتواند run فعال را شناسایی کند شامل `event.runId` هستند. همان مقدار روی `ctx.runId` نیز در دسترس است.
runهای مبتنی بر Cron همچنین `ctx.jobId` (شناسه cron job مبدأ) را expose می‌کنند تا
hookهای Plugin بتوانند metricها، side effectها، یا state را به یک job زمان‌بندی‌شده مشخص محدود کنند.

`agent_end` یک observation hook است و پس از نوبت به‌صورت fire-and-forget اجرا می‌شود. hook runner یک timeout سی‌ثانیه‌ای اعمال می‌کند تا یک Plugin گیرکرده یا endpoint embedding نتواند promise hook را برای همیشه pending نگه دارد. timeout log می‌شود و OpenClaw ادامه می‌دهد؛ این کار network work متعلق به Plugin را cancel نمی‌کند مگر اینکه خود Plugin نیز از abort signal خودش استفاده کند.

برای telemetry فراخوانی provider که نباید promptهای خام، history، responseها، headerها، request bodyها، یا request IDهای provider را دریافت کند، از `model_call_started` و `model_call_ended` استفاده کنید. این hookها شامل metadata پایدار مانند
`runId`، `callId`، `provider`، `model`، `api`/`transport` اختیاری، `durationMs`/`outcome` terminal، و `upstreamRequestIdHash` هستند، وقتی OpenClaw بتواند hash محدود request-id provider را استخراج کند.

`before_agent_finalize` فقط زمانی اجرا می‌شود که یک harness در آستانه پذیرش پاسخ نهایی طبیعی assistant باشد. این مسیر cancel مربوط به `/stop` نیست و وقتی کاربر یک turn را abort می‌کند اجرا نمی‌شود. `{ action: "revise", reason }` را برگردانید تا از harness بخواهید پیش از finalization یک pass دیگر model انجام دهد، `{ action:
"finalize", reason? }` را برای اجبار finalization برگردانید، یا برای ادامه نتیجه‌ای برنگردانید.
hookهای `Stop` بومی Codex به‌عنوان decisionهای
`before_agent_finalize` در OpenClaw به این hook relay می‌شوند.

Pluginهای غیر bundled که به `llm_input`، `llm_output`،
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

hookهای mutateکننده prompt و injectionهای durable نوبت بعد را می‌توان برای هر Plugin با
`plugins.entries.<id>.hooks.allowPromptInjection=false` غیرفعال کرد.

### Extensionهای session و injectionهای نوبت بعد

Pluginهای workflow می‌توانند state کوچک سازگار با JSON را با
`api.registerSessionExtension(...)` persist کنند و آن را از طریق method
`sessions.pluginPatch` در Gateway به‌روزرسانی کنند. rowهای session state ثبت‌شده extension را از طریق
`pluginExtensions` project می‌کنند، تا Control UI و clientهای دیگر بتوانند
status متعلق به Plugin را بدون آگاهی از internals Plugin render کنند.

وقتی یک Plugin نیاز دارد context بادوام دقیقاً یک‌بار به نوبت model بعدی برسد، از `api.enqueueNextTurnInjection(...)` استفاده کنید. OpenClaw injectionهای در صف را پیش از
prompt hookها drain می‌کند، injectionهای منقضی‌شده را drop می‌کند، و بر اساس `idempotencyKey`
برای هر Plugin deduplicate می‌کند. این seam مناسب برای resumeهای approval، summaryهای policy،
deltaهای monitor پس‌زمینه، و continuationهای command است که باید در نوبت بعد برای مدل قابل مشاهده باشند اما نباید به متن دائمی system prompt تبدیل شوند.

معناشناسی cleanup بخشی از contract است. cleanup مربوط به session extension و
callbackهای cleanup مربوط به runtime lifecycle مقدارهای `reset`، `delete`، `disable`، یا
`restart` را دریافت می‌کنند. host state extension session پایدار متعلق به Plugin و injectionهای pending نوبت بعد را برای reset/delete/disable حذف می‌کند؛ restart state durable session را نگه می‌دارد، درحالی‌که callbackهای cleanup به Pluginها اجازه می‌دهند scheduler jobها، run context، و منابع out-of-band دیگر را برای generation runtime قدیمی release کنند.

## هوک‌های پیام

برای سیاست مسیریابی و delivery در سطح channel از hookهای پیام استفاده کنید:

- `message_received`: content ورودی، sender، `threadId`، `messageId`،
  `senderId`، correlation اختیاری run/session، و metadata را observe می‌کند.
- `message_sending`: `content` را بازنویسی می‌کند یا `{ cancel: true }` برمی‌گرداند.
- `message_sent`: موفقیت یا شکست نهایی را observe می‌کند.

برای پاسخ‌های TTS فقط صوتی، `content` ممکن است شامل رونوشت گفتاری پنهان باشد، حتی وقتی payload کانال هیچ متن/زیرنویس قابل‌مشاهده‌ای ندارد. بازنویسی آن `content` فقط رونوشت قابل‌مشاهده برای hook را به‌روزرسانی می‌کند؛ به‌عنوان زیرنویس رسانه رندر نمی‌شود.

زمینه‌های hook پیام، در صورت در دسترس بودن، فیلدهای هم‌بستگی پایدار را در اختیار می‌گذارند:
`ctx.sessionKey`، `ctx.runId`، `ctx.messageId`، `ctx.senderId`، `ctx.trace`،
`ctx.traceId`، `ctx.spanId`، `ctx.parentSpanId`، و `ctx.callDepth`. پیش از خواندن فراداده قدیمی، این فیلدهای درجه‌یک را ترجیح دهید.

پیش از استفاده از فراداده اختصاصی کانال، فیلدهای تایپ‌شده `threadId` و `replyToId` را ترجیح دهید.

قواعد تصمیم‌گیری:

- `message_sending` با `cancel: true` نهایی است.
- `message_sending` با `cancel: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `content` بازنویسی‌شده همچنان به hookهای با اولویت پایین‌تر می‌رسد، مگر اینکه hook بعدی تحویل را لغو کند.

## نصب hookها

`before_install` پس از اسکن داخلی برای نصب Skills و Plugin اجرا می‌شود.
برای متوقف‌کردن نصب، یافته‌های اضافی یا `{ block: true, blockReason }` را برگردانید.

`block: true` نهایی است. `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.

## چرخه عمر Gateway

برای سرویس‌های Plugin که به وضعیت تحت مالکیت Gateway نیاز دارند، از `gateway_start` استفاده کنید. زمینه، `ctx.config`، `ctx.workspaceDir`، و `ctx.getCron?.()` را برای بررسی و به‌روزرسانی cron در اختیار می‌گذارد. برای پاک‌سازی منابع بلندمدت، از `gateway_stop` استفاده کنید.

برای سرویس‌های زمان اجرای متعلق به Plugin، به hook داخلی `gateway:startup` متکی نباشید.

`cron_changed` برای رویدادهای چرخه عمر cron تحت مالکیت gateway با payload رویداد تایپ‌شده‌ای اجرا می‌شود که دلیل‌های `added`، `updated`، `removed`، `started`، `finished`،
و `scheduled` را پوشش می‌دهد. رویداد یک snapshot از `PluginHookGatewayCronJob`
(شامل `state.nextRunAtMs`، `state.lastRunStatus`، و در صورت وجود `state.lastError`) به‌همراه یک `PluginHookGatewayCronDeliveryStatus`
با مقدار `not-requested` | `delivered` | `not-delivered` | `unknown` حمل می‌کند. رویدادهای حذف‌شده همچنان snapshot کار حذف‌شده را حمل می‌کنند تا زمان‌بندهای خارجی بتوانند وضعیت را سازگار کنند. هنگام همگام‌سازی زمان‌بندهای بیدارسازی خارجی، از `ctx.getCron?.()` و `ctx.config` در زمینه زمان اجرا استفاده کنید، و OpenClaw را به‌عنوان منبع حقیقت برای بررسی‌های موعد و اجرا نگه دارید.

## موارد منسوخ‌شدن پیش‌رو

چند سطح نزدیک به hook منسوخ شده‌اند اما همچنان پشتیبانی می‌شوند. پیش از انتشار اصلی بعدی مهاجرت کنید:

- **پاکت‌های متن ساده کانال** در handlerهای `inbound_claim` و `message_received`.
  به‌جای parse کردن متن تخت پاکت، `BodyForAgent` و بلوک‌های ساختاریافته زمینه کاربر را بخوانید. ببینید
  [پاکت‌های متن ساده کانال → BodyForAgent](/fa/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** برای سازگاری باقی مانده است. Pluginهای جدید باید به‌جای فاز ترکیبی، از `before_model_resolve` و `before_prompt_build` استفاده کنند.
- **`onResolution` در `before_tool_call`** اکنون به‌جای یک `string` آزاد، از union تایپ‌شده `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) استفاده می‌کند.

برای فهرست کامل — ثبت قابلیت حافظه، پروفایل تفکر provider، providerهای احراز هویت خارجی، نوع‌های کشف provider، accessorهای زمان اجرای task، و تغییر نام `command-auth` → `command-status` — ببینید
[مهاجرت Plugin SDK → موارد منسوخ فعال](/fa/plugins/sdk-migration#active-deprecations).

## مرتبط

- [مهاجرت Plugin SDK](/fa/plugins/sdk-migration) — موارد منسوخ فعال و جدول زمانی حذف
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [نقاط ورود Plugin](/fa/plugins/sdk-entrypoints)
- [hookهای داخلی](/fa/automation/hooks)
- [داخلی‌های معماری Plugin](/fa/plugins/architecture-internals)
