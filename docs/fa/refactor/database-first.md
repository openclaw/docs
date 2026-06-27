---
read_when:
    - انتقال داده‌های زمان اجرا، حافظه پنهان، رونوشت‌ها، وضعیت کار، یا فایل‌های کاری موقت OpenClaw به SQLite
    - طراحی مهاجرت‌های doctor از فایل‌های JSON یا JSONL
    - تغییر رفتار پشتیبان‌گیری، بازیابی، VFS یا فضای ذخیره‌سازی worker
    - حذف قفل‌های نشست، هرس، کوتاه‌سازی، یا مسیرهای سازگاری JSON
summary: برنامهٔ مهاجرت برای تبدیل SQLite به لایهٔ اصلی وضعیت پایدار و حافظهٔ پنهان، در حالی که پیکربندی همچنان مبتنی بر فایل بماند
title: بازآرایی حالت با اولویت پایگاه داده
x-i18n:
    generated_at: "2026-06-27T18:46:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# بازآرایی وضعیت با اولویت پایگاه‌داده

## تصمیم

از یک چیدمان SQLite دو سطحی استفاده کنید:

- پایگاه‌داده سراسری: `~/.openclaw/state/openclaw.sqlite`
- پایگاه‌داده عامل: یک پایگاه‌داده SQLite برای هر عامل برای فضای کاری تحت مالکیت عامل،
  رونوشت، VFS، آرتیفکت، و وضعیت بزرگ زمان اجرای مختص هر عامل
- پیکربندی همچنان مبتنی بر فایل می‌ماند: `openclaw.json` خارج از
  پایگاه‌داده باقی می‌ماند. پروفایل‌های احراز هویت زمان اجرا به SQLite منتقل می‌شوند؛ فایل‌های اعتبارنامه
  ارائه‌دهنده خارجی یا CLI همچنان خارج از پایگاه‌داده OpenClaw و تحت مدیریت مالک باقی می‌مانند.

پایگاه‌داده سراسری، پایگاه‌داده سطح کنترل است. این پایگاه‌داده مالک کشف عامل،
وضعیت مشترک Gateway، جفت‌سازی، وضعیت دستگاه/گره، دفترهای وظیفه و جریان، وضعیت Plugin،
وضعیت زمان اجرای زمان‌بند، فراداده پشتیبان‌گیری، و وضعیت مهاجرت است.

پایگاه‌داده عامل، پایگاه‌داده سطح داده است. این پایگاه‌داده مالک فراداده نشست عامل،
جریان رویداد رونوشت، فضای کاری VFS یا فضای نام موقت، آرتیفکت‌های ابزار،
آرتیفکت‌های اجرا، و داده‌های کش محلی عامل که قابل جست‌وجو/نمایه‌سازی هستند، است.

این کار یک نمای سراسری پایدار فراهم می‌کند، بدون اینکه فضاهای کاری بزرگ عامل،
رونوشت‌ها، و داده‌های باینری موقت را به مسیر نوشتن مشترک Gateway تحمیل کند.

## قرارداد سخت

این مهاجرت یک شکل متعارف زمان اجرا دارد:

- ردیف‌های نشست فقط فراداده نشست را پایدار می‌کنند. آن‌ها نباید
  `transcriptLocator`، مسیرهای فایل رونوشت، مسیرهای JSONL هم‌سطح، مسیرهای قفل،
  فراداده هرس، یا اشاره‌گرهای سازگاری دوران فایل را پایدار کنند.
- هویت رونوشت همیشه هویت SQLite است: `{agentId, sessionId}` به‌علاوه
  فراداده اختیاری موضوع در جایی که پروتکل به آن نیاز دارد.
- `sqlite-transcript://...` هویت زمان اجرا یا پروتکل نیست. کد جدید نباید
  مکان‌یاب‌های رونوشت را استخراج، پایدار، پاس، تجزیه، یا مهاجرت دهد. زمان اجرا و
  آزمون‌ها اصلاً نباید شامل مکان‌یاب‌های شبهی باشند؛ مستندات می‌توانند این رشته را
  فقط برای ممنوع کردن آن ذکر کنند.
- `sessions.json` قدیمی، JSONL رونوشت، `.jsonl.lock`، هرس، کوتاه‌سازی،
  و منطق قدیمی مسیر نشست فقط به مسیر مهاجرت/درون‌ریزی doctor تعلق دارند.
- نام‌های مستعار پیکربندی نشست قدیمی فقط به مهاجرت doctor تعلق دارند. زمان اجرا
  `session.idleMinutes`، `session.resetByType.dm`، یا نام‌های مستعار نشست اصلی
  بین‌عاملی `agent:main:*` را برای عامل پیکربندی‌شده دیگر تفسیر نمی‌کند.
- هویت مسیریابی نشست، وضعیت رابطه‌ای تایپ‌شده است. مسیرهای داغ زمان اجرا و UI
  باید `sessions.session_scope`، `sessions.account_id`,
  `sessions.primary_conversation_id`، `conversations`، و
  `session_conversations` را بخوانند؛ آن‌ها نباید `session_key` را تجزیه کنند یا
  `session_entries.entry_json` را برای هویت ارائه‌دهنده استخراج کنند، مگر به‌عنوان سایه سازگاری
  در حالی که محل‌های فراخوانی قدیمی در حال حذف شدن هستند.
- نشانگرهای پیام مستقیم در سطح کانال مانند `dm` در برابر `direct` واژگان
  مسیریابی هستند، نه مکان‌یاب رونوشت یا دستگیره‌های سازگاری ذخیره‌گاه فایل.
- پیکربندی قدیمی گرداننده hook فقط به سطوح هشدار/مهاجرت doctor تعلق دارد.
  زمان اجرا نباید `hooks.internal.handlers` را بارگذاری کند؛ hookها فقط از طریق
  دایرکتوری‌های hook کشف‌شده و فراداده `HOOK.md` اجرا می‌شوند.
- راه‌اندازی زمان اجرا، مسیرهای پاسخ داغ، Compaction، بازنشانی، بازیابی، عیب‌یابی،
  TTS، hookهای حافظه، عامل‌های فرعی، مسیریابی فرمان Plugin، مرزهای پروتکل، و
  hookها باید `{agentId, sessionId}` را از طریق زمان اجرا پاس دهند.
- آزمون‌ها باید ردیف‌های رونوشت SQLite را از طریق `{agentId, sessionId}` مقداردهی و
  assert کنند. آزمون‌هایی که فقط ارسال مسیر JSONL،
  حفظ مکان‌یاب ارائه‌شده توسط فراخواننده، یا سازگاری فایل رونوشت را اثبات می‌کنند، باید
  حذف شوند مگر اینکه درون‌ریزی doctor، materialization پشتیبانی/اشکال‌زدایی غیرنشستی،
  یا شکل پروتکل را پوشش دهند.
- `runEmbeddedPiAgent(...)`، اجراهای worker آماده، و تلاش embedded داخلی
  نباید مکان‌یاب رونوشت بپذیرند. آن‌ها مدیر رونوشت SQLite را با
  `{agentId, sessionId}` باز می‌کنند و همان مدیر را به نشست عامل سازگار با PI داخلی‌شده
  پاس می‌دهند، تا فراخواننده‌های کهنه نتوانند runner را وادار به نوشتن رونوشت‌های
  JSON/JSONL کنند.
- عیب‌یابی runner باید رکوردهای ردیابی runtime/cache/payload را در SQLite ذخیره کند.
  عیب‌یابی زمان اجرا نباید گزینه‌های override فایل JSONL یا helperهای عمومی
  export رونوشت JSONL را افشا کند؛ exportهای کاربرمحور می‌توانند آرتیفکت‌های صریح را
  از ردیف‌های پایگاه‌داده materialize کنند، بدون اینکه نام فایل‌ها را دوباره وارد زمان اجرا کنند.
- ثبت خام stream از `OPENCLAW_RAW_STREAM=1` به‌علاوه ردیف‌های عیب‌یابی SQLite استفاده می‌کند.
  قرارداد قدیمی pi-mono یعنی logger فایل `PI_RAW_STREAM`، `PI_RAW_STREAM_PATH`، و
  `raw-openai-completions.jsonl` بخشی از زمان اجرا یا آزمون‌های OpenClaw نیست.
- نمایه‌سازی حافظه QMD نباید رونوشت‌های SQLite را به فایل‌های markdown صادر کند.
  QMD فقط فایل‌های حافظه پیکربندی‌شده را نمایه می‌کند؛ جست‌وجوی رونوشت نشست همچنان
  مبتنی بر SQLite می‌ماند.
- زیرمسیر QMD SDK برای کد جدید فقط مخصوص QMD است. helperهای نمایه‌سازی رونوشت نشست
  SQLite روی `memory-core-host-engine-session-transcripts` قرار دارند؛ هر
  re-export از QMD فقط سازگاری است و نباید توسط کد زمان اجرا استفاده شود.
- نمایه‌های حافظه داخلی در پایگاه‌داده عامل مالک زندگی می‌کنند. پیکربندی زمان اجرا و
  قراردادهای زمان اجرای resolveشده نباید `memorySearch.store.path` را افشا کنند؛ doctor
  آن کلید پیکربندی قدیمی را حذف می‌کند و کد فعلی `databasePath` عامل را به‌صورت داخلی پاس می‌دهد.

کار پیاده‌سازی باید به حذف کد ادامه دهد تا این گزاره‌ها بدون استثنا
خارج از مرزهای doctor/import/export/debug درست باشند.

## وضعیت هدف و پیشرفت

### هدف سخت

- یک پایگاه‌داده SQLite سراسری مالک وضعیت سطح کنترل است:
  `state/openclaw.sqlite`.
- یک پایگاه‌داده SQLite برای هر عامل مالک وضعیت سطح داده است:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- پیکربندی مبتنی بر فایل باقی می‌ماند. `openclaw.json` بخشی از این
  بازآرایی پایگاه‌داده نیست.
- فایل‌های قدیمی فقط ورودی‌های مهاجرت doctor هستند.
- زمان اجرا هرگز JSONL نشست یا رونوشت را به‌عنوان وضعیت فعال نمی‌نویسد یا نمی‌خواند.

### وضعیت‌های هدف

- `not-started`: کد زمان اجرای دوران فایل همچنان وضعیت فعال می‌نویسد.
- `migrating`: کد doctor/import می‌تواند داده فایل را به SQLite منتقل کند.
- `dual-read`: پل موقت هم SQLite و هم فایل‌های قدیمی را می‌خواند. این وضعیت
  برای این بازآرایی ممنوع است، مگر اینکه صراحتاً به‌عنوان
  فقط مخصوص doctor مستند شده باشد.
- `sqlite-runtime`: زمان اجرا فقط SQLite را می‌خواند و می‌نویسد.
- `clean`: APIها و آزمون‌های زمان اجرای قدیمی حذف شده‌اند، و guard از
  regression جلوگیری می‌کند.
- `done`: مستندات، آزمون‌ها، پشتیبان‌گیری، مهاجرت doctor، و بررسی‌های تغییرکرده
  وضعیت clean را اثبات می‌کنند.

### وضعیت فعلی

- نشست‌ها: برای زمان اجرا `clean`. ردیف‌های نشست در پایگاه‌داده هر عامل زندگی می‌کنند،
  APIهای زمان اجرا از `{agentId, sessionId}` یا `{agentId, sessionKey}` استفاده می‌کنند، و
  `sessions.json` ورودی قدیمی فقط مخصوص doctor است.
- رونوشت‌ها: برای زمان اجرا `clean`. رویدادهای رونوشت، هویت‌ها، snapshotها،
  و رویدادهای زمان اجرای trajectory در پایگاه‌داده هر عامل زندگی می‌کنند. زمان اجرا دیگر
  مکان‌یاب‌های رونوشت یا مسیرهای رونوشت JSONL را نمی‌پذیرد.
- runner توکار PI: `clean`. اجراهای PI توکار، workerهای آماده، Compaction،
  و حلقه‌های تلاش مجدد از دامنه نشست SQLite استفاده می‌کنند و دستگیره‌های رونوشت کهنه را رد می‌کنند.
- Cron: برای زمان اجرا `clean`. زمان اجرا از `cron_jobs` و `cron_run_logs` استفاده می‌کند؛
  آزمون‌های زمان اجرا از نام‌گذاری SQLite `storeKey` استفاده می‌کنند، و مسیرهای cron دوران فایل فقط در
  آزمون‌های مهاجرت قدیمی doctor باقی می‌مانند.
- رجیستری وظیفه: `clean`. ردیف‌های زمان اجرای وظیفه و Task Flow در
  `state/openclaw.sqlite` زندگی می‌کنند؛ importerهای SQLite sidecar منتشرنشده حذف شده‌اند.
- وضعیت Plugin: `clean`. ردیف‌های وضعیت/blob Plugin در پایگاه‌داده سراسری مشترک
  زندگی می‌کنند؛ helperهای قدیمی SQLite sidecar وضعیت Plugin در برابر استفاده محافظت شده‌اند.
- حافظه: برای حافظه داخلی و نمایه‌سازی رونوشت نشست `sqlite-runtime`.
  جدول‌های نمایه حافظه در پایگاه‌داده هر عامل زندگی می‌کنند، وضعیت حافظه Plugin از
  ردیف‌های مشترک وضعیت Plugin استفاده می‌کند، و فایل‌های حافظه قدیمی ورودی‌های مهاجرت doctor
  یا محتوای فضای کاری کاربر هستند.
- پشتیبان‌گیری: `sqlite-runtime`. مراحل پشتیبان‌گیری snapshotهای SQLite را فشرده می‌کند، sidecarهای
  زنده WAL/SHM را حذف می‌کند، یکپارچگی SQLite را تأیید می‌کند، و اجراهای پشتیبان‌گیری را در
  پایگاه‌داده سراسری ثبت می‌کند.
- مهاجرت doctor: عمداً `migrating`. Doctor JSON،
  JSONL، و ذخیره‌گاه‌های sidecar بازنشسته قدیمی را به SQLite درون‌ریزی می‌کند، اجراها/منابع مهاجرت را ثبت می‌کند،
  و منابع موفق را حذف می‌کند.
- اسکریپت‌های E2E: برای پوشش زمان اجرا `clean`. مقداردهی Docker MCP ردیف‌های SQLite
  می‌نویسد. اسکریپت Docker runtime-context فقط داخل seed مهاجرت doctor
  JSONL قدیمی ایجاد می‌کند و مسیر index نشست قدیمی را صریحاً نام‌گذاری می‌کند.

### کار باقی‌مانده

- [x] تغییر نام متغیرهای store آزمون زمان اجرای cron به دور از `storePath` مگر اینکه
      ورودی‌های قدیمی doctor باشند.
      فایل‌ها: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      اثبات: `pnpm check:database-first-legacy-stores`؛ `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] حذف یا تغییر نام mockهای آزمون export منسوخ دوران فایل.
      فایل: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      اثبات: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] seed قدیمی JSONL در Docker runtime-context را آشکارا فقط مخصوص doctor کنید.
      فایل: `scripts/e2e/session-runtime-context-docker-client.ts`.
      اثبات: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` فقط
      `seedBrokenLegacySessionForDoctorMigration` را نشان می‌دهد.
- [x] پس از هر تغییر schema، types تولیدشده Kysely را هم‌راستا نگه دارید.
      فایل‌ها: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      اثبات: در این گذر تغییر schema وجود ندارد؛ `pnpm db:kysely:check`؛
      `pnpm lint:kysely`.
- [x] آزمون‌های متمرکز را برای storeها، فرمان‌ها، و اسکریپت‌های لمس‌شده دوباره اجرا کنید.
      اثبات: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`؛ `git diff --check`.
- [x] پیش از اعلام `done`، gate تغییرکرده یا اثبات گسترده remote را اجرا کنید.
      اثبات: `pnpm check:changed --timed -- <changed extension paths>` روی
      اجرای Hetzner Crabbox با شناسه `run_3f1cabf6b25c` پس از راه‌اندازی موقت Node 24/pnpm و
      مسیریابی صریح path برای workspace همگام‌شده بدون `.git` با موفقیت گذشت.

### regression ندهید

- بدون مکان‌یاب رونوشت.
- بدون فایل نشست فعال.
- بدون fixture آزمون JSONL جعلی مگر آزمون‌های مهاجرت قدیمی doctor.
- بدون دسترسی خام SQLite در جایی که Kysely انتظار می‌رود.
- بدون migration جدید DB قدیمی. این چیدمان هنوز منتشر نشده است؛ نسخه schema را
  روی `1` نگه دارید مگر اینکه دلیل قوی وجود داشته باشد.

## فرضیات خواندن کد

هیچ تصمیم محصولی پیگیری‌شونده‌ای مانع این برنامه نیست. پیاده‌سازی باید
با این فرضیات ادامه یابد:

- برای این مسیر ذخیره‌سازی، مستقیماً از `node:sqlite` استفاده کنید و runtime مربوط به Node 22+ را الزامی کنید.
- دقیقاً یک فایل پیکربندی عادی نگه دارید. در این بازآرایی، پیکربندی، manifestهای plugin، یا workspaceهای Git را به SQLite منتقل نکنید.
- فایل‌های سازگاری runtime لازم نیستند. فایل‌های قدیمی JSON و JSONL فقط ورودی‌های مهاجرت هستند. sidecarهای SQLite محلیِ شاخه هرگز منتشر نشده‌اند و به‌جای import شدن حذف می‌شوند.
- `openclaw doctor --fix` مالک مرحله مهاجرت فایل قدیمی به پایگاه‌داده است.
  راه‌اندازی runtime و `openclaw migrate` نباید مسیرهای قدیمی ارتقای پایگاه‌داده OpenClaw را حمل کنند.
- سازگاری credential از همین قاعده پیروی می‌کند: credentialهای runtime در SQLite قرار دارند. فایل‌های قدیمی `auth-profiles.json`، فایل‌های per-agent `auth.json`، و فایل‌های مشترک `credentials/oauth.json` ورودی‌های مهاجرت doctor هستند و سپس پس از import حذف می‌شوند.
- وضعیت کاتالوگ مدل تولیدشده پشتوانه پایگاه‌داده دارد. کد runtime نباید `agents/<agentId>/agent/models.json` را بنویسد؛ فایل‌های موجود `models.json` ورودی‌های قدیمی doctor هستند و پس از import به `agent_model_catalogs` حذف می‌شوند.
- runtime نباید locatorهای transcript را migrate، normalize، یا bridge کند. هویت transcript فعال در SQLite برابر `{agentId, sessionId}` است. مسیرهای فایل فقط ورودی‌های قدیمی doctor هستند، و `sqlite-transcript://...` باید از سطح‌های runtime، protocol، hook، و plugin ناپدید شود، نه اینکه به‌عنوان handle مرزی در نظر گرفته شود.
- خواندن transcriptهای SQLite در runtime، migrationهای قدیمی شکل entry در JSONL را اجرا نمی‌کند و کل transcriptها را برای سازگاری بازنویسی نمی‌کند. normalize کردن entryهای قدیمی در ابزارهای صریح doctor/import باقی می‌ماند. doctor فایل‌های transcript قدیمی JSONL را پیش از درج ردیف‌های SQLite normalize می‌کند؛ ردیف‌های runtime فعلی از قبل در schema فعلی transcript نوشته شده‌اند. export trajectory/session آن ردیف‌ها را همان‌طور که هستند می‌خواند و نباید migrationهای قدیمی زمان export انجام دهد.
- helperهای parse/migration برای transcriptهای قدیمی JSONL فقط مخصوص doctor هستند. کد فرمت transcript در runtime فقط context فعلی transcript در SQLite را می‌سازد؛ doctor مالک ارتقای entryهای قدیمی JSONL پیش از درج ردیف‌ها است.
- helper قدیمی streaming transcript با مالکیت runtime برای JSONL حذف شد. کد import در doctor مالک خواندن صریح فایل‌های قدیمی است؛ خواندن تاریخچه session در runtime ردیف‌های SQLite را می‌خواند.
- bindingهای app-server مربوط به Codex از `sessionId` در OpenClaw به‌عنوان کلید canonical در namespace وضعیت plugin مربوط به Codex استفاده می‌کنند. `sessionKey` metadata برای routing/display است و نباید جایگزین شناسه پایدار session شود یا هویت مبتنی بر فایل transcript را دوباره زنده کند.
- موتورهای context قرارداد فعلی runtime را مستقیماً دریافت می‌کنند. registry نباید engineها را با shimهای retry که `sessionKey`، `transcriptScope`، یا `prompt` را حذف می‌کنند wrap کند؛ engineهایی که نمی‌توانند پارامترهای فعلی database-first را بپذیرند باید به‌جای bridge شدن، با خطای آشکار fail شوند.
- خروجی backup باید یک فایل archive باقی بماند. محتوای پایگاه‌داده باید به‌صورت snapshotهای فشرده SQLite وارد آن archive شود، نه sidecarهای WAL خام و زنده.
- جست‌وجوی transcript مفید است اما برای نخستین cut مبتنی بر database-first لازم نیست. schema را طوری طراحی کنید که FTS بعداً قابل افزودن باشد.
- اجرای worker باید تا زمانی که boundary پایگاه‌داده تثبیت می‌شود، پشت settings به‌صورت experimental باقی بماند.

## یافته‌های خواندن کد

شاخه فعلی از مرحله proof-of-concept عبور کرده است. پایگاه‌داده مشترک وجود دارد، `node:sqlite` مربوط به Node از طریق یک helper کوچک runtime متصل شده است، و storeهای قبلی اکنون در `state/openclaw.sqlite` یا پایگاه‌داده مالک `openclaw-agent.sqlite` می‌نویسند.

کار باقی‌مانده انتخاب SQLite نیست؛ تمیز نگه داشتن boundary جدید و حذف interfaceهای شبیه سازگاری است که هنوز شبیه دنیای قدیمی فایل‌ها هستند:

- `storePath` مربوط به session دیگر هویت runtime، شکل fixture تست، یا فیلد payload وضعیت نیست. تست‌های runtime و bridge دیگر نام قرارداد `storePath` را ندارند؛ کد doctor/migration مالک آن واژگان قدیمی است.
- نوشتن‌های session دیگر از queue قدیمی درون‌فرایندی `store-writer.ts` عبور نمی‌کنند. نوشتن patchهای SQLite به‌جای آن از تشخیص conflict و retry محدود استفاده می‌کند.
- کشف مسیرهای قدیمی هنوز کاربردهای معتبر مهاجرت دارد، اما کد runtime باید دیگر `sessions.json` و فایل‌های transcript از نوع JSONL را به‌عنوان targetهای نوشتن ممکن در نظر نگیرد.
- جدول‌های متعلق به agent در پایگاه‌داده‌های SQLite per-agent قرار دارند. DB سراسری ردیف‌های registry/control-plane را نگه می‌دارد؛ هویت transcript برابر `{agentId, sessionId}` در ردیف‌های transcript مربوط به per-agent است. کد runtime نباید مسیرهای فایل transcript را persist کند یا locatorهای transcript را migrate کند.
- doctor از قبل چندین فایل قدیمی را import می‌کند. cleanup این است که آن را به یک پیاده‌سازی migration صریح واحد تبدیل کنیم که doctor آن را فراخوانی کند، همراه با یک گزارش migration پایدار.

هیچ پرسش محصولی دیگری مانع پیاده‌سازی نیست.

## شکل فعلی کد

شاخه از قبل یک پایه واقعی SQLite مشترک دارد:

- کف اجرای زمان اجرا اکنون Node 22+ است: `package.json`، نگهبان زمان اجرای CLI،
  پیش‌فرض‌های نصب‌کننده، مکان‌یاب زمان اجرای macOS، CI، و مستندات نصب عمومی همگی
  هم‌نظرند. مسیر سازگاری قدیمی Node 22 حذف شده است.
- `src/state/openclaw-state-db.ts` فایل `openclaw.sqlite` را باز می‌کند، WAL،
  `synchronous=NORMAL`، `busy_timeout=30000`، `foreign_keys=ON` را تنظیم می‌کند و
  ماژول اسکیمای تولیدشده برگرفته از
  `src/state/openclaw-state-schema.sql` را اعمال می‌کند.
- نوع‌های جدول Kysely و ماژول‌های اسکیمای زمان اجرا از پایگاه‌های داده SQLite
  موقتی تولید می‌شوند که از فایل‌های `.sql` ثبت‌شده ساخته شده‌اند؛ کد زمان اجرا
  دیگر رشته‌های اسکیمای کپی‌پیست‌شده را برای پایگاه‌های داده سراسری، مخصوص هر
  عامل، یا ضبط پراکسی نگه نمی‌دارد.
- ذخیره‌گاه‌های زمان اجرا نوع‌های ردیف انتخاب‌شده و درج‌شده را از همان رابط‌های
  Kysely `DB` تولیدشده مشتق می‌کنند، به‌جای اینکه شکل ردیف‌های SQLite را دستی
  سایه‌سازی کنند. SQL خام همچنان به اعمال اسکیما، pragmaها، و DDL مخصوص مهاجرت
  محدود است.
