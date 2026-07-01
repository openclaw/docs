---
read_when:
    - انتقال داده‌های زمان اجرا، کش، رونوشت‌ها، وضعیت وظیفه یا فایل‌های موقت کاری OpenClaw به SQLite
    - طراحی مهاجرت‌های doctor از فایل‌های JSON یا JSONL
    - تغییر رفتار پشتیبان‌گیری، بازیابی، VFS، یا ذخیره‌سازی worker
    - حذف قفل‌های نشست، هرس، کوتاه‌سازی، یا مسیرهای سازگاری JSON
summary: برنامهٔ مهاجرت برای تبدیل SQLite به لایهٔ اصلی وضعیت و کش پایدار، در حالی که پشتیبانی مبتنی بر فایل پیکربندی حفظ می‌شود
title: بازسازی وضعیت با رویکرد اولویت پایگاه داده
x-i18n:
    generated_at: "2026-07-01T20:29:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# بازآرایی وضعیت با اولویت پایگاه‌داده

## تصمیم

از یک چیدمان SQLite دو‌سطحی استفاده کنید:

- پایگاه‌داده سراسری: `~/.openclaw/state/openclaw.sqlite`
- پایگاه‌داده عامل: یک پایگاه‌داده SQLite برای هر عامل، برای فضای کاری متعلق به عامل،
  رونوشت، VFS، مصنوع، و وضعیت زمان اجرای بزرگ و مختص هر عامل
- پیکربندی همچنان مبتنی بر فایل می‌ماند: `openclaw.json` بیرون از
  پایگاه‌داده باقی می‌ماند. پروفایل‌های احراز هویت زمان اجرا به SQLite منتقل می‌شوند؛ فایل‌های اعتبارنامه ارائه‌دهنده خارجی یا CLI
  بیرون از پایگاه‌داده OpenClaw و تحت مدیریت مالک باقی می‌مانند.

پایگاه‌داده سراسری، پایگاه‌داده سطح کنترل است. این پایگاه‌داده مالک کشف عامل،
وضعیت مشترک Gateway، جفت‌سازی، وضعیت دستگاه/Node، دفترهای task و flow، وضعیت plugin،
وضعیت زمان اجرای زمان‌بند، فراداده پشتیبان‌گیری، و وضعیت مهاجرت است.

پایگاه‌داده عامل، پایگاه‌داده سطح داده است. این پایگاه‌داده مالک فراداده نشست عامل،
جریان رویداد رونوشت، فضای کاری VFS یا فضای نام scratch، مصنوعات ابزار،
مصنوعات اجرا، و داده‌های کش محلی عامل که قابل جست‌وجو/ایندکس‌گذاری هستند است.

این کار یک نمای سراسری پایدار می‌دهد، بدون اینکه فضاهای کاری بزرگ عامل،
رونوشت‌ها، و داده‌های scratch دودویی به مسیر نوشتن مشترک Gateway تحمیل شوند.

## قرارداد سخت

این مهاجرت یک شکل زمان اجرای کانونی دارد:

- ردیف‌های نشست فقط فراداده نشست را پایدار می‌کنند. آن‌ها نباید
  `transcriptLocator`، مسیرهای فایل رونوشت، مسیرهای JSONL هم‌سطح، مسیرهای قفل،
  فراداده هرس، یا اشاره‌گرهای سازگاری دوران فایل را پایدار کنند.
- هویت رونوشت همیشه هویت SQLite است: `{agentId, sessionId}` به‌همراه
  فراداده اختیاری topic در جایی که پروتکل به آن نیاز دارد.
- `sqlite-transcript://...` هویت زمان اجرا یا پروتکل نیست. کد جدید نباید
  مکان‌یاب‌های رونوشت را استخراج، پایدار، پاس، parse، یا migrate کند. زمان اجرا و
  تست‌ها اصلاً نباید شبه‌مکان‌یاب داشته باشند؛ مستندات فقط برای ممنوع‌کردن این رشته
  می‌توانند به آن اشاره کنند.
- `sessions.json` قدیمی، JSONL رونوشت، `.jsonl.lock`، هرس، کوتاه‌سازی،
  و منطق قدیمی مسیر نشست فقط به مسیر مهاجرت/درون‌ریزی doctor تعلق دارند.
- aliasهای پیکربندی نشست قدیمی فقط به مهاجرت doctor تعلق دارند. زمان اجرا
  `session.idleMinutes`، `session.resetByType.dm`، یا aliasهای نشست اصلی
  `agent:main:*` بین‌عاملی برای یک عامل پیکربندی‌شده دیگر را تفسیر نمی‌کند.
- هویت مسیریابی نشست، وضعیت رابطه‌ای تایپ‌شده است. مسیرهای داغ زمان اجرا و UI
  باید `sessions.session_scope`، `sessions.account_id`،
  `sessions.primary_conversation_id`، `conversations`، و
  `session_conversations` را بخوانند؛ آن‌ها نباید `session_key` را parse کنند یا
  `session_entries.entry_json` را برای هویت ارائه‌دهنده استخراج کنند، مگر به‌عنوان
  سایه سازگاری موقت در حالی که call siteهای قدیمی در حال حذف‌شدن هستند.
- نشانگرهای پیام مستقیم در سطح کانال مانند `dm` در برابر `direct` واژگان مسیریابی‌اند،
  نه مکان‌یاب رونوشت یا handleهای سازگاری file-store.
- پیکربندی handler هوک قدیمی فقط به سطح‌های هشدار/مهاجرت doctor تعلق دارد.
  زمان اجرا نباید `hooks.internal.handlers` را load کند؛ هوک‌ها فقط از طریق
  دایرکتوری‌های هوک کشف‌شده و فراداده `HOOK.md` اجرا می‌شوند.
- شروع زمان اجرا، مسیرهای پاسخ داغ، Compaction، reset، بازیابی، diagnostics،
  TTS، هوک‌های memory، subagents، مسیریابی فرمان plugin، مرزهای پروتکل، و
  هوک‌ها باید `{agentId, sessionId}` را در زمان اجرا پاس کنند.
- تست‌ها باید ردیف‌های رونوشت SQLite را از طریق `{agentId, sessionId}` seed و assert کنند.
  تست‌هایی که فقط forward شدن مسیر JSONL، حفظ مکان‌یاب ارائه‌شده توسط caller، یا
  سازگاری فایل رونوشت را ثابت می‌کنند باید حذف شوند، مگر اینکه درون‌ریزی doctor،
  materialization پشتیبانی/اشکال‌زدایی غیرنشستی، یا شکل پروتکل را پوشش دهند.
- `runEmbeddedPiAgent(...)`، اجراهای worker آماده‌شده، و تلاش embedded داخلی
  نباید مکان‌یاب‌های رونوشت را بپذیرند. آن‌ها مدیر رونوشت SQLite را با
  `{agentId, sessionId}` باز می‌کنند و آن مدیر را به نشست عامل سازگار با PI
  internalized پاس می‌کنند تا callerهای کهنه نتوانند runner را وادار به نوشتن
  رونوشت‌های JSON/JSONL کنند.
- diagnostics مربوط به runner باید رکوردهای trace زمان اجرا/کش/payload را در SQLite ذخیره کند.
  diagnostics زمان اجرا نباید knobهای override فایل JSONL یا helperهای generic
  export رونوشت JSONL را expose کند؛ exportهای کاربرمحور می‌توانند مصنوعات صریح را
  از ردیف‌های پایگاه‌داده materialize کنند بدون اینکه نام فایل‌ها را دوباره به زمان اجرا بدهند.
- ثبت خام stream از `OPENCLAW_RAW_STREAM=1` به‌همراه ردیف‌های diagnostics در SQLite استفاده می‌کند.
  قرارداد قدیمی pi-mono یعنی `PI_RAW_STREAM`، `PI_RAW_STREAM_PATH`، و
  logger فایل `raw-openai-completions.jsonl` بخشی از زمان اجرا یا تست‌های OpenClaw نیست.
- ایندکس‌گذاری memory در QMD نباید رونوشت‌های SQLite را به فایل‌های markdown export کند.
  QMD فقط فایل‌های memory پیکربندی‌شده را ایندکس می‌کند؛ جست‌وجوی رونوشت نشست
  مبتنی بر SQLite باقی می‌ماند.
- زیرمسیر SDK مربوط به QMD فقط برای کد جدید مخصوص QMD است. helperهای ایندکس‌گذاری
  رونوشت نشست SQLite روی `memory-core-host-engine-session-transcripts` قرار دارند؛
  هر re-export از QMD فقط سازگاری است و نباید توسط کد زمان اجرا استفاده شود.
- ایندکس‌های memory داخلی در پایگاه‌داده عامل مالک زندگی می‌کنند. پیکربندی زمان اجرا و
  قراردادهای زمان اجرای resolve‌شده نباید `memorySearch.store.path` را expose کنند؛
  doctor آن کلید پیکربندی قدیمی را حذف می‌کند و کد فعلی `databasePath` عامل را
  به‌صورت داخلی پاس می‌کند.

کار پیاده‌سازی باید به حذف کد ادامه دهد تا این گزاره‌ها بدون استثنا بیرون از مرزهای
doctor/import/export/debug درست باشند.

## وضعیت هدف و پیشرفت

### هدف سخت

- یک پایگاه‌داده SQLite سراسری مالک وضعیت سطح کنترل است:
  `state/openclaw.sqlite`.
- یک پایگاه‌داده SQLite به‌ازای هر عامل مالک وضعیت سطح داده است:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- پیکربندی مبتنی بر فایل باقی می‌ماند. `openclaw.json` بخشی از این بازآرایی
  پایگاه‌داده نیست.
- فایل‌های قدیمی فقط ورودی‌های مهاجرت doctor هستند.
- زمان اجرا هرگز JSONL نشست یا رونوشت را به‌عنوان وضعیت فعال نمی‌نویسد یا نمی‌خواند.

### وضعیت‌های هدف

- `not-started`: کد زمان اجرای دوران فایل هنوز وضعیت فعال را می‌نویسد.
- `migrating`: کد doctor/import می‌تواند داده‌های فایل را به SQLite منتقل کند.
- `dual-read`: پل موقت هم SQLite و هم فایل‌های قدیمی را می‌خواند. این وضعیت
  برای این بازآرایی ممنوع است مگر اینکه صراحتاً فقط برای doctor مستند شده باشد.
- `sqlite-runtime`: زمان اجرا فقط SQLite را می‌خواند و می‌نویسد.
- `clean`: APIها و تست‌های زمان اجرای قدیمی حذف شده‌اند، و guard از بازگشت جلوگیری می‌کند.
- `done`: مستندات، تست‌ها، پشتیبان‌گیری، مهاجرت doctor، و checkهای تغییرکرده
  وضعیت clean را ثابت می‌کنند.

### وضعیت فعلی

- نشست‌ها: برای زمان اجرا `clean`. ردیف‌های نشست در پایگاه‌داده هر عامل قرار دارند،
  APIهای زمان اجرا از `{agentId, sessionId}` یا `{agentId, sessionKey}` استفاده می‌کنند، و
  `sessions.json` فقط ورودی قدیمی doctor است.
- رونوشت‌ها: برای زمان اجرا `clean`. رویدادهای رونوشت، هویت‌ها، snapshotها،
  و رویدادهای زمان اجرای trajectory در پایگاه‌داده هر عامل قرار دارند. زمان اجرا دیگر
  مکان‌یاب‌های رونوشت یا مسیرهای رونوشت JSONL را نمی‌پذیرد.
- runner embedded در PI: `clean`. اجراهای PI embedded، workerهای آماده‌شده، Compaction،
  و حلقه‌های retry از scope نشست SQLite استفاده می‌کنند و handleهای رونوشت کهنه را رد می‌کنند.
- Cron: برای زمان اجرا `clean`. زمان اجرا از `cron_jobs` و `cron_run_logs` استفاده می‌کند؛
  تست‌های زمان اجرا از نام‌گذاری `storeKey` در SQLite استفاده می‌کنند، و مسیرهای cron دوران فایل
  فقط در تست‌های مهاجرت قدیمی doctor باقی می‌مانند.
- رجیستری task: `clean`. ردیف‌های زمان اجرای task و Task Flow در
  `state/openclaw.sqlite` قرار دارند؛ importerهای sidecar SQLite منتشرنشده حذف شده‌اند.
- وضعیت Plugin: `clean`. ردیف‌های وضعیت/blob مربوط به Plugin در پایگاه‌داده سراسری مشترک
  قرار دارند؛ helperهای قدیمی sidecar SQLite مربوط به وضعیت plugin guard شده‌اند.
- Memory: برای memory داخلی و ایندکس‌گذاری رونوشت نشست `sqlite-runtime`.
  جدول‌های ایندکس memory در پایگاه‌داده هر عامل قرار دارند، وضعیت memory مربوط به plugin از
  ردیف‌های مشترک وضعیت plugin استفاده می‌کند، و فایل‌های memory قدیمی ورودی‌های مهاجرت doctor
  یا محتوای فضای کاری کاربر هستند.
- پشتیبان‌گیری: `sqlite-runtime`. مراحل پشتیبان‌گیری snapshotهای SQLite را compact می‌کنند،
  sidecarهای زنده WAL/SHM را حذف می‌کنند، سلامت SQLite را verify می‌کنند، و اجراهای پشتیبان‌گیری را
  در پایگاه‌داده سراسری ثبت می‌کنند.
- مهاجرت doctor: عمداً `migrating`. doctor، JSON، JSONL، و storeهای sidecar بازنشسته
  قدیمی را به SQLite درون‌ریزی می‌کند، اجراها/منابع مهاجرت را ثبت می‌کند،
  و منابع موفق را حذف می‌کند.
- اسکریپت‌های E2E: برای پوشش زمان اجرا `clean`. seed کردن Docker MCP ردیف‌های SQLite می‌نویسد.
  اسکریپت Docker مربوط به runtime-context فقط درون seed مهاجرت doctor، JSONL قدیمی ایجاد می‌کند
  و مسیر ایندکس نشست قدیمی را صراحتاً نام‌گذاری می‌کند.

### کار باقی‌مانده

- [x] نام متغیرهای store در تست‌های زمان اجرای cron را از `storePath` دور کنید مگر اینکه
      ورودی‌های قدیمی doctor باشند.
      فایل‌ها: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      اثبات: `pnpm check:database-first-legacy-stores`؛ `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] mockهای تست export دوران فایل منسوخ را حذف یا تغییرنام دهید.
      فایل: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      اثبات: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] seed قدیمی JSONL مربوط به Docker runtime-context را آشکارا فقط مخصوص doctor کنید.
      فایل: `scripts/e2e/session-runtime-context-docker-client.ts`.
      اثبات: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` فقط
      `seedBrokenLegacySessionForDoctorMigration` را نشان می‌دهد.
- [x] پس از هر تغییر schema، typeهای تولیدشده Kysely را هم‌راستا نگه دارید.
      فایل‌ها: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      اثبات: در این pass تغییر schema وجود ندارد؛ `pnpm db:kysely:check`؛
      `pnpm lint:kysely`.
- [x] تست‌های متمرکز را برای storeها، فرمان‌ها، و اسکریپت‌های لمس‌شده دوباره اجرا کنید.
      اثبات: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`؛ `git diff --check`.
- [x] پیش از اعلام `done`، gate تغییرات یا اثبات گسترده remote را اجرا کنید.
      اثبات: `pnpm check:changed --timed -- <changed extension paths>` روی
      اجرای Hetzner Crabbox با شناسه `run_3f1cabf6b25c` پس از راه‌اندازی موقت Node 24/pnpm و
      مسیریابی صریح path برای workspace همگام‌شده بدون `.git` با موفقیت گذشت.

### بازگشت ایجاد نکنید

- مکان‌یاب رونوشت وجود نداشته باشد.
- فایل نشست فعال وجود نداشته باشد.
- fixtureهای تست JSONL جعلی وجود نداشته باشد، مگر در تست‌های مهاجرت قدیمی doctor.
- دسترسی خام SQLite در جایی که Kysely انتظار می‌رود وجود نداشته باشد.
- مهاجرت DB قدیمی جدید اضافه نشود. این چیدمان منتشر نشده است؛ نسخه schema را
  در `1` نگه دارید مگر اینکه دلیل قوی وجود داشته باشد.

## فرض‌های خواندن کد

هیچ تصمیم محصولی پیگیری‌شونده‌ای مانع این طرح نیست. پیاده‌سازی باید
با این فرض‌ها پیش برود:

- از `node:sqlite` مستقیماً استفاده کنید و برای این مسیر ذخیره‌سازی، runtime مربوط به Node 22+ را الزامی کنید.
- دقیقاً یک فایل پیکربندی عادی نگه دارید. در این بازآرایی، config، manifestهای plugin، یا workspaceهای Git را به SQLite منتقل نکنید.
- فایل‌های سازگاری runtime لازم نیستند. فایل‌های قدیمی JSON و JSONL فقط ورودی‌های مهاجرت هستند. sidecarهای SQLite محلیِ branch هرگز منتشر نشده‌اند و به‌جای import شدن حذف می‌شوند.
- `openclaw doctor --fix` مالک مرحله مهاجرت فایل قدیمی به پایگاه‌داده است.
  راه‌اندازی runtime و `openclaw migrate` نباید مسیرهای قدیمی ارتقای پایگاه‌داده OpenClaw را حمل کنند.
- سازگاری credential از همین قاعده پیروی می‌کند: credentialهای runtime در SQLite زندگی می‌کنند. فایل‌های قدیمی `auth-profiles.json`، فایل‌های `auth.json` مخصوص هر agent، و فایل‌های مشترک `credentials/oauth.json` ورودی‌های مهاجرت doctor هستند و سپس بعد از import حذف می‌شوند.
- وضعیت catalog مدل تولیدشده با پایگاه‌داده پشتیبانی می‌شود. کد runtime نباید `agents/<agentId>/agent/models.json` را بنویسد؛ فایل‌های موجود `models.json` ورودی‌های قدیمی doctor هستند و بعد از import به `agent_model_catalogs` حذف می‌شوند.
- runtime نباید locatorهای transcript را migrate، normalize، یا bridge کند. هویت transcript فعال در SQLite برابر `{agentId, sessionId}` است. مسیرهای فایل فقط ورودی‌های قدیمی doctor هستند، و `sqlite-transcript://...` باید از سطوح runtime، protocol، hook، و plugin حذف شود، نه اینکه به‌عنوان handle مرزی با آن رفتار شود.
- خواندن transcriptهای SQLite در runtime، migrationهای قدیمی شکل entryهای JSONL را اجرا نمی‌کند و برای سازگاری کل transcriptها را بازنویسی نمی‌کند. نرمال‌سازی entryهای قدیمی در ابزارهای صریح doctor/import باقی می‌ماند. doctor فایل‌های transcript قدیمی JSONL را پیش از درج ردیف‌های SQLite نرمال‌سازی می‌کند؛ ردیف‌های runtime فعلی از قبل با schema فعلی transcript نوشته می‌شوند. export مربوط به trajectory/session همان ردیف‌ها را همان‌طور که هستند می‌خواند و نباید هنگام export، migrationهای قدیمی انجام دهد.
- helperهای parse/migration مربوط به transcript JSONL قدیمی فقط برای doctor هستند. کد قالب transcript در runtime فقط context فعلی transcript SQLite را می‌سازد؛ doctor مالک ارتقای entryهای قدیمی JSONL پیش از درج ردیف‌ها است.
- helper قدیمی streaming transcript JSONL که مالکیتش با runtime بود حذف شد. کد import مربوط به doctor مالک خواندن صریح فایل‌های قدیمی است؛ خواندن history session در runtime ردیف‌های SQLite را می‌خواند.
- bindingهای app-server مربوط به Codex از `sessionId` متعلق به OpenClaw به‌عنوان کلید canonical در namespace وضعیت plugin مربوط به Codex استفاده می‌کنند. `sessionKey` metadata برای routing/display است و نباید جایگزین id پایدار session شود یا هویت مبتنی بر فایل transcript را زنده کند.
- engineهای context قرارداد runtime فعلی را مستقیماً دریافت می‌کنند. registry نباید engineها را با shimهای retry که `sessionKey`، `transcriptScope`، یا `prompt` را حذف می‌کنند wrap کند؛ engineهایی که نمی‌توانند پارامترهای فعلی database-first را بپذیرند باید به‌جای bridge شدن، با خطای آشکار fail شوند.
- خروجی backup باید همچنان یک فایل archive باشد. محتوای پایگاه‌داده باید به‌صورت snapshotهای فشرده SQLite وارد آن archive شود، نه sidecarهای خام و live مربوط به WAL.
- جست‌وجوی transcript مفید است اما برای نخستین برش database-first الزامی نیست. schema را طوری طراحی کنید که بعداً بتوان FTS را اضافه کرد.
- اجرای worker باید تا زمانی که مرز پایگاه‌داده تثبیت می‌شود، پشت settings به‌صورت experimental باقی بماند.

## یافته‌های خواندن کد

branch فعلی از مرحله اثبات مفهوم عبور کرده است. پایگاه‌داده مشترک وجود دارد، `node:sqlite` مربوط به Node از طریق یک helper کوچک runtime وصل شده است، و storeهای قبلی اکنون در `state/openclaw.sqlite` یا پایگاه‌داده مالک `openclaw-agent.sqlite` می‌نویسند.

کار باقی‌مانده انتخاب SQLite نیست؛ تمیز نگه داشتن مرز جدید و حذف interfaceهای شبیه سازگاری است که هنوز شبیه دنیای قدیمی فایل به نظر می‌رسند:

- `storePath` مربوط به session دیگر هویت runtime، شکل fixture تست، یا field در payload وضعیت نیست. تست‌های runtime و bridge دیگر نام قرارداد `storePath` را ندارند؛ کد doctor/migration مالک آن واژگان قدیمی است.
- نوشتن‌های session دیگر از queue قدیمی درون‌فرایندی `store-writer.ts` عبور نمی‌کنند. نوشتن‌های patch در SQLite به‌جای آن از تشخیص conflict و retry محدود استفاده می‌کنند.
- کشف مسیر قدیمی هنوز کاربردهای معتبر مهاجرت دارد، اما کد runtime باید دیگر با `sessions.json` و فایل‌های transcript JSONL به‌عنوان هدف‌های نوشتن احتمالی رفتار نکند.
- tableهای متعلق به agent در پایگاه‌داده‌های SQLite مخصوص هر agent زندگی می‌کنند. پایگاه‌داده global ردیف‌های registry/control-plane را نگه می‌دارد؛ هویت transcript در ردیف‌های transcript مخصوص هر agent برابر `{agentId, sessionId}` است. کد runtime نباید مسیرهای فایل transcript را persist کند یا locatorهای transcript را migrate کند.
- doctor از قبل چند فایل قدیمی را import می‌کند. پاک‌سازی این است که آن را به یک پیاده‌سازی مهاجرت صریح واحد تبدیل کنیم که doctor آن را فراخوانی می‌کند، همراه با یک گزارش مهاجرت پایدار.

هیچ پرسش محصولی دیگری مانع پیاده‌سازی نیست.

## شکل فعلی کد

branch از قبل یک پایه واقعی SQLite مشترک دارد:

- کف زمان اجرا اکنون Node 22+ است: `package.json`، گارد زمان اجرای CLI،
  پیش‌فرض‌های نصب‌کننده، مکان‌یاب زمان اجرای macOS، CI، و مستندات عمومی نصب
  همگی همسو هستند. مسیر سازگاری قدیمی Node 22 حذف شده است.
- `src/state/openclaw-state-db.ts` فایل `openclaw.sqlite` را باز می‌کند، WAL،
  `synchronous=NORMAL`، `busy_timeout=30000`، `foreign_keys=ON` را تنظیم می‌کند
  و ماژول شِمای تولیدشده برگرفته از
  `src/state/openclaw-state-schema.sql` را اعمال می‌کند.
- نوع‌های جدول Kysely و ماژول‌های شِمای زمان اجرا از پایگاه‌های داده SQLite
  یک‌بارمصرفی تولید می‌شوند که از فایل‌های `.sql` ثبت‌شده ساخته شده‌اند؛ کد
  زمان اجرا دیگر رشته‌های شِمای کپی‌پیست‌شده را برای پایگاه‌های داده سراسری،
  هر عامل، یا ضبط پراکسی نگه نمی‌دارد.
- ذخیره‌سازهای زمان اجرا نوع‌های ردیف انتخاب‌شده و درج‌شده را از همان
  واسط‌های Kysely `DB` تولیدشده استخراج می‌کنند، به‌جای اینکه شکل ردیف‌های
  SQLite را دستی سایه‌سازی کنند. SQL خام همچنان به اعمال شِما، pragmaها، و
  DDL مخصوص مهاجرت محدود است.
