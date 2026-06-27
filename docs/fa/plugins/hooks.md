---
read_when:
    - در حال ساخت Plugin هستید که به `before_tool_call`، `before_agent_reply`، هوک‌های پیام، یا هوک‌های چرخه حیات نیاز دارد
    - باید فراخوانی‌های ابزار از یک Plugin را مسدود کنید، بازنویسی کنید یا برای آن‌ها تأییدیه الزامی کنید
    - شما در حال تصمیم‌گیری بین هوک‌های داخلی و هوک‌های Plugin هستید
summary: 'قلاب‌های Plugin: رهگیری رویدادهای چرخهٔ عمر عامل، ابزار، پیام، نشست و Gateway'
title: هوک‌های Plugin
x-i18n:
    generated_at: "2026-06-27T18:17:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

هوک‌های Plugin نقاط توسعه درون‌فرایندی برای Pluginهای OpenClaw هستند. از آن‌ها
وقتی استفاده کنید که یک Plugin باید اجرای عامل‌ها، فراخوانی ابزارها، جریان پیام،
چرخهٔ عمر نشست، مسیریابی زیرعامل، نصب‌ها، یا راه‌اندازی Gateway را بررسی یا تغییر دهد.

وقتی یک اسکریپت کوچک `HOOK.md` نصب‌شده توسط اپراتور برای رویدادهای دستور و Gateway
مانند `/new`، `/reset`، `/stop`، `agent:bootstrap`، یا `gateway:startup`
می‌خواهید، به‌جای آن از [هوک‌های داخلی](/fa/automation/hooks) استفاده کنید.

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

مدیریت‌کننده‌های هوک به‌ترتیب نزولی `priority` اجرا می‌شوند. هوک‌های هم‌اولویت
ترتیب ثبت را حفظ می‌کنند.

`api.on(name, handler, opts?)` این موارد را می‌پذیرد:

- `priority` - ترتیب مدیریت‌کننده‌ها (عدد بالاتر زودتر اجرا می‌شود).
- `timeoutMs` - بودجهٔ اختیاری برای هر هوک. وقتی تنظیم شود، اجراکنندهٔ هوک پس از
  سپری‌شدن بودجه آن مدیریت‌کننده را متوقف می‌کند و به مورد بعدی ادامه می‌دهد،
  به‌جای اینکه اجازه دهد راه‌اندازی یا بازیابی کند، بودجهٔ مدل پیکربندی‌شدهٔ
  فراخواننده را مصرف کند. برای استفاده از مهلت پیش‌فرض مشاهده/تصمیم که
  اجراکنندهٔ هوک به‌صورت عمومی اعمال می‌کند، آن را حذف کنید.

اپراتورها همچنین می‌توانند بدون وصله‌کردن کد Plugin بودجهٔ هوک‌ها را تنظیم کنند:

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

`hooks.timeouts.<hookName>` مقدار `hooks.timeoutMs` را بازنویسی می‌کند، و آن هم مقدار
نوشته‌شده توسط Plugin در `api.on(..., { timeoutMs })` را بازنویسی می‌کند. هر مقدار
پیکربندی‌شده باید یک عدد صحیح مثبت و حداکثر 600000 میلی‌ثانیه باشد. برای هوک‌های
کند شناخته‌شده، بازنویسی‌های مخصوص هر هوک را ترجیح دهید تا یک Plugin در همه‌جا
بودجهٔ طولانی‌تری نگیرد.

هر هوک `event.context.pluginConfig` را دریافت می‌کند؛ یعنی پیکربندی حل‌شده برای
Pluginی که آن مدیریت‌کننده را ثبت کرده است. از آن برای تصمیم‌های هوکی استفاده کنید
که به گزینه‌های فعلی Plugin نیاز دارند؛ OpenClaw آن را برای هر مدیریت‌کننده تزریق
می‌کند بدون اینکه شیء رویداد مشترکی را که Pluginهای دیگر می‌بینند تغییر دهد.

## کاتالوگ هوک‌ها

هوک‌ها بر اساس سطحی که توسعه می‌دهند گروه‌بندی شده‌اند. نام‌های **پررنگ** نتیجهٔ
تصمیم را می‌پذیرند (مسدودسازی، لغو، بازنویسی، یا درخواست تأیید)؛ همهٔ موارد دیگر
فقط برای مشاهده هستند.

**نوبت عامل**

