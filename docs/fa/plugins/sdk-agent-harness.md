---
read_when:
    - شما در حال تغییر زمان اجرای عامل تعبیه‌شده یا رجیستری هارنس هستید
    - شما در حال ثبت یک هارنس عامل از یک Plugin همراه یا مورد اعتماد هستید
    - باید بفهمید که Plugin Codex چگونه به ارائه‌دهندگان مدل مربوط می‌شود
sidebarTitle: Agent Harness
summary: سطح آزمایشی SDK برای Pluginهایی که اجراکنندهٔ تعبیه‌شدهٔ سطح پایین عامل را جایگزین می‌کنند
title: Pluginهای هارنس عامل
x-i18n:
    generated_at: "2026-05-02T11:57:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

یک **هارنس عامل** اجراکنندهٔ سطح پایین برای یک نوبت آماده‌شدهٔ عامل OpenClaw است. این یک ارائه‌دهندهٔ مدل، کانال، یا رجیستری ابزار نیست. برای مدل ذهنی کاربرمحور، [زمان‌اجرای عامل‌ها](/fa/concepts/agent-runtimes) را ببینید.

از این سطح فقط برای Pluginهای باندل‌شده یا بومیِ مورداعتماد استفاده کنید. این قرارداد هنوز آزمایشی است، چون نوع‌های پارامترها عمداً بازتاب‌دهندهٔ رانر تعبیه‌شدهٔ فعلی هستند.

## چه زمانی از هارنس استفاده کنیم

وقتی یک خانوادهٔ مدل زمان‌اجرای نشست بومی خودش را دارد و انتقال عادی ارائه‌دهندهٔ OpenClaw انتزاع درستی نیست، یک هارنس عامل ثبت کنید.

نمونه‌ها:

- یک سرور عامل کدنویسی بومی که مالک threadها و compaction است
- یک CLI یا daemon محلی که باید رویدادهای بومی برنامه/استدلال/ابزار را stream کند
- زمان‌اجرای مدلی که علاوه بر رونوشت نشست OpenClaw به resume id خودش نیاز دارد

فقط برای افزودن یک LLM API جدید هارنس ثبت نکنید. برای APIهای مدل عادی مبتنی بر HTTP یا WebSocket، یک [Plugin ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) بسازید.

## Core همچنان مالک چیست

پیش از انتخاب هارنس، OpenClaw این موارد را از قبل resolve کرده است:

- ارائه‌دهنده و مدل
- وضعیت احراز هویت زمان‌اجرا
- سطح تفکر و بودجهٔ context
- فایل رونوشت/نشست OpenClaw
- workspace، sandbox، و سیاست ابزار
- callbackهای پاسخ کانال و callbackهای streaming
- سیاست fallback مدل و جابه‌جایی زندهٔ مدل

این تفکیک عمدی است. هارنس یک تلاش آماده‌شده را اجرا می‌کند؛ ارائه‌دهنده انتخاب نمی‌کند، تحویل کانال را جایگزین نمی‌کند، یا مدل‌ها را بی‌صدا عوض نمی‌کند.

تلاش آماده‌شده همچنین شامل `params.runtimePlan` است؛ یک بستهٔ سیاستی متعلق به OpenClaw برای تصمیم‌های زمان‌اجرا که باید بین PI و هارنس‌های بومی مشترک بماند:

- `runtimePlan.tools.normalize(...)` و
  `runtimePlan.tools.logDiagnostics(...)` برای سیاست schema ابزار آگاه از ارائه‌دهنده
- `runtimePlan.transcript.resolvePolicy(...)` برای پاک‌سازی رونوشت و
  سیاست ترمیم tool-call
- `runtimePlan.delivery.isSilentPayload(...)` برای `NO_REPLY` مشترک و سرکوب
  تحویل رسانه
- `runtimePlan.outcome.classifyRunResult(...)` برای دسته‌بندی fallback مدل
- `runtimePlan.observability` برای metadata ارائه‌دهنده/مدل/هارنس resolveشده

هارنس‌ها می‌توانند از plan برای تصمیم‌هایی استفاده کنند که باید با رفتار PI همخوان باشند، اما همچنان باید با آن مثل وضعیت تلاشِ متعلق به میزبان برخورد کنند. آن را mutate نکنید یا از آن برای تغییر ارائه‌دهنده‌ها/مدل‌ها داخل یک نوبت استفاده نکنید.

## ثبت هارنس

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