- شِماهای SQLite به `user_version = 1` خلاصه شده‌اند، چون این چیدمان پایگاه
  داده هنوز منتشر نشده است. بازکننده‌های زمان اجرا فقط شِمای فعلی را ایجاد
  می‌کنند؛ واردسازی فایل به پایگاه داده همچنان در کد doctor باقی می‌ماند، و
  کمک‌کننده‌های ارتقای پایگاه داده محلی شاخه حذف شده‌اند.
- مالکیت رابطه‌ای در جایی اعمال می‌شود که مرز مالکیت canonical است:
  ردیف‌های مهاجرت منبع از `migration_runs` آبشاری حذف می‌شوند، وضعیت تحویل
  وظیفه از `task_runs` آبشاری حذف می‌شود، و ردیف‌های هویت transcript از
  رویدادهای transcript آبشاری حذف می‌شوند.
- جدول‌های مشترک فعلی شامل `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` و `backup_runs` هستند.
- وضعیت دلخواهِ تحت مالکیت Plugin جدول‌های typed تحت مالکیت میزبان دریافت
  نمی‌کند. Pluginهای نصب‌شده از `plugin_state_entries` برای payloadهای JSON
  نسخه‌دار و از `plugin_blob_entries` برای بایت‌ها استفاده می‌کنند، همراه با
  مالکیت namespace/key، پاک‌سازی TTL، پشتیبان‌گیری، و رکوردهای مهاجرت Plugin.
  وضعیت هماهنگ‌سازی Plugin تحت مالکیت میزبان همچنان می‌تواند جدول‌های typed
  داشته باشد، وقتی میزبان مالک قرارداد query است، مانند
  `plugin_binding_approvals`.
- مهاجرت‌های Plugin مهاجرت داده روی namespaceهای تحت مالکیت Plugin هستند، نه
  مهاجرت شِمای میزبان. یک Plugin می‌تواند ورودی‌های state/blob نسخه‌دار خودش
  را از طریق یک ارائه‌دهنده مهاجرت منتقل کند، و میزبان وضعیت source/run را در
  دفتر مهاجرت معمول ثبت می‌کند. نصب‌های جدید Plugin نیازی به تغییر
  `openclaw-state-schema.sql` ندارند، مگر اینکه خود میزبان مالکیت یک قرارداد
  cross-plugin جدید را بر عهده بگیرد.
- `src/state/openclaw-agent-db.ts` فایل
  `agents/<agentId>/agent/openclaw-agent.sqlite` را باز می‌کند، پایگاه داده را
  در DB سراسری ثبت می‌کند، و مالک جدول‌های محلی عامل برای نشست، transcript،
  VFS، artifact، cache، و نمایه حافظه است. کشف مشترک زمان اجرا اکنون رجیستری
  `agent_databases` با نوع‌های تولیدشده را می‌خواند، به‌جای اینکه آن query را
  در هر محل فراخوانی دوباره پیاده‌سازی کند.
- پایگاه‌های داده سراسری و هر عامل یک ردیف `schema_meta` را با نقش پایگاه
  داده، نسخه شِما، timestampها، و شناسه عامل برای پایگاه‌های داده عامل ثبت
  می‌کنند. چیدمان همچنان روی `user_version = 1` می‌ماند، چون این شِمای SQLite
  هنوز منتشر نشده است.
- هویت نشست هر عامل اکنون یک جدول ریشه canonical به نام `sessions` دارد که با
  `session_id` کلیدگذاری می‌شود، با `session_key`, `session_scope`,
  `account_id`, `primary_conversation_id`, timestampها، فیلدهای نمایشی،
  فراداده مدل، شناسه harness، و پیوند parent/spawn به‌عنوان ستون‌های قابل
  query. `session_routes` نمایه مسیر فعال یکتا از `session_key` به
  `session_id` فعلی است، بنابراین یک کلید مسیر می‌تواند به یک نشست durable
  تازه منتقل شود بدون اینکه خواندن‌های داغ مجبور شوند بین ردیف‌های تکراری
  `sessions.session_key` انتخاب کنند. payload قدیمی با شکل سازگاری
  `session_entries.entry_json` با کلید خارجی از ریشه durable `session_id`
  آویزان است؛ دیگر تنها نمایش سطح شِما از یک نشست نیست.
- هویت گفت‌وگوی خارجی هر عامل نیز رابطه‌ای است:
  `conversations` هویت provider/account/conversation نرمال‌شده را ذخیره
  می‌کند، و `session_conversations` یک نشست OpenClaw را به یک یا چند گفت‌وگوی
  خارجی پیوند می‌دهد. این حالت نشست‌های DM اصلی مشترک را پوشش می‌دهد که در
  آن‌ها چند peer می‌توانند عمداً به یک نشست نگاشت شوند بدون اینکه در
  `session_key` خلاف واقع گفته شود. SQLite همچنین یکتایی را برای هویت طبیعی
  provider اعمال می‌کند تا همان tuple کانال/account/kind/peer/thread نتواند
  در چند شناسه گفت‌وگو منشعب شود. peerهای مستقیم اصلی مشترک با نقش
  `participant` پیوند داده می‌شوند، بنابراین یک نشست OpenClaw می‌تواند چند
  peer خارجی DM را نمایش دهد بدون اینکه peerهای قدیمی‌تر به ردیف‌های مرتبط
  مبهم تنزل پیدا کنند. `sessions.primary_conversation_id` همچنان به هدف تحویل
  typed فعلی اشاره می‌کند. ستون‌های بسته routing/status با محدودیت‌های SQLite
  `CHECK` اعمال می‌شوند، نه فقط با اتکا به unionهای TypeScript.
  projection نشست زمان اجرا سایه‌های routing سازگاری را از
  `session_entries.entry_json` پیش از اعمال ستون‌های typed نشست/گفت‌وگو پاک
  می‌کند، بنابراین payloadهای JSON کهنه نمی‌توانند هدف‌های تحویل را دوباره
  زنده کنند.
  routing اعلان subagent نیز context تحویل typed SQLite را لازم دارد؛ دیگر به
  فیلدهای مسیر سازگاری `SessionEntry` fallback نمی‌کند.
  وراثت تحویل explicit در Gateway `chat.send` به‌جای فیلدهای سازگاری
  `origin`/`last*`، context تحویل typed SQLite را می‌خواند.
  `tools.effective` نیز context provider/account/thread را از ردیف‌های typed
  تحویل/routing در SQLite استخراج می‌کند، نه از سایه‌های نشست-ورودی کهنه
  `last*`.
  context prompt رویداد سیستم فیلدهای channel/to/account/thread را از فیلدهای
  typed تحویل بازسازی می‌کند، نه از سایه‌های `origin`.
  کمک‌کننده مشترک `deliveryContextFromSession` و mapper نشست به گفت‌وگو اکنون
  `SessionEntry.origin` را کاملاً نادیده می‌گیرند؛ فقط فیلدهای typed تحویل و
  ردیف‌های رابطه‌ای گفت‌وگو می‌توانند هویت مسیر داغ بسازند.
  نرمال‌سازی ورودی نشست زمان اجرا، `origin` را پیش از persist یا projection
  کردن `entry_json` حذف می‌کند، و نوشتن فراداده ورودی فیلدهای typed
  channel/chat به‌علاوه ردیف‌های رابطه‌ای گفت‌وگو را می‌نویسد، به‌جای ایجاد
  سایه‌های origin جدید.
- رویدادهای transcript، snapshotهای transcript، و رویدادهای زمان اجرای
  trajectory اکنون به ریشه canonical `sessions` هر عامل ارجاع می‌دهند و با حذف
  نشست آبشاری حذف می‌شوند. ردیف‌های هویت/idempotency transcript همچنان از
  همان ردیف دقیق رویداد transcript آبشاری حذف می‌شوند.
- نمایه‌های memory-core اکنون از جدول‌های explicit پایگاه داده عامل
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` و
  `memory_embedding_cache` استفاده می‌کنند، و `memory_index_state` تغییرات
  revision را دنبال می‌کند. نمایه‌های جانبی اختیاری FTS/vector با نام‌های
  `memory_index_chunks_fts` و `memory_index_chunks_vec` نام‌گذاری شده‌اند، نه
  جدول‌های عمومی `meta`, `files`, `chunks`, `chunks_fts` یا `chunks_vec`.
  نام‌های canonical شکل فعلی ردیف path/source و سازگاری embedding سریال‌شده
  را حفظ می‌کنند. این جدول‌ها cache مشتق‌شده/جست‌وجو هستند، نه ذخیره‌سازی
  canonical transcript؛ می‌توان آن‌ها را حذف و از فایل‌های workspace حافظه و
  sourceهای پیکربندی‌شده بازسازی کرد.
  باز کردن یک نمایه حافظه منتشرشده با نام عمومی، metadata، sourceها، chunkها،
  و cache embedding آن را به جدول‌های canonical منتقل می‌کند؛ جدول‌های مشتق
  FTS/vector با نام‌های canonical خودشان بازسازی می‌شوند.
- وضعیت بازیابی اجرای subagent اکنون در ردیف‌های typed مشترک `subagent_runs`
  با کلیدهای نشست فرزند، درخواست‌کننده، و کنترل‌کننده نمایه‌شده زندگی می‌کند.
  فایل قدیمی `subagents/runs.json` فقط ورودی مهاجرت doctor است.
- bindingهای گفت‌وگوی فعلی اکنون در ردیف‌های typed مشترک
  `current_conversation_bindings` زندگی می‌کنند که با شناسه گفت‌وگوی
  نرمال‌شده کلیدگذاری شده‌اند، همراه با ستون‌های عامل/نشست هدف، نوع گفت‌وگو،
  وضعیت، انقضا، و فراداده که به‌صورت ستون‌های رابطه‌ای ذخیره می‌شوند، نه یک
  رکورد binding opaque تکراری.
  کلید durable binding شامل نوع گفت‌وگوی نرمال‌شده است تا ارجاع‌های
  direct/group/channel با هم برخورد نکنند، و SQLite مقدارهای binding
  kind/status نامعتبر را رد می‌کند. فایل قدیمی
  `bindings/current-conversations.json` فقط ورودی مهاجرت doctor است.
- بازیابی صف تحویل اکنون ستون‌های typed صف برای channel، target، account،
  session، retry، error، platform-send، و recovery state را روی JSON replay
  overlay می‌کند. `entry_json` payloadهای replay، hookها، و payload قالب‌بندی
  را نگه می‌دارد، اما ستون‌های typed برای routing/state داغ صف authoritative
  هستند.
- اشاره‌گرهای بازیابی آخرین نشست TUI اکنون در ردیف‌های typed مشترک
  `tui_last_sessions` زندگی می‌کنند که با scope هش‌شده اتصال/نشست TUI
  کلیدگذاری شده‌اند. فایل JSON قدیمی TUI فقط ورودی مهاجرت doctor است.
- prefs پیش‌فرض TTS اکنون در ردیف‌های SQLite مشترک plugin-state زندگی می‌کنند
  که زیر Plugin `speech-core` کلیدگذاری شده‌اند. فایل قدیمی
  `settings/tts.json` فقط ورودی مهاجرت doctor است؛ زمان اجرا دیگر فایل‌های
  JSON prefs مربوط به TTS را نمی‌خواند یا نمی‌نویسد، و resolver مسیر legacy در
  ماژول مهاجرت doctor زندگی می‌کند.
- فراداده هدف secret اکنون درباره storeها صحبت می‌کند، به‌جای اینکه وانمود
  کند هر هدف credential یک فایل config است. `openclaw.json` همچنان config
  store باقی می‌ماند؛ هدف‌های auth-profile از ردیف‌های typed SQLite
  `auth_profile_stores` استفاده می‌کنند که credentialهای دارای شکل provider
  را به‌صورت payloadهای JSON نگه می‌دارند.
- audit مربوط به secret دیگر فایل‌های بازنشسته هر عامل `auth.json` را scan
  نمی‌کند. doctor مالک هشدار دادن درباره آن فایل legacy، وارد کردن آن، و حذف
  آن است.
- کمک‌کننده‌های مسیر legacy برای auth profile اکنون در کد legacy مربوط به
  doctor زندگی می‌کنند. کمک‌کننده‌های مسیر core برای auth profile هویت و
  محل‌های نمایش auth-store در SQLite را expose می‌کنند، نه مسیرهای زمان اجرای
  `auth-profiles.json` یا `auth-state.json`.
- ماژول‌های زمان اجرای بازیابی اجرای subagent و cache قابلیت مدل OpenRouter
  اکنون reader/writerهای snapshot SQLite را از کمک‌کننده‌های واردسازی JSON
  legacy مخصوص doctor جدا نگه می‌دارند. قابلیت‌های OpenRouter از ردیف‌های
  typed عمومی `model_capability_cache` زیر `provider_id = "openrouter"` استفاده
  می‌کنند، نه یک blob cache opaque یا یک جدول میزبان مخصوص provider. مقدار
  `taskName` اجرای subagent در ستون typed `subagent_runs.task_name` ذخیره
  می‌شود؛ کپی `payload_json` داده replay/debug است، نه منبع فیلدهای نمایش یا
  lookup داغ.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` یک VFS مبتنی بر SQLite را
  روی جدول `vfs_entries` پایگاه داده عامل پیاده‌سازی می‌کند. خواندن‌های
  directory، exportهای recursive، deleteها، و renameها از rangeهای prefix
  نمایه‌شده `(namespace, path)` استفاده می‌کنند، به‌جای scan کردن کل یک
  namespace یا اتکا به تطبیق مسیر با `LIKE`.
- `src/agents/runtime-worker.entry.ts` برای workerها VFS مبتنی بر SQLite،
  ذخیره‌ساز artifact ابزار، artifact اجرا، و cache دارای scope را برای هر اجرا
  ایجاد می‌کند.
- نشانگرهای completion راه‌اندازی workspace اکنون در ردیف‌های typed مشترک
  `workspace_setup_state` زندگی می‌کنند که با مسیر workspace resolveشده
  کلیدگذاری شده‌اند، به‌جای `.openclaw/workspace-state.json`؛ زمان اجرا دیگر
  marker legacy workspace را نمی‌خواند یا بازنویسی نمی‌کند، و APIهای
  کمک‌کننده دیگر یک مسیر ساختگی `.openclaw/setup-state` را فقط برای استخراج
  هویت ذخیره‌سازی دست‌به‌دست نمی‌کنند.
- approvalهای exec اکنون در ردیف singleton typed مشترک SQLite
  `exec_approvals_config` زندگی می‌کنند. doctor فایل legacy
  `~/.openclaw/exec-approvals.json` را وارد می‌کند؛ نوشتن‌های زمان اجرا دیگر
  آن فایل را ایجاد، بازنویسی، یا به‌عنوان محل store فعال خود گزارش نمی‌کنند.
  companion مربوط به macOS همان ردیف جدول `state/openclaw.sqlite` را می‌خواند
  و می‌نویسد؛ فقط سوکت prompt مربوط به Unix را روی دیسک نگه می‌دارد، چون آن
  IPC است، نه وضعیت durable زمان اجرا.
- ماژول‌های زمان اجرای هویت دستگاه، auth دستگاه، و bootstrap اکنون
  reader/writerهای snapshot SQLite خود را از کمک‌کننده‌های واردسازی JSON legacy
  مخصوص doctor جدا نگه می‌دارند. هویت دستگاه از ردیف‌های typed
  `device_identities` استفاده می‌کند و توکن‌های auth دستگاه از ردیف‌های typed
  `device_auth_tokens` استفاده می‌کنند. نوشتن‌های auth دستگاه ردیف‌ها را بر
  اساس device/role reconcile می‌کند، به‌جای truncate کردن جدول token، و زمان
  اجرا دیگر updateهای single-token را از طریق adapter قدیمی whole-store عبور
  نمی‌دهد. legacy
  بارهای JSON نسخه-1 فقط به‌عنوان شکل‌های import/export برای doctor وجود دارند.
- cache تبادل token در GitHub Copilot از جدول مشترک وضعیت Plugin در SQLite
  زیر `github-copilot/token-cache/default` استفاده می‌کند. این وضعیت cache متعلق به provider است،
  بنابراین عمداً جدول schema میزبان اضافه نمی‌کند.
- Compaction در GitHub Copilot دیگر sidecarهای workspace با نام `openclaw-compaction-*.json`
  نمی‌نویسد. harness، RPC مربوط به compaction تاریخچه SDK را برای
  session رهگیری‌شده SDK فراخوانی می‌کند، و OpenClaw وضعیت پایدار session/transcript را
  به‌جای فایل‌های marker سازگاری در SQLite نگه می‌دارد.
- runtime مشترک Swift (`OpenClawKit`) از همان ردیف‌های
  `state/openclaw.sqlite` برای هویت دستگاه و auth دستگاه استفاده می‌کند. helperهای برنامه macOS
  helperهای مشترک SQLite را import می‌کنند، به‌جای اینکه مالک مسیر JSON یا
  SQLite دومی باشند. باقی‌ماندن فایل legacy `identity/device.json` ساخت هویت را
  تا زمانی که doctor آن را به SQLite import کند مسدود می‌کند، که با gate شروع TypeScript و Android
  هم‌خوان است.
- هویت دستگاه Android از همان ماده کلید سازگار با TypeScript استفاده می‌کند
  که در ردیف‌های تایپ‌شده `state/openclaw.sqlite#table/device_identities` ذخیره شده است. هرگز
  `openclaw/identity/device.json` را نمی‌خواند یا نمی‌نویسد؛ باقی‌ماندن یک فایل legacy شروع را
  تا زمانی که doctor آن را به SQLite import کند مسدود می‌کند.
- tokenهای cache‌شده auth دستگاه Android نیز از ردیف‌های تایپ‌شده
  `state/openclaw.sqlite#table/device_auth_tokens` استفاده می‌کنند و همان semantics نسخه-1 token
  را با TypeScript و Swift به اشتراک می‌گذارند. runtime دیگر کلیدهای سازگاری `SecurePrefs`
  `gateway.deviceToken*` را نمی‌خواند؛ این‌ها فقط به منطق migration/doctor تعلق دارند.
- تاریخچه packageهای اخیر notification در Android از ردیف‌های تایپ‌شده
  `android_notification_recent_packages` استفاده می‌کند. runtime دیگر کلیدهای CSV قدیمی SharedPreferences را migrate یا
  read نمی‌کند.
- ساخت هویت دستگاه وقتی legacy `identity/device.json`
  وجود داشته باشد، وقتی ردیف هویت SQLite نامعتبر باشد، یا وقتی store هویت SQLite
  باز نشود، در حالت بسته شکست می‌خورد. doctor ابتدا آن فایل را import و حذف می‌کند، بنابراین شروع runtime
  نمی‌تواند پیش از migration بی‌صدا هویت pairing را rotate کند.
- انتخاب هویت دستگاه یک کلید ردیف SQLite است، نه locator فایل JSON. testها
  و helperهای Gateway کلیدهای هویت explicit پاس می‌دهند؛ فقط migration در doctor و gate شروع
  fail-closed نام فایل بازنشسته `identity/device.json` را می‌شناسند.
- سازگاری reset session اکنون در migration پیکربندی doctor قرار دارد:
  `session.idleMinutes` به `session.reset.idleMinutes` منتقل می‌شود،
  `session.resetByType.dm` به `session.resetByType.direct` منتقل می‌شود، و policy
  reset در runtime فقط کلیدهای canonical reset را می‌خواند.
- سازگاری config legacy اکنون زیر `src/commands/doctor/` قرار دارد. validation عادی
  `readConfigFileSnapshot()` detectorهای legacy doctor را import نمی‌کند
  یا issueهای legacy را annotate نمی‌کند؛ `runDoctorConfigPreflight()` آن issueها را برای
  repair/reporting در doctor اضافه می‌کند. جریان config در doctor
  `src/commands/doctor/legacy-config.ts` را import می‌کند، و repair قدیمی profile-idهای OAuth
  زیر
  `src/commands/doctor/legacy/oauth-profile-ids.ts` قرار دارد.
- commandهای غیر doctor، repair پیکربندی legacy را خودکار اجرا نمی‌کنند. برای مثال،
  `openclaw update --channel` اکنون روی config legacy نامعتبر fail می‌شود و از
  کاربر می‌خواهد doctor را اجرا کند، به‌جای اینکه کد migration doctor را بی‌صدا import کند.
- Web push، APNs، Voice Wake، بررسی‌های update، و سلامت config اکنون از جدول‌های مشترک تایپ‌شده SQLite
  برای subscriptionها، کلیدهای VAPID، registrationهای node، ردیف‌های trigger،
  ردیف‌های routing، وضعیت update-notification، و entryهای سلامت config به‌جای
  blobهای JSON کامل و مات استفاده می‌کنند. writeهای snapshot در Web push و APNs اکنون
  subscriptionها/registrationها را با primary key reconcile می‌کنند، به‌جای اینکه tableهایشان را clear کنند؛
  سلامت config نیز همین کار را با path پیکربندی انجام می‌دهد.
  moduleهای runtime آن‌ها reader/writerهای snapshot SQLite را از
  helperهای import JSON فقط مخصوص doctor جدا نگه می‌دارند.
- config میزبان Node اکنون از یک ردیف singleton تایپ‌شده در پایگاه داده مشترک SQLite استفاده می‌کند؛
  doctor فایل قدیمی `node.json` را پیش از استفاده عادی runtime import می‌کند.
- pairing دستگاه/node، pairing channel، allowlistهای channel، و وضعیت bootstrap
  اکنون از ردیف‌های تایپ‌شده SQLite به‌جای blobهای JSON کامل و مات استفاده می‌کنند. تأییدهای binding
  Plugin و وضعیت jobهای Cron نیز همین تفکیک را دنبال می‌کنند: moduleهای runtime
  عملیات مبتنی بر SQLite و helperهای snapshot خنثی را expose می‌کنند، و writeهای snapshot برای pairing/bootstrap
  به‌علاوه تأیید binding Plugin ردیف‌ها را با primary key
  reconcile می‌کنند، به‌جای truncate کردن tableها، درحالی‌که doctor فایل‌های JSON قدیمی را از طریق
  moduleهای `src/commands/doctor/legacy/*` import/remove می‌کند.
- رکوردهای Plugin نصب‌شده اکنون در index نصب‌شده‌های Plugin در SQLite قرار دارند.
  خواندن/نوشتن config در runtime دیگر داده‌های authored-config قدیمی
  `plugins.installs` را migrate یا preserve نمی‌کند؛ doctor آن شکل config legacy
  را پیش از استفاده عادی runtime به SQLite import می‌کند.
- snapshotهای recovery credential در QQBot اکنون در وضعیت Plugin در SQLite زیر
  `qqbot/credential-backups` قرار دارند. runtime دیگر
  `qqbot/data/credential-backup*.json` نمی‌نویسد؛ contract doctor در QQBot آن فایل‌های backup legacy
  را از دایرکتوری وضعیت active import و archive می‌کند.
- برنامه‌ریزی reload در Gateway snapshotهای index نصب‌شده‌های Plugin در SQLite را زیر
  namespace داخلی diff با نام `installedPluginIndex.installRecords.*` مقایسه می‌کند. تصمیم‌های
  reload در runtime دیگر آن ردیف‌ها را در objectهای ساختگی config
  `plugins.installs` wrap نمی‌کنند.
- upgrade credential حساب نام‌دار Matrix دیگر هنگام خواندن runtime
  انجام نمی‌شود. doctor مالک rename قدیمی `credentials/matrix/credentials.json`
  در سطح بالا است، وقتی یک حساب single/default Matrix قابل resolve باشد.
- moduleهای runtime مربوط به pairing core و Cron دیگر builderهای legacy برای pathهای JSON
  export نمی‌کنند. moduleهای legacy متعلق به doctor مسیرهای source مربوط به `pending.json`، `paired.json`،
  `bootstrap.json`، و `cron/jobs.json` را فقط برای testهای import و
  migration می‌سازند. normalization شکل job legacy در Cron و import run-log مربوط به Cron
  زیر `src/commands/doctor/legacy/cron*.ts` قرار دارد.
- `src/commands/doctor/legacy/runtime-state.ts` فایل‌های legacy وضعیت JSON
  از جمله config میزبان node را از doctor به SQLite import می‌کند. importerهای جدید فایل legacy
  زیر `src/commands/doctor/legacy/` می‌مانند.
- `src/commands/doctor/state-migrations.ts` legacy `sessions.json` و
  transcriptهای `*.jsonl` را مستقیماً به SQLite import می‌کند و sourceهای موفق را حذف می‌کند. دیگر
  transcriptهای legacy ریشه را از طریق
  `agents/<agentId>/sessions/*.jsonl` stage نمی‌کند یا پیش از
  import یک target canonical JSONL نمی‌سازد.
- بررسی‌های integrity وضعیت در doctor دیگر دایرکتوری‌های legacy session را scan نمی‌کنند یا
  حذف JSONL orphan را پیشنهاد نمی‌دهند. فایل‌های transcript legacy فقط ورودی migration هستند،
  و مرحله migration مالک import به‌علاوه حذف source است.