- `before_model_resolve` - بازنویسی ارائه‌دهنده یا مدل پیش از بارگذاری پیام‌های نشست
- `agent_turn_prepare` - مصرف تزریق‌های نوبت Plugin در صف و افزودن زمینهٔ همان نوبت پیش از هوک‌های پرامپت
- `before_prompt_build` - افزودن زمینهٔ پویا یا متن پرامپت سیستمی پیش از فراخوانی مدل
- `before_agent_start` - فاز ترکیبی فقط برای سازگاری؛ دو هوک بالا را ترجیح دهید
- **`before_agent_run`** - بررسی پرامپت نهایی و پیام‌های نشست پیش از ارسال به مدل و مسدودسازی اختیاری اجرا
- **`before_agent_reply`** - کوتاه‌کردن نوبت مدل با یک پاسخ مصنوعی یا سکوت
- **`before_agent_finalize`** - بررسی پاسخ نهایی طبیعی و درخواست یک گذر دیگر مدل
- `agent_end` - مشاهدهٔ پیام‌های نهایی، وضعیت موفقیت، و مدت اجرای نوبت
- `heartbeat_prompt_contribution` - افزودن زمینهٔ مخصوص Heartbeat برای پایشگر پس‌زمینه و Pluginهای چرخهٔ عمر

**مشاهدهٔ گفتگو**

- `model_call_started` / `model_call_ended` - مشاهدهٔ فرادادهٔ پاک‌سازی‌شدهٔ فراخوانی ارائه‌دهنده/مدل، زمان‌بندی، نتیجه، و هش‌های محدود شناسهٔ درخواست بدون محتوای پرامپت یا پاسخ
- `llm_input` - مشاهدهٔ ورودی ارائه‌دهنده (پرامپت سیستمی، پرامپت، تاریخچه)
- `llm_output` - مشاهدهٔ خروجی ارائه‌دهنده، میزان مصرف، و `contextTokenBudget` حل‌شده در صورت موجودبودن

**ابزارها**

- **`before_tool_call`** - بازنویسی پارامترهای ابزار، مسدودسازی اجرا، یا درخواست تأیید
- `after_tool_call` - مشاهدهٔ نتایج ابزار، خطاها، و مدت‌زمان
- `resolve_exec_env` - مشارکت در متغیرهای محیطی متعلق به Plugin برای `exec`
- **`tool_result_persist`** - بازنویسی پیام دستیار تولیدشده از نتیجهٔ ابزار
- **`before_message_write`** - بررسی یا مسدودسازی نوشتن پیام در حال انجام (نادر)

**پیام‌ها و تحویل**

- **`inbound_claim`** - تصاحب یک پیام ورودی پیش از مسیریابی عامل (پاسخ‌های مصنوعی)
- `message_received` — مشاهدهٔ محتوای ورودی، فرستنده، رشته، و فراداده
- **`message_sending`** — بازنویسی محتوای خروجی یا لغو تحویل
- **`reply_payload_sending`** — تغییر یا لغو بار پاسخ نرمال‌شده پیش از تحویل
- `message_sent` — مشاهدهٔ موفقیت یا شکست تحویل خروجی
- **`before_dispatch`** - بررسی یا بازنویسی یک ارسال خروجی پیش از واگذاری به کانال
- **`reply_dispatch`** - مشارکت در خط لولهٔ نهایی ارسال پاسخ

**نشست‌ها و Compaction**

- `session_start` / `session_end` - ردیابی مرزهای چرخهٔ عمر نشست. مقدار `reason` رویداد یکی از `new`، `reset`، `idle`، `daily`، `compaction`، `deleted`، `shutdown`، `restart`، یا `unknown` است. مقدارهای `shutdown` و `restart` از نهایی‌ساز خاموشی gateway وقتی فرایند در حالی متوقف یا راه‌اندازی دوباره می‌شود که نشست‌ها هنوز فعال‌اند اجرا می‌شوند، تا Pluginهای پایین‌دستی (مانند حافظه یا ذخیره‌گاه‌های رونوشت) بتوانند ردیف‌های شبحی را که در غیر این صورت در وضعیت باز میان راه‌اندازی‌های دوباره باقی می‌مانند نهایی کنند. نهایی‌ساز محدود است تا یک Plugin کند نتواند SIGTERM/SIGINT را مسدود کند.
- `before_compaction` / `after_compaction` - مشاهده یا حاشیه‌نویسی چرخه‌های Compaction
- `before_reset` - مشاهدهٔ رویدادهای بازنشانی نشست (`/reset`، بازنشانی‌های برنامه‌ای)

**زیرعامل‌ها**

- `subagent_spawned` / `subagent_ended` - مشاهدهٔ راه‌اندازی و تکمیل زیرعامل.
- `subagent_delivery_target` - هوک سازگاری برای تحویل تکمیل وقتی هیچ اتصال نشست هسته‌ای نتواند مسیری را تصویر کند.
- `subagent_spawning` - هوک سازگاری منسوخ. هسته اکنون اتصال‌های زیرعامل `thread: true` را از طریق آداپتورهای اتصال نشست کانال پیش از اجرای `subagent_spawned` آماده می‌کند.
- `subagent_spawned` وقتی OpenClaw مدل بومی نشست فرزند را پیش از راه‌اندازی حل کرده باشد، شامل `resolvedModel` و `resolvedProvider` است.
- `subagent_ended` شامل `targetSessionKey` (هویت — این با `subagent_spawned.childSessionKey` منطبق است)، `targetKind` (`"subagent"` یا `"acp"`)، `reason`، `outcome` اختیاری (`"ok"`، `"error"`، `"timeout"`، `"killed"`، `"reset"`، یا `"deleted"`)، `error` اختیاری، `runId`، `endedAt`، `accountId`، و `sendFarewell` است. این رویداد **شامل** `agentId` یا `childSessionKey` نیست؛ برای همبسته‌سازی با رویداد متناظر `subagent_spawned` از `targetSessionKey` استفاده کنید.