1. شناسهٔ هارنس ثبت‌شدهٔ یک نشست موجود برنده است، بنابراین تغییرات config/env آن رونوشت را به‌صورت hot-switch به زمان‌اجرای دیگری منتقل نمی‌کنند.
2. `OPENCLAW_AGENT_RUNTIME=<id>` برای نشست‌هایی که هنوز pin نشده‌اند، یک هارنس ثبت‌شده با آن شناسه را اجبار می‌کند.
3. `OPENCLAW_AGENT_RUNTIME=pi` هارنس داخلی PI را اجبار می‌کند.
4. `OPENCLAW_AGENT_RUNTIME=auto` از هارنس‌های ثبت‌شده می‌پرسد آیا از ارائه‌دهنده/مدل resolveشده پشتیبانی می‌کنند.
5. اگر هیچ هارنس ثبت‌شده‌ای match نشود، OpenClaw از PI استفاده می‌کند، مگر اینکه fallback به PI غیرفعال شده باشد.

شکست‌های هارنس Plugin به‌صورت شکست اجرا ظاهر می‌شوند. در حالت `auto`، fallback به PI فقط وقتی استفاده می‌شود که هیچ هارنس Plugin ثبت‌شده‌ای از ارائه‌دهنده/مدل resolveشده پشتیبانی نکند. وقتی یک هارنس Plugin اجرای را claim کرده باشد، OpenClaw همان نوبت را دوباره از طریق PI اجرا نمی‌کند، چون این کار می‌تواند معناشناسی احراز هویت/زمان‌اجرا را تغییر دهد یا side effectها را تکرار کند.

شناسهٔ هارنس انتخاب‌شده پس از یک اجرای تعبیه‌شده همراه شناسهٔ نشست persist می‌شود. نشست‌های legacy که پیش از pinهای هارنس ساخته شده‌اند، وقتی تاریخچهٔ رونوشت داشته باشند به‌عنوان PI-pinned در نظر گرفته می‌شوند. هنگام تغییر بین PI و یک هارنس Plugin بومی، از نشست جدید/بازنشانی‌شده استفاده کنید. `/status` شناسه‌های هارنس غیرپیش‌فرض مانند `codex` را کنار `Fast` نشان می‌دهد؛ PI پنهان می‌ماند چون مسیر سازگاری پیش‌فرض است. اگر هارنس انتخاب‌شده غیرمنتظره است، logging اشکال‌زدایی `agents/harness` را فعال کنید و رکورد ساختاریافتهٔ `agent harness selected` در gateway را بررسی کنید. این رکورد شامل شناسهٔ هارنس انتخاب‌شده، دلیل انتخاب، سیاست زمان‌اجرا/fallback، و در حالت `auto`، نتیجهٔ پشتیبانی هر candidate Plugin است.

Plugin باندل‌شدهٔ Codex، `codex` را به‌عنوان شناسهٔ هارنس خود ثبت می‌کند. Core با آن مثل یک شناسهٔ هارنس Plugin عادی برخورد می‌کند؛ aliasهای مخصوص Codex به Plugin یا config اپراتور تعلق دارند، نه به انتخابگر زمان‌اجرای مشترک.

## جفت‌سازی ارائه‌دهنده و هارنس

بیشتر هارنس‌ها باید یک ارائه‌دهنده هم ثبت کنند. ارائه‌دهنده model refها، وضعیت احراز هویت، metadata مدل، و انتخاب `/model` را برای بقیهٔ OpenClaw قابل مشاهده می‌کند. سپس هارنس آن ارائه‌دهنده را در `supports(...)` claim می‌کند.

Plugin باندل‌شدهٔ Codex از این الگو پیروی می‌کند:

- model refهای ترجیحی کاربر: `openai/gpt-5.5` به‌علاوهٔ
  `agentRuntime.id: "codex"`
- refهای سازگاری: refهای legacy با قالب `codex/gpt-*` همچنان پذیرفته می‌شوند، اما configهای جدید نباید از آن‌ها به‌عنوان refهای عادی ارائه‌دهنده/مدل استفاده کنند
- شناسهٔ هارنس: `codex`
- احراز هویت: دسترس‌پذیری مصنوعی ارائه‌دهنده، چون هارنس Codex مالک login/نشست بومی Codex است
- درخواست app-server: OpenClaw شناسهٔ خام مدل را به Codex می‌فرستد و اجازه می‌دهد هارنس با پروتکل بومی app-server صحبت کند

Plugin Codex افزایشی است. refهای سادهٔ `openai/gpt-*` همچنان از مسیر عادی ارائه‌دهندهٔ OpenClaw استفاده می‌کنند، مگر اینکه هارنس Codex را با `agentRuntime.id: "codex"` اجبار کنید. refهای قدیمی‌تر `codex/gpt-*` هنوز برای سازگاری، ارائه‌دهنده و هارنس Codex را انتخاب می‌کنند.

برای راه‌اندازی اپراتور، نمونه‌های prefix مدل، و configهای مخصوص Codex، [هارنس Codex](/fa/plugins/codex-harness) را ببینید.