- اسکیماهای SQLite به `user_version = 1` فروکاسته شده‌اند، چون این چیدمان
  پایگاه داده هنوز منتشر نشده است. بازکننده‌های زمان اجرا فقط اسکیمای فعلی را
  می‌سازند؛ واردسازی فایل به پایگاه داده همچنان در کد doctor می‌ماند، و
  کمک‌کننده‌های ارتقای پایگاه داده مخصوص شاخه حذف شده‌اند.
- مالکیت رابطه‌ای در جایی که مرز مالکیت canonical است اعمال می‌شود:
  ردیف‌های مهاجرت منبع از `migration_runs` cascade می‌شوند، وضعیت تحویل وظیفه
  از `task_runs` cascade می‌شود، و ردیف‌های هویت transcript از رویدادهای
  transcript cascade می‌شوند.
- جدول‌های مشترک فعلی شامل `agent_databases`،
  `auth_profile_stores`، `auth_profile_state`،
  `plugin_state_entries`، `plugin_blob_entries`، `media_blobs`,
  `skill_uploads`، `capture_sessions`، `capture_events`، `capture_blobs`,
  `sandbox_registry_entries`، `cron_run_logs`، `cron_jobs`، `commitments`,
  `delivery_queue_entries`، `model_capability_cache`,
  `workspace_setup_state`، `native_hook_relay_bridges`,
  `current_conversation_bindings`، `plugin_binding_approvals`,
  `tui_last_sessions`، `acp_sessions`، `acp_replay_sessions`,
  `acp_replay_events`، `task_runs`، `task_delivery_state`، `flow_runs`,
  `subagent_runs`، `migration_runs`، و `backup_runs` هستند.
- وضعیت دلخواهِ متعلق به افزونه جدول‌های تایپ‌شده متعلق به میزبان دریافت نمی‌کند.
  افزونه‌های نصب‌شده از `plugin_state_entries` برای payloadهای JSON نسخه‌دار و
  از `plugin_blob_entries` برای بایت‌ها استفاده می‌کنند، همراه با مالکیت
  namespace/key، پاک‌سازی TTL، پشتیبان‌گیری، و رکوردهای مهاجرت افزونه. وضعیت
  هماهنگ‌سازی افزونه که متعلق به میزبان است همچنان می‌تواند جدول‌های تایپ‌شده
  داشته باشد، وقتی میزبان مالک قرارداد query است، مانند
  `plugin_binding_approvals`.
- مهاجرت‌های افزونه، مهاجرت داده روی namespaceهای متعلق به افزونه هستند، نه
  مهاجرت اسکیمای میزبان. یک افزونه می‌تواند ورودی‌های state/blob نسخه‌دار خودش
  را از طریق ارائه‌دهنده مهاجرت منتقل کند، و میزبان وضعیت source/run را در
  دفتر کل عادی مهاجرت ثبت می‌کند. نصب افزونه‌های جدید نیازی به تغییر
  `openclaw-state-schema.sql` ندارد، مگر اینکه خود میزبان مالکیت یک قرارداد
  جدید میان‌افزونه‌ای را بر عهده بگیرد.
- `src/state/openclaw-agent-db.ts` فایل
  `agents/<agentId>/agent/openclaw-agent.sqlite` را باز می‌کند، پایگاه داده را در
  DB سراسری ثبت می‌کند، و مالک جدول‌های محلی عامل برای نشست، transcript، VFS،
  artifact، cache، و نمایه حافظه است. کشف مشترک زمان اجرا اکنون رجیستری
  `agent_databases` با تایپ تولیدشده را می‌خواند، به‌جای اینکه آن query را در
  هر call site دوباره پیاده‌سازی کند.
- پایگاه‌های داده سراسری و مخصوص هر عامل یک ردیف `schema_meta` با نقش پایگاه
  داده، نسخه اسکیما، timestampها، و شناسه عامل برای پایگاه‌های داده عامل ثبت
  می‌کنند. چیدمان همچنان در `user_version = 1` می‌ماند، چون این اسکیمای SQLite
  هنوز منتشر نشده است.
- هویت نشست مخصوص هر عامل اکنون یک جدول ریشه canonical به نام `sessions` دارد
  که با `session_id` کلیدگذاری شده و `session_key`، `session_scope`,
  `account_id`، `primary_conversation_id`، timestampها، فیلدهای نمایش، metadata
  مدل، شناسه harness، و پیوندهای parent/spawn را به‌صورت ستون‌های قابل query
  نگه می‌دارد. `session_routes` شاخص یکتای مسیر فعال از `session_key` به
  `session_id` فعلی است، پس یک کلید مسیر می‌تواند بدون اینکه خواندن‌های داغ را
  مجبور کند بین ردیف‌های تکراری `sessions.session_key` انتخاب کنند، به یک نشست
  بادوام تازه منتقل شود. payload قدیمی سازگارشکلِ
  `session_entries.entry_json` با کلید خارجی از ریشه بادوام `session_id` آویزان
  است؛ دیگر تنها نمایش سطح اسکیما از یک نشست نیست.
- هویت گفت‌وگوی خارجی مخصوص هر عامل نیز رابطه‌ای است:
  `conversations` هویت نرمال‌شده provider/account/conversation را ذخیره می‌کند،
  و `session_conversations` یک نشست OpenClaw را به یک یا چند گفت‌وگوی خارجی
  پیوند می‌دهد. این حالت نشست‌های DM مشترک-اصلی را پوشش می‌دهد که در آن چند peer
  می‌توانند عمدا به یک نشست map شوند، بدون اینکه در `session_key` دروغ گفته
  شود. SQLite همچنین یکتایی هویت طبیعی provider را اعمال می‌کند تا همان tuple
  channel/account/kind/peer/thread نتواند میان شناسه‌های گفت‌وگو fork شود.
  peerهای مستقیم مشترک-اصلی با نقش `participant` پیوند داده می‌شوند، پس یک نشست
  OpenClaw می‌تواند چند peer خارجی DM را نمایش دهد، بدون اینکه peerهای قدیمی‌تر
  را به ردیف‌های مبهم مرتبط تنزل دهد. `sessions.primary_conversation_id` همچنان
  به هدف تحویل تایپ‌شده فعلی اشاره می‌کند. ستون‌های بسته routing/status با
  constraintهای `CHECK` در SQLite اعمال می‌شوند، نه اینکه فقط به unionهای
  TypeScript تکیه کنند.
  projection نشست زمان اجرا shadowهای مسیر‌یابی سازگاری را از
  `session_entries.entry_json` پاک می‌کند پیش از آنکه ستون‌های تایپ‌شده
  session/conversation را اعمال کند، پس payloadهای JSON کهنه نمی‌توانند اهداف
  تحویل را دوباره زنده کنند.
  مسیر‌یابی announce برای subagent نیز context تحویل تایپ‌شده SQLite را لازم
  دارد؛ دیگر به فیلدهای مسیر سازگاری `SessionEntry` fallback نمی‌کند.
  وراثت تحویل صریح Gateway `chat.send` به‌جای فیلدهای سازگاری `origin`/`last*`
  context تحویل تایپ‌شده SQLite را می‌خواند.
  `tools.effective` نیز context provider/account/thread را از ردیف‌های تایپ‌شده
  تحویل/مسیر‌یابی SQLite مشتق می‌کند، نه از shadowهای کهنه `last*` در
  session-entry.
  context prompt رویداد سیستمی فیلدهای channel/to/account/thread را به‌جای
  shadowهای `origin` از فیلدهای تایپ‌شده تحویل بازسازی می‌کند.
  کمک‌کننده مشترک `deliveryContextFromSession` و mapper نشست به گفت‌وگو اکنون
  `SessionEntry.origin` را کاملا نادیده می‌گیرند؛ فقط فیلدهای تایپ‌شده تحویل و
  ردیف‌های رابطه‌ای گفت‌وگو می‌توانند هویت مسیر داغ بسازند.
  نرمال‌سازی ورودی نشست زمان اجرا، پیش از ماندگار کردن یا project کردن
  `entry_json`، `origin` را حذف می‌کند، و نوشتن metadata ورودی به‌جای ساختن
  shadowهای origin جدید، فیلدهای تایپ‌شده channel/chat به‌همراه ردیف‌های
  رابطه‌ای گفت‌وگو را می‌نویسد.
- رویدادهای transcript، snapshotهای transcript، و رویدادهای زمان اجرای trajectory
  اکنون به ریشه canonical مخصوص هر عامل `sessions` ارجاع می‌دهند و هنگام حذف
  نشست cascade می‌شوند. ردیف‌های هویت/idempotency transcript همچنان از همان
  ردیف دقیق رویداد transcript cascade می‌شوند.
- نمایه‌های memory-core اکنون از جدول‌های صریح پایگاه داده عامل
  `memory_index_meta`، `memory_index_sources`، `memory_index_chunks`، و
  `memory_embedding_cache` استفاده می‌کنند، و `memory_index_state` تغییرات
  revision را دنبال می‌کند. نمایه‌های جانبی اختیاری FTS/vector به‌جای جدول‌های
  عمومی `meta`، `files`، `chunks`، `chunks_fts`، یا `chunks_vec` با نام‌های
  `memory_index_chunks_fts` و `memory_index_chunks_vec` نام‌گذاری شده‌اند.
  نام‌های canonical شکل ردیف فعلی path/source و سازگاری embedding سریال‌شده را
  حفظ می‌کنند. این جدول‌ها cache مشتق‌شده/جست‌وجو هستند، نه ذخیره‌سازی canonical
  transcript؛ می‌توان آن‌ها را حذف کرد و از فایل‌های workspace حافظه و sourceهای
  پیکربندی‌شده دوباره ساخت.
  باز کردن یک نمایه حافظه منتشرشده با نام‌های عمومی، metadata، sourceها، chunkها،
  و cache embedding آن را به جدول‌های canonical منتقل می‌کند؛ جدول‌های مشتق‌شده
  FTS/vector زیر نام‌های canonical خود بازسازی می‌شوند.
- وضعیت بازیابی اجرای subagent اکنون در ردیف‌های تایپ‌شده مشترک
  `subagent_runs` زندگی می‌کند، همراه با کلیدهای نشست child، requester، و
  controller که index شده‌اند. فایل قدیمی `subagents/runs.json` فقط ورودی
  مهاجرت doctor است.
- bindingهای گفت‌وگوی فعلی اکنون در ردیف‌های تایپ‌شده مشترک
  `current_conversation_bindings` زندگی می‌کنند که با شناسه گفت‌وگوی نرمال‌شده
  کلیدگذاری شده‌اند، همراه با ستون‌های عامل/نشست هدف، نوع گفت‌وگو، وضعیت،
  انقضا، و metadata که به‌صورت ستون‌های رابطه‌ای ذخیره می‌شوند، نه یک رکورد
  binding مبهم و تکراری. کلید binding بادوام شامل نوع گفت‌وگوی نرمال‌شده است تا
  refهای direct/group/channel نتوانند برخورد کنند، و SQLite مقدارهای نامعتبر
  binding kind/status را رد می‌کند. فایل قدیمی
  `bindings/current-conversations.json` فقط ورودی مهاجرت doctor است.
- بازیابی صف تحویل اکنون ستون‌های تایپ‌شده صف برای channel، target، account،
  session، retry، error، platform-send، و recovery state را روی JSON بازپخش
  overlay می‌کند. `entry_json` payloadهای replay، hookها، و payload قالب‌بندی را
  نگه می‌دارد، اما ستون‌های تایپ‌شده برای routing/state داغ صف مرجع معتبرند.
- اشاره‌گرهای بازیابی آخرین نشست TUI اکنون در ردیف‌های تایپ‌شده مشترک
  `tui_last_sessions` زندگی می‌کنند که با scope هش‌شده اتصال/نشست TUI
  کلیدگذاری شده‌اند. فایل JSON قدیمی TUI فقط ورودی مهاجرت doctor است.
- تنظیمات پیش‌فرض TTS اکنون در ردیف‌های SQLite مشترک plugin-state زندگی می‌کنند
  که زیر افزونه `speech-core` کلیدگذاری شده‌اند. فایل قدیمی `settings/tts.json`
  فقط ورودی مهاجرت doctor است؛ زمان اجرا دیگر فایل‌های JSON تنظیمات TTS را
  نمی‌خواند یا نمی‌نویسد، و resolver مسیر legacy در ماژول مهاجرت doctor زندگی
  می‌کند.
- metadata هدف secret اکنون درباره storeها صحبت می‌کند، نه اینکه وانمود کند هر
  هدف credential یک فایل config است. `openclaw.json` همچنان store پیکربندی
  می‌ماند؛ هدف‌های auth-profile از ردیف‌های تایپ‌شده SQLite
  `auth_profile_stores` استفاده می‌کنند، با credentialهای provider-shaped که
  به‌صورت payloadهای JSON نگه داشته شده‌اند.
- audit مربوط به secret دیگر فایل‌های بازنشسته `auth.json` مخصوص هر عامل را
  scan نمی‌کند. doctor مالک هشدار دادن درباره آن فایل legacy، وارد کردن آن، و
  حذف کردن آن است.
- کمک‌کننده‌های legacy مسیر auth profile اکنون در کد legacy doctor زندگی
  می‌کنند. کمک‌کننده‌های مسیر auth profile در core، هویت و مکان‌های نمایشی
  auth-store در SQLite را expose می‌کنند، نه مسیرهای زمان اجرای
  `auth-profiles.json` یا `auth-state.json`.
- ماژول‌های زمان اجرای بازیابی اجرای subagent و cache قابلیت مدل OpenRouter
  اکنون خواننده‌ها/نویسنده‌های snapshot SQLite را از کمک‌کننده‌های واردسازی JSON
  legacy مخصوص doctor جدا نگه می‌دارند. قابلیت‌های OpenRouter از ردیف‌های
  generic تایپ‌شده `model_capability_cache` زیر `provider_id = "openrouter"`
  استفاده می‌کنند، به‌جای یک cache blob مبهم یا جدول میزبان مخصوص provider.
  مقدار `taskName` اجرای subagent در ستون تایپ‌شده `subagent_runs.task_name`
  ذخیره می‌شود؛ کپی `payload_json` داده بازپخش/اشکال‌زدایی است، نه منبع فیلدهای
  نمایش یا lookup داغ.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` یک VFS مبتنی بر SQLite را
  روی جدول `vfs_entries` پایگاه داده عامل پیاده‌سازی می‌کند. خواندن دایرکتوری،
  exportهای بازگشتی، حذف‌ها، و تغییرنام‌ها از rangeهای prefix ایندکس‌شده
  `(namespace, path)` استفاده می‌کنند، به‌جای scan کردن یک namespace کامل یا
  تکیه بر matching مسیر با `LIKE`.
- `src/agents/runtime-worker.entry.ts` برای workerها، برای هر run، VFS مبتنی بر
  SQLite، storeهای artifact ابزار، artifact run، و cache scoped ایجاد می‌کند.
- markerهای تکمیل bootstrap مربوط به workspace اکنون در ردیف‌های تایپ‌شده مشترک
  `workspace_setup_state` زندگی می‌کنند که با مسیر workspace resolve‌شده
  کلیدگذاری شده‌اند، به‌جای `.openclaw/workspace-state.json`؛ زمان اجرا دیگر
  marker قدیمی workspace را نمی‌خواند یا بازنویسی نمی‌کند، و APIهای کمکی دیگر یک
  مسیر ساختگی `.openclaw/setup-state` را فقط برای مشتق کردن هویت ذخیره‌سازی دست
  به دست نمی‌کنند.
- approvalهای Exec اکنون در ردیف singleton تایپ‌شده مشترک SQLite
  `exec_approvals_config` زندگی می‌کنند. doctor فایل legacy
  `~/.openclaw/exec-approvals.json` را وارد می‌کند؛ نوشتن‌های زمان اجرا دیگر آن
  فایل را به‌عنوان مکان store فعال خود ایجاد، بازنویسی، یا گزارش نمی‌کنند.
  companion macOS همان ردیف جدول `state/openclaw.sqlite` را می‌خواند و می‌نویسد؛
  فقط Unix prompt socket را روی دیسک نگه می‌دارد، چون آن IPC است، نه وضعیت
  بادوام زمان اجرا.
- ماژول‌های زمان اجرای هویت دستگاه، احراز هویت دستگاه، و bootstrap اکنون
  خواننده‌ها/نویسنده‌های snapshot SQLite را از کمک‌کننده‌های واردسازی JSON
  legacy مخصوص doctor جدا نگه می‌دارند. هویت دستگاه از ردیف‌های تایپ‌شده
  `device_identities` استفاده می‌کند و tokenهای احراز هویت دستگاه از ردیف‌های
  تایپ‌شده `device_auth_tokens` استفاده می‌کنند. نوشتن‌های احراز هویت دستگاه
  ردیف‌ها را بر اساس device/role تطبیق می‌دهند، به‌جای اینکه جدول token را
  truncate کنند، و زمان اجرا دیگر updateهای تک‌token را از مسیر adapter قدیمی
  whole-store عبور نمی‌دهد. legacy
  payloadهای JSON نسخه-۱ فقط به‌عنوان شکل‌های import/export مربوط به doctor وجود دارند.
- کش تبادل توکن GitHub Copilot از جدول مشترک وضعیت Plugin در SQLite
  زیر `github-copilot/token-cache/default` استفاده می‌کند. این وضعیت کش متعلق به provider است،
  بنابراین عمداً جدول schema میزبان اضافه نمی‌کند.
- Compaction در GitHub Copilot دیگر sidecarهای فضای‌کاری `openclaw-compaction-*.json`
  را نمی‌نویسد. harness برای نشست SDK ردیابی‌شده، RPC مربوط به Compaction تاریخچه SDK را فراخوانی می‌کند،
  و OpenClaw وضعیت پایدار نشست/رونوشت را به‌جای فایل‌های نشانگر سازگاری در
  SQLite نگه می‌دارد.
- runtime مشترک Swift (`OpenClawKit`) از همان ردیف‌های
  `state/openclaw.sqlite` برای هویت دستگاه و احراز هویت دستگاه استفاده می‌کند. helperهای برنامه macOS
  به‌جای داشتن مسیر دوم JSON یا
  SQLite، helperهای مشترک SQLite را import می‌کنند. فایل legacy باقی‌مانده `identity/device.json` ایجاد هویت را
  تا زمانی که doctor آن را به SQLite import کند مسدود می‌کند، مطابق با gate راه‌اندازی TypeScript و Android.
- هویت دستگاه Android از همان مواد کلیدی سازگار با TypeScript استفاده می‌کند
  که در ردیف‌های تایپ‌شده `state/openclaw.sqlite#table/device_identities` ذخیره شده‌اند. هرگز
  `openclaw/identity/device.json` را نمی‌خواند یا نمی‌نویسد؛ فایل legacy باقی‌مانده راه‌اندازی را تا زمانی که doctor آن را به SQLite import کند مسدود می‌کند.
- توکن‌های کش‌شده احراز هویت دستگاه Android نیز از ردیف‌های تایپ‌شده
  `state/openclaw.sqlite#table/device_auth_tokens` استفاده می‌کنند و همان معنای توکن نسخه-۱ را
  با TypeScript و Swift به اشتراک می‌گذارند. runtime دیگر کلیدهای سازگاری `SecurePrefs`
  `gateway.deviceToken*` را نمی‌خواند؛ این‌ها فقط متعلق به منطق migration/doctor هستند.
- تاریخچه بسته‌های اخیر اعلان Android از ردیف‌های تایپ‌شده
  `android_notification_recent_packages` استفاده می‌کند. runtime دیگر کلیدهای CSV قدیمی SharedPreferences را migrate یا
  read نمی‌کند.
- ایجاد هویت دستگاه وقتی فایل legacy `identity/device.json`
  وجود داشته باشد، وقتی ردیف هویت SQLite نامعتبر باشد، یا وقتی store هویت SQLite
  باز نشود، fail-closed می‌شود. doctor ابتدا آن فایل را import و حذف می‌کند، بنابراین راه‌اندازی runtime
  نمی‌تواند پیش از migration بی‌صدا هویت pairing را rotate کند.
- انتخاب هویت دستگاه کلید ردیف SQLite است، نه مکان‌یاب فایل JSON. تست‌ها
  و helperهای Gateway کلیدهای هویت صریح را پاس می‌دهند؛ فقط migration مربوط به doctor و
  gate راه‌اندازی fail-closed نام فایل بازنشسته `identity/device.json` را می‌شناسند.
- سازگاری reset نشست اکنون در migration پیکربندی doctor زندگی می‌کند:
  `session.idleMinutes` به `session.reset.idleMinutes` منتقل می‌شود،
  `session.resetByType.dm` به `session.resetByType.direct` منتقل می‌شود، و
  policy reset در runtime فقط کلیدهای reset canonical را می‌خواند.
- سازگاری پیکربندی legacy اکنون زیر `src/commands/doctor/` قرار دارد. اعتبارسنجی عادی
  `readConfigFileSnapshot()` آشکارسازهای legacy مربوط به doctor را import نمی‌کند
  یا issueهای legacy را annotate نمی‌کند؛ `runDoctorConfigPreflight()` این issueها را برای
  repair/reporting در doctor اضافه می‌کند. جریان پیکربندی doctor
  `src/commands/doctor/legacy-config.ts` را import می‌کند، و repair شناسه پروفایل OAuth قدیمی
  زیر
  `src/commands/doctor/legacy/oauth-profile-ids.ts` قرار دارد.
- دستورهای غیر doctor به‌طور خودکار repair پیکربندی legacy را اجرا نمی‌کنند. برای مثال،
  `openclaw update --channel` اکنون روی پیکربندی legacy نامعتبر شکست می‌خورد و از
  کاربر می‌خواهد doctor را اجرا کند، به‌جای اینکه کد migration مربوط به doctor را بی‌صدا import کند.
- Web push، APNs، Voice Wake، بررسی‌های update، و سلامت پیکربندی اکنون از جدول‌های تایپ‌شده مشترک SQLite
  برای subscriptionها، کلیدهای VAPID، ثبت‌های node، ردیف‌های trigger،
  ردیف‌های routing، وضعیت update-notification، و entryهای سلامت پیکربندی استفاده می‌کنند به‌جای
  blobهای JSON کاملاً opaque. نوشتن snapshotهای Web push و APNs اکنون
  subscriptionها/registrationها را بر اساس primary key reconcile می‌کند به‌جای پاک‌کردن جدول‌هایشان؛
  سلامت پیکربندی نیز همین کار را بر اساس مسیر پیکربندی انجام می‌دهد.
  ماژول‌های runtime آن‌ها reader/writerهای snapshot در SQLite را از
  helperهای import JSON legacy که فقط مخصوص doctor هستند جدا نگه می‌دارند.
- پیکربندی میزبان Node اکنون از یک ردیف singleton تایپ‌شده در پایگاه‌داده مشترک SQLite استفاده می‌کند؛
  doctor فایل قدیمی `node.json` را پیش از استفاده عادی runtime import می‌کند.
- pairing دستگاه/node، pairing کانال، allowlistهای کانال، و وضعیت bootstrap
  اکنون به‌جای blobهای JSON کاملاً opaque از ردیف‌های تایپ‌شده SQLite استفاده می‌کنند. approvalهای binding مربوط به Plugin
  و وضعیت jobهای cron نیز همین تفکیک را دنبال می‌کنند: ماژول‌های runtime عملیات
  backed by SQLite و helperهای snapshot خنثی را expose می‌کنند، و نوشتن snapshotهای pairing/bootstrap
  به‌همراه approvalهای binding مربوط به Plugin ردیف‌ها را بر اساس primary key
  reconcile می‌کند به‌جای truncating جدول‌ها، در حالی که doctor فایل‌های JSON قدیمی را از طریق
  ماژول‌های `src/commands/doctor/legacy/*` import/remove می‌کند.
- رکوردهای Plugin نصب‌شده اکنون در index نصب‌شده-Plugin در SQLite زندگی می‌کنند.
  خواندن/نوشتن پیکربندی runtime دیگر داده‌های authored-config قدیمی
  `plugins.installs` را migrate یا preserve نمی‌کند؛ doctor آن شکل پیکربندی legacy را پیش از
  استفاده عادی runtime به SQLite import می‌کند.
- snapshotهای بازیابی credential برای QQBot اکنون در وضعیت Plugin در SQLite زیر
  `qqbot/credential-backups` زندگی می‌کنند. runtime دیگر
  `qqbot/data/credential-backup*.json` را نمی‌نویسد؛ doctor این
  فایل‌های backup legacy را همراه با ورودی‌های وضعیت دیگر QQBot import و remove می‌کند.