- import registry legacy sandbox زیر
  `src/commands/doctor/legacy/sandbox-registry.ts` قرار دارد؛ read و writeهای registry active sandbox
  فقط SQLite باقی می‌مانند.
- repair مربوط به سلامت/import transcript session legacy زیر
  `src/commands/doctor/legacy/session-transcript-health.ts` قرار دارد؛ moduleهای command در runtime
  دیگر parsing transcriptهای JSONL یا کد repair شاخه active را حمل نمی‌کنند.

نکات برجستهٔ تکمیل ادغام/حذف:

- وضعیت Plugin اکنون از پایگاه‌داده مشترک `state/openclaw.sqlite` استفاده می‌کند. واردکننده جانبی قدیمیِ شاخه‌محور `plugin-state/state.sqlite` حذف شده است، چون آن چینش SQLite هرگز منتشر نشده بود. کمک‌کننده‌های probe/test به‌جای افشای مسیر SQLite مخصوص وضعیت Plugin، `databasePath` مشترک را گزارش می‌کنند.
- جدول‌های زمان اجرای Task و Task Flow اکنون به‌جای `tasks/runs.sqlite` و `tasks/flows/registry.sqlite` در پایگاه‌داده مشترک `state/openclaw.sqlite` قرار دارند؛ واردکننده‌های جانبی قدیمی به همان دلیل چینش منتشرنشده حذف شده‌اند.
- `src/config/sessions/store.ts` دیگر برای فراداده ورودی، به‌روزرسانی‌های مسیر، یا خواندن updated-at به `storePath` نیاز ندارد. ماندگاری فرمان، پاک‌سازی نشست CLI، عمق subagent، overrideهای احراز هویت، و هویت نشست رونوشت از APIهای ردیف agent/session استفاده می‌کنند. نوشتن‌ها به‌صورت وصله‌های ردیف SQLite با تلاش دوباره در تعارض خوش‌بینانه اعمال می‌شوند.
- حل هدف نشست اکنون هدف‌های پایگاه‌داده به‌ازای هر agent را افشا می‌کند، نه مسیرهای قدیمی `sessions.json`. Gateway مشترک، فراداده ACP، تعمیر مسیر doctor، و `openclaw sessions` موارد `agent_databases` به‌همراه agentهای پیکربندی‌شده را فهرست می‌کنند.
- مسیریابی نشست Gateway اکنون از `resolveGatewaySessionDatabaseTarget` استفاده می‌کند؛ هدف بازگشتی به‌جای مسیر فایل قدیمی session-store، `databasePath` و کلیدهای ردیف SQLite نامزد را حمل می‌کند.
- نوع‌های زمان اجرای نشست کانال اکنون برای خواندن updated-at، فراداده ورودی، و به‌روزرسانی‌های last-route، `{agentId, sessionKey}` را افشا می‌کنند. نوع سازگاری قدیمی `saveSessionStore(storePath, store)` حذف شده است.
- سطح‌های Plugin runtime، extension API، و barrelهای `config/sessions` اکنون کد Plugin را به کمک‌کننده‌های ردیف نشست مبتنی بر SQLite هدایت می‌کنند. exportهای سازگاری کتابخانه ریشه (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) همچنان به‌عنوان میان‌لایه‌های منسوخ برای مصرف‌کنندگان موجود باقی مانده‌اند. کمک‌کننده قدیمی `resolveLegacySessionStorePath` حذف شده است؛ ساخت مسیر قدیمی `sessions.json` اکنون فقط محلیِ migration و fixtureهای تست است.
- `src/config/sessions/session-entries.sqlite.ts` اکنون ورودی‌های canonical نشست را در پایگاه‌داده به‌ازای هر agent ذخیره می‌کند و پشتیبانی read/upsert/delete patch در سطح ردیف دارد. upsert/patch/delete زمان اجرا دیگر برای گونه‌های حروف جست‌وجو نمی‌کند یا کلیدهای alias قدیمی را هرس نمی‌کند؛ doctor مالک canonicalization است. کمک‌کننده مستقل import از JSON حذف شده است، و migration به‌جای جایگزینی کل جدول نشست، ردیف‌های جدیدتر را با upsert ادغام می‌کند. کمک‌کننده‌های عمومی read/list/load فراداده پرکاربرد نشست را از ردیف‌های typed `sessions` و `conversations` تصویر می‌کنند؛ `entry_json` سایه‌ای برای سازگاری/اشکال‌زدایی است و می‌تواند بدون از دست رفتن هویت typed نشست یا زمینه تحویل، stale یا نامعتبر باشد.
- `src/config/sessions/delivery-info.ts` اکنون زمینه تحویل را از ردیف‌های typed به‌ازای هر agent در `sessions` + `conversations` + `session_conversations` حل می‌کند. دیگر هویت تحویل زمان اجرا را از `session_entries.entry_json` بازسازی نمی‌کند؛ نبودن یک ردیف conversation typed مشکل migration/repair در doctor است، نه fallback زمان اجرا.
- تصمیم‌های reset نشست ذخیره‌شده اکنون فراداده‌های typed `sessions.session_scope`، `sessions.chat_type`، و `sessions.channel` را ترجیح می‌دهند. تجزیه `sessionKey` فقط برای پسوندهای صریح thread/topic روی هدف‌های فرمان باقی می‌ماند؛ دسته‌بندی reset گروهی در برابر مستقیم دیگر از شکل کلید نمی‌آید.
- دسته‌بندی نمایش list/status نشست اکنون از فراداده typed چت و نوع نشست Gateway استفاده می‌کند. دیگر زیررشته‌های `:group:` یا `:channel:` داخل `session_key` را حقیقت پایدار گروهی/مستقیم در نظر نمی‌گیرد.
- انتخاب خط‌مشی silent-reply اکنون فقط از نوع صریح conversation یا فراداده سطح استفاده می‌کند. دیگر خط‌مشی direct/group را از زیررشته‌های `session_key` حدس نمی‌زند.
- حل مدل نمایشی نشست اکنون شناسه agent را از هدف پایگاه‌داده نشست SQLite دریافت می‌کند، به‌جای اینکه آن را از `session_key` جدا کند.
- hydrate کردن هدف announce از agent به agent اکنون فقط از `deliveryContext` مربوط به `sessions.list` typed استفاده می‌کند. دیگر مسیریابی channel/account/thread را از `origin` قدیمی، فیلدهای آینه‌ای `last*`، یا شکل `session_key` بازیابی نمی‌کند.
- رد هدف thread در `sessions_send` اکنون فراداده مسیریابی typed SQLite را می‌خواند. دیگر هدف‌ها را با تجزیه پسوندهای thread از کلید هدف رد یا قبول نمی‌کند.
- اعتبارسنجی خط‌مشی ابزار با محدوده گروه اکنون مسیریابی conversation typed SQLite را برای نشست فعلی یا spawned می‌خواند. دیگر با decode کردن `sessionKey` به هویت group/channel اعتماد نمی‌کند؛ شناسه‌های گروه ارائه‌شده از سوی caller وقتی هیچ ردیف نشست typed آن‌ها را تأیید نکند کنار گذاشته می‌شوند.
- تطبیق override مدل کانال اکنون از فراداده صریح group و parent conversation استفاده می‌کند. دیگر شناسه‌های parent conversation را از `parentSessionKey` decode نمی‌کند.
- ارث‌بری override مدل ذخیره‌شده اکنون به یک کلید parent session صریح از زمینه typed نشست نیاز دارد. دیگر overrideهای parent را از پسوندهای `:thread:` یا `:topic:` در `sessionKey` مشتق نمی‌کند.
- wrapper قدیمی thread-info نشست و parser thread مربوط به loaded-plugin حذف شده‌اند؛ هیچ کد زمان اجرایی `config/sessions/thread-info` را import نمی‌کند.
- کمک‌کننده conversation کانال دیگر پل‌های parsing کلید کامل نشست را افشا نمی‌کند. core همچنان شناسه‌های خام conversation متعلق به provider را از طریق `resolveSessionConversation(...)` نرمال می‌کند، اما واقعیت‌های مسیر را از `sessionKey` بازسازی نمی‌کند.
- تحویل completion، خط‌مشی ارسال، و نگهداری task دیگر نوع چت را از شکل `session_key` مشتق نمی‌کنند. parser قدیمی کلید chat-type حذف شده است؛ این مسیرها به فراداده typed نشست، زمینه typed تحویل، یا واژگان صریح هدف تحویل نیاز دارند.
- list/status نشست، diagnostics، اتصال account برای approval، فیلتر کردن Heartbeat در TUI، و خلاصه‌های usage دیگر `SessionEntry.origin` را برای مسیریابی provider/account/thread/display استخراج نمی‌کنند. تنها خواندن‌های باقی‌مانده runtime از `origin` مربوط به مفهوم‌های غیرنشستی یا شیءهای تحویل turn فعلی است.
- lookup بومی conversation برای approval-request اکنون ردیف‌های typed مسیریابی نشست به‌ازای هر agent را می‌خواند. دیگر هویت channel/group/thread conversation را از `sessionKey` تجزیه نمی‌کند؛ نبود فراداده typed یک مشکل migration/repair است.
- payloadهای رویداد changed/chat/session نشست Gateway دیگر `SessionEntry.origin` یا سایه‌های مسیر `last*` را تکرار نمی‌کنند؛ کلاینت‌ها `channel`، `chatType`، و `deliveryContext` typed دریافت می‌کنند.
- حل تحویل Heartbeat اکنون می‌تواند `deliveryContext` typed SQLite را مستقیماً دریافت کند، و runtime مربوط به heartbeat به‌جای تکیه بر سایه‌های سازگاری `session_entries` برای مسیریابی فعلی، ردیف تحویل نشست به‌ازای هر agent را پاس می‌دهد.
- حل هدف تحویل agent ایزوله Cron نیز پیش از fallback به payload ورودی سازگاری، مسیر فعلی خود را از ردیف تحویل نشست typed به‌ازای هر agent hydrate می‌کند.
- حل origin مربوط به announce subagent اکنون زمینه تحویل نشست درخواست‌کننده typed را از طریق `loadRequesterSessionEntry` عبور می‌دهد و آن ردیف را به سایه‌های سازگاری `last*`/`deliveryContext` ترجیح می‌دهد.
- به‌روزرسانی‌های فراداده نشست ورودی اکنون ابتدا در برابر ردیف تحویل typed به‌ازای هر agent ادغام می‌شوند؛ فیلدهای تحویل قدیمی `SessionEntry` فقط وقتی fallback هستند که هیچ ردیف conversation typed وجود نداشته باشد.
- استخراج تحویل restart/update اکنون اجازه می‌دهد `threadId` تحویل typed SQLite بر fragmentهای topic/thread تجزیه‌شده از `sessionKey` برتری داشته باشد؛ parsing فقط fallback برای کلیدهای قدیمی thread-shaped است.
- شناسه‌های کانال زمینه agent در hook اکنون هویت conversation typed SQLite و سپس فراداده صریح پیام را ترجیح می‌دهند. دیگر fragmentهای provider/group/channel را از `sessionKey` تجزیه نمی‌کنند.
- ارث‌بری مسیر خارجی Gateway `chat.send` اکنون به‌جای استنباط محدوده channel/direct/group از قطعه‌های `sessionKey`، فراداده مسیریابی نشست typed SQLite را می‌خواند. نشست‌های channel-scoped فقط وقتی ارث‌بری می‌کنند که کانال نشست typed و نوع چت با زمینه تحویل ذخیره‌شده هم‌خوان باشد؛ نشست‌های shared-main قانون سخت‌گیرانه‌تر CLI/no-client-metadata خود را حفظ می‌کنند.
- بیدار کردن restart-sentinel و مسیریابی continuation اکنون پیش از صف‌کردن wakeهای heartbeat یا continuationهای agent-turn مسیریابی‌شده، ردیف‌های typed تحویل/مسیریابی SQLite را می‌خواند. دیگر زمینه تحویل را از سایه JSON ورودی نشست بازسازی نمی‌کند.
- حل زمینه Gateway `tools.effective` اکنون ردیف‌های typed تحویل/مسیریابی SQLite را برای ورودی‌های provider، account، target، thread، و reply-mode می‌خواند. دیگر این فیلدهای داغ مسیریابی را از سایه‌های stale مربوط به origin در `session_entries.entry_json` بازیابی نمی‌کند.
- مسیریابی مشاوره صدای realtime اکنون تحویل parent/call را از ردیف‌های typed نشست SQLite به‌ازای هر agent حل می‌کند. هنگام انتخاب مسیر پیام agent embedded دیگر به سایه‌های سازگاری `SessionEntry.deliveryContext` fallback نمی‌کند.
- relay مربوط به ACP spawn heartbeat و مسیریابی parent-stream اکنون تحویل parent را از ردیف‌های typed نشست SQLite می‌خوانند. دیگر زمینه تحویل parent را از سایه‌های سازگاری session-entry بازسازی نمی‌کنند.
- حفظ مسیر تحویل نشست اکنون از فراداده typed چت و ستون‌های ماندگارشده تحویل پیروی می‌کند. دیگر hintهای کانال، نشانگرهای direct/main، یا شکل thread را از `sessionKey` استخراج نمی‌کند؛ مسیرهای webchat داخلی فقط وقتی یک هدف خارجی را ارث‌بری می‌کنند که SQLite از قبل هویت typed/persisted تحویل را برای نشست داشته باشد.
- استخراج generic تحویل نشست اکنون فقط ردیف دقیق تحویل نشست typed SQLite را می‌خواند. دیگر پسوندهای thread/topic را تجزیه نمی‌کند یا از کلید thread-shaped به کلید base session fallback نمی‌کند.
- dispatch پاسخ، بازیابی restart sentinel، و مسیریابی مشاوره صدای realtime اکنون برای مسیریابی thread از ردیف‌های دقیق typed SQLite مربوط به session/conversation استفاده می‌کنند. دیگر شناسه‌های thread یا زمینه تحویل base-session را با تجزیه کلیدهای thread-shaped نشست بازیابی نمی‌کنند.
- محدودسازی history در PI embedded اکنون از projection typed مسیریابی نشست SQLite (`sessions` + `conversations` اصلی) برای provider، نوع چت، و هویت peer استفاده می‌کند. دیگر شکل provider، DM، group، یا thread را از `sessionKey` تجزیه نمی‌کند.
- استنباط تحویل ابزار Cron اکنون فقط از تحویل صریح یا زمینه typed تحویل فعلی استفاده می‌کند. دیگر هدف‌های channel، peer، account، یا thread را از `agentSessionKey` decode نمی‌کند.
- ردیف‌های نشست runtime دیگر alias مسیر قدیمی `lastProvider` را حمل نمی‌کنند. کمک‌کننده‌ها و تست‌ها از فیلدهای typed `lastChannel` و `deliveryContext` استفاده می‌کنند؛ migration در doctor تنها جایی است که باید aliasهای قدیمی مسیر یا سایه‌های ماندگارشده `origin` را ترجمه کند.
- رویدادهای رونوشت، ردیف‌های VFS، و ردیف‌های artifact ابزار اکنون در پایگاه‌داده به‌ازای هر agent نوشته می‌شوند. جدول منتشرنشده نگاشت فایل رونوشت global حذف شده است؛ doctor به‌جای آن مسیرهای source قدیمی را در ردیف‌های migration پایدار ثبت می‌کند.
- lookup رونوشت runtime دیگر offsetهای بایتی JSONL را scan نمی‌کند یا فایل‌های رونوشت قدیمی را probe نمی‌کند. مسیرهای chat/media/history در Gateway ردیف‌های رونوشت را از SQLite می‌خوانند؛ JSONL نشست اکنون فقط ورودی قدیمی doctor است، نه state زمان اجرا یا قالب export.
- رابطه‌های parent و branch رونوشت از فراداده ساختاریافته `parentTranscriptScope: {agentId, sessionId}` در headerهای رونوشت SQLite استفاده می‌کنند، نه رشته‌های locator شبیه مسیر `agent-db:...transcript_events...`.
- قرارداد transcript manager دیگر constructorهای ضمنی ماندگارشده `create(cwd)` یا `continueRecent(cwd)` را افشا نمی‌کند. transcript managerهای ماندگارشده با scope صریح `{agentId, sessionId}` باز می‌شوند؛ فقط managerهای in-memory برای تست‌ها و transformهای خالص رونوشت بدون scope باقی می‌مانند.
- APIهای runtime transcript store، scope SQLite را resolve می‌کنند، نه مسیرهای فایل‌سیستم را. کمک‌کننده قدیمی `resolve...ForPath` و گزینه‌های نوشتن استفاده‌نشده `transcriptPath` از callerهای runtime حذف شده‌اند.
- حل نشست runtime اکنون از `{agentId, sessionId}` استفاده می‌کند و نباید رشته‌های `sqlite-transcript://<agent>/<session>` را برای مرزهای خارجی مشتق کند. مسیرهای مطلق قدیمی JSONL فقط ورودی‌های migration در doctor هستند.
- رکوردهای direct-bridge مربوط به native hook relay اکنون در ردیف‌های typed مشترک `native_hook_relay_bridges` با کلید relay id قرار دارند. runtime دیگر یک registry JSON در `/tmp` یا رکوردهای generic مبهم برای آن رکوردهای کوتاه‌عمر bridge نمی‌نویسد.
- `runEmbeddedPiAgent(...)` دیگر پارامتر transcript-locator ندارد.
  توصیف‌گرهای worker آماده‌شده نیز مکان‌یاب‌های رونوشت را حذف می‌کنند. وضعیت نشست زمان اجرا
  و اجراهای پیگیریِ در صف، به‌جای هندل‌های رونوشت مشتق‌شده، `{agentId, sessionId}` را حمل می‌کنند.
- Compaction توکار اکنون دامنهٔ SQLite را از `agentId` و `sessionId` می‌گیرد.
  قلاب‌های Compaction، فراخوانی‌های موتور زمینه، واگذاری CLI، و پاسخ‌های پروتکل
  نباید هندل‌های مشتق‌شدهٔ `sqlite-transcript://...` را دریافت کنند. کد
  صدور/اشکال‌زدایی می‌تواند مصنوعات کاربری صریح را از ردیف‌ها بسازد، اما مسیر
  صدور عمومی JSONL نشست را فراهم نمی‌کند یا نام فایل‌ها را دوباره به هویت
  زمان اجرا تزریق نمی‌کند.
- `/export-session` ردیف‌های رونوشت را از SQLite می‌خواند و فقط نمای HTML
  مستقلِ درخواست‌شده را می‌نویسد. بینندهٔ توکار دیگر JSONL نشست را از آن
  ردیف‌ها بازسازی یا دانلود نمی‌کند.
- واگذاری موتور زمینه دیگر برای بازیابی هویت agent، مکان‌یاب رونوشت را تجزیه
  نمی‌کند. زمینهٔ آمادهٔ زمان اجرا، `agentId` حل‌شده را به آداپتور Compaction
  داخلی حمل می‌کند.
- بازنویسی رونوشت و کوتاه‌سازی زندهٔ نتیجهٔ ابزار اکنون وضعیت رونوشت را بر
  اساس `{agentId, sessionId}` می‌خوانند و پایدار می‌کنند و برای payloadهای
  رویداد به‌روزرسانی رونوشت، مکان‌یاب‌های موقت مشتق نمی‌کنند.
- سطح کمک‌کنندهٔ وضعیت رونوشت دیگر گونه‌های مبتنی بر مکان‌یابِ
  `readTranscriptState`، `replaceTranscriptStateEvents`، یا
  `persistTranscriptStateMutation` را ندارد. فراخوان‌های زمان اجرا باید از APIهای
  `{agentId, sessionId}` استفاده کنند. ورود doctor فایل‌های قدیمی را با مسیر
  فایل صریح می‌خواند و ردیف‌های SQLite می‌نویسد؛ رشته‌های مکان‌یاب را مهاجرت
  نمی‌دهد.
- قرارداد مدیر نشست زمان اجرا دیگر `open(locator)`، `forkFrom(locator)`، یا
  `setTranscriptLocator(...)` را آشکار نمی‌کند. مدیران نشست پایدارشده فقط با
  `{agentId, sessionId}` باز می‌شوند؛ کمک‌کننده‌های فهرست/انشعاب به‌جای facade
  مدیر رونوشت، روی APIهای نشست و checkpoint ردیف‌محور زندگی می‌کنند.
- APIهای خوانندهٔ رونوشت Gateway دامنه‌محور هستند. آن‌ها `{agentId, sessionId}`
  را می‌گیرند و یک مکان‌یاب رونوشت موقعیتی را که ممکن است تصادفاً به هویت زمان
  اجرا تبدیل شود نمی‌پذیرند. تجزیهٔ مکان‌یاب رونوشت فعال حذف شده است؛ مسیرهای
  منبع قدیمی فقط توسط کد ورود doctor خوانده می‌شوند.
- رویدادهای به‌روزرسانی رونوشت نیز دامنه‌محور هستند. `emitSessionTranscriptUpdate`
  دیگر یک رشتهٔ مکان‌یاب برهنه را نمی‌پذیرد، و شنونده‌ها بدون تجزیهٔ هندل، بر
  اساس `{agentId, sessionId}` مسیریابی می‌کنند.
- پخش session-message در Gateway کلیدهای نشست را از دامنهٔ agent/نشست حل می‌کند،
  نه از مکان‌یاب رونوشت. resolver/cache قدیمی تبدیل مکان‌یاب رونوشت به کلید نشست
  حذف شده است.
- فیلترهای SSE تاریخچهٔ نشست Gateway به‌روزرسانی‌های زنده را بر اساس دامنهٔ
  agent/نشست فیلتر می‌کنند. دیگر کاندیدهای مکان‌یاب رونوشت، realpathها، یا
  هویت‌های رونوشت فایل‌مانند را canonicalize نمی‌کند تا تصمیم بگیرد یک جریان
  باید به‌روزرسانی را دریافت کند یا نه.
- قلاب‌های چرخهٔ عمر نشست دیگر روی `session_end` مکان‌یاب‌های رونوشت را مشتق یا
  آشکار نمی‌کنند. مصرف‌کنندگان قلاب `sessionId`، `sessionKey`، شناسه‌های نشست
  بعدی، و زمینهٔ agent را می‌گیرند؛ فایل‌های رونوشت بخشی از قرارداد چرخهٔ عمر
  نیستند.
- قلاب‌های بازنشانی نیز دیگر مکان‌یاب‌های رونوشت را مشتق یا آشکار نمی‌کنند.
  payloadِ `before_reset` پیام‌های بازیابی‌شدهٔ SQLite به‌همراه دلیل بازنشانی را
  حمل می‌کند، درحالی‌که هویت نشست در زمینهٔ قلاب می‌ماند.
- بازنشانی harnessِ agent دیگر مکان‌یاب رونوشت را نمی‌پذیرد. dispatch بازنشانی
  با `sessionId`/`sessionKey` به‌همراه دلیل دامنه‌بندی می‌شود.
- نوع‌های نشست افزونهٔ agent دیگر `transcriptLocator` را آشکار نمی‌کنند؛ افزونه‌ها
  باید به‌جای دست‌بردن به هویت رونوشت فایل‌مانند، از زمینهٔ نشست و APIهای زمان
  اجرا استفاده کنند.
- قلاب‌های Compaction در Plugin دیگر مکان‌یاب‌های رونوشت را آشکار نمی‌کنند. زمینهٔ
  قلاب از قبل هویت نشست را حمل می‌کند، و خواندن‌های رونوشت باید به‌جای هندل‌های
  فایل‌مانند از APIهای SQLite آگاه از دامنه عبور کنند.
- قلاب‌های `before_agent_finalize` دیگر `transcriptPath` را آشکار نمی‌کنند، شامل
  payloadهای relay قلاب بومی. قلاب‌های نهایی‌سازی فقط از زمینهٔ نشست استفاده
  می‌کنند.
- پاسخ‌های بازنشانی Gateway دیگر روی entry برگشتی مکان‌یاب رونوشت نمی‌سازند.
  بازنشانی ردیف‌های رونوشت SQLite را ایجاد می‌کند، entry نشست تمیز را برمی‌گرداند،
  و دسترسی رونوشت را به خواننده‌های آگاه از دامنه واگذار می‌کند.
- نتایج اجرای توکار و Compaction دیگر مکان‌یاب‌های رونوشت را برای حسابداری نشست
  آشکار نمی‌کنند. Compaction خودکار فقط `sessionId` فعال، شمارنده‌های Compaction،
  و فرادادهٔ token را به‌روزرسانی می‌کند.
- نتایج تلاش توکار دیگر `transcriptLocatorUsed` را برنمی‌گردانند، و نتایج
  `compact()` موتور زمینه نیز دیگر مکان‌یاب‌های رونوشت را برنمی‌گردانند.
  حلقه‌های تلاش دوبارهٔ زمان اجرا فقط یک `sessionId` جانشین را می‌پذیرند.
