---
read_when:
    - شما در حال تغییر زمان اجرای عامل تعبیه‌شده یا رجیستری هارنس هستید
    - در حال ثبت یک هارنس عامل از یک Plugin باندل‌شده یا مورد اعتماد هستید
    - باید بدانید Codex Plugin چگونه با ارائه‌دهندگان مدل ارتباط دارد
sidebarTitle: Agent Harness
summary: سطح آزمایشی SDK برای Pluginهایی که اجراکنندهٔ عامل تعبیه‌شدهٔ سطح پایین را جایگزین می‌کنند
title: Pluginهای هارنس عامل
x-i18n:
    generated_at: "2026-05-10T19:57:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

یک **هارنس عامل** اجراکنندهٔ سطح پایین برای یک نوبت آماده‌شدهٔ عامل OpenClaw است. این نه یک ارائه‌دهندهٔ مدل است، نه یک کانال، و نه یک رجیستری ابزار.
برای مدل ذهنی کاربرمحور، [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را ببینید.

از این سطح فقط برای Pluginهای باندل‌شده یا بومیِ مورد اعتماد استفاده کنید. قرارداد هنوز آزمایشی است، چون نوع‌های پارامترها عمداً بازتاب‌دهندهٔ اجراکنندهٔ تعبیه‌شدهٔ فعلی هستند.

## چه زمانی از هارنس استفاده کنیم

وقتی یک خانوادهٔ مدل زمان‌اجرای نشست بومی خودش را دارد و انتقال‌دهندهٔ معمول ارائه‌دهندهٔ OpenClaw انتزاع درستی نیست، یک هارنس عامل ثبت کنید.

نمونه‌ها:

- یک سرور عامل کدنویسی بومی که مالک رشته‌ها و Compaction است
- یک CLI یا daemon محلی که باید رویدادهای بومی برنامه/استدلال/ابزار را استریم کند
- یک زمان‌اجرای مدل که علاوه بر رونوشت نشست OpenClaw به شناسهٔ ازسرگیری خودش نیاز دارد

صرفاً برای افزودن یک API جدید LLM هارنس ثبت **نکنید**. برای APIهای معمول مدل مبتنی بر HTTP یا WebSocket، یک [Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) بسازید.

## آنچه هسته همچنان مالک آن است

پیش از انتخاب یک هارنس، OpenClaw از قبل موارد زیر را resolve کرده است:

- ارائه‌دهنده و مدل
- وضعیت احراز هویت زمان‌اجرا
- سطح تفکر و بودجهٔ زمینه
- فایل رونوشت/نشست OpenClaw
- فضای کاری، sandbox، و سیاست ابزار
- callbackهای پاسخ کانال و callbackهای استریم
- سیاست fallback مدل و تعویض زندهٔ مدل

این تفکیک عمدی است. هارنس یک تلاش آماده‌شده را اجرا می‌کند؛ ارائه‌دهنده‌ها را انتخاب نمی‌کند، تحویل کانال را جایگزین نمی‌کند، و مدل‌ها را بی‌صدا عوض نمی‌کند.

تلاش آماده‌شده همچنین شامل `params.runtimePlan` است؛ یک بستهٔ سیاست تحت مالکیت OpenClaw برای تصمیم‌های زمان‌اجرا که باید میان PI و هارنس‌های بومی مشترک بماند:

- `runtimePlan.tools.normalize(...)` و
  `runtimePlan.tools.logDiagnostics(...)` برای سیاست schema ابزار آگاه از ارائه‌دهنده
- `runtimePlan.transcript.resolvePolicy(...)` برای پاک‌سازی رونوشت و
  سیاست تعمیر فراخوانی ابزار
- `runtimePlan.delivery.isSilentPayload(...)` برای `NO_REPLY` مشترک و جلوگیری از
  تحویل رسانه
- `runtimePlan.outcome.classifyRunResult(...)` برای دسته‌بندی fallback مدل
- `runtimePlan.observability` برای metadata resolveشدهٔ ارائه‌دهنده/مدل/هارنس

هارنس‌ها ممکن است برای تصمیم‌هایی که باید با رفتار PI همخوان باشند از این برنامه استفاده کنند، اما همچنان باید آن را وضعیت تلاش تحت مالکیت میزبان بدانند. آن را mutate نکنید و از آن برای تعویض ارائه‌دهنده‌ها/مدل‌ها داخل یک نوبت استفاده نکنید.

## ثبت یک هارنس

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## سیاست انتخاب

OpenClaw پس از resolve شدن ارائه‌دهنده/مدل، یک هارنس انتخاب می‌کند:

1. سیاست زمان‌اجرای scoped به مدل اولویت دارد.
2. سیاست زمان‌اجرای scoped به ارائه‌دهنده در رتبهٔ بعدی می‌آید.
3. `auto` از هارنس‌های ثبت‌شده می‌پرسد که آیا از ارائه‌دهنده/مدل resolveشده پشتیبانی می‌کنند یا نه.
4. اگر هیچ هارنس ثبت‌شده‌ای match نشود، OpenClaw از PI استفاده می‌کند مگر اینکه fallback به PI غیرفعال شده باشد.

خرابی‌های هارنس Plugin به‌صورت خرابی اجرا ظاهر می‌شوند. در حالت `auto`، fallback به PI فقط زمانی استفاده می‌شود که هیچ هارنس Plugin ثبت‌شده‌ای از ارائه‌دهنده/مدل resolveشده پشتیبانی نکند. وقتی یک هارنس Plugin یک اجرا را claim کرد، OpenClaw همان نوبت را دوباره از طریق PI اجرا نمی‌کند، چون این کار می‌تواند معناشناسی احراز هویت/زمان‌اجرا را تغییر دهد یا side effectها را تکراری کند.

pinهای زمان‌اجرای کل نشست و کل عامل در انتخاب نادیده گرفته می‌شوند. این شامل مقدارهای کهنهٔ `agentHarnessId` نشست، `agents.defaults.agentRuntime`، `agents.list[].agentRuntime`، و `OPENCLAW_AGENT_RUNTIME` می‌شود. `/status` زمان‌اجرای مؤثر انتخاب‌شده از مسیر ارائه‌دهنده/مدل را نشان می‌دهد.
اگر هارنس انتخاب‌شده غیرمنتظره است، logging دیباگ `agents/harness` را فعال کنید و رکورد ساختاریافتهٔ `agent harness selected` در gateway را بررسی کنید. این رکورد شامل شناسهٔ هارنس انتخاب‌شده، دلیل انتخاب، سیاست زمان‌اجرا/fallback، و در حالت `auto`، نتیجهٔ پشتیبانی هر candidate Plugin است.

Plugin باندل‌شدهٔ Codex شناسهٔ هارنس خود را با `codex` ثبت می‌کند. هسته با آن مثل یک شناسهٔ هارنس Plugin عادی رفتار می‌کند؛ aliasهای اختصاصی Codex باید در Plugin یا config اپراتور باشند، نه در selector زمان‌اجرای مشترک.

## جفت‌سازی ارائه‌دهنده به‌علاوهٔ هارنس

بیشتر هارنس‌ها باید یک ارائه‌دهنده هم ثبت کنند. ارائه‌دهنده refهای مدل، وضعیت احراز هویت، metadata مدل، و انتخاب `/model` را برای بقیهٔ OpenClaw قابل مشاهده می‌کند. سپس هارنس آن ارائه‌دهنده را در `supports(...)` claim می‌کند.

Plugin باندل‌شدهٔ Codex از همین الگو پیروی می‌کند:

- refهای مدل ترجیحی کاربر: `openai/gpt-5.5`
- refهای سازگاری: refهای legacy `codex/gpt-*` همچنان پذیرفته می‌شوند، اما configهای جدید نباید از آن‌ها به‌عنوان refهای معمول ارائه‌دهنده/مدل استفاده کنند
- شناسهٔ هارنس: `codex`
- احراز هویت: دسترس‌پذیری مصنوعی ارائه‌دهنده، چون هارنس Codex مالک login/نشست بومی Codex است
- درخواست app-server: OpenClaw شناسهٔ خام مدل را به Codex می‌فرستد و می‌گذارد هارنس با پروتکل بومی app-server صحبت کند

Plugin Codex افزایشی است. refهای عامل سادهٔ `openai/gpt-*` روی ارائه‌دهندهٔ رسمی OpenAI به‌طور پیش‌فرض هارنس Codex را انتخاب می‌کنند. refهای قدیمی‌تر `codex/gpt-*` همچنان برای سازگاری ارائه‌دهنده و هارنس Codex را انتخاب می‌کنند.

برای setup اپراتور، نمونه‌های prefix مدل، و configهای فقط Codex، [هارنس Codex](/fa/plugins/codex-harness) را ببینید.

OpenClaw به app-server نسخهٔ `0.125.0` یا جدیدتر Codex نیاز دارد. Plugin Codex handshake آغازین app-server را بررسی می‌کند و سرورهای قدیمی‌تر یا بدون نسخه را مسدود می‌کند تا OpenClaw فقط در برابر سطح پروتکلی اجرا شود که با آن تست شده است. کف `0.125.0` شامل پشتیبانی payload قلاب بومی MCP است که در Codex `0.124.0` وارد شد، در حالی که OpenClaw را به خط پایدار جدیدترِ تست‌شده pin می‌کند.

### میان‌افزار نتیجهٔ ابزار

Pluginهای باندل‌شده می‌توانند از طریق `api.registerAgentToolResultMiddleware(...)` میان‌افزار نتیجهٔ ابزار خنثی نسبت به زمان‌اجرا را attach کنند، به‌شرطی که manifest آن‌ها شناسه‌های زمان‌اجرای هدف‌گیری‌شده را در `contracts.agentToolResultMiddleware` اعلام کند. این seam مورد اعتماد برای transformهای async نتیجهٔ ابزار است که باید پیش از اینکه PI یا Codex خروجی ابزار را دوباره به مدل بدهد اجرا شوند.

Pluginهای باندل‌شدهٔ legacy همچنان می‌توانند از `api.registerCodexAppServerExtensionFactory(...)` برای میان‌افزار فقط مخصوص app-server Codex استفاده کنند، اما transformهای نتیجهٔ جدید باید از API خنثی نسبت به زمان‌اجرا استفاده کنند.
قلاب فقط Pi با نام `api.registerEmbeddedExtensionFactory(...)` حذف شده است؛ transformهای نتیجهٔ ابزار Pi باید از میان‌افزار خنثی نسبت به زمان‌اجرا استفاده کنند.

### دسته‌بندی نتیجهٔ پایانی

هارنس‌های بومی که مالک projection پروتکل خودشان هستند می‌توانند وقتی یک نوبت کامل‌شده هیچ متن دستیار قابل مشاهده‌ای تولید نکرده است، از `classifyAgentHarnessTerminalOutcome(...)` از `openclaw/plugin-sdk/agent-harness-runtime` استفاده کنند. این helper مقدار `empty`، `reasoning-only`، یا `planning-only` را برمی‌گرداند تا سیاست fallback OpenClaw بتواند تصمیم بگیرد آیا روی مدل دیگری retry کند یا نه. این helper عمداً خطاهای prompt، نوبت‌های در حال اجرا، و پاسخ‌های خاموش عمدی مانند `NO_REPLY` را دسته‌بندی‌نشده باقی می‌گذارد.

### حالت هارنس بومی Codex

هارنس باندل‌شدهٔ `codex` حالت بومی Codex برای نوبت‌های عامل تعبیه‌شدهٔ OpenClaw است. ابتدا Plugin باندل‌شدهٔ `codex` را فعال کنید، و اگر config شما از allowlist محدودکننده استفاده می‌کند، `codex` را در `plugins.allow` وارد کنید. configهای app-server بومی باید از `openai/gpt-*` استفاده کنند؛ نوبت‌های عامل OpenAI به‌طور پیش‌فرض هارنس Codex را انتخاب می‌کنند. مسیرهای legacy `openai-codex/*` باید با `openclaw doctor --fix` تعمیر شوند، و refهای مدل legacy `codex/*` به‌عنوان aliasهای سازگاری برای هارنس بومی باقی می‌مانند.

وقتی این حالت اجرا می‌شود، Codex مالک شناسهٔ thread بومی، رفتار resume، Compaction، و اجرای app-server است. OpenClaw همچنان مالک کانال chat، mirror رونوشت قابل مشاهده، سیاست ابزار، approvalها، تحویل رسانه، و انتخاب نشست است. وقتی لازم دارید ثابت کنید که فقط مسیر app-server Codex می‌تواند اجرا را claim کند، از provider/model `agentRuntime.id: "codex"` استفاده کنید. زمان‌اجراهای Plugin صریح fail closed می‌شوند؛ خرابی‌های انتخاب app-server Codex و خرابی‌های زمان‌اجرا از طریق PI retry نمی‌شوند.

## سخت‌گیری زمان‌اجرا

به‌طور پیش‌فرض، OpenClaw از سیاست زمان‌اجرای ارائه‌دهنده/مدل `auto` استفاده می‌کند: هارنس‌های Plugin ثبت‌شده می‌توانند یک جفت ارائه‌دهنده/مدل را claim کنند، و وقتی هیچ‌کدام match نشوند PI نوبت را مدیریت می‌کند. refهای عامل OpenAI روی ارائه‌دهندهٔ رسمی OpenAI به‌طور پیش‌فرض به Codex می‌روند. وقتی نبود انتخاب هارنس باید به‌جای مسیریابی از طریق PI باعث failure شود، از یک زمان‌اجرای Plugin صریح برای ارائه‌دهنده/مدل مانند `agentRuntime.id: "codex"` استفاده کنید. خرابی‌های هارنس Plugin انتخاب‌شده همیشه hard fail می‌شوند. این مورد یک provider/model صریح با `agentRuntime.id: "pi"` را مسدود نمی‌کند.

برای اجراهای تعبیه‌شدهٔ فقط Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

اگر برای یک مدل canonical یک backend مبتنی بر CLI می‌خواهید، زمان‌اجرا را روی همان ورودی مدل بگذارید:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

overrideهای هر عامل از همان شکل scoped به مدل استفاده می‌کنند:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

نمونه‌های زمان‌اجرای legacy برای کل عامل مانند این نادیده گرفته می‌شوند:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

با یک زمان‌اجرای Plugin صریح، وقتی هارنس درخواست‌شده ثبت نشده باشد، از ارائه‌دهنده/مدل resolveشده پشتیبانی نکند، یا پیش از تولید side effectهای نوبت fail شود، نشست زود fail می‌شود. این رفتار برای deploymentهای فقط Codex و برای تست‌های live که باید ثابت کنند مسیر app-server Codex واقعاً در حال استفاده است، عمدی است.

این تنظیم فقط هارنس عامل تعبیه‌شده را کنترل می‌کند. این تنظیم مسیریابی مدل اختصاصی ارائه‌دهنده برای تصویر، ویدیو، موسیقی، TTS، PDF، یا موارد دیگر را غیرفعال نمی‌کند.

## نشست‌های بومی و mirror رونوشت

یک هارنس ممکن است یک شناسهٔ نشست بومی، شناسهٔ thread، یا token resume سمت daemon نگه دارد. آن binding را صریحاً با نشست OpenClaw مرتبط نگه دارید، و خروجی دستیار/ابزار قابل مشاهده برای کاربر را همچنان به رونوشت OpenClaw mirror کنید.

رونوشت OpenClaw لایهٔ سازگاری برای موارد زیر باقی می‌ماند:

- تاریخچهٔ نشست قابل مشاهده در کانال
- جست‌وجو و indexing رونوشت
- برگشت به هارنس PI داخلی در یک نوبت بعدی
- رفتار عمومی `/new`، `/reset`، و حذف نشست

اگر هارنس شما یک binding جانبی ذخیره می‌کند، `reset(...)` را پیاده‌سازی کنید تا OpenClaw بتواند هنگام reset شدن نشست OpenClaw مالک، آن را پاک کند.

## نتایج ابزار و رسانه

هسته فهرست ابزار OpenClaw را می‌سازد و آن را به تلاش آماده‌شده پاس می‌دهد. وقتی یک هارنس یک فراخوانی ابزار پویا را اجرا می‌کند، به‌جای اینکه خودتان رسانهٔ کانال را ارسال کنید، نتیجهٔ ابزار را از طریق شکل نتیجهٔ هارنس برگردانید.

این کار خروجی‌های متن، تصویر، ویدیو، موسیقی، TTS، approval، و ابزار پیام‌رسانی را روی همان مسیر تحویل اجراهای پشتیبانی‌شده با PI نگه می‌دارد.

## محدودیت‌های فعلی

- مسیر import عمومی generic است، اما برخی aliasهای نوع تلاش/نتیجه همچنان برای سازگاری نام‌های `Pi` را دارند.
- نصب هارنس شخص ثالث آزمایشی است. تا زمانی که به یک زمان‌اجرای نشست بومی نیاز ندارید، Pluginهای ارائه‌دهنده را ترجیح دهید.
- تعویض هارنس‌ها در میان نوبت‌ها پشتیبانی می‌شود. پس از شروع ابزارهای بومی، approvalها، متن دستیار، یا ارسال پیام، در میانهٔ یک نوبت هارنس‌ها را عوض نکنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview)
- [کمک‌کارهای زمان اجرا](/fa/plugins/sdk-runtime)
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)
- [هارنس Codex](/fa/plugins/codex-harness)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