OpenClaw به Codex app-server نسخهٔ `0.125.0` یا جدیدتر نیاز دارد. Plugin Codex، handshake راه‌اندازی app-server را بررسی می‌کند و سرورهای قدیمی‌تر یا بدون نسخه را block می‌کند تا OpenClaw فقط در برابر سطح پروتکلی اجرا شود که با آن تست شده است. کف `0.125.0` شامل پشتیبانی payload hook بومی MCP است که در Codex `0.124.0` اضافه شد، درحالی‌که OpenClaw را به خط پایدار جدیدترِ تست‌شده pin می‌کند.

### Middleware نتیجهٔ ابزار

Pluginهای باندل‌شده می‌توانند از طریق `api.registerAgentToolResultMiddleware(...)`، وقتی manifest آن‌ها شناسه‌های زمان‌اجرای هدف را در `contracts.agentToolResultMiddleware` اعلام می‌کند، middleware نتیجهٔ ابزارِ خنثی نسبت به زمان‌اجرا attach کنند. این seam مورداعتماد برای transformهای async نتیجهٔ ابزار است که باید پیش از اینکه PI یا Codex خروجی ابزار را به مدل برگرداند اجرا شوند.

Pluginهای باندل‌شدهٔ legacy همچنان می‌توانند از `api.registerCodexAppServerExtensionFactory(...)` برای middleware مخصوص Codex app-server استفاده کنند، اما transformهای نتیجهٔ جدید باید از API خنثی نسبت به زمان‌اجرا استفاده کنند. hook مخصوص Pi با نام `api.registerEmbeddedExtensionFactory(...)` حذف شده است؛ transformهای نتیجهٔ ابزار Pi باید از middleware خنثی نسبت به زمان‌اجرا استفاده کنند.

### دسته‌بندی خروجی پایانی

هارنس‌های بومی که projection پروتکل خودشان را مالک هستند، وقتی یک نوبت کامل‌شده هیچ متن دستیار قابل مشاهده‌ای تولید نکرده باشد، می‌توانند از `classifyAgentHarnessTerminalOutcome(...)` از `openclaw/plugin-sdk/agent-harness-runtime` استفاده کنند. این helper مقدار `empty`، `reasoning-only`، یا `planning-only` را برمی‌گرداند تا سیاست fallback OpenClaw بتواند تصمیم بگیرد آیا روی مدلی دیگر retry کند یا نه. این helper عمداً خطاهای prompt، نوبت‌های در حال اجرا، و پاسخ‌های سکوت عمدی مانند `NO_REPLY` را دسته‌بندی‌نشده می‌گذارد.

### حالت هارنس بومی Codex

هارنس باندل‌شدهٔ `codex` حالت بومی Codex برای نوبت‌های عامل تعبیه‌شدهٔ OpenClaw است. ابتدا Plugin باندل‌شدهٔ `codex` را فعال کنید، و اگر config شما از allowlist محدودکننده استفاده می‌کند، `codex` را در `plugins.allow` قرار دهید. configهای app-server بومی باید از `openai/gpt-*` همراه `agentRuntime.id: "codex"` استفاده کنند. برای OAuth مربوط به Codex از طریق PI از `openai-codex/*` استفاده کنید. model refهای legacy با قالب `codex/*` همچنان aliasهای سازگاری برای هارنس بومی هستند.

وقتی این حالت اجرا می‌شود، Codex مالک شناسهٔ thread بومی، رفتار resume، compaction، و اجرای app-server است. OpenClaw همچنان مالک کانال chat، mirror رونوشت قابل مشاهده، سیاست ابزار، تأییدها، تحویل رسانه، و انتخاب نشست است. وقتی باید ثابت کنید فقط مسیر Codex app-server می‌تواند اجرا را claim کند، از `agentRuntime.id: "codex"` بدون override برای `fallback` استفاده کنید. زمان‌اجراهای Plugin صریح، به‌طور پیش‌فرض fail closed هستند. فقط وقتی `fallback: "pi"` را تنظیم کنید که عمداً می‌خواهید PI انتخاب هارنسِ موجود نیست را handle کند. شکست‌های Codex app-server از قبل مستقیماً fail می‌شوند و از طریق PI retry نمی‌شوند.

## غیرفعال کردن fallback به PI

به‌طور پیش‌فرض، OpenClaw عامل‌های تعبیه‌شده را با `agents.defaults.agentRuntime` تنظیم‌شده روی `{ id: "auto", fallback: "pi" }` اجرا می‌کند. در حالت `auto`، هارنس‌های Plugin ثبت‌شده می‌توانند یک جفت ارائه‌دهنده/مدل را claim کنند. اگر هیچ‌کدام match نشوند، OpenClaw به PI fallback می‌کند.