- نتایج الحاق رونوشت آینهٔ تحویل دیگر مکان‌یاب‌های رونوشت را برنمی‌گردانند.
  فراخوان‌ها `messageId` الحاق‌شده را می‌گیرند؛ سیگنال‌های به‌روزرسانی رونوشت
  از دامنهٔ SQLite استفاده می‌کنند.
- کمک‌کننده‌های انشعاب نشست والد فقط `sessionId` منشعب‌شده را برمی‌گردانند.
  آماده‌سازی subagent دامنهٔ agent/نشست فرزند را به موتورها می‌فرستد.
- پارامترهای اجراکنندهٔ CLI و بذرگذاری دوبارهٔ تاریخچه دیگر مکان‌یاب‌های رونوشت
  را نمی‌پذیرند. خواندن‌های تاریخچهٔ CLI دامنهٔ رونوشت SQLite را از `{agentId,
sessionId}` و زمینهٔ کلید نشست حل می‌کنند.
- fixtureهای آزمایشی CLI و اجراکنندهٔ توکار اکنون ردیف‌های رونوشت SQLite را بر
  اساس شناسهٔ نشست بذرگذاری و خوانده می‌کنند، به‌جای این‌که وانمود کنند نشست‌های
  فعال فایل‌های `*.jsonl` هستند یا یک رشتهٔ `sqlite-transcript://...` را از میان
  پارامترهای زمان اجرا عبور دهند.
- رویدادهای guard نتیجهٔ ابزار نشست از دامنهٔ نشست شناخته‌شده emit می‌شوند، حتی
  وقتی یک مدیر درون‌حافظه‌ای مکان‌یاب مشتق‌شده ندارد. آزمایش‌های آن دیگر فایل‌های
  رونوشت فعال `/tmp/*.jsonl` را جعل نمی‌کنند.
- کمک‌کننده‌های BTW و checkpointِ Compaction اکنون ردیف‌های رونوشت را بر اساس
  دامنهٔ SQLite می‌خوانند و منشعب می‌کنند. فرادادهٔ checkpoint اکنون فقط شناسه‌های
  نشست و شناسه‌های leaf/entry را ذخیره می‌کند؛ مکان‌یاب‌های مشتق‌شده دیگر در
  payloadهای checkpoint نوشته نمی‌شوند.
- جست‌وجوی کلید رونوشت Gateway از دامنهٔ رونوشت SQLite در مرزهای پروتکل استفاده
  می‌کند و دیگر روی نام فایل‌های رونوشت realpath یا stat اجرا نمی‌کند.
- چرخش خودکار رونوشت Compaction ردیف‌های رونوشت جانشین را مستقیماً از طریق
  ذخیره‌گاه رونوشت SQLite می‌نویسد. ردیف‌های نشست فقط هویت نشست جانشین را نگه
  می‌دارند، نه یک مسیر JSONL بادوام یا مکان‌یاب پایدارشده.
- Compaction موتور زمینهٔ توکار از کمک‌کننده‌های چرخش رونوشت نام‌گذاری‌شده با
  SQLite استفاده می‌کند. آزمایش‌های چرخش دیگر مسیرهای جانشین JSONL نمی‌سازند یا
  نشست‌های فعال را به‌صورت فایل مدل نمی‌کنند.
- نگه‌داری تصویر خروجی مدیریت‌شده، cache پیام-رونوشت خود را به‌جای فراخوانی‌های
  stat سیستم فایل، از آمار رونوشت SQLite کلیدگذاری می‌کند.
- قفل‌های نشست زمان اجرا و lane مستقل doctor برای `.jsonl.lock` قدیمی حذف
  شده‌اند.
- barrel زمان اجرای Microsoft Teams و SDK عمومی Plugin دیگر کمک‌کنندهٔ قدیمی
  قفل فایل را دوباره صادر نمی‌کنند؛ مسیرهای وضعیت بادوام Plugin با SQLite
  پشتیبانی می‌شوند.
- هرس سن/تعداد نشست و پاک‌سازی صریح نشست حذف شده‌اند. doctor مالک ورود قدیمی
  است؛ نشست‌های stale صراحتاً بازنشانی یا حذف می‌شوند.
- بررسی‌های یکپارچگی doctor دیگر یک فایل JSONL قدیمی را به‌عنوان رونوشت فعال
  معتبر برای یک ردیف نشست SQLite حساب نمی‌کنند. سلامت رونوشت فعال فقط SQLite
  است؛ فایل‌های JSONL قدیمی به‌عنوان ورودی‌های مهاجرت/پاک‌سازی orphan گزارش
  می‌شوند.
- doctor دیگر `agents/<agent>/sessions/` را به‌عنوان وضعیت زمان اجرای لازم تلقی
  نمی‌کند. فقط وقتی آن دایرکتوری از قبل وجود داشته باشد، آن را به‌عنوان ورودی
  ورود قدیمی یا پاک‌سازی orphan اسکن می‌کند.
- مسیرهای `sessions.resolve` در Gateway، patch/reset/compact نشست، ایجاد subagent،
  لغو سریع، فرادادهٔ ACP، نشست‌های ایزوله‌شده با Heartbeat، و patch کردن TUI دیگر
  کلیدهای نشست قدیمی را به‌عنوان اثر جانبی کار عادی زمان اجرا مهاجرت یا هرس
  نمی‌کنند.
- حل نشست فرمان CLI اکنون به‌جای `storePath`، `agentId` مالک را برمی‌گرداند، و
  دیگر در طول حل عادی `--to` یا `--session-id` ردیف‌های نشست اصلی قدیمی را کپی
  نمی‌کند. canonicalization ردیف اصلی قدیمی فقط به doctor تعلق دارد.
- حل عمق subagent در زمان اجرا دیگر `sessions.json` یا ذخیره‌گاه‌های نشست JSON5
  را نمی‌خواند. این مسیر `session_entries` در SQLite را بر اساس شناسهٔ agent
  می‌خواند، و فرادادهٔ عمق/نشست قدیمی فقط می‌تواند از مسیر ورود doctor وارد شود.
- overrideهای نشست پروفایل auth به‌جای lazy-load کردن زمان اجرای ذخیره‌گاه نشست
  فایل‌مانند، از طریق upsert مستقیم ردیف `{agentId, sessionKey}` پایدار می‌شوند.
- gating پرجزئیات auto-reply و کمک‌کننده‌های به‌روزرسانی نشست اکنون ردیف‌های
  نشست SQLite را بر اساس هویت نشست می‌خوانند/upsert می‌کنند و دیگر پیش از لمس
  وضعیت ردیف پایدارشده به مسیر ذخیره‌گاه قدیمی نیاز ندارند.
- کمک‌کننده‌های فرادادهٔ نشست command-run اکنون از نام‌ها و مسیرهای ماژول
  entryمحور استفاده می‌کنند؛ سطح کمک‌کنندهٔ فرمان قدیمی `session-store` حذف شده
  است.
- بذرگذاری header راه‌اندازی و سخت‌سازی مرز Compaction دستی اکنون ردیف‌های رونوشت
  SQLite را مستقیماً تغییر می‌دهند. فراخوان‌های زمان اجرا هویت نشست را می‌فرستند،
  نه مسیرهای `.jsonl` قابل نوشتن.
- replay چرخش نشست بی‌صدا، turnهای اخیر کاربر/دستیار را بر اساس `{agentId,
  sessionId}` از ردیف‌های رونوشت SQLite کپی می‌کند. دیگر مکان‌یاب‌های رونوشت
  مبدا یا مقصد را نمی‌پذیرد.
- ردیف‌های تازهٔ نشست زمان اجرا دیگر مکان‌یاب‌های رونوشت را ذخیره نمی‌کنند.
  فراخوان‌ها مستقیماً از `{agentId, sessionId}` استفاده می‌کنند؛ فرمان‌های
  صدور/اشکال‌زدایی می‌توانند هنگام materialize کردن ردیف‌ها نام فایل خروجی را
  انتخاب کنند.
- شروع یک نشست رونوشت پایدارشدهٔ جدید اکنون همیشه ردیف‌های SQLite را بر اساس
  دامنه باز می‌کند. مدیر نشست دیگر مسیر یا مکان‌یاب رونوشتِ دوران فایلِ قبلی را
  به‌عنوان هویت نشست جدید بازاستفاده نمی‌کند.
- نشست‌های رونوشت پایدارشده از API صریح
  `openTranscriptSessionManagerForSession({agentId, sessionId})` استفاده می‌کنند.
  facadeهای static قدیمی `SessionManager.create/openForSession/list/forkFromSession`
  حذف شده‌اند تا آزمایش‌ها و کد زمان اجرا نتوانند تصادفاً کشف نشست دوران فایل را
  دوباره بسازند.
- زمان اجرای Plugin دیگر
  `api.runtime.agent.session.resolveTranscriptLocatorPath` را آشکار نمی‌کند؛ کد
  Plugin از کمک‌کننده‌های ردیف SQLite و مقادیر دامنه استفاده می‌کند.
- سطح SDK عمومی `session-store-runtime` اکنون فقط کمک‌کننده‌های ردیف نشست و ردیف
  رونوشت را صادر می‌کند. کمک‌کننده‌های متمرکز schema/path/transaction در SQLite
  در `sqlite-runtime` زندگی می‌کنند؛ کمک‌کننده‌های خام open/close/reset فقط برای
  آزمایش‌های first-party محلی می‌مانند.
- طبقه‌بندهای نام فایل trajectory/checkpoint قدیمی `.jsonl` اکنون در ماژول فایل
  نشست قدیمی doctor زندگی می‌کنند. اعتبارسنجی نشست هسته دیگر کمک‌کننده‌های
  artifact فایل را برای تصمیم‌گیری دربارهٔ شناسه‌های نشست عادی SQLite وارد
  نمی‌کند.
- اجراهای subagent مسدودکنندهٔ Active Memory به‌جای ایجاد فایل‌های موقت یا
  پایدار `session.jsonl` زیر وضعیت Plugin، از ردیف‌های رونوشت SQLite استفاده
  می‌کنند. گزینهٔ قدیمی `transcriptDir` حذف شده است.
- تولید slug یک‌باره و اجراهای plannerِ Crestodian به‌جای ایجاد فایل‌های موقت
  `session.jsonl` از ردیف‌های رونوشت SQLite استفاده می‌کنند.
- اجراهای کمک‌کنندهٔ `llm-task` و استخراج commitment پنهان نیز از ردیف‌های رونوشت
  SQLite استفاده می‌کنند، بنابراین این نشست‌های کمک‌کنندهٔ فقط-مدل دیگر فایل‌های
  موقت رونوشت JSON/JSONL ایجاد نمی‌کنند.
- `TranscriptSessionManager` اکنون فقط یک دامنهٔ رونوشت SQLite بازشده است.
  کد زمان اجرا آن را با `openTranscriptSessionManagerForSession({agentId,
sessionId})` باز می‌کند؛ جریان‌های ایجاد، branch، ادامه، فهرست، و انشعاب به‌جای
  facadeهای static manager در کمک‌کننده‌های ردیف SQLite مالک خود زندگی می‌کنند.
  کد doctor/import/debug فایل‌های منبع قدیمی صریح را بیرون از مدیر نشست زمان اجرا
  مدیریت می‌کند.
- متدهای facade staleِ `SessionManager.newSession()` و
  `SessionManager.createBranchedSession()` حذف شدند. نشست‌های جدید و فرزندان
  رونوشت به‌جای تغییر دادن یک مدیر ازپیش‌بازشده به یک نشست پایدارشدهٔ متفاوت،
  توسط workflow مالک SQLite خود ایجاد می‌شوند.
- تصمیم‌های انشعاب رونوشت والد و ایجاد انشعاب دیگر `storePath` یا `sessionsDir`
  را نمی‌پذیرند؛ آن‌ها به‌جای فرادادهٔ مسیر سیستم فایل نگه‌داشته‌شده، از دامنهٔ
  رونوشت SQLite `{agentId, sessionId}` استفاده می‌کنند.
- memory-host دیگر کمک‌کننده‌های no-op طبقه‌بندی رونوشت دایرکتوری نشست را صادر
  نمی‌کند؛ فیلتر کردن رونوشت اکنون هنگام ساخت entry از فرادادهٔ ردیف SQLite مشتق
  می‌شود.
- آزمایش‌های صدور نشست memory-host و QMD از دامنه‌های رونوشت SQLite استفاده
  می‌کنند. مسیرهای قدیمی `agents/<agentId>/sessions/*.jsonl` فقط جایی پوشش داده
  می‌شوند که یک آزمایش عمداً در حال اثبات سازگاری doctor/import/export باشد.
- بازرسی خام نشست QA-lab اکنون از `sessions.list` از طریق Gateway استفاده می‌کند
  به‌جای خواندن `agents/qa/sessions/sessions.json`؛ بازخورد MSteams
  مستقیماً به رونوشت‌های SQLite اضافه می‌شود، بدون اینکه مسیر JSONL ساختگی بسازد.
- نوبت‌های کانال ورودی مشترک اکنون به‌جای `storePath` قدیمی، `{agentId, sessionKey}` را حمل می‌کنند. مسیرهای ضبط LINE، WhatsApp، Slack، Discord، Telegram، Matrix، Signal،
  iMessage، BlueBubbles، Feishu، Google Chat، IRC، Nextcloud Talk، Zalo،
  Zalo Personal، QA Channel، Microsoft Teams، Mattermost، Synology Chat، Tlon،
  Twitch، و QQBot اکنون فراداده updated-at را می‌خوانند و ردیف‌های نشست ورودی را از طریق هویت SQLite ثبت می‌کنند.
- پایداری مکان‌یاب رونوشت از ردیف‌های نشست فعال حذف شده است.
  `resolveSessionTranscriptTarget` مقدارهای `agentId`، `sessionId`، و فراداده اختیاری موضوع را برمی‌گرداند؛ doctor تنها کدی است که نام‌های فایل رونوشت قدیمی را وارد می‌کند.
- سرآیندهای رونوشت زمان اجرا از نسخه SQLite `1` شروع می‌شوند. ارتقاهای شکل قدیمی JSONL V1/V2/V3 فقط در واردسازی doctor قرار دارند و سرآیندهای واردشده را پیش از ذخیره ردیف‌ها به نسخه فعلی رونوشت SQLite نرمال می‌کنند.
- محافظ database-first اکنون `SessionManager.listAll` و
  `SessionManager.forkFromSession` را ممنوع می‌کند؛ فهرست‌کردن نشست و گردش‌کارهای fork/restore باید روی APIهای ردیفی/دامنه‌مند SQLite باقی بمانند.
- این محافظ همچنین نام‌های helper قدیمی برای parse رونوشت JSONL/ترمیم شاخه فعال را خارج از کد doctor/import ممنوع می‌کند، تا زمان اجرا نتواند مسیر دوم مهاجرت رونوشت قدیمی ایجاد کند.
- اجراهای PI تعبیه‌شده handleهای رونوشت ورودی را رد می‌کنند. آن‌ها پیش از راه‌اندازی worker و دوباره پیش از اینکه تلاش به وضعیت رونوشت دست بزند، از هویت SQLite
  `{agentId, sessionId}` استفاده می‌کنند. ورودی کهنه `/tmp/*.jsonl` نمی‌تواند هدف نوشتن زمان اجرا را انتخاب کند.
- رکوردهای cache trace، payload مربوط به Anthropic، raw stream، و diagnostics timeline اکنون در ردیف‌های تایپ‌شده SQLite `diagnostic_events` نوشته می‌شوند. بسته‌های پایداری Gateway اکنون در ردیف‌های تایپ‌شده SQLite `diagnostic_stability_bundles` نوشته می‌شوند. مسیرهای override قدیمی JSONL یعنی
  `diagnostics.cacheTrace.filePath`، `OPENCLAW_CACHE_TRACE_FILE`،
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`، و
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` حذف شده‌اند، و ضبط عادی پایداری دیگر فایل‌های `logs/stability/*.json` نمی‌نویسد.
- پایداری Cron اکنون به‌جای حذف/درج دوباره کل جدول job در هر save، ردیف‌های SQLite `cron_jobs` را همگام‌سازی می‌کند. writebackهای هدف Plugin ردیف‌های cron مطابق را مستقیماً به‌روزرسانی می‌کنند و وضعیت cron زمان اجرا را در همان تراکنش پایگاه‌داده وضعیت نگه می‌دارند.
- فراخوان‌های زمان اجرای Cron اکنون از یک کلید پایدار store مربوط به cron در SQLite استفاده می‌کنند. مسیرهای قدیمی
  `cron.store` فقط ورودی‌های واردسازی doctor هستند؛ مسیرهای production gateway، نگهداشت task، status، run-log، و writeback هدف Telegram از
  `resolveCronStoreKey` استفاده می‌کنند و دیگر کلید را path-normalize نمی‌کنند. وضعیت Cron اکنون به‌جای فیلد قدیمی فایل‌مانند `storePath`، مقدار `storeKey` را گزارش می‌کند.
- بارگذاری و زمان‌بندی زمان اجرای Cron دیگر شکل‌های job پایدارشده قدیمی مانند `jobId`، `schedule.cron`، مقدار عددی `atMs`، booleanهای رشته‌ای، یا `sessionTarget` گمشده را نرمال نمی‌کند. واردسازی قدیمی doctor مالک این ترمیم‌ها پیش از درج ردیف‌ها در SQLite است.
- spawn مربوط به ACP دیگر مسیرهای فایل رونوشت JSONL را resolve یا persist نمی‌کند. آماده‌سازی spawn و thread-bind ردیف نشست SQLite را مستقیماً پایدار می‌کند و شناسه نشست را به‌عنوان هویت رونوشت نگه‌داشته‌شده حفظ می‌کند.
- APIهای فراداده نشست ACP اکنون ردیف‌های SQLite را بر پایه `agentId` می‌خوانند/فهرست می‌کنند/upsert می‌کنند و دیگر `storePath` را به‌عنوان بخشی از قرارداد entry نشست ACP افشا نمی‌کنند.
- حسابداری استفاده نشست و تجمیع استفاده Gateway اکنون رونوشت‌ها را فقط با `{agentId, sessionId}` resolve می‌کنند. cache هزینه/استفاده و خلاصه‌های نشست کشف‌شده دیگر رشته‌های مکان‌یاب رونوشت را نمی‌سازند یا برنمی‌گردانند.
- append چت Gateway، پایداری abort-partial، `/sessions.send`، و نوشتن رونوشت رسانه webchat مستقیماً از طریق دامنه رونوشت SQLite اضافه می‌شوند. helper تزریق رونوشت Gateway دیگر پارامتر
  `transcriptLocator` را نمی‌پذیرد.
- کشف رونوشت SQLite اکنون فقط دامنه‌ها و آمار رونوشت را فهرست می‌کند:
  `{agentId, sessionId, updatedAt, eventCount}`. helper سازگاری مرده
  `listSqliteSessionTranscriptLocators` و فیلد `locator` برای هر ردیف حذف شده‌اند.
