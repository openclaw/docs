---
read_when:
    - شما در حال یکپارچه‌سازی رفتار چرخهٔ حیات موتور زمینه در چارچوب Codex هستید
    - برای کار با نشست‌های هارنس تعبیه‌شده‌ی codex/* به lossless-claw یا یک Plugin دیگر برای موتور زمینه نیاز دارید
    - شما در حال مقایسهٔ رفتار زمینه در PI تعبیه‌شده و سرور برنامهٔ Codex هستید
summary: مشخصات لازم برای اینکه هارنس app-server همراه Codex، Pluginهای موتور زمینه OpenClaw را رعایت کند
title: پورت موتور زمینهٔ چارچوب اجرایی Codex
x-i18n:
    generated_at: "2026-05-03T11:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## وضعیت

مشخصات پیاده‌سازی پیش‌نویس.

## هدف

واداشتن هارنس app-server داخلی Codex به رعایت همان قرارداد چرخه عمر موتور زمینه OpenClaw که turnهای PI جاسازی‌شده از قبل رعایت می‌کنند.

نشستی که از `agents.defaults.embeddedHarness.runtime: "codex"` یا یک مدل `codex/*` استفاده می‌کند همچنان باید اجازه دهد Plugin موتور زمینه انتخاب‌شده، مانند `lossless-claw`، تا جایی که مرز app-server در Codex اجازه می‌دهد، مونتاژ زمینه، دریافت پس از turn، نگهداری، و خط‌مشی Compaction در سطح OpenClaw را کنترل کند.

## غیرهدف‌ها

- پیاده‌سازی دوباره اجزای داخلی app-server در Codex انجام نشود.
- Compaction بومی thread در Codex وادار نشود که خلاصه `lossless-claw` تولید کند.
- مدل‌های غیر Codex ملزم به استفاده از هارنس Codex نشوند.
- رفتار نشست ACP/acpx تغییر نکند. این مشخصات فقط برای مسیر هارنس عامل جاسازی‌شده غیر ACP است.
- Pluginهای شخص ثالث وادار نشوند کارخانه‌های افزونه app-server در Codex را ثبت کنند؛ مرز اعتماد Pluginهای داخلی موجود بدون تغییر باقی می‌ماند.

## معماری فعلی

حلقه اجرای جاسازی‌شده موتور زمینه پیکربندی‌شده را یک بار در هر اجرا، پیش از انتخاب یک هارنس سطح پایین مشخص، resolve می‌کند:

- `src/agents/pi-embedded-runner/run.ts`
  - Pluginهای موتور زمینه را مقداردهی اولیه می‌کند
  - `resolveContextEngine(params.config)` را فراخوانی می‌کند
  - `contextEngine` و `contextTokenBudget` را به `runEmbeddedAttemptWithBackend(...)` پاس می‌دهد

`runEmbeddedAttemptWithBackend(...)` کار را به هارنس عامل انتخاب‌شده واگذار می‌کند:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

هارنس app-server در Codex توسط Plugin داخلی Codex ثبت می‌شود:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

پیاده‌سازی هارنس Codex همان `EmbeddedRunAttemptParams` را دریافت می‌کند که تلاش‌های مبتنی بر PI دریافت می‌کنند:

- `extensions/codex/src/app-server/run-attempt.ts`

یعنی نقطه hook مورد نیاز در کدی است که تحت کنترل OpenClaw قرار دارد. مرز خارجی خود پروتکل app-server در Codex است: OpenClaw می‌تواند کنترل کند چه چیزی به `thread/start`، `thread/resume` و `turn/start` می‌فرستد و می‌تواند اعلان‌ها را مشاهده کند، اما نمی‌تواند ذخیره thread داخلی Codex یا فشرده‌ساز بومی آن را تغییر دهد.

## شکاف فعلی

تلاش‌های PI جاسازی‌شده چرخه عمر موتور زمینه را مستقیما فراخوانی می‌کنند:

- bootstrap/maintenance پیش از تلاش
- assemble پیش از فراخوانی مدل
- afterTurn یا ingest پس از تلاش
- maintenance پس از یک turn موفق
- Compaction موتور زمینه برای موتورهایی که مالک Compaction هستند

کد مرتبط PI:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

تلاش‌های app-server در Codex در حال حاضر hookهای عمومی هارنس عامل را اجرا می‌کنند و transcript را mirror می‌کنند، اما `params.contextEngine.bootstrap`، `params.contextEngine.assemble`، `params.contextEngine.afterTurn`، `params.contextEngine.ingestBatch`، `params.contextEngine.ingest` یا `params.contextEngine.maintain` را فراخوانی نمی‌کنند.

کد مرتبط Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## رفتار مطلوب

برای turnهای هارنس Codex، OpenClaw باید این چرخه عمر را حفظ کند:

1. transcript نشست mirrorشده OpenClaw را بخواند.
2. وقتی فایل نشست قبلی وجود دارد، موتور زمینه فعال را bootstrap کند.
3. وقتی bootstrap maintenance موجود است، آن را اجرا کند.
4. زمینه را با استفاده از موتور زمینه فعال assemble کند.
5. زمینه assembleشده را به ورودی‌های سازگار با Codex تبدیل کند.
6. thread در Codex را با دستورالعمل‌های توسعه‌دهنده‌ای start یا resume کند که هر `systemPromptAddition` مربوط به موتور زمینه را شامل می‌شوند.
7. turn در Codex را با prompt روبه‌روی کاربر assembleشده start کند.
8. نتیجه Codex را دوباره در transcript OpenClaw mirror کند.
9. اگر `afterTurn` پیاده‌سازی شده است آن را فراخوانی کند، در غیر این صورت `ingestBatch`/`ingest` را با استفاده از snapshot transcript mirrorشده فراخوانی کند.
10. پس از turnهای موفق و abortنشده، turn maintenance را اجرا کند.
11. سیگنال‌های Compaction بومی Codex و hookهای Compaction در OpenClaw را حفظ کند.

## محدودیت‌های طراحی

### app-server در Codex برای وضعیت بومی thread مرجع باقی می‌ماند

Codex مالک thread بومی خود و هر تاریخچه توسعه‌یافته داخلی است. OpenClaw نباید تلاش کند تاریخچه داخلی app-server را تغییر دهد، مگر از طریق فراخوانی‌های پروتکل پشتیبانی‌شده.

mirror مربوط به transcript در OpenClaw منبع قابلیت‌های OpenClaw باقی می‌ماند:

- تاریخچه chat
- جستجو
- حسابداری `/new` و `/reset`
- تغییر مدل یا هارنس در آینده
- وضعیت Plugin موتور زمینه

### مونتاژ موتور زمینه باید به ورودی‌های Codex فرافکنی شود

رابط موتور زمینه `AgentMessage[]` مربوط به OpenClaw را برمی‌گرداند، نه patch برای thread در Codex. `turn/start` در app-server Codex ورودی فعلی کاربر را می‌پذیرد، در حالی که `thread/start` و `thread/resume` دستورالعمل‌های توسعه‌دهنده را می‌پذیرند.

بنابراین پیاده‌سازی به یک لایه projection نیاز دارد. نسخه اول امن باید از وانمود کردن به اینکه می‌تواند تاریخچه داخلی Codex را جایگزین کند پرهیز کند. باید زمینه assembleشده را به شکل prompt/دستورالعمل توسعه‌دهنده قطعی پیرامون turn فعلی تزریق کند.

### پایداری prompt-cache مهم است

برای موتورهایی مانند `lossless-claw`، زمینه assembleشده باید برای ورودی‌های بدون تغییر قطعی باشد. timestamp، id تصادفی، یا ترتیب غیرقطعی به متن زمینه تولیدشده اضافه نکنید.

### معناشناسی انتخاب runtime تغییر نمی‌کند

انتخاب هارنس همان‌طور که هست باقی می‌ماند:

- `runtime: "pi"` PI را اجباری می‌کند
- `runtime: "codex"` هارنس ثبت‌شده Codex را انتخاب می‌کند
- `runtime: "auto"` اجازه می‌دهد هارنس‌های Plugin ارائه‌دهندگان پشتیبانی‌شده را claim کنند
- اجراهای `auto` بدون match از PI استفاده می‌کنند

این کار آنچه پس از انتخاب هارنس Codex رخ می‌دهد را تغییر می‌دهد.

## طرح پیاده‌سازی

### 1. helperهای قابل استفاده مجدد تلاش موتور زمینه را export یا جابه‌جا کنید

امروز helperهای چرخه عمر قابل استفاده مجدد زیر runner مربوط به PI قرار دارند:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex نباید از مسیر پیاده‌سازی‌ای import کند که نامش PI را القا می‌کند، اگر بتوانیم از آن پرهیز کنیم.

یک ماژول بی‌طرف نسبت به هارنس بسازید، برای مثال:

- `src/agents/harness/context-engine-lifecycle.ts`

موارد زیر را جابه‌جا یا re-export کنید:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- یک wrapper کوچک پیرامون `runContextEngineMaintenance`

importهای PI را یا با re-export از فایل‌های قدیمی یا با به‌روزرسانی call siteهای PI در همان PR همچنان فعال نگه دارید.

نام helperهای بی‌طرف نباید به PI اشاره کنند.

نام‌های پیشنهادی:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. یک helper projection زمینه Codex اضافه کنید

یک ماژول جدید اضافه کنید:

- `extensions/codex/src/app-server/context-engine-projection.ts`

مسئولیت‌ها:

- `AgentMessage[]` assembleشده، تاریخچه mirrorشده اصلی، و prompt فعلی را بپذیرد.
- تعیین کند کدام زمینه به دستورالعمل‌های توسعه‌دهنده تعلق دارد و کدام به ورودی فعلی کاربر.
- prompt فعلی کاربر را به عنوان درخواست عملیاتی نهایی حفظ کند.
- پیام‌های قبلی را در قالبی پایدار و صریح render کند.
- از metadata ناپایدار پرهیز کند.

API پیشنهادی:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

projection اول پیشنهادی:

- `systemPromptAddition` را در دستورالعمل‌های توسعه‌دهنده قرار دهید.
- زمینه transcript assembleشده را پیش از prompt فعلی در `promptText` قرار دهید.
- آن را به‌روشنی به عنوان زمینه assembleشده OpenClaw برچسب‌گذاری کنید.
- prompt فعلی را در انتها نگه دارید.
- اگر prompt فعلی کاربر از قبل در انتهای tail ظاهر شده است، نسخه تکراری آن را حذف کنید.

شکل نمونه prompt:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

این از جراحی بومی تاریخچه Codex کم‌ظرافت‌تر است، اما درون OpenClaw قابل پیاده‌سازی است و معناشناسی موتور زمینه را حفظ می‌کند.

بهبود آینده: اگر app-server در Codex پروتکلی برای جایگزین کردن یا تکمیل کردن تاریخچه thread ارائه کند، این لایه projection را تغییر دهید تا از آن API استفاده کند.

### 3. bootstrap را پیش از startup thread در Codex متصل کنید

در `extensions/codex/src/app-server/run-attempt.ts`:

- تاریخچه نشست mirrorشده را مثل امروز بخوانید.
- تعیین کنید آیا فایل نشست پیش از این اجرا وجود داشته است. helperی را ترجیح دهید که پیش از نوشتن mirror، `fs.stat(params.sessionFile)` را بررسی می‌کند.
- یک `SessionManager` باز کنید یا اگر helper به آن نیاز دارد از یک adapter باریک session manager استفاده کنید.
- وقتی `params.contextEngine` وجود دارد، helper بی‌طرف bootstrap را فراخوانی کنید.

جریان شبه‌کد:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

از همان قرارداد `sessionKey` استفاده کنید که bridge ابزار Codex و mirror مربوط به transcript استفاده می‌کنند. امروز Codex، `sandboxSessionKey` را از `params.sessionKey` یا `params.sessionId` محاسبه می‌کند؛ مگر اینکه دلیلی برای حفظ `params.sessionKey` خام وجود داشته باشد، همان را به‌طور سازگار استفاده کنید.

### 4. assemble را پیش از `thread/start` / `thread/resume` و `turn/start` متصل کنید

در `runCodexAppServerAttempt`:

1. ابتدا ابزارهای dynamic را بسازید تا موتور زمینه نام واقعی ابزارهای در دسترس را ببیند.
2. تاریخچه نشست mirrorشده را بخوانید.
3. وقتی `params.contextEngine` وجود دارد، `assemble(...)` موتور زمینه را اجرا کنید.
4. نتیجه assembleشده را به موارد زیر project کنید:
   - افزوده دستورالعمل توسعه‌دهنده
   - متن prompt برای `turn/start`

فراخوانی hook موجود:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

باید context-aware شود:

1. دستورالعمل‌های توسعه‌دهنده پایه را با `buildDeveloperInstructions(params)` محاسبه کنید
2. assembly/projection موتور زمینه را اعمال کنید
3. `before_prompt_build` را با prompt/دستورالعمل‌های توسعه‌دهنده projectشده اجرا کنید

این ترتیب اجازه می‌دهد hookهای prompt عمومی همان promptی را ببینند که Codex دریافت خواهد کرد. اگر به برابری سخت‌گیرانه با PI نیاز داریم، assembly موتور زمینه را پیش از ترکیب hook اجرا کنید، چون PI، `systemPromptAddition` موتور زمینه را پس از pipeline مربوط به prompt خود، روی prompt سیستم نهایی اعمال می‌کند. اصل مهم این است که هم موتور زمینه و هم hookها ترتیب قطعی و مستندی دریافت کنند.

ترتیب پیشنهادی برای پیاده‌سازی اول:

1. `buildDeveloperInstructions(params)`
2. `assemble()` موتور زمینه
3. افزودن/پیشوند کردن `systemPromptAddition` به دستورالعمل‌های توسعه‌دهنده
4. project کردن پیام‌های assembleشده به متن prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. پاس دادن دستورالعمل‌های توسعه‌دهنده نهایی به `startOrResumeThread(...)`
7. پاس دادن متن prompt نهایی به `buildTurnStartParams(...)`

این مشخصات باید در تست‌ها کدگذاری شود تا تغییرات آینده تصادفا ترتیب آن را عوض نکنند.

### 5. قالب‌بندی پایدار prompt-cache را حفظ کنید

helper projection باید برای ورودی‌های یکسان خروجی byte-stable تولید کند:

- ترتیب پایدار پیام‌ها
- برچسب‌های نقش پایدار
- بدون timestamp تولیدشده
- بدون نشت ترتیب کلیدهای object
- بدون delimiter تصادفی
- بدون id مخصوص هر اجرا

از delimiterهای ثابت و بخش‌های صریح استفاده کنید.

### 6. post-turn را پس از mirroring transcript متصل کنید

`CodexAppServerEventProjector` در Codex یک `messagesSnapshot` محلی برای
نوبت فعلی می‌سازد. `mirrorTranscriptBestEffort(...)` آن snapshot را در
آینه رونوشت OpenClaw می‌نویسد.

پس از موفقیت یا شکست آینه‌سازی، نهایی‌ساز موتور زمینه را با بهترین snapshot
پیام موجود فراخوانی کنید:

- پس از نوشتن، زمینه کامل نشست آینه‌شده را ترجیح دهید، چون `afterTurn`
  انتظار snapshot نشست را دارد، نه فقط نوبت فعلی.
- اگر فایل نشست دوباره بازشدنی نیست، به `historyMessages + result.messagesSnapshot` برگردید.

جریان شبه‌کد:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

اگر آینه‌سازی شکست خورد، همچنان `afterTurn` را با snapshot جایگزین فراخوانی
کنید، اما ثبت کنید که موتور زمینه در حال دریافت داده از داده‌های جایگزین نوبت است.

### ۷. عادی‌سازی usage و زمینه زمان اجرای prompt-cache

نتایج Codex، وقتی در دسترس باشد، شامل usage عادی‌سازی‌شده از اعلان‌های توکن
app-server است. آن usage را به زمینه زمان اجرای موتور زمینه بدهید.

اگر app-server در Codex در آینده جزئیات خواندن/نوشتن cache را ارائه کند، آن‌ها را به
`ContextEnginePromptCacheInfo` نگاشت کنید. تا آن زمان، به‌جای ساختن صفرهای
ساختگی، `promptCache` را حذف کنید.

### ۸. سیاست Compaction

دو سامانه Compaction وجود دارد:

1. `compact()` موتور زمینه OpenClaw
2. `thread/compact/start` بومی app-server در Codex

آن‌ها را بی‌صدا با هم یکی نکنید.

#### `/compact` و Compaction صریح OpenClaw

وقتی موتور زمینه انتخاب‌شده `info.ownsCompaction === true` دارد، Compaction
صریح OpenClaw باید نتیجه `compact()` موتور زمینه را برای آینه رونوشت OpenClaw
و وضعیت Plugin ترجیح دهد.

وقتی هارنس Codex انتخاب‌شده یک اتصال بومی thread دارد، می‌توانیم علاوه بر آن
از Compaction بومی Codex درخواست کنیم تا thread مربوط به app-server سالم بماند،
اما این باید در جزئیات به‌عنوان یک اقدام جداگانه backend گزارش شود.

رفتار پیشنهادی:

- اگر `contextEngine.info.ownsCompaction === true`:
  - ابتدا `compact()` موتور زمینه را فراخوانی کنید
  - سپس وقتی اتصال thread وجود دارد، به‌شکل best-effort Compaction بومی Codex را فراخوانی کنید
  - نتیجه موتور زمینه را به‌عنوان نتیجه اصلی برگردانید
  - وضعیت Compaction بومی Codex را در `details.codexNativeCompaction` بگنجانید
- اگر موتور زمینه فعال مالک Compaction نیست:
  - رفتار فعلی Compaction بومی Codex را حفظ کنید

احتمالاً بسته به محل فراخوانی `maybeCompactAgentHarnessSession(...)`، این کار
نیازمند تغییر `extensions/codex/src/app-server/compact.ts` یا پیچیدن آن از مسیر
عمومی Compaction است.

#### رویدادهای درون‌نوبتی `contextCompaction` بومی Codex

Codex ممکن است در طول یک نوبت رویدادهای آیتم `contextCompaction` منتشر کند.
انتشار فعلی hookهای قبل/بعد از Compaction را در `event-projector.ts` نگه دارید،
اما آن را به‌عنوان Compaction تکمیل‌شده موتور زمینه تلقی نکنید.

برای موتورهایی که مالک Compaction هستند، وقتی Codex بااین‌حال Compaction بومی
انجام می‌دهد، یک diagnostic صریح منتشر کنید:

- نام stream/event: استفاده از stream موجود `compaction` قابل قبول است
- جزئیات: `{ backend: "codex-app-server", ownsCompaction: true }`

این جداسازی را قابل ممیزی می‌کند.

### ۹. رفتار بازنشانی نشست و اتصال

`reset(...)` موجود در هارنس Codex اتصال app-server در Codex را از فایل نشست
OpenClaw پاک می‌کند. این رفتار را حفظ کنید.

همچنین مطمئن شوید پاک‌سازی وضعیت موتور زمینه همچنان از مسیرهای موجود چرخه عمر
نشست OpenClaw انجام می‌شود. پاک‌سازی ویژه Codex اضافه نکنید مگر اینکه چرخه عمر
موتور زمینه در حال حاضر رویدادهای reset/delete را برای همه هارنس‌ها از دست بدهد.

### ۱۰. مدیریت خطا

از معناشناسی PI پیروی کنید:

- شکست‌های bootstrap هشدار می‌دهند و ادامه می‌دهند
- شکست‌های assemble هشدار می‌دهند و به پیام‌ها/prompt خط لوله assembleنشده برمی‌گردند
- شکست‌های afterTurn/ingest هشدار می‌دهند و نهایی‌سازی پس از نوبت را ناموفق علامت می‌زنند
- maintenance فقط پس از نوبت‌های موفق، غیر aborted و غیر yield اجرا می‌شود
- خطاهای Compaction نباید به‌عنوان promptهای تازه دوباره امتحان شوند

افزوده‌های ویژه Codex:

- اگر projection زمینه شکست خورد، هشدار دهید و به prompt اصلی برگردید.
- اگر آینه رونوشت شکست خورد، همچنان نهایی‌سازی موتور زمینه را با پیام‌های جایگزین امتحان کنید.
- اگر Compaction بومی Codex پس از موفقیت Compaction موتور زمینه شکست خورد،
  وقتی موتور زمینه اصلی است، کل Compaction در OpenClaw را ناموفق نکنید.

## طرح آزمون

### آزمون‌های واحد

آزمون‌ها را زیر `extensions/codex/src/app-server` اضافه کنید:

1. `run-attempt.context-engine.test.ts`
   - وقتی فایل نشست وجود دارد، Codex، `bootstrap` را فراخوانی می‌کند.
   - Codex، `assemble` را با پیام‌های آینه‌شده، بودجه توکن، نام‌های ابزار،
     حالت citations، شناسه مدل، و prompt فراخوانی می‌کند.
   - `systemPromptAddition` در دستورالعمل‌های developer گنجانده می‌شود.
   - پیام‌های assembleشده پیش از درخواست فعلی در prompt بازتاب داده می‌شوند.
   - Codex پس از آینه‌سازی رونوشت، `afterTurn` را فراخوانی می‌کند.
   - بدون `afterTurn`، Codex، `ingestBatch` یا `ingest` به‌ازای هر پیام را فراخوانی می‌کند.
   - maintenance نوبت پس از نوبت‌های موفق اجرا می‌شود.
   - maintenance نوبت در خطای prompt، abort، یا yield abort اجرا نمی‌شود.

2. `context-engine-projection.test.ts`
   - خروجی پایدار برای ورودی‌های یکسان
   - بدون prompt فعلی تکراری وقتی تاریخچه assembleشده آن را شامل می‌شود
   - مدیریت تاریخچه خالی
   - حفظ ترتیب نقش‌ها
   - شامل کردن system prompt addition فقط در دستورالعمل‌های developer

3. `compact.context-engine.test.ts`
   - نتیجه اصلی موتور زمینه مالک برنده می‌شود
   - وضعیت Compaction بومی Codex در جزئیات ظاهر می‌شود وقتی آن هم امتحان شده باشد
   - شکست بومی Codex باعث شکست Compaction موتور زمینه مالک نمی‌شود
   - موتور زمینه غیرمالک، رفتار فعلی Compaction بومی را حفظ می‌کند

### آزمون‌های موجود برای به‌روزرسانی

- `extensions/codex/src/app-server/run-attempt.test.ts` اگر وجود دارد، وگرنه
  نزدیک‌ترین آزمون‌های اجرای app-server در Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` فقط اگر جزئیات
  رویداد Compaction تغییر کند.
- `src/agents/harness/selection.test.ts` نباید نیازمند تغییر باشد مگر اینکه رفتار
  پیکربندی تغییر کند؛ باید پایدار بماند.
- آزمون‌های موتور زمینه PI باید بدون تغییر همچنان pass شوند.

### آزمون‌های یکپارچه‌سازی / زنده

آزمون‌های smoke زنده هارنس Codex را اضافه یا گسترش دهید:

- `plugins.slots.contextEngine` را به یک موتور آزمون پیکربندی کنید
- `agents.defaults.model` را به یک مدل `codex/*` پیکربندی کنید
- `agents.defaults.embeddedHarness.runtime = "codex"` را پیکربندی کنید
- assert کنید که موتور آزمون موارد زیر را مشاهده کرده است:
  - bootstrap
  - assemble
  - afterTurn یا ingest
  - maintenance

در آزمون‌های core OpenClaw، lossless-claw را الزامی نکنید. از یک Plugin موتور
زمینه جعلی کوچک داخل repo استفاده کنید.

## مشاهده‌پذیری

logهای debug را پیرامون فراخوانی‌های چرخه عمر موتور زمینه Codex اضافه کنید:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` با reason
- `codex native compaction completed alongside context-engine compaction`

از ثبت promptهای کامل یا محتوای رونوشت خودداری کنید.

در موارد مفید، فیلدهای ساختاریافته اضافه کنید:

- `sessionId`
- `sessionKey` مطابق رویه موجود logging، redact یا حذف شود
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## مهاجرت / سازگاری

این باید با نسخه‌های قبلی سازگار باشد:

- اگر هیچ موتور زمینه‌ای پیکربندی نشده باشد، رفتار موتور زمینه legacy باید
  معادل رفتار امروزی هارنس Codex باشد.
- اگر `assemble` موتور زمینه شکست بخورد، Codex باید با مسیر prompt اصلی ادامه دهد.
- اتصال‌های thread موجود Codex باید معتبر بمانند.
- fingerprinting پویای ابزار نباید خروجی موتور زمینه را شامل شود؛ در غیر این صورت
  هر تغییر زمینه می‌تواند یک thread تازه Codex را تحمیل کند. فقط catalog ابزار
  باید بر fingerprint پویای ابزار اثر بگذارد.

## پرسش‌های باز

1. آیا زمینه assembleشده باید کاملاً داخل prompt کاربر تزریق شود، کاملاً داخل
   دستورالعمل‌های developer، یا تقسیم شود؟

   توصیه: تقسیم شود. `systemPromptAddition` را در دستورالعمل‌های developer قرار دهید؛
   زمینه رونوشت assembleشده را در wrapper prompt کاربر قرار دهید. این بیشترین
   انطباق را با پروتکل فعلی Codex دارد، بدون اینکه تاریخچه thread بومی را mutate کند.

2. آیا وقتی یک موتور زمینه مالک Compaction است، Compaction بومی Codex باید
   غیرفعال شود؟

   توصیه: خیر، دست‌کم در ابتدا نه. Compaction بومی Codex ممکن است همچنان برای
   زنده نگه داشتن thread مربوط به app-server لازم باشد. اما باید به‌عنوان
   Compaction بومی Codex گزارش شود، نه Compaction موتور زمینه.

3. آیا `before_prompt_build` باید قبل از assemble موتور زمینه اجرا شود یا بعد از آن؟

   توصیه: برای Codex، پس از projection موتور زمینه، تا hookهای عمومی هارنس
   همان prompt/دستورالعمل‌های developer واقعی را ببینند که Codex دریافت خواهد کرد.
   اگر هم‌ارزی PI خلاف آن را لازم دارد، ترتیب انتخاب‌شده را در آزمون‌ها کدگذاری
   و اینجا مستند کنید.

4. آیا app-server در Codex می‌تواند در آینده override ساختاریافته context/history را بپذیرد؟

   نامشخص است. اگر بتواند، لایه projection متنی را با آن پروتکل جایگزین کنید
   و فراخوانی‌های چرخه عمر را بدون تغییر نگه دارید.

## معیارهای پذیرش

- یک نوبت هارنس تعبیه‌شده `codex/*`، چرخه عمر assemble موتور زمینه انتخاب‌شده را فراخوانی می‌کند.
- `systemPromptAddition` موتور زمینه روی دستورالعمل‌های developer در Codex اثر می‌گذارد.
- زمینه assembleشده به‌شکل قطعی روی ورودی نوبت Codex اثر می‌گذارد.
- نوبت‌های موفق Codex، `afterTurn` یا جایگزین ingest را فراخوانی می‌کنند.
- نوبت‌های موفق Codex، maintenance نوبت موتور زمینه را اجرا می‌کنند.
- نوبت‌های شکست‌خورده/aborted/yield-aborted، maintenance نوبت را اجرا نمی‌کنند.
- Compaction متعلق به موتور زمینه برای وضعیت OpenClaw/Plugin اصلی می‌ماند.
- Compaction بومی Codex به‌عنوان رفتار بومی Codex قابل ممیزی می‌ماند.
- رفتار موجود موتور زمینه PI بدون تغییر است.
- رفتار موجود هارنس Codex وقتی هیچ موتور زمینه غیر legacy انتخاب نشده یا وقتی
  assembly شکست می‌خورد، بدون تغییر است.