**چرخهٔ عمر**

- `gateway_start` / `gateway_stop` - شروع یا توقف سرویس‌های متعلق به Plugin همراه با Gateway
- `deactivate` - نام مستعار سازگاری منسوخ برای `gateway_stop`؛ در Pluginهای جدید از `gateway_stop` استفاده کنید
- `cron_changed` - مشاهدهٔ تغییرات چرخهٔ عمر cron متعلق به gateway (افزوده‌شده، به‌روزرسانی‌شده، حذف‌شده، شروع‌شده، پایان‌یافته، زمان‌بندی‌شده)
- **`before_install`** - بررسی محتوای نصب آماده‌شدهٔ skill یا Plugin از یک runtime
  بارگذاری‌شدهٔ Plugin

## اشکال‌زدایی هوک‌های runtime

وقتی یک Plugin باید ارائه‌دهنده یا مدل را برای نوبت یک عامل تغییر دهد از
`before_model_resolve` استفاده کنید. این هوک پیش از حل مدل اجرا می‌شود؛
`llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل خروجی دستیار تولید کند.

برای اثبات مدل مؤثر نشست، ثبت‌های runtime را بررسی کنید، سپس از
`openclaw sessions` یا سطوح نشست/وضعیت Gateway استفاده کنید. هنگام اشکال‌زدایی
بارهای ارائه‌دهنده، Gateway را با `--raw-stream` و
`--raw-stream-path <path>` شروع کنید؛ این پرچم‌ها رویدادهای خام جریان مدل را در یک فایل jsonl
می‌نویسند.

## سیاست فراخوانی ابزار

`before_tool_call` دریافت می‌کند:

- `event.toolName`
- `event.params`
- `event.toolKind` و `event.toolInputKind` اختیاری، تفکیک‌گرهای مقتدر میزبان
  برای ابزارهایی که عمداً نام مشترک دارند؛ برای مثال، فراخوانی‌های بیرونی
  `exec` در حالت کد از `toolKind: "code_mode_exec"` استفاده می‌کنند و
  وقتی زبان ورودی شناخته شده باشد شامل `toolInputKind: "javascript" | "typescript"` هستند
- `event.derivedPaths` اختیاری، شامل راهنمایی‌های best-effort برای مسیر هدف مشتق‌شده توسط میزبان
  برای پوشش‌های ابزار شناخته‌شده مانند `apply_patch`؛ وقتی وجود داشته باشند،
  این مسیرها ممکن است ناقص باشند یا ممکن است بیش‌ازحد تخمین بزنند که ابزار
  واقعاً چه چیزی را لمس خواهد کرد (برای مثال، با ورودی‌های بدشکل یا جزئی)
- `event.runId` اختیاری
- `event.toolCallId` اختیاری
- فیلدهای زمینه مانند `ctx.agentId`، `ctx.sessionKey`، `ctx.sessionId`،
  `ctx.runId`، `ctx.jobId` (تنظیم‌شده روی اجراهای هدایت‌شده با cron)، `ctx.toolKind`،
  `ctx.toolInputKind`، و `ctx.trace` تشخیصی

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
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

رفتار نگهبان هوک برای هوک‌های چرخهٔ عمر تایپ‌شده:

- `block: true` پایانی است و مدیریت‌کننده‌های کم‌اولویت‌تر را رد می‌کند.
- `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `params` پارامترهای ابزار را برای اجرا بازنویسی می‌کند.
- `requireApproval` اجرای عامل را متوقف می‌کند و از طریق تأییدهای Plugin از کاربر می‌پرسد.
  دستور `/approve` می‌تواند هم تأییدهای exec و هم تأییدهای Plugin را تأیید کند.
  در relayهای بومی `PreToolUse` حالت گزارش app-server در Codex، این به
  درخواست تأیید app-server متناظر موکول می‌شود؛ [runtime هارنس Codex](/fa/plugins/codex-harness-runtime#hook-boundaries) را ببینید.
- یک `block: true` با اولویت پایین‌تر همچنان می‌تواند پس از درخواست تأیید توسط یک هوک با اولویت بالاتر، مسدود کند.
- `onResolution` تصمیم تأیید حل‌شده را دریافت می‌کند - `allow-once`،
  `allow-always`، `deny`، `timeout`، یا `cancelled`.

برای مسیریابی تأیید، رفتار تصمیم، و زمان استفاده از `requireApproval` به‌جای
ابزارهای اختیاری یا تأییدهای exec، [درخواست‌های مجوز Plugin](/fa/plugins/plugin-permission-requests) را ببینید.

Pluginهایی که به سیاست سطح میزبان نیاز دارند می‌توانند سیاست‌های ابزار مورد اعتماد را با
`api.registerTrustedToolPolicy(...)` ثبت کنند. این‌ها پیش از هوک‌های معمولی
`before_tool_call` و پیش از تصمیم‌های عادی هوک اجرا می‌شوند. سیاست‌های مورد اعتماد
باندل‌شده ابتدا اجرا می‌شوند؛ سیاست‌های مورد اعتماد Plugin نصب‌شده سپس به‌ترتیب
بارگذاری Plugin اجرا می‌شوند؛ هوک‌های معمولی `before_tool_call` پس از آن‌ها اجرا
می‌شوند. Pluginهای باندل‌شده مسیر سیاست مورد اعتماد موجود را حفظ می‌کنند.
Pluginهای نصب‌شده باید صریحاً فعال شوند و هر شناسهٔ سیاست را در
`contracts.trustedToolPolicies` اعلام کنند؛ شناسه‌های اعلام‌نشده پیش از ثبت رد
می‌شوند. شناسه‌های سیاست در دامنهٔ Plugin ثبت‌کننده هستند، بنابراین Pluginهای
مختلف می‌توانند از همان شناسهٔ محلی دوباره استفاده کنند. از این لایه فقط برای
دروازه‌های مورد اعتماد میزبان مانند سیاست فضای کاری، اجرای بودجه، یا ایمنی
گردش‌کار رزرو‌شده استفاده کنید.

### هوک محیط exec

`resolve_exec_env` به Pluginها اجازه می‌دهد پس از ساخته‌شدن محیط exec پایه و پیش از
اجرای دستور، متغیرهای محیطی را به فراخوانی‌های ابزار `exec` اضافه کنند. دریافت می‌کند:

- `event.sessionKey`
- `event.toolName`، که در حال حاضر همیشه `"exec"` است
- `event.host`، یکی از `"gateway"`، `"sandbox"`، یا `"node"`
- فیلدهای زمینه مانند `ctx.agentId`، `ctx.sessionKey`،
  `ctx.messageProvider`، و `ctx.channelId`

برای ادغام در محیط exec یک `Record<string, string>` برگردانید. مدیریت‌کننده‌ها
به‌ترتیب اولویت اجرا می‌شوند، و نتایج هوک‌های بعدی برای کلید یکسان، نتایج هوک‌های
قبلی را بازنویسی می‌کنند.

خروجی Hook پیش از ادغام، از سیاست کلیدهای محیط exec میزبان عبور داده
و فیلتر می‌شود. کلیدهای نامعتبر، `PATH`، و کلیدهای خطرناک بازنویسی میزبان مانند
`LD_*`، `DYLD_*`، `NODE_OPTIONS`، متغیرهای proxy، و متغیرهای بازنویسی TLS
حذف می‌شوند. env فیلترشده Plugin در فراداده تایید/ممیزی Gateway گنجانده می‌شود
و به درخواست‌های اجرای node-host فرستاده می‌شود.

### ماندگاری نتیجه ابزار

نتایج ابزار می‌توانند شامل `details` ساختاریافته برای رندر UI، عیب‌یابی،
مسیر‌دهی رسانه، یا فراداده تحت مالکیت Plugin باشند. با `details` به‌عنوان
فراداده زمان اجرا رفتار کنید، نه محتوای prompt:

- OpenClaw پیش از بازپخش provider و ورودی Compaction، `toolResult.details` را
  حذف می‌کند تا فراداده به context مدل تبدیل نشود.
- ورودی‌های نشست ماندگار فقط `details` محدودشده را نگه می‌دارند. جزئیات بیش از حد بزرگ
  با یک خلاصه فشرده و `persistedDetailsTruncated: true` جایگزین می‌شوند.
- `tool_result_persist` و `before_message_write` پیش از سقف نهایی ماندگاری اجرا می‌شوند.
  Hookها همچنان باید `details` بازگشتی را کوچک نگه دارند و از قرار دادن متن مرتبط با prompt
  فقط در `details` خودداری کنند؛ خروجی ابزار قابل مشاهده برای مدل را در `content` بگذارید.

## Hookهای prompt و مدل

برای Pluginهای جدید از Hookهای ویژه هر phase استفاده کنید:

- `before_model_resolve`: فقط prompt فعلی و فراداده پیوست را دریافت می‌کند.
  `providerOverride` یا `modelOverride` برگردانید.
- `agent_turn_prepare`: prompt فعلی، پیام‌های نشست آماده‌شده،
  و هر تزریق صف‌شده دقیقا-یک‌بار که برای این نشست تخلیه شده است را دریافت می‌کند.
  `prependContext` یا `appendContext` برگردانید.
- `before_prompt_build`: prompt فعلی و پیام‌های نشست را دریافت می‌کند.
  `prependContext`، `appendContext`، `systemPrompt`،
  `prependSystemContext`، یا `appendSystemContext` برگردانید.
- `heartbeat_prompt_contribution`: فقط برای نوبت‌های Heartbeat اجرا می‌شود و
  `prependContext` یا `appendContext` برمی‌گرداند. این Hook برای پایشگرهای پس‌زمینه‌ای
  در نظر گرفته شده که باید وضعیت فعلی را بدون تغییر دادن نوبت‌های آغازشده توسط کاربر
  خلاصه کنند.

`before_agent_start` برای سازگاری باقی مانده است. Hookهای صریح بالا را ترجیح دهید
تا Plugin شما به یک phase ترکیبی legacy وابسته نشود.

`before_agent_run` پس از ساخت prompt و پیش از هر ورودی مدل اجرا می‌شود،
از جمله بارگذاری تصویر محلی prompt و مشاهده `llm_input`. این Hook ورودی کاربر فعلی را
به‌عنوان `prompt`، به‌همراه تاریخچه نشست بارگذاری‌شده در `messages`
و prompt سیستمی فعال دریافت می‌کند. برای متوقف کردن اجرا پیش از اینکه مدل بتواند prompt را بخواند،
`{ outcome: "block", reason, message? }` برگردانید. `reason` داخلی است؛
`message` جایگزین قابل مشاهده برای کاربر است. تنها outcomeهای پشتیبانی‌شده
`pass` و `block` هستند؛ شکل‌های تصمیم پشتیبانی‌نشده fail closed می‌شوند.

وقتی یک اجرا مسدود می‌شود، OpenClaw فقط متن جایگزین را در
`message.content` به‌همراه فراداده غیرحساس block مانند id Plugin مسدودکننده
و timestamp ذخیره می‌کند. متن اصلی کاربر در transcript یا context آینده نگه داشته نمی‌شود.
دلایل block داخلی حساس تلقی می‌شوند و از payloadهای transcript، history، broadcast، log،
و diagnostics حذف می‌شوند. مشاهده‌پذیری باید از فیلدهای پاک‌سازی‌شده مانند blocker id،
outcome، timestamp، یا یک دسته‌بندی امن استفاده کند.

`before_agent_start` و `agent_end` وقتی OpenClaw بتواند اجرای فعال را شناسایی کند
شامل `event.runId` هستند. همان مقدار روی `ctx.runId` نیز در دسترس است.
اجراهای هدایت‌شده با Cron همچنین `ctx.jobId` (id کار Cron مبدا) را ارائه می‌کنند
تا Hookهای Plugin بتوانند metrics، side effectها، یا state را به یک کار زمان‌بندی‌شده مشخص
محدود کنند.

برای اجراهایی که از کانال آغاز شده‌اند، `ctx.channel` و `ctx.messageProvider`
سطح provider مانند `discord` یا `telegram` را شناسایی می‌کنند، در حالی که
`ctx.channelId` شناسه هدف گفتگو است وقتی OpenClaw بتواند آن را از کلید نشست
یا فراداده تحویل استخراج کند.

وقتی هویت فرستنده در دسترس باشد، contextهای Hook عامل همچنین شامل موارد زیر هستند:

- `ctx.senderId` — ID فرستنده در محدوده کانال (مثلا Feishu `open_id`، ID کاربر Discord).
  وقتی اجرا از پیام کاربری با فراداده فرستنده شناخته‌شده آغاز شود پر می‌شود.
- `ctx.chatId` — شناسه گفتگوی بومی transport (مثلا Feishu
  `chat_id`، Telegram `chat_id`). وقتی کانال مبدا یک ID گفتگوی بومی ارائه کند پر می‌شود.
- `ctx.channelContext.sender.id` — همان ID فرستنده مثل `ctx.senderId`، زیر یک
  آبجکت تحت مالکیت کانال که Pluginها می‌توانند آن را با فیلدهای ویژه کانال گسترش دهند.
- `ctx.channelContext.chat.id` — همان ID گفتگو مثل `ctx.chatId`، زیر یک
  آبجکت تحت مالکیت کانال که Pluginها می‌توانند آن را با فیلدهای ویژه کانال گسترش دهند.

Core فقط فیلدهای تو در توی `id` را تعریف می‌کند. Pluginهای کانال که فراداده غنی‌تر
فرستنده یا chat را از طریق helper ورودی عبور می‌دهند می‌توانند
`PluginHookChannelSenderContext` یا `PluginHookChannelChatContext` را از
`openclaw/plugin-sdk/channel-inbound` تقویت کنند:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Pluginهای کانال آن فیلدها را از طریق helper ورودی SDK عبور می‌دهند:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

این فیلدها اختیاری هستند و برای اجراهای آغازشده از سیستم (heartbeat،
cron، exec-event) وجود ندارند.

`ctx.senderExternalId` به‌عنوان یک فیلد سازگاری منبع deprecated برای
Pluginهای قدیمی‌تر باقی می‌ماند. Core آن را پر نمی‌کند؛ هویت‌های جدید فرستنده ویژه کانال
باید از طریق module augmentation زیر `ctx.channelContext.sender` قرار بگیرند.

`agent_end` یک Hook مشاهده است. مسیرهای Gateway و harness ماندگار آن را
پس از نوبت به‌صورت fire-and-forget اجرا می‌کنند، در حالی که مسیرهای CLI یک‌باره و کوتاه‌عمر
پیش از پاک‌سازی process منتظر promise Hook می‌مانند تا Pluginهای مورد اعتماد بتوانند
مشاهده‌پذیری ترمینال را flush کنند یا state را ثبت کنند. runner Hook یک timeout
۳۰ ثانیه‌ای اعمال می‌کند تا یک Plugin گیرکرده یا endpoint embedding نتواند promise Hook را
برای همیشه pending نگه دارد. timeout ثبت می‌شود و OpenClaw ادامه می‌دهد؛
این کار network work تحت مالکیت Plugin را لغو نمی‌کند مگر اینکه خود Plugin نیز از
abort signal خودش استفاده کند.

از `model_call_started` و `model_call_ended` برای telemetry تماس provider استفاده کنید
که نباید promptهای خام، history، responseها، headerها، bodyهای request،
یا IDهای request provider را دریافت کند. این Hookها شامل فراداده پایدار مانند
`runId`، `callId`، `provider`، `model`، `api`/`transport` اختیاری،
`durationMs`/`outcome` پایانی، و `upstreamRequestIdHash` هستند وقتی OpenClaw بتواند
یک hash محدود request-id مربوط به provider استخراج کند. وقتی runtime فراداده
context-window را resolve کرده باشد، رویداد و context Hook همچنین شامل
`contextTokenBudget`، بودجه موثر token پس از سقف‌های model/config/agent، به‌همراه
`contextWindowSource` و `contextWindowReferenceTokens` هستند وقتی سقف پایین‌تری
اعمال شده باشد.

`before_agent_finalize` فقط وقتی اجرا می‌شود که یک harness در آستانه پذیرش پاسخ نهایی طبیعی
assistant باشد. این مسیر لغو `/stop` نیست و وقتی کاربر یک نوبت را abort می‌کند اجرا نمی‌شود.
برای درخواست یک pass مدل دیگر از harness پیش از نهایی‌سازی،
`{ action: "revise", reason }` برگردانید، برای اجبار نهایی‌سازی
`{ action: "finalize", reason? }` برگردانید، یا برای ادامه، نتیجه‌ای ندهید.
Hookهای بومی Codex با نام `Stop` به این Hook به‌عنوان تصمیم‌های
`before_agent_finalize` در OpenClaw relay می‌شوند.

هنگام برگرداندن `action: "revise"`، Pluginها می‌توانند فراداده `retry` را شامل کنند تا
pass اضافی مدل محدود و replay-safe باشد:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` به دلیل بازبینی ارسال‌شده به harness افزوده می‌شود.
`idempotencyKey` به host اجازه می‌دهد retryها را برای همان درخواست Plugin در میان
تصمیم‌های finalize معادل بشمارد، و `maxAttempts` تعداد passهای اضافی را که
host پیش از ادامه با پاسخ نهایی طبیعی اجازه می‌دهد محدود می‌کند.

Pluginهای غیرهمراه که به Hookهای گفتگوی خام (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, یا `before_agent_run`) نیاز دارند باید این را تنظیم کنند:

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

Hookهای تغییر‌دهنده prompt و تزریق‌های ماندگار نوبت بعدی را می‌توان برای هر Plugin
با `plugins.entries.<id>.hooks.allowPromptInjection=false` غیرفعال کرد.

### افزونه‌های نشست و تزریق‌های نوبت بعدی

Pluginهای workflow می‌توانند state کوچک سازگار با JSON نشست را با
`api.registerSessionExtension(...)` ماندگار کنند و آن را از طریق متد Gateway
`sessions.pluginPatch` به‌روزرسانی کنند. ردیف‌های نشست state افزونه ثبت‌شده را از طریق
`pluginExtensions` project می‌کنند، و به Control UI و clientهای دیگر اجازه می‌دهند
وضعیت تحت مالکیت Plugin را بدون دانستن internals Plugin رندر کنند.

وقتی یک Plugin نیاز دارد context ماندگار دقیقا یک‌بار به نوبت مدل بعدی برسد،
از `api.enqueueNextTurnInjection(...)` استفاده کنید. OpenClaw تزریق‌های صف‌شده را پیش از
Hookهای prompt تخلیه می‌کند، تزریق‌های منقضی‌شده را حذف می‌کند، و بر اساس
`idempotencyKey` در هر Plugin deduplicate می‌کند. این seam مناسب برای resumeهای تایید،
خلاصه‌های policy، deltaهای پایشگر پس‌زمینه، و ادامه‌های command است که باید در نوبت بعدی
برای مدل قابل مشاهده باشند اما نباید به متن prompt سیستمی دائمی تبدیل شوند.

معنای cleanup بخشی از contract است. callbackهای cleanup افزونه نشست و lifecycle runtime
`reset`، `delete`، `disable`، یا `restart` را دریافت می‌کنند. host برای
reset/delete/disable، state افزونه نشست ماندگار Plugin مالک و تزریق‌های نوبت بعدی pending را
حذف می‌کند؛ restart state نشست ماندگار را نگه می‌دارد در حالی که callbackهای cleanup به
Pluginها اجازه می‌دهند کارهای scheduler، context اجرا، و دیگر منابع خارج از باند مربوط به
نسل runtime قبلی را آزاد کنند.

## Hookهای پیام

از Hookهای پیام برای مسیریابی و policy تحویل در سطح کانال استفاده کنید:

- `message_received`: محتوای ورودی، فرستنده، `threadId`، `messageId`,
  `senderId`، هم‌بستگی اختیاری run/session، و فراداده را مشاهده می‌کند.
- `message_sending`: `content` را بازنویسی می‌کند یا `{ cancel: true }` برمی‌گرداند.
- `reply_payload_sending`: آبجکت‌های نرمال‌شده `ReplyPayload` را بازنویسی می‌کند (شامل
  `presentation`، `delivery`، media refها، و text) یا `{ cancel: true }` برمی‌گرداند.
- `message_sent`: موفقیت یا شکست نهایی را مشاهده می‌کند.

برای پاسخ‌های TTS فقط-صوتی، `content` ممکن است transcript گفتاری پنهان را شامل شود
حتی وقتی payload کانال هیچ متن/کپشن قابل مشاهده‌ای ندارد. بازنویسی آن
`content` فقط transcript قابل مشاهده برای Hook را به‌روزرسانی می‌کند؛ به‌عنوان caption رسانه
رندر نمی‌شود.

رویدادهای `reply_payload_sending` ممکن است شامل `usageState` باشند، یک snapshot زنده
best-effort در هر نوبت از model/usage/context. تحویل ماندگار، replay بازیابی‌شده، و
پاسخ‌های بدون هم‌بستگی دقیق run آن را حذف می‌کنند.

contextهای Hook پیام وقتی در دسترس باشد فیلدهای هم‌بستگی پایدار را ارائه می‌کنند:
`ctx.sessionKey`، `ctx.runId`، `ctx.messageId`، `ctx.senderId`، `ctx.trace`,
`ctx.traceId`، `ctx.spanId`، `ctx.parentSpanId`، و `ctx.callDepth`. contextهای ورودی
و `before_dispatch` همچنین وقتی کانال داده پیام نقل‌قول‌شده visibility-filtered داشته باشد
فراداده reply را ارائه می‌کنند: `replyToId`، `replyToIdFull`,
`replyToBody`، `replyToSender`، و `replyToIsQuote`. پیش از خواندن فراداده legacy،
این فیلدهای first-class را ترجیح دهید.

پیش از استفاده از فراداده ویژه کانال، فیلدهای typed `threadId` و `replyToId` را ترجیح دهید.

قواعد تصمیم:

- `message_sending` با `cancel: true` پایانی است.
- `message_sending` با `cancel: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
- `content` بازنویسی‌شده به hookهای با اولویت پایین‌تر ادامه می‌دهد، مگر اینکه hook بعدی
  تحویل را لغو کند.
- `reply_payload_sending` پس از عادی‌سازی payload و پیش از تحویل channel اجرا می‌شود،
  از جمله پاسخ‌هایی که به channel مبدأ بازگردانده می‌شوند. Handlerها به‌ترتیب اجرا
  می‌شوند و هر handler آخرین payload تولیدشده توسط handlerهای با اولویت بالاتر را
  می‌بیند.
- payloadهای `reply_payload_sending` نشانگرهای اعتماد runtime مانند
  `trustedLocalMedia` را در دسترس نمی‌گذارند؛ Pluginها می‌توانند شکل payload را
  ویرایش کنند، اما نمی‌توانند اعتماد رسانه محلی را اعطا کنند.
- `message_sending` می‌تواند همراه با لغو، `cancelReason` و `metadata` محدودشده
  برگرداند. APIهای جدید چرخه عمر پیام این را به‌عنوان نتیجه تحویل سرکوب‌شده با دلیل
  `cancelled_by_message_sending_hook` نشان می‌دهند؛ تحویل مستقیم legacy برای سازگاری
  همچنان آرایه نتیجه خالی برمی‌گرداند.
- `message_sent` فقط برای مشاهده است. شکست handlerها ثبت می‌شود و نتیجه تحویل را
  تغییر نمی‌دهد.

## نصب hookها

برای تصمیم‌های اجازه/مسدودسازی در مالکیت operator از `security.installPolicy` استفاده کنید.
این policy از پیکربندی OpenClaw اجرا می‌شود، مسیرهای نصب و به‌روزرسانی CLI را پوشش می‌دهد،
و وقتی فعال باشد اما در دسترس نباشد به‌صورت fail-closed شکست می‌خورد.

`before_install` یک hook چرخه عمر runtime مربوط به Plugin است. فقط در فرایند OpenClaw که
hookهای Plugin از قبل بارگذاری شده‌اند، مانند جریان‌های نصب پشتیبانی‌شده توسط Gateway،
پس از `security.installPolicy` اجرا می‌شود. این برای مشاهده‌ها، هشدارها، و بررسی‌های
سازگاری در مالکیت Plugin مفید است، اما مرز امنیتی اصلی سازمانی یا host برای نصب‌ها نیست.
فیلد `builtinScan` برای سازگاری در payload رویداد باقی می‌ماند، اما OpenClaw دیگر
مسدودسازی داخلی کد خطرناک در زمان نصب را اجرا نمی‌کند، بنابراین یک نتیجه `ok` خالی است.
برای توقف نصب در آن فرایند، findings اضافی یا `{ block: true, blockReason }` برگردانید.

`block: true` پایانی است. `block: false` به‌عنوان نبود تصمیم در نظر گرفته می‌شود.
شکست handlerها نصب را به‌صورت fail-closed مسدود می‌کند.

## چرخه عمر Gateway

برای سرویس‌های Plugin که به وضعیت در مالکیت Gateway نیاز دارند، از `gateway_start` استفاده کنید.
context، `ctx.config`، `ctx.workspaceDir` و `ctx.getCron?.()` را برای بازرسی و به‌روزرسانی
Cron در دسترس می‌گذارد. برای پاک‌سازی منابع بلندمدت از `gateway_stop` استفاده کنید.

برای سرویس‌های runtime در مالکیت Plugin به hook داخلی `gateway:startup` تکیه نکنید.

`cron_changed` برای رویدادهای چرخه عمر Cron در مالکیت gateway با یک payload رویداد typed
فعال می‌شود که دلایل `added`، `updated`، `removed`، `started`، `finished`، و `scheduled`
را پوشش می‌دهد. رویداد یک snapshot از `PluginHookGatewayCronJob` را حمل می‌کند
(شامل `state.nextRunAtMs`، `state.lastRunStatus`، و `state.lastError` در صورت وجود)
به‌همراه یک `PluginHookGatewayCronDeliveryStatus` از `not-requested` | `delivered` |
`not-delivered` | `unknown`. رویدادهای حذف‌شده همچنان snapshot job حذف‌شده را حمل
می‌کنند تا زمان‌بندهای خارجی بتوانند وضعیت را همگام کنند. هنگام همگام‌سازی زمان‌بندهای
wake خارجی از `ctx.getCron?.()` و `ctx.config` در context runtime استفاده کنید و
OpenClaw را به‌عنوان منبع حقیقت برای بررسی‌های موعددار و اجرا نگه دارید.

## منسوخ‌سازی‌های پیش‌رو

چند سطح نزدیک به hook منسوخ شده‌اند اما هنوز پشتیبانی می‌شوند. پیش از انتشار major بعدی
مهاجرت کنید:

- **envelopeهای channel به‌صورت plaintext** در handlerهای `inbound_claim` و
  `message_received`. به‌جای parse کردن متن envelope تخت، `BodyForAgent` و blockهای
  ساختاریافته context کاربر را بخوانید. ببینید
  [envelopeهای channel به‌صورت plaintext → BodyForAgent](/fa/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** برای سازگاری باقی می‌ماند. Pluginهای جدید باید به‌جای phase
  ترکیبی از `before_model_resolve` و `before_prompt_build` استفاده کنند.
- **`subagent_spawning`** برای سازگاری با Pluginهای قدیمی‌تر باقی می‌ماند، اما Pluginهای
  جدید نباید routing مربوط به thread را از آن برگردانند. Core پیش از فعال شدن
  `subagent_spawned`، bindingهای subagent با `thread: true` را از طریق adapterهای
  session-binding channel آماده می‌کند.
- **`deactivate`** تا پس از 2026-08-16 به‌عنوان alias سازگاری cleanup منسوخ‌شده باقی
  می‌ماند. Pluginهای جدید باید از `gateway_stop` استفاده کنند.
- **`onResolution` در `before_tool_call`** اکنون به‌جای یک `string` آزاد، از union
  typed با نام `PluginApprovalResolution` استفاده می‌کند (`allow-once` / `allow-always` /
  `deny` / `timeout` / `cancelled`).

برای فهرست کامل - ثبت قابلیت حافظه، نمایه تفکر ارائه‌دهنده، ارائه‌دهنده‌های auth خارجی،
typeهای کشف ارائه‌دهنده، accessorهای runtime وظیفه، و تغییر نام `command-auth` →
`command-status` - ببینید
[مهاجرت Plugin SDK → منسوخ‌سازی‌های فعال](/fa/plugins/sdk-migration#active-deprecations).

## مرتبط

- [مهاجرت Plugin SDK](/fa/plugins/sdk-migration) - منسوخ‌سازی‌های فعال و زمان‌بندی حذف
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [نمای کلی Plugin SDK](/fa/plugins/sdk-overview)
- [نقطه‌های ورود Plugin](/fa/plugins/sdk-entrypoints)
- [hookهای داخلی](/fa/automation/hooks)
- [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals)