در حالت `auto`، وقتی می‌خواهید انتخاب نشدن هارنس Plugin به‌جای استفاده از PI fail شود، `fallback: "none"` را تنظیم کنید. زمان‌اجراهای Plugin صریح مانند `agentRuntime.id: "codex"` از قبل به‌طور پیش‌فرض fail closed هستند، مگر اینکه `fallback: "pi"` در همان scope مربوط به config یا override محیط تنظیم شده باشد. شکست‌های هارنس Plugin انتخاب‌شده همیشه hard fail می‌شوند. این موضوع یک `agentRuntime.id: "pi"` صریح یا `OPENCLAW_AGENT_RUNTIME=pi` را block نمی‌کند.

برای اجراهای تعبیه‌شدهٔ فقط Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

اگر می‌خواهید هر هارنس Plugin ثبت‌شده‌ای مدل‌های matching را claim کند اما هرگز نمی‌خواهید OpenClaw بی‌صدا به PI fallback کند، `runtime: "auto"` را نگه دارید و fallback را غیرفعال کنید:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

overrideهای هر عامل از همان شکل استفاده می‌کنند:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` همچنان زمان‌اجرای پیکربندی‌شده را override می‌کند. برای غیرفعال کردن fallback به PI از محیط، از `OPENCLAW_AGENT_HARNESS_FALLBACK=none` استفاده کنید.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

با fallback غیرفعال، وقتی هارنس درخواست‌شده ثبت نشده باشد، از ارائه‌دهنده/مدل resolveشده پشتیبانی نکند، یا پیش از تولید side effectهای نوبت fail شود، نشست زودهنگام fail می‌شود. این رفتار برای استقرارهای فقط Codex و برای تست‌های زنده‌ای که باید ثابت کنند مسیر Codex app-server واقعاً در حال استفاده است، عمدی است.

این تنظیم فقط هارنس عامل تعبیه‌شده را کنترل می‌کند. این مسیر‌دهی مدلِ مخصوص ارائه‌دهنده برای تصویر، ویدئو، موسیقی، TTS، PDF، یا موارد دیگر را غیرفعال نمی‌کند.

## نشست‌های بومی و mirror رونوشت

یک هارنس می‌تواند یک شناسهٔ نشست بومی، شناسهٔ thread، یا token resume سمت daemon نگه دارد. آن binding را به‌طور صریح با نشست OpenClaw مرتبط نگه دارید، و خروجی قابل مشاهدهٔ کاربر برای دستیار/ابزار را همچنان در رونوشت OpenClaw mirror کنید.

رونوشت OpenClaw همچنان لایهٔ سازگاری برای این موارد است:

- تاریخچهٔ نشست قابل مشاهده در کانال
- جست‌وجو و indexing رونوشت
- بازگشت به هارنس داخلی PI در یک نوبت بعدی
- رفتار عمومی `/new`، `/reset`، و حذف نشست

اگر هارنس شما یک binding جانبی ذخیره می‌کند، `reset(...)` را پیاده‌سازی کنید تا OpenClaw بتواند هنگام بازنشانی نشست مالک OpenClaw آن را پاک کند.

## نتایج ابزار و رسانه

Core فهرست ابزارهای OpenClaw را می‌سازد و آن را به تلاش آماده‌شده می‌دهد.
وقتی یک هارنس فراخوانی پویای ابزار را اجرا می‌کند، نتیجه‌ی ابزار را از طریق
ساختار نتیجه‌ی هارنس برگردانید، نه اینکه خودتان رسانه‌ی کانال را ارسال کنید.

این کار خروجی‌های متن، تصویر، ویدیو، موسیقی، TTS، تأیید، و ابزار پیام‌رسانی را
در همان مسیر تحویل اجراهای پشتیبانی‌شده با PI نگه می‌دارد.

## محدودیت‌های فعلی

- مسیر import عمومی کلی است، اما برخی نام‌های مستعار نوع تلاش/نتیجه هنوز برای
  سازگاری نام‌های `Pi` را دارند.
- نصب هارنس‌های شخص ثالث آزمایشی است. تا زمانی که به runtime نشست بومی نیاز ندارید،
  Pluginهای ارائه‌دهنده را ترجیح دهید.
- جابه‌جایی هارنس بین نوبت‌ها پشتیبانی می‌شود. پس از شروع ابزارهای بومی، تأییدها،
  متن دستیار، یا ارسال پیام، در میانه‌ی یک نوبت هارنس را عوض نکنید.

## مرتبط

- [نمای کلی SDK](/fa/plugins/sdk-overview)
- [کمک‌کننده‌های Runtime](/fa/plugins/sdk-runtime)
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins)
- [هارنس Codex](/fa/plugins/codex-harness)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