- زمان اجرای ترمیم رونوشت اکنون فقط
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` را افشا می‌کند. helper قدیمی ترمیم مبتنی بر locator حذف شده است؛ کد doctor/debug مسیرهای فایل منبع صریح را می‌خواند و هرگز رشته‌های locator را مهاجرت نمی‌دهد.
- زمان اجرای ledger بازپخش ACP اکنون ردیف‌های بازپخش هر نشست را به‌جای `acp/event-ledger.json` در پایگاه‌داده وضعیت SQLite مشترک ذخیره می‌کند؛ doctor فایل قدیمی را وارد و حذف می‌کند.
- helperهای خواننده رونوشت Gateway اکنون به‌جای نام ماژول قدیمی
  `session-utils.fs` در
  `src/gateway/session-transcript-readers.ts` قرار دارند. بررسی fallback retry history به‌جای سطح helper فایل قدیمی، با نامی مربوط به محتوای رونوشت SQLite نام‌گذاری شده است.
- helperهای injected-chat و Compaction در Gateway اکنون دامنه رونوشت SQLite را از طریق APIهای helper داخلی عبور می‌دهند، به‌جای اینکه مقدارها را مسیر رونوشت یا فایل منبع بنامند.
- تشخیص ادامه bootstrap اکنون ردیف‌های رونوشت SQLite را از طریق
  `hasCompletedBootstrapTranscriptTurn` بررسی می‌کند؛ دیگر نام helper فایل‌مانند افشا نمی‌کند.
- تست‌های embedded-runner اکنون از هویت رونوشت SQLite استفاده می‌کنند، و باز کردن مدیر رونوشت جدید همیشه به `sessionId` صریح نیاز دارد.
- helperهای indexing حافظه اکنون از ابتدا تا انتها از اصطلاحات رونوشت SQLite استفاده می‌کنند:
  host مقدارهای `listSessionTranscriptScopesForAgent` و
  `sessionTranscriptKeyForScope` را export می‌کند، صف‌های sync هدفمند `sessionTranscripts` هستند،
  hitهای عمومی session-search مسیرهای opaque به‌شکل `transcript:<agent>:<session>` را افشا می‌کنند،
  و کلید منبع DB داخلی به‌جای مسیر فایل جعلی، `session:<session>` زیر
  `source_kind='sessions'` است.
- helper عمومی persistent-dedupe در Plugin SDK دیگر گزینه‌های فایل‌مانند را افشا نمی‌کند. فراخوان‌ها کلیدهای دامنه SQLite را ارائه می‌کنند و ردیف‌های durable dedupe در وضعیت مشترک Plugin قرار می‌گیرند.
- توکن‌های SSO Microsoft Teams از فایل‌های JSON قفل‌شده به وضعیت Plugin در SQLite منتقل شدند. Doctor مقدار `msteams-sso-tokens.json` را وارد می‌کند، کلیدهای canonical توکن SSO را از payloadها دوباره می‌سازد، و فایل منبع را حذف می‌کند. توکن‌های Delegated OAuth روی مرز فایل credential خصوصی موجود خود باقی می‌مانند.
- وضعیت cache مربوط به sync در Matrix از `bot-storage.json` به وضعیت Plugin در SQLite منتقل شد. Doctor payloadهای sync قدیمی خام یا wrapped را وارد می‌کند و فایل منبع را حذف می‌کند. کلاینت‌های فعال Matrix و QA Matrix یک دایرکتوری ریشه sync-store در SQLite می‌گیرند، نه مسیر جعلی `sync-store.json` یا `bot-storage.json`.
- وضعیت مهاجرت crypto قدیمی Matrix از
  `legacy-crypto-migration.json` به وضعیت Plugin در SQLite منتقل شد. Doctor فایل وضعیت قدیمی را وارد می‌کند؛ snapshotهای IndexedDB در Matrix SDK از
  `crypto-idb-snapshot.json` به blobهای Plugin در SQLite منتقل شدند. کلیدهای recovery و credentialهای Matrix ردیف‌های plugin-state در SQLite هستند؛ فایل‌های JSON قدیمی آن‌ها فقط ورودی‌های مهاجرت doctor هستند.
- لاگ‌های فعالیت Memory Wiki اکنون به‌جای
  `.openclaw-wiki/log.jsonl` از وضعیت Plugin در SQLite استفاده می‌کنند. provider مهاجرت Memory Wiki لاگ‌های JSONL قدیمی را وارد می‌کند؛ markdown و محتوای vault کاربر در wiki به‌عنوان محتوای workspace همچنان file-backed باقی می‌مانند.
- Memory Wiki دیگر `.openclaw-wiki/state.json` یا دایرکتوری استفاده‌نشده
  `.openclaw-wiki/locks` را ایجاد نمی‌کند. provider مهاجرت، اگر vault قدیمی هنوز آن‌ها را داشته باشد، آن فایل‌های فراداده Plugin بازنشسته را حذف می‌کند.
- entryهای audit مربوط به Crestodian اکنون به‌جای
  `audit/crestodian.jsonl` از وضعیت Plugin در SQLite هسته استفاده می‌کنند. Doctor لاگ audit قدیمی JSONL را وارد می‌کند و پس از واردسازی موفق آن را حذف می‌کند.
- entryهای audit مربوط به نوشتن/مشاهده config اکنون به‌جای
  `logs/config-audit.jsonl` از وضعیت Plugin در SQLite هسته استفاده می‌کنند. Doctor لاگ audit قدیمی JSONL را وارد می‌کند و پس از واردسازی موفق آن را حذف می‌کند.
- همراه macOS دیگر هنگام ویرایش `openclaw.json`، sidecarهای app-local با نام‌های `logs/config-audit.jsonl` یا
  `logs/config-health.json` نمی‌نویسد. فایل config همچنان file-backed باقی می‌ماند، snapshotهای recovery کنار فایل config می‌مانند، و وضعیت durable audit/health مربوط به config به store SQLite در Gateway تعلق دارد.
- approvalهای pending rescue در Crestodian اکنون به‌جای
  `crestodian/rescue-pending/*.json` از وضعیت Plugin در SQLite هسته استفاده می‌کنند. Doctor فایل‌های pending approval قدیمی را وارد می‌کند و پس از واردسازی موفق آن‌ها را حذف می‌کند.
- وضعیت arm موقت Phone Control اکنون به‌جای
  `plugins/phone-control/armed.json` از وضعیت Plugin در SQLite استفاده می‌کند. Doctor فایل armed-state قدیمی را به namespace
  `phone-control/arm-state` وارد می‌کند و فایل را حذف می‌کند.
- Doctor دیگر رونوشت‌های JSONL را درجا ترمیم نمی‌کند یا فایل‌های backup JSONL نمی‌سازد. شاخه فعال را به SQLite وارد می‌کند و منبع قدیمی را حذف می‌کند.
- lookup رونوشت در hook مربوط به session-memory از خواندن‌های SQLite فقط مبتنی بر دامنه `{agentId, sessionId}` استفاده می‌کند. helper آن دیگر locatorهای رونوشت، خواندن فایل‌های قدیمی، یا گزینه‌های بازنویسی فایل را نمی‌پذیرد یا مشتق نمی‌کند.
- bindingهای conversation در app-server مربوط به Codex اکنون وضعیت Plugin در SQLite را با کلید نشست OpenClaw یا دامنه صریح `{agentId, sessionId}` کلیدگذاری می‌کنند. آن‌ها نباید bindingهای fallback مبتنی بر transcript-path را حفظ کنند.
- خواندن‌های mirrored-history در app-server مربوط به Codex فقط از دامنه رونوشت SQLite استفاده می‌کنند؛ آن‌ها نباید هویت را از مسیرهای فایل رونوشت بازیابی کنند.
- مسیرهای role-ordering و reset مربوط به Compaction دیگر فایل‌های رونوشت قدیمی را unlink نمی‌کنند؛ reset فقط ردیف نشست SQLite و هویت رونوشت را rotate می‌کند.
- پاسخ‌های reset و checkpoint در Gateway ردیف‌های نشست پاک به‌همراه شناسه‌های نشست را برمی‌گردانند. آن‌ها دیگر برای کلاینت‌ها locatorهای رونوشت SQLite نمی‌سازند.
- Dreaming در memory-core دیگر با probing برای فایل‌های JSONL گمشده، ردیف‌های نشست را prune نمی‌کند. پاک‌سازی subagent به‌جای بررسی‌های وجود فایل‌سیستم، از طریق API زمان اجرای نشست انجام می‌شود. تست‌های transcript-ingestion آن به‌جای ایجاد fixtureهای `agents/<id>/sessions` یا placeholderهای locator، ردیف‌های SQLite را مستقیماً seed می‌کنند.
- indexing رونوشت حافظه ممکن است `transcript:<agentId>:<sessionId>` را به‌عنوان مسیر مجازی search-hit برای helperهای citation/read افشا کند. منبع index پایدار رابطه‌ای است (`source_kind='sessions'`، `source_key='session:<sessionId>'`،
  `session_id=<sessionId>`)، بنابراین این مقدار locator رونوشت زمان اجرا نیست، مسیر فایل‌سیستم نیست، و هرگز نباید دوباره به APIهای زمان اجرای نشست پاس داده شود.
- وضعیت حافظه doctor در Gateway تعدادهای short-term recall و phase-signal را به‌جای `memory/.dreams/*.json` از ردیف‌های plugin-state در SQLite می‌خواند؛ خروجی CLI و doctor اکنون آن storage را به‌عنوان store SQLite برچسب می‌زنند، نه یک مسیر.
- زمان اجرای memory-core، وضعیت CLI، متدهای doctor در Gateway، و facadeهای Plugin SDK دیگر فایل‌های قدیمی `.dreams/session-corpus` را audit یا archive نمی‌کنند.
  آن فایل‌ها فقط ورودی‌های مهاجرت هستند؛ doctor آن‌ها را به SQLite وارد می‌کند و پس از verification منبع را حذف می‌کند. ردیف‌های evidence فعال session-ingestion اکنون از مسیر مجازی SQLite به‌شکل `memory/session-ingestion/<day>.txt` استفاده می‌کنند؛ زمان اجرا هرگز از `.dreams/session-corpus` وضعیت نمی‌نویسد یا مشتق نمی‌کند.
- artifactهای عمومی memory-core رویدادهای host در SQLite را به‌عنوان artifact مجازی JSON با نام
  `memory/events/memory-host-events.json` افشا می‌کنند؛ آن‌ها دیگر از مسیر منبع قدیمی
  `.dreams/events.jsonl` دوباره استفاده نمی‌کنند.
- registryهای sandbox container/browser اکنون از جدول SQLite مشترک
  `sandbox_registry_entries` با ستون‌های تایپ‌شده session، image، timestamp،
  backend/config، و browser port استفاده می‌کنند. Doctor فایل‌های registry قدیمی JSON یکپارچه و sharded را وارد می‌کند و منبع‌های موفق را حذف می‌کند. خواندن‌های زمان اجرا از ستون‌های تایپ‌شده ردیف به‌عنوان منبع حقیقت استفاده می‌کنند؛ `entry_json` فقط یک کپی replay/debug است.
- تعهدها اکنون به‌جای یک blob کامل JSON برای کل store، از جدول مشترک تایپ‌شده `commitments` استفاده می‌کنند. saveهای snapshot بر پایه شناسه commitment upsert می‌کنند و به‌جای پاک‌کردن و درج دوباره جدول، فقط ردیف‌های گمشده را حذف می‌کنند. زمان اجرا commitmentها را از ستون‌های تایپ‌شده scope، delivery-window، status، attempt، و text بارگذاری می‌کند؛ `record_json` فقط یک کپی replay/debug است. Doctor مقدار قدیمی
  `commitments.json` را وارد می‌کند و پس از واردسازی موفق آن را حذف می‌کند.
- تعریف‌های job در Cron، وضعیت schedule، و تاریخچه run دیگر writer یا reader زمان اجرای JSON ندارند. زمان اجرا از ردیف‌های `cron_jobs` با schedule تایپ‌شده،
  ستون‌های payload، delivery، failure-alert، session، status، و runtime-state به‌همراه فرادادهٔ تایپ‌شدهٔ
  `cron_run_logs` برای وضعیت، خلاصهٔ عیب‌یابی، وضعیت/خطای تحویل،
  session/run، مدل، و مجموع توکن‌ها. `job_json` فقط یک نسخهٔ replay/debug است؛ `state_json` عیب‌یابی‌های تودرتوی
  runtime را نگه می‌دارد که هنوز فیلدهای پرس‌وجوی داغ ندارند، درحالی‌که runtime
  فیلدهای داغ وضعیت را از ستون‌های تایپ‌شده بازآب‌رسانی می‌کند. Doctor فایل‌های
  قدیمی `jobs.json`، `jobs-state.json`، و `runs/*.jsonl` را وارد می‌کند و
  منابع واردشده را حذف می‌کند. بازنویسی‌های هدف Plugin ردیف‌های منطبق `cron_jobs`
  را به‌روزرسانی می‌کنند، به‌جای اینکه کل ذخیره‌گاه cron را بارگذاری و جایگزین کنند.
- راه‌اندازی Gateway نشانگرهای قدیمی `notify: true` را در فرافکنی runtime
  نادیده می‌گیرد. Doctor وقتی `cron.webhook` معتبر باشد آن‌ها را به تحویل صریح SQLite
  ترجمه می‌کند، وقتی تنظیم نشده باشند نشانگرهای بی‌اثر را حذف می‌کند، و وقتی Webhook
  پیکربندی‌شده نامعتبر باشد آن‌ها را با یک هشدار حفظ می‌کند.
- صف‌های تحویل خروجی و session اکنون وضعیت صف، نوع ورودی،
  کلید session، کانال، هدف، شناسهٔ حساب، تعداد تلاش مجدد، آخرین تلاش/خطا،
  وضعیت بازیابی، و نشانگرهای ارسال پلتفرم را به‌صورت ستون‌های تایپ‌شده در جدول مشترک
  `delivery_queue_entries` ذخیره می‌کنند. بازیابی runtime این فیلدهای داغ را از
  ستون‌های تایپ‌شده می‌خواند، و جهش‌های تلاش مجدد/بازیابی آن ستون‌ها را مستقیماً
  بدون بازنویسی replay JSON به‌روزرسانی می‌کنند. payload کامل JSON فقط به‌عنوان
  blob مربوط به replay/debug برای بدنهٔ پیام‌ها و دیگر داده‌های سرد replay باقی می‌ماند.
- رکوردهای مدیریت‌شدهٔ تصویر خروجی اکنون از ردیف‌های مشترک تایپ‌شدهٔ
  `managed_outgoing_image_records` استفاده می‌کنند، درحالی‌که بایت‌های رسانه همچنان در
  `media_blobs` ذخیره می‌شوند. رکورد JSON فقط به‌عنوان یک نسخهٔ replay/debug باقی می‌ماند.
- ترجیحات انتخاب‌گر مدل Discord، هش‌های استقرار فرمان، و اتصال‌های thread
  اکنون از وضعیت مشترک SQLite مربوط به Plugin استفاده می‌کنند. طرح‌های واردسازی JSON
  قدیمی آن‌ها در سطح setup/doctor migration مربوط به Plugin Discord قرار دارند، نه در کد مهاجرت core.
- آشکارسازهای واردسازی قدیمی Plugin از ماژول‌های نام‌گذاری‌شده برای doctor مانند
  `doctor-legacy-state.ts` یا `doctor-state-imports.ts` استفاده می‌کنند؛ ماژول‌های معمول runtime
  کانال نباید آشکارسازهای JSON قدیمی را import کنند.
- مکان‌نماهای catchup و نشانگرهای حذف تکرار ورودی BlueBubbles اکنون از وضعیت مشترک SQLite
  مربوط به Plugin استفاده می‌کنند. طرح‌های واردسازی JSON قدیمی آن‌ها در سطح
  setup/doctor migration مربوط به Plugin BlueBubbles قرار دارند، نه در کد مهاجرت core.
- offsetهای به‌روزرسانی Telegram، ردیف‌های cache استیکر، ردیف‌های cache پیام ارسال‌شده،
  ردیف‌های cache نام topic، و اتصال‌های thread اکنون از وضعیت مشترک SQLite مربوط به Plugin
  استفاده می‌کنند. طرح‌های واردسازی JSON قدیمی آن‌ها در سطح setup/doctor migration مربوط به Plugin Telegram
  قرار دارند، نه در کد مهاجرت core.
- مکان‌نماهای catchup در iMessage، نگاشت‌های short-id پاسخ، و ردیف‌های حذف تکرار sent-echo
  اکنون از وضعیت مشترک SQLite مربوط به Plugin استفاده می‌کنند. فایل‌های قدیمی
  `imessage/catchup/*.json`،
  `imessage/reply-cache.jsonl`، و `imessage/sent-echoes.jsonl` فقط ورودی‌های doctor هستند.
- ردیف‌های حذف تکرار پیام Feishu اکنون به‌جای فایل‌های
  `feishu/dedup/*.json` از وضعیت مشترک SQLite مربوط به Plugin استفاده می‌کنند. طرح واردسازی JSON
  قدیمی آن در سطح setup/doctor migration مربوط به Plugin Feishu قرار دارد، نه در کد مهاجرت core.
- گفتگوها، نظرسنجی‌ها، بافرهای upload در انتظار، و یادگیری‌های بازخورد Microsoft Teams
  اکنون از جدول‌های مشترک وضعیت/blob مربوط به Plugin در SQLite استفاده می‌کنند. مسیر upload در انتظار
  از `plugin_blob_entries` استفاده می‌کند تا بافرهای رسانه به‌جای base64 JSON به‌صورت SQLite BLOB
  ذخیره شوند. نام‌های helper مربوط به runtime اکنون به‌جای نام‌گذاری file-store با `*-fs` از نام‌گذاری SQLite/state
  استفاده می‌کنند، و shim قدیمی `storePath` از این ذخیره‌گاه‌ها حذف شده است. طرح واردسازی JSON
  قدیمی آن در سطح setup/doctor migration مربوط به Plugin Microsoft Teams قرار دارد.
- رسانهٔ خروجی میزبانی‌شدهٔ Zalo اکنون به‌جای sidecarهای موقت JSON/bin با نام
  `openclaw-zalo-outbound-media` از `plugin_blob_entries` مشترک SQLite استفاده می‌کند.
- HTML و فرادادهٔ نمایشگر diff اکنون به‌جای فایل‌های موقت `meta.json`/`viewer.html`
  از `plugin_blob_entries` مشترک SQLite استفاده می‌کنند. خروجی‌های PNG/PDF رندرشده
  همچنان مادی‌سازی‌های موقت باقی می‌مانند، چون تحویل کانال هنوز به مسیر فایل نیاز دارد.
- اسناد مدیریت‌شدهٔ Canvas اکنون به‌جای دایرکتوری پیش‌فرض `state/canvas/documents`
  از `plugin_blob_entries` مشترک SQLite استفاده می‌کنند. میزبان Canvas این blobها را مستقیماً سرو می‌کند؛
  فایل‌های محلی فقط برای محتوای صریح اپراتور در `host.root`
  یا مادی‌سازی موقت، وقتی یک خوانندهٔ رسانهٔ پایین‌دستی به مسیر نیاز داشته باشد، ایجاد می‌شوند.
- تصمیم‌های ممیزی File Transfer اکنون به‌جای log بی‌کران runtime با نام `audit/file-transfer.jsonl`
  از `plugin_state_entries` مشترک SQLite استفاده می‌کنند. Doctor
  فایل ممیزی JSONL قدیمی را به وضعیت Plugin وارد می‌کند و پس از واردسازی پاک
  منبع را حذف می‌کند.
- leaseهای فرایند ACPX و هویت instance مربوط به Gateway اکنون از وضعیت مشترک SQLite مربوط به Plugin
  استفاده می‌کنند. Doctor فایل قدیمی `gateway-instance-id` را به وضعیت Plugin وارد می‌کند
  و منبع را حذف می‌کند.
- اسکریپت‌های wrapper تولیدشدهٔ ACPX و خانهٔ ایزولهٔ Codex مادی‌سازی موقت
  زیر ریشهٔ موقت OpenClaw هستند، نه وضعیت پایدار OpenClaw. رکوردهای پایدار runtime
  در ACPX همان ردیف‌های lease و gateway-instance در SQLite هستند؛ سطح پیکربندی قدیمی ACPX با نام `stateDir`
  حذف شده است، چون دیگر هیچ وضعیت runtime در آنجا نوشته نمی‌شود.
- پیوست‌های رسانه‌ای Gateway اکنون از جدول مشترک SQLite با نام `media_blobs` به‌عنوان
  ذخیره‌گاه canonical بایت استفاده می‌کنند. مسیرهای محلی بازگردانده‌شده به سطوح سازگاری کانال و sandbox
  مادی‌سازی‌های موقت ردیف پایگاه‌داده هستند، نه ذخیره‌گاه پایدار رسانه. فهرست‌های مجاز رسانه در runtime دیگر شامل
  ریشه‌های قدیمی `$OPENCLAW_STATE_DIR/media` یا ریشه‌های `media` در دایرکتوری config نیستند؛ آن دایرکتوری‌ها
  فقط منابع واردسازی doctor هستند.
- تکمیل shell دیگر فایل‌های cache با الگوی `$OPENCLAW_STATE_DIR/completions/*` را نمی‌نویسد.
  مسیرهای دودآزمایی install، doctor، update، و release به‌جای فایل‌های cache پایدار تکمیل،
  از خروجی تکمیل تولیدشده یا source کردن profile استفاده می‌کنند.
- مرحله‌بندی upload مربوط به Skill در Gateway اکنون از ردیف‌های مشترک `skill_uploads` استفاده می‌کند. فرادادهٔ upload،
  کلیدهای idempotency، و بایت‌های archive در SQLite قرار دارند؛ installer
  فقط هنگام اجرای install یک مسیر archive موقتِ مادی‌سازی‌شده دریافت می‌کند.
- پیوست‌های inline مربوط به subagent دیگر زیر
  `.openclaw/attachments/*` در workspace مادی‌سازی نمی‌شوند. مسیر spawn ورودی‌های seed مربوط به SQLite VFS را آماده می‌کند،
  اجراهای inline آن ورودی‌ها را در namespace scratch مربوط به runtime هر agent seed می‌کنند،
  و ابزارهای مبتنی بر دیسک آن scratch در SQLite را برای مسیرهای پیوست overlay می‌کنند. ستون‌های قدیمی registry مربوط به attachment-dir در اجرای subagent
  و hookهای cleanup حذف شده‌اند.
- hydration تصویر در CLI دیگر فایل‌های cache پایدار `openclaw-cli-images` را نگه نمی‌دارد.
  backendهای خارجی CLI همچنان مسیر فایل دریافت می‌کنند، اما آن مسیرها مادی‌سازی‌های موقت به‌ازای هر اجرا با cleanup هستند.
- عیب‌یابی‌های cache-trace، عیب‌یابی‌های payload در Anthropic، عیب‌یابی‌های خام stream مدل،
  رویدادهای timeline عیب‌یابی، و بسته‌های پایداری Gateway اکنون به‌جای فایل‌های `logs/*.jsonl` یا
  `logs/stability/*.json` ردیف‌های SQLite می‌نویسند.
  flagها و env varهای override مسیر runtime حذف شده‌اند؛ فرمان‌های export/debug
  می‌توانند فایل‌ها را صراحتاً از ردیف‌های پایگاه‌داده مادی‌سازی کنند.
- همراه macOS دیگر نویسندهٔ چرخشی `diagnostics.jsonl` ندارد. logهای app
  به unified logging می‌روند، و عیب‌یابی‌های پایدار Gateway با SQLite پشتیبانی می‌شوند.
- فهرست رکورد port-guardian در macOS اکنون به‌جای فایل JSON در Application Support
  یا blob singleton مبهم، از ردیف‌های مشترک تایپ‌شدهٔ SQLite با نام
  `macos_port_guardian_records` استفاده می‌کند.
- قفل‌های singleton مربوط به Gateway اکنون به‌جای فایل‌های lock در temp-dir از ردیف‌های مشترک تایپ‌شدهٔ SQLite با نام `state_leases` زیر
  scope با نام `gateway_locks` استفاده می‌کنند. مستندات عیب‌یابی Fly و OAuth
  اکنون به‌جای cleanup کهنهٔ file-lock به lease در SQLite و lock تازه‌سازی auth اشاره می‌کنند.
- وضعیت sentinel راه‌اندازی مجدد Gateway اکنون به‌جای `restart-sentinel.json` از ردیف‌های مشترک تایپ‌شدهٔ SQLite با نام
  `gateway_restart_sentinel` استفاده می‌کند؛ runtime
  نوع sentinel، وضعیت، مسیریابی، پیام، continuation، و stats را از
  ستون‌های تایپ‌شده می‌خواند. `payload_json` فقط یک نسخهٔ replay/debug است. کد runtime
  ردیف SQLite را مستقیماً پاک می‌کند و دیگر plumbing پاک‌سازی فایل را همراه ندارد.
- وضعیت intent راه‌اندازی مجدد Gateway و handoff مربوط به supervisor اکنون به‌جای
  sidecarهای `gateway-restart-intent.json` و
  `gateway-supervisor-restart-handoff.json` از ردیف‌های مشترک تایپ‌شدهٔ SQLite با نام‌های
  `gateway_restart_intent` و `gateway_restart_handoff` استفاده می‌کنند.
- هماهنگی singleton مربوط به Gateway اکنون به‌جای نوشتن فایل‌های `gateway.<hash>.lock` از ردیف‌های تایپ‌شدهٔ `state_leases` زیر
  `gateway_locks` استفاده می‌کند. ردیف lease مالک lock، انقضا، heartbeat، و payload debug را
  در اختیار دارد؛ SQLite مرز atomic مربوط به acquire/release را در اختیار دارد. گزینهٔ بازنشستهٔ دایرکتوری file-lock
  حذف شده است؛ testها مستقیماً از هویت ردیف SQLite استفاده می‌کنند.
- helper قدیمی و بدون ارجاعِ گزارش مصرف cron که فایل‌های `cron/runs/*.jsonl`
  را اسکن می‌کرد حذف شد. گزارش‌های تاریخچهٔ اجرای Cron باید ردیف‌های تایپ‌شدهٔ SQLite با نام
  `cron_run_logs` را بخوانند.
- بازیابی راه‌اندازی مجدد main-session اکنون agentهای نامزد را از طریق registry
  `agent_databases` در SQLite کشف می‌کند، نه با اسکن دایرکتوری‌های `agents/*/sessions`.
- بازیابی خرابی session در Gemini اکنون فقط ردیف session در SQLite را حذف می‌کند؛
  دیگر به gate قدیمی `storePath` نیاز ندارد یا تلاش نمی‌کند مسیر مشتق‌شدهٔ
  transcript JSONL را unlink کند.
- مدیریت override مسیر اکنون مقادیر محیطی literal با نام‌های `undefined`/`null` را
  تنظیم‌نشده تلقی می‌کند و از ایجاد تصادفی پایگاه‌داده‌های `undefined/state/*.sqlite`
  در ریشهٔ repo هنگام testها یا handoffهای shell جلوگیری می‌کند.
- اثرانگشت‌های سلامت config اکنون به‌جای `logs/config-health.json` از ردیف‌های مشترک تایپ‌شدهٔ SQLite با نام `config_health_entries`
  استفاده می‌کنند و فایل config معمولی را به‌عنوان تنها سند پیکربندی غیر-credential نگه می‌دارند. همراه macOS فقط
  وضعیت سلامت process-local را نگه می‌دارد و sidecar قدیمی JSON را بازایجاد نمی‌کند.
- runtime مربوط به profile احراز هویت دیگر فایل‌های credential JSON را وارد یا نمی‌نویسد. ذخیره‌گاه canonical credential
  SQLite است؛ `auth-profiles.json`، فایل‌های هر agent با نام
  `auth.json`، و `credentials/oauth.json` مشترک ورودی‌های مهاجرت doctor
  هستند که پس از واردسازی حذف می‌شوند.
- testهای ذخیره/وضعیت profile احراز هویت اکنون مستقیماً جدول‌های تایپ‌شدهٔ auth در SQLite را assert می‌کنند
  و فقط از نام فایل‌های profile احراز هویت قدیمی برای ورودی‌های مهاجرت doctor استفاده می‌کنند.
- `openclaw secrets apply` فقط فایل config، فایل env، و ذخیره‌گاه profile احراز هویت در SQLite
  را scrub می‌کند. دیگر منطق سازگاری‌ای که `auth.json` بازنشستهٔ هر agent را ویرایش می‌کرد
  همراه ندارد؛ doctor مالک واردسازی و حذف آن فایل است.
- طرح‌های مهاجرت secret در Hermes و اعمال آن‌ها profileهای API-key واردشده را مستقیماً
  به ذخیره‌گاه profile احراز هویت در SQLite منتقل می‌کنند. دیگر `auth-profiles.json`
  را به‌عنوان هدف میانی نمی‌نویسد یا verify نمی‌کند.
- مستندات احراز هویت رو به کاربر اکنون به‌جای اینکه به کاربران بگوید
  `auth-profiles.json` را inspect یا کپی کنند، مسیر
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` را توصیف می‌کنند؛ نام‌های قدیمی JSON مربوط به OAuth/auth
  فقط به‌عنوان ورودی‌های doctor-import مستند باقی می‌مانند.
- helperهای مسیر وضعیت core دیگر فایل بازنشستهٔ `credentials/oauth.json`
  را expose نمی‌کنند. نام فایل قدیمی فقط محلیِ مسیر واردسازی auth در doctor است.
- مستندات install، security، onboarding، model-auth، و SecretRef اکنون به‌جای
  فایل‌های JSON مربوط به profile احراز هویت هر agent، ردیف‌های profile احراز هویت در SQLite و backup/migration کل وضعیت را توصیف می‌کنند.
- کشف مدل PI اکنون credentialهای canonical را به ذخیره‌سازی auth درون‌حافظه‌ای
  `pi-coding-agent` پاس می‌دهد. دیگر هنگام discovery فایل `auth.json` مربوط به هر agent را
  ایجاد، scrub، یا نمی‌نویسد.
- تنظیمات trigger و routing در Voice Wake اکنون به‌جای `settings/voicewake.json`، `settings/voicewake-routing.json`، یا
  ردیف‌های عمومی مبهم، از جدول‌های مشترک تایپ‌شدهٔ SQLite استفاده می‌کنند؛ doctor فایل‌های JSON قدیمی را وارد می‌کند و پس از
  مهاجرت موفق آن‌ها را حذف می‌کند.
- وضعیت بررسی update اکنون به‌جای `update-check.json` یا blob عمومی مبهم از یک ردیف مشترک تایپ‌شدهٔ `update_check_state` استفاده می‌کند؛ doctor
  فایل JSON قدیمی را وارد می‌کند و پس از مهاجرت موفق آن را حذف می‌کند.
- وضعیت سلامت config اکنون به‌جای `logs/config-health.json` یا blob عمومی مبهم از ردیف‌های مشترک تایپ‌شدهٔ `config_health_entries` استفاده می‌کند؛ doctor
  فایل JSON قدیمی را وارد می‌کند و پس از مهاجرت موفق آن را حذف می‌کند.
- تأییدیه‌های اتصال گفتگوی Plugin اکنون به‌جای وضعیت مشترک مبهم SQLite یا از ردیف‌های تایپ‌شدهٔ
  `plugin_binding_approvals` استفاده می‌کنند
  `plugin-binding-approvals.json`؛ فایل قدیمی ورودی مهاجرت doctor است.
- اتصال‌های عمومی گفت‌وگوی فعلی اکنون به‌جای بازنویسی
  `bindings/current-conversations.json`، ردیف‌های تایپ‌شده
  `current_conversation_bindings` را ذخیره می‌کنند؛ doctor فایل JSON قدیمی را وارد
  می‌کند و پس از مهاجرت موفق آن را حذف می‌کند.
- دفترهای همگام‌سازی منبع واردشده در Memory Wiki اکنون به‌جای بازنویسی
  `.openclaw-wiki/source-sync.json`، برای هر کلید vault/source یک ردیف وضعیت Plugin
  در SQLite ذخیره می‌کنند؛ فراهم‌کننده مهاجرت، دفتر JSON قدیمی را وارد و حذف می‌کند.
- رکوردهای اجرای واردسازی ChatGPT در Memory Wiki اکنون به‌جای نوشتن
  `.openclaw-wiki/import-runs/*.json`، برای هر شناسه vault/run یک ردیف وضعیت Plugin
  در SQLite ذخیره می‌کنند. snapshotهای rollback تا زمانی که بایگانی snapshot اجرای
  واردسازی به ذخیره‌سازی blob منتقل شود، همچنان فایل‌های صریح vault می‌مانند.
- چکیده‌های کامپایل‌شده Memory Wiki اکنون به‌جای نوشتن
  `.openclaw-wiki/cache/agent-digest.json` و
  `.openclaw-wiki/cache/claims.jsonl`، ردیف‌های blob مربوط به Plugin در SQLite را
  ذخیره می‌کنند. فراهم‌کننده مهاجرت فایل‌های cache قدیمی را وارد می‌کند و وقتی
  پوشه cache خالی شد، آن را حذف می‌کند.
- ردیابی نصب Skills در ClawHub اکنون به‌جای نوشتن یا خواندن sidecarهای
  `.clawhub/lock.json` و `.clawhub/origin.json` در runtime، برای هر workspace/skill
  یک ردیف وضعیت Plugin در SQLite ذخیره می‌کند. کد runtime به‌جای انتزاع‌های lockfile/origin
  با شکل فایل، از objectهای وضعیت نصب ردیابی‌شده استفاده می‌کند. Doctor sidecarهای
  قدیمی را از workspaceهای agent پیکربندی‌شده وارد می‌کند و پس از واردسازی پاک، آن‌ها
  را حذف می‌کند.
- index مربوط به Pluginهای نصب‌شده اکنون به‌جای `plugins/installs.json`، ردیف singleton
  تایپ‌شده `installed_plugin_index` در SQLite مشترک را می‌خواند و می‌نویسد؛ فایل JSON
  قدیمی فقط ورودی مهاجرت doctor است و پس از واردسازی حذف می‌شود.
- helper مسیر قدیمی `plugins/installs.json` اکنون در کد قدیمی doctor قرار دارد.
  ماژول‌های runtime مربوط به plugin-index فقط گزینه‌های پایداری‌سازی مبتنی بر SQLite
  را expose می‌کنند، نه مسیر فایل JSON.
- sentinel راه‌اندازی مجدد Gateway، intent راه‌اندازی مجدد، و وضعیت handoff supervisor
  اکنون به‌جای blobهای opaque عمومی، از ردیف‌های تایپ‌شده SQLite مشترک
  (`gateway_restart_sentinel`، `gateway_restart_intent`، و `gateway_restart_handoff`)
  استفاده می‌کنند. کد runtime راه‌اندازی مجدد هیچ قرارداد sentinel/intent/handoff
  با شکل فایل ندارد.
- cache همگام‌سازی Matrix، metadata ذخیره‌سازی، اتصال‌های thread، markerهای dedupe
  ورودی، وضعیت cooldown تأیید startup، snapshotهای crypto مربوط به SDK IndexedDB،
  credentials، و recovery keyها اکنون از جدول‌های وضعیت/blob مربوط به Plugin در
  SQLite مشترک استفاده می‌کنند. structهای مسیر runtime دیگر مسیر metadata به نام
  `storage-meta.json` را expose نمی‌کنند؛ آن نام فایل فقط ورودی مهاجرت قدیمی است.
  طرح واردسازی JSON قدیمی آن‌ها در سطح setup/doctor migration مربوط به Plugin
  Matrix قرار دارد.
- startup مربوط به Matrix دیگر وضعیت فایل قدیمی Matrix را scan، گزارش، یا تکمیل
  نمی‌کند. تشخیص فایل Matrix، ساخت snapshot قدیمی crypto، وضعیت مهاجرت restore
  کلید اتاق، واردسازی، و حذف منبع همگی تحت مالکیت doctor هستند.
- barrelهای مهاجرت runtime مربوط به Matrix حذف شدند. helperهای تشخیص و mutation
  وضعیت/crypto قدیمی مستقیماً توسط doctor مربوط به Matrix وارد می‌شوند، نه به‌عنوان
  بخشی از سطح API runtime.
- markerهای reuse مربوط به snapshot مهاجرت Matrix اکنون به‌جای
  `matrix/migration-snapshot.json` در وضعیت Plugin در SQLite قرار دارند؛ doctor همچنان
  می‌تواند همان archive تأییدشده پیش از مهاجرت را بدون نوشتن فایل وضعیت sidecar
  دوباره استفاده کند.
- cursorهای bus در Nostr و وضعیت انتشار profile اکنون از وضعیت Plugin در SQLite
  مشترک استفاده می‌کنند. طرح واردسازی JSON قدیمی آن‌ها در سطح setup/doctor migration
  مربوط به Plugin Nostr قرار دارد.
- toggleهای session در Active Memory اکنون به‌جای `session-toggles.json` از وضعیت
  Plugin در SQLite مشترک استفاده می‌کنند؛ روشن‌کردن دوباره memory، به‌جای بازنویسی
  یک object JSON، ردیف را حذف می‌کند.
- proposalها و counterهای review در Skill Workshop اکنون به‌جای storeهای
  `skill-workshop/<workspace>.json` برای هر workspace، از وضعیت Plugin در SQLite
  مشترک استفاده می‌کنند. هر proposal یک ردیف جداگانه زیر `skill-workshop/proposals`
  است، و counter مربوط به review یک ردیف جداگانه زیر `skill-workshop/reviews` است.
- اجراهای subagent reviewer در Skill Workshop اکنون به‌جای ایجاد مسیرهای session
  sidecar به شکل `skill-workshop/<sessionId>.json`، از resolver transcript مربوط به
  session runtime استفاده می‌کنند.
- leaseهای پردازش ACPX اکنون به‌جای registry تمام‌فایلی `process-leases.json`، از
  وضعیت Plugin در SQLite مشترک زیر `acpx/process-leases` استفاده می‌کنند. هر lease
  به‌عنوان ردیف خودش ذخیره می‌شود و reaping پردازش‌های stale در startup را بدون مسیر
  بازنویسی JSON در runtime حفظ می‌کند.
- scriptهای wrapper مربوط به ACPX و home ایزوله Codex در root موقت OpenClaw تولید
  می‌شوند. آن‌ها در صورت نیاز دوباره ساخته می‌شوند و ورودی backup یا migration نیستند.
- پایداری‌سازی registry اجرای subagent از ردیف‌های تایپ‌شده مشترک `subagent_runs`
  استفاده می‌کند. مسیر قدیمی `subagents/runs.json` اکنون فقط ورودی مهاجرت doctor
  است، و نام helperهای runtime دیگر لایه وضعیت را disk-backed توصیف نمی‌کنند.
  تست‌های runtime دیگر fixtureهای نامعتبر یا خالی `runs.json` نمی‌سازند تا رفتار
  registry را اثبات کنند؛ آن‌ها مستقیماً ردیف‌های SQLite را seed/read می‌کنند.
- Backup پیش از archiving پوشه state را stage می‌کند، فایل‌های غیر database را
  کپی می‌کند، databaseهای `*.sqlite` را با `VACUUM INTO` snapshot می‌گیرد، sidecarهای
  زنده WAL/SHM را حذف می‌کند، metadata مربوط به snapshot را در manifest archive
  ثبت می‌کند، و اجراهای تکمیل‌شده backup را همراه manifest archive در SQLite ثبت
  می‌کند. `openclaw backup create` به‌صورت پیش‌فرض archive نوشته‌شده را validate
  می‌کند؛ `--no-verify` مسیر سریع صریح است.
- `openclaw backup restore` پیش از extraction archive را validate می‌کند، از manifest
  نرمال‌شده verifier دوباره استفاده می‌کند، و assetهای manifest تأییدشده را به
  مسیرهای منبع ثبت‌شده‌شان restore می‌کند. برای write به `--yes` نیاز دارد و
  `--dry-run` را برای plan مربوط به restore پشتیبانی می‌کند.
- فیلتر volatile-path قدیمی backup حذف شده است. Backup دیگر به skip list مربوط به
  live-tar برای فایل‌های قدیمی session یا cron با قالب JSON/JSONL نیاز ندارد، چون
  snapshotهای SQLite پیش از ساخت archive stage می‌شوند.
- آماده‌سازی workspace در setup ساده و onboarding دیگر پوشه‌های
  `agents/<agentId>/sessions/` را ایجاد نمی‌کند. آن‌ها فقط config/workspace را
  ایجاد می‌کنند؛ ردیف‌های session در SQLite و ردیف‌های transcript هنگام نیاز در
  database مربوط به هر agent ایجاد می‌شوند.
- repair مربوط به permission امنیتی اکنون به‌جای `sessions.json` و فایل‌های transcript
  JSONL، databaseهای SQLite سراسری و مربوط به هر agent به‌همراه sidecarهای WAL/SHM
  را هدف می‌گیرد.
- نام‌های runtime مربوط به sandbox registry اکنون به‌جای حمل اصطلاحات قدیمی JSON
  registry در active store، مستقیماً kindهای registry در SQLite را توصیف می‌کنند.
- `openclaw reset --scope config+creds+sessions` علاوه بر پوشه‌های قدیمی
  `sessions/`، databaseهای `openclaw-agent.sqlite` مربوط به هر agent و sidecarهای
  WAL/SHM را حذف می‌کند.
- helperهای session تجمیعی Gateway اکنون از نام‌های entry-oriented استفاده می‌کنند:
  `loadCombinedSessionEntriesForGateway` مقدار `{ databasePath, entries }` را برمی‌گرداند.
  نام‌گذاری قدیمی combined-store از callerهای runtime حذف شده است.
- seeding کانال Docker MCP اکنون به‌جای ایجاد `sessions.json` و transcript با قالب
  JSONL، ردیف session اصلی و eventهای transcript را در database SQLite مربوط به هر
  agent می‌نویسد.
- hook بسته‌بندی‌شده session-memory اکنون context مربوط به session قبلی را از SQLite
  با `{agentId, sessionId}` resolve می‌کند. دیگر مسیرهای transcript یا پوشه‌های
  `workspace/sessions` را scan، store، یا synthesize نمی‌کند.
- hook بسته‌بندی‌شده command-logger اکنون به‌جای append کردن به `logs/commands.log`،
  ردیف‌های audit فرمان را در جدول SQLite مشترک `command_log_entries` می‌نویسد.
- allowlistهای pairing کانال اکنون در runtime و در Plugin SDK فقط helperهای read/write
  مبتنی بر SQLite را expose می‌کنند. resolver مسیر قدیمی `*-allowFrom.json` و reader
  فایل فقط زیر کد واردسازی قدیمی doctor قرار دارند.
- `migration_runs` اجرای migrationهای legacy-state را با status، timestampها، و
  reportهای JSON ثبت می‌کند.
- `migration_sources` هر منبع فایل قدیمی واردشده را با hash، size، record count،
  target table، run id، status، و وضعیت source-removal ثبت می‌کند.
- `backup_runs` مسیرهای archive مربوط به backup، status، و manifestهای JSON را ثبت
  می‌کند.
- schema سراسری جدول registry استفاده‌نشده `agents` را نگه نمی‌دارد. discovery
  مربوط به agent database همان registry canonical به نام `agent_databases` است تا
  زمانی که runtime یک مالک واقعی برای agent-record داشته باشد.
- config تولیدشده catalog مدل در ردیف‌های تایپ‌شده SQLite سراسری
  `agent_model_catalogs` ذخیره می‌شود که با پوشه agent کلیدگذاری شده‌اند. callerهای
  runtime از `ensureOpenClawModelCatalog` استفاده می‌کنند؛ هیچ API سازگاری
  `models.json` در کد runtime وجود ندارد. پیاده‌سازی SQLite را می‌نویسد و registry
  داخلی PI از payload ذخیره‌شده hydrate می‌شود، بدون اینکه فایل `models.json` بسازد.
- export markdown مربوط به transcript session در QMD و config به نام
  `memory.qmd.sessions` حذف شدند. هیچ collection transcript برای QMD، هیچ مسیر
  runtime به شکل `qmd/sessions*`، و هیچ bridge حافظه session مبتنی بر فایل وجود ندارد.
- runtime مربوط به memory-core helperهای indexing transcript در SQLite را از
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` وارد می‌کند، نه
  از subpath مربوط به QMD SDK. subpath مربوط به QMD فقط برای callerهای خارجی تا
  زمانی که cleanup بزرگ SDK بتواند آن را حذف کند، re-export سازگاری را نگه می‌دارد.
- `index.sqlite` خود QMD اکنون یک materialization موقت runtime است که توسط جدول
  اصلی SQLite به نام `plugin_blob_entries` پشتیبانی می‌شود. runtime دیگر sidecar
  پایداری در `~/.openclaw/agents/<agentId>/qmd` ایجاد نمی‌کند.
- Plugin اختیاری `memory-lancedb` دیگر `~/.openclaw/memory/lancedb` را به‌عنوان store
  ضمنی مدیریت‌شده توسط OpenClaw ایجاد نمی‌کند. این یک backend خارجی LanceDB است و
  تا زمانی که operator یک `dbPath` صریح پیکربندی نکند، غیرفعال می‌ماند.
- `check:database-first-legacy-stores` اگر source جدید runtime نام‌های store قدیمی
  را با APIهای filesystem از نوع write جفت کند، fail می‌شود. همچنین اگر source
  runtime markerهای بازنشسته bridge مربوط به transcript یعنی `transcriptLocator` یا
  `sqlite-transcript://...` را دوباره معرفی کند، fail می‌شود. کدهای migration،
  doctor، import، و export صریح غیر session همچنان مجاز هستند. نام‌های قرارداد
  قدیمی گسترده‌تر مانند `sessionFile`، `storePath`، و facadeهای قدیمی دوره فایل
  `SessionManager` هنوز مالک‌های فعلی دارند و پیش از آنکه بتوانند به required
  preflight check تبدیل شوند، به guard work جداگانه migration نیاز دارند. guard
  اکنون storeهای runtime به شکل `cache/*.json`، sidecarهای عمومی
  `thread-bindings.json`، وضعیت cron/run-log JSON، JSON سلامت config، sidecarهای
  restart و lock، تنظیمات Voice Wake، approvalهای اتصال Plugin، JSON مربوط به index
  Pluginهای نصب‌شده، JSONL مربوط به audit در File Transfer، logهای activity در Memory
  Wiki، log متنی قدیمی `command-logger` بسته‌بندی‌شده، و knobهای diagnostics با قالب
  JSONL برای pi-mono raw-stream را نیز پوشش می‌دهد. همچنین نام‌های قدیمی ماژول doctor
  در سطح root را ban می‌کند تا کد سازگاری زیر `src/commands/doctor/` بماند. handlerهای
  debug در Android نیز به‌جای stage کردن فایل‌های cache به نام `camera_debug.log` یا
  `debug_logs.txt`، از خروجی logcat/in-memory استفاده می‌کنند.

## شکل شِمای هدف

شِماها را صریح نگه دارید. وضعیت زمان اجرای تحت مالکیت میزبان از جدول‌های نوع‌دار استفاده می‌کند. وضعیت
مبهم تحت مالکیت Plugin از `plugin_state_entries` / `plugin_blob_entries` استفاده می‌کند؛ جدول
عمومی `kv` برای میزبان وجود ندارد.

پایگاه داده سراسری:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

پایگاه داده عامل:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

جست‌وجوی آینده می‌تواند بدون تغییر جدول‌های رویداد کانونی، جدول‌های FTS اضافه کند:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

مقدارهای بزرگ باید از ستون‌های `blob` استفاده کنند، نه کدگذاری رشته‌ای JSON. `value_json` را برای داده‌های ساختاریافته کوچک نگه دارید که باید با ابزارهای ساده SQLite قابل بررسی بمانند.

`agent_databases` رجیستری کانونی این شاخه است. تا زمانی که مالک واقعی رکورد عامل وجود ندارد، جدول
`agents` اضافه نکنید؛ پیکربندی عامل در `openclaw.json` باقی می‌ماند.

## شکل مهاجرت Doctor

Doctor باید یک گام مهاجرت صریح را فراخوانی کند که قابل گزارش‌دهی و برای اجرای دوباره امن باشد:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` پیاده‌سازی مهاجرت وضعیت را پس از پیش‌بررسی معمول پیکربندی فراخوانی می‌کند و پیش از import یک نسخه پشتیبان تأییدشده می‌سازد. راه‌اندازی زمان اجرا و `openclaw migrate` نباید فایل‌های وضعیت قدیمی OpenClaw را import کنند.

ویژگی‌های مهاجرت:

- یک گذر مهاجرت همه منابع فایل قدیمی را کشف می‌کند و پیش از تغییر دادن هر چیزی یک طرح تولید می‌کند.
- Doctor پیش از import کردن فایل‌های قدیمی، یک آرشیو پشتیبان پیشامهاجرتِ تأییدشده می‌سازد.
- importها idempotent هستند و با مسیر منبع، mtime، اندازه، hash و جدول مقصد کلیدگذاری می‌شوند.
- فایل‌های منبع موفق، پس از commit شدن پایگاه داده مقصد، حذف یا آرشیو می‌شوند.
- importهای ناموفق منبع را دست‌نخورده باقی می‌گذارند و یک هشدار در `migration_runs` ثبت می‌کنند.
- پس از وجود مهاجرت، کد زمان اجرا فقط SQLite را می‌خواند.
- مسیر downgrade/export-to-runtime-files لازم نیست.

## موجودی مهاجرت

این‌ها را به پایگاه داده سراسری منتقل کنید:

- نوشتن‌های زمان اجرای رجیستری وظیفه اکنون از پایگاه داده مشترک استفاده می‌کنند؛ واردکننده
  جانبی منتشرنشده `tasks/runs.sqlite` حذف شده است. ذخیره‌های Snapshot بر اساس شناسه وظیفه
  upsert می‌شوند و فقط ردیف‌های وظیفه/تحویلِ مفقود حذف می‌شوند.
- نوشتن‌های زمان اجرای Task Flow اکنون از پایگاه داده مشترک استفاده می‌کنند؛ واردکننده
  جانبی منتشرنشده `tasks/flows/registry.sqlite` حذف شده است. ذخیره‌های Snapshot
  بر اساس شناسه flow، upsert می‌شوند و فقط ردیف‌های flow مفقود حذف می‌شوند.
- نوشتن‌های زمان اجرای وضعیت Plugin اکنون از پایگاه داده مشترک استفاده می‌کنند؛ واردکننده
  جانبی منتشرنشده `plugin-state/state.sqlite` حذف شده است.
- جست‌وجوی حافظه داخلی دیگر به‌صورت پیش‌فرض از `memory/<agentId>.sqlite` استفاده نمی‌کند؛
  جدول‌های ایندکس آن در پایگاه داده عامل مالک قرار دارند، و opt-in جانبی صریح
  `memorySearch.store.path` به مهاجرت پیکربندی doctor بازنشسته شده است.
- بازایندکس حافظه داخلی فقط جدول‌های متعلق به حافظه را در پایگاه داده عامل بازنشانی می‌کند.
  نباید کل فایل SQLite را جایگزین کند، زیرا همان پایگاه داده مالک
  نشست‌ها، رونوشت‌ها، ردیف‌های VFS، artifacts، و کش‌های زمان اجرا است.
- رجیستری‌های کانتینر/browser سندباکس از JSON یکپارچه و shardشده. نوشتن‌های زمان اجرا
  اکنون از پایگاه داده مشترک استفاده می‌کنند؛ واردکردن JSON قدیمی باقی می‌ماند.
- تعریف‌های job در Cron، وضعیت زمان‌بندی، و تاریخچه اجرا اکنون از SQLite مشترک استفاده می‌کنند؛
  doctor فایل‌های قدیمی `jobs.json`، `jobs-state.json`، و
  `cron/runs/*.jsonl` را وارد/حذف می‌کند
- هویت/احراز هویت دستگاه، push، بررسی update، تعهدها، کش مدل OpenRouter،
  ایندکس Plugin نصب‌شده، و bindingهای app-server
- رکوردهای pairing و bootstrap دستگاه/node اکنون از جدول‌های SQLite تایپ‌شده استفاده می‌کنند
- مشترکان اعلان device-pair و نشانگرهای درخواست تحویل‌شده اکنون به‌جای
  `device-pair-notify.json` از جدول plugin-state مشترک SQLite استفاده می‌کنند.
- رکوردهای تماس voice-call اکنون به‌جای `calls.jsonl` از جدول plugin-state مشترک SQLite
  زیر فضای نام `voice-call` / `calls` استفاده می‌کنند؛ Plugin CLI
  تاریخچه تماسِ پشتیبانی‌شده با SQLite را tail و خلاصه می‌کند.
- نشست‌های Gateway در QQBot، رکوردهای کاربر شناخته‌شده، و کش نقل‌قول ref-index اکنون
  به‌جای `session-*.json`، `known-users.json`،
  و `ref-index.jsonl` از وضعیت Plugin در SQLite زیر فضاهای نام `qqbot`
  (`gateway-sessions`، `known-users`، `ref-index`) استفاده می‌کنند. آن فایل‌های قدیمی کش هستند و مهاجرت داده نمی‌شوند.
- ترجیحات model-picker در Discord، hashهای command-deploy، و bindingهای thread
  اکنون به‌جای `model-picker-preferences.json`، `command-deploy-cache.json`، و
  `thread-bindings.json` از وضعیت Plugin در SQLite زیر فضاهای نام `discord`
  (`model-picker-preferences`، `command-deploy-hashes`، `thread-bindings`)
  استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به Discord فایل‌های قدیمی را وارد و
  حذف می‌کند.
- cursorهای catchup در BlueBubbles و نشانگرهای inbound dedupe اکنون به‌جای
  `bluebubbles/catchup/*.json` و
  `bluebubbles/inbound-dedupe/*.json` از وضعیت Plugin در SQLite زیر فضاهای نام
  `bluebubbles` (`catchup-cursors`، `inbound-dedupe`)
  استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به BlueBubbles
  فایل‌های قدیمی را وارد و حذف می‌کند.
- offsetهای update در Telegram، ورودی‌های کش sticker، ورودی‌های کش پیام reply-chain،
  ورودی‌های کش پیام ارسال‌شده، ورودی‌های کش نام topic، و bindingهای thread
  اکنون به‌جای `update-offset-*.json`،
  `sticker-cache.json`، `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`، `*.telegram-topic-names.json`، و
  `thread-bindings-*.json` از وضعیت Plugin در SQLite زیر فضاهای نام `telegram`
  (`update-offsets`، `sticker-cache`، `message-cache`، `sent-messages`,
  `topic-names`، `thread-bindings`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به Telegram
  فایل‌های قدیمی را وارد و حذف می‌کند.
- cursorهای catchup در iMessage، نگاشت‌های short-id پاسخ، و ردیف‌های sent-echo dedupe
  اکنون به‌جای `imessage/catchup/*.json`،
  `imessage/reply-cache.jsonl`، و `imessage/sent-echoes.jsonl` از وضعیت Plugin
  در SQLite زیر فضاهای نام `imessage` (`catchup-cursors`,
  `reply-cache`، `sent-echoes`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به iMessage
  فایل‌های قدیمی را وارد و حذف می‌کند.
- گفت‌وگوها، pollها، tokenهای SSO، و آموخته‌های بازخورد در Microsoft Teams اکنون
  به‌جای `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, و `*.learnings.json` از فضاهای نام
  وضعیت Plugin در SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به
  Microsoft Teams فایل‌های قدیمی را وارد و archive می‌کند.
  uploadهای pending یک کش کوتاه‌عمر SQLite هستند و فایل‌های کش JSON قدیمی
  مهاجرت داده نمی‌شوند.
- کش sync در Matrix، فراداده ذخیره‌سازی، bindingهای thread، نشانگرهای inbound dedupe،
  وضعیت cooldown برای startup verification، credentialها، کلیدهای بازیابی، و Snapshotهای
  رمزنگاری IndexedDB در SDK اکنون به‌جای
  `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, و `crypto-idb-snapshot.json` از فضاهای نام وضعیت/blob در
  SQLite زیر `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به Matrix
  آن فایل‌های قدیمی را از rootهای ذخیره‌سازی Matrix با scope حساب وارد و حذف می‌کند.
- cursorهای bus در Nostr و وضعیت انتشار پروفایل اکنون به‌جای
  `bus-state-*.json` و `profile-state-*.json` از وضعیت Plugin در SQLite زیر
  فضاهای نام `nostr` (`bus-state`, `profile-state`) استفاده می‌کنند؛ مهاجرت doctor/setup
  مربوط به Nostr فایل‌های قدیمی را وارد و حذف می‌کند.
- toggleهای نشست Active Memory اکنون به‌جای `session-toggles.json` از وضعیت Plugin
  در SQLite زیر `active-memory/session-toggles` استفاده می‌کنند.
- صف‌های proposal و شمارنده‌های review در Skill Workshop اکنون به‌جای
  فایل‌های per-workspace `skill-workshop/<workspace>.json` از وضعیت Plugin در SQLite
  زیر `skill-workshop/proposals` و `skill-workshop/reviews` استفاده می‌کنند.
- صف‌های outbound delivery و session delivery اکنون به‌جای فایل‌های پایدار
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, و
  `session-delivery-queue/*.json` جدول سراسری SQLite
  `delivery_queue_entries` را زیر نام‌های صف جداگانه
  (`outbound-delivery`, `session-delivery`) به‌اشتراک می‌گذارند. گام legacy-state در doctor
  ردیف‌های pending و failed را وارد می‌کند، نشانگرهای delivered کهنه را حذف می‌کند،
  و فایل‌های JSON قدیمی را پس از import حذف می‌کند. فیلدهای hot routing و retry
  ستون‌های تایپ‌شده هستند؛ payload JSON فقط برای replay/debug نگه داشته می‌شود.
- leaseهای فرایند ACPX اکنون به‌جای `process-leases.json` از وضعیت Plugin در SQLite
  زیر `acpx/process-leases` استفاده می‌کنند.
- فراداده اجرای backup و migration

این موارد را به پایگاه‌های داده عامل منتقل کنید:

- rootهای نشست عامل و payloadهای session-entry با شکل سازگار. برای نوشتن‌های زمان اجرا انجام شده است:
  فراداده داغ نشست در `sessions` قابل query است، درحالی‌که payload کامل
  `SessionEntry` با شکل قدیمی در `session_entries` باقی می‌ماند.
- رویدادهای رونوشت عامل. برای نوشتن‌های زمان اجرا انجام شده است.
- checkpointهای Compaction و Snapshotهای رونوشت. برای نوشتن‌های زمان اجرا انجام شده است:
  کپی‌های رونوشت checkpoint، ردیف‌های رونوشت SQLite هستند و فراداده checkpoint
  در `transcript_snapshots` ثبت می‌شود. helperهای checkpoint در Gateway
  اکنون این مقادیر را به‌جای فایل‌های مبدأ، Snapshotهای رونوشت می‌نامند.
- فضاهای نام scratch/workspace در VFS عامل. برای نوشتن‌های VFS زمان اجرا انجام شده است.
- payloadهای پیوست subagent. برای نوشتن‌های زمان اجرا انجام شده است: آن‌ها ورودی‌های seed در VFS
  SQLite هستند و هرگز فایل‌های workspace پایدار نیستند.
- artifacts ابزار. برای نوشتن‌های زمان اجرا انجام شده است.
- artifacts اجرا. برای نوشتن‌های زمان اجرای worker از طریق جدول per-agent
  `run_artifacts` انجام شده است.
- کش‌های زمان اجرای agent-local. برای نوشتن‌های کش با scope زمان اجرای worker از طریق
  جدول per-agent `cache_entries` انجام شده است. کش‌های مدل در سطح Gateway در
  پایگاه داده سراسری می‌مانند مگر اینکه agent-specific شوند.
- logهای stream والد ACP. برای نوشتن‌های زمان اجرا انجام شده است.
- نشست‌های ledger برای replay در ACP. برای نوشتن‌های زمان اجرا از طریق
  `acp_replay_sessions` و `acp_replay_events` انجام شده است؛ `acp/event-ledger.json` قدیمی
  فقط به‌عنوان ورودی doctor باقی می‌ماند.
- فراداده نشست ACP. برای نوشتن‌های زمان اجرا از طریق `acp_sessions` انجام شده است؛ بلوک‌های قدیمی
  `entry.acp` در `sessions.json` فقط ورودی مهاجرت doctor هستند.
- sidecarهای trajectory وقتی فایل export صریح نیستند. برای نوشتن‌های زمان اجرا انجام شده است:
  capture trajectory ردیف‌های `trajectory_runtime_events` در پایگاه داده عامل را می‌نویسد
  و artifacts با scope اجرا را در SQLite mirror می‌کند. sidecarهای قدیمی فقط ورودی‌های
  import برای doctor هستند؛ export می‌تواند خروجی‌های تازه JSONL برای support-bundle بسازد
  اما sidecarهای قدیمی trajectory/transcript را در زمان اجرا نمی‌خواند یا مهاجرت نمی‌دهد.
  capture trajectory در زمان اجرا scope SQLite را expose می‌کند؛ helperهای مسیر JSONL
  به پشتیبانی export/debug محدود شده‌اند و از ماژول runtime دوباره export نمی‌شوند.
  فراداده trajectory در embedded-runner هویت `{agentId, sessionId, sessionKey}`
  را به‌جای پایدارسازی transcript locator ثبت می‌کند.

این موارد را فعلاً file-backed نگه دارید:

- `openclaw.json`
- فایل‌های credential مربوط به provider یا CLI
- manifestهای Plugin/package
- workspaceهای کاربر و repositoryهای Git وقتی حالت disk انتخاب شده است
- logهایی که برای tail کردن توسط operator در نظر گرفته شده‌اند، مگر اینکه یک سطح log مشخص منتقل شود

## برنامه مهاجرت

### فاز 0: مرز را منجمد کنید

پیش از جابه‌جایی ردیف‌های بیشتر، مرز وضعیت پایدار را صریح کنید:

- یک جدول `migration_runs` به پایگاه داده سراسری اضافه کنید.
  برای گزارش‌های اجرای مهاجرت legacy-state انجام شده است.
- یک سرویس مهاجرت وضعیت با مالکیت واحد doctor برای import از فایل به پایگاه داده اضافه کنید.
  انجام شده: `openclaw doctor --fix` از پیاده‌سازی مهاجرت legacy-state استفاده می‌کند.
- `plan` را read-only کنید و کاری کنید `apply` یک backup بسازد، import کند، verify کند، و
  سپس فایل‌های قدیمی را حذف یا quarantine کند.
  انجام شده: doctor یک backup تأییدشده پیش از مهاجرت می‌سازد، مسیر backup
  را وارد `migration_runs` می‌کند، و از مسیرهای importer/removal دوباره استفاده می‌کند.
- banهای static اضافه کنید تا کد جدید runtime نتواند فایل‌های وضعیت قدیمی بنویسد، درحالی‌که
  کد مهاجرت و testها همچنان بتوانند آن‌ها را seed/read کنند.
  برای storeهای قدیمی که در حال حاضر migrate شده‌اند انجام شده است؛ guard همچنین testهای تو در تو
  را برای قراردادهای ممنوع runtime transcript locator اسکن می‌کند.

### فاز 1: Control Plane سراسری را کامل کنید

وضعیت هماهنگی مشترک را در `state/openclaw.sqlite` نگه دارید:

- عامل‌ها و رجیستری پایگاه داده عامل
- ledgerهای Task و Task Flow
- وضعیت Plugin
- رجیستری کانتینر/browser سندباکس
- تاریخچه اجرای Cron/scheduler
- pairing، دستگاه، push، update-check، TUI، کش‌های OpenRouter/model، و سایر
  وضعیت‌های زمان اجرای کوچک با scope Gateway
- فراداده backup و migration
- byteهای پیوست رسانه در Gateway. برای نوشتن‌های زمان اجرا انجام شده است؛ مسیرهای مستقیم فایل
  materializationهای موقت برای سازگاری با channel senderها و staging سندباکس هستند.
  allowlistهای زمان اجرا مسیرهای materialization در SQLite را می‌پذیرند، نه rootهای قدیمی
  state/config media. doctor فایل‌های رسانه قدیمی را در
  `media_blobs` وارد می‌کند و پس از نوشتن موفق ردیف، فایل‌های مبدأ را حذف می‌کند.
- نشست‌ها، رویدادها، و blobهای payload در capture مربوط به debug proxy. انجام شده: captureها
  در DB وضعیت مشترک زندگی می‌کنند و از طریق bootstrap، schema،
  WAL، و تنظیمات busy-timeout همان DB وضعیت مشترک باز می‌شوند. byteهای payload با gzip در
  `capture_blobs.data` فشرده می‌شوند؛ هیچ override برای DB جانبی runtime مربوط به debug proxy،
  دایرکتوری blob، یا target تولید schema/codegen فقط برای proxy-capture وجود ندارد.
  مهاجرت doctor/startup ردیف‌های `debug-proxy/capture.sqlite` منتشرشده
  و blobهای payload ارجاع‌شده، از جمله overrideهای فعال محیط legacy DB/blob، را وارد می‌کند،
  سپس آن sourceها را archive می‌کند و گواهی‌های CA را دست‌نخورده باقی می‌گذارد.

این فاز همچنین openerهای sidecar تکراری، helperهای permission، راه‌اندازی WAL،
pruning فایل‌سیستم، و writerهای compatibility را از آن زیرسیستم‌ها حذف می‌کند.

### فاز 2: پایگاه‌های داده per-agent را معرفی کنید

برای هر عامل یک پایگاه داده بسازید و آن را از DB سراسری register کنید:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

ردیف سراسری `agent_databases` مسیر، نسخه schema، timestamp آخرین مشاهده،
و فراداده پایه اندازه/درستی را ذخیره می‌کند. کد runtime به‌جای استخراج مستقیم
مسیرهای فایل، DB عامل را از رجیستری درخواست می‌کند.

DB عامل مالک این موارد است:

- `sessions` به‌عنوان ریشهٔ متعارف نشست، با `session_entries` به‌عنوان جدول محمولهٔ سازگارشده متصل به آن ریشه، و
  `session_routes` به‌عنوان جست‌وجوی یکتای `session_key` فعال
- `conversations` و `session_conversations` به‌عنوان هویت مسیریابی نرمال‌شدهٔ ارائه‌دهنده
  که به نشست‌ها متصل است
- `transcript_events`
- اسنپ‌شات‌های رونوشت و نقاط وارسی Compaction. برای نوشتن‌های زمان اجرا انجام شده است.
- `vfs_entries`
- `tool_artifacts` و آرتیفکت‌های اجرا
- ردیف‌های زمان اجرا/کش محلی عامل. برای کش‌های محدود به worker انجام شده است.
- رویدادهای جریان والد ACP
- رویدادهای زمان اجرای trajectory وقتی آرتیفکت‌های صریح export نیستند

### فاز ۳: جایگزینی APIهای ذخیره‌گاه نشست

برای زمان اجرا انجام شده است. سطح ذخیره‌گاه نشست با شکل فایل، قرارداد فعال
زمان اجرا نیست:

- زمان اجرا دیگر `loadSessionStore(storePath)` را فراخوانی نمی‌کند یا `storePath` را به‌عنوان
  هویت نشست در نظر نمی‌گیرد.
- عملیات ردیفی زمان اجرا عبارت‌اند از `getSessionEntry`، `upsertSessionEntry`،
  `patchSessionEntry`، `deleteSessionEntry`، و `listSessionEntries`.
- کمک‌کننده‌های بازنویسی کل ذخیره‌گاه، نویسنده‌های فایل، آزمون‌های صف، هرس alias، و
  پارامترهای حذف کلید legacy از زمان اجرا حذف شده‌اند.
- exportهای سازگاری منسوخ‌شدهٔ پکیج ریشه همچنان مسیرهای متعارف
  `sessions.json` را روی APIهای ردیفی SQLite تطبیق می‌دهند.
- پارس کردن `sessions.json` فقط در کد migration/import مربوط به doctor و
  آزمون‌های doctor باقی می‌ماند.
- fallback چرخهٔ عمر زمان اجرا هدرهای رونوشت SQLite را می‌خواند، نه خط‌های نخست JSONL.

هر چیزی را که پارامترهای file-lock،
واژگان pruning/truncation-as-file-maintenance، هویت store-path، یا آزمون‌هایی را
که تنها ادعایشان ماندگاری JSON است دوباره وارد می‌کند، همچنان حذف کنید.

### فاز ۴: انتقال رونوشت‌ها، جریان‌های ACP، مسیرها، و VFS

هر جریان دادهٔ عامل را بومی پایگاه‌داده کنید:

- نوشتن‌های append رونوشت از طریق یک تراکنش SQLite انجام می‌شود که
  هدر نشست را تضمین می‌کند، idempotency پیام را بررسی می‌کند، tail والد را انتخاب می‌کند،
  در `transcript_events` درج می‌کند، و فرادادهٔ هویت قابل‌پرس‌وجو را در
  `transcript_event_identities` ثبت می‌کند. برای appendهای مستقیم پیام رونوشت و
  appendهای ماندگار عادی `TranscriptSessionManager` انجام شده است؛ عملیات صریح branch
  انتخاب والد صریح خود را حفظ می‌کنند و همچنان ردیف‌های SQLite را
  بدون استخراج هیچ file locator می‌نویسند.
- لاگ‌های جریان والد ACP به ردیف تبدیل می‌شوند، نه فایل‌های `.acp-stream.jsonl`. انجام شده است.
- راه‌اندازی spawn در ACP دیگر مسیرهای transcript JSONL را ماندگار نمی‌کند. انجام شده است.
- ثبت trajectory زمان اجرا، ردیف‌های رویداد/آرتیفکت‌ها را مستقیم می‌نویسد. فرمان صریح
  support/export هنوز می‌تواند آرتیفکت‌های JSONL برای support-bundle را به‌عنوان
  فرمت export تولید کند، اما export نشست، JSONL نشست را دوباره ایجاد نمی‌کند. انجام شده است.
- workspaceهای دیسکی وقتی به‌عنوان حالت دیسک پیکربندی شده‌اند روی دیسک می‌مانند.
- scratch مربوط به VFS و حالت آزمایشی workspace فقط VFS از پایگاه‌دادهٔ عامل استفاده می‌کنند.

migration فایل‌های JSONL قدیمی را یک‌بار import می‌کند، شمارش‌ها/هش‌ها را در
`migration_runs` ثبت می‌کند، و فایل‌های importشده را پس از بررسی‌های یکپارچگی حذف می‌کند.

### فاز ۵: پشتیبان‌گیری، بازیابی، Vacuum، و راستی‌آزمایی

پشتیبان‌ها یک فایل آرشیو باقی می‌مانند:

- برای هر پایگاه‌دادهٔ سراسری و عامل checkpoint بگیرید.
- هر DB را با معناشناسی پشتیبان‌گیری SQLite یا `VACUUM INTO` اسنپ‌شات کنید.
- اسنپ‌شات‌های فشردهٔ DB، پیکربندی، اعتبارنامه‌های خارجی، و exportهای درخواستی workspace را آرشیو کنید.
- فایل‌های خام زندهٔ `*.sqlite-wal` و `*.sqlite-shm` را کنار بگذارید.
- با باز کردن هر اسنپ‌شات DB و اجرای `PRAGMA integrity_check` راستی‌آزمایی کنید.
  `openclaw backup create` این راستی‌آزمایی آرشیو را به‌صورت پیش‌فرض انجام می‌دهد؛
  `--no-verify` فقط گذر آرشیو پس از نوشتن را رد می‌کند، نه بررسی یکپارچگی
  ایجاد اسنپ‌شات.
- بازیابی، اسنپ‌شات‌ها را به مسیرهای هدفشان کپی می‌کند. این branch، چیدمان SQLite منتشرنشده را به
  `user_version = 1` بازنشانی می‌کند؛ تغییرات schema منتشرشدهٔ آینده می‌توانند
  وقتی لازم شد migrationهای صریح اضافه کنند.

### فاز ۶: زمان اجرای Worker

در حالی که تفکیک پایگاه‌داده جا می‌افتد، حالت worker را آزمایشی نگه دارید:

- Workerها شناسهٔ عامل، شناسهٔ اجرا، حالت فایل‌سیستم، و هویت registry پایگاه‌داده را دریافت می‌کنند.
- هر worker اتصال SQLite خودش را باز می‌کند.
- والد اختیار تحویل کانال، approvalها، پیکربندی، و لغو را نگه می‌دارد.
- با یک worker برای هر اجرای فعال شروع کنید؛ pooling را فقط پس از پایدار شدن چرخهٔ عمر و
  مالکیت اتصال DB اضافه کنید.

### فاز ۷: حذف دنیای قدیمی

برای مدیریت نشست زمان اجرا انجام شده است. دنیای قدیمی فقط به‌عنوان ورودی صریح
doctor یا خروجی support/export مجاز است:

- هیچ نوشتن زمان اجرای `sessions.json`، transcript JSONL، sandbox registry JSON، task
  sidecar SQLite، یا plugin-state sidecar SQLite وجود ندارد.
- هیچ pruning فایل JSON/session، کوتاه‌سازی رونوشت فایل، قفل‌های فایل نشست،
  یا آزمون‌های نشست با شکل lock وجود ندارد.
- هیچ export سازگاری زمان اجرا که هدفش به‌روز نگه داشتن فایل‌های قدیمی نشست باشد وجود ندارد.
- exportهای صریح support همچنان فرمت‌های آرشیو/مادی‌سازی درخواست‌شده توسط کاربر هستند
  و نباید نام فایل‌ها را دوباره وارد هویت زمان اجرا کنند.

## پشتیبان‌گیری و بازیابی

پشتیبان‌ها باید یک فایل آرشیو باشند، اما ثبت پایگاه‌داده باید
بومی SQLite باشد:

1. فعالیت نوشتن طولانی‌مدت را متوقف کنید یا وارد یک مانع کوتاه پشتیبان‌گیری شوید.
2. برای هر پایگاه‌دادهٔ سراسری و عامل، یک checkpoint اجرا کنید.
3. هر پایگاه‌داده را با معناشناسی پشتیبان‌گیری SQLite یا `VACUUM INTO` در یک
   دایرکتوری پشتیبان موقت اسنپ‌شات کنید.
4. اسنپ‌شات‌های فشردهٔ پایگاه‌داده، فایل پیکربندی، دایرکتوری اعتبارنامه‌ها،
   workspaceهای انتخاب‌شده، و یک manifest را آرشیو کنید.
5. آرشیو را با باز کردن هر اسنپ‌شات SQLite گنجانده‌شده و اجرای
   `PRAGMA integrity_check` راستی‌آزمایی کنید.
   `openclaw backup create` این کار را به‌صورت پیش‌فرض انجام می‌دهد؛ `--no-verify` فقط برای
   رد کردن عمدی گذر آرشیو پس از نوشتن است.

به کپی‌های خام زندهٔ `*.sqlite`، `*.sqlite-wal`، و `*.sqlite-shm` به‌عنوان
فرمت اصلی پشتیبان تکیه نکنید. manifest آرشیو باید نقش پایگاه‌داده،
شناسهٔ عامل، نسخهٔ schema، مسیر منبع، مسیر اسنپ‌شات، اندازهٔ بایتی، و وضعیت یکپارچگی را ثبت کند.

بازیابی باید پایگاه‌دادهٔ سراسری و فایل‌های پایگاه‌دادهٔ عامل را از
اسنپ‌شات‌های آرشیو بازسازی کند. چون چیدمان SQLite هنوز منتشر نشده است، این refactor
فقط schema نسخهٔ ۱ به‌همراه import فایل به پایگاه‌دادهٔ doctor را نگه می‌دارد. فرمان restore
ابتدا آرشیو را اعتبارسنجی می‌کند، سپس هر asset در manifest را از محمولهٔ استخراج‌شدهٔ
راستی‌آزمایی‌شده جایگزین می‌کند.

## طرح Refactor زمان اجرا

1. APIهای registry پایگاه‌داده را اضافه کنید.
   - مسیرهای DB سراسری و DB به‌ازای هر عامل را resolve کنید.
   - schemaهای منتشرنشده را روی `user_version = 1` نگه دارید؛ تا زمانی که یک schema منتشرشده
     به آن نیاز ندارد، کد runner مربوط به migration schema اضافه نکنید.
   - کمک‌کننده‌های close/checkpoint/integrity را که توسط آزمون‌ها، backup، و doctor استفاده می‌شوند اضافه کنید.

2. ذخیره‌گاه‌های sidecar SQLite را ادغام کنید.
   - جدول‌های وضعیت Plugin را به پایگاه‌دادهٔ سراسری منتقل کنید. برای نوشتن‌های زمان اجرا انجام شده است؛
     importer قدیمی sidecar منتشرنشده حذف شده است.
   - جدول‌های task registry را به پایگاه‌دادهٔ سراسری منتقل کنید. برای نوشتن‌های زمان اجرا انجام شده است؛
     importer قدیمی sidecar منتشرنشده حذف شده است.
   - جدول‌های TaskFlow را به پایگاه‌دادهٔ سراسری منتقل کنید. برای نوشتن‌های زمان اجرا انجام شده است؛
     importer قدیمی sidecar منتشرنشده حذف شده است.
   - جدول‌های builtin memory-search را به هر پایگاه‌دادهٔ عامل منتقل کنید. انجام شده است؛
     `memorySearch.store.path` سفارشی صریح اکنون توسط migration پیکربندی doctor حذف می‌شود.
     reindex کامل درجا فقط روی جدول‌های حافظه اجرا می‌شود؛ مسیر swap قدیمی کل فایل
     و کمک‌کنندهٔ swap ایندکس sidecar حذف شده‌اند.
   - بازکننده‌های تکراری پایگاه‌داده، راه‌اندازی WAL، کمک‌کننده‌های permission، و
     مسیرهای close را از آن زیرسیستم‌ها حذف کنید.

3. جدول‌های متعلق به عامل را به پایگاه‌داده‌های به‌ازای هر عامل منتقل کنید.
   - DB عامل را در زمان نیاز از طریق registry پایگاه‌دادهٔ سراسری ایجاد کنید. انجام شده است.
   - ورودی‌های نشست زمان اجرا، رویدادهای رونوشت، ردیف‌های VFS، و آرتیفکت‌های ابزار را
     به DBهای عامل منتقل کنید. انجام شده است.
   - ورودی‌های نشست shared-DB محلی branch، رویدادهای رونوشت،
     ردیف‌های VFS، یا آرتیفکت‌های ابزار را migrate نکنید؛ آن چیدمان هرگز منتشر نشده است. فقط
     import فایل قدیمی به پایگاه‌داده را در doctor نگه دارید.

4. APIهای ذخیره‌گاه نشست را جایگزین کنید.
   - `storePath` را به‌عنوان هویت زمان اجرا حذف کنید. برای زمان اجرا انجام شده و توسط
     `check:database-first-legacy-stores` محافظت می‌شود: فرادادهٔ نشست، به‌روزرسانی‌های route،
     ماندگاری فرمان، پاک‌سازی نشست CLI، پیش‌نمایش‌های reasoning در Feishu،
     ماندگاری transcript-state، عمق subagent، overrideهای نشست پروفایل auth،
     منطق parent-fork، و بازرسی QA-lab اکنون پایگاه‌داده را از کلیدهای متعارف
     عامل/نشست resolve می‌کنند.
     پاسخ‌های فهرست نشست Gateway/TUI/UI/macOS اکنون به‌جای `path` قدیمی، `databasePath`
     را expose می‌کنند؛ سطوح debug در macOS پایگاه‌دادهٔ به‌ازای هر عامل را
     به‌عنوان وضعیت read-only نشان می‌دهند، نه اینکه پیکربندی `session.store` را بنویسند.
     `/status`، export trajectory هدایت‌شده از chat، و proxyهای dependency در CLI دیگر
     مسیرهای store قدیمی را propagate نمی‌کنند؛ fallback مصرف رونوشت، SQLite را بر اساس
     هویت عامل/نشست می‌خواند. آزمون‌های runtime و bridge دیگر `storePath` را expose نمی‌کنند؛
     ورودی‌های doctor/migration مالک آن نام فیلد قدیمی هستند.
     بارگذاری نشست ترکیبی Gateway دیگر branch ویژهٔ زمان اجرا برای
     مقادیر غیر templated در `session.store` ندارد؛ ردیف‌های SQLite به‌ازای هر عامل را تجمیع می‌کند.
     مسیر doctor مربوط به legacy session-lock و کمک‌کنندهٔ پاک‌سازی `.jsonl.lock` آن
     حذف شدند؛ اکنون SQLite مرز هم‌روندی نشست است.
     محل‌های فراخوانی داغ زمان اجرا از نام‌های کمک‌کنندهٔ ردیف‌محور مانند
     `resolveSessionRowEntry` استفاده می‌کنند؛ alias سازگاری قدیمی `resolveSessionStoreEntry`
     از زمان اجرا و exportهای Plugin SDK حذف شده است.

- از عملیات ردیفی `{ agentId, sessionKey }` استفاده کنید.
  انجام شده: `getSessionEntry`، `upsertSessionEntry`، `deleteSessionEntry`،
  `patchSessionEntry`، و `listSessionEntries` APIهای SQLite-first هستند که
  به مسیر ذخیره‌گاه نشست نیاز ندارند. خلاصهٔ وضعیت، وضعیت عامل محلی، health،
  و فرمان فهرست‌گیری `openclaw sessions` اکنون ردیف‌های به‌ازای هر عامل را مستقیم می‌خوانند
  و به‌جای مسیرهای `sessions.json`، مسیرهای پایگاه‌دادهٔ SQLite به‌ازای هر عامل را نمایش می‌دهند.
- حذف/درج کل ذخیره‌گاه را با `upsertSessionEntry`،
  `deleteSessionEntry`، `listSessionEntries`، و پرس‌وجوهای پاک‌سازی SQL جایگزین کنید.
  برای زمان اجرا انجام شده است: مسیرهای داغ اکنون از APIهای ردیفی و patchهای ردیفی با retry در conflict استفاده می‌کنند؛
  کمک‌کننده‌های باقی‌ماندهٔ import/replace کل ذخیره‌گاه به کد import migration
  و آزمون‌های backend SQLite محدود شده‌اند.
  - `store-writer.ts` و آزمون‌های writer-queue را حذف کنید. انجام شده است.
  - pruning کلید legacy در زمان اجرا و پارامترهای alias-delete را از upsert/patch ردیف نشست حذف کنید. انجام شده است.

5. رفتار JSON registry در زمان اجرا را حذف کنید.
   - خواندن و نوشتن sandbox registry را فقط SQLite کنید. انجام شده است.
   - JSON یکپارچه و sharded را فقط از مرحلهٔ migration import کنید. انجام شده است.
   - قفل‌های registry شاردشده و نوشتن‌های JSON را حذف کنید. انجام شده است.

- اگر شکل همچنان وضعیت عملیاتی مسیر داغ است، به‌جای ذخیره کردن ردیف‌های registry به‌صورت
  JSON مبهم generic، یک جدول registry typed نگه دارید. انجام شده است.

6. mutation نشست با شکل file-lock را حذف کنید.
   - برای ایجاد lock در زمان اجرا و APIهای lock زمان اجرا انجام شده است.
   - مسیر مستقل پاک‌سازی legacy `.jsonl.lock` در doctor حذف شده است.
   - `session.writeLock` پیکربندی legacy migrateشده توسط doctor است، نه یک تنظیم typed زمان اجرا.
   - یکپارچگی وضعیت دیگر مسیر جداگانهٔ pruning فایل رونوشت یتیم ندارد؛
     migration در doctor منابع legacy JSONL را در یک نقطه import/remove می‌کند.
   - هماهنگی singleton در Gateway از ردیف‌های typed SQLite به نام `state_leases` زیر
     `gateway_locks` استفاده می‌کند و دیگر seam دایرکتوری file-lock را expose نمی‌کند.
   - ماندگاری dedupe در Plugin SDK generic دیگر از file lock یا فایل‌های JSON استفاده نمی‌کند؛
     ردیف‌های shared SQLite plugin-state را می‌نویسد. انجام شده است.
   - هماهنگی QMD embed به‌جای `qmd/embed.lock` از lease وضعیت SQLite استفاده می‌کند. انجام شده است.

7. workerها را database-aware کنید.
   - Workerها اتصال‌های SQLite خودشان را باز می‌کنند.
   - والد مالک delivery، callbackهای کانال، و config است.
   - Worker شناسهٔ عامل، شناسهٔ اجرا، حالت فایل‌سیستم، و هویت registry
     DB را دریافت می‌کند، نه handleهای زنده.
   - `vfs-only` آزمایشی می‌ماند و از پایگاه‌دادهٔ عامل به‌عنوان ریشهٔ storage خود استفاده می‌کند.
   - ابتدا یک worker برای هر اجرای فعال نگه دارید. Pooling می‌تواند تا زمانی که طول عمر اتصال DB
     و رفتار لغو معمولی و پایدار شوند صبر کند.

۸. یکپارچه‌سازی پشتیبان‌گیری.
   - به پشتیبان‌گیری آموزش دهید که از پایگاه‌های دادهٔ سراسری و عامل‌ها از طریق پشتیبان‌گیری SQLite یا
     `VACUUM INTO` snapshot بگیرد. برای فایل‌های `*.sqlite` کشف‌شده زیر دارایی state انجام شد.
   - راستی‌آزمایی پشتیبان را برای یکپارچگی SQLite و نسخهٔ schema اضافه کنید. برای ایجاد پشتیبان و بررسی‌های یکپارچگی راستی‌آزمایی archive پیش‌فرض انجام شد.
   - فرادادهٔ اجرای پشتیبان را در SQLite ثبت کنید. از طریق جدول مشترک `backup_runs` با مسیر archive، وضعیت، و JSON manifest انجام شد.
   - بازیابی از snapshotهای archive راستی‌آزمایی‌شده را اضافه کنید. انجام شد: `openclaw backup
restore` پیش از استخراج اعتبارسنجی می‌کند، از manifest نرمال‌شدهٔ verifier استفاده می‌کند، از `--dry-run` پشتیبانی می‌کند، و پیش از جایگزینی مسیرهای منبع ثبت‌شده به `--yes` نیاز دارد.
   - export برای VFS/workspace را فقط هنگام درخواست‌شدن شامل کنید؛ internals نشست را به‌صورت JSON یا JSONL export نکنید.

۹. آزمون‌ها و کد منسوخ را حذف کنید. برای سطوح شناخته‌شدهٔ نشست runtime انجام شد.

- آزمون‌هایی را حذف کنید که ایجاد runtime برای فایل‌های `sessions.json` یا transcript
  JSONL را assert می‌کنند. برای core session store، chat، رویدادهای transcript در gateway،
  preview، lifecycle، به‌روزرسانی‌های command session-entry، reset/trace برای auto-reply، و
  fixtureهای memory-core dreaming، مسیریابی approval target، ترمیم session transcript،
  ترمیم مجوز امنیتی، trajectory export، و session export انجام شد.
  آزمون‌های transcript مربوط به active-memory اکنون scopeهای SQLite و عدم ایجاد فایل JSONL موقت یا پایدارشده را assert می‌کنند.
  رگرسیون قدیمی heartbeat برای transcript-pruning حذف شد، چون
  runtime دیگر transcriptهای JSONL را truncate نمی‌کند.
  آزمون‌های ابزار agent session-list دیگر مسیرهای legacy `sessions.json` را
  به‌عنوان شکل پاسخ Gateway مدل نمی‌کنند؛ آزمون‌های app/UI/macOS از `databasePath` استفاده می‌کنند.
  آزمون‌های transcript-usage برای `/status` اکنون مستقیماً ردیف‌های transcript در SQLite را seed می‌کنند
  به‌جای نوشتن فایل‌های JSONL.
  آزمون‌های lifecycle نشست Gateway اکنون مستقیماً از helperهای seed کردن transcript در SQLite استفاده می‌کنند؛ شکل fixture قدیمی فایل نشست تک‌خطی از پوشش reset
  و delete حذف شده است.
  `sessions.delete` دیگر فیلد دورهٔ فایل `archived: []` را برنمی‌گرداند؛ deletion
  فقط نتیجهٔ جهش row را گزارش می‌کند. گزینهٔ قدیمی `deleteTranscript` نیز
  حذف شده است: حذف یک نشست ریشهٔ canonical `sessions` را حذف می‌کند و اجازه می‌دهد
  SQLite ردیف‌های transcript، snapshot، و trajectory متعلق به نشست را cascade کند، بنابراین هیچ
  caller نمی‌تواند transcript orphan به‌جا بگذارد یا یک branch پاک‌سازی را فراموش کند.
  آزمون‌های capture مربوط به trajectory در context-engine اکنون ردیف‌های `trajectory_runtime_events`
  را از یک پایگاه دادهٔ agent ایزوله می‌خوانند به‌جای خواندن
  `session.trajectory.jsonl`.
  اسکریپت‌های seed برای کانال Docker MCP اکنون مستقیماً ردیف‌های SQLite را seed می‌کنند. نوشتن مستقیم
  `sessions.json` به fixtureهای doctor محدود است.
  E2E مربوط به Tool Search Gateway شواهد tool-call را از ردیف‌های transcript در SQLite می‌خواند
  به‌جای scan کردن فایل‌های `agents/<agentId>/sessions/*.jsonl`.
  رویدادهای host در memory-core و ردیف‌های scratch مربوط به session-corpus اکنون در shared
  SQLite plugin-state نگهداری می‌شوند؛ `events.jsonl` و `session-corpus/*.txt` فقط ورودی‌های migration legacy برای doctor هستند. ردیف‌های فعال از مسیرهای virtual
  `memory/session-ingestion/` استفاده می‌کنند، نه `.dreams/session-corpus`. ماژول قدیمی repair برای memory-core dreaming
  و آزمون‌های CLI/Gateway آن حذف شدند، چون runtime دیگر
  مالک repair مربوط به file archive برای آن corpus نیست. آزمون‌های bridge/public-artifact در memory-core
  دیگر `.dreams/events.jsonl` را سطح‌دهی نمی‌کنند؛ آن‌ها از نام artifact مجازی JSON مبتنی بر SQLite استفاده می‌کنند.
  مستندات آزمون Public SDK/Codex اکنون به‌جای session files از SQLite session state می‌گویند، و نمونهٔ channel-turn دیگر آرگومان `storePath` را expose نمی‌کند.
  وضعیت sync در Matrix اکنون مستقیماً از SQLite plugin-state store استفاده می‌کند. قراردادهای فعال
  client/runtime یک ریشهٔ account storage پاس می‌دهند، نه مسیر `bot-storage.json`، و doctor پیش از حذف منبع، `bot-storage.json` legacy را به SQLite import می‌کند. سناریوهای restart/destructive در QA Matrix اکنون مستقیماً ردیف sync در SQLite را mutate می‌کنند
  به‌جای ایجاد یا حذف فایل‌های جعلی `bot-storage.json`، و
  substrate مربوط به E2EE به‌جای مسیر جعلی
  `sync-store.json` یک ریشهٔ sync-store پاس می‌دهد.
  انتخاب storage-root در Matrix دیگر rootها را براساس فایل‌های legacy JSON مربوط به sync/thread امتیازدهی نمی‌کند؛ از فرادادهٔ durable root به‌علاوهٔ وضعیت واقعی crypto استفاده می‌کند.
  مجموعهٔ آزمون backend نشست runtime SQLite دیگر یک
  `sessions.json` نمی‌سازد؛ fixtureهای منبع legacy اکنون در آزمون‌های doctor
  قرار دارند که آن‌ها را import می‌کنند.
  آزمون‌های نشست Gateway دیگر helper به نام `createSessionStoreDir` یا
  setup مسیر temp session-store استفاده‌نشده را expose نمی‌کنند؛ دایرکتوری‌های fixture صریح هستند، و setup مستقیم
  row از نام‌گذاری session-row در SQLite استفاده می‌کند.
  پوشش parser برای session-store فقط doctor مربوط به JSON5 از آزمون‌های infra خارج و
  به آزمون‌های migration در doctor منتقل شد، بنابراین مجموعه‌های آزمون runtime دیگر مالک parsing legacy
  session-file نیستند.
  آزمون‌های runtime SSO/pending-upload در Microsoft Teams دیگر fixtureها یا parserهای sidecar
  JSON را حمل نمی‌کنند؛ parsing توکن SSO legacy فقط در ماژول migration
  Plugin قرار دارد. آزمون‌های Telegram دیگر مسیرهای store جعلی `/tmp/*.json` را seed نمی‌کنند؛
  آن‌ها cache پیام مبتنی بر SQLite را مستقیماً reset می‌کنند. helper عمومی
  OpenClaw test-state دیگر writer legacy برای `auth-profiles.json`
  را expose نمی‌کند؛ آزمون‌های doctor auth migration مالک محلی آن fixture هستند.
  آزمون‌های runtime برای اشاره‌گرهای last-session در TUI، exec approvals، toggleهای active-memory،
  dedupe/startup verification در Matrix، sync منبع Memory Wiki،
  bindings مربوط به current-conversation، onboarding auth، و importهای secret در Hermes دیگر
  فایل‌های sidecar قدیمی نمی‌سازند یا assert نمی‌کنند که نام فایل‌های قدیمی غایب‌اند. آن‌ها
  رفتار را از طریق ردیف‌های SQLite و APIهای store عمومی اثبات می‌کنند؛ آزمون‌های doctor/migration
  تنها جایی هستند که نام فایل‌های منبع legacy به آن تعلق دارد.
  آزمون‌های runtime برای pairing دستگاه/node، channel allowFrom، restart intents،
  restart handoff، ورودی‌های session delivery queue، config health، cacheهای iMessage،
  Cron jobs، headerهای transcript در PI، registryهای subagent، و پیوست‌های image مدیریت‌شده نیز دیگر فایل‌های JSON/JSONL بازنشسته‌شده ایجاد نمی‌کنند فقط برای اثبات
  اینکه نادیده گرفته شده‌اند یا غایب‌اند.
  بازیابی overflow در PI دیگر fallback برای rewrite/truncation در SessionManager ندارد: truncate کردن tool-result و rewriteهای transcript در context-engine ردیف‌های transcript در SQLite را mutate می‌کنند، سپس وضعیت active prompt را از پایگاه داده refresh می‌کنند.
  appendهای پیام پایدارشدهٔ SessionManager برای parent selection و idempotency به helper اتمیک append transcript در SQLite delegate می‌شوند. appendهای metadata/custom entry معمولی نیز parent فعلی را داخل SQLite انتخاب می‌کنند، بنابراین نمونه‌های stale manager دیگر raceهای parent-chain پیشا-SQLite را زنده نمی‌کنند.
  پاک‌سازی synthetic PI tail برای precheckهای میان-turn و `sessions_yield` اکنون
  مستقیماً وضعیت transcript در SQLite را trim می‌کند؛ bridge قدیمی tail-removal در SessionManager
  و آزمون‌های آن حذف شده‌اند.
  capture مربوط به checkpoint در Compaction نیز فقط از SQLite snapshot می‌گیرد؛ callerها دیگر
  یک SessionManager زنده را به‌عنوان منبع جایگزین transcript پاس نمی‌دهند.
- آزمون‌هایی را نگه دارید که فایل‌های legacy را فقط برای migration seed می‌کنند.
- اثبات مبتنی بر فایل JSON برای سطوح فعال runtime با اثبات row در SQL جایگزین شده است.

- banهای static برای writeهای runtime به مسیرهای legacy session/cache JSON اضافه کنید.
  برای guard مخزن انجام شد.

۱۰. گزارش migration را auditپذیر کنید.
    - اجرای migration را در SQLite با timestampهای شروع/پایان، مسیرهای منبع، hashهای منبع، countها، warningها، و مسیر پشتیبان ثبت کنید.
      انجام شد: اجرای migration برای legacy-state اکنون یک گزارش `migration_runs`
      را با inventory مسیر/جدول منبع، SHA-256 فایل منبع، اندازه‌ها،
      countهای record، warningها، و مسیر پشتیبان persist می‌کند.
      انجام شد: اجرای migration برای legacy-state همچنین ردیف‌های `migration_sources`
      را برای audit در سطح منبع و تصمیم‌های skip/backfill آینده persist می‌کند.
    - apply را idempotent کنید. اجرای دوباره پس از import جزئی باید یا
      منبع از قبل import‌شده را skip کند یا با key پایدار merge کند.
      انجام شد: indexهای نشست، transcriptها، delivery queueها، plugin state، task
      ledgerها، و ردیف‌های global SQLite متعلق به agent از طریق keyهای پایدار یا
      semantics مربوط به upsert/replace import می‌شوند، بنابراین اجرای دوباره بدون duplicate کردن ردیف‌های durable
      merge می‌کند.
    - importهای ناموفق باید فایل منبع اصلی را سر جای خود نگه دارند.
      انجام شد: importهای transcript ناموفق اکنون منبع JSONL اصلی را در مسیر کشف‌شدهٔ آن باقی می‌گذارند، و `migration_sources` منبع را به‌عنوان
      `warning` با `removed_source=0` برای اجرای بعدی doctor ثبت می‌کند.

## قواعد عملکرد

- یک connection برای هر thread/process خوب است؛ handleها را بین
  workerها share نکنید.
- از WAL، `foreign_keys=ON`، busy timeout به‌مدت ۳۰ ثانیه، و transactionهای write کوتاه `BEGIN IMMEDIATE`
  استفاده کنید.
- helperهای transaction برای write را synchronous نگه دارید مگر/تا زمانی که یک API transaction
  async semantics صریح mutex/backpressure اضافه کند.
- writeهای parent delivery را کوچک و transactional نگه دارید.
- از rewriteهای whole-store پرهیز کنید؛ از upsert/delete در سطح row استفاده کنید.
- پیش از جابه‌جایی کد hot، برای مسیرهای list-by-agent، list-by-session، updated-at، run id، و
  expiration index اضافه کنید.
- artifactهای بزرگ، media، و vectorها را به‌صورت BLOB یا ردیف‌های BLOB chunked ذخیره کنید، نه
  base64 یا JSON آرایهٔ عددی.
- entryهای opaque plugin-state را کوچک و scoped نگه دارید.
- به‌جای filesystem pruning، cleanup در SQL برای TTL/expiration اضافه کنید.
  برای storeهای runtime متعلق به پایگاه داده انجام شد: media، plugin state، plugin blobs،
  persistent dedupe، و agent cache همگی از طریق ردیف‌های SQLite expire می‌شوند. cleanup باقیماندهٔ filesystem به materializationهای موقت یا دستورهای حذف صریح محدود است.

## banهای Static

یک check مخزن اضافه کنید که writeهای جدید runtime به مسیرهای legacy state را fail کند:

- `sessions.json`
- `*.trajectory.jsonl` به‌جز خروجی‌های بستهٔ پشتیبانی ماده‌سازی‌شده
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- فایل‌های کش زمان اجرا `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- فایل‌های `credentials*.json` و `recovery-key.json` مربوط به Matrix
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- فایل Memory-core با مسیر `.dreams/events.jsonl`
- مسیر Memory-core با نام `.dreams/session-corpus/`
- فایل Memory-core با مسیر `.dreams/daily-ingestion.json`
- فایل Memory-core با مسیر `.dreams/session-ingestion.json`
- فایل Memory-core با مسیر `.dreams/short-term-recall.json`
- فایل Memory-core با مسیر `.dreams/phase-signals.json`
- فایل Memory-core با مسیر `.dreams/short-term-promotion.lock`
- فایل Skill Workshop با مسیر `skill-workshop/<workspace>.json`
- فایل Skill Workshop با مسیر `skill-workshop/skill-workshop-review-*.json`
- فایل Nostr با مسیر `bus-state-*.json`
- فایل Nostr با مسیر `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- فایل QQBot با مسیر `session-*.json`
- فایل BlueBubbles با مسیر `bluebubbles/catchup/*.json`
- فایل BlueBubbles با مسیر `bluebubbles/inbound-dedupe/*.json`
- فایل Telegram با مسیر `update-offset-*.json`
- فایل Telegram با مسیر `sticker-cache.json`
- فایل Telegram با مسیر `*.telegram-messages.json`
- فایل Telegram با مسیر `*.telegram-sent-messages.json`
- فایل Telegram با مسیر `*.telegram-topic-names.json`
- فایل Telegram با مسیر `thread-bindings-*.json`
- فایل iMessage با مسیر `catchup/*.json`
- فایل iMessage با مسیر `reply-cache.jsonl`
- فایل iMessage با مسیر `sent-echoes.jsonl`
- فایل Microsoft Teams با مسیر `msteams-conversations.json`
- فایل Microsoft Teams با مسیر `msteams-polls.json`
- فایل Microsoft Teams با مسیر `msteams-sso-tokens.json`
- فایل Microsoft Teams با مسیر `*.learnings.json`
- فایل Matrix با مسیر `bot-storage.json`
- فایل Matrix با مسیر `sync-store.json`
- فایل Matrix با مسیر `thread-bindings.json`
- فایل Matrix با مسیر `inbound-dedupe.json`
- فایل Matrix با مسیر `startup-verification.json`
- فایل Matrix با مسیر `storage-meta.json`
- فایل Matrix با مسیر `crypto-idb-snapshot.json`
- فایل Discord با مسیر `model-picker-preferences.json`
- فایل Discord با مسیر `command-deploy-cache.json`
- فایل‌های JSON بخش‌های registry محیط sandbox
- فایل‌های JSON پل `/tmp` مربوط به رلهٔ قلاب بومی
- `plugin-state/state.sqlite`
- فایل‌های جانبی زمان اجرای موردی `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- فایل Memory Wiki با مسیر `.openclaw-wiki/log.jsonl`
- فایل Memory Wiki با مسیر `.openclaw-wiki/state.json`
- مسیر Memory Wiki با نام `.openclaw-wiki/locks/`
- فایل Memory Wiki با مسیر `.openclaw-wiki/source-sync.json`
- فایل Memory Wiki با مسیر `.openclaw-wiki/import-runs/*.json`
- فایل Memory Wiki با مسیر `.openclaw-wiki/cache/agent-digest.json`
- فایل Memory Wiki با مسیر `.openclaw-wiki/cache/claims.jsonl`
- فایل ClawHub با مسیر `.clawhub/lock.json`
- فایل ClawHub با مسیر `.clawhub/origin.json`
- تزئین پروفایل مرورگر `.openclaw-profile-decorated`
- بازکننده‌های نشستِ مبتنی بر فایل `SessionManager.open(...)`
- facadeهای فهرست‌کردن transcript در `SessionManager.listAll(...)` و `TranscriptSessionManager.listAll(...)`
- facadeهای fork کردن transcript در `SessionManager.forkFromSession(...)` و
  `TranscriptSessionManager.forkFromSession(...)`
- facadeهای جایگزینی نشستِ تغییرپذیر در `SessionManager.newSession(...)` و `TranscriptSessionManager.newSession(...)`
- facadeهای نشست شاخه‌ای در `SessionManager.createBranchedSession(...)` و
  `TranscriptSessionManager.createBranchedSession(...)`

این ممنوعیت باید به آزمون‌ها اجازه دهد fixtureهای legacy بسازند و به کد migration اجازه دهد
منابع فایل legacy را بخواند/وارد کند/حذف کند. فایل‌های جانبی SQLite منتشرنشده همچنان ممنوع می‌مانند
و مجوزهای ورود doctor دریافت نمی‌کنند.

## معیارهای تکمیل

- نوشتن داده‌های زمان اجرا و کش در پایگاه دادهٔ SQLite سراسری یا عامل انجام می‌شود.
- زمان اجرا دیگر ایندکس‌های نشست، JSONLهای transcript، JSON مربوط به registry محیط sandbox، فایل‌های جانبی SQLite مربوط به task، یا فایل‌های جانبی SQLite مربوط به plugin-state را نمی‌نویسد. واردکننده‌های فایل جانبی SQLite منتشرنشدهٔ task
  و plugin-state حذف شده‌اند.
- ورود فایل legacy فقط مخصوص doctor است.
- پشتیبان‌گیری یک آرشیو با snapshotهای فشردهٔ SQLite و اثبات یکپارچگی تولید می‌کند.
- workerهای عامل می‌توانند با دیسک، فضای scratch ‏VFS، یا ذخیره‌سازی آزمایشی فقط VFS اجرا شوند.
- فایل‌های config و فایل‌های explicit credential تنها فایل‌های کنترل پایدارِ غیرپایگاه‌داده‌ای مورد انتظار باقی می‌مانند.
- بررسی‌های repo از معرفی دوبارهٔ file storeهای legacy زمان اجرا جلوگیری می‌کنند.