- برنامه‌ریزی reload در Gateway snapshotهای index نصب‌شده-Plugin در SQLite را زیر
  namespace داخلی diff با نام `installedPluginIndex.installRecords.*` مقایسه می‌کند. تصمیم‌های
  reload در runtime دیگر آن ردیف‌ها را در objectهای پیکربندی جعلی `plugins.installs`
  wrap نمی‌کنند.
- upgrade credential مربوط به حساب نام‌گذاری‌شده Matrix دیگر هنگام خواندن‌های runtime
  انجام نمی‌شود. doctor مالک rename فایل قدیمی سطح‌بالای `credentials/matrix/credentials.json`
  است، وقتی یک حساب single/default در Matrix قابل resolve باشد.
- ماژول‌های runtime مربوط به pairing هسته و cron دیگر builderهای مسیر JSON legacy را
  export نمی‌کنند. ماژول‌های legacy متعلق به doctor مسیرهای source مربوط به `pending.json`، `paired.json`،
  `bootstrap.json`، و `cron/jobs.json` را فقط برای تست‌های import و
  migration می‌سازند. normalizing شکل job legacy در cron و import کردن run-log در cron
  زیر `src/commands/doctor/legacy/cron*.ts` زندگی می‌کند.
- `src/commands/doctor/legacy/runtime-state.ts` فایل‌های وضعیت JSON legacy،
  شامل پیکربندی میزبان node، را از doctor به SQLite import می‌کند. importerهای فایل legacy جدید
  زیر `src/commands/doctor/legacy/` می‌مانند.
- `src/commands/doctor/state-migrations.ts` فایل‌های legacy `sessions.json` و
  رونوشت‌های `*.jsonl` را مستقیماً به SQLite import می‌کند و sourceهای موفق را حذف می‌کند. دیگر
  رونوشت‌های legacy ریشه را از طریق
  `agents/<agentId>/sessions/*.jsonl` stage نمی‌کند یا پیش از
  import یک target canonical در JSONL نمی‌سازد.
- بررسی‌های doctor برای یکپارچگی وضعیت دیگر directoryهای نشست legacy را scan نمی‌کنند یا
  حذف JSONL orphan را پیشنهاد نمی‌دهند. فایل‌های رونوشت legacy فقط ورودی‌های migration هستند،
  و مرحله migration مالک import به‌همراه حذف source است.
- import رجیستری sandbox legacy زیر
  `src/commands/doctor/legacy/sandbox-registry.ts` زندگی می‌کند؛ خواندن‌ها و نوشتن‌های رجیستری sandbox فعال
  همچنان فقط SQLite هستند.
- repair مربوط به سلامت/import رونوشت نشست legacy زیر
  `src/commands/doctor/legacy/session-transcript-health.ts` زندگی می‌کند؛ ماژول‌های دستور runtime
  دیگر parsing رونوشت JSONL یا کد repair برای active-branch را حمل نمی‌کنند.

نکات برجسته تکمیل ادغام/حذف:

- وضعیت Plugin اکنون از پایگاه‌داده مشترک `state/openclaw.sqlite` استفاده می‌کند. واردکننده جانبی قدیمی
  شاخه‌محلی `plugin-state/state.sqlite` حذف شده است، چون
  آن چیدمان SQLite هرگز عرضه نشده بود. کمک‌کننده‌های probe/test به‌جای افشای مسیر SQLite مخصوص وضعیت Plugin،
  `databasePath` مشترک را گزارش می‌کنند.
- جدول‌های runtime مربوط به Task و Task Flow اکنون در پایگاه‌داده مشترک
  `state/openclaw.sqlite` قرار دارند، نه در `tasks/runs.sqlite` و
  `tasks/flows/registry.sqlite`؛ واردکننده‌های جانبی قدیمی نیز به همان دلیلِ
  چیدمان عرضه‌نشده حذف شده‌اند.
- `src/config/sessions/store.ts` دیگر برای فراداده ورودی،
  به‌روزرسانی مسیرها، یا خواندن updated-at به `storePath` نیاز ندارد. ماندگاری فرمان، پاک‌سازی نشست CLI،
  عمق subagent، بازنویسی‌های احراز هویت، و هویت نشست transcript
  از APIهای ردیف agent/session استفاده می‌کنند. نوشتن‌ها به‌صورت وصله‌های ردیف SQLite
  با تلاش دوباره در تعارض خوش‌بینانه اعمال می‌شوند.
- حل هدف نشست اکنون هدف‌های پایگاه‌داده به‌ازای هر عامل را ارائه می‌کند، نه مسیرهای قدیمی
  `sessions.json`. Gateway مشترک، فراداده ACP، ترمیم مسیر doctor، و
  `openclaw sessions`، `agent_databases` را به‌همراه عامل‌های پیکربندی‌شده فهرست می‌کنند.
- مسیریابی نشست Gateway اکنون از `resolveGatewaySessionDatabaseTarget` استفاده می‌کند؛
  هدف بازگردانده‌شده به‌جای مسیر فایل قدیمی session-store، شامل `databasePath` و کلیدهای ردیف SQLite نامزد است.
- نوع‌های runtime نشست کانال اکنون برای
  خواندن‌های updated-at، فراداده ورودی، و به‌روزرسانی‌های آخرین مسیر، `{agentId, sessionKey}` را ارائه می‌کنند. نوع سازگاری قدیمی
  `saveSessionStore(storePath, store)` حذف شده است.
- runtime مربوط به Plugin، API افزونه، و سطح‌های barrel مربوط به `config/sessions` اکنون
  کد Plugin را به کمک‌کننده‌های ردیف نشست مبتنی بر SQLite هدایت می‌کنند. خروجی‌های سازگاری کتابخانه ریشه
  (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) به‌عنوان
  shimهای منسوخ برای مصرف‌کنندگان موجود باقی مانده‌اند. کمک‌کننده قدیمی
  `resolveLegacySessionStorePath` حذف شده است؛ ساخت مسیر قدیمی `sessions.json`
  اکنون به migration و fixtureهای تست محدود است.
- `src/config/sessions/session-entries.sqlite.ts` اکنون ورودی‌های canonical نشست را
  در پایگاه‌داده به‌ازای هر عامل ذخیره می‌کند و از وصله خواندن/upsert/delete در سطح ردیف
  پشتیبانی دارد. runtime upsert/patch/delete دیگر به‌دنبال گونه‌های حروفی نمی‌گردد یا
  کلیدهای alias قدیمی را هرس نمی‌کند؛ doctor مالک canonicalization است. کمک‌کننده
  مستقل وارد کردن JSON حذف شده است، و migration، به‌جای جایگزینی کل جدول نشست،
  ردیف‌های جدیدتر را merge upsert می‌کند. کمک‌کننده‌های عمومی read/list/load
  فراداده نشست داغ را از ردیف‌های تایپ‌شده `sessions` و `conversations` تصویر می‌کنند؛
  `entry_json` یک سایه سازگاری/debug است و می‌تواند کهنه یا نامعتبر باشد
  بدون اینکه هویت نشست تایپ‌شده یا context تحویل از دست برود.
- `src/config/sessions/delivery-info.ts` اکنون context تحویل را از
  ردیف‌های تایپ‌شده به‌ازای هر عامل `sessions` + `conversations` + `session_conversations` حل می‌کند.
  این دیگر هویت تحویل runtime را از
  `session_entries.entry_json` بازسازی نمی‌کند؛ نبودن ردیف مکالمه تایپ‌شده یک مشکل
  migration/repair در doctor است، نه fallback در runtime.
- تصمیم‌های بازنشانی نشست ذخیره‌شده اکنون فراداده تایپ‌شده `sessions.session_scope`,
  `sessions.chat_type`, و `sessions.channel` را ترجیح می‌دهند. تجزیه `sessionKey`
  فقط برای پسوندهای صریح thread/topic روی هدف‌های فرمان باقی می‌ماند؛ طبقه‌بندی بازنشانی گروهی در برابر مستقیم
  دیگر از شکل کلید نمی‌آید.
- طبقه‌بندی نمایش فهرست/وضعیت نشست اکنون از فراداده تایپ‌شده chat و
  گونه نشست Gateway استفاده می‌کند. این دیگر زیررشته‌های `:group:` یا `:channel:`
  داخل `session_key` را حقیقت پایدار گروه/مستقیم تلقی نمی‌کند.
- انتخاب سیاست silent-reply اکنون فقط از نوع صریح مکالمه یا فراداده surface استفاده می‌کند.
  این دیگر سیاست مستقیم/گروهی را از زیررشته‌های
  `session_key` حدس نمی‌زند.
- حل مدل نمایش نشست اکنون شناسه عامل را از هدف پایگاه‌داده نشست SQLite
  دریافت می‌کند، به‌جای اینکه آن را از `session_key` جدا کند.
- hydrate کردن هدف اعلام agent-to-agent اکنون فقط از `deliveryContext` تایپ‌شده
  `sessions.list` استفاده می‌کند. این دیگر مسیریابی channel/account/thread را
  از `origin` قدیمی، فیلدهای آینه‌ای `last*`، یا شکل `session_key` بازیابی نمی‌کند.
- رد هدف thread در `sessions_send` اکنون فراداده مسیریابی تایپ‌شده SQLite را می‌خواند.
  این دیگر هدف‌ها را با تجزیه پسوندهای thread از کلید هدف رد یا قبول نمی‌کند.
- اعتبارسنجی سیاست ابزار در scope گروه اکنون مسیریابی مکالمه تایپ‌شده SQLite را
  برای نشست فعلی یا spawn‌شده می‌خواند. این دیگر با decode کردن `sessionKey` به
  هویت گروه/کانال اعتماد نمی‌کند؛ شناسه‌های گروهی ارائه‌شده توسط caller وقتی هیچ ردیف نشست تایپ‌شده‌ای
  آن‌ها را تأیید نکند، حذف می‌شوند.
- تطبیق بازنویسی مدل کانال اکنون از فراداده صریح گروه و مکالمه والد استفاده می‌کند.
  این دیگر شناسه‌های مکالمه والد را از
  `parentSessionKey` decode نمی‌کند.
- ارث‌بری بازنویسی مدل ذخیره‌شده اکنون به یک کلید نشست والد صریح
  از context نشست تایپ‌شده نیاز دارد. این دیگر بازنویسی‌های والد را از
  پسوندهای `:thread:` یا `:topic:` در `sessionKey` استخراج نمی‌کند.
- wrapper قدیمی اطلاعات thread نشست و parser thread مربوط به loaded-plugin حذف شده‌اند؛
  هیچ کد runtimeی `config/sessions/thread-info` را import نمی‌کند.
- کمک‌کننده مکالمه کانال دیگر bridgeهای تجزیه full-session-key را ارائه نمی‌کند.
  core همچنان شناسه‌های خام مکالمه متعلق به provider را از طریق
  `resolveSessionConversation(...)` normalize می‌کند، اما واقعیت‌های مسیر را
  از `sessionKey` بازسازی نمی‌کند.
- تحویل completion، سیاست ارسال، و نگهداری وظیفه دیگر نوع chat را از شکل
  `session_key` استخراج نمی‌کنند. parser قدیمی کلید chat-type حذف شده است؛
  این مسیرها به فراداده نشست تایپ‌شده، context تحویل تایپ‌شده، یا
  واژگان صریح هدف تحویل نیاز دارند.
- فهرست/وضعیت نشست، diagnostics، binding حساب approval، فیلتر Heartbeat در TUI،
  و خلاصه‌های usage دیگر `SessionEntry.origin` را برای
  مسیریابی provider/account/thread/display استخراج نمی‌کنند. تنها خواندن‌های runtime باقی‌مانده از
  `origin` مربوط به مفاهیم غیرنشست یا objectهای تحویل نوبت فعلی هستند.
- lookup مکالمه native برای approval-request اکنون ردیف‌های مسیریابی نشست تایپ‌شده به‌ازای هر عامل را می‌خواند.
  این دیگر هویت مکالمه channel/group/thread را از `sessionKey` تجزیه نمی‌کند؛
  نبود فراداده تایپ‌شده یک مسئله migration/repair است.
- payloadهای event مربوط به changed/chat/session در نشست Gateway دیگر
  `SessionEntry.origin` یا سایه‌های مسیر `last*` را echo نمی‌کنند؛ clientها
  `channel`، `chatType`، و `deliveryContext` تایپ‌شده دریافت می‌کنند.
- حل تحویل Heartbeat اکنون می‌تواند `deliveryContext` تایپ‌شده SQLite را
  مستقیما دریافت کند، و runtime مربوط به Heartbeat به‌جای تکیه بر سایه‌های سازگاری
  `session_entries` برای مسیریابی فعلی، ردیف تحویل نشست به‌ازای هر عامل را عبور می‌دهد.
- حل هدف تحویل عامل ایزوله Cron نیز پیش از fallback به payload ورودی سازگاری،
  مسیر فعلی خود را از ردیف تحویل نشست تایپ‌شده به‌ازای هر عامل hydrate می‌کند.
- حل origin اعلام subagent اکنون context تحویل نشست requester تایپ‌شده را
  از طریق `loadRequesterSessionEntry` عبور می‌دهد و آن ردیف را بر سایه‌های سازگاری
  `last*`/`deliveryContext` ترجیح می‌دهد.
- به‌روزرسانی‌های فراداده نشست ورودی اکنون ابتدا با ردیف تحویل تایپ‌شده به‌ازای هر عامل
  merge می‌شوند؛ فیلدهای تحویل قدیمی `SessionEntry` فقط وقتی fallback هستند
  که هیچ ردیف مکالمه تایپ‌شده‌ای وجود نداشته باشد.
- استخراج تحویل restart/update اکنون اجازه می‌دهد `threadId` مربوط به تحویل SQLite تایپ‌شده
  بر fragmentهای topic/thread تجزیه‌شده از `sessionKey` اولویت داشته باشد؛ تجزیه
  فقط fallback برای کلیدهای قدیمی thread-shaped است.
- شناسه‌های کانال context عامل hook اکنون هویت مکالمه SQLite تایپ‌شده
  و سپس فراداده صریح پیام را ترجیح می‌دهند. آن‌ها دیگر fragmentهای provider/group/channel را
  از `sessionKey` تجزیه نمی‌کنند.
- ارث‌بری مسیر خارجی `chat.send` در Gateway اکنون به‌جای استنباط scope
  channel/direct/group از اجزای `sessionKey`، فراداده مسیریابی نشست SQLite تایپ‌شده را می‌خواند.
  نشست‌های channel-scoped فقط وقتی ارث‌بری می‌کنند که کانال نشست تایپ‌شده
  و نوع chat با context تحویل ذخیره‌شده مطابقت داشته باشند؛ نشست‌های shared-main
  قانون سخت‌گیرانه‌تر CLI/no-client-metadata خود را حفظ می‌کنند.
- wake مربوط به restart-sentinel و مسیریابی ادامه اکنون پیش از queue کردن wakeهای Heartbeat
  یا continuationهای routed agent-turn، ردیف‌های تحویل/مسیریابی SQLite تایپ‌شده را می‌خواند.
  این دیگر context تحویل را از سایه JSON مربوط به session-entry بازسازی نمی‌کند.
- حل context مربوط به `tools.effective` در Gateway اکنون ردیف‌های تحویل/مسیریابی SQLite تایپ‌شده را
  برای ورودی‌های provider، account، target، thread، و reply-mode می‌خواند.
  این دیگر آن فیلدهای مسیریابی داغ را از سایه‌های origin کهنه
  `session_entries.entry_json` بازیابی نمی‌کند.
- مسیریابی مشاوره صوتی realtime اکنون تحویل parent/call را از ردیف‌های نشست SQLite تایپ‌شده
  به‌ازای هر عامل حل می‌کند. این دیگر هنگام انتخاب مسیر پیام عامل embedded
  به سایه‌های سازگاری `SessionEntry.deliveryContext` fallback نمی‌کند.
- رله Heartbeat مربوط به spawn در ACP و مسیریابی parent-stream اکنون تحویل والد را
  از ردیف‌های نشست SQLite تایپ‌شده می‌خوانند. آن‌ها دیگر context تحویل والد را
  از سایه‌های سازگاری session-entry بازسازی نمی‌کنند.
- حفظ مسیر تحویل نشست اکنون از فراداده chat تایپ‌شده و ستون‌های تحویل ماندگارشده
  پیروی می‌کند. این دیگر hintهای کانال، markerهای direct/main، یا شکل thread را
  از `sessionKey` استخراج نمی‌کند؛ مسیرهای webchat داخلی فقط وقتی هدف خارجی را ارث‌بری می‌کنند
  که SQLite از پیش هویت تحویل تایپ‌شده/ماندگارشده برای نشست داشته باشد.
- استخراج عمومی تحویل نشست اکنون فقط ردیف دقیق تحویل نشست SQLite تایپ‌شده را می‌خواند.
  این دیگر پسوندهای thread/topic را تجزیه نمی‌کند یا از یک کلید thread-shaped
  به کلید نشست پایه fallback نمی‌کند.
- dispatch پاسخ، بازیابی restart sentinel، و مسیریابی مشاوره صوتی realtime
  اکنون از ردیف‌های دقیق نشست/مکالمه SQLite تایپ‌شده برای مسیریابی thread استفاده می‌کنند. آن‌ها
  دیگر شناسه‌های thread یا context تحویل نشست پایه را با تجزیه کلیدهای نشست thread-shaped
  بازیابی نمی‌کنند.
- محدودسازی تاریخچه PI تعبیه‌شده اکنون از projection مسیریابی نشست SQLite تایپ‌شده
  (`sessions` + `conversations` اصلی) برای provider، نوع chat،
  و هویت peer استفاده می‌کند. این دیگر provider، DM، گروه، یا شکل thread را
  از `sessionKey` تجزیه نمی‌کند.
- استنباط تحویل ابزار Cron اکنون فقط از تحویل صریح یا context تحویل تایپ‌شده فعلی
  استفاده می‌کند. این دیگر هدف‌های channel، peer، account، یا thread را
  از `agentSessionKey` decode نمی‌کند.
- ردیف‌های نشست runtime دیگر alias مسیر قدیمی `lastProvider` را حمل نمی‌کنند.
  کمک‌کننده‌ها و تست‌ها از فیلدهای تایپ‌شده `lastChannel` و `deliveryContext` استفاده می‌کنند؛
  migration در doctor تنها جایی است که باید aliasهای مسیر قدیمی‌تر
  یا سایه‌های `origin` ماندگارشده را ترجمه کند.
- eventهای transcript، ردیف‌های VFS، و ردیف‌های artifact ابزار اکنون در پایگاه‌داده به‌ازای هر عامل
  نوشته می‌شوند. جدول mapping سراسری عرضه‌نشده transcript-file حذف شده است؛ doctor
  مسیرهای منبع قدیمی را در ردیف‌های migration بادوام ثبت می‌کند.
- lookup مربوط به transcript در runtime دیگر offsetهای بایتی JSONL را scan نمی‌کند یا فایل‌های transcript قدیمی را
  probe نمی‌کند. مسیرهای chat/media/history در Gateway ردیف‌های transcript را از
  SQLite می‌خوانند؛ session JSONL اکنون فقط ورودی قدیمی doctor است، نه وضعیت runtime
  یا قالب export.
- رابطه‌های والد و branch در transcript از فراداده ساخت‌یافته
  `parentTranscriptScope: {agentId, sessionId}` در headerهای transcript در SQLite استفاده می‌کنند،
  نه stringهای locator شبیه مسیر `agent-db:...transcript_events...`.
- قرارداد مدیر transcript دیگر constructorهای implicit persisted
  `create(cwd)` یا `continueRecent(cwd)` را ارائه نمی‌کند. مدیران transcript ماندگارشده
  با scope صریح `{agentId, sessionId}` باز می‌شوند؛ فقط مدیران in-memory
  برای تست‌ها و transformهای pure transcript بدون scope باقی می‌مانند.
- APIهای store مربوط به transcript در runtime، scope SQLite را resolve می‌کنند، نه مسیرهای filesystem.
  کمک‌کننده قدیمی `resolve...ForPath` و گزینه‌های نوشتن استفاده‌نشده `transcriptPath`
  از callerهای runtime حذف شده‌اند.
- حل نشست runtime اکنون از `{agentId, sessionId}` استفاده می‌کند و نباید stringهای
  `sqlite-transcript://<agent>/<session>` را برای مرزهای خارجی استخراج کند.
  مسیرهای مطلق JSONL قدیمی فقط ورودی‌های migration در doctor هستند.
- رکوردهای direct-bridge مربوط به رله hook native اکنون در ردیف‌های مشترک تایپ‌شده
  `native_hook_relay_bridges` با کلید relay id قرار دارند. runtime دیگر registry JSON در
  `/tmp` یا رکوردهای generic مبهم برای آن رکوردهای bridge کوتاه‌عمر نمی‌نویسد.
- `runEmbeddedPiAgent(...)` دیگر پارامتر transcript-locator ندارد.
  توصیفگرهای آماده‌ی worker نیز مکان‌یاب‌های transcript را حذف می‌کنند. وضعیت نشست runtime
  و اجراهای follow-up صف‌شده، به‌جای handleهای transcript مشتق‌شده،
  `{agentId, sessionId}` را حمل می‌کنند.
- Compaction تعبیه‌شده اکنون محدوده‌ی SQLite را از `agentId` و `sessionId` می‌گیرد.
  hookهای Compaction، فراخوانی‌های context-engine، تفویض CLI، و پاسخ‌های protocol
  نباید handleهای مشتق‌شده‌ی `sqlite-transcript://...` را دریافت کنند. کد
  export/debug می‌تواند artifactهای صریح کاربر را از rowها بسازد، اما مسیر export
  عمومی session JSONL ارائه نمی‌کند یا نام فایل‌ها را دوباره به هویت runtime
  تزریق نمی‌کند.
- `/export-session` rowهای transcript را از SQLite می‌خواند و فقط نمای مستقل HTML
  درخواست‌شده را می‌نویسد. viewer تعبیه‌شده دیگر session JSONL را از آن rowها
  بازسازی یا دانلود نمی‌کند.
- تفویض context-engine دیگر یک مکان‌یاب transcript را برای بازیابی هویت agent
  parse نمی‌کند. runtime context آماده‌شده، `agentId` حل‌شده را به adapter داخلی
  Compaction حمل می‌کند.
- بازنویسی transcript و کوتاه‌سازی زنده‌ی نتیجه‌ی tool اکنون وضعیت transcript را
  با `{agentId, sessionId}` می‌خوانند و persist می‌کنند و برای payloadهای event
  به‌روزرسانی transcript مکان‌یاب‌های موقت مشتق نمی‌کنند.
- سطح helper وضعیت transcript دیگر variantهای مبتنی بر مکان‌یاب
  `readTranscriptState`، `replaceTranscriptStateEvents`، یا
  `persistTranscriptStateMutation` ندارد. فراخوان‌های runtime باید از APIهای
  `{agentId, sessionId}` استفاده کنند. import در Doctor فایل‌های legacy را با
  مسیر فایل صریح می‌خواند و rowهای SQLite را می‌نویسد؛ رشته‌های مکان‌یاب را migrate
  نمی‌کند.
- قرارداد runtime session-manager دیگر `open(locator)`، `forkFrom(locator)`، یا
  `setTranscriptLocator(...)` را expose نمی‌کند. session managerهای persistشده فقط
  با `{agentId, sessionId}` باز می‌شوند؛ helperهای list/fork به‌جای facade مدیر
  transcript روی APIهای session و checkpoint مبتنی بر row زندگی می‌کنند.
- APIهای خواننده‌ی transcript در Gateway scope-first هستند. آن‌ها
  `{agentId, sessionId}` را می‌گیرند و مکان‌یاب transcript موضعی را نمی‌پذیرند که
  ممکن است تصادفی به هویت runtime تبدیل شود. parse مکان‌یاب transcript فعال حذف
  شده است؛ مسیرهای منبع legacy فقط توسط کد import در Doctor خوانده می‌شوند.
- eventهای به‌روزرسانی transcript نیز scope-first هستند. `emitSessionTranscriptUpdate`
  دیگر یک رشته‌ی مکان‌یاب خام را نمی‌پذیرد، و listenerها بدون parse کردن handle با
  `{agentId, sessionId}` مسیریابی می‌کنند.
- broadcast پیام نشست Gateway کلیدهای نشست را از محدوده‌ی agent/session حل می‌کند،
  نه از مکان‌یاب transcript. resolver/cache قدیمی کلید transcript-locator-to-session
  حذف شده است.
- SSE تاریخچه‌ی نشست Gateway به‌روزرسانی‌های زنده را با محدوده‌ی agent/session
  فیلتر می‌کند. دیگر کاندیداهای مکان‌یاب transcript، realpathها، یا هویت‌های
  transcript فایل‌مانند را canonicalize نمی‌کند تا تصمیم بگیرد آیا stream باید یک
  به‌روزرسانی دریافت کند یا نه.
