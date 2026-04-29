---
read_when:
    - شما رفتار چرخهٔ عمر موتور زمینه را در هارنس Codex یکپارچه می‌کنید
    - برای کار با نشست‌های هارنس تعبیه‌شدهٔ codex/*، به lossless-claw یا یک Plugin دیگر از نوع context-engine نیاز دارید
    - شما در حال مقایسهٔ رفتار زمینه در PI تعبیه‌شده و سرور برنامهٔ Codex هستید
summary: مشخصات لازم برای اینکه چارچوب app-server همراه Codex، Pluginهای موتور زمینه OpenClaw را رعایت کند
title: انتقال موتور زمینهٔ هارنس Codex
x-i18n:
    generated_at: "2026-04-29T23:10:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## وضعیت

مشخصات پیاده‌سازی پیش‌نویس.

## هدف

کاری کنید که harness همراه app-server در Codex همان قرارداد چرخه‌عمر موتور زمینه OpenClaw را رعایت کند که turnهای PI تعبیه‌شده از قبل رعایت می‌کنند.

یک نشست که از `agents.defaults.embeddedHarness.runtime: "codex"` یا یک مدل `codex/*` استفاده می‌کند، همچنان باید اجازه دهد Plugin موتور زمینه انتخاب‌شده، مانند `lossless-claw`، تا جایی که مرز app-server در Codex اجازه می‌دهد، مونتاژ زمینه، دریافت پس از turn، نگهداشت، و سیاست Compaction در سطح OpenClaw را کنترل کند.

## غیرهدف‌ها

- درونیات app-server در Codex را دوباره پیاده‌سازی نکنید.
- Compaction بومی thread در Codex را وادار نکنید که خلاصه `lossless-claw` تولید کند.
- مدل‌های غیر Codex را ملزم نکنید از harness در Codex استفاده کنند.
- رفتار نشست ACP/acpx را تغییر ندهید. این مشخصات فقط برای مسیر harness عامل تعبیه‌شده غیر ACP است.
- Pluginهای شخص ثالث را وادار نکنید factoryهای افزونه app-server در Codex را ثبت کنند؛ مرز اعتماد Plugin همراه موجود بدون تغییر می‌ماند.

## معماری فعلی

حلقه اجرای تعبیه‌شده، پیش از انتخاب یک harness سطح پایین مشخص، موتور زمینه پیکربندی‌شده را یک بار در هر اجرا resolve می‌کند:

- `src/agents/pi-embedded-runner/run.ts`
  - Pluginهای موتور زمینه را مقداردهی اولیه می‌کند
  - `resolveContextEngine(params.config)` را فراخوانی می‌کند
  - `contextEngine` و `contextTokenBudget` را به `runEmbeddedAttemptWithBackend(...)` پاس می‌دهد

`runEmbeddedAttemptWithBackend(...)` کار را به harness عامل انتخاب‌شده واگذار می‌کند:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

harness app-server در Codex توسط Plugin همراه Codex ثبت می‌شود:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

پیاده‌سازی harness در Codex همان `EmbeddedRunAttemptParams` را دریافت می‌کند که تلاش‌های مبتنی بر PI دریافت می‌کنند:

- `extensions/codex/src/app-server/run-attempt.ts`

یعنی نقطه hook لازم در کدی است که توسط OpenClaw کنترل می‌شود. مرز خارجی، خود پروتکل app-server در Codex است: OpenClaw می‌تواند آنچه به `thread/start`، `thread/resume`، و `turn/start` می‌فرستد کنترل کند و اعلان‌ها را مشاهده کند، اما نمی‌تواند thread store داخلی Codex یا compactor بومی آن را تغییر دهد.

## شکاف فعلی

تلاش‌های PI تعبیه‌شده مستقیما چرخه‌عمر موتور زمینه را فراخوانی می‌کنند:

- bootstrap/نگهداشت پیش از تلاش
- assemble پیش از فراخوانی مدل
- afterTurn یا ingest پس از تلاش
- نگهداشت پس از یک turn موفق
- Compaction موتور زمینه برای موتورهایی که مالک Compaction هستند

کد PI مرتبط:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

تلاش‌های app-server در Codex در حال حاضر hookهای عمومی agent-harness را اجرا می‌کنند و رونوشت transcript را mirror می‌کنند، اما `params.contextEngine.bootstrap`، `params.contextEngine.assemble`، `params.contextEngine.afterTurn`، `params.contextEngine.ingestBatch`، `params.contextEngine.ingest`، یا `params.contextEngine.maintain` را فراخوانی نمی‌کنند.

کد Codex مرتبط:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## رفتار مطلوب

برای turnهای harness در Codex، OpenClaw باید این چرخه‌عمر را حفظ کند:

1. transcript نشست OpenClaw mirrorشده را بخواند.
2. وقتی فایل نشست قبلی وجود دارد، موتور زمینه فعال را bootstrap کند.
3. وقتی bootstrap maintenance در دسترس است، آن را اجرا کند.
4. با استفاده از موتور زمینه فعال، زمینه را assemble کند.
5. زمینه assembleشده را به ورودی‌های سازگار با Codex تبدیل کند.
6. thread در Codex را با developer instructions که شامل هر `systemPromptAddition` موتور زمینه باشد، start یا resume کند.
7. turn در Codex را با prompt کاربرپسند assembleشده start کند.
8. نتیجه Codex را دوباره در transcript OpenClaw mirror کند.
9. اگر `afterTurn` پیاده‌سازی شده است آن را فراخوانی کند، وگرنه با استفاده از snapshot transcript mirrorشده، `ingestBatch`/`ingest` را فراخوانی کند.
10. پس از turnهای موفق و غیر abortشده، نگهداشت turn را اجرا کند.
11. سیگنال‌های Compaction بومی Codex و hookهای Compaction در OpenClaw را حفظ کند.

## محدودیت‌های طراحی

### app-server در Codex برای وضعیت بومی thread مرجع باقی می‌ماند

Codex مالک thread بومی خودش و هر history توسعه‌یافته داخلی است. OpenClaw نباید تلاش کند history داخلی app-server را جز از طریق فراخوانی‌های پشتیبانی‌شده پروتکل تغییر دهد.

رونوشت transcript در OpenClaw همچنان منبع قابلیت‌های OpenClaw باقی می‌ماند:

- تاریخچه chat
- جستجو
- دفترداری `/new` و `/reset`
- تغییر مدل یا harness در آینده
- وضعیت Plugin موتور زمینه

### assembly موتور زمینه باید به ورودی‌های Codex project شود

رابط موتور زمینه، `AgentMessage[]` در OpenClaw را برمی‌گرداند، نه patch برای thread در Codex. `turn/start` در app-server در Codex ورودی فعلی کاربر را می‌پذیرد، در حالی که `thread/start` و `thread/resume`، developer instructions را می‌پذیرند.

بنابراین پیاده‌سازی به یک لایه projection نیاز دارد. نسخه اول امن نباید وانمود کند که می‌تواند history داخلی Codex را جایگزین کند. باید زمینه assembleشده را به‌صورت material قطعی prompt/developer-instruction پیرامون turn فعلی تزریق کند.

### پایداری prompt-cache اهمیت دارد

برای موتورهایی مانند `lossless-claw`، زمینه assembleشده باید برای ورودی‌های بدون تغییر قطعی باشد. timestamp، شناسه تصادفی، یا ترتیب غیردترمینیستیک به متن زمینه تولیدشده اضافه نکنید.

### معناشناسی fallback در PI تغییر نمی‌کند

انتخاب harness بدون تغییر می‌ماند:

- `runtime: "pi"`، PI را اجبار می‌کند
- `runtime: "codex"`، harness ثبت‌شده Codex را انتخاب می‌کند
- `runtime: "auto"` اجازه می‌دهد Plugin harnessها providerهای پشتیبانی‌شده را claim کنند
- `fallback: "none"` وقتی هیچ Plugin harness منطبق نیست، fallback به PI را غیرفعال می‌کند

این کار، آنچه را پس از انتخاب harness در Codex رخ می‌دهد تغییر می‌دهد.

## برنامه پیاده‌سازی

### 1. helperهای قابل استفاده مجدد تلاش موتور زمینه را export یا relocate کنید

امروز helperهای چرخه‌عمر قابل استفاده مجدد زیر runner در PI قرار دارند:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex نباید از مسیر پیاده‌سازی‌ای import کند که نامش به PI اشاره دارد، اگر بتوانیم از آن اجتناب کنیم.

یک ماژول خنثی نسبت به harness بسازید، برای مثال:

- `src/agents/harness/context-engine-lifecycle.ts`

این موارد را move یا re-export کنید:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- یک wrapper کوچک دور `runContextEngineMaintenance`

importهای PI را یا با re-export از فایل‌های قدیمی یا با به‌روزرسانی call siteهای PI در همان PR فعال نگه دارید.

نام helperهای خنثی نباید به PI اشاره کند.

نام‌های پیشنهادی:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. یک helper projection زمینه برای Codex اضافه کنید

یک ماژول جدید اضافه کنید:

- `extensions/codex/src/app-server/context-engine-projection.ts`

مسئولیت‌ها:

- `AgentMessage[]` assembleشده، history mirrorشده اصلی، و prompt فعلی را بپذیرد.
- تعیین کند کدام زمینه در developer instructions قرار می‌گیرد و کدام در ورودی فعلی کاربر.
- prompt فعلی کاربر را به‌عنوان درخواست عملیاتی نهایی حفظ کند.
- پیام‌های قبلی را در قالبی پایدار و صریح render کند.
- از metadata ناپایدار اجتناب کند.

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

projection اولیه توصیه‌شده:

- `systemPromptAddition` را در developer instructions قرار دهید.
- زمینه transcript assembleشده را پیش از prompt فعلی در `promptText` قرار دهید.
- آن را به‌روشنی به‌عنوان زمینه assembleشده OpenClaw برچسب بزنید.
- prompt فعلی را در انتها نگه دارید.
- اگر prompt فعلی کاربر از قبل در tail وجود دارد، duplicate آن را حذف کنید.

شکل نمونه prompt:

```text
زمینه assembleشده OpenClaw برای این turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

درخواست فعلی کاربر:
...
```

این کمتر از جراحی بومی history در Codex ظریف است، اما داخل OpenClaw قابل پیاده‌سازی است و معناشناسی موتور زمینه را حفظ می‌کند.

بهبود آینده: اگر app-server در Codex پروتکلی برای جایگزینی یا تکمیل history thread ارائه کرد، این لایه projection را به استفاده از آن API تغییر دهید.

### 3. bootstrap را پیش از راه‌اندازی thread در Codex وصل کنید

در `extensions/codex/src/app-server/run-attempt.ts`:

- history نشست mirrorشده را مثل امروز بخوانید.
- تعیین کنید فایل نشست پیش از این اجرا وجود داشته است یا نه. helperی را ترجیح دهید که پیش از نوشتن‌های mirroring، `fs.stat(params.sessionFile)` را بررسی کند.
- یک `SessionManager` باز کنید یا اگر helper به آن نیاز دارد، از یک adapter باریک session manager استفاده کنید.
- وقتی `params.contextEngine` وجود دارد، helper خنثی bootstrap را فراخوانی کنید.

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

از همان قرارداد `sessionKey` استفاده کنید که bridge ابزار Codex و transcript mirror استفاده می‌کنند. امروز Codex، `sandboxSessionKey` را از `params.sessionKey` یا `params.sessionId` محاسبه می‌کند؛ مگر اینکه دلیلی برای حفظ `params.sessionKey` خام وجود داشته باشد، همان را به‌صورت یکدست استفاده کنید.

### 4. assemble را پیش از `thread/start` / `thread/resume` و `turn/start` وصل کنید

در `runCodexAppServerAttempt`:

1. ابتدا ابزارهای پویا را بسازید، تا موتور زمینه نام ابزارهای واقعا در دسترس را ببیند.
2. history نشست mirrorشده را بخوانید.
3. وقتی `params.contextEngine` وجود دارد، `assemble(...)` موتور زمینه را اجرا کنید.
4. نتیجه assembleشده را به این موارد project کنید:
   - افزودنی developer instruction
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

1. developer instructions پایه را با `buildDeveloperInstructions(params)` محاسبه کنید
2. assembly/projection موتور زمینه را اعمال کنید
3. `before_prompt_build` را با prompt/developer instructions projectشده اجرا کنید

این ترتیب اجازه می‌دهد hookهای عمومی prompt همان promptی را ببینند که Codex دریافت خواهد کرد. اگر به برابری سختگیرانه با PI نیاز داشته باشیم، assembly موتور زمینه را پیش از ترکیب hook اجرا کنید، چون PI، `systemPromptAddition` موتور زمینه را پس از pipeline مربوط به prompt خودش به system prompt نهایی اعمال می‌کند. invariant مهم این است که هم موتور زمینه و هم hookها یک ترتیب قطعی و مستند دریافت کنند.

ترتیب توصیه‌شده برای پیاده‌سازی اول:

1. `buildDeveloperInstructions(params)`
2. `assemble()` موتور زمینه
3. `systemPromptAddition` را به developer instructions append/prepend کنید
4. پیام‌های assembleشده را به متن prompt project کنید
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. developer instructions نهایی را به `startOrResumeThread(...)` پاس دهید
7. متن prompt نهایی را به `buildTurnStartParams(...)` پاس دهید

این مشخصات باید در تست‌ها encode شود تا تغییرات آینده به‌طور تصادفی ترتیب آن را عوض نکنند.

### 5. قالب‌بندی پایدار برای prompt-cache را حفظ کنید

helper projection باید برای ورودی‌های یکسان خروجی byte-stable تولید کند:

- ترتیب پایدار پیام‌ها
- برچسب‌های نقش پایدار
- بدون timestamp تولیدشده
- بدون نشت ترتیب keyهای object
- بدون delimiterهای تصادفی
- بدون شناسه‌های per-run

از delimiterهای ثابت و بخش‌های صریح استفاده کنید.

### 6. پس از mirroring transcript، post-turn را وصل کنید

Codex `CodexAppServerEventProjector` یک `messagesSnapshot` محلی برای نوبت
فعلی می‌سازد. `mirrorTranscriptBestEffort(...)` آن snapshot را در mirror رونوشت
OpenClaw می‌نویسد.

پس از موفقیت یا شکست mirroring، نهایی‌ساز موتور زمینه را با بهترین snapshot پیام
در دسترس فراخوانی کنید:

- زمینه کامل جلسه mirrorشده پس از نوشتن را ترجیح دهید، چون `afterTurn`
  snapshot جلسه را انتظار دارد، نه فقط نوبت فعلی.
- اگر فایل جلسه نتواند دوباره باز شود، به `historyMessages + result.messagesSnapshot`
  fallback کنید.

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

اگر mirroring شکست خورد، همچنان `afterTurn` را با snapshot جایگزین فراخوانی کنید، اما log کنید
که موتور زمینه از داده‌های fallback نوبت ingest می‌کند.

### 7. نرمال‌سازی usage و زمینه زمان اجرای prompt-cache

نتایج Codex در صورت در دسترس بودن، usage نرمال‌شده از اعلان‌های token مربوط به app-server را شامل می‌شوند.
آن usage را به زمینه زمان اجرای موتور زمینه پاس دهید.

اگر Codex app-server در نهایت جزئیات خواندن/نوشتن cache را منتشر کند، آنها را به
`ContextEnginePromptCacheInfo` نگاشت کنید. تا آن زمان، به‌جای
ساختن صفرهای فرضی، `promptCache` را حذف کنید.

### 8. سیاست Compaction

دو سیستم compaction وجود دارد:

1. `compact()` موتور زمینه OpenClaw
2. `thread/compact/start` بومی Codex app-server

آنها را بی‌سروصدا با هم یکی نگیرید.

#### `/compact` و compaction صریح OpenClaw

وقتی موتور زمینه انتخاب‌شده `info.ownsCompaction === true` دارد، compaction صریح
OpenClaw باید نتیجه `compact()` موتور زمینه را برای mirror رونوشت OpenClaw و وضعیت Plugin ترجیح دهد.

وقتی harness انتخاب‌شده Codex یک binding بومی thread دارد، همچنین می‌توانیم
compaction بومی Codex را درخواست کنیم تا thread app-server سالم بماند، اما این
باید در جزئیات به‌عنوان یک اقدام backend جداگانه گزارش شود.

رفتار پیشنهادی:

- اگر `contextEngine.info.ownsCompaction === true`:
  - ابتدا `compact()` موتور زمینه را فراخوانی کنید
  - سپس در صورت وجود binding thread، به‌شکل best-effort compaction بومی Codex را فراخوانی کنید
  - نتیجه موتور زمینه را به‌عنوان نتیجه اصلی برگردانید
  - وضعیت compaction بومی Codex را در `details.codexNativeCompaction` شامل کنید
- اگر موتور زمینه فعال مالک compaction نیست:
  - رفتار فعلی compaction بومی Codex را حفظ کنید

این احتمالاً نیازمند تغییر `extensions/codex/src/app-server/compact.ts` یا
wrap کردن آن از مسیر compaction عمومی است، بسته به اینکه
`maybeCompactAgentHarnessSession(...)` کجا فراخوانی می‌شود.

#### رویدادهای contextCompaction بومی Codex درون نوبت

Codex ممکن است در طول یک نوبت رویدادهای آیتم `contextCompaction` منتشر کند. انتشار
hook فعلی قبل/بعد compaction را در `event-projector.ts` حفظ کنید، اما آن را
به‌عنوان compaction کامل‌شده موتور زمینه تلقی نکنید.

برای engineهایی که مالک compaction هستند، وقتی Codex با این حال compaction بومی
انجام می‌دهد، یک diagnostic صریح منتشر کنید:

- نام stream/event: stream موجود `compaction` قابل قبول است
- جزئیات: `{ backend: "codex-app-server", ownsCompaction: true }`

این تفکیک را قابل audit می‌کند.

### 9. رفتار reset جلسه و binding

`reset(...)` موجود در Codex harness، binding مربوط به Codex app-server را از
فایل جلسه OpenClaw پاک می‌کند. این رفتار را حفظ کنید.

همچنین مطمئن شوید پاک‌سازی وضعیت موتور زمینه همچنان از طریق مسیرهای lifecycle
موجود جلسه OpenClaw انجام می‌شود. cleanup مخصوص Codex اضافه نکنید مگر اینکه
lifecycle موتور زمینه در حال حاضر رویدادهای reset/delete را برای همه harnessها از دست بدهد.

### 10. مدیریت خطا

از semantics مربوط به PI پیروی کنید:

- شکست‌های bootstrap هشدار می‌دهند و ادامه می‌دهند
- شکست‌های assemble هشدار می‌دهند و به پیام‌ها/prompt pipeline assembleنشده fallback می‌کنند
- شکست‌های afterTurn/ingest هشدار می‌دهند و نهایی‌سازی post-turn را ناموفق علامت می‌زنند
- maintenance فقط پس از نوبت‌های موفق، non-aborted و non-yield اجرا می‌شود
- خطاهای compaction نباید به‌عنوان promptهای تازه retry شوند

افزوده‌های مخصوص Codex:

- اگر projection زمینه شکست خورد، هشدار دهید و به prompt اصلی fallback کنید.
- اگر mirror رونوشت شکست خورد، همچنان نهایی‌سازی موتور زمینه را با
  پیام‌های fallback تلاش کنید.
- اگر compaction بومی Codex پس از موفقیت compaction موتور زمینه شکست خورد،
  وقتی موتور زمینه primary است کل compaction OpenClaw را ناموفق نکنید.

## برنامه آزمون

### آزمون‌های واحد

آزمون‌ها را زیر `extensions/codex/src/app-server` اضافه کنید:

1. `run-attempt.context-engine.test.ts`
   - Codex وقتی فایل جلسه وجود دارد `bootstrap` را فراخوانی می‌کند.
   - Codex `assemble` را با پیام‌های mirrorشده، token budget، نام ابزارها،
     حالت citations، شناسه model و prompt فراخوانی می‌کند.
   - `systemPromptAddition` در دستورالعمل‌های developer گنجانده می‌شود.
   - پیام‌های assembleشده پیش از درخواست فعلی در prompt project می‌شوند.
   - Codex پس از mirroring رونوشت، `afterTurn` را فراخوانی می‌کند.
   - بدون `afterTurn`، Codex `ingestBatch` یا `ingest` به‌ازای هر پیام را فراخوانی می‌کند.
   - maintenance نوبت پس از نوبت‌های موفق اجرا می‌شود.
   - maintenance نوبت هنگام prompt error، abort یا yield abort اجرا نمی‌شود.

2. `context-engine-projection.test.ts`
   - خروجی پایدار برای ورودی‌های یکسان
   - نبود prompt فعلی تکراری وقتی تاریخچه assembleشده آن را شامل می‌شود
   - مدیریت تاریخچه خالی
   - حفظ ترتیب role
   - شامل کردن system prompt addition فقط در دستورالعمل‌های developer

3. `compact.context-engine.test.ts`
   - نتیجه اصلی موتور زمینه مالک برنده می‌شود
   - وقتی compaction بومی Codex هم تلاش شده باشد، وضعیت آن در details ظاهر می‌شود
   - شکست بومی Codex، compaction موتور زمینه مالک را ناموفق نمی‌کند
   - موتور زمینه غیرمالک رفتار فعلی compaction بومی را حفظ می‌کند

### آزمون‌های موجود برای به‌روزرسانی

- `extensions/codex/src/app-server/run-attempt.test.ts` اگر موجود است، وگرنه
  نزدیک‌ترین آزمون‌های اجرای Codex app-server.
- `extensions/codex/src/app-server/event-projector.test.ts` فقط اگر جزئیات رویداد
  compaction تغییر کند.
- `src/agents/harness/selection.test.ts` نباید نیاز به تغییر داشته باشد مگر اینکه رفتار
  config تغییر کند؛ باید پایدار بماند.
- آزمون‌های موتور زمینه PI باید بدون تغییر همچنان pass شوند.

### آزمون‌های integration / live

آزمون‌های smoke زنده Codex harness را اضافه یا گسترش دهید:

- `plugins.slots.contextEngine` را روی یک engine آزمایشی تنظیم کنید
- `agents.defaults.model` را روی یک model از نوع `codex/*` تنظیم کنید
- `agents.defaults.embeddedHarness.runtime = "codex"` را تنظیم کنید
- assert کنید که engine آزمایشی موارد زیر را مشاهده کرده است:
  - bootstrap
  - assemble
  - afterTurn یا ingest
  - maintenance

از الزام lossless-claw در آزمون‌های core OpenClaw پرهیز کنید. از یک context engine plugin
جعلی کوچک داخل repo استفاده کنید.

## مشاهده‌پذیری

debug logها را پیرامون فراخوانی‌های lifecycle موتور زمینه Codex اضافه کنید:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` همراه با دلیل
- `codex native compaction completed alongside context-engine compaction`

از log کردن prompt کامل یا محتوای رونوشت پرهیز کنید.

در صورت مفید بودن، فیلدهای ساختاریافته اضافه کنید:

- `sessionId`
- `sessionKey` مطابق رویه logging موجود redacted یا حذف‌شده
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## migration / سازگاری

این باید backward-compatible باشد:

- اگر هیچ موتور زمینه‌ای پیکربندی نشده باشد، رفتار legacy موتور زمینه باید
  معادل رفتار Codex harness امروز باشد.
- اگر `assemble` موتور زمینه شکست بخورد، Codex باید با مسیر prompt اصلی ادامه دهد.
- bindingهای موجود Codex thread باید معتبر بمانند.
- fingerprinting پویای ابزار نباید خروجی موتور زمینه را شامل شود؛ در غیر این صورت
  هر تغییر زمینه می‌تواند یک Codex thread جدید را اجباری کند. فقط catalog ابزار
  باید fingerprint پویای ابزار را تحت تأثیر قرار دهد.

## پرسش‌های باز

1. آیا زمینه assembleشده باید کاملاً در prompt کاربر inject شود، کاملاً
   در دستورالعمل‌های developer، یا split شود؟

   توصیه: split. `systemPromptAddition` را در دستورالعمل‌های developer بگذارید؛
   زمینه رونوشت assembleشده را در wrapper prompt کاربر بگذارید. این بهترین تطابق را
   با protocol فعلی Codex بدون mutate کردن تاریخچه native thread دارد.

2. آیا وقتی یک موتور زمینه مالک
   compaction است، compaction بومی Codex باید disabled شود؟

   توصیه: نه، در ابتدا نه. compaction بومی Codex ممکن است همچنان برای زنده نگه داشتن
   thread app-server لازم باشد. اما باید به‌عنوان compaction بومی Codex گزارش شود،
   نه compaction موتور زمینه.

3. آیا `before_prompt_build` باید قبل یا بعد از assembly موتور زمینه اجرا شود؟

   توصیه: بعد از projection موتور زمینه برای Codex، تا hookهای generic harness
   prompt/دستورالعمل‌های developer واقعی‌ای را ببینند که Codex دریافت خواهد کرد. اگر parity با PI
   خلاف آن را لازم دارد، ترتیب انتخاب‌شده را در آزمون‌ها encode کنید و اینجا مستند کنید.

4. آیا Codex app-server می‌تواند در آینده override ساختاریافته context/history را بپذیرد؟

   نامعلوم. اگر بتواند، لایه projection متنی را با آن protocol جایگزین کنید و
   فراخوانی‌های lifecycle را بدون تغییر نگه دارید.

## معیارهای پذیرش

- یک نوبت embedded harness از نوع `codex/*`، lifecycle assemble موتور زمینه انتخاب‌شده را فراخوانی می‌کند.
- `systemPromptAddition` موتور زمینه روی دستورالعمل‌های developer Codex اثر می‌گذارد.
- زمینه assembleشده به‌شکل deterministic روی ورودی نوبت Codex اثر می‌گذارد.
- نوبت‌های موفق Codex `afterTurn` یا fallback ingest را فراخوانی می‌کنند.
- نوبت‌های موفق Codex، maintenance نوبت موتور زمینه را اجرا می‌کنند.
- نوبت‌های failed/aborted/yield-aborted، maintenance نوبت را اجرا نمی‌کنند.
- compaction متعلق به موتور زمینه برای وضعیت OpenClaw/Plugin primary می‌ماند.
- compaction بومی Codex همچنان به‌عنوان رفتار بومی Codex قابل audit می‌ماند.
- رفتار موجود موتور زمینه PI بدون تغییر است.
- رفتار موجود Codex harness وقتی هیچ موتور زمینه non-legacy انتخاب نشده یا وقتی assembly شکست می‌خورد، بدون تغییر است.
