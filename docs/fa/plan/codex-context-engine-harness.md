---
read_when:
    - شما در حال اتصال رفتار چرخهٔ عمر موتور زمینه به هارنس Codex هستید
    - برای کار با نشست‌های هارنس تعبیه‌شده‌ی codex/* به lossless-claw یا یک Plugin دیگرِ موتور زمینه نیاز دارید
    - شما در حال مقایسه رفتار زمینه OpenClaw تعبیه‌شده و سرور برنامه Codex هستید
summary: مشخصات لازم برای واداشتن هارنس app-server همراه Codex به رعایت Pluginهای موتور زمینه OpenClaw
title: انتقال موتور زمینهٔ هارنس Codex
x-i18n:
    generated_at: "2026-06-27T18:05:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## وضعیت

مشخصات پیاده‌سازی پیش‌نویس.

## هدف

کاری کنید که هارنس app-server بسته‌بندی‌شده Codex همان قرارداد چرخه‌عمر context-engine در OpenClaw را رعایت کند که turnهای تعبیه‌شده OpenClaw همین حالا رعایت می‌کنند.

یک نشست که از provider/model با `agentRuntime.id: "codex"` یا یک مدل `codex/*` استفاده می‌کند، همچنان باید به Plugin context-engine انتخاب‌شده، مانند `lossless-claw`، اجازه دهد تا تا جایی که مرز app-server Codex اجازه می‌دهد، مونتاژ context، دریافت پس از turn، نگهداشت، و سیاست Compaction در سطح OpenClaw را کنترل کند.

## غیرهدف‌ها

- پیاده‌سازی دوباره درون‌کاری‌های app-server Codex انجام نشود.
- Compaction بومی thread در Codex وادار نشود که خلاصه `lossless-claw` تولید کند.
- مدل‌های غیر Codex ملزم به استفاده از هارنس Codex نشوند.
- رفتار نشست ACP/acpx تغییر نکند. این مشخصات فقط برای مسیر هارنس عامل تعبیه‌شده غیر ACP است.
- Pluginهای شخص ثالث وادار نشوند factoryهای افزونه app-server Codex را ثبت کنند؛ مرز اعتماد Plugin بسته‌بندی‌شده موجود بدون تغییر می‌ماند.

## معماری فعلی

حلقه اجرای تعبیه‌شده، context engine پیکربندی‌شده را پیش از انتخاب یک هارنس سطح پایین مشخص، یک بار برای هر اجرا resolve می‌کند:

- `src/agents/embedded-agent-runner/run.ts`
  - Pluginهای context-engine را مقداردهی اولیه می‌کند
  - `resolveContextEngine(params.config)` را فراخوانی می‌کند
  - `contextEngine` و `contextTokenBudget` را به
    `runEmbeddedAttemptWithBackend(...)` پاس می‌دهد

`runEmbeddedAttemptWithBackend(...)` کار را به هارنس عامل انتخاب‌شده واگذار می‌کند:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

هارنس app-server Codex توسط Plugin بسته‌بندی‌شده Codex ثبت می‌شود:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

پیاده‌سازی هارنس Codex همان `EmbeddedRunAttemptParams` را دریافت می‌کند که attemptهای داخلی OpenClaw دریافت می‌کنند:

- `extensions/codex/src/app-server/run-attempt.ts`

این یعنی نقطه hook لازم در کدی قرار دارد که تحت کنترل OpenClaw است. مرز خارجی، خود پروتکل app-server Codex است: OpenClaw می‌تواند آنچه را به `thread/start`، `thread/resume` و `turn/start` می‌فرستد کنترل کند و می‌تواند اعلان‌ها را مشاهده کند، اما نمی‌تواند store داخلی thread یا compactor بومی Codex را تغییر دهد.

## شکاف فعلی

attemptهای داخلی OpenClaw چرخه‌عمر context-engine را مستقیما فراخوانی می‌کنند:

- bootstrap/maintenance پیش از attempt
- assemble پیش از فراخوانی مدل
- afterTurn یا ingest پس از attempt
- maintenance پس از یک turn موفق
- Compaction مربوط به context-engine برای engineهایی که مالک Compaction هستند

کدهای مرتبط OpenClaw:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

attemptهای app-server Codex در حال حاضر hookهای عمومی هارنس عامل را اجرا و transcript را mirror می‌کنند، اما `params.contextEngine.bootstrap`، `params.contextEngine.assemble`، `params.contextEngine.afterTurn`، `params.contextEngine.ingestBatch`، `params.contextEngine.ingest` یا `params.contextEngine.maintain` را فراخوانی نمی‌کنند.

کدهای مرتبط Codex:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## رفتار مطلوب

برای turnهای هارنس Codex، OpenClaw باید این چرخه‌عمر را حفظ کند:

1. transcript نشست mirrorشده OpenClaw را بخواند.
2. وقتی فایل نشست قبلی وجود دارد، context engine فعال را bootstrap کند.
3. وقتی در دسترس است، bootstrap maintenance را اجرا کند.
4. با استفاده از context engine فعال، context را assemble کند.
5. context اسمبل‌شده را به ورودی‌های سازگار با Codex تبدیل کند.
6. thread Codex را با developer instructions که شامل هر `systemPromptAddition` مربوط به context-engine است، شروع یا resume کند.
7. turn Codex را با prompt رو‌به‌کاربر اسمبل‌شده شروع کند.
8. نتیجه Codex را دوباره در transcript OpenClaw mirror کند.
9. اگر `afterTurn` پیاده‌سازی شده است آن را فراخوانی کند، وگرنه با استفاده از snapshot transcript mirrorشده، `ingestBatch`/`ingest` را فراخوانی کند.
10. پس از turnهای موفق و abortنشده، turn maintenance را اجرا کند.
11. سیگنال‌های Compaction بومی Codex و hookهای Compaction در OpenClaw را حفظ کند.

## محدودیت‌های طراحی

### app-server Codex برای وضعیت thread بومی canonical می‌ماند

Codex مالک thread بومی خودش و هر تاریخچه داخلی توسعه‌یافته است. OpenClaw نباید تلاش کند تاریخچه داخلی app-server را جز از راه فراخوانی‌های پشتیبانی‌شده پروتکل تغییر دهد.

mirror transcript در OpenClaw منبع قابلیت‌های OpenClaw می‌ماند:

- تاریخچه chat
- جست‌وجو
- bookkeeping مربوط به `/new` و `/reset`
- تعویض آینده مدل یا هارنس
- وضعیت Plugin context-engine

### اسمبل context engine باید به ورودی‌های Codex تصویر شود

رابط context-engine، `AgentMessage[]` مربوط به OpenClaw را برمی‌گرداند، نه یک patch برای thread در Codex. `turn/start` در app-server Codex یک ورودی کاربر فعلی می‌پذیرد، در حالی که `thread/start` و `thread/resume`، developer instructions می‌پذیرند.

بنابراین پیاده‌سازی به یک لایه projection نیاز دارد. نسخه اول ایمن نباید وانمود کند که می‌تواند تاریخچه داخلی Codex را جایگزین کند. باید context اسمبل‌شده را به صورت محتوای قطعی prompt/developer-instruction پیرامون turn فعلی تزریق کند.

### پایداری prompt-cache مهم است

برای engineهایی مانند `lossless-claw`، context اسمبل‌شده باید برای ورودی‌های بدون تغییر قطعی باشد. timestamp، id تصادفی یا ترتیب غیرقطعی به متن context تولیدشده اضافه نکنید.

### معناشناسی انتخاب runtime تغییر نمی‌کند

انتخاب هارنس همان‌طور باقی می‌ماند:

- `runtime: "openclaw"` هارنس داخلی OpenClaw را انتخاب می‌کند
- `runtime: "codex"` هارنس ثبت‌شده Codex را انتخاب می‌کند
- `runtime: "auto"` اجازه می‌دهد هارنس‌های Plugin، providerهای پشتیبانی‌شده را claim کنند
- اجراهای `auto` بدون match از هارنس داخلی OpenClaw استفاده می‌کنند

این کار آنچه را پس از انتخاب هارنس Codex رخ می‌دهد تغییر می‌دهد.

## برنامه پیاده‌سازی

### 1. helperهای قابل‌استفاده مجدد attempt مربوط به context-engine را export یا relocate کنید

امروز helperهای قابل‌استفاده مجدد چرخه‌عمر زیر embedded agent runner قرار دارند:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex باید به‌جای دست‌بردن به جزئیات پیاده‌سازی runner، helperهای harness-neutral را import کند.

یک ماژول harness-neutral بسازید، برای مثال:

- `src/agents/harness/context-engine-lifecycle.ts`

این موارد را move یا re-export کنید:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- یک wrapper کوچک پیرامون `runContextEngineMaintenance`

call siteهای هارنس داخلی را در همان PR به‌روزرسانی کنید.

نام‌های helperهای neutral نباید به هارنس داخلی اشاره کنند.

نام‌های پیشنهادی:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. یک helper projection مربوط به context در Codex اضافه کنید

یک ماژول جدید اضافه کنید:

- `extensions/codex/src/app-server/context-engine-projection.ts`

مسئولیت‌ها:

- `AgentMessage[]` اسمبل‌شده، تاریخچه mirrorشده اصلی، و prompt فعلی را بپذیرد.
- تعیین کند کدام context به developer instructions تعلق دارد و کدام به ورودی کاربر فعلی.
- prompt فعلی کاربر را به‌عنوان درخواست عملیاتی نهایی حفظ کند.
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

projection اولیه پیشنهادی:

- `systemPromptAddition` را در developer instructions قرار دهید.
- context transcript اسمبل‌شده را پیش از prompt فعلی در `promptText` قرار دهید.
- آن را به‌وضوح به‌عنوان context اسمبل‌شده OpenClaw برچسب بزنید.
- prompt فعلی را در انتها نگه دارید.
- اگر prompt تکراری کاربر فعلی از قبل در انتهای tail ظاهر شده است، آن را حذف کنید.

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

این روش از جراحی بومی تاریخچه Codex کم‌ظرافت‌تر است، اما داخل OpenClaw قابل پیاده‌سازی است و معناشناسی context-engine را حفظ می‌کند.

بهبود آینده: اگر app-server Codex پروتکلی برای جایگزینی یا تکمیل تاریخچه thread ارائه کند، این لایه projection را برای استفاده از آن API تعویض کنید.

### 3. bootstrap را پیش از راه‌اندازی thread در Codex wire کنید

در `extensions/codex/src/app-server/run-attempt.ts`:

- تاریخچه نشست mirrorشده را مثل امروز بخوانید.
- تعیین کنید آیا فایل نشست پیش از این اجرا وجود داشته است یا نه. helperی را ترجیح دهید که پیش از نوشتن mirror، `fs.stat(params.sessionFile)` را بررسی کند.
- اگر helper به آن نیاز دارد، یک `SessionManager` باز کنید یا از adapter باریک session manager استفاده کنید.
- وقتی `params.contextEngine` وجود دارد، helper bootstrap neutral را فراخوانی کنید.

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

از همان قرارداد `sessionKey` استفاده کنید که bridge ابزار Codex و mirror transcript استفاده می‌کنند. امروز Codex، `sandboxSessionKey` را از `params.sessionKey` یا `params.sessionId` محاسبه می‌کند؛ مگر اینکه دلیلی برای حفظ `params.sessionKey` خام وجود داشته باشد، از همان به‌صورت سازگار استفاده کنید.

### 4. assemble را پیش از `thread/start` / `thread/resume` و `turn/start` wire کنید

در `runCodexAppServerAttempt`:

1. ابتدا ابزارهای dynamic را بسازید، تا context engine نام ابزارهای واقعا در دسترس را ببیند.
2. تاریخچه نشست mirrorشده را بخوانید.
3. وقتی `params.contextEngine` وجود دارد، `assemble(...)` مربوط به context-engine را اجرا کنید.
4. نتیجه اسمبل‌شده را به این موارد project کنید:
   - افزوده developer instruction
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
2. assembly/projection مربوط به context-engine را اعمال کنید
3. `before_prompt_build` را با prompt/developer instructions projectشده اجرا کنید

این ترتیب اجازه می‌دهد hookهای عمومی prompt همان promptی را ببینند که Codex دریافت خواهد کرد. اگر به برابری سخت‌گیرانه OpenClaw نیاز داشته باشیم، assembly مربوط به context-engine را پیش از composition مربوط به hook اجرا کنید، چون هارنس داخلی `systemPromptAddition` مربوط به context-engine را پس از pipeline prompt خودش به system prompt نهایی اعمال می‌کند. invariant مهم این است که هم context engine و هم hookها یک ترتیب قطعی و مستند دریافت کنند.

ترتیب پیشنهادی برای پیاده‌سازی اول:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. افزودن/پیش‌افزودن `systemPromptAddition` به developer instructions
4. project کردن پیام‌های اسمبل‌شده در متن prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. پاس دادن developer instructions نهایی به `startOrResumeThread(...)`
7. پاس دادن متن prompt نهایی به `buildTurnStartParams(...)`

این مشخصات باید در تست‌ها encode شود تا تغییرات آینده به‌صورت تصادفی ترتیب آن را عوض نکنند.

### 5. قالب‌بندی پایدار prompt-cache را حفظ کنید

helper projection باید برای ورودی‌های یکسان خروجی byte-stable تولید کند:

- ترتیب پایدار پیام‌ها
- برچسب‌های پایدار role
- بدون timestamp تولیدشده
- بدون نشت ترتیب کلیدهای object
- بدون delimiterهای تصادفی
- بدون idهای per-run

از delimiterهای ثابت و بخش‌های صریح استفاده کنید.

### 6. پس از mirror کردن transcript، post-turn را wire کنید

`CodexAppServerEventProjector` در Codex یک `messagesSnapshot` محلی برای نوبت
فعلی می‌سازد. `mirrorTranscriptBestEffort(...)` آن snapshot را در آینهٔ transcript
OpenClaw می‌نویسد.

پس از موفقیت یا شکست mirroring، نهایی‌ساز context-engine را با بهترین snapshot
پیام موجود فراخوانی کنید:

- پس از نوشتن، context کامل session آینه‌شده را ترجیح دهید، زیرا `afterTurn`
  snapshot مربوط به session را انتظار دارد، نه فقط نوبت فعلی.
- اگر فایل session دوباره باز نشد، به `historyMessages + result.messagesSnapshot`
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

اگر mirroring شکست خورد، همچنان `afterTurn` را با snapshot fallback فراخوانی کنید،
اما log کنید که context engine از داده‌های fallback نوبت ingest می‌کند.

### ۷. نرمال‌سازی context زمان اجرای usage و prompt-cache

نتایج Codex، در صورت موجود بودن، شامل usage نرمال‌شده از اعلان‌های token در app-server
هستند. آن usage را به context زمان اجرای context-engine پاس دهید.

اگر app-server در Codex در نهایت جزئیات خواندن/نوشتن cache را افشا کند، آن‌ها را به
`ContextEnginePromptCacheInfo` نگاشت کنید. تا آن زمان، به‌جای ساختن صفرهای
مصنوعی، `promptCache` را حذف کنید.

### ۸. سیاست Compaction

دو سیستم compaction وجود دارد:

1. `compact()` مربوط به context-engine در OpenClaw
2. `thread/compact/start` بومی app-server در Codex

آن‌ها را بی‌سروصدا با هم یکی نکنید.

#### `/compact` و compaction صریح OpenClaw

وقتی context engine انتخاب‌شده `info.ownsCompaction === true` دارد، compaction
صریح OpenClaw باید نتیجهٔ `compact()` مربوط به context engine را برای آینهٔ
transcript و وضعیت Plugin در OpenClaw ترجیح دهد.

وقتی harness انتخاب‌شدهٔ Codex یک binding بومی thread دارد، علاوه بر آن می‌توانیم
برای سالم نگه‌داشتن thread در app-server، compaction بومی Codex را هم درخواست کنیم،
اما این باید در details به‌عنوان یک اقدام backend جداگانه گزارش شود.

رفتار پیشنهادی:

- اگر `contextEngine.info.ownsCompaction === true`:
  - ابتدا `compact()` مربوط به context-engine را فراخوانی کنید
  - سپس وقتی binding مربوط به thread وجود دارد، به‌صورت best-effort compaction بومی Codex را فراخوانی کنید
  - نتیجهٔ context-engine را به‌عنوان نتیجهٔ اصلی برگردانید
  - وضعیت compaction بومی Codex را در `details.codexNativeCompaction` قرار دهید
- اگر context engine فعال مالک compaction نیست:
  - رفتار فعلی compaction بومی Codex را حفظ کنید

این احتمالاً به تغییر `extensions/codex/src/app-server/compact.ts` یا wrap کردن آن
از مسیر عمومی compaction نیاز دارد، بسته به اینکه `maybeCompactAgentHarnessSession(...)`
کجا فراخوانی می‌شود.

#### رویدادهای contextCompaction بومی Codex درون نوبت

Codex ممکن است در طول یک نوبت رویدادهای item از نوع `contextCompaction` صادر کند.
انتشار hook فعلی before/after compaction را در `event-projector.ts` نگه دارید، اما
آن را به‌عنوان compaction کامل‌شدهٔ context-engine تلقی نکنید.

برای engineهایی که مالک compaction هستند، وقتی Codex با این حال compaction بومی
انجام می‌دهد، یک diagnostic صریح صادر کنید:

- نام stream/event: stream موجود `compaction` قابل قبول است
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

این جداسازی را قابل audit می‌کند.

### ۹. reset شدن session و رفتار binding

`reset(...)` موجود در harness Codex، binding app-server در Codex را از فایل session
OpenClaw پاک می‌کند. این رفتار را حفظ کنید.

همچنین مطمئن شوید cleanup وضعیت context-engine همچنان از مسیرهای lifecycle موجود
session در OpenClaw انجام می‌شود. cleanup مخصوص Codex اضافه نکنید، مگر اینکه
lifecycle مربوط به context-engine در حال حاضر رویدادهای reset/delete را برای همهٔ
harnessها از دست بدهد.

### ۱۰. مدیریت خطا

از semantics داخلی OpenClaw پیروی کنید:

- شکست‌های bootstrap هشدار می‌دهند و ادامه می‌دهند
- شکست‌های assemble هشدار می‌دهند و به پیام‌ها/prompt خط لولهٔ assembleنشده fallback می‌کنند
- شکست‌های afterTurn/ingest هشدار می‌دهند و finalization پس از نوبت را ناموفق علامت‌گذاری می‌کنند
- maintenance فقط پس از نوبت‌های موفق، abortنشده و non-yield اجرا می‌شود
- خطاهای compaction نباید به‌عنوان promptهای تازه دوباره تلاش شوند

افزوده‌های مخصوص Codex:

- اگر projection مربوط به context شکست خورد، هشدار دهید و به prompt اصلی fallback کنید.
- اگر آینهٔ transcript شکست خورد، همچنان finalization مربوط به context-engine را با
  پیام‌های fallback تلاش کنید.
- اگر پس از موفقیت compaction مربوط به context-engine، compaction بومی Codex شکست خورد،
  وقتی context engine اصلی است، کل compaction OpenClaw را ناموفق نکنید.

## برنامهٔ آزمون

### آزمون‌های unit

آزمون‌هایی زیر `extensions/codex/src/app-server` اضافه کنید:

1. `run-attempt.context-engine.test.ts`
   - Codex وقتی فایل session وجود دارد `bootstrap` را فراخوانی می‌کند.
   - Codex، `assemble` را با پیام‌های آینه‌شده، بودجهٔ token، نام toolها،
     حالت citations، شناسهٔ مدل، و prompt فراخوانی می‌کند.
   - `systemPromptAddition` در دستورالعمل‌های developer قرار می‌گیرد.
   - پیام‌های assembleشده پیش از درخواست فعلی به prompt projected می‌شوند.
   - Codex پس از mirroring مربوط به transcript، `afterTurn` را فراخوانی می‌کند.
   - بدون `afterTurn`، Codex `ingestBatch` یا `ingest` تک‌پیامی را فراخوانی می‌کند.
   - maintenance نوبت پس از نوبت‌های موفق اجرا می‌شود.
   - maintenance نوبت در صورت خطای prompt، abort، یا yield abort اجرا نمی‌شود.

2. `context-engine-projection.test.ts`
   - خروجی پایدار برای ورودی‌های یکسان
   - وقتی history assembleشده شامل prompt فعلی است، prompt فعلی تکراری ایجاد نمی‌شود
   - history خالی را مدیریت می‌کند
   - ترتیب roleها را حفظ می‌کند
   - system prompt addition را فقط در دستورالعمل‌های developer قرار می‌دهد

3. `compact.context-engine.test.ts`
   - نتیجهٔ اصلی context engine مالک برنده می‌شود
   - وقتی compaction بومی Codex نیز تلاش می‌شود، وضعیت آن در details ظاهر می‌شود
   - شکست بومی Codex باعث شکست compaction مربوط به context-engine مالک نمی‌شود
   - context engine غیرمالک رفتار فعلی compaction بومی را حفظ می‌کند

### آزمون‌های موجود برای به‌روزرسانی

- `extensions/codex/src/app-server/run-attempt.test.ts` اگر وجود دارد، در غیر این صورت
  نزدیک‌ترین آزمون‌های اجرای app-server در Codex.
- `extensions/codex/src/app-server/event-projector.test.ts` فقط اگر جزئیات رویداد
  compaction تغییر کند.
- `src/agents/harness/selection.test.ts` نباید نیاز به تغییر داشته باشد، مگر اینکه
  رفتار config تغییر کند؛ باید پایدار بماند.
- آزمون‌های داخلی harness context-engine باید بدون تغییر همچنان pass شوند.

### آزمون‌های integration / live

آزمون‌های smoke مربوط به harness زندهٔ Codex را اضافه یا گسترش دهید:

- `plugins.slots.contextEngine` را روی یک engine آزمایشی configure کنید
- `agents.defaults.model` را روی یک مدل `codex/*` configure کنید
- provider/model `agentRuntime.id = "codex"` را configure کنید
- assert کنید engine آزمایشی موارد زیر را مشاهده کرده است:
  - bootstrap
  - assemble
  - afterTurn یا ingest
  - maintenance

از الزام lossless-claw در آزمون‌های core OpenClaw پرهیز کنید. از یک Plugin جعلی
کوچک context engine درون repo استفاده کنید.

## مشاهده‌پذیری

اطراف فراخوانی‌های lifecycle مربوط به context-engine در Codex، debug log اضافه کنید:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` همراه با reason
- `codex native compaction completed alongside context-engine compaction`

از log کردن promptهای کامل یا محتوای transcript پرهیز کنید.

در جاهایی که مفید است، فیلدهای ساختاریافته اضافه کنید:

- `sessionId`
- `sessionKey` مطابق با رویهٔ logging موجود redacted یا حذف‌شده
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## migration / سازگاری

این باید backward-compatible باشد:

- اگر هیچ context engineای configure نشده باشد، رفتار legacy context engine باید
  معادل رفتار امروز harness Codex باشد.
- اگر `assemble` مربوط به context-engine شکست بخورد، Codex باید با مسیر prompt
  اصلی ادامه دهد.
- bindingهای موجود thread در Codex باید معتبر بمانند.
- fingerprinting پویای tool نباید خروجی context-engine را شامل شود؛ در غیر این صورت
  هر تغییر context می‌تواند یک thread جدید Codex را اجباری کند. فقط catalog مربوط
  به tool باید fingerprint پویای tool را تحت تأثیر قرار دهد.

## پرسش‌های باز

1. آیا context assembleشده باید کاملاً در prompt کاربر تزریق شود، کاملاً در
   دستورالعمل‌های developer، یا تقسیم شود؟

   توصیه: تقسیم شود. `systemPromptAddition` را در دستورالعمل‌های developer بگذارید؛
   context مربوط به transcript assembleشده را در wrapper مربوط به prompt کاربر قرار دهید.
   این با protocol فعلی Codex، بدون mutate کردن history بومی thread، بیشترین تطابق را دارد.

2. آیا وقتی یک context engine مالک compaction است، compaction بومی Codex باید
   غیرفعال شود؟

   توصیه: نه، نه در ابتدا. compaction بومی Codex ممکن است همچنان برای زنده نگه‌داشتن
   thread در app-server لازم باشد. اما باید به‌عنوان compaction بومی Codex گزارش شود،
   نه به‌عنوان compaction مربوط به context-engine.

3. آیا `before_prompt_build` باید پیش از assembly مربوط به context-engine اجرا شود
   یا پس از آن؟

   توصیه: برای Codex پس از projection مربوط به context-engine، تا hookهای عمومی
   harness، prompt/دستورالعمل‌های developer واقعی را که Codex دریافت خواهد کرد ببینند.
   اگر parity با harness داخلی خلاف این را لازم دارد، ترتیب انتخاب‌شده را در آزمون‌ها
   encode و اینجا مستند کنید.

4. آیا app-server در Codex می‌تواند در آینده یک override ساختاریافتهٔ context/history
   بپذیرد؟

   نامشخص است. اگر بتواند، لایهٔ projection متنی را با آن protocol جایگزین کنید و
   فراخوانی‌های lifecycle را بدون تغییر نگه دارید.

## معیارهای پذیرش

- یک نوبت harness embedded از نوع `codex/*`، lifecycle مربوط به assemble در context engine
  انتخاب‌شده را invoke می‌کند.
- `systemPromptAddition` مربوط به context-engine بر دستورالعمل‌های developer در Codex اثر می‌گذارد.
- context assembleشده به‌صورت deterministic بر ورودی نوبت Codex اثر می‌گذارد.
- نوبت‌های موفق Codex، `afterTurn` یا fallback ingest را فراخوانی می‌کنند.
- نوبت‌های موفق Codex، maintenance نوبت مربوط به context-engine را اجرا می‌کنند.
- نوبت‌های شکست‌خورده/abortشده/yield-aborted، maintenance نوبت را اجرا نمی‌کنند.
- compaction تحت مالکیت context-engine برای وضعیت OpenClaw/Plugin اصلی می‌ماند.
- compaction بومی Codex به‌عنوان رفتار بومی Codex قابل audit می‌ماند.
- رفتار موجود context-engine در harness داخلی بدون تغییر می‌ماند.
- رفتار موجود harness Codex وقتی هیچ context engine غیرlegacy انتخاب نشده یا وقتی
  assembly شکست می‌خورد، بدون تغییر می‌ماند.