- hookهای چرخه‌ی عمر نشست دیگر مکان‌یاب‌های transcript را روی `session_end` مشتق یا
  expose نمی‌کنند. مصرف‌کنندگان hook، `sessionId`، `sessionKey`، شناسه‌های نشست
  بعدی، و context agent را دریافت می‌کنند؛ فایل‌های transcript بخشی از قرارداد
  چرخه‌ی عمر نیستند.
- hookهای reset نیز دیگر مکان‌یاب‌های transcript را مشتق یا expose نمی‌کنند. payload
  `before_reset` پیام‌های SQLite بازیابی‌شده به‌همراه دلیل reset را حمل می‌کند،
  درحالی‌که هویت نشست در context hook باقی می‌ماند.
- reset در agent harness دیگر مکان‌یاب transcript نمی‌پذیرد. dispatch reset با
  `sessionId`/`sessionKey` به‌همراه دلیل scope می‌شود.
- نوع‌های نشست agent extension دیگر `transcriptLocator` را expose نمی‌کنند؛ extensionها
  باید به‌جای دست بردن به هویت transcript فایل‌مانند، از context نشست و APIهای
  runtime استفاده کنند.
- hookهای Plugin Compaction دیگر مکان‌یاب‌های transcript را expose نمی‌کنند. context
  hook از قبل هویت نشست را حمل می‌کند، و خواندن‌های transcript باید به‌جای handleهای
  فایل‌مانند از APIهای آگاه به محدوده‌ی SQLite عبور کنند.
- hookهای `before_agent_finalize` دیگر `transcriptPath` را expose نمی‌کنند، از جمله
  payloadهای relay hook native. hookهای نهایی‌سازی فقط از context نشست استفاده
  می‌کنند.
- پاسخ‌های reset در Gateway دیگر روی entry برگشتی مکان‌یاب transcript نمی‌سازند.
  reset، rowهای transcript در SQLite را ایجاد می‌کند، entry نشست پاک را برمی‌گرداند،
  و دسترسی به transcript را به خواننده‌های آگاه به محدوده واگذار می‌کند.
- نتیجه‌های اجرای تعبیه‌شده و Compaction دیگر مکان‌یاب‌های transcript را برای
  حسابداری نشست surfacing نمی‌کنند. Compaction خودکار فقط `sessionId` فعال،
  شمارنده‌های Compaction، و metadata توکن را به‌روزرسانی می‌کند.
- نتیجه‌های attempt تعبیه‌شده دیگر `transcriptLocatorUsed` را برنمی‌گردانند، و
  نتیجه‌های `compact()` در context-engine نیز دیگر مکان‌یاب‌های transcript را
  برنمی‌گردانند. حلقه‌های retry در runtime فقط یک `sessionId` جانشین را می‌پذیرند.
- نتیجه‌های append transcript در delivery-mirror دیگر مکان‌یاب‌های transcript را
  برنمی‌گردانند. فراخوان‌ها `messageId` append‌شده را دریافت می‌کنند؛ سیگنال‌های
  به‌روزرسانی transcript از محدوده‌ی SQLite استفاده می‌کنند.
- helperهای fork نشست والد فقط `sessionId` فورک‌شده را برمی‌گردانند. آماده‌سازی
  subagent محدوده‌ی child agent/session را به engineها پاس می‌دهد.
- پارامترهای CLI runner و reseeding تاریخچه دیگر مکان‌یاب‌های transcript را
  نمی‌پذیرند. خواندن‌های تاریخچه‌ی CLI محدوده‌ی transcript در SQLite را از
  `{agentId,
sessionId}` و context کلید نشست حل می‌کنند.
- fixtureهای تست CLI و embedded-runner اکنون rowهای transcript در SQLite را با
  شناسه‌ی نشست seed و read می‌کنند، به‌جای اینکه وانمود کنند نشست‌های فعال فایل‌های
  `*.jsonl` هستند یا یک رشته‌ی `sqlite-transcript://...` را از طریق پارامترهای
  runtime عبور دهند.
- eventهای guard نتیجه‌ی tool نشست از محدوده‌ی نشست شناخته‌شده emit می‌شوند، حتی
  وقتی یک manager درون‌حافظه‌ای مکان‌یاب مشتق‌شده ندارد. تست‌های آن دیگر فایل‌های
  transcript فعال `/tmp/*.jsonl` را fake نمی‌کنند.
- helperهای BTW و compaction-checkpoint اکنون rowهای transcript را با محدوده‌ی
  SQLite می‌خوانند و fork می‌کنند. metadata checkpoint اکنون فقط شناسه‌های نشست و
  leaf/entry را ذخیره می‌کند؛ مکان‌یاب‌های مشتق‌شده دیگر در payloadهای checkpoint
  نوشته نمی‌شوند.
- lookup کلید transcript در Gateway در مرزهای protocol از محدوده‌ی transcript در
  SQLite استفاده می‌کند و دیگر نام فایل‌های transcript را realpath یا stat نمی‌کند.
- چرخش خودکار transcript در Compaction، rowهای transcript جانشین را مستقیم از طریق
  store transcript در SQLite می‌نویسد. rowهای نشست فقط هویت نشست جانشین را نگه
  می‌دارند، نه مسیر durable JSONL یا مکان‌یاب persistشده.
- Compaction در embedded context-engine از helperهای چرخش transcript نام‌گذاری‌شده
  با SQLite استفاده می‌کند. تست‌های چرخش دیگر مسیرهای جانشین JSONL را نمی‌سازند یا
  نشست‌های فعال را به‌صورت فایل مدل نمی‌کنند.
- نگهداری managed outgoing image کلید cache پیام transcript خود را از statهای
  transcript در SQLite می‌گیرد، نه از فراخوانی‌های stat فایل‌سیستم.
- lockهای نشست runtime و lane مستقل Doctor برای `.jsonl.lock` legacy حذف شده‌اند.
- barrel runtime Microsoft Teams و public plugin SDK دیگر helper قدیمی file-lock را
  دوباره export نمی‌کنند؛ مسیرهای durable plugin state با SQLite پشتیبانی می‌شوند.
- pruning نشست بر اساس age/count و cleanup صریح نشست حذف شده‌اند. Doctor مالک import
  legacy است؛ نشست‌های stale به‌صورت صریح reset یا delete می‌شوند.
- بررسی‌های integrity در Doctor دیگر یک فایل JSONL legacy را به‌عنوان transcript
  فعال معتبر برای row نشست SQLite حساب نمی‌کنند. سلامت transcript فعال فقط
  SQLite است؛ فایل‌های JSONL legacy به‌عنوان ورودی‌های migration/orphan-cleanup
  گزارش می‌شوند.
- Doctor دیگر `agents/<agent>/sessions/` را state runtime الزامی تلقی نمی‌کند.
  فقط وقتی آن directory از قبل وجود داشته باشد، آن را به‌عنوان ورودی import legacy
  یا orphan-cleanup اسکن می‌کند.
- مسیرهای `sessions.resolve` در Gateway، session patch/reset/compact، spawning
  subagent، abort سریع، metadata در ACP، نشست‌های ایزوله‌شده با Heartbeat، و patching
  در TUI دیگر به‌عنوان side effect کار عادی runtime کلیدهای نشست legacy را migrate
  یا prune نمی‌کنند.
- resolution نشست فرمان CLI اکنون به‌جای `storePath`، `agentId` مالک را برمی‌گرداند،
  و دیگر rowهای legacy main-session را در جریان resolution عادی `--to` یا
  `--session-id` کپی نمی‌کند. canonicalization row اصلی legacy فقط متعلق به Doctor
  است.
- resolution عمق subagent در runtime دیگر `sessions.json` یا storeهای نشست JSON5 را
  نمی‌خواند. `session_entries` در SQLite را بر اساس شناسه‌ی agent می‌خواند، و
  metadata عمق/نشست legacy فقط می‌تواند از مسیر import در Doctor وارد شود.
- overrideهای نشست auth profile از طریق upsert مستقیم rowهای `{agentId, sessionKey}`
  persist می‌شوند، به‌جای lazy-load کردن runtime store نشست فایل‌مانند.
- gating verbose در auto-reply و helperهای به‌روزرسانی نشست اکنون rowهای نشست SQLite
  را با هویت نشست read/upsert می‌کنند و دیگر پیش از دست زدن به state row
  persistشده به مسیر store legacy نیاز ندارند.
- helperهای metadata نشست command-run اکنون از نام‌ها و مسیرهای module entry-oriented
  استفاده می‌کنند؛ سطح helper فرمان `session-store` قدیمی حذف شده است.
- seeding هدر bootstrap و hardening مرز Compaction دستی اکنون rowهای transcript در
  SQLite را مستقیم mutate می‌کنند. فراخوان‌های runtime هویت نشست را پاس می‌دهند،
  نه مسیرهای قابل‌نوشتن `.jsonl`.
- replay بی‌صدای rotation نشست، turnهای اخیر user/assistant را با
  `{agentId, sessionId}` از rowهای transcript در SQLite کپی می‌کند. دیگر مکان‌یاب‌های
  transcript مبدا یا مقصد را نمی‌پذیرد.
- rowهای تازه‌ی نشست runtime دیگر مکان‌یاب‌های transcript را ذخیره نمی‌کنند.
  فراخوان‌ها مستقیم از `{agentId, sessionId}` استفاده می‌کنند؛ فرمان‌های
  export/debug می‌توانند هنگام materialize کردن rowها نام فایل خروجی را انتخاب کنند.
- شروع یک نشست transcript persistشده‌ی جدید اکنون همیشه rowهای SQLite را بر اساس
  scope باز می‌کند. session manager دیگر مسیر یا مکان‌یاب transcript دوران فایل
  قبلی را به‌عنوان هویت نشست جدید reuse نمی‌کند.
- نشست‌های transcript persistشده از API صریح
  `openTranscriptSessionManagerForSession({agentId, sessionId})` استفاده می‌کنند.
  facadeهای static قدیمی `SessionManager.create/openForSession/list/forkFromSession`
  حذف شده‌اند تا تست‌ها و کد runtime نتوانند تصادفی discovery نشست دوران فایل را
  دوباره بسازند.
- runtime در Plugin دیگر `api.runtime.agent.session.resolveTranscriptLocatorPath` را
  expose نمی‌کند؛ کد Plugin از helperهای row در SQLite و مقدارهای scope استفاده
  می‌کند.
- سطح public `session-store-runtime` در SDK اکنون فقط helperهای row نشست و row
  transcript را export می‌کند. helperهای متمرکز schema/path/transaction در SQLite
  در `sqlite-runtime` زندگی می‌کنند؛ helperهای خام open/close/reset فقط برای تست‌های
  first-party local می‌مانند.
- classifierهای filename مربوط به trajectory/checkpoint legacy `.jsonl` اکنون در
  module فایل نشست legacy در Doctor زندگی می‌کنند. validation نشست core دیگر
  helperهای artifact فایل را import نمی‌کند تا شناسه‌های نشست عادی SQLite را تصمیم
  بگیرد.
- اجراهای subagent مسدودکننده‌ی Active Memory به‌جای ایجاد فایل‌های موقت یا
  persistشده‌ی `session.jsonl` زیر plugin state، از rowهای transcript در SQLite
  استفاده می‌کنند. گزینه‌ی قدیمی `transcriptDir` حذف شده است.
- تولید slug یک‌باره و اجراهای planner در Crestodian به‌جای ایجاد فایل‌های موقت
  `session.jsonl` از rowهای transcript در SQLite استفاده می‌کنند.
- اجراهای helper در `llm-task` و استخراج hidden commitment نیز از rowهای transcript
  در SQLite استفاده می‌کنند، بنابراین این نشست‌های helper فقط‌مدل دیگر فایل‌های
  transcript موقت JSON/JSONL ایجاد نمی‌کنند.
- `TranscriptSessionManager` اکنون فقط یک محدوده‌ی بازشده‌ی transcript در SQLite است.
  کد runtime آن را با `openTranscriptSessionManagerForSession({agentId,
sessionId})` باز می‌کند؛ جریان‌های create، branch، continue، list، و fork به‌جای
  facadeهای static manager در helperهای row SQLite مالک خود زندگی می‌کنند.
  کد Doctor/import/debug فایل‌های منبع legacy صریح را بیرون از runtime session manager
  مدیریت می‌کند.
- متدهای facade منسوخ `SessionManager.newSession()` و
  `SessionManager.createBranchedSession()` حذف شدند. نشست‌های جدید و descendantهای
  transcript به‌جای mutate کردن یک manager ازقبل‌بازشده به نشست persistشده‌ی متفاوت،
  توسط workflow مالک خود در SQLite ایجاد می‌شوند.
- تصمیم‌های fork transcript والد و ایجاد fork دیگر `storePath` یا `sessionsDir` را
  نمی‌پذیرند؛ آن‌ها به‌جای metadata مسیر فایل‌سیستم نگه‌داشته‌شده از محدوده‌ی
  transcript در SQLite با `{agentId, sessionId}` استفاده می‌کنند.
- memory-host دیگر helperهای no-op طبقه‌بندی transcript در directory نشست را export
  نمی‌کند؛ فیلتر کردن transcript اکنون هنگام ساخت entry از metadata row در SQLite
  مشتق می‌شود.
- تست‌های session-export در memory-host و QMD از scopeهای transcript در SQLite
  استفاده می‌کنند. مسیرهای قدیمی `agents/<agentId>/sessions/*.jsonl` فقط در جاهایی
  پوشش داده می‌مانند که یک تست عمدا compatibility مربوط به Doctor/import/export را
  اثبات می‌کند.
- بازرسی raw نشست در QA-lab اکنون از `sessions.list` از طریق Gateway استفاده می‌کند
  به‌جای خواندن `agents/qa/sessions/sessions.json`؛ بازخورد MSteams
  مستقیماً به رونوشت‌های SQLite افزوده می‌شود، بدون ساختن یک مسیر JSONL جعلی.
- نوبت‌های کانال ورودی مشترک اکنون به‌جای `storePath` قدیمی، `{agentId, sessionKey}` را حمل می‌کنند. مسیرهای ضبط LINE، WhatsApp، Slack، Discord، Telegram، Matrix، Signal،
  iMessage، BlueBubbles، Feishu، Google Chat، IRC، Nextcloud Talk، Zalo،
  Zalo Personal، QA Channel، Microsoft Teams، Mattermost، Synology Chat، Tlon،
  Twitch و QQBot اکنون فرادادهٔ updated-at را می‌خوانند و ردیف‌های جلسهٔ ورودی را از طریق هویت SQLite ثبت می‌کنند.
- پایداری مکان‌یاب رونوشت از ردیف‌های جلسهٔ فعال حذف شده است.
  `resolveSessionTranscriptTarget`، `agentId`، `sessionId` و فرادادهٔ اختیاری موضوع را برمی‌گرداند؛ doctor تنها کدی است که نام‌های فایل رونوشت قدیمی را وارد می‌کند.
- سرآیندهای رونوشت زمان اجرا از نسخهٔ SQLite `1` شروع می‌شوند. ارتقاهای شکل قدیمی JSONL V1/V2/V3 فقط در واردسازی doctor قرار دارند و پیش از ذخیرهٔ ردیف‌ها، سرآیندهای واردشده را به نسخهٔ فعلی رونوشت SQLite نرمال‌سازی می‌کنند.
- نگهبان database-first اکنون `SessionManager.listAll` و
  `SessionManager.forkFromSession` را ممنوع می‌کند؛ گردش‌کارهای فهرست‌کردن جلسه و fork/restore باید روی APIهای ردیفی/دامنه‌بندی‌شدهٔ SQLite باقی بمانند.
- این نگهبان همچنین نام‌های قدیمی کمک‌کنندهٔ parse/active-branch repair برای رونوشت JSONL را بیرون از کد doctor/import ممنوع می‌کند، تا زمان اجرا نتواند مسیر دوم مهاجرت رونوشت قدیمی ایجاد کند.
- اجراهای PI توکار دستگیره‌های رونوشت ورودی را رد می‌کنند. آن‌ها پیش از راه‌اندازی worker و دوباره پیش از اینکه تلاش به وضعیت رونوشت دست بزند، از هویت SQLite
  `{agentId, sessionId}` استفاده می‌کنند. ورودی کهنهٔ `/tmp/*.jsonl` نمی‌تواند هدف نوشتن زمان اجرا را انتخاب کند.
- رکوردهای ردگیری cache، payload آنتروپیک، stream خام و timeline تشخیص اکنون در ردیف‌های تایپ‌شدهٔ SQLite `diagnostic_events` نوشته می‌شوند. بسته‌های پایداری Gateway اکنون در ردیف‌های تایپ‌شدهٔ SQLite `diagnostic_stability_bundles` نوشته می‌شوند. مسیرهای override قدیمی JSONL یعنی
  `diagnostics.cacheTrace.filePath`، `OPENCLAW_CACHE_TRACE_FILE`،
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` و
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` حذف شده‌اند، و capture عادی پایداری دیگر فایل‌های `logs/stability/*.json` را نمی‌نویسد.
- پایداری Cron اکنون به‌جای حذف/درج دوبارهٔ کل جدول job در هر ذخیره، ردیف‌های SQLite `cron_jobs` را reconcile می‌کند. writebackهای هدف Plugin مستقیماً ردیف‌های cron منطبق را به‌روزرسانی می‌کنند و وضعیت cron زمان اجرا را در همان تراکنش پایگاه‌دادهٔ وضعیت نگه می‌دارند.
- فراخوان‌های زمان اجرای Cron اکنون از یک کلید پایدار SQLite برای store مربوط به cron استفاده می‌کنند. مسیرهای قدیمی `cron.store` فقط ورودی‌های واردسازی doctor هستند؛ مسیرهای gateway تولیدی، نگهداشت task، status، run-log و writeback هدف Telegram از `resolveCronStoreKey` استفاده می‌کنند و دیگر کلید را path-normalize نمی‌کنند. وضعیت Cron اکنون به‌جای فیلد فایل‌مانند قدیمی `storePath`، `storeKey` را گزارش می‌کند.
- بارگذاری و زمان‌بندی زمان اجرای Cron دیگر شکل‌های job ماندگارشدهٔ قدیمی مانند `jobId`، `schedule.cron`، عددی `atMs`، booleanهای رشته‌ای، یا `sessionTarget` ازدست‌رفته را نرمال‌سازی نمی‌کند. واردسازی قدیمی doctor پیش از درج ردیف‌ها در SQLite مالک این repairها است.
- spawn در ACP دیگر مسیرهای فایل JSONL رونوشت را resolve یا persist نمی‌کند. راه‌اندازی spawn و thread-bind مستقیماً ردیف جلسهٔ SQLite را persist می‌کند و شناسهٔ جلسه را به‌عنوان هویت رونوشت نگه‌داشته‌شده حفظ می‌کند.
- APIهای فرادادهٔ جلسهٔ ACP اکنون ردیف‌های SQLite را بر اساس `agentId` می‌خوانند/فهرست می‌کنند/upsert می‌کنند و دیگر `storePath` را به‌عنوان بخشی از قرارداد entry جلسهٔ ACP در معرض نمی‌گذارند.
- حسابداری مصرف جلسه و تجمیع مصرف Gateway اکنون رونوشت‌ها را فقط با `{agentId, sessionId}` resolve می‌کنند. cache هزینه/مصرف و خلاصه‌های جلسهٔ کشف‌شده دیگر رشته‌های مکان‌یاب رونوشت را synthesize یا برنمی‌گردانند.
- افزودن chat در Gateway، پایداری abort-partial، `/sessions.send` و نوشتن رونوشت رسانهٔ webchat مستقیماً از طریق دامنهٔ رونوشت SQLite append می‌کنند. کمک‌کنندهٔ تزریق رونوشت Gateway دیگر پارامتر `transcriptLocator` را نمی‌پذیرد.
- کشف رونوشت SQLite اکنون فقط دامنه‌ها و آمار رونوشت را فهرست می‌کند:
  `{agentId, sessionId, updatedAt, eventCount}`. کمک‌کنندهٔ سازگاری مردهٔ
  `listSqliteSessionTranscriptLocators` و فیلد هرردیفی `locator` حذف شده‌اند.
