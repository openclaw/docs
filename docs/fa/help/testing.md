---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'مجموعهٔ آزمون: مجموعه‌های واحد/e2e/زنده، اجراکننده‌های Docker، و آنچه هر آزمون پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-07-04T03:58:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه Vitest دارد (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعه‌ای کوچک
از اجراکننده‌های Docker. این سند راهنمای «ما چگونه تست می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمداً چه چیزهایی را _پوشش نمی‌دهد_).
- برای گردش‌کارهای رایج (محلی، پیش از push، اشکال‌زدایی) کدام فرمان‌ها را اجرا کنید.
- تست‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) - معماری، سطح فرمان، نگارش سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) - مرجع برای `pnpm openclaw qa matrix`.
- [کارت امتیاز بلوغ](/fa/maturity/scorecard) - اینکه شواهد QA انتشار چگونه از تصمیم‌های پایداری و LTS پشتیبانی می‌کند.
- [کانال QA](/fa/channels/qa-channel) - Plugin انتقال مصنوعی که سناریوهای مبتنی بر مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های تست معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های اختصاصی QA در پایین ([اجراکننده‌های اختصاصی QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

در بیشتر روزها:

- دروازه کامل (پیش از push انتظار می‌رود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی دستگاهی با فضای کافی: `pnpm test:max`
- حلقه مستقیم watch در Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای افزونه/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست منفرد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA مبتنی بر Docker: `pnpm qa:lab:up`
- مسیر QA مبتنی بر VM لینوکس: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی تست‌ها را لمس می‌کنید یا اطمینان بیشتری می‌خواهید:

- دروازه پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

## دایرکتوری‌های موقت تست

برای دایرکتوری‌های موقت متعلق به تست، helperهای مشترک در `test/helpers/temp-dir.ts`
را ترجیح دهید. آن‌ها مالکیت را صریح می‌کنند و پاک‌سازی را در همان چرخه عمر
تست نگه می‌دارند:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` عمداً هیچ روش پاک‌سازی دستی‌ای ارائه نمی‌کند؛ Vitest
پس از هر تست مالک پاک‌سازی است. helperهای سطح پایین موجود برای تست‌هایی که
هنوز منتقل نشده‌اند باقی می‌مانند، اما تست‌های جدید و منتقل‌شده باید از tracker
پاک‌سازی خودکار استفاده کنند. از کاربرد جدید `makeTempDir`، `cleanupTempDirs` یا
`createTempDirTracker` دستی و نیز از فراخوانی‌های خام `fs.mkdtemp*` در تست‌ها پرهیز کنید،
مگر اینکه موردی صراحتاً رفتار خام temp-dir را راستی‌آزمایی کند. وقتی یک تست عمداً به یک دایرکتوری موقت خام نیاز دارد، یک کامنت allow قابل ممیزی
با دلیل مشخص اضافه کنید:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

برای شفافیت مهاجرت، `node scripts/report-test-temp-creations.mjs` ایجاد temp-dir خام جدید
و کاربرد جدید helper مشترک دستی را در خطوط افزوده‌شده diff گزارش می‌کند،
بدون اینکه سبک‌های پاک‌سازی موجود را مسدود کند. دامنه فایل آن عمداً همان
طبقه‌بندی مسیر تست را دنبال می‌کند که `scripts/changed-lanes.mjs` استفاده می‌کند،
به‌جای نگهداری یک heuristic جداگانه برای نام فایل helper تست، و هم‌زمان
خود پیاده‌سازی helper مشترک را نادیده می‌گیرد. `check:changed` این گزارش را برای
مسیرهای تست تغییرکرده به‌عنوان سیگنال CI فقط هشدار اجرا می‌کند؛ یافته‌ها annotationهای هشدار GitHub
هستند، نه شکست.

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعه زنده (مدل‌ها + probeهای ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌سروصدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های کارایی runtime: `OpenClaw Performance` را با
  `live_openai_candidate=true` برای یک نوبت عامل واقعی `openai/gpt-5.5` یا
  `deep_profile=true` برای artifactهای CPU/heap/trace مربوط به Kova dispatch کنید. اجراهای زمان‌بندی‌شده روزانه
  وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد، artifactهای مسیر mock-provider، deep-profile و GPT 5.5 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند. گزارش
  mock-provider همچنین شامل اعداد boot سطح منبع Gateway، حافظه،
  plugin-pressure، hello-loop تکراری fake-model و startup در CLI است.
- sweep مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متنی به‌علاوه یک probe کوچک شبیه فایل‌خوانی اجرا می‌کند.
    مدل‌هایی که metadata آن‌ها ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک نیز اجرا می‌کنند.
    هنگام جداسازی شکست‌های ارائه‌دهنده، probeهای اضافه را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو workflow قابل استفاده مجدد زنده/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل jobهای ماتریسی جداگانه مدل زنده Docker
    است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - secretهای جدید و پرسیگنال ارائه‌دهنده را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخوان‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- smoke گفت‌وگوی bound بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را روی مسیر app-server در Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` bind می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌کند، سپس یک پاسخ ساده و یک پیوست تصویر را
    از طریق binding بومی Plugin به‌جای ACP راستی‌آزمایی می‌کند.
- smoke harness app-server در Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق harness app-server متعلق به Plugin در Codex اجرا می‌کند،
    `/codex status` و `/codex models` را راستی‌آزمایی می‌کند و به‌صورت پیش‌فرض probeهای تصویر،
    cron MCP، sub-agent و Guardian را تمرین می‌کند. هنگام جداسازی سایر شکست‌های
    app-server در Codex، probe sub-agent را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز sub-agent، probeهای دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از probe sub-agent خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- smoke نصب درخواستی Codex: `pnpm test:docker:codex-on-demand`
  - tarball بسته‌بندی‌شده OpenClaw را در Docker نصب می‌کند، onboarding کلید API
    OpenAI را اجرا می‌کند، و راستی‌آزمایی می‌کند که Plugin مربوط به Codex به‌همراه وابستگی
    `@openai/codex` در صورت نیاز در ریشه پروژه npm مدیریت‌شده دانلود شده‌اند.
- smoke وابستگی ابزار Plugin زنده: `pnpm test:docker:live-plugin-tool`
  - یک Plugin fixture با وابستگی واقعی `slugify` را بسته‌بندی می‌کند، آن را از طریق
    `npm-pack:` نصب می‌کند، وابستگی را زیر ریشه پروژه npm مدیریت‌شده راستی‌آزمایی می‌کند،
    سپس از یک مدل زنده OpenAI می‌خواهد ابزار Plugin را فراخوانی کند و slug پنهان را برگرداند.
- smoke فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی opt-in کمربند و بند اضافه برای سطح فرمان نجات message-channel.
    `/crestodian status` را تمرین می‌کند، یک تغییر مدل پایدار را در صف قرار می‌دهد،
    به `/crestodian yes` پاسخ می‌دهد و مسیر نوشتن audit/config را راستی‌آزمایی می‌کند.
- smoke برنامه‌ریز Docker در Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک container بدون config با یک CLI جعلی Claude روی `PATH`
    اجرا می‌کند و راستی‌آزمایی می‌کند که fallback برنامه‌ریز fuzzy به یک نوشتن config typed ممیزی‌شده
    ترجمه می‌شود.
- smoke اجرای نخست Docker در Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری state خالی OpenClaw شروع می‌کند، entrypoint مدرن onboard
    Crestodian را راستی‌آزمایی می‌کند، نوشتن‌های setup/model/agent/Plugin Discord + SecretRef
    را اعمال می‌کند، config را اعتبارسنجی می‌کند و entryهای audit را راستی‌آزمایی می‌کند. همان مسیر setup در Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده شده است.
- smoke هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، اجرا کنید
  `openclaw models list --provider moonshot --json`، سپس یک اجرای ایزوله
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  را روی `moonshot/kimi-k2.6` اجرا کنید. راستی‌آزمایی کنید که JSON، Moonshot/K2.6 را گزارش می‌کند و transcript دستیار
  مقدار normalize‌شده `usage.cost` را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن تست‌های زنده از طریق env varهای allowlist که پایین‌تر توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های اختصاصی QA

این فرمان‌ها زمانی کنار مجموعه‌های تست اصلی قرار می‌گیرند که به واقع‌گرایی QA-lab نیاز دارید:

CI، QA Lab را در workflowهای اختصاصی اجرا می‌کند. همترازی عامل‌محور زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار nest شده است، نه یک workflow مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA در release-checks استفاده کند. بررسی‌های انتشار stable/default
soak جامع زنده/Docker را پشت `run_release_soak=true` نگه می‌دارند؛
profile `full`، soak را اجباری می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر همترازی mock، مسیر زنده
Matrix، مسیر زنده Telegram مدیریت‌شده با Convex و مسیر زنده Discord
مدیریت‌شده با Convex به‌عنوان jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صراحتاً پاس می‌دهند، در حالی که ورودی workflow دستی و پیش‌فرض CLI ماتریس
همچنان `all` باقی می‌مانند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`،
`media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از approval انتشار، همترازی به‌علاوه مسیرهای سریع Matrix و Telegram را اجرا می‌کند
و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا
deterministic بمانند و از startup معمول provider-plugin پرهیز کنند. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های همترازی QA
پوشش داده می‌شود.

shardهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از قبل
`ffmpeg` و `ffprobe` دارد. shardهای مدل/backend زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای commit انتخاب‌شده
ساخته می‌شود، سپس به‌جای بازسازی درون هر shard، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1`
pull می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA پشتیبانی‌شده توسط مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - artifactهای سطح بالای `qa-evidence.json`، `qa-suite-summary.json` و
    `qa-suite-report.md` را برای مجموعه سناریوی انتخاب‌شده می‌نویسد، از جمله
    انتخاب‌های سناریوی جریان ترکیبی، Vitest و Playwright.
  - وقتی با `pnpm openclaw qa run --qa-profile <profile>` dispatch شود،
    scorecard پروفایل taxonomy انتخاب‌شده را در همان `qa-evidence.json` جاسازی می‌کند.
    `smoke-ci` شواهد کم‌حجم می‌نویسد که `evidenceMode: "slim"` را تنظیم می‌کند و
    `execution` هر ورودی را حذف می‌کند. `release` بخش گزینش‌شده آمادگی انتشار را پوشش می‌دهد؛
    `all` همه دسته‌های maturity فعال را انتخاب می‌کند و برای dispatchهای صریح گردش‌کار
    QA Profile Evidence در زمانی در نظر گرفته شده است که artifact کامل scorecard
    لازم باشد.
  - به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی با workerهای ایزوله
    gateway اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض concurrency برابر 4 دارد
    (محدود به تعداد سناریوهای انتخاب‌شده). از `--concurrency <count>` برای تنظیم
    تعداد workerها، یا از `--concurrency 1` برای lane سریال قدیمی‌تر استفاده کنید.
  - اگر هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی artifactها را بدون
    کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های provider یعنی `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور provider محلی پشتیبانی‌شده با AIMock را برای پوشش آزمایشی
    fixture و protocol-mock راه‌اندازی می‌کند، بدون اینکه lane آگاه از سناریوی
    `mock-openai` را جایگزین کند.
- `pnpm openclaw qa coverage --match <query>`
  - شناسه‌های سناریو، عنوان‌ها، surfaceها، شناسه‌های پوشش، ارجاع‌های docs، ارجاع‌های code،
    Pluginها و نیازمندی‌های provider را جست‌وجو می‌کند، سپس targetهای suite منطبق را چاپ می‌کند.
  - وقتی رفتار یا مسیر فایل لمس‌شده را می‌دانید اما کوچک‌ترین سناریو را نمی‌دانید،
    قبل از اجرای QA Lab از این استفاده کنید. این فقط جنبه راهنمایی دارد؛ همچنان proof
    mock، live، Multipass، Matrix یا transport را بر اساس رفتاری که تغییر می‌کند انتخاب کنید.
- `pnpm test:plugins:kitchen-sink-live`
  - gauntlet زنده Plugin OpenAI Kitchen Sink را از طریق QA Lab اجرا می‌کند. این کار
    بسته خارجی Kitchen Sink را نصب می‌کند، inventory سطح Plugin SDK را تأیید می‌کند،
    `/healthz` و `/readyz` را probe می‌کند، شواهد CPU/RSS Gateway را ثبت می‌کند،
    یک نوبت زنده OpenAI را اجرا می‌کند و diagnostics خصمانه را بررسی می‌کند.
    به auth زنده OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در sessionهای hydrated Testbox
    وقتی helper با نام `openclaw-testbox-env` حاضر باشد، به‌طور خودکار پروفایل live-auth
    مربوط به Testbox را source می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - bench راه‌اندازی gateway را به‌همراه یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) اجرا می‌کند و خلاصه ترکیبی مشاهده CPU را
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهدات CPU داغ و پایدار را flag می‌کند (`--cpu-core-warn`
    به‌علاوه `--hot-wall-warn-ms`)، بنابراین burstهای کوتاه راه‌اندازی به‌عنوان metric
    ثبت می‌شوند بدون اینکه شبیه رگرسیون چنددقیقه‌ای peg شدن gateway به نظر برسند.
  - از artifactهای ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime
    تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان suite مربوط به QA را داخل یک VM یک‌بارمصرف Linux با Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان حفظ می‌کند.
  - همان flagهای انتخاب provider/model را مانند `qa suite` دوباره استفاده می‌کند.
  - اجراهای live ورودی‌های auth پشتیبانی‌شده QA را که برای guest عملی هستند forward می‌کنند:
    کلیدهای provider مبتنی بر env، مسیر config مربوط به QA live provider، و `CODEX_HOME`
    وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر root مخزن بمانند تا guest بتواند از طریق workspace
    mountشده بنویسد.
  - گزارش و خلاصه عادی QA به‌علاوه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA پشتیبانی‌شده با Docker را برای کار QA به سبک operator راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball مربوط به npm می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی OpenAI API-key را اجرا می‌کند، به‌طور
    پیش‌فرض Telegram را پیکربندی می‌کند، تأیید می‌کند runtime بسته‌بندی‌شده Plugin
    بدون تعمیر وابستگی راه‌اندازی load می‌شود، doctor را اجرا می‌کند، و یک نوبت agent
    محلی را در برابر endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان lane نصب بسته‌بندی‌شده با Discord از
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای app ساخته‌شده درباره transcriptهای context تعبیه‌شده runtime
    اجرا می‌کند. تأیید می‌کند context پنهان runtime مربوط به OpenClaw به‌عنوان یک پیام
    custom غیرنمایشی persist می‌شود، نه اینکه به نوبت قابل‌مشاهده کاربر leak شود؛ سپس یک
    session JSONL خرابِ affected را seed می‌کند و تأیید می‌کند
    `openclaw doctor --fix` آن را با یک backup به branch فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک package candidate مربوط به OpenClaw را در Docker نصب می‌کند، onboarding بسته
    نصب‌شده را اجرا می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس lane
    زنده QA برای Telegram را با همان بسته نصب‌شده به‌عنوان SUT Gateway دوباره استفاده می‌کند.
  - wrapper فقط منبع harness مربوط به `qa-lab` را از checkout mount می‌کند؛ بسته نصب‌شده
    مالک `dist`، `openclaw/plugin-sdk` و runtime Pluginهای bundled است تا lane، Pluginهای
    checkout فعلی را با بسته تحت آزمون ترکیب نکند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمودن
    یک tarball محلی resolveشده به‌جای نصب از registry،
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - به‌طور پیش‌فرض timing تکرارشونده RTT را با
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` در `qa-evidence.json` منتشر می‌کند.
    برای تنظیم اجرای RTT، `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`،
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` یا
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` را override کنید.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` فهرستی جداشده با کاما از شناسه‌های check مربوط به
    Telegram QA را برای نمونه‌برداری می‌پذیرد؛ وقتی تنظیم نشده باشد، check پیش‌فرض
    دارای قابلیت RTT برابر `telegram-mentioned-message-reply` است.
  - از همان credentialهای env مربوط به Telegram یا منبع credential مربوط به Convex مانند
    `pnpm openclaw qa telegram` استفاده می‌کند. برای automation مربوط به CI/release،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک role secret تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک Convex role secret در CI حاضر باشند،
    wrapper مربوط به Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - wrapper، env مربوط به credentialهای Telegram یا Convex را پیش از کار build/install
    در Docker روی میزبان validate می‌کند. `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    را فقط وقتی تنظیم کنید که عمداً setup پیش از credential را debug می‌کنید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` مقدار shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` را فقط برای این lane override می‌کند. وقتی credentialهای
    Convex انتخاب شده‌اند و هیچ roleای تنظیم نشده است، wrapper در CI از `ci` و خارج از CI
    از `maintainer` استفاده می‌کند.
  - GitHub Actions این lane را به‌عنوان گردش‌کار دستی maintainer با نام
    `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. این گردش‌کار از
    محیط `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای proof محصول در side-run
  در برابر یک بسته candidate ارائه می‌کند. این گردش‌کار یک ref مورداعتماد، spec منتشرشده npm،
  URL مربوط به tarball با HTTPS به‌همراه SHA-256، یا artifact مربوط به tarball از اجرای دیگر را
  می‌پذیرد، `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` upload می‌کند،
  سپس scheduler موجود Docker E2E را با profileهای lane شامل smoke، package، product، full
  یا custom اجرا می‌کند. برای اجرای گردش‌کار Telegram QA در برابر همان artifact
  `package-under-test`، `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
  - proof محصول برای آخرین beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- proof مربوط به URL دقیق tarball به digest نیاز دارد و از سیاست ایمنی URL عمومی استفاده می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- mirrorهای enterprise/private tarball از سیاست صریح trusted-source استفاده می‌کنند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` فایل `.github/package-trusted-sources.json` را از ref مورداعتماد گردش‌کار می‌خواند و credentialهای URL یا bypass شبکه خصوصی به‌صورت workflow-input را نمی‌پذیرد. اگر policy نام‌گذاری‌شده bearer auth را declare کند، secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` را پیکربندی کنید.

- proof مربوط به artifact یک artifact از نوع tarball را از اجرای دیگر Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker pack و نصب می‌کند، Gateway را با OpenAI پیکربندی‌شده
    راه‌اندازی می‌کند، سپس channel/Pluginهای bundled را از طریق ویرایش‌های config فعال می‌کند.
  - تأیید می‌کند discovery مربوط به setup، Pluginهای قابل‌دانلودِ پیکربندی‌نشده را غایب
    باقی می‌گذارد، نخستین repair پیکربندی‌شده doctor هر Plugin قابل‌دانلود مفقود را صراحتاً
    نصب می‌کند، و restart دوم repair پنهان dependency را اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر و شناخته‌شده npm را نصب می‌کند، Telegram را پیش از اجرای
    `openclaw update --tag <candidate>` فعال می‌کند، و تأیید می‌کند doctor پس از update مربوط به
    candidate، debris وابستگی Plugin legacy را بدون repair postinstall در سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke مربوط به update نصب بسته‌بندی‌شده native را در guestهای Parallels اجرا می‌کند.
    هر platform انتخاب‌شده ابتدا بسته baseline درخواست‌شده را نصب می‌کند، سپس command نصب‌شده
    `openclaw update` را در همان guest اجرا می‌کند و نسخه نصب‌شده، وضعیت update، آمادگی
    gateway و یک نوبت agent محلی را تأیید می‌کند.
  - هنگام iterate روی یک guest از `--platform macos`، `--platform windows` یا
    `--platform linux` استفاده کنید. برای مسیر artifact خلاصه و وضعیت هر lane از `--json` استفاده کنید.
  - lane مربوط به OpenAI به‌طور پیش‌فرض از `openai/gpt-5.5` برای proof نوبت agent زنده
    استفاده می‌کند. وقتی عمداً model دیگری از OpenAI را validate می‌کنید، `--model <provider/model>`
    را pass کنید یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در timeout میزبان wrap کنید تا stallهای transport مربوط به Parallels
    نتوانند باقی پنجره testing را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script logهای تو در توی lane را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از اینکه فرض کنید wrapper بیرونی hang شده است، `windows-update.log`، `macos-update.log`
    یا `linux-update.log` را بررسی کنید.
  - update در Windows می‌تواند روی guest سرد 10 تا 15 دقیقه را در doctor پس از update و کار
    update package صرف کند؛ وقتی log تو در توی debug مربوط به npm در حال پیشروی است، این وضعیت
    همچنان سالم است.
  - این wrapper تجمیعی را هم‌زمان با laneهای smoke جداگانه Parallels برای macOS، Windows یا Linux
    اجرا نکنید. آن‌ها state مربوط به VM را share می‌کنند و ممکن است در restore snapshot، سرو کردن
    package یا state مربوط به gateway در guest با هم collision داشته باشند.
  - proof پس از update سطح عادی Pluginهای bundled را اجرا می‌کند، چون facadeهای capability مانند
    speech، image generation و media understanding از طریق APIهای runtime bundled load می‌شوند،
    حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای آزمون دود مستقیم پروتکل راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel با پشتوانه Docker اجرا می‌کند. فقط برای checkout سورس - نصب‌های بسته‌بندی‌شده `qa-lab` را ارائه نمی‌کنند.
  - CLI کامل، کاتالوگ پروفایل/سناریو، متغیرهای محیطی، و چیدمان آرتیفکت: [QA ماتریکس](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را با استفاده از توکن‌های ربات درایور و ربات SUT از محیط، در برابر یک گروه خصوصی واقعی اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید شناسه عددی چت Telegram باشد.
  - از `--credential-source convex` برای اعتبارنامه‌های اشتراکی تجمیع‌شده پشتیبانی می‌کند. به‌صورت پیش‌فرض از حالت محیط استفاده کنید، یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید تا به اجاره‌های تجمیع‌شده وارد شوید.
  - پیش‌فرض‌ها canary، دروازه‌گذاری mention، آدرس‌دهی فرمان، `/status`، پاسخ‌های mention‌شده ربات‌به‌ربات، و پاسخ‌های فرمان بومی هسته را پوشش می‌دهند. پیش‌فرض‌های `mock-openai` همچنین رگرسیون‌های قطعی زنجیره پاسخ و استریم پیام نهایی Telegram را پوشش می‌دهند. برای probeهای اختیاری مانند `session_status` از `--list-scenarios` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید از `--allow-failures` استفاده کنید.
  - به دو ربات متمایز در همان گروه خصوصی نیاز دارد، به‌طوری‌که ربات SUT نام کاربری Telegram داشته باشد.
  - برای مشاهده پایدار ربات‌به‌ربات، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو ربات فعال کنید و مطمئن شوید ربات درایور می‌تواند ترافیک ربات‌های گروه را مشاهده کند.
  - گزارش QA Telegram، خلاصه، و `qa-evidence.json` را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهنده شامل RTT از درخواست ارسال درایور تا پاسخ مشاهده‌شده SUT هستند.

`Mantis Telegram Live` پوشش شواهد PR پیرامون این مسیر است. این پوشش ref نامزد را با اعتبارنامه‌های Telegram اجاره‌شده از Convex اجرا می‌کند، بسته گزارش/شواهد QA ویرایش‌شده را در مرورگر دسکتاپ Crabbox رندر می‌کند، شواهد MP4 ضبط می‌کند، یک GIF کوتاه‌شده بر اساس حرکت تولید می‌کند، بسته آرتیفکت را آپلود می‌کند، و وقتی `pr_number` تنظیم شده باشد شواهد درون‌خطی PR را از طریق Mantis GitHub App ارسال می‌کند. نگه‌دارندگان می‌توانند آن را از رابط کاربری Actions از طریق `Mantis Scenario` (`scenario_id:
telegram-live`) یا مستقیماً از یک نظر pull request شروع کنند:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` پوشش agentic بومی Telegram Desktop برای اثبات تصویری قبل/بعد PR است. آن را از رابط کاربری Actions با `instructions` آزاد، از طریق `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، یا از یک نظر PR شروع کنید:

```text
@openclaw-mantis telegram desktop proof
```

عامل Mantis، PR را می‌خواند، تصمیم می‌گیرد چه رفتار قابل‌مشاهده‌ای در Telegram تغییر را اثبات می‌کند، مسیر اثبات Crabbox Telegram Desktop کاربر واقعی را روی refهای مبنا و نامزد اجرا می‌کند، تا زمانی که GIFهای بومی مفید شوند تکرار می‌کند، یک manifest جفت‌شده `motionPreview` می‌نویسد، و وقتی `pr_number` تنظیم شده باشد همان جدول GIF دوستونه را از طریق Mantis GitHub App ارسال می‌کند.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - یک دسکتاپ لینوکس Crabbox را اجاره یا بازاستفاده می‌کند، Telegram Desktop بومی را نصب می‌کند، OpenClaw را با توکن ربات SUT Telegram اجاره‌شده پیکربندی می‌کند، Gateway را راه‌اندازی می‌کند، و شواهد اسکرین‌شات/MP4 را از دسکتاپ VNC قابل‌مشاهده ضبط می‌کند.
  - به‌صورت پیش‌فرض از `--credential-source convex` استفاده می‌کند تا workflowها فقط به secret کارگزار Convex نیاز داشته باشند. برای استفاده از متغیرهای `OPENCLAW_QA_TELEGRAM_*` مشابه `pnpm openclaw qa telegram`، از `--credential-source env` استفاده کنید.
  - Telegram Desktop همچنان به login/profile کاربر نیاز دارد. توکن ربات فقط OpenClaw را پیکربندی می‌کند. برای یک آرشیو پروفایل `.tgz` با base64 از `--telegram-profile-archive-env <name>` استفاده کنید، یا از `--keep-lease` استفاده کنید و یک‌بار به‌صورت دستی از طریق VNC وارد شوید.
  - `mantis-telegram-desktop-builder-report.md`، `mantis-telegram-desktop-builder-summary.json`، `telegram-desktop-builder.png`، و `telegram-desktop-builder.mp4` را زیر دایرکتوری خروجی می‌نویسد.

مسیرهای انتقال زنده یک قرارداد استاندارد مشترک دارند تا انتقال‌های جدید از هم فاصله نگیرند؛ ماتریس پوشش هر مسیر در [نمای کلی QA → پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه مصنوعی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای QA انتقال زنده فعال باشد، QA lab یک اجاره انحصاری از pool با پشتوانه Convex می‌گیرد، در زمان اجرای مسیر برای آن اجاره Heartbeat می‌فرستد، و هنگام خاموشی اجاره را آزاد می‌کند. نام این بخش پیش از پشتیبانی Discord، Slack، و WhatsApp ایجاد شده است؛ قرارداد اجاره در همه kindها مشترک است.

اسکلت پروژه مرجع Convex:

- `qa/convex-credential-broker/`

متغیرهای محیطی الزامی:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض محیط: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci`، و در غیر این صورت `maintainer`)

متغیرهای محیطی اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسه trace اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex با `http://` لوپ‌بک برای توسعه صرفاً محلی اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` در عملیات عادی باید از `https://` استفاده کند.

فرمان‌های مدیریتی نگه‌دارنده (افزودن/حذف/فهرست pool) به‌طور مشخص به `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای نگه‌دارندگان:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، secretهای کارگزار، پیشوند endpoint، timeout HTTP، و دسترسی admin/list را بدون چاپ مقدار secret بررسی کنید. برای خروجی قابل‌خواندن توسط ماشین در اسکریپت‌ها و ابزارهای CI از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل‌تلاش‌مجدد: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - موفقیت: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /release`
  - درخواست: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - موفقیت: `{ status: "ok" }` (یا `2xx` خالی)
- `POST /admin/add` (فقط secret نگه‌دارنده)
  - درخواست: `{ kind, actorId, payload, note?, status? }`
  - موفقیت: `{ status: "ok", credential }`
- `POST /admin/remove` (فقط secret نگه‌دارنده)
  - درخواست: `{ credentialId, actorId }`
  - موفقیت: `{ status: "ok", changed, credential }`
  - محافظ اجاره فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط secret نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای kind مربوط به Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید رشته شناسه عددی چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

شکل payload برای kind مربوط به کاربر واقعی Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`، `testerUserId`، و `telegramApiId` باید رشته‌های عددی باشند.
- `tdlibArchiveSha256` و `desktopTdataArchiveSha256` باید رشته‌های hex مربوط به SHA-256 باشند.
- `kind: "telegram-user"` برای workflow اثبات Mantis Telegram Desktop رزرو شده است. مسیرهای عمومی QA Lab نباید آن را acquire کنند.

payloadهای چندکاناله اعتبارسنجی‌شده توسط کارگزار:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

مسیرهای Slack نیز می‌توانند از pool اجاره بگیرند، اما اعتبارسنجی payload Slack در حال حاضر به‌جای کارگزار در runner QA Slack قرار دارد. برای ردیف‌های Slack از `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` استفاده کنید.

### افزودن یک کانال به QA

معماری و نام‌های کمک‌کننده سناریو برای adapterهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارد. حداقل سطح لازم: runner انتقال را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی افزایشی» در نظر بگیرید (و flakiness/هزینه افزایشی):

### واحد / یکپارچه‌سازی (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shard مربوط به `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به configهای هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرایندی (احراز هویت Gateway، routing، tooling، parsing، config)
  - رگرسیون‌های قطعی برای bugهای شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و `runtime-api.js` را با fixtureهای Plugin کوچک تولیدشده اثبات کنند، نه با APIهای سورس Pluginهای bundled واقعی. بارگذاری‌های API واقعی Plugin باید در مجموعه‌های contract/integration متعلق به Plugin باشند.

سیاست وابستگی بومی:

- نصب‌های آزمون پیش‌فرض buildهای opus بومی اختیاری Discord را رد می‌کنند. صدای Discord از `libopus-wasm` bundled استفاده می‌کند، و `@discordjs/opus` در `allowBuilds` غیرفعال می‌ماند تا آزمون‌های محلی و مسیرهای Testbox افزونه بومی را کامپایل نکنند.
- کارایی opus بومی را در مخزن benchmark مربوط به `libopus-wasm` مقایسه کنید، نه در حلقه‌های نصب/آزمون پیش‌فرض OpenClaw. `@discordjs/opus` را در `allowBuilds` پیش‌فرض روی `true` تنظیم نکنید؛ این کار باعث می‌شود حلقه‌های نامرتبط نصب/آزمون، کد بومی را کامپایل کنند.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند غول‌آسای بومی برای root-project، دوازده پیکربندی shard کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و مانع می‌شود کارهای auto-reply/extension باعث محروم شدن مجموعه‌های نامرتبط شوند.
    - `pnpm test --watch` همچنان از گراف پروژه بومی root در `vitest.config.ts` استفاده می‌کند، چون حلقه watch چند-shard عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` ابتدا هدف‌های صریح فایل/دایرکتوری را از مسیر laneهای scoped عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه کامل راه‌اندازی پروژه root را نمی‌پردازد.
    - `pnpm test:changed` به‌طور پیش‌فرض مسیرهای git تغییریافته را به laneهای scoped ارزان گسترش می‌دهد: ویرایش مستقیم تست‌ها، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح source، و وابسته‌های محلی import-graph. ویرایش‌های config/setup/package تست‌ها را به‌صورت گسترده اجرا نمی‌کنند مگر اینکه صریحاً از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه معمول بررسی محلی هوشمند برای کارهای محدود است. diff را به core، تست‌های core، extensions، تست‌های extension، apps، docs، release metadata، ابزارهای live Docker، و tooling طبقه‌بندی می‌کند، سپس فرمان‌های typecheck، lint، و guard مطابق را اجرا می‌کند. تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست، `pnpm test:changed` یا `pnpm test <target>` صریح را اجرا کنید. افزایش نسخه‌هایی که فقط release metadata هستند، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کنند، همراه با guardای که تغییرات package خارج از فیلد نسخه سطح بالا را رد می‌کند.
    - ویرایش‌های live Docker ACP harness بررسی‌های متمرکز اجرا می‌کنند: نحو shell برای اسکریپت‌های احراز هویت live Docker و dry-run زمان‌بند live Docker. تغییرات `package.json` فقط وقتی شامل می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و سایر سطح‌های package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های واحد سبک از نظر import از agents، commands، plugins، helperهای auto-reply، `plugin-sdk`، و ناحیه‌های ابزار pure مشابه از مسیر lane `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/runtime-heavy روی laneهای موجود می‌مانند.
    - فایل‌های source کمکی منتخب `plugin-sdk` و `commands` نیز اجراهای changed-mode را به تست‌های هم‌جوار صریح در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش helperها از اجرای دوباره کل مجموعه سنگین آن دایرکتوری اجتناب می‌کند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، تست‌های integration سطح بالای `reply.*`، و زیر‌درخت `src/auto-reply/reply/**` دارد. CI زیر‌درخت reply را بیشتر به shardهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import مالک کل دنباله Node نباشد.
    - CI معمول PR/main عمداً batch sweep مربوط به extension و shard فقط مخصوص release با نام `agentic-plugins` را رد می‌کند. Full Release Validation برای آن مجموعه‌های سنگین plugin/extension روی release candidateها، workflow فرزند جداگانه `Plugin Prerelease` را dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner توکار">

    - وقتی inputهای کشف message-tool یا context زمان اجرای compaction را تغییر می‌دهید، هر دو سطح پوشش را حفظ کنید.
    - برای مرزهای pure routing و normalization، regressionهای helper متمرکز اضافه کنید.
    - مجموعه‌های integration runner توکار را سالم نگه دارید:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`،
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`، و
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها تأیید می‌کنند که شناسه‌های scoped و رفتار compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ تست‌های فقط helper جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایه Vitest به‌طور پیش‌فرض از `threads` استفاده می‌کند.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner غیرایزوله در پروژه‌های root، پیکربندی‌های e2e، و live استفاده می‌کند.
    - lane ریشه UI تنظیمات و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی runner غیرایزوله مشترک اجرا می‌شود.
    - هر shard در `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض برای فرایندهای فرزند Node در Vitest گزینه `--no-maglev` را اضافه می‌کند تا آشفتگی compile در V8 هنگام اجراهای محلی بزرگ کاهش یابد. برای مقایسه با رفتار V8 استاندارد، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.
    - `scripts/run-vitest.mjs` اجراهای صریح غیر-watch در Vitest را پس از ۵ دقیقه بدون خروجی stdout یا stderr خاتمه می‌دهد. برای غیرفعال کردن watchdog در یک بررسی عمداً بی‌صدا، `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و lint، typecheck، یا تست‌ها را اجرا نمی‌کند.
    - وقتی به دروازه بررسی محلی هوشمند نیاز دارید، پیش از handoff یا push، `pnpm check:changed` را صریحاً اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از مسیر laneهای scoped ارزان عبور می‌کند. فقط وقتی agent تصمیم می‌گیرد یک ویرایش harness، config، package، یا contract واقعاً به پوشش گسترده‌تر Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را نگه می‌دارند، فقط با سقف worker بالاتر.
    - auto-scaling worker محلی عمداً محافظه‌کار است و وقتی میانگین بار host از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌طور پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode هنگام تغییر wiring تست‌ها درست بمانند.
    - config مقدار `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی hostهای پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی کارایی">

    - `pnpm test:perf:imports` گزارش مدت import در Vitest به‌علاوه خروجی import-breakdown را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییریافته از زمان `origin/main` محدود می‌کند.
    - داده زمان‌بندی shard در `.artifacts/vitest-shard-timings.json` نوشته می‌شود. اجراهای whole-config مسیر config را به‌عنوان کلید استفاده می‌کنند؛ shardهای CI با include-pattern نام shard را اضافه می‌کنند تا shardهای فیلترشده جداگانه قابل ردیابی باشند.
    - وقتی یک تست داغ همچنان بیشتر زمان خود را در importهای startup صرف می‌کند، dependencyهای سنگین را پشت یک مرز محلی باریک `*.runtime.ts` نگه دارید و همان مرز را مستقیماً mock کنید، به‌جای اینکه helperهای runtime را فقط برای عبور دادن از `vi.mock(...)` به‌صورت deep-import وارد کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed در `test:changed` را برای آن diff کامیت‌شده با مسیر بومی root-project مقایسه می‌کند و wall time به‌علاوه max RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبور دادن فهرست فایل‌های تغییریافته از `scripts/test-projects.mjs` و پیکربندی root Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile CPU برای thread اصلی درباره startup و transform overhead در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` برای مجموعه unit با file parallelism غیرفعال، profileهای CPU+heap مربوط به runner را می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (gateway)

- فرمان: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، مجبور به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌صورت پیش‌فرض راه‌اندازی می‌کند
  - چرخه synthetic gateway message، memory، و large-payload را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC query می‌کند
  - helperهای persistence برای diagnostic stability bundle را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، sampleهای synthetic RSS زیر بودجه فشار می‌مانند، و عمق صف‌های per-session دوباره به صفر تخلیه می‌شود
- انتظارها:
  - مناسب CI و بدون نیاز به key
  - lane محدود برای پیگیری regression پایداری، نه جایگزینی برای مجموعه کامل Gateway

### E2E (تجمیع repo)

- فرمان: `pnpm test:e2e`
- دامنه:
  - lane مربوط به gateway smoke E2E را اجرا می‌کند
  - lane مربوط به مرورگر mockشده Control UI را اجرا می‌کند
- انتظارها:
  - مناسب CI و بدون نیاز به key
  - نیازمند نصب بودن Playwright Chromium

### E2E (gateway smoke)

- فرمان: `pnpm test:e2e:gateway`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از Vitest `threads` با `isolate: false` استفاده می‌کند، مطابق با بقیه repo.
  - از workerهای adaptive استفاده می‌کند (CI: تا ۲، محلی: پیش‌فرض ۱).
  - به‌طور پیش‌فرض در حالت silent اجرا می‌شود تا overhead مربوط به console I/O کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد workerها (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی verbose کنسول.
- دامنه:
  - رفتار end-to-end Gateway چندنمونه‌ای
  - سطح‌های WebSocket/HTTP، جفت‌سازی node، و networking سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به key واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به تست‌های unit دارد (ممکن است کندتر باشد)

### E2E (مرورگر mockشده Control UI)

- فرمان: `pnpm test:ui:e2e`
- پیکربندی: `test/vitest/vitest.ui-e2e.config.ts`
- فایل‌ها: `ui/src/**/*.e2e.test.ts`
- دامنه:
  - Vite Control UI را راه‌اندازی می‌کند
  - یک صفحه واقعی Chromium را از طریق Playwright هدایت می‌کند
  - Gateway WebSocket را با mockهای قطعی درون مرورگر جایگزین می‌کند
- انتظارها:
  - به‌عنوان بخشی از `pnpm test:e2e` در CI اجرا می‌شود
  - به Gateway، agents، یا keyهای provider واقعی نیاز ندارد
  - dependency مرورگر باید حاضر باشد (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- فرمان: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - از یک Gateway محلی فعال OpenShell دوباره استفاده می‌کند
  - از یک Dockerfile محلی موقت یک sandbox می‌سازد
  - backend مربوط به OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار filesystem با canonical از راه دور را از طریق sandbox fs bridge تأیید می‌کند
- انتظارها:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌علاوه daemon فعال Docker نیاز دارد
  - به یک Gateway محلی فعال OpenShell و منبع config آن نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس sandbox تست را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌سازی تست هنگام اجرای دستی مجموعه گسترده‌تر e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` برای در دسترس گذاشتن config مربوط به Gateway ثبت‌شده برای تست ایزوله
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` برای override کردن IP Gateway مربوط به Docker که fixture سیاست host استفاده می‌کند

### Live (providerهای واقعی + modelهای واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده Pluginهای همراه زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - تغییرات قالب ارائه‌دهنده، ویژگی‌های خاص فراخوانی ابزار، مشکلات احراز هویت، و رفتار محدودیت نرخ را پیدا می‌کند
- انتظارات:
  - از نظر طراحی برای CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهنده، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به جای «همه‌چیز» ترجیح دهید
- اجراهای زنده از کلیدهای API از قبل صادرشده و پروفایل‌های احراز هویت آماده استفاده می‌کنند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد پیکربندی/احراز هویت را در یک خانه آزمایشی موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` را فقط وقتی تنظیم کنید که عمداً نیاز دارید آزمون‌های زنده از پوشه خانه واقعی شما استفاده کنند.
- `pnpm test:live` به‌طور پیش‌فرض از حالت کم‌صداتری استفاده می‌کند: خروجی پیشرفت `[live] ...` را نگه می‌دارد و لاگ‌های راه‌اندازی Gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر می‌خواهید لاگ‌های کامل راه‌اندازی برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (وابسته به ارائه‌دهنده): `*_API_KEYS` را با قالب ویرگول/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا بازنویسی مخصوص هر اجرای زنده را از طریق `OPENCLAW_LIVE_*_KEY` انجام دهید؛ آزمون‌ها روی پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خطوط پیشرفت را به stderr می‌فرستند تا فراخوانی‌های طولانی ارائه‌دهنده حتی وقتی ضبط کنسول Vitest کم‌صداست، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خطوط پیشرفت ارائه‌دهنده/Gateway بلافاصله هنگام اجراهای زنده جریان یابند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/پروب را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم‌گیری استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر تغییر زیادی داده‌اید `pnpm test:coverage`)
- دست زدن به شبکه Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «بات من از کار افتاده» / شکست‌های وابسته به ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (با دسترسی به شبکه)

برای ماتریس مدل زنده، smokeهای بک‌اند CLI، smokeهای ACP، harness سرور برنامه Codex، و همه آزمون‌های زنده ارائه‌دهنده رسانه (Deepgram، BytePlus، ComfyUI، تصویر، موسیقی، ویدئو، harness رسانه) - به‌علاوه مدیریت اعتبارنامه برای اجراهای زنده - [آزمودن مجموعه‌های زنده](/fa/help/testing-live) را ببینید. برای چک‌لیست اختصاصی به‌روزرسانی و اعتبارسنجی Plugin، [آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده کلید پروفایل متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و پوشه پیکربندی محلی، فضای کار، و فایل env پروفایل اختیاری شما را mount می‌کنند. نقطه‌های ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker در صورت نیاز سقف‌های عملی خودشان را نگه می‌دارند:
  `test:docker:live-models` به‌طور پیش‌فرض از مجموعه گزینش‌شده، پشتیبانی‌شده و پرسیگنال استفاده می‌کند، و
  `test:docker:live-gateway` به‌طور پیش‌فرض از `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` استفاده می‌کند. وقتی صراحتاً سقف کوچک‌تر یا اسکن بزرگ‌تر می‌خواهید، `OPENCLAW_LIVE_MAX_MODELS`
  یا متغیرهای env مربوط به Gateway را تنظیم کنید.
- `test:docker:all` تصویر Docker زنده را یک بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک بار به‌صورت tarball npm از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/بازاستفاده می‌کند. تصویر خام فقط اجراکننده Node/Git برای مسیرهای نصب/به‌روزرسانی/وابستگی Plugin است؛ آن مسیرها tarball از پیش ساخته‌شده را mount می‌کنند. تصویر عملکردی همان tarball را برای مسیرهای عملکرد برنامه ساخته‌شده در `/app` نصب می‌کند. تعریف‌های مسیر Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه انتخاب‌شده را اجرا می‌کند. تجمیع‌کننده از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای فرایند را کنترل می‌کند، در حالی که سقف‌های منابع مانع می‌شوند مسیرهای سنگین زنده، نصب npm، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک مسیر تنها از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا زمانی که ظرفیت دوباره در دسترس شود آن را تنها در حال اجرا نگه می‌دارد. پیش‌فرض‌ها 10 slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط وقتی میزبان Docker ظرفیت بیشتری دارد `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید. اجراکننده به‌طور پیش‌فرض یک پیش‌بررسی Docker انجام می‌دهد، containerهای قدیمی OpenClaw E2E را حذف می‌کند، هر 30 ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع زودتر مسیرهای طولانی‌تر استفاده می‌کند. برای چاپ manifest مسیر وزن‌دار بدون ساختن یا اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ برنامه CI برای مسیرهای انتخاب‌شده، نیازهای بسته/تصویر، و اعتبارنامه‌ها `node scripts/test-docker-all.mjs --plan-json` را اجرا کنید.
- `Package Acceptance` گیت بومی GitHub برای «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» است. یک بسته نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` حل می‌کند، آن را به‌عنوان `package-under-test` بارگذاری می‌کند، سپس مسیرهای قابل استفاده مجدد Docker E2E را به جای بسته‌بندی دوباره ref انتخاب‌شده، روی همان tarball دقیق اجرا می‌کند. پروفایل‌ها بر اساس گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد بسته/به‌روزرسانی/Plugin، ماتریس بازمانده ارتقای منتشرشده، پیش‌فرض‌های انتشار، و تریاژ شکست، [آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.
- بررسی‌های ساخت و انتشار پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف ساخته‌شده ایستا را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر راه‌اندازی پیش از dispatch وابستگی‌های بسته مانند Commander، رابط prompt، undici، یا logging را پیش از dispatch فرمان import کند، شکست می‌خورد؛ همچنین قطعه اجرای Gateway همراه را زیر بودجه نگه می‌دارد و importهای ایستای مسیرهای سرد شناخته‌شده Gateway را رد می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین راهنمای ریشه، راهنمای onboard، راهنمای doctor، status، شمای پیکربندی، و یک فرمان فهرست مدل را پوشش می‌دهد.
- سازگاری قدیمی پذیرش بسته در `2026.4.25` سقف‌گذاری شده است (`2026.4.25-beta.*` شامل می‌شود). تا آن حد، harness فقط شکاف‌های metadata مربوط به بسته‌های منتشرشده را تحمل می‌کند: ورودی‌های خصوصی فهرست QA حذف‌شده، `gateway install --wrapper` موجود نیست، فایل‌های patch در fixture git مشتق‌شده از tarball موجود نیستند، `update.channel` پایدارشده موجود نیست، مکان‌های قدیمی رکورد نصب Plugin، پایداری رکورد نصب marketplace موجود نیست، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای بسته‌های پس از `2026.4.25`، آن مسیرها شکست سخت هستند.
- اجراکننده‌های smoke container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:release-user-journey`، `test:docker:release-typed-onboarding`، `test:docker:release-media-memory`، `test:docker:release-upgrade-user-journey`، `test:docker:release-plugin-marketplace`، `test:docker:skill-install`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:agent-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح بالاتر را بررسی می‌کنند.
- مسیرهای Docker/Bash E2E که tarball بسته‌بندی‌شده OpenClaw را از طریق `scripts/lib/openclaw-e2e-instance.sh` نصب می‌کنند، برای `npm install` سقف `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` دارند (پیش‌فرض `600s`؛ برای غیرفعال کردن wrapper هنگام اشکال‌زدایی، `0` تنظیم کنید).

اجراکننده‌های Docker مدل زنده همچنین فقط خانه‌های احراز هویت CLI مورد نیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده باشد، همه موارد پشتیبانی‌شده را)، سپس آن‌ها را پیش از اجرا در خانه container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن انبار احراز هویت میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- smoke اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex، و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- smoke بک‌اند CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- smoke harness سرور برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- smokeهای مشاهده‌پذیری: `pnpm qa:otel:smoke`، `pnpm qa:prometheus:smoke`، و `pnpm qa:observability:smoke` مسیرهای خصوصی QA در checkout منبع هستند. آن‌ها عمداً بخشی از مسیرهای انتشار Docker بسته نیستند، زیرا tarball npm آزمایشگاه QA را حذف می‌کند.
- smoke زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر onboarding (TTY، داربست کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- smoke onboarding/channel/agent با tarball npm: `pnpm test:docker:npm-onboard-channel-agent` tarball بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق onboarding مبتنی بر env-ref به‌همراه Telegram به‌طور پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI شبیه‌سازی‌شده را اجرا می‌کند. با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از tarball از پیش ساخته‌شده دوباره استفاده کنید، با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` بازسازی میزبان را رد کنید، یا با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` کانال را تغییر دهید.

- آزمون دود مسیر کاربر انتشار: `pnpm test:docker:release-user-journey` بسته tarball فشرده‌شده OpenClaw را به‌صورت سراسری در یک خانه Docker تمیز نصب می‌کند، onboarding را اجرا می‌کند، یک ارائه‌دهنده OpenAI شبیه‌سازی‌شده را پیکربندی می‌کند، یک نوبت agent را اجرا می‌کند، Pluginهای خارجی را نصب/حذف نصب می‌کند، ClickClack را در برابر یک fixture محلی پیکربندی می‌کند، پیام‌رسانی خروجی/ورودی را تأیید می‌کند، Gateway را بازراه‌اندازی می‌کند، و doctor را اجرا می‌کند.
- آزمون دود onboarding نوع‌دار انتشار: `pnpm test:docker:release-typed-onboarding` بسته tarball فشرده‌شده را نصب می‌کند، `openclaw onboard` را از طریق یک TTY واقعی پیش می‌برد، OpenAI را به‌عنوان یک ارائه‌دهنده env-ref پیکربندی می‌کند، نبود ماندگاری کلید خام را تأیید می‌کند، و یک نوبت agent شبیه‌سازی‌شده را اجرا می‌کند.
- آزمون دود رسانه/حافظه انتشار: `pnpm test:docker:release-media-memory` بسته tarball فشرده‌شده را نصب می‌کند، درک تصویر از یک پیوست PNG، خروجی تولید تصویر سازگار با OpenAI، یادآوری جست‌وجوی حافظه، و بقای یادآوری در گذر از بازراه‌اندازی Gateway را تأیید می‌کند.
- آزمون دود مسیر کاربر ارتقای انتشار: `pnpm test:docker:release-upgrade-user-journey` به‌طور پیش‌فرض جدیدترین baseline منتشرشده قدیمی‌تر از tarball نامزد را نصب می‌کند، وضعیت ارائه‌دهنده/Plugin/ClickClack را روی بسته منتشرشده پیکربندی می‌کند، به tarball نامزد ارتقا می‌دهد، سپس مسیر اصلی agent/Plugin/channel را دوباره اجرا می‌کند. اگر baseline منتشرشده قدیمی‌تری وجود نداشته باشد، از نسخه نامزد دوباره استفاده می‌کند. baseline را با `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` بازنویسی کنید.
- آزمون دود بازارچه Plugin انتشار: `pnpm test:docker:release-plugin-marketplace` از یک بازارچه fixture محلی نصب می‌کند، Plugin نصب‌شده را به‌روزرسانی می‌کند، آن را حذف نصب می‌کند، و تأیید می‌کند CLI مربوط به Plugin همراه با هرس شدن فراداده نصب ناپدید می‌شود.
- آزمون دود نصب Skill: `pnpm test:docker:skill-install` بسته tarball فشرده‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، نصب‌های آرشیو بارگذاری‌شده را در پیکربندی غیرفعال می‌کند، slug فعلی skill زنده ClawHub را از جست‌وجو resolve می‌کند، آن را با `openclaw skills install` نصب می‌کند، و skill نصب‌شده به‌همراه فراداده مبدا/قفل `.clawhub` را تأیید می‌کند.
- آزمون دود تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` بسته tarball فشرده‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کانال پایدارشده و کارکرد Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون دود بازمانده ارتقا: `pnpm test:docker:upgrade-survivor` بسته tarball فشرده‌شده OpenClaw را روی یک fixture کاربر قدیمیِ آلوده، با agentها، پیکربندی channel، allowlistهای Plugin، وضعیت کهنه وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون ارائه‌دهنده زنده یا کلیدهای channel اجرا می‌کند، سپس یک Gateway loopback را شروع می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- آزمون دود بازمانده ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن baseline را با یک دستورالعمل فرمان baked پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به tarball نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway loopback را شروع می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید baselineهای دقیق محلی را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مثل `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد، و fixtureهای issue-شکل را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مثل `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این‌ها را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` آشکار می‌کند، tokenهای meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند، و Full Release Validation دروازه بسته release-soak را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌همراه `reported-issues` گسترش می‌دهد.
- آزمون دود context زمان اجرای session: `pnpm test:docker:session-runtime-context` ماندگاری transcript پنهان context زمان اجرا به‌همراه تعمیر doctor برای شاخه‌های تکراری prompt-rewrite آسیب‌دیده را تأیید می‌کند.
- آزمون دود نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک خانه ایزوله نصب می‌کند، و تأیید می‌کند `openclaw infer image providers --json` به‌جای hang کردن، ارائه‌دهندگان تصویر bundle‌شده را برمی‌گرداند. از یک tarball ازپیش‌ساخته با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، build میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک image ساخته‌شده Docker با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- آزمون دود Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک cache واحد npm را میان containerهای root، update، و direct-npm خود به‌اشتراک می‌گذارد. آزمون دود به‌روزرسانی پیش از ارتقا به tarball نامزد، به‌طور پیش‌فرض npm `latest` را baseline پایدار در نظر می‌گیرد. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` گردش‌کار Install Smoke بازنویسی کنید. بررسی‌های نصب‌کننده non-root یک cache ایزوله npm را نگه می‌دارند تا entryهای cache متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از cache root/update/direct-npm در اجرای دوباره محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI به‌روزرسانی سراسری تکراری direct-npm را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، script را به‌صورت محلی بدون آن env اجرا کنید.
- آزمون دود CLI حذف workspace مشترک agentها: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض image Dockerfile ریشه را می‌سازد، دو agent را با یک workspace در خانه container ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را تأیید می‌کند. از image install-smoke با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو container، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- آزمون دود snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) image منبع E2E به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP، URLهای link، کلیک‌پذیرهای cursor-promoted، ارجاع‌های iframe، و فراداده frame را پوشش می‌دهند.
- رگرسیون حداقل reasoning برای OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema ارائه‌دهنده را اجبار می‌کند و بررسی می‌کند detail خام در logهای Gateway ظاهر شود.
- پل channel MCP (Gateway seed‌شده + پل stdio + آزمون دود notification-frame خام Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP bundle OpenClaw (سرور MCP واقعی stdio + آزمون دود allow/deny پروفایل OpenClaw تعبیه‌شده): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP برای Cron/subagent (Gateway واقعی + teardown فرزند MCP stdio پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (آزمون دود نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry npm با وابستگی‌های hoisted، فراداده malformed بسته npm، refهای متحرک git، kitchen-sink مربوط به ClawHub، به‌روزرسانی‌های marketplace، و enable/inspect بسته Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت package/runtime پیش‌فرض kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور fixture محلی hermetic برای ClawHub استفاده می‌کند.
- آزمون دود به‌روزرسانی بدون تغییر Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون دود ماتریس چرخه‌عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix` بسته tarball فشرده‌شده OpenClaw را در یک container bare نصب می‌کند، یک Plugin npm را نصب می‌کند، enable/disable را تغییر وضعیت می‌دهد، آن را از طریق یک registry محلی npm ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس تأیید می‌کند uninstall همچنان وضعیت کهنه را حذف می‌کند و هم‌زمان metricهای RSS/CPU را برای هر فاز چرخه‌عمر log می‌کند.
- آزمون دود فراداده reload پیکربندی: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` آزمون دود نصب/به‌روزرسانی را برای مسیر محلی، `file:`، registry npm با وابستگی‌های hoisted، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و enable/inspect بسته Claude پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر را برای Pluginهای نصب‌شده پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب، enable، disable، ارتقا، تنزل، و uninstall کدِ مفقود را برای Plugin npm با ردیابی منابع پوشش می‌دهد.

برای prebuild و استفاده دوباره دستی از image عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های image مخصوص suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم شدن اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک image مشترک remote اشاره کند، scriptها اگر از قبل محلی نباشد آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون رفتار package/install را اعتبارسنجی می‌کنند نه runtime برنامه ساخته‌شده مشترک را.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را درون یک workdir موقت داخل کانتینر stage می‌کنند. این کار image زمان اجرا را
کم‌حجم نگه می‌دارد، در حالی که Vitest همچنان روی همان source/config دقیق محلی شما اجرا می‌شود.
مرحله staging از cacheهای بزرگ فقط‌محلی و خروجی‌های build برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلی برنامه یا
Gradle عبور می‌کند تا اجراهای زنده Docker چند دقیقه صرف کپی کردن
artifactهای وابسته به ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده Gateway، workerهای کانال
واقعی Telegram/Discord/غیره را داخل کانتینر شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است پوشش زنده Gateway
را در آن lane مربوط به Docker محدود یا حذف کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز عبور دهید.
`test:docker:openwebui` یک smoke سازگاری سطح بالاتر است: یک کانتینر Gateway متعلق به
OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال‌شده شروع می‌کند،
یک کانتینر Open WebUI pin شده را در برابر آن Gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، بررسی می‌کند که `/api/models`، `openclaw/default` را ارائه می‌دهد، سپس یک
درخواست chat واقعی را از طریق proxy مربوط به `/api/chat/completions` در Open WebUI ارسال می‌کند.
برای بررسی‌های CI مسیر انتشار که باید پس از ورود به Open WebUI و کشف مدل متوقف شوند،
بدون انتظار برای تکمیل مدل زنده، `OPENWEBUI_SMOKE_MODE=models` را تنظیم کنید.
اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم باشد راه‌اندازی سرد خودش را تمام کند.
این lane انتظار یک کلید مدل زنده قابل استفاده را دارد. آن را از طریق environment فرایند،
پروفایل‌های auth stage شده، یا یک `OPENCLAW_PROFILE_FILE` صریح ارائه کنید.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. یک کانتینر Gateway seeded را boot می‌کند،
یک کانتینر دوم را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف مکالمه route شده، خواندن transcriptها، metadata پیوست‌ها،
رفتار صف event زنده، routing ارسال outbound، و notificationهای channel +
permission به سبک Claude را روی پل MCP واقعی stdio بررسی می‌کند. بررسی notification
فریم‌های خام MCP stdio را مستقیماً inspect می‌کند تا smoke همان چیزی را اعتبارسنجی کند که
پل واقعاً emit می‌کند، نه فقط چیزی که یک SDK client خاص اتفاقاً surface می‌کند.
`test:docker:agent-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد.
image Docker repo را build می‌کند، یک سرور probe واقعی MCP با stdio را
داخل کانتینر شروع می‌کند، آن سرور را از طریق runtime داخلی bundle MCP متعلق به OpenClaw
materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند که `coding` و `messaging`
toolهای `bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده نیاز ندارد.
یک Gateway seeded را با یک سرور probe واقعی MCP با stdio شروع می‌کند، یک turn جداگانه cron
و یک turn فرزند one-shot با `sessions_spawn` را اجرا می‌کند، سپس بررسی می‌کند که
فرایند فرزند MCP بعد از هر اجرا خارج می‌شود.

Smoke دستی thread با زبان ساده ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routing thread در ACP لازم شود، بنابراین آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` که پیش از اجرای testها mount و source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از config/workspace dirهای موقت و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای نصب‌های cached CLI داخل Docker روی `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع testها داخل `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای محدودشده provider فقط دایرکتوری‌ها/فایل‌های لازم را mount می‌کنند که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنباط شده‌اند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها درون کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده مجدد از image موجود `openclaw:local-live` در rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه credentials از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای smoke مربوط به Open WebUI ارائه می‌دهد
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt بررسی nonce که توسط smoke مربوط به Open WebUI استفاده می‌شود
- `OPENWEBUI_IMAGE=...` برای override کردن tag image pin شده Open WebUI

## sanity مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای درون صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (CI-safe)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- فراخوانی tool از Gateway (OpenAI mock، Gateway واقعی + حلقه agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard در Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + اجرای auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای قابلیت اتکای agent (Skills)

ما از قبل چند test CI-safe داریم که مانند «evalهای قابلیت اتکای agent» رفتار می‌کنند:

- tool-calling mock از طریق Gateway واقعی + حلقه agent (`src/gateway/gateway.test.ts`).
- flowهای wizard end-to-end که wiring session و اثرهای config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **Decisioning:** وقتی skills در prompt فهرست می‌شوند، آیا agent skill درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **Compliance:** آیا agent پیش از استفاده `SKILL.md` را می‌خواند و گام‌ها/args لازم را دنبال می‌کند؟
- **Workflow contracts:** سناریوهای چندنوبتی که ترتیب tool، انتقال session history، و مرزهای sandbox را assert می‌کنند.

evalهای آینده باید ابتدا deterministic بمانند:

- یک scenario runner با providerهای mock برای assert کردن فراخوانی‌های tool + ترتیب، خواندن فایل skill، و wiring session.
- یک مجموعه کوچک از سناریوهای متمرکز بر skill (استفاده در برابر پرهیز، gating، prompt injection).
- evalهای live اختیاری (opt-in، env-gated) فقط پس از اینکه مجموعه CI-safe آماده شد.

## testهای contract (شکل plugin و channel)

testهای contract بررسی می‌کنند که هر plugin و channel ثبت‌شده با
contract مربوط به interface خود منطبق باشد. آن‌ها روی همه pluginهای کشف‌شده iterate می‌کنند و مجموعه‌ای از
assertionهای شکل و رفتار را اجرا می‌کنند. lane unit پیش‌فرض `pnpm test` عمداً
این فایل‌های shared seam و smoke را رد می‌کند؛ وقتی سطح‌های shared channel یا provider را تغییر می‌دهید،
دستورهای contract را به‌صورت صریح اجرا کنید.

### دستورها

- همه contractها: `pnpm test:contracts`
- فقط contractهای channel: `pnpm test:contracts:channels`
- فقط contractهای provider: `pnpm test:contracts:plugins`

### contractهای channel

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایه plugin (id، name، capabilities)
- **setup** - contract مربوط به setup wizard
- **session-binding** - رفتار session binding
- **outbound-payload** - ساختار payload پیام
- **inbound** - مدیریت پیام inbound
- **actions** - handlerهای action در channel
- **threading** - مدیریت Thread ID
- **directory** - API مربوط به directory/roster
- **group-policy** - اعمال group policy

### contractهای status در provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای status در channel
- **registry** - شکل registry مربوط به Plugin

### contractهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - contract مربوط به flow در auth
- **auth-choice** - choice/selection مربوط به auth
- **catalog** - API مربوط به catalog مدل
- **discovery** - کشف Plugin
- **loader** - loading مربوط به Plugin
- **runtime** - runtime مربوط به provider
- **shape** - شکل/interface مربوط به Plugin
- **wizard** - setup wizard

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا تغییر یک channel یا provider plugin
- پس از refactor کردن registration یا discovery مربوط به plugin

testهای contract در CI اجرا می‌شوند و به کلیدهای واقعی API نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک issue مربوط به provider/model را که در live کشف شده fix می‌کنید:

- در صورت امکان یک regression CI-safe اضافه کنید (provider mock/stub، یا capture کردن transformation دقیق شکل request)
- اگر ذاتاً فقط live است (rate limitها، policyهای auth)، test زنده را محدود و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که bug را می‌گیرد:
  - bug در conversion/replay درخواست provider → test مستقیم models
  - bug در pipeline مربوط به session/history/tool در Gateway → smoke زنده Gateway یا test mock Gateway به‌صورت CI-safe
- guardrail مربوط به traversal در SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata registry (`listSecretTargetRegistryEntries()`) برای هر کلاس SecretRef یک هدف نمونه derive می‌کند، سپس assert می‌کند exec idهای دارای traversal-segment رد می‌شوند.
  - اگر یک خانواده هدف SecretRef جدید با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. این test عمداً روی target idهای class‌بندی‌نشده fail می‌شود تا کلاس‌های جدید نتوانند بی‌سروصدا رد شوند.

## مرتبط

- [Testing live](/fa/help/testing-live)
- [Testing updates and plugins](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