- زمان اجرای repair رونوشت اکنون فقط
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` را در معرض می‌گذارد. کمک‌کنندهٔ قدیمی repair مبتنی بر مکان‌یاب حذف شده است؛ کد doctor/debug مسیرهای فایل منبع صریح را می‌خواند و هرگز رشته‌های مکان‌یاب را migrate نمی‌کند.
- زمان اجرای ledger بازپخش ACP اکنون به‌جای `acp/event-ledger.json`، ردیف‌های بازپخش هر جلسه را در پایگاه‌دادهٔ وضعیت SQLite مشترک ذخیره می‌کند؛ doctor فایل قدیمی را وارد و حذف می‌کند.
- کمک‌کننده‌های خوانندهٔ رونوشت Gateway اکنون به‌جای نام ماژول قدیمی
  `session-utils.fs` در `src/gateway/session-transcript-readers.ts` قرار دارند. بررسی تاریخچهٔ retry fallback به‌جای سطح قدیمی file-helper، بر اساس محتوای رونوشت SQLite نام‌گذاری شده است.
- کمک‌کننده‌های injected-chat و compaction در Gateway اکنون دامنهٔ رونوشت SQLite را از طریق APIهای کمک‌کنندهٔ داخلی عبور می‌دهند، به‌جای اینکه مقادیر را مسیرهای رونوشت یا فایل‌های منبع بنامند.
- تشخیص ادامهٔ bootstrap اکنون ردیف‌های رونوشت SQLite را از طریق
  `hasCompletedBootstrapTranscriptTurn` بررسی می‌کند؛ دیگر نام کمک‌کنندهٔ فایل‌مانند را در معرض نمی‌گذارد.
- تست‌های embedded-runner اکنون از هویت رونوشت SQLite استفاده می‌کنند، و بازکردن یک مدیر رونوشت جدید همیشه به `sessionId` صریح نیاز دارد.
- کمک‌کننده‌های نمایه‌سازی memory اکنون از ابتدا تا انتها از اصطلاحات رونوشت SQLite استفاده می‌کنند:
  host، `listSessionTranscriptScopesForAgent` و
  `sessionTranscriptKeyForScope` را export می‌کند، صف‌های sync هدفمند `sessionTranscripts` هستند،
  hitهای public session-search مسیرهای opaque به‌شکل `transcript:<agent>:<session>` را در معرض می‌گذارند، و کلید منبع داخلی DB به‌جای یک مسیر فایل جعلی، زیر
  `source_kind='sessions'` برابر `session:<session>` است.
- کمک‌کنندهٔ persistent-dedupe عمومی در Plugin SDK دیگر optionهای فایل‌مانند را در معرض نمی‌گذارد. فراخوان‌ها کلیدهای دامنهٔ SQLite را ارائه می‌کنند و ردیف‌های dedupe بادوام در وضعیت Plugin مشترک قرار می‌گیرند.
- توکن‌های SSO در Microsoft Teams از فایل‌های JSON قفل‌شده به وضعیت Plugin در SQLite منتقل شدند. Doctor، `msteams-sso-tokens.json` را وارد می‌کند، کلیدهای canonical توکن SSO را از payloadها بازسازی می‌کند، و فایل منبع را حذف می‌کند. توکن‌های OAuth واگذارشده روی مرز موجود credential-file خصوصی خود باقی می‌مانند.
- وضعیت cache همگام‌سازی Matrix از `bot-storage.json` به وضعیت Plugin در SQLite منتقل شد. Doctor، payloadهای sync قدیمی خام یا wrap‌شده را وارد می‌کند و فایل منبع را حذف می‌کند. کلاینت‌های فعال Matrix و QA Matrix یک دایرکتوری ریشهٔ SQLite sync-store را عبور می‌دهند، نه مسیر جعلی `sync-store.json` یا `bot-storage.json`.
- وضعیت migration رمزنگاری قدیمی Matrix از
  `legacy-crypto-migration.json` به وضعیت Plugin در SQLite منتقل شد. Doctor فایل وضعیت قدیمی را وارد می‌کند؛ snapshotهای IndexedDB در Matrix SDK از
  `crypto-idb-snapshot.json` به blobهای Plugin در SQLite منتقل شدند. کلیدهای recovery و credentialهای Matrix ردیف‌های وضعیت Plugin در SQLite هستند؛ فایل‌های JSON قدیمی آن‌ها فقط ورودی‌های migration برای doctor هستند.
- لاگ‌های فعالیت Memory Wiki اکنون به‌جای
  `.openclaw-wiki/log.jsonl` از وضعیت Plugin در SQLite استفاده می‌کنند. provider مهاجرت Memory Wiki لاگ‌های JSONL قدیمی را وارد می‌کند؛ markdown و محتوای vault کاربر همچنان به‌عنوان محتوای workspace فایل‌پشتوانه باقی می‌مانند.
- Memory Wiki دیگر `.openclaw-wiki/state.json` یا دایرکتوری استفاده‌نشدهٔ
  `.openclaw-wiki/locks` را ایجاد نمی‌کند. provider مهاجرت اگر vault قدیمی‌تر هنوز این فایل‌های فرادادهٔ Plugin بازنشسته را داشته باشد، آن‌ها را حذف می‌کند.
- entryهای audit در Crestodian اکنون به‌جای
  `audit/crestodian.jsonl` از وضعیت Plugin در SQLite هسته استفاده می‌کنند. Doctor لاگ audit قدیمی JSONL را وارد می‌کند و پس از واردسازی موفق، آن را حذف می‌کند.
- entryهای audit مربوط به نوشتن/مشاهدهٔ config اکنون به‌جای
  `logs/config-audit.jsonl` از وضعیت Plugin در SQLite هسته استفاده می‌کنند. Doctor لاگ audit قدیمی JSONL را وارد می‌کند و پس از واردسازی موفق، آن را حذف می‌کند.
- companion در macOS دیگر هنگام ویرایش `openclaw.json`، sidecarهای محلی app یعنی `logs/config-audit.jsonl` یا
  `logs/config-health.json` را نمی‌نویسد. فایل config همچنان فایل‌پشتوانه باقی می‌ماند، snapshotهای recovery کنار فایل config می‌مانند، و وضعیت بادوام audit/health مربوط به config متعلق به store SQLite در Gateway است.
- تأییدیه‌های pending مربوط به rescue در Crestodian اکنون به‌جای
  `crestodian/rescue-pending/*.json` از وضعیت Plugin در SQLite هسته استفاده می‌کنند. Doctor فایل‌های تأییدیهٔ pending قدیمی را وارد می‌کند و پس از واردسازی موفق، آن‌ها را حذف می‌کند.
- وضعیت arm موقت Phone Control اکنون به‌جای
  `plugins/phone-control/armed.json` از وضعیت Plugin در SQLite استفاده می‌کند. Doctor فایل قدیمی armed-state را در namespace مربوط به `phone-control/arm-state` وارد می‌کند و فایل را حذف می‌کند.
- Doctor دیگر رونوشت‌های JSONL را درجا repair نمی‌کند یا فایل‌های backup JSONL ایجاد نمی‌کند. شاخهٔ فعال را به SQLite وارد می‌کند و منبع قدیمی را حذف می‌کند.
- lookup رونوشت در hook مربوط به session-memory از خواندن‌های SQLite فقط با دامنهٔ `{agentId, sessionId}` استفاده می‌کند. کمک‌کنندهٔ آن دیگر مکان‌یاب‌های رونوشت، خواندن فایل قدیمی، یا optionهای بازنویسی فایل را نمی‌پذیرد یا مشتق نمی‌کند.
- bindingهای گفت‌وگوی app-server در Codex اکنون وضعیت Plugin در SQLite را با کلید جلسهٔ OpenClaw یا دامنهٔ صریح `{agentId, sessionId}` کلیدگذاری می‌کنند. آن‌ها نباید bindingهای fallback مسیر رونوشت را حفظ کنند.
- خواندن‌های mirrored-history در app-server مربوط به Codex فقط از دامنهٔ رونوشت SQLite استفاده می‌کنند؛ آن‌ها نباید هویت را از مسیرهای فایل رونوشت بازیابی کنند.
- مسیرهای بازنشانی role-ordering و compaction دیگر فایل‌های رونوشت قدیمی را unlink نمی‌کنند؛ reset فقط ردیف جلسهٔ SQLite و هویت رونوشت را rotate می‌کند.
- پاسخ‌های reset و checkpoint در Gateway ردیف‌های تمیز جلسه به‌همراه شناسه‌های جلسه را برمی‌گردانند. آن‌ها دیگر مکان‌یاب‌های رونوشت SQLite را برای کلاینت‌ها synthesize نمی‌کنند.
- dreaming در memory-core دیگر با probe کردن فایل‌های JSONL ازدست‌رفته، ردیف‌های جلسه را prune نمی‌کند. cleanup مربوط به subagent به‌جای بررسی وجود filesystem از طریق API زمان اجرای جلسه انجام می‌شود. تست‌های transcript-ingestion آن به‌جای ایجاد fixtureهای `agents/<id>/sessions` یا placeholderهای مکان‌یاب، مستقیماً ردیف‌های SQLite را seed می‌کنند.
- نمایه‌سازی رونوشت memory ممکن است `transcript:<agentId>:<sessionId>` را به‌عنوان مسیر مجازی search-hit برای کمک‌کننده‌های citation/read در معرض بگذارد. منبع بادوام index رابطه‌ای است (`source_kind='sessions'`، `source_key='session:<sessionId>'`،
  `session_id=<sessionId>`)، بنابراین این مقدار مکان‌یاب رونوشت زمان اجرا نیست، مسیر filesystem نیست، و هرگز نباید دوباره به APIهای زمان اجرای جلسه پاس داده شود.
- وضعیت memory در doctor مربوط به Gateway شمارش‌های short-term recall و phase-signal را به‌جای `memory/.dreams/*.json` از ردیف‌های وضعیت Plugin در SQLite می‌خواند؛ خروجی CLI و doctor اکنون آن storage را به‌عنوان store SQLite برچسب می‌زند، نه یک مسیر.
- زمان اجرای memory-core، وضعیت CLI، متدهای doctor در Gateway، و facadeهای Plugin SDK دیگر فایل‌های قدیمی `.dreams/session-corpus` را audit یا archive نمی‌کنند.
  آن فایل‌ها فقط ورودی‌های migration هستند؛ doctor آن‌ها را به SQLite وارد می‌کند و پس از verification منبع را حذف می‌کند. ردیف‌های evidence فعال session-ingestion اکنون از مسیر مجازی SQLite یعنی `memory/session-ingestion/<day>.txt` استفاده می‌کنند؛ زمان اجرا هرگز از `.dreams/session-corpus` وضعیت نمی‌نویسد یا مشتق نمی‌کند.
- artifactهای عمومی memory-core رویدادهای host در SQLite را به‌عنوان artifact مجازی JSON یعنی `memory/events/memory-host-events.json` در معرض می‌گذارند؛ آن‌ها دیگر از مسیر منبع قدیمی
  `.dreams/events.jsonl` استفادهٔ دوباره نمی‌کنند.
- رجیستری‌های container/browser در sandbox اکنون از جدول SQLite مشترک
  `sandbox_registry_entries` با ستون‌های تایپ‌شدهٔ session، image، timestamp،
  backend/config و browser port استفاده می‌کنند. Doctor فایل‌های رجیستری JSON قدیمی یکپارچه و shardشده را وارد می‌کند و منابع موفق را حذف می‌کند. خواندن‌های زمان اجرا از ستون‌های تایپ‌شدهٔ ردیف به‌عنوان منبع حقیقت استفاده می‌کنند؛ `entry_json` فقط یک کپی replay/debug است.
- commitmentها اکنون به‌جای یک blob کل store در JSON، از جدول مشترک تایپ‌شدهٔ `commitments` استفاده می‌کنند. ذخیره‌های snapshot بر اساس شناسهٔ commitment، upsert می‌کنند و به‌جای پاک‌کردن و درج دوبارهٔ جدول، فقط ردیف‌های ازدست‌رفته را حذف می‌کنند. زمان اجرا commitmentها را از ستون‌های تایپ‌شدهٔ scope، delivery-window، status، attempt و text بارگذاری می‌کند؛ `record_json` فقط یک کپی replay/debug است. Doctor فایل قدیمی
  `commitments.json` را وارد می‌کند و پس از واردسازی موفق، آن را حذف می‌کند.
- تعریف‌های job در Cron، وضعیت schedule و تاریخچهٔ run دیگر writer یا reader زمان اجرای JSON ندارند. زمان اجرا از ردیف‌های `cron_jobs` با schedule تایپ‌شده استفاده می‌کند,
  ستون‌های payload، delivery، failure-alert، session، status، و runtime-state به‌همراه فرادادهٔ دارای نوع
  `cron_run_logs` برای وضعیت، خلاصهٔ عیب‌یابی، وضعیت/خطای تحویل،
  نشست/اجرا، مدل، و مجموع توکن‌ها. `job_json` فقط یک نسخهٔ بازپخش/اشکال‌زدایی است؛ `state_json` عیب‌یابی‌های تودرتوی
  زمان اجرا را نگه می‌دارد که هنوز فیلدهای پرس‌وجوی داغ ندارند، درحالی‌که زمان اجرا
  فیلدهای داغ وضعیت را از ستون‌های دارای نوع بازآب‌رسانی می‌کند. عیب‌یاب
  فایل‌های قدیمی `jobs.json`، `jobs-state.json`، و `runs/*.jsonl` را وارد می‌کند و
  منابع واردشده را حذف می‌کند. بازنویسی‌های هدف Plugin ردیف‌های مطابق `cron_jobs`
  را به‌روزرسانی می‌کنند، به‌جای اینکه کل ذخیره‌گاه cron را بارگذاری و جایگزین کنند.
- راه‌اندازی Gateway نشانگرهای قدیمی `notify: true` را در تصویرسازی زمان اجرا
  نادیده می‌گیرد. عیب‌یاب وقتی `cron.webhook` معتبر باشد آن‌ها را به تحویل صریح SQLite
  ترجمه می‌کند، وقتی تنظیم نشده باشد نشانگرهای بی‌اثر را حذف می‌کند، و وقتی webhook پیکربندی‌شده نامعتبر باشد
  آن‌ها را همراه با هشدار حفظ می‌کند.
- صف‌های تحویل خروجی و نشست اکنون وضعیت صف، نوع ورودی،
  کلید نشست، کانال، هدف، شناسهٔ حساب، تعداد تلاش مجدد، آخرین تلاش/خطا،
  وضعیت بازیابی، و نشانگرهای ارسال پلتفرم را به‌صورت ستون‌های دارای نوع در جدول مشترک
  `delivery_queue_entries` ذخیره می‌کنند. بازیابی زمان اجرا این فیلدهای داغ را از
  ستون‌های دارای نوع می‌خواند، و تغییرات تلاش مجدد/بازیابی آن ستون‌ها را مستقیماً
  بدون بازنویسی JSON بازپخش به‌روزرسانی می‌کنند. بار کامل JSON فقط به‌عنوان
  blob بازپخش/اشکال‌زدایی برای بدنه‌های پیام و دیگر داده‌های بازپخش سرد باقی می‌ماند.
- رکوردهای تصویر خروجی مدیریت‌شده اکنون از ردیف‌های مشترک دارای نوع
  `managed_outgoing_image_records` استفاده می‌کنند و بایت‌های رسانه همچنان در
  `media_blobs` ذخیره می‌شوند. رکورد JSON فقط به‌عنوان نسخهٔ بازپخش/اشکال‌زدایی باقی می‌ماند.
- ترجیحات انتخابگر مدل Discord، هش‌های استقرار فرمان، و پیوندهای thread
  اکنون از وضعیت مشترک SQLite مربوط به Plugin استفاده می‌کنند. برنامه‌های واردسازی JSON قدیمی آن‌ها در سطح
  setup/doctor مهاجرت Plugin مربوط به Discord قرار دارد، نه در کد مهاجرت هسته.
- آشکارسازهای واردسازی قدیمی Plugin از ماژول‌های نام‌گذاری‌شده برای عیب‌یاب مانند
  `doctor-legacy-state.ts` یا `doctor-state-imports.ts` استفاده می‌کنند؛ ماژول‌های عادی زمان اجرای کانال
  نباید آشکارسازهای JSON قدیمی را وارد کنند.
- مکان‌نماهای catchup و نشانگرهای حذف تکرار ورودی BlueBubbles اکنون از وضعیت مشترک SQLite
  مربوط به Plugin استفاده می‌کنند. برنامه‌های واردسازی JSON قدیمی آن‌ها در سطح
  setup/doctor مهاجرت Plugin مربوط به BlueBubbles قرار دارد، نه در کد مهاجرت هسته.
- offsetهای به‌روزرسانی Telegram، ردیف‌های کش استیکر، ردیف‌های کش پیام ارسال‌شده،
  ردیف‌های کش نام موضوع، و پیوندهای thread اکنون از وضعیت مشترک SQLite مربوط به Plugin
  استفاده می‌کنند. برنامه‌های واردسازی JSON قدیمی آن‌ها در سطح
  setup/doctor مهاجرت Plugin مربوط به Telegram قرار دارد، نه در کد مهاجرت هسته.
- مکان‌نماهای catchup مربوط به iMessage، نگاشت‌های short-id پاسخ، و ردیف‌های حذف تکرار sent-echo
  اکنون از وضعیت مشترک SQLite مربوط به Plugin استفاده می‌کنند. فایل‌های قدیمی `imessage/catchup/*.json`،
  `imessage/reply-cache.jsonl`، و `imessage/sent-echoes.jsonl` فقط ورودی‌های عیب‌یاب هستند.
- ردیف‌های حذف تکرار پیام Feishu اکنون به‌جای
  فایل‌های `feishu/dedup/*.json` از وضعیت مشترک SQLite مربوط به Plugin استفاده می‌کنند. برنامهٔ واردسازی JSON قدیمی آن در سطح
  setup/doctor مهاجرت Plugin مربوط به Feishu قرار دارد، نه در کد مهاجرت هسته.
- مکالمه‌ها، نظرسنجی‌ها، بافرهای آپلود معلق، و یادگیری‌های بازخورد
  Microsoft Teams اکنون از جدول‌های وضعیت/blob مشترک SQLite مربوط به Plugin استفاده می‌کنند. مسیر آپلود معلق
  از `plugin_blob_entries` استفاده می‌کند تا بافرهای رسانه به‌جای JSON با base64 به‌صورت SQLite BLOB
  ذخیره شوند. نام‌های helper زمان اجرا اکنون به‌جای نام‌گذاری ذخیره‌گاه فایلی `*-fs` از نام‌گذاری SQLite/وضعیت
  استفاده می‌کنند، و shim قدیمی `storePath` از این ذخیره‌گاه‌ها حذف شده است.
  برنامهٔ واردسازی JSON قدیمی آن در سطح setup/doctor مهاجرت Plugin مربوط به Microsoft Teams قرار دارد.
- رسانهٔ خروجی میزبانی‌شدهٔ Zalo اکنون به‌جای sidecarهای موقت JSON/bin
  مربوط به `openclaw-zalo-outbound-media` از `plugin_blob_entries` مشترک SQLite استفاده می‌کند.
- HTML و فرادادهٔ نمایشگر Diffها اکنون به‌جای فایل‌های موقت
  `meta.json`/`viewer.html` از `plugin_blob_entries` مشترک SQLite استفاده می‌کنند. خروجی‌های PNG/PDF رندرشده به‌صورت
  materializationهای موقت باقی می‌مانند، چون تحویل کانال هنوز به مسیر فایل نیاز دارد.
- سندهای مدیریت‌شدهٔ Canvas اکنون به‌جای دایرکتوری پیش‌فرض `state/canvas/documents`
  از `plugin_blob_entries` مشترک SQLite استفاده می‌کنند. میزبان Canvas این blobها را
  مستقیماً سرو می‌کند؛ فایل‌های محلی فقط برای محتوای صریح اپراتور در `host.root`
  یا materialization موقت وقتی یک خوانندهٔ پایین‌دستی رسانه به مسیر نیاز دارد ایجاد می‌شوند.
- تصمیم‌های ممیزی File Transfer اکنون به‌جای لاگ نامحدود زمان اجرای
  `audit/file-transfer.jsonl` از `plugin_state_entries` مشترک SQLite استفاده می‌کنند. عیب‌یاب
  فایل ممیزی JSONL قدیمی را در وضعیت Plugin وارد می‌کند و پس از واردسازی پاک
  منبع را حذف می‌کند.
- اجاره‌های فرایند ACPX و هویت نمونهٔ Gateway اکنون از وضعیت مشترک SQLite مربوط به Plugin
  استفاده می‌کنند. عیب‌یاب فایل قدیمی `gateway-instance-id` را در وضعیت Plugin وارد می‌کند
  و منبع را حذف می‌کند.
- اسکریپت‌های wrapper تولیدشدهٔ ACPX و خانهٔ ایزولهٔ Codex materialization موقت
  زیر ریشهٔ موقت OpenClaw هستند، نه وضعیت پایدار OpenClaw. رکوردهای پایدار زمان اجرای ACPX
  ردیف‌های اجارهٔ SQLite و gateway-instance هستند؛ سطح پیکربندی قدیمی `stateDir` در ACPX
  حذف شده است، چون دیگر هیچ وضعیت زمان اجرایی در آنجا نوشته نمی‌شود.
- پیوست‌های رسانه‌ای Gateway اکنون از جدول مشترک SQLite به نام `media_blobs`
  به‌عنوان ذخیره‌گاه canonical بایت استفاده می‌کنند. مسیرهای محلی برگردانده‌شده به سطوح سازگاری کانال و sandbox
  materializationهای موقت ردیف پایگاه‌داده هستند، نه ذخیره‌گاه پایدار رسانه. allowlistهای رسانهٔ زمان اجرا دیگر شامل ریشه‌های قدیمی
  `$OPENCLAW_STATE_DIR/media` یا `media` در دایرکتوری پیکربندی نیستند؛ آن دایرکتوری‌ها
  فقط منابع واردسازی عیب‌یاب هستند.
- تکمیل Shell دیگر فایل‌های کش `$OPENCLAW_STATE_DIR/completions/*` را نمی‌نویسد.
  مسیرهای smoke نصب، عیب‌یاب، به‌روزرسانی، و انتشار به‌جای فایل‌های کش تکمیل پایدار
  از خروجی تکمیل تولیدشده یا source کردن پروفایل استفاده می‌کنند.
- مرحله‌بندی آپلود Skills در Gateway اکنون از ردیف‌های مشترک `skill_uploads` استفاده می‌کند. فرادادهٔ آپلود،
  کلیدهای idempotency، و بایت‌های آرشیو در SQLite قرار دارند؛ نصب‌کننده
  فقط هنگام اجرای نصب یک مسیر آرشیو materialize‌شدهٔ موقت دریافت می‌کند.
- پیوست‌های inline مربوط به subagent دیگر زیر
  `.openclaw/attachments/*` در workspace materialize نمی‌شوند. مسیر spawn ورودی‌های seed در SQLite VFS را آماده می‌کند،
  اجراهای inline آن ورودی‌ها را در namespace scratch زمان اجرای per-agent seed می‌کنند،
  و ابزارهای disk-backed آن scratch SQLite را برای مسیرهای پیوست overlay می‌کنند. ستون‌های قدیمی رجیستری attachment-dir مربوط به subagent-run و hookهای پاک‌سازی حذف شده‌اند.
- آب‌رسانی تصویر CLI دیگر فایل‌های کش پایدار `openclaw-cli-images` را نگه نمی‌دارد.
  backendهای خارجی CLI همچنان مسیر فایل دریافت می‌کنند، اما آن مسیرها
  materializationهای موقت per-run همراه با پاک‌سازی هستند.
- عیب‌یابی‌های cache-trace، عیب‌یابی‌های payload مربوط به Anthropic، عیب‌یابی‌های خام جریان مدل،
  رویدادهای timeline عیب‌یابی، و bundleهای پایداری Gateway اکنون به‌جای فایل‌های
  `logs/*.jsonl` یا `logs/stability/*.json` ردیف‌های SQLite می‌نویسند.
  پرچم‌های override مسیر زمان اجرا و متغیرهای محیطی حذف شده‌اند؛ فرمان‌های export/debug
  می‌توانند فایل‌ها را صریحاً از ردیف‌های پایگاه‌داده materialize کنند.
- همراه macOS دیگر writer چرخشی `diagnostics.jsonl` ندارد. لاگ‌های برنامه
  به unified logging می‌روند، و عیب‌یابی‌های پایدار Gateway با پشتوانهٔ SQLite باقی می‌مانند.
- فهرست رکوردهای port-guardian در macOS اکنون به‌جای فایل JSON در Application Support
  یا blob تک‌نمونهٔ opaque از ردیف‌های مشترک دارای نوع SQLite به نام
  `macos_port_guardian_records` استفاده می‌کند.
- قفل‌های singleton مربوط به Gateway اکنون به‌جای فایل‌های قفل temp-dir از ردیف‌های مشترک دارای نوع SQLite
  به نام `state_leases` زیر scope
  `gateway_locks` استفاده می‌کنند. اسناد عیب‌یابی Fly و OAuth اکنون به‌جای پاک‌سازی کهنهٔ file-lock
  به lease SQLite / قفل refresh احراز هویت اشاره می‌کنند.
- وضعیت sentinel راه‌اندازی مجدد Gateway اکنون به‌جای `restart-sentinel.json` از ردیف‌های مشترک دارای نوع SQLite
  به نام `gateway_restart_sentinel` استفاده می‌کند؛ زمان اجرا
  نوع sentinel، وضعیت، مسیریابی، پیام، continuation، و آمار را از
  ستون‌های دارای نوع می‌خواند. `payload_json` فقط یک نسخهٔ بازپخش/اشکال‌زدایی است. کد زمان اجرا
  ردیف SQLite را مستقیماً پاک می‌کند و دیگر plumbing پاک‌سازی فایل را حمل نمی‌کند.
- intent راه‌اندازی مجدد Gateway و وضعیت handoff سرپرست اکنون به‌جای sidecarهای
  `gateway-restart-intent.json` و
  `gateway-supervisor-restart-handoff.json` از ردیف‌های مشترک دارای نوع SQLite
  به نام‌های `gateway_restart_intent` و `gateway_restart_handoff` استفاده می‌کنند.
- هماهنگی singleton مربوط به Gateway اکنون به‌جای نوشتن فایل‌های `gateway.<hash>.lock` از ردیف‌های دارای نوع `state_leases` زیر
  `gateway_locks` استفاده می‌کند. ردیف lease مالک قفل، انقضا، heartbeat، و payload اشکال‌زدایی را
  در اختیار دارد؛ SQLite مرز atomic acquire/release را در اختیار دارد. گزینهٔ دایرکتوری file-lock بازنشسته
  حذف شده است؛ تست‌ها مستقیماً از هویت ردیف SQLite استفاده می‌کنند.
- helper قدیمی و بدون ارجاع گزارش استفادهٔ cron که فایل‌های `cron/runs/*.jsonl`
  را scan می‌کرد حذف شد. گزارش‌های تاریخچهٔ اجرای Cron باید ردیف‌های دارای نوع SQLite
  به نام `cron_run_logs` را بخوانند.
- بازیابی راه‌اندازی مجدد نشست اصلی اکنون agentهای candidate را از طریق رجیستری
  SQLite به نام `agent_databases` کشف می‌کند، نه با scan کردن دایرکتوری‌های
  `agents/*/sessions`.
- بازیابی خرابی نشست Gemini اکنون فقط ردیف نشست SQLite را حذف می‌کند؛
  دیگر به gate قدیمی `storePath` نیاز ندارد و تلاش نمی‌کند مسیر مشتق‌شدهٔ transcript JSONL
  را unlink کند.
- مدیریت override مسیر اکنون مقادیر محیطی literal `undefined`/`null` را
  تنظیم‌نشده در نظر می‌گیرد و از پایگاه‌داده‌های تصادفی `undefined/state/*.sqlite`
  در ریشهٔ repo هنگام تست‌ها یا handoffهای shell جلوگیری می‌کند.
- اثرانگشت‌های سلامت پیکربندی اکنون به‌جای `logs/config-health.json` از ردیف‌های مشترک دارای نوع SQLite به نام `config_health_entries`
  استفاده می‌کنند و فایل پیکربندی عادی را به‌عنوان تنها سند پیکربندی غیرcredential نگه می‌دارند. همراه macOS فقط
  وضعیت سلامت process-local را نگه می‌دارد و sidecar قدیمی JSON را دوباره ایجاد نمی‌کند.
- زمان اجرای پروفایل احراز هویت دیگر فایل‌های JSON credential را وارد یا نمی‌نویسد. ذخیره‌گاه canonical credential
  SQLite است؛ `auth-profiles.json`، فایل‌های per-agent
  `auth.json`، و `credentials/oauth.json` مشترک ورودی‌های مهاجرت عیب‌یاب هستند
  که پس از واردسازی حذف می‌شوند.
- تست‌های ذخیره/وضعیت پروفایل احراز هویت اکنون مستقیماً جدول‌های دارای نوع احراز هویت SQLite را assert می‌کنند
  و فقط از نام فایل‌های auth-profile قدیمی برای ورودی‌های مهاجرت عیب‌یاب استفاده می‌کنند.
- `openclaw secrets apply` فقط فایل پیکربندی، فایل env، و ذخیره‌گاه
  auth-profile در SQLite را scrub می‌کند. دیگر منطق سازگاری‌ای را که
  `auth.json` بازنشستهٔ per-agent را ویرایش می‌کرد حمل نمی‌کند؛ عیب‌یاب مالک واردسازی و حذف آن فایل است.
- برنامه‌های مهاجرت secret در Hermes و applyها پروفایل‌های API-key واردشده را مستقیماً
  در ذخیره‌گاه auth-profile در SQLite قرار می‌دهند. دیگر
  `auth-profiles.json` را به‌عنوان هدف میانی نمی‌نویسد یا verify نمی‌کند.
- اسناد احراز هویت کاربرمحور اکنون به‌جای
  گفتن به کاربران برای inspect یا copy کردن `auth-profiles.json`، `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` را توصیف می‌کنند؛ نام‌های قدیمی OAuth/auth JSON
  فقط به‌عنوان ورودی‌های واردسازی عیب‌یاب مستند باقی می‌مانند.
- helperهای مسیر وضعیت هسته دیگر فایل بازنشستهٔ `credentials/oauth.json`
  را expose نمی‌کنند. نام فایل قدیمی محلیِ مسیر واردسازی auth در عیب‌یاب است.
- اسناد نصب، امنیت، onboarding، احراز هویت مدل، و SecretRef اکنون
  ردیف‌های auth-profile در SQLite و پشتیبان‌گیری/مهاجرت کل وضعیت را به‌جای
  فایل‌های JSON auth-profile per-agent توصیف می‌کنند.
- کشف مدل PI اکنون credentialهای canonical را به ذخیره‌سازی auth درون‌حافظه‌ای
  `pi-coding-agent` پاس می‌دهد. دیگر هنگام کشف، `auth.json` per-agent را
  ایجاد، scrub، یا نمی‌نویسد.
- تنظیمات trigger و مسیریابی Voice Wake اکنون به‌جای `settings/voicewake.json`،
  `settings/voicewake-routing.json`، یا ردیف‌های عمومی opaque از جدول‌های مشترک دارای نوع SQLite
  استفاده می‌کنند؛ عیب‌یاب فایل‌های JSON قدیمی را وارد می‌کند و پس از
  مهاجرت موفق آن‌ها را حذف می‌کند.
- وضعیت بررسی به‌روزرسانی اکنون به‌جای `update-check.json` یا blob عمومی opaque از یک ردیف مشترک دارای نوع
  `update_check_state` استفاده می‌کند؛ عیب‌یاب
  فایل JSON قدیمی را وارد می‌کند و پس از مهاجرت موفق آن را حذف می‌کند.
- وضعیت سلامت پیکربندی اکنون به‌جای `logs/config-health.json` یا blob عمومی opaque از ردیف‌های مشترک دارای نوع `config_health_entries`
  استفاده می‌کند؛ عیب‌یاب
  فایل JSON قدیمی را وارد می‌کند و پس از مهاجرت موفق آن را حذف می‌کند.
- تأییدیه‌های binding مکالمهٔ Plugin اکنون به‌جای وضعیت مشترک opaque در SQLite یا
  `plugin-binding-approvals.json`؛ فایل قدیمی ورودی مهاجرت doctor است.
- اتصال‌های عمومی گفت‌وگوی فعلی اکنون به‌جای بازنویسی
  `bindings/current-conversations.json`، ردیف‌های تایپ‌شده
  `current_conversation_bindings` را ذخیره می‌کنند؛ doctor فایل JSON قدیمی را وارد می‌کند و
  پس از مهاجرت موفق آن را حذف می‌کند.
- دفترکل‌های همگام‌سازی منبع‌های واردشده Memory Wiki اکنون به‌جای بازنویسی `.openclaw-wiki/source-sync.json`،
  برای هر کلید vault/source یک ردیف وضعیت Plugin در SQLite ذخیره می‌کنند؛
  ارائه‌دهنده مهاجرت دفترکل JSON قدیمی را وارد و حذف می‌کند.
- رکوردهای اجرای واردسازی ChatGPT در Memory Wiki اکنون به‌جای نوشتن
  `.openclaw-wiki/import-runs/*.json`، برای هر شناسه vault/run یک ردیف وضعیت Plugin در SQLite ذخیره می‌کنند.
  اسنپ‌شات‌های بازگردانی تا زمانی که بایگانی اسنپ‌شات اجرای واردسازی
  به ذخیره‌سازی blob منتقل شود، همچنان فایل‌های صریح vault می‌مانند.
- digestهای کامپایل‌شده Memory Wiki اکنون به‌جای نوشتن
  `.openclaw-wiki/cache/agent-digest.json` و
  `.openclaw-wiki/cache/claims.jsonl`، ردیف‌های blob مربوط به Plugin در SQLite ذخیره می‌کنند. ارائه‌دهنده مهاجرت فایل‌های cache قدیمی را وارد می‌کند
  و وقتی پوشه cache خالی شد آن را حذف می‌کند.
- رهگیری نصب Skills در ClawHub اکنون به‌جای نوشتن یا خواندن sidecarهای
  `.clawhub/lock.json` و
  `.clawhub/origin.json` در زمان اجرا، برای هر workspace/skill یک ردیف وضعیت Plugin در SQLite ذخیره می‌کند. کد زمان اجرا به‌جای انتزاع‌های lockfile/origin با شکل فایل، از آبجکت‌های وضعیت نصب رهگیری‌شده استفاده می‌کند. Doctor
  sidecarهای قدیمی را از workspaceهای agent پیکربندی‌شده وارد می‌کند و
  پس از واردسازی پاک، آن‌ها را حذف می‌کند.
- نمایه Plugin نصب‌شده اکنون به‌جای `plugins/installs.json`، ردیف singleton تایپ‌شده SQLite مشترک
  `installed_plugin_index` را می‌خواند و می‌نویسد؛ فایل JSON قدیمی
  فقط ورودی مهاجرت doctor است و پس از واردسازی حذف می‌شود.
- کمک‌کننده مسیر قدیمی `plugins/installs.json` اکنون در کد قدیمی doctor قرار دارد.
  ماژول‌های نمایه Plugin زمان اجرا فقط گزینه‌های ماندگاری مبتنی بر SQLite را ارائه می‌کنند،
  نه مسیر فایل JSON.
- sentinel راه‌اندازی مجدد Gateway، intent راه‌اندازی مجدد، و وضعیت handoff سرپرست اکنون به‌جای blobهای عمومی
  و مبهم، از ردیف‌های تایپ‌شده SQLite مشترک (`gateway_restart_sentinel`,
  `gateway_restart_intent`, و `gateway_restart_handoff`) استفاده می‌کنند. کد راه‌اندازی مجدد زمان اجرا هیچ قرارداد sentinel/intent/handoff
  با شکل فایل ندارد.
- cache همگام‌سازی Matrix، فراداده ذخیره‌سازی، اتصال‌های thread، نشانگرهای dedupe ورودی،
  وضعیت cooldown راستی‌آزمایی آغاز به کار، اسنپ‌شات‌های رمزنگاری IndexedDB در SDK،
  credentials، و کلیدهای recovery اکنون از جدول‌های وضعیت/blob مشترک Plugin در SQLite استفاده می‌کنند.
  ساختارهای مسیر زمان اجرا دیگر مسیر فراداده `storage-meta.json` را ارائه نمی‌کنند؛
  این نام فایل فقط ورودی مهاجرت قدیمی است. طرح واردسازی JSON قدیمی آن‌ها
  در سطح setup/doctor migration مربوط به Plugin ماتریس قرار دارد.
- آغاز به کار Matrix دیگر وضعیت فایل قدیمی Matrix را اسکن، گزارش، یا تکمیل نمی‌کند.
  تشخیص فایل Matrix، ایجاد اسنپ‌شات رمزنگاری قدیمی، وضعیت مهاجرت restore کلید اتاق،
  واردسازی، و حذف منبع همگی در مالکیت doctor هستند.
- barrelهای مهاجرت زمان اجرای Matrix حذف شدند. کمک‌کننده‌های تشخیص و جهش وضعیت/رمزنگاری قدیمی
  به‌جای اینکه بخشی از سطح API زمان اجرا باشند، مستقیماً توسط doctor ماتریس وارد می‌شوند.
- نشانگرهای استفاده مجدد از اسنپ‌شات مهاجرت Matrix اکنون به‌جای
  `matrix/migration-snapshot.json` در وضعیت Plugin در SQLite قرار دارند؛ doctor همچنان می‌تواند همان
  بایگانی پیش از مهاجرت تاییدشده را بدون نوشتن فایل وضعیت sidecar دوباره استفاده کند.
- cursorهای bus در Nostr و وضعیت انتشار profile اکنون از وضعیت مشترک Plugin در SQLite استفاده می‌کنند.
  طرح واردسازی JSON قدیمی آن‌ها در سطح setup/doctor migration مربوط به Plugin ناستر قرار دارد.
- toggleهای نشست Active Memory اکنون به‌جای
  `session-toggles.json` از وضعیت مشترک Plugin در SQLite استفاده می‌کنند؛ روشن‌کردن دوباره memory ردیف را حذف می‌کند
  نه اینکه یک آبجکت JSON را بازنویسی کند.
- پیشنهادهای Skill Workshop و شمارنده‌های review اکنون به‌جای storeهای
  `skill-workshop/<workspace>.json` به‌ازای هر workspace، از وضعیت مشترک Plugin در SQLite استفاده می‌کنند. هر
  proposal یک ردیف جداگانه زیر `skill-workshop/proposals` است و شمارنده review
  یک ردیف جداگانه زیر `skill-workshop/reviews` است.
- اجراهای subagent مربوط به reviewer در Skill Workshop اکنون به‌جای ایجاد مسیرهای sidecar نشست
  `skill-workshop/<sessionId>.json`، از resolver transcript نشست زمان اجرا استفاده می‌کنند.
- leaseهای فرایند ACPX اکنون به‌جای registry تمام‌فایلی `process-leases.json`،
  از وضعیت مشترک Plugin در SQLite زیر
  `acpx/process-leases` استفاده می‌کنند. هر lease به‌عنوان ردیف خودش ذخیره می‌شود و
  پاکسازی stale-process در آغاز به کار را بدون مسیر بازنویسی JSON در زمان اجرا حفظ می‌کند.
- اسکریپت‌های wrapper در ACPX و home ایزوله Codex در ریشه temp OpenClaw تولید می‌شوند.
  آن‌ها در صورت نیاز دوباره ساخته می‌شوند و ورودی backup یا migration نیستند.
- ماندگاری registry اجرای subagent از ردیف‌های مشترک تایپ‌شده `subagent_runs` استفاده می‌کند. مسیر
  قدیمی `subagents/runs.json` اکنون فقط ورودی مهاجرت doctor است و
  نام‌های کمک‌کننده زمان اجرا دیگر لایه وضعیت را disk-backed توصیف نمی‌کنند.
  تست‌های زمان اجرا دیگر fixtureهای نامعتبر یا خالی `runs.json` برای اثبات
  رفتار registry نمی‌سازند؛ آن‌ها مستقیماً ردیف‌های SQLite را seed/read می‌کنند.
- Backup پیش از بایگانی، پوشه state را stage می‌کند، فایل‌های غیردیتابیس را کپی می‌کند،
  دیتابیس‌های `*.sqlite` را با `VACUUM INTO` اسنپ‌شات می‌گیرد، sidecarهای زنده WAL/SHM را
  حذف می‌کند، فراداده اسنپ‌شات را در manifest بایگانی ثبت می‌کند، و
  اجراهای backup کامل‌شده را همراه با manifest بایگانی در SQLite ثبت می‌کند. `openclaw backup
create` به‌طور پیش‌فرض بایگانی نوشته‌شده را اعتبارسنجی می‌کند؛ `--no-verify` مسیر سریع
  صریح است.
- `openclaw backup restore` پیش از استخراج بایگانی را اعتبارسنجی می‌کند، از manifest نرمال‌شده
  verifier دوباره استفاده می‌کند، و assetهای manifest تاییدشده را به مسیرهای source ثبت‌شده‌شان
  برمی‌گرداند. برای نوشتن به `--yes` نیاز دارد و برای طرح restore از `--dry-run`
  پشتیبانی می‌کند.
- فیلتر قدیمی مسیر volatile در backup حذف شده است. Backup دیگر به skip list در live-tar
  برای فایل‌های JSON/JSONL قدیمی نشست یا cron نیاز ندارد، چون اسنپ‌شات‌های SQLite
  پیش از ایجاد بایگانی stage می‌شوند.
- آماده‌سازی workspace در setup ساده و onboarding دیگر پوشه‌های
  `agents/<agentId>/sessions/` ایجاد نمی‌کند. آن‌ها فقط config/workspace را ایجاد می‌کنند؛
  ردیف‌های نشست SQLite و ردیف‌های transcript در صورت نیاز در دیتابیس
  per-agent ساخته می‌شوند.
- ترمیم مجوز امنیتی اکنون به‌جای `sessions.json` و فایل‌های transcript
  JSONL، دیتابیس‌های SQLite global و per-agent به‌همراه sidecarهای WAL/SHM را هدف می‌گیرد.
- نام‌های زمان اجرای registry sandbox اکنون به‌جای حمل اصطلاحات قدیمی registry JSON در store فعال،
  مستقیماً انواع registry SQLite را توصیف می‌کنند.
- `openclaw reset --scope config+creds+sessions` دیتابیس‌های per-agent
  `openclaw-agent.sqlite` به‌همراه sidecarهای WAL/SHM را حذف می‌کند، نه فقط پوشه‌های قدیمی
  `sessions/`.
- کمک‌کننده‌های نشست تجمیعی Gateway اکنون از نام‌های entry-oriented استفاده می‌کنند:
  `loadCombinedSessionEntriesForGateway` مقدار `{ databasePath, entries }` را برمی‌گرداند.
  نام‌گذاری قدیمی combined-store از callerهای زمان اجرا حذف شده است.
- seed کردن channel در Docker MCP اکنون به‌جای ایجاد
  `sessions.json` و transcript در JSONL، ردیف اصلی نشست و eventهای transcript را
  در دیتابیس SQLite per-agent می‌نویسد.
- hook همراه session-memory اکنون context نشست قبلی را از
  SQLite با `{agentId, sessionId}` resolve می‌کند. دیگر مسیرهای transcript یا پوشه‌های
  `workspace/sessions` را اسکن، ذخیره، یا سنتز نمی‌کند.
- hook همراه command-logger اکنون به‌جای append کردن
  `logs/commands.log`، ردیف‌های audit فرمان را در جدول مشترک SQLite
  `command_log_entries` می‌نویسد.
- allowlistهای pair کردن channel اکنون در زمان اجرا و در Plugin SDK فقط کمک‌کننده‌های خواندن/نوشتن مبتنی بر SQLite را ارائه می‌کنند.
  resolver مسیر قدیمی `*-allowFrom.json` و file reader
  فقط زیر کد واردسازی قدیمی doctor قرار دارند.
- `migration_runs` اجرای مهاجرت‌های وضعیت قدیمی را همراه با status،
  timestampها، و گزارش‌های JSON ثبت می‌کند.
- `migration_sources` هر source فایل قدیمی واردشده را همراه با hash، size،
  record count، target table، run id، status، و وضعیت source-removal ثبت می‌کند.
- `backup_runs` مسیرهای بایگانی backup، status، و manifestهای JSON را ثبت می‌کند.
- schema global یک جدول registry استفاده‌نشده `agents` نگه نمی‌دارد. کشف دیتابیس agent
  تا زمانی که runtime مالک واقعی agent-record داشته باشد، registry canonical
  `agent_databases` است.
- config تولیدشده کاتالوگ model در ردیف‌های تایپ‌شده SQLite global
  `agent_model_catalogs` با کلید پوشه agent ذخیره می‌شود. callerهای زمان اجرا از
  `ensureOpenClawModelCatalog` استفاده می‌کنند؛ هیچ API سازگاری `models.json` در
  کد زمان اجرا وجود ندارد. پیاده‌سازی SQLite را می‌نویسد و registry توکار PI
  از همان payload ذخیره‌شده hydrate می‌شود، بدون اینکه فایل `models.json` ایجاد کند.
- export markdown مربوط به transcript نشست QMD و config
  `memory.qmd.sessions` حذف شدند. هیچ مجموعه transcript QMD، هیچ مسیر زمان اجرای
  `qmd/sessions*`، و هیچ bridge حافظه نشست file-backed وجود ندارد.
- runtime مربوط به memory-core کمک‌کننده‌های indexing transcript SQLite را از
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` وارد می‌کند، نه از
  subpath مربوط به QMD SDK. subpath مربوط به QMD فقط برای callerهای خارجی، تا زمانی که cleanup عمده SDK بتواند آن را حذف کند،
  یک re-export سازگار نگه می‌دارد.
- `index.sqlite` خود QMD اکنون یک materialization موقت زمان اجرا است که توسط
  جدول اصلی SQLite `plugin_blob_entries` پشتیبانی می‌شود. Runtime دیگر sidecar پایدار
  `~/.openclaw/agents/<agentId>/qmd` ایجاد نمی‌کند.
- Plugin اختیاری `memory-lancedb` دیگر
  `~/.openclaw/memory/lancedb` را به‌عنوان store ضمنی مدیریت‌شده توسط OpenClaw ایجاد نمی‌کند. این یک
  backend خارجی LanceDB است و تا زمانی که operator یک
  `dbPath` صریح پیکربندی کند، غیرفعال می‌ماند.
- `check:database-first-legacy-stores` source جدید runtime را که نام‌های store قدیمی را با APIهای filesystem سبک نوشتن جفت کند، fail می‌کند. همچنین source زمان اجرایی را که نشانگرهای بازنشسته bridge transcript یعنی
  `transcriptLocator` یا `sqlite-transcript://...` را دوباره معرفی کند، fail می‌کند. کدهای migration، doctor، import،
  و export صریح non-session همچنان مجاز هستند. نام‌های گسترده‌تر قرارداد قدیمی
  مانند `sessionFile`، `storePath`، و facadeهای دوره فایلی قدیمی `SessionManager`
  هنوز مالک فعلی دارند و پیش از آنکه بتوانند به یک preflight check الزامی تبدیل شوند،
  به کار جداگانه guard مهاجرت نیاز دارند. این guard اکنون storeهای runtime
  `cache/*.json`، sidecarهای عمومی
  `thread-bindings.json`، JSON مربوط به cron state/run-log، JSON سلامت config،
  sidecarهای restart و lock، تنظیمات Voice Wake، تاییدهای binding مربوط به Plugin،
  JSON نمایه Plugin نصب‌شده، JSONL audit مربوط به File Transfer، logهای فعالیت Memory Wiki،
  log متنی قدیمی `command-logger` همراه، و knobهای diagnostics مربوط به pi-mono raw-stream JSONL را هم پوشش می‌دهد. همچنین نام‌های قدیمی ماژول legacy doctor در سطح root را ممنوع می‌کند تا
  کد سازگاری زیر `src/commands/doctor/` بماند. handlerهای debug در Android
  نیز به‌جای stage کردن فایل‌های cache یعنی `camera_debug.log` یا
  `debug_logs.txt`، از خروجی logcat/in-memory استفاده می‌کنند.

## شکل طرحوارهٔ هدف

طرحواره‌ها را صریح نگه دارید. وضعیت زمان اجرای متعلق به میزبان از جدول‌های نوع‌دار استفاده می‌کند. وضعیت
مبهم متعلق به Plugin از `plugin_state_entries` / `plugin_blob_entries` استفاده می‌کند؛ هیچ جدول
عمومی `kv` برای میزبان وجود ندارد.

پایگاه‌دادهٔ سراسری:

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

پایگاه‌دادهٔ عامل:

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

جست‌وجوی آینده می‌تواند بدون تغییر جدول‌های رویداد مرجع، جدول‌های FTS اضافه کند:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

مقادیر بزرگ باید از ستون‌های `blob` استفاده کنند، نه کدگذاری رشته‌ای JSON. `value_json` را برای داده‌های ساختاریافتهٔ کوچک نگه دارید که باید با ابزارهای سادهٔ SQLite قابل بررسی بمانند.

`agent_databases` رجیستری مرجع برای این شاخه است. تا زمانی که مالک واقعی رکورد عامل وجود ندارد، جدول `agents` اضافه نکنید؛ پیکربندی عامل در `openclaw.json` باقی می‌ماند.

## شکل مهاجرت Doctor

Doctor باید یک گام مهاجرت صریح را فراخوانی کند که قابل گزارش‌دهی و قابل اجرای دوباره به‌صورت ایمن باشد:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` پس از پیش‌بررسی معمول پیکربندی، پیاده‌سازی مهاجرت وضعیت را فراخوانی می‌کند و پیش از درون‌ریزی، یک نسخهٔ پشتیبان تأییدشده می‌سازد. راه‌اندازی زمان اجرا و `openclaw migrate` نباید فایل‌های وضعیت قدیمی OpenClaw را درون‌ریزی کنند.

ویژگی‌های مهاجرت:

- یک گذر مهاجرت همهٔ منابع فایل قدیمی را کشف می‌کند و پیش از تغییر هر چیز، یک طرح تولید می‌کند.
- Doctor پیش از درون‌ریزی فایل‌های قدیمی، یک آرشیو پشتیبان پیشامهاجرت تأییدشده ایجاد می‌کند.
- درون‌ریزی‌ها ایدمپوتنت هستند و بر اساس مسیر منبع، mtime، اندازه، هش، و جدول مقصد کلیدگذاری می‌شوند.
- فایل‌های منبع موفق پس از commit شدن پایگاه‌دادهٔ مقصد، حذف یا آرشیو می‌شوند.
- درون‌ریزی‌های ناموفق منبع را دست‌نخورده می‌گذارند و یک هشدار در `migration_runs` ثبت می‌کنند.
- کد زمان اجرا پس از وجود داشتن مهاجرت، فقط SQLite را می‌خواند.
- هیچ مسیر downgrade/export-to-runtime-files لازم نیست.

## فهرست مهاجرت

این‌ها را به پایگاه‌دادهٔ سراسری منتقل کنید:

- نوشتن‌های زمان اجرای رجیستری وظیفه اکنون از پایگاه داده مشترک استفاده می‌کنند؛
  واردکننده سایدکار عرضه‌نشده `tasks/runs.sqlite` حذف شده است. ذخیره‌های اسنپ‌شات بر اساس شناسه وظیفه درج یا به‌روزرسانی می‌شوند
  و فقط ردیف‌های وظیفه/تحویلِ موجودنبودن را حذف می‌کنند.
- نوشتن‌های زمان اجرای Task Flow اکنون از پایگاه داده مشترک استفاده می‌کنند؛
  واردکننده سایدکار عرضه‌نشده `tasks/flows/registry.sqlite` حذف شده است. ذخیره‌های اسنپ‌شات
  بر اساس شناسه جریان درج یا به‌روزرسانی می‌شوند و فقط ردیف‌های جریانِ موجودنبودن را حذف می‌کنند.
- نوشتن‌های زمان اجرای وضعیت Plugin اکنون از پایگاه داده مشترک استفاده می‌کنند؛
  واردکننده سایدکار عرضه‌نشده `plugin-state/state.sqlite` حذف شده است.
- جست‌وجوی حافظه داخلی دیگر به‌صورت پیش‌فرض از `memory/<agentId>.sqlite` استفاده نمی‌کند؛ جدول‌های
  ایندکس آن در پایگاه داده عاملِ مالک قرار دارند و انتخاب صریح سایدکار
  `memorySearch.store.path` به مهاجرت پیکربندی doctor بازنشسته شده است.
- بازایندکس حافظه داخلی فقط جدول‌های متعلق به حافظه را در پایگاه داده عامل بازنشانی می‌کند.
  نباید کل فایل SQLite را جایگزین کند، چون همان پایگاه داده مالک
  نشست‌ها، رونوشت‌ها، ردیف‌های VFS، مصنوعات، و کش‌های زمان اجرا است.
- رجیستری‌های کانتینر/مرورگر sandbox از JSON یکپارچه و قطعه‌بندی‌شده. نوشتن‌های زمان اجرا
  اکنون از پایگاه داده مشترک استفاده می‌کنند؛ واردسازی JSON قدیمی باقی می‌ماند.
- تعریف‌های کار Cron، وضعیت زمان‌بندی، و تاریخچه اجرا اکنون از SQLite مشترک استفاده می‌کنند؛
  doctor فایل‌های قدیمی `jobs.json`، `jobs-state.json`، و
  `cron/runs/*.jsonl` را وارد/حذف می‌کند
- هویت/احراز هویت دستگاه، push، بررسی به‌روزرسانی، تعهدها، کش مدل OpenRouter،
  ایندکس Pluginهای نصب‌شده، و اتصال‌های app-server
- رکوردهای جفت‌سازی و bootstrap دستگاه/Node اکنون از جدول‌های SQLite نوع‌دار استفاده می‌کنند
- مشترکان اعلان device-pair و نشانگرهای درخواست تحویل‌شده اکنون به‌جای
  `device-pair-notify.json` از جدول plugin-state مشترک SQLite استفاده می‌کنند.
- رکوردهای تماس voice-call اکنون به‌جای `calls.jsonl` از جدول plugin-state مشترک SQLite زیر فضای نام
  `voice-call` / `calls` استفاده می‌کنند؛ CLI مربوط به Plugin
  تاریخچه تماس مبتنی بر SQLite را دنبال و خلاصه می‌کند.
- نشست‌های Gateway مربوط به QQBot، رکوردهای کاربر شناخته‌شده، و کش نقل‌قول ref-index اکنون به‌جای
  `session-*.json`، `known-users.json`، و
  `ref-index.jsonl` از وضعیت Plugin در SQLite زیر فضاهای نام `qqbot` (`sessions`, `known-users`,
  `ref-index`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به QQBot فایل‌های قدیمی را وارد و حذف می‌کند.
- ترجیحات انتخابگر مدل Discord، هش‌های استقرار فرمان، و اتصال‌های thread
  اکنون به‌جای `model-picker-preferences.json`، `command-deploy-cache.json`، و
  `thread-bindings.json` از وضعیت Plugin در SQLite زیر فضاهای نام `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به Discord فایل‌های قدیمی را وارد و
  حذف می‌کند.
- مکان‌نماهای catchup و نشانگرهای حذف تکرار ورودی BlueBubbles اکنون به‌جای
  `bluebubbles/catchup/*.json` و
  `bluebubbles/inbound-dedupe/*.json` از وضعیت Plugin در SQLite زیر فضاهای نام `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به BlueBubbles
  فایل‌های قدیمی را وارد و حذف می‌کند.
- آفست‌های به‌روزرسانی Telegram، ورودی‌های کش استیکر، ورودی‌های کش پیام زنجیره پاسخ،
  ورودی‌های کش پیام ارسال‌شده، ورودی‌های کش نام موضوع، و اتصال‌های thread
  اکنون به‌جای `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, و
  `thread-bindings-*.json` از وضعیت Plugin در SQLite زیر فضاهای نام `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به Telegram فایل‌های قدیمی را وارد و
  حذف می‌کند.
- مکان‌نماهای catchup در iMessage، نگاشت‌های short-id پاسخ، و ردیف‌های حذف تکرار sent-echo
  اکنون به‌جای `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, و `imessage/sent-echoes.jsonl` از وضعیت Plugin در SQLite زیر فضاهای نام `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به iMessage
  فایل‌های قدیمی را وارد و حذف می‌کند.
- مکالمه‌ها، نظرسنجی‌ها، توکن‌های SSO، و یادگیری‌های بازخورد Microsoft Teams اکنون
  به‌جای `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, و `*.learnings.json` از فضاهای نام وضعیت Plugin در SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به
  Microsoft Teams فایل‌های قدیمی را وارد و بایگانی می‌کند.
  بارگذاری‌های در انتظار یک کش کوتاه‌عمر SQLite هستند و فایل‌های کش JSON قدیمی
  مهاجرت داده نمی‌شوند.
- کش همگام‌سازی Matrix، فراداده ذخیره‌سازی، اتصال‌های thread، نشانگرهای حذف تکرار ورودی،
  وضعیت cooldown تأیید راه‌اندازی، اعتبارنامه‌ها، کلیدهای بازیابی، و اسنپ‌شات‌های رمزنگاری IndexedDB مربوط به SDK
  اکنون به‌جای `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, و `crypto-idb-snapshot.json` از فضاهای نام وضعیت/blob مربوط به Plugin در SQLite زیر
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به Matrix
  این فایل‌های قدیمی را از ریشه‌های ذخیره‌سازی Matrix با دامنه حساب وارد و حذف می‌کند.
- مکان‌نماهای bus در Nostr و وضعیت انتشار پروفایل اکنون به‌جای
  `bus-state-*.json` و `profile-state-*.json` از وضعیت Plugin در SQLite زیر
  فضاهای نام `nostr` (`bus-state`, `profile-state`) استفاده می‌کنند؛ مهاجرت doctor/setup مربوط به Nostr
  فایل‌های قدیمی را وارد و حذف می‌کند.
- تغییر وضعیت‌های نشست Active Memory اکنون به‌جای `session-toggles.json` از وضعیت Plugin در SQLite زیر
  `active-memory/session-toggles` استفاده می‌کنند.
- صف‌های پیشنهاد Skill Workshop و شمارنده‌های بازبینی اکنون به‌جای
  فایل‌های `skill-workshop/<workspace>.json` در هر workspace از وضعیت Plugin در SQLite زیر
  `skill-workshop/proposals` و `skill-workshop/reviews` استفاده می‌کنند.
- صف‌های تحویل خروجی و تحویل نشست اکنون به‌جای فایل‌های پایدار
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, و
  `session-delivery-queue/*.json` جدول SQLite سراسری
  `delivery_queue_entries` را زیر نام‌های صف جداگانه
  (`outbound-delivery`, `session-delivery`) به اشتراک می‌گذارند. گام legacy-state در doctor
  ردیف‌های در انتظار و ناموفق را وارد می‌کند، نشانگرهای تحویل‌شده کهنه را حذف می‌کند، و پس از واردسازی
  فایل‌های JSON قدیمی را حذف می‌کند. فیلدهای مسیریابی داغ و تلاش دوباره ستون‌های نوع‌دار هستند؛
  payload JSON فقط برای بازپخش/اشکال‌زدایی نگه داشته می‌شود.
- اجاره‌های فرایند ACPX اکنون به‌جای `process-leases.json` از وضعیت Plugin در SQLite زیر `acpx/process-leases`
  استفاده می‌کنند.
- فراداده اجرای پشتیبان‌گیری و مهاجرت

این‌ها را به پایگاه‌های داده عامل منتقل کنید:

- ریشه‌های نشست عامل و payloadهای session-entry با شکل سازگاری. برای
  نوشتن‌های زمان اجرا انجام شده است: فراداده داغ نشست در `sessions` قابل پرس‌وجو است، در حالی که
  payload کامل `SessionEntry` با شکل قدیمی در `session_entries` باقی می‌ماند.
- رویدادهای رونوشت عامل. برای نوشتن‌های زمان اجرا انجام شده است.
- چک‌پوینت‌های Compaction و اسنپ‌شات‌های رونوشت. برای نوشتن‌های زمان اجرا انجام شده است:
  نسخه‌های رونوشت چک‌پوینت ردیف‌های رونوشت SQLite هستند و فراداده چک‌پوینت
  در `transcript_snapshots` ثبت می‌شود. کمک‌کننده‌های چک‌پوینت Gateway
  اکنون این مقدارها را اسنپ‌شات‌های رونوشت می‌نامند، نه فایل‌های منبع.
- فضاهای نام scratch/workspace مربوط به VFS عامل. برای نوشتن‌های VFS زمان اجرا انجام شده است.
- payloadهای پیوست subagent. برای نوشتن‌های زمان اجرا انجام شده است: آن‌ها ورودی‌های seed در VFS مبتنی بر SQLite هستند
  و هرگز فایل‌های workspace پایدار نیستند.
- مصنوعات ابزار. برای نوشتن‌های زمان اجرا انجام شده است.
- مصنوعات اجرا. برای نوشتن‌های زمان اجرای worker از طریق جدول
  `run_artifacts` در هر عامل انجام شده است.
- کش‌های زمان اجرای محلی عامل. برای نوشتن‌های کش با دامنه زمان اجرای worker از طریق
  جدول `cache_entries` در هر عامل انجام شده است. کش‌های مدل در سطح Gateway در
  پایگاه داده سراسری می‌مانند مگر اینکه مختص عامل شوند.
- لاگ‌های جریان والد ACP. برای نوشتن‌های زمان اجرا انجام شده است.
- نشست‌های دفتر کل بازپخش ACP. برای نوشتن‌های زمان اجرا از طریق
  `acp_replay_sessions` و `acp_replay_events` انجام شده است؛ `acp/event-ledger.json` قدیمی
  فقط به‌عنوان ورودی doctor باقی می‌ماند.
- فراداده نشست ACP. برای نوشتن‌های زمان اجرا از طریق `acp_sessions` انجام شده است؛ بلوک‌های قدیمی
  `entry.acp` در `sessions.json` فقط ورودی مهاجرت doctor هستند.
- سایدکارهای trajectory وقتی فایل‌های export صریح نیستند. برای نوشتن‌های زمان اجرا انجام شده است:
  capture مربوط به trajectory ردیف‌های `trajectory_runtime_events` در پایگاه داده عامل می‌نویسد
  و مصنوعات با دامنه اجرا را در SQLite آینه می‌کند. سایدکارهای قدیمی فقط ورودی‌های import برای doctor هستند؛ export می‌تواند خروجی‌های تازه JSONL برای support-bundle بسازد
  اما سایدکارهای قدیمی trajectory/transcript را در زمان اجرا نمی‌خواند یا مهاجرت نمی‌دهد.
  capture زمان اجرای trajectory دامنه SQLite را آشکار می‌کند؛ کمک‌کننده‌های مسیر JSONL
  به پشتیبانی export/debug محدود شده‌اند و از ماژول runtime دوباره صادر نمی‌شوند.
  فراداده trajectory مربوط به embedded-runner به‌جای پایدارسازی مکان‌یاب رونوشت،
  هویت `{agentId, sessionId, sessionKey}` را ثبت می‌کند.

این‌ها فعلاً مبتنی بر فایل بمانند:

- `openclaw.json`
- فایل‌های اعتبارنامه provider یا CLI
- manifestهای Plugin/بسته
- workspaceهای کاربر و مخزن‌های Git وقتی حالت دیسک انتخاب شده است
- لاگ‌هایی که برای tail کردن اپراتور در نظر گرفته شده‌اند، مگر اینکه سطح لاگ مشخصی منتقل شود

## طرح مهاجرت

### فاز ۰: ثابت‌کردن مرز

پیش از جابه‌جایی ردیف‌های بیشتر، مرز وضعیت پایدار را صریح کنید:

- یک جدول `migration_runs` به پایگاه داده سراسری اضافه کنید.
  برای گزارش‌های اجرای مهاجرت legacy-state انجام شده است.
- یک سرویس مهاجرت وضعیت با مالکیت doctor برای واردسازی فایل به پایگاه داده اضافه کنید.
  انجام شده: `openclaw doctor --fix` از پیاده‌سازی مهاجرت legacy-state استفاده می‌کند.
- `plan` را فقط‌خواندنی کنید و کاری کنید `apply` پشتیبان بسازد، واردسازی کند، تأیید کند، و
  سپس فایل‌های قدیمی را حذف یا قرنطینه کند.
  انجام شده: doctor یک پشتیبان تأییدشده پیش از مهاجرت می‌سازد، مسیر پشتیبان را
  به `migration_runs` می‌دهد، و از مسیرهای واردکننده/حذف دوباره استفاده می‌کند.
- ممنوعیت‌های ایستا اضافه کنید تا کد زمان اجرای جدید نتواند فایل‌های وضعیت قدیمی بنویسد، در حالی که
  کد مهاجرت و تست‌ها هنوز بتوانند آن‌ها را seed/read کنند.
  برای storeهای قدیمیِ مهاجرت‌داده‌شده فعلی انجام شده است؛ guard همچنین تست‌های تو در تو را
  برای قراردادهای ممنوع مکان‌یاب رونوشت زمان اجرا اسکن می‌کند.

### فاز ۱: کامل‌کردن صفحه کنترل سراسری

وضعیت هماهنگی مشترک را در `state/openclaw.sqlite` نگه دارید:

- عامل‌ها و رجیستری پایگاه داده عامل
- دفترکل‌های Task و Task Flow
- وضعیت Plugin
- رجیستری کانتینر/مرورگر sandbox
- تاریخچه اجرای Cron/زمان‌بند
- جفت‌سازی، دستگاه، push، بررسی به‌روزرسانی، TUI، کش‌های OpenRouter/مدل، و سایر
  وضعیت‌های زمان اجرای کوچک با دامنه Gateway
- فراداده پشتیبان‌گیری و مهاجرت
- بایت‌های پیوست رسانه Gateway. برای نوشتن‌های زمان اجرا انجام شده است؛ مسیرهای فایل مستقیم
  materializationهای موقت برای سازگاری با فرستنده‌های کانال و staging در sandbox هستند.
  allowlistهای زمان اجرا مسیرهای materialization مربوط به SQLite را می‌پذیرند، نه ریشه‌های قدیمی
  رسانه وضعیت/پیکربندی. doctor فایل‌های رسانه قدیمی را به
  `media_blobs` وارد می‌کند و پس از نوشتن موفق ردیف‌ها فایل‌های منبع را حذف می‌کند.
- نشست‌های capture مربوط به debug proxy، رویدادها، و blobهای payload. انجام شده: captureها
  در DB وضعیت مشترک زندگی می‌کنند و از طریق bootstrap، schema،
  WAL، و تنظیمات busy-timeout پایگاه داده وضعیت مشترک باز می‌شوند. بایت‌های payload در
  `capture_blobs.data` با gzip فشرده می‌شوند؛ هیچ DB سایدکار زمان اجرای debug proxy،
  دایرکتوری blob، یا هدف schema/codegen تولیدشده مخصوص proxy-capture وجود ندارد.
  مهاجرت doctor/startup ردیف‌های عرضه‌شده `debug-proxy/capture.sqlite`
  و blobهای payload ارجاع‌شده را وارد می‌کند، از جمله overrideهای فعال DB/blob قدیمی در محیط،
  سپس این منابع را بایگانی می‌کند و گواهی‌های CA را دست‌نخورده می‌گذارد.

این فاز همچنین openerهای سایدکار تکراری، کمک‌کننده‌های permission، راه‌اندازی WAL،
پاک‌سازی filesystem، و writerهای سازگاری را از آن زیرسیستم‌ها حذف می‌کند.

### فاز ۲: معرفی پایگاه‌های داده برای هر عامل

برای هر عامل یک پایگاه داده بسازید و آن را از DB سراسری ثبت کنید:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

ردیف سراسری `agent_databases` مسیر، نسخه schema، timestamp آخرین مشاهده،
و فراداده پایه اندازه/درستی را ذخیره می‌کند. کد زمان اجرا به‌جای استخراج مستقیم مسیرهای فایل،
از رجیستری پایگاه داده عامل را می‌خواهد.

DB عامل مالک این موارد است:

- `sessions` به‌عنوان ریشهٔ متعارف نشست، همراه با `session_entries` به‌عنوان جدول بار داده با شکل سازگاری که به آن ریشه متصل است، و
  `session_routes` به‌عنوان جست‌وجوی یکتای `session_key` فعال
- `conversations` و `session_conversations` به‌عنوان هویت مسیریابی نرمال‌شدهٔ ارائه‌دهنده
  که به نشست‌ها متصل است
- `transcript_events`
- اسنپ‌شات‌های رونوشت و نقاط وارسی Compaction. برای نوشتن‌های زمان اجرا انجام شد.
- `vfs_entries`
- `tool_artifacts` و مصنوعات اجرا
- ردیف‌های زمان اجرا/کش محلی عامل. برای کش‌های محدودهٔ worker انجام شد.
- رویدادهای جریان والد ACP
- رویدادهای زمان اجرای مسیر، وقتی مصنوعات export صریح نیستند

### مرحله ۳: جایگزینی APIهای ذخیره‌گاه نشست

برای زمان اجرا انجام شد. سطح ذخیره‌گاه نشست با شکل فایل، قرارداد فعال
زمان اجرا نیست:

- زمان اجرا دیگر `loadSessionStore(storePath)` را فراخوانی نمی‌کند یا `storePath` را
  هویت نشست در نظر نمی‌گیرد.
- عملیات ردیفی زمان اجرا عبارت‌اند از `getSessionEntry`، `upsertSessionEntry`،
  `patchSessionEntry`، `deleteSessionEntry` و `listSessionEntries`.
- helperهای بازنویسی کل ذخیره‌گاه، نویسنده‌های فایل، تست‌های صف، هرس alias و
  پارامترهای حذف کلید قدیمی از زمان اجرا حذف شده‌اند.
- exportهای سازگاری منسوخ‌شدهٔ بستهٔ ریشه هنوز مسیرهای متعارف
  `sessions.json` را روی APIهای ردیفی SQLite تطبیق می‌دهند.
- تجزیهٔ `sessions.json` فقط در کد migration/import مربوط به doctor و
  تست‌های doctor باقی می‌ماند.
- fallback چرخهٔ عمر زمان اجرا، headerهای رونوشت SQLite را می‌خواند، نه خط‌های اول JSONL.

هر چیزی را که پارامترهای file-lock، واژگان pruning/truncation-as-file-maintenance،
هویت store-path، یا تست‌هایی را که تنها assertion آن‌ها پایداری JSON است دوباره وارد می‌کند، همچنان حذف کنید.

### مرحله ۴: انتقال رونوشت‌ها، جریان‌های ACP، مسیرها و VFS

هر جریان دادهٔ عامل را database-native کنید:

- نوشتن‌های append رونوشت از طریق یک تراکنش SQLite انجام می‌شوند که header نشست را تضمین می‌کند،
  idempotency پیام را بررسی می‌کند، parent tail را انتخاب می‌کند، در
  `transcript_events` درج می‌کند، و فرادادهٔ هویتی قابل query را در
  `transcript_event_identities` ثبت می‌کند. برای appendهای مستقیم پیام رونوشت و
  appendهای نرمال persistشدهٔ `TranscriptSessionManager` انجام شد؛ عملیات branch صریح
  انتخاب parent صریح خود را حفظ می‌کنند و همچنان ردیف‌های SQLite را
  بدون استخراج هیچ file locator می‌نویسند.
- لاگ‌های جریان والد ACP به ردیف تبدیل می‌شوند، نه فایل‌های `.acp-stream.jsonl`. انجام شد.
- راه‌اندازی spawn در ACP دیگر مسیرهای JSONL رونوشت را persist نمی‌کند. انجام شد.
- ضبط مسیر در زمان اجرا مستقیماً ردیف‌ها/مصنوعات رویداد را می‌نویسد. دستور صریح
  support/export همچنان می‌تواند مصنوعات JSONL بستهٔ پشتیبانی را به‌عنوان
  قالب export تولید کند، اما export نشست JSONL نشست را دوباره نمی‌سازد. انجام شد.
- workspaceهای دیسکی وقتی به‌عنوان حالت دیسک پیکربندی شده‌اند روی دیسک می‌مانند.
- scratch مربوط به VFS و حالت آزمایشی workspace فقط VFS از DB عامل استفاده می‌کنند.

migration فایل‌های JSONL قدیمی را یک‌بار import می‌کند، شمارش‌ها/hashها را در
`migration_runs` ثبت می‌کند، و فایل‌های importشده را پس از بررسی‌های integrity حذف می‌کند.

### مرحله ۵: پشتیبان‌گیری، بازیابی، Vacuum و Verify

پشتیبان‌ها یک فایل archive باقی می‌مانند:

- از هر پایگاه دادهٔ global و agent checkpoint بگیرید.
- از هر DB با semantics پشتیبان‌گیری SQLite یا `VACUUM INTO` اسنپ‌شات بگیرید.
- اسنپ‌شات‌های DB فشرده، config، credentials خارجی و exportهای درخواستی
  workspace را archive کنید.
- فایل‌های live خام `*.sqlite-wal` و `*.sqlite-shm` را حذف کنید.
- با باز کردن هر اسنپ‌شات DB و اجرای `PRAGMA integrity_check` verify کنید.
  `openclaw backup create` این archive verification را به‌طور پیش‌فرض انجام می‌دهد؛
  `--no-verify` فقط مرحلهٔ archive پس از نوشتن را رد می‌کند، نه integrity check
  ساخت اسنپ‌شات را.
- restore اسنپ‌شات‌ها را به مسیرهای مقصدشان کپی می‌کند. این branch چیدمان SQLite
  منتشرنشده را به `user_version = 1` reset می‌کند؛ تغییرات schema منتشرشدهٔ آینده
  می‌توانند هنگام نیاز migrationهای صریح اضافه کنند.

### مرحله ۶: زمان اجرای Worker

حالت worker را تا زمان نهایی شدن تفکیک پایگاه داده آزمایشی نگه دارید:

- workerها agent id، run id، حالت filesystem و هویت DB registry را دریافت می‌کنند.
- هر worker اتصال SQLite خودش را باز می‌کند.
- Parent اختیار تحویل channel، approvals، config و cancellation را نگه می‌دارد.
- با یک worker برای هر اجرای فعال شروع کنید؛ pooling را فقط پس از پایدار شدن چرخهٔ عمر و
  مالکیت اتصال DB اضافه کنید.

### مرحله ۷: حذف دنیای قدیمی

برای مدیریت نشست زمان اجرا انجام شد. دنیای قدیمی فقط به‌عنوان ورودی صریح doctor
یا خروجی support/export مجاز است:

- هیچ نوشتن زمان اجرای `sessions.json`، JSONL رونوشت، JSON sandbox registry، SQLite sidecar task
  یا SQLite sidecar plugin-state وجود ندارد.
- هیچ pruning فایل JSON/session، truncation رونوشت فایل، lockهای فایل نشست
  یا تست‌های نشست با شکل lock وجود ندارد.
- هیچ export سازگاری زمان اجرا که هدفش به‌روز نگه داشتن فایل‌های نشست قدیمی باشد وجود ندارد.
- exportهای صریح پشتیبانی، قالب‌های archive/materialization درخواست‌شده توسط کاربر باقی می‌مانند
  و نباید نام فایل‌ها را دوباره به هویت زمان اجرا وارد کنند.

## پشتیبان‌گیری و بازیابی

پشتیبان‌ها باید یک فایل archive باشند، اما capture پایگاه داده باید
SQLite-native باشد:

1. فعالیت نوشتن طولانی‌مدت را متوقف کنید یا وارد یک مانع کوتاه پشتیبان‌گیری شوید.
2. برای هر پایگاه دادهٔ global و agent، یک checkpoint اجرا کنید.
3. از هر پایگاه داده با استفاده از semantics پشتیبان‌گیری SQLite یا `VACUUM INTO` در یک
   دایرکتوری پشتیبان موقت اسنپ‌شات بگیرید.
4. اسنپ‌شات‌های پایگاه دادهٔ فشرده، فایل config، دایرکتوری credentials،
   workspaceهای انتخاب‌شده و یک manifest را archive کنید.
5. archive را با باز کردن هر اسنپ‌شات SQLite موجود و اجرای
   `PRAGMA integrity_check` verify کنید.
   `openclaw backup create` این کار را به‌طور پیش‌فرض انجام می‌دهد؛ `--no-verify` فقط برای
   رد کردن عمدی مرحلهٔ archive پس از نوشتن است.

به کپی‌های live خام `*.sqlite`، `*.sqlite-wal` و `*.sqlite-shm` به‌عنوان
قالب اصلی پشتیبان تکیه نکنید. manifest archive باید نقش پایگاه داده،
agent id، نسخهٔ schema، مسیر source، مسیر snapshot، اندازهٔ byte و وضعیت integrity
را ثبت کند.

restore باید پایگاه دادهٔ global و فایل‌های پایگاه دادهٔ agent را از
اسنپ‌شات‌های archive دوباره بسازد. چون چیدمان SQLite هنوز منتشر نشده است، این refactor
فقط schema نسخهٔ ۱ به‌علاوهٔ import فایل‌به‌پایگاه‌دادهٔ doctor را نگه می‌دارد. دستور restore
ابتدا archive را اعتبارسنجی می‌کند، سپس هر asset manifest را از payload استخراج‌شدهٔ verifyشده
جایگزین می‌کند.

## طرح Refactor زمان اجرا

1. APIهای database registry را اضافه کنید.
   - مسیرهای DB global و DBهای per-agent را resolve کنید.
   - schemaهای منتشرنشده را در `user_version = 1` نگه دارید؛ تا وقتی یک schema منتشرشده
     به آن نیاز ندارد، کد runner مربوط به schema migration اضافه نکنید.
   - helperهای close/checkpoint/integrity را که توسط تست‌ها، backup و doctor استفاده می‌شوند اضافه کنید.

2. ذخیره‌گاه‌های SQLite جانبی را جمع کنید.
   - جدول‌های plugin state را به پایگاه دادهٔ global منتقل کنید. برای نوشتن‌های زمان اجرا انجام شد؛ importer جانبی قدیمی منتشرنشده حذف شده است.
   - جدول‌های task registry را به پایگاه دادهٔ global منتقل کنید. برای نوشتن‌های زمان اجرا انجام شد؛ importer جانبی قدیمی منتشرنشده حذف شده است.
   - جدول‌های Task Flow را به پایگاه دادهٔ global منتقل کنید. برای نوشتن‌های زمان اجرا انجام شد؛
     importer جانبی قدیمی منتشرنشده حذف شده است.
   - جدول‌های memory-search داخلی را به هر پایگاه دادهٔ agent منتقل کنید. انجام شد؛
     `memorySearch.store.path` سفارشی صریح اکنون توسط migration config مربوط به doctor حذف می‌شود.
     reindex کامل فقط درجا روی جدول‌های memory اجرا می‌شود؛ مسیر قدیمی swap کل فایل
     و helper جانبی index swap حذف شده‌اند.
   - database openerهای تکراری، تنظیم WAL، helperهای permission و
     مسیرهای close را از آن subsystemها حذف کنید.

3. جدول‌های متعلق به agent را به پایگاه داده‌های per-agent منتقل کنید.
   - DB عامل را عنداللزوم از طریق registry پایگاه دادهٔ global ایجاد کنید. انجام شد.
   - runtime session entries، transcript events، ردیف‌های VFS و tool
     artifacts را به DBهای agent منتقل کنید. انجام شد.
   - session entries، transcript events، ردیف‌های VFS یا tool artifacts مربوط به shared-DB branch-local را migrate نکنید؛ آن چیدمان هرگز منتشر نشده است. فقط import قدیمی فایل‌به‌پایگاه‌داده را در doctor نگه دارید.

4. APIهای ذخیره‌گاه نشست را جایگزین کنید.
   - `storePath` را به‌عنوان هویت زمان اجرا حذف کنید. برای زمان اجرا انجام شد و با
     `check:database-first-legacy-stores` محافظت می‌شود: فرادادهٔ نشست، به‌روزرسانی route،
     persistence دستور، پاک‌سازی نشست CLI، پیش‌نمایش‌های reasoning در Feishu،
     persistence وضعیت رونوشت، عمق subagent، overrideهای نشست profile احراز هویت،
     منطق parent-fork و inspection در QA-lab اکنون پایگاه داده را از کلیدهای متعارف agent/session
     resolve می‌کنند.
     پاسخ‌های session-list در Gateway/TUI/UI/macOS اکنون به‌جای `path` قدیمی، `databasePath`
     را expose می‌کنند؛ سطوح debug در macOS پایگاه دادهٔ per-agent را به‌عنوان وضعیت read-only
     نشان می‌دهند، به‌جای آن‌که config مربوط به `session.store` را بنویسند.
     `/status`، export مسیر از راه chat، و proxyهای وابستگی CLI دیگر مسیرهای store قدیمی را
     propagate نمی‌کنند؛ fallback مصرف رونوشت، SQLite را با هویت agent/session می‌خواند.
     تست‌های runtime و bridge دیگر `storePath` را expose نمی‌کنند؛ ورودی‌های doctor/migration
     مالک آن نام field قدیمی هستند.
     بارگذاری combined-session در Gateway دیگر branch زمان اجرای ویژه‌ای برای مقدارهای
     غیر template شدهٔ `session.store` ندارد؛ این مسیر ردیف‌های SQLite per-agent را aggregate می‌کند.
     lane قدیمی doctor برای session-lock و helper پاک‌سازی `.jsonl.lock` آن حذف شدند؛ SQLite
     اکنون مرز concurrency نشست است.
     call siteهای داغ زمان اجرا از نام‌های helper ردیف‌محور مانند
     `resolveSessionRowEntry` استفاده می‌کنند؛ alias سازگاری قدیمی `resolveSessionStoreEntry`
     از exportهای runtime و plugin SDK حذف شده است.

- از عملیات ردیفی `{ agentId, sessionKey }` استفاده کنید.
  انجام شد: `getSessionEntry`، `upsertSessionEntry`، `deleteSessionEntry`،
  `patchSessionEntry` و `listSessionEntries` APIهای SQLite-first هستند که
  به مسیر ذخیره‌گاه نشست نیاز ندارند. خلاصهٔ status، status عامل محلی، health
  و دستور listing مربوط به `openclaw sessions` اکنون ردیف‌های per-agent را مستقیم می‌خوانند
  و به‌جای مسیرهای `sessions.json`، مسیرهای پایگاه دادهٔ SQLite per-agent را نمایش می‌دهند.
- حذف/درج کل ذخیره‌گاه را با `upsertSessionEntry`،
  `deleteSessionEntry`، `listSessionEntries` و queryهای پاک‌سازی SQL جایگزین کنید.
  برای زمان اجرا انجام شد: مسیرهای داغ اکنون از APIهای ردیفی و patchهای ردیفی با retry روی conflict استفاده می‌کنند؛
  helperهای import/replace کل ذخیره‌گاه که باقی مانده‌اند به کد import migration
  و تست‌های backend SQLite محدودند.
  - `store-writer.ts` و تست‌های writer-queue را حذف کنید. انجام شد.
  - runtime legacy-key pruning و پارامترهای alias-delete را از upsert/patch ردیف نشست حذف کنید. انجام شد.

5. رفتار JSON registry زمان اجرا را حذف کنید.
   - خواندن و نوشتن sandbox registry را فقط SQLite کنید. انجام شد.
   - JSON یکپارچه و sharded را فقط از مرحلهٔ migration import کنید. انجام شد.
   - lockهای registry sharded و نوشتن‌های JSON را حذف کنید. انجام شد.

- اگر شکل همچنان وضعیت operational در مسیر داغ است، به‌جای ذخیرهٔ ردیف‌های registry به‌صورت JSON opaque عمومی،
  یک جدول registry typed نگه دارید. انجام شد.

6. mutation نشست با شکل file-lock را حذف کنید.
   - برای ساخت lock زمان اجرا و APIهای lock زمان اجرا انجام شد.
   - lane مستقل doctor برای پاک‌سازی `.jsonl.lock` قدیمی حذف شده است.
   - `session.writeLock` config قدیمی doctor-migrated است، نه یک setting typed زمان اجرا.
   - integrity وضعیت دیگر مسیر جداگانهٔ pruning فایل‌های رونوشت orphan ندارد؛ migration در doctor
     sourceهای JSONL قدیمی را در یک مکان import/remove می‌کند.
   - هماهنگی singleton در Gateway از ردیف‌های typed SQLite به نام `state_leases` زیر
     `gateway_locks` استفاده می‌کند و دیگر seam دایرکتوری file-lock را expose نمی‌کند.
   - persistence عمومی dedupe در plugin SDK دیگر از file lock یا فایل JSON استفاده نمی‌کند؛
     ردیف‌های plugin-state در SQLite مشترک می‌نویسد. انجام شد.
   - هماهنگی embed در QMD به‌جای `qmd/embed.lock` از lease وضعیت SQLite استفاده می‌کند. انجام شد.

7. workerها را database-aware کنید.
   - workerها اتصال‌های SQLite خودشان را باز می‌کنند.
   - parent مالک delivery، callbackهای channel و config است.
   - worker agent id، run id، حالت filesystem و هویت DB registry را دریافت می‌کند،
     نه handleهای live.
   - `vfs-only` آزمایشی می‌ماند و از پایگاه دادهٔ agent به‌عنوان root ذخیره‌سازی خود استفاده می‌کند.
   - ابتدا یک worker برای هر اجرای فعال نگه دارید. pooling می‌تواند تا زمانی که lifetime اتصال DB
     و رفتار cancellation ساده و پایدار شوند صبر کند.

8. یکپارچه‌سازی پشتیبان‌گیری.
   - به پشتیبان‌گیری بیاموزید پایگاه‌داده‌های سراسری و عامل را از طریق پشتیبان‌گیری SQLite یا
     `VACUUM INTO` snapshot کند. برای فایل‌های کشف‌شده `*.sqlite` زیر asset وضعیت انجام شد.
   - راستی‌آزمایی پشتیبان را برای یکپارچگی SQLite و نسخه schema اضافه کنید. برای
     ایجاد پشتیبان و بررسی‌های یکپارچگی راستی‌آزمایی آرشیو پیش‌فرض انجام شد.
   - فراداده اجرای پشتیبان را در SQLite ثبت کنید. از طریق جدول مشترک `backup_runs`
     با مسیر آرشیو، وضعیت، و JSON manifest انجام شد.
   - بازیابی از snapshotهای آرشیو راستی‌آزمایی‌شده را اضافه کنید. انجام شد: `openclaw backup
restore` پیش از استخراج اعتبارسنجی می‌کند، از manifest نرمال‌شده verifier استفاده می‌کند،
     از `--dry-run` پشتیبانی می‌کند، و پیش از جایگزینی مسیرهای منبع ثبت‌شده
     به `--yes` نیاز دارد.
   - خروجی‌گرفتن از VFS/workspace را فقط هنگام درخواست‌شدن شامل کنید؛ internals نشست را
     به‌صورت JSON یا JSONL خروجی نگیرید.

9. تست‌ها و کد منسوخ را حذف کنید. برای سطوح شناخته‌شده نشست runtime انجام شد.

- تست‌هایی را حذف کنید که ایجاد runtime فایل‌های `sessions.json` یا transcript
  JSONL را assert می‌کنند. برای store نشست core، chat، رویدادهای transcript Gateway،
  preview، lifecycle، به‌روزرسانی‌های command session-entry، reset/trace پاسخ خودکار، و
  fixtureهای memory-core dreaming، مسیریابی approval target، تعمیر transcript نشست،
  تعمیر مجوز امنیتی، خروجی trajectory، و خروجی نشست انجام شد.
  تست‌های transcript مربوط به active-memory اکنون scopeهای SQLite و عدم ایجاد فایل JSONL
  موقت یا پایدارشده را assert می‌کنند.
  regression قدیمی heartbeat transcript-pruning حذف شد، چون
  runtime دیگر transcriptهای JSONL را کوتاه نمی‌کند.
  تست‌های ابزار agent session-list دیگر مسیرهای قدیمی `sessions.json` را
  به‌عنوان شکل پاسخ Gateway مدل نمی‌کنند؛ تست‌های app/UI/macOS از `databasePath` استفاده می‌کنند.
  تست‌های transcript-usage مربوط به `/status` اکنون به‌جای نوشتن فایل‌های JSONL،
  ردیف‌های transcript SQLite را مستقیما seed می‌کنند.
  تست‌های lifecycle نشست Gateway اکنون مستقیما از helperهای seed transcript SQLite
  استفاده می‌کنند؛ شکل fixture فایل نشست تک‌خطی قدیمی از پوشش reset
  و delete حذف شده است.
  `sessions.delete` دیگر فیلد دوران فایل `archived: []` را برنمی‌گرداند؛ حذف
  فقط نتیجه mutation ردیف را گزارش می‌کند. گزینه قدیمی `deleteTranscript` هم
  حذف شده است: حذف یک نشست ریشه canonical `sessions` را حذف می‌کند و اجازه می‌دهد
  SQLite ردیف‌های transcript، snapshot، و trajectory متعلق به نشست را cascade کند، بنابراین هیچ
  callerی نمی‌تواند transcriptهای orphan باقی بگذارد یا شاخه cleanup را فراموش کند.
  تست‌های capture trajectory مربوط به context-engine اکنون ردیف‌های `trajectory_runtime_events`
  را از یک پایگاه‌داده agent ایزوله می‌خوانند، نه از
  `session.trajectory.jsonl`.
  اسکریپت‌های seed کانال Docker MCP اکنون ردیف‌های SQLite را مستقیما seed می‌کنند. نوشتن مستقیم
  `sessions.json` به fixtureهای doctor محدود است.
  Tool Search Gateway E2E شواهد tool-call را از ردیف‌های transcript SQLite می‌خواند
  نه از اسکن فایل‌های `agents/<agentId>/sessions/*.jsonl`.
  رویدادهای میزبان memory-core و ردیف‌های scratch مربوط به session-corpus اکنون در shared
  SQLite plugin-state زندگی می‌کنند؛ `events.jsonl` و `session-corpus/*.txt` فقط ورودی‌های
  migration قدیمی doctor هستند. ردیف‌های فعال از مسیرهای virtual
  `memory/session-ingestion/` استفاده می‌کنند، نه `.dreams/session-corpus`. ماژول تعمیر قدیمی
  memory-core dreaming و تست‌های CLI/Gateway آن حذف شدند، چون runtime دیگر
  مالک تعمیر آرشیو فایل برای آن corpus نیست. تست‌های
  bridge/public-artifact مربوط به Memory-core دیگر `.dreams/events.jsonl` را surface نمی‌کنند؛ آن‌ها
  از نام artifact مجازی JSON مبتنی بر SQLite استفاده می‌کنند.
  مستندات تست public SDK/Codex اکنون به‌جای فایل‌های نشست، وضعیت نشست SQLite را می‌گویند،
  و مثال channel-turn دیگر آرگومان `storePath` را آشکار نمی‌کند.
  وضعیت sync مربوط به Matrix اکنون مستقیما از store مربوط به SQLite plugin-state استفاده می‌کند. قراردادهای فعال
  client/runtime یک ریشه storage حساب را پاس می‌دهند، نه مسیر `bot-storage.json`،
  و doctor پیش از حذف منبع، `bot-storage.json` قدیمی را به SQLite وارد می‌کند. سناریوهای restart/destructive مربوط به QA Matrix اکنون ردیف sync SQLite
  را مستقیما mutate می‌کنند، به‌جای ساختن یا حذف فایل‌های جعلی `bot-storage.json`، و
  substrate مربوط به E2EE به‌جای مسیر جعلی
  `sync-store.json` یک ریشه sync-store پاس می‌دهد.
  انتخاب storage-root در Matrix دیگر rootها را بر اساس فایل‌های JSON قدیمی sync/thread
  امتیازدهی نمی‌کند؛ از فراداده durable root به‌همراه وضعیت واقعی crypto استفاده می‌کند.
  مجموعه تست backend نشست SQLite runtime دیگر `sessions.json` جعلی
  نمی‌سازد؛ fixtureهای منبع قدیمی اکنون در تست‌های doctor
  که آن‌ها را import می‌کنند زندگی می‌کنند.
  تست‌های نشست Gateway دیگر helper به نام `createSessionStoreDir` یا
  setup استفاده‌نشده مسیر temp session-store را expose نمی‌کنند؛ دایرکتوری‌های fixture صریح هستند، و setup مستقیم
  ردیف از نام‌گذاری session-row در SQLite استفاده می‌کند.
  پوشش parser مربوط به doctor-only JSON5 session-store از تست‌های infra خارج شد و
  به تست‌های migration doctor منتقل شد، بنابراین مجموعه تست‌های runtime دیگر مالک parsing
  فایل نشست قدیمی نیستند.
  تست‌های runtime SSO/pending-upload در Microsoft Teams دیگر fixtureهای sidecar
  JSON یا parserها را حمل نمی‌کنند؛ parsing توکن SSO قدیمی فقط در ماژول migration
  Plugin زندگی می‌کند. تست‌های Telegram دیگر مسیرهای store جعلی `/tmp/*.json` را seed نمی‌کنند؛
  آن‌ها cache پیام مبتنی بر SQLite را مستقیما reset می‌کنند. helper عمومی
  test-state در OpenClaw دیگر writer قدیمی `auth-profiles.json`
  را expose نمی‌کند؛ تست‌های migration احراز هویت doctor مالک محلی آن fixture هستند.
  تست‌های runtime برای pointerهای آخرین نشست TUI، approvalهای exec، toggleهای active-memory،
  verification مربوط به Matrix dedupe/startup، sync منبع Memory Wiki،
  bindingهای current-conversation، احراز هویت onboarding، و importهای secret مربوط به Hermes دیگر
  فایل‌های sidecar قدیمی تولید نمی‌کنند یا assert نمی‌کنند نام‌های فایل قدیمی absent هستند. آن‌ها
  رفتار را از طریق ردیف‌های SQLite و APIهای public store اثبات می‌کنند؛ تست‌های doctor/migration
  تنها جایی هستند که نام فایل‌های منبع قدیمی به آن تعلق دارند.
  تست‌های runtime برای pairing دستگاه/node، channel allowFrom، intentهای restart،
  handoff مربوط به restart، entryهای queue تحویل نشست، سلامت config، cacheهای iMessage،
  jobهای cron، headerهای transcript PI، registryهای subagent، و attachmentهای تصویر managed
  نیز دیگر فایل‌های JSON/JSONL بازنشسته را فقط برای اثبات ignored یا absent بودنشان ایجاد نمی‌کنند.
  recovery مربوط به PI overflow دیگر fallback بازنویسی/کوتاه‌سازی SessionManager ندارد:
  کوتاه‌سازی tool-result و بازنویسی‌های transcript مربوط به context-engine ردیف‌های transcript SQLite را mutate می‌کنند،
  سپس وضعیت prompt فعال را از پایگاه‌داده refresh می‌کنند.
  appendهای پیام Persisted SessionManager برای انتخاب parent و idempotency به helper
  atomic append transcript در SQLite واگذار می‌شوند. appendهای entry عادی
  metadata/custom نیز parent فعلی را داخل SQLite انتخاب می‌کنند، بنابراین
  instanceهای stale manager رقابت‌های parent-chain پیش از SQLite را resurrect نمی‌کنند.
  cleanup synthetic PI tail برای precheckهای mid-turn و `sessions_yield` اکنون
  وضعیت transcript SQLite را مستقیما trim می‌کند؛ bridge قدیمی tail-removal در SessionManager
  و تست‌هایش حذف شده‌اند.
  capture checkpoint مربوط به Compaction نیز فقط از SQLite snapshot می‌گیرد؛ callerها دیگر
  SessionManager زنده را به‌عنوان منبع جایگزین transcript پاس نمی‌دهند.
- تست‌هایی را نگه دارید که فایل‌های قدیمی را فقط برای migration seed می‌کنند.
- proof مبتنی بر فایل JSON برای سطوح فعال runtime با proof مبتنی بر ردیف SQL
  جایگزین شده است.

- ممنوعیت‌های static برای نوشتن‌های runtime به مسیرهای JSON قدیمی نشست/cache اضافه کنید.
  برای guard مخزن انجام شد.

10. گزارش migration را قابل audit کنید.
    - اجرای migration را در SQLite با timestampهای started/finished، مسیرهای منبع،
      hashهای منبع، countها، warningها، و مسیر backup ثبت کنید.
      انجام شد: اجرای migration وضعیت قدیمی اکنون گزارش `migration_runs`
      را با inventory مسیر/table منبع، SHA-256 فایل منبع، sizeها،
      countهای record، warningها، و مسیر backup پایدار می‌کند.
      انجام شد: اجرای migration وضعیت قدیمی همچنین ردیف‌های `migration_sources`
      را برای audit در سطح منبع و تصمیم‌های skip/backfill آینده پایدار می‌کند.
    - apply را idempotent کنید. اجرای دوباره پس از import جزئی باید یا
      منبعی را که قبلا import شده skip کند یا با کلید stable merge کند.
      انجام شد: indexهای نشست، transcriptها، queueهای تحویل، وضعیت Plugin، ledgerهای task،
      و ردیف‌های SQLite سراسری متعلق به agent از طریق کلیدهای stable یا
      semanticsهای upsert/replace import می‌شوند، بنابراین rerunها بدون duplicate کردن ردیف‌های
      durable merge می‌شوند.
    - importهای ناموفق باید فایل منبع اصلی را سر جای خود نگه دارند.
      انجام شد: importهای ناموفق transcript اکنون منبع JSONL اصلی را در
      مسیر detected آن باقی می‌گذارند، و `migration_sources` منبع را به‌عنوان
      `warning` با `removed_source=0` برای اجرای بعدی doctor ثبت می‌کند.

## قوانین عملکرد

- یک connection برای هر thread/process کافی است؛ handleها را بین
  workerها به اشتراک نگذارید.
- از WAL، `foreign_keys=ON`، busy timeout سی‌ثانیه‌ای، و transactionهای نوشتن کوتاه `BEGIN IMMEDIATE`
  استفاده کنید.
- helperهای transaction نوشتن را synchronous نگه دارید مگر/تا زمانی که API transaction
  async semantics صریح mutex/backpressure اضافه کند.
- نوشتن‌های تحویل parent را کوچک و transactional نگه دارید.
- از بازنویسی کل store پرهیز کنید؛ از upsert/delete در سطح ردیف استفاده کنید.
- پیش از انتقال کد hot، indexهایی برای مسیرهای list-by-agent، list-by-session، updated-at، run id، و
  expiration اضافه کنید.
- artifactهای بزرگ، media، و vectorها را به‌صورت BLOB یا ردیف‌های BLOB chunked ذخیره کنید، نه
  base64 یا JSON آرایه عددی.
- entryهای opaque مربوط به plugin-state را کوچک و scoped نگه دارید.
- به‌جای pruning در filesystem، cleanup SQL برای TTL/expiration اضافه کنید.
  برای storeهای runtime متعلق به پایگاه‌داده انجام شد: media، وضعیت Plugin، blobهای Plugin،
  dedupe پایدار، و cache agent همگی از طریق ردیف‌های SQLite expire می‌شوند. cleanup باقی‌مانده
  filesystem به materializationهای موقت یا commandهای removal صریح محدود است.

## ممنوعیت‌های static

یک check مخزن اضافه کنید که نوشتن‌های runtime جدید به مسیرهای وضعیت قدیمی را fail کند:

- `sessions.json`
- `*.trajectory.jsonl` به‌جز خروجی‌های مادی‌سازی‌شده بسته پشتیبانی
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- فایل‌های حافظه پنهان زمان اجرای `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- فایل‌های Matrix `credentials*.json` و `recovery-key.json`
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
- هسته حافظه `.dreams/events.jsonl`
- هسته حافظه `.dreams/session-corpus/`
- هسته حافظه `.dreams/daily-ingestion.json`
- هسته حافظه `.dreams/session-ingestion.json`
- هسته حافظه `.dreams/short-term-recall.json`
- هسته حافظه `.dreams/phase-signals.json`
- هسته حافظه `.dreams/short-term-promotion.lock`
- کارگاه Skills `skill-workshop/<workspace>.json`
- کارگاه Skills `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- فایل‌های JSON پاره رجیستری sandbox
- فایل‌های JSON پل `/tmp` برای رله hook بومی
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
- ویکی حافظه `.openclaw-wiki/log.jsonl`
- ویکی حافظه `.openclaw-wiki/state.json`
- ویکی حافظه `.openclaw-wiki/locks/`
- ویکی حافظه `.openclaw-wiki/source-sync.json`
- ویکی حافظه `.openclaw-wiki/import-runs/*.json`
- ویکی حافظه `.openclaw-wiki/cache/agent-digest.json`
- ویکی حافظه `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- تزئین پروفایل مرورگر `.openclaw-profile-decorated`
- بازکننده‌های نشست مبتنی بر فایل `SessionManager.open(...)`
- نماهای فهرست‌کردن رونوشت `SessionManager.listAll(...)` و `TranscriptSessionManager.listAll(...)`
- نماهای fork رونوشت `SessionManager.forkFromSession(...)` و
  `TranscriptSessionManager.forkFromSession(...)`
- نماهای جایگزینی نشست قابل تغییر `SessionManager.newSession(...)` و `TranscriptSessionManager.newSession(...)`
- نماهای نشست شاخه‌ای `SessionManager.createBranchedSession(...)` و
  `TranscriptSessionManager.createBranchedSession(...)`

این ممنوعیت باید به آزمون‌ها اجازه دهد fixtureهای قدیمی بسازند و به کد مهاجرت اجازه دهد
منابع فایل قدیمی را بخواند، وارد کند یا حذف کند. فایل‌های جانبی SQLite منتشرنشده همچنان ممنوع می‌مانند
و مجوز واردسازی doctor دریافت نمی‌کنند.

## معیارهای انجام کار

- نوشتن داده‌ها و حافظه پنهان زمان اجرا به پایگاه داده SQLite سراسری یا عامل می‌رود.
- زمان اجرا دیگر ایندکس‌های نشست، JSONL رونوشت، JSON رجیستری sandbox،
  SQLite جانبی task، یا SQLite جانبی plugin-state را نمی‌نویسد. واردکننده‌های SQLite جانبی منتشرنشده task
  و plugin-state حذف شده‌اند.
- واردسازی فایل قدیمی فقط برای doctor است.
- پشتیبان‌گیری یک آرشیو با snapshotهای فشرده SQLite و اثبات یکپارچگی تولید می‌کند.
- کارگرهای عامل می‌توانند با دیسک، scratch مربوط به VFS، یا ذخیره‌سازی آزمایشی فقط VFS
  اجرا شوند.
- فایل‌های پیکربندی و اعتبارنامه صریح تنها فایل‌های کنترلی پایدار و غیردیتابیسی مورد انتظار باقی می‌مانند.
- بررسی‌های مخزن از بازمعرفی ذخیره‌سازهای فایل قدیمی در زمان اجرا جلوگیری می‌کنند.
