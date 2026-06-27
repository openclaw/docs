---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن رگرسیون‌ها برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway + عامل
summary: 'کیت آزمایش: مجموعه‌های unit/e2e/live، اجراکننده‌های Docker، و این‌که هر آزمون چه چیزی را پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-06-27T17:54:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه آزمون Vitest دارد (واحد/یکپارچه‌سازی، e2e، زنده) و مجموعه کوچکی
از اجراکننده‌های Docker. این سند راهنمای «چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- کدام دستورها را برای جریان‌های کاری رایج اجرا کنید (محلی، پیش از push، اشکال‌زدایی).
- آزمون‌های زنده چگونه اعتبارنامه‌ها را کشف می‌کنند و مدل‌ها/ارائه‌دهنده‌ها را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده، رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) - معماری، سطح دستور، نگارش سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) - مرجع برای `pnpm openclaw qa matrix`.
- [کارت امتیاز بلوغ](/fa/maturity/scorecard) - اینکه شواهد QA انتشار چگونه از تصمیم‌های پایداری و LTS پشتیبانی می‌کند.
- [کانال QA](/fa/channels/qa-channel) - Plugin انتقال مصنوعی که سناریوهای پشتیبانی‌شده توسط مخزن از آن استفاده می‌کنند.

این صفحه اجرای مجموعه‌های آزمون معمول و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های مخصوص QA در پایین ([اجراکننده‌های مخصوص QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و دوباره به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

در بیشتر روزها:

- گیت کامل (مورد انتظار پیش از push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر کل مجموعه به‌صورت محلی روی دستگاهی با منابع کافی: `pnpm test:max`
- حلقه watch مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای extension/channel را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست منفرد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA با پشتوانه Docker: `pnpm qa:lab:up`
- مسیر QA با پشتوانه VM لینوکس: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را لمس می‌کنید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعه E2E: `pnpm test:e2e`

## دایرکتوری‌های موقت آزمون

برای دایرکتوری‌های موقت متعلق به آزمون، helperهای مشترک در `test/helpers/temp-dir.ts` را ترجیح دهید. آن‌ها مالکیت را صریح می‌کنند و پاک‌سازی را در همان چرخه عمر آزمون نگه می‌دارند:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

وقتی یک آزمون از قبل مالک آرایه یا مجموعه‌ای از مسیرهاست، از `makeTempDir(tempDirs, prefix)` و `cleanupTempDirs(tempDirs)` استفاده کنید. از فراخوانی‌های bare جدید `fs.mkdtemp*` در آزمون‌ها پرهیز کنید، مگر اینکه یک مورد به‌طور صریح رفتار خام temp-dir را راستی‌آزمایی کند. وقتی یک آزمون عمدا به دایرکتوری موقت bare نیاز دارد، یک کامنت allow قابل حسابرسی با دلیل مشخص اضافه کنید:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

برای دیدپذیری مهاجرت، `node scripts/report-test-temp-creations.mjs` ایجاد bare temp-dir جدید را در خطوط diff افزوده‌شده گزارش می‌کند، بدون اینکه سبک‌های پاک‌سازی موجود را مسدود کند. دامنه فایل آن عمدا همان طبقه‌بندی مسیر آزمون را دنبال می‌کند که `scripts/changed-lanes.mjs` استفاده می‌کند، به‌جای اینکه یک heuristic جداگانه برای نام فایل test-helper نگه دارد، در حالی که خود پیاده‌سازی helper مشترک را رد می‌کند. `check:changed` این گزارش را برای مسیرهای آزمون تغییرکرده به‌عنوان سیگنال CI فقط هشدار اجرا می‌کند؛ یافته‌ها annotation هشدار GitHub هستند، نه شکست.

هنگام اشکال‌زدایی ارائه‌دهنده‌ها/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعه زنده (مدل‌ها + پروب‌های tool/image مربوط به Gateway): `pnpm test:live`
- هدف‌گیری آرام یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های عملکرد runtime: `OpenClaw Performance` را با
  `live_openai_candidate=true` برای یک نوبت agent واقعی `openai/gpt-5.5` یا
  `deep_profile=true` برای artifactهای CPU/heap/trace مربوط به Kova dispatch کنید. اجراهای زمان‌بندی‌شده روزانه
  artifactهای مسیر mock-provider، deep-profile و GPT 5.5 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند، وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد. گزارش
  mock-provider همچنین شامل اعداد boot سطح منبع Gateway، حافظه،
  plugin-pressure، hello-loop تکراری fake-model، و startup CLI است.
- sweep مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متن به‌علاوه یک پروب کوچک به سبک file-read اجرا می‌کند.
    مدل‌هایی که metadata آن‌ها ورودی `image` را اعلام می‌کند، یک نوبت کوچک image هم اجرا می‌کنند.
    هنگام ایزوله کردن شکست‌های ارائه‌دهنده، پروب‌های اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: `OpenClaw Scheduled Live And E2E Checks` روزانه و
    `OpenClaw Release Checks` دستی هر دو workflow قابل استفاده مجدد live/E2E را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل jobهای ماتریسی جداگانه مدل زنده Docker
    است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای مجدد متمرکز CI، `OpenClaw Live And E2E Checks (Reusable)`
    را با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - secretهای ارائه‌دهنده جدید و پرسیگنال را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و callerهای
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- آزمون دود bound-chat بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` bind می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌کند، سپس یک پاسخ ساده و یک route پیوست image را
    از طریق binding بومی Plugin به‌جای ACP راستی‌آزمایی می‌کند.
- آزمون دود harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های agent Gateway را از طریق harness app-server متعلق به Plugin مربوط به Codex اجرا می‌کند،
    `/codex status` و `/codex models` را راستی‌آزمایی می‌کند، و به‌صورت پیش‌فرض پروب‌های image،
    cron MCP، sub-agent و Guardian را تمرین می‌کند. هنگام ایزوله کردن شکست‌های دیگر
    app-server مربوط به Codex، پروب sub-agent را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز sub-agent، پروب‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از پروب sub-agent خارج می‌شود مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- آزمون دود نصب درخواستی Codex: `pnpm test:docker:codex-on-demand`
  - tarball بسته‌بندی‌شده OpenClaw را در Docker نصب می‌کند، راه‌اندازی اولیه با کلید API OpenAI را اجرا می‌کند،
    و راستی‌آزمایی می‌کند که Plugin مربوط به Codex به‌علاوه dependency
    `@openai/codex` به‌صورت درخواستی در root پروژه npm مدیریت‌شده دانلود شده‌اند.
- آزمون دود dependency ابزار Plugin زنده: `pnpm test:docker:live-plugin-tool`
  - یک fixture Plugin را با dependency واقعی `slugify` pack می‌کند، آن را از طریق
    `npm-pack:` نصب می‌کند، dependency را زیر root پروژه npm مدیریت‌شده راستی‌آزمایی می‌کند،
    سپس از یک مدل زنده OpenAI می‌خواهد ابزار Plugin را فراخوانی کند و slug مخفی را برگرداند.
- آزمون دود دستور rescue مربوط به Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی opt-in belt-and-suspenders برای سطح دستور rescue کانال پیام.
    `/crestodian status` را تمرین می‌کند، یک تغییر مدل پایدار را queue می‌کند،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را راستی‌آزمایی می‌کند.
- آزمون دود Docker planner مربوط به Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون config با یک Claude CLI ساختگی روی `PATH` اجرا می‌کند
    و راستی‌آزمایی می‌کند که fallback planner فازی به یک نوشتن config typed و audited ترجمه می‌شود.
- آزمون دود Docker اجرای نخست Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک state dir خالی OpenClaw شروع می‌کند، entrypoint مدرن onboard Crestodian را راستی‌آزمایی می‌کند،
    نوشتن‌های setup/model/agent/Discord Plugin + SecretRef را اعمال می‌کند،
    config را اعتبارسنجی می‌کند، و entryهای audit را راستی‌آزمایی می‌کند. همان مسیر setup حلقه ۰
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده شده است.
- آزمون دود هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، اجرا کنید
  `openclaw models list --provider moonshot --json`، سپس یک اجرای ایزوله
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  را در برابر `moonshot/kimi-k2.6` اجرا کنید. راستی‌آزمایی کنید که JSON، Moonshot/K2.6 را گزارش می‌کند و
  transcript دستیار، `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده از طریق متغیرهای محیطی allowlist که در پایین توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های مخصوص QA

این دستورها وقتی به واقع‌گرایی QA-lab نیاز دارید، کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در workflowهای اختصاصی اجرا می‌کند. parity عاملی زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار nested است، نه یک workflow مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. بررسی‌های انتشار stable/default
soak زنده/Docker کامل را پشت `run_release_soak=true` نگه می‌دارند؛
پروفایل `full`، soak را اجباری می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر parity mock، مسیر Matrix زنده،
مسیر Telegram زنده مدیریت‌شده با Convex، و مسیر Discord زنده مدیریت‌شده با Convex
به‌عنوان jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صریحا پاس می‌دهند، در حالی که پیش‌فرض CLI ماتریسی و ورودی workflow دستی
`all` باقی می‌ماند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از تایید انتشار، parity به‌علاوه مسیرهای سریع Matrix و Telegram را اجرا می‌کند،
و برای بررسی‌های transport انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا deterministic بمانند
و از startup معمول provider-plugin پرهیز کنند. این Gatewayهای انتقال زنده
memory search را غیرفعال می‌کنند؛ رفتار memory همچنان توسط مجموعه‌های parity QA
پوشش داده می‌شود.

shardهای live media انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند، که از قبل
`ffmpeg` و `ffprobe` را دارد. shardهای مدل/backend زنده Docker از image مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک بار برای commit انتخاب‌شده ساخته شده است،
سپس به‌جای بازسازی داخل هر shard، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA پشتیبانی‌شده توسط مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - آرتیفکت‌های سطح‌بالای `qa-evidence.json`، `qa-suite-summary.json` و
    `qa-suite-report.md` را برای مجموعه سناریوی انتخاب‌شده می‌نویسد، شامل
    انتخاب‌های سناریوی جریان ترکیبی، Vitest و Playwright.
  - وقتی با `pnpm openclaw qa run --qa-profile <profile>` اجرا شود، کارت امتیاز
    پروفایل رده‌بندی انتخاب‌شده را در همان `qa-evidence.json` قرار می‌دهد.
    `smoke-ci` شواهد سبک می‌نویسد، که `evidenceMode: "slim"` را تنظیم می‌کند و
    `execution` هر ورودی را حذف می‌کند. `release` برش گزینش‌شده آمادگی انتشار را پوشش می‌دهد؛
    `all` همه دسته‌های بلوغ فعال را انتخاب می‌کند و برای اجرای صریح گردش‌کارهای QA
    Profile Evidence در نظر گرفته شده است، وقتی یک آرتیفکت کارت امتیاز کامل
    لازم باشد.
  - به‌صورت پیش‌فرض چند سناریوی انتخاب‌شده را با workerهای ایزوله Gateway
    به‌صورت موازی اجرا می‌کند. `qa-channel` به‌صورت پیش‌فرض هم‌زمانی 4 دارد
    (محدود به تعداد سناریوهای انتخاب‌شده). از `--concurrency <count>` برای تنظیم
    تعداد workerها، یا از `--concurrency 1` برای مسیر سریال قدیمی‌تر استفاده کنید.
  - اگر هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی آرتیفکت‌ها را
    بدون کد خروج شکست می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی
    fixture و protocol-mock شروع می‌کند، بدون اینکه مسیر سناریوآگاه
    `mock-openai` را جایگزین کند.
- `pnpm openclaw qa coverage --match <query>`
  - شناسه‌های سناریو، عنوان‌ها، سطوح، شناسه‌های پوشش، ارجاع‌های مستندات، ارجاع‌های کد،
    plugins و نیازمندی‌های ارائه‌دهنده را جست‌وجو می‌کند، سپس هدف‌های suite مطابق را چاپ می‌کند.
  - وقتی رفتار یا مسیر فایل تغییرکرده را می‌دانید اما کوچک‌ترین سناریو را نمی‌دانید،
    این را قبل از اجرای QA Lab استفاده کنید. این فقط راهنماست؛ همچنان اثبات mock،
    live، Multipass، Matrix یا transport را بر اساس رفتاری که تغییر می‌کند انتخاب کنید.
- `pnpm test:plugins:kitchen-sink-live`
  - آزمون دشوار Plugin زنده OpenAI Kitchen Sink را از طریق QA Lab اجرا می‌کند. بسته خارجی
    Kitchen Sink را نصب می‌کند، موجودی سطح plugin SDK را راستی‌آزمایی می‌کند،
    `/healthz` و `/readyz` را probe می‌کند، شواهد CPU/RSS Gateway را ثبت می‌کند،
    یک نوبت زنده OpenAI را اجرا می‌کند، و diagnostics خصمانه را بررسی می‌کند.
    به احراز هویت زنده OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در نشست‌های
    Testbox هیدراته، وقتی helper مربوط به `openclaw-testbox-env` حاضر باشد،
    پروفایل احراز هویت زنده Testbox را به‌صورت خودکار source می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ شروع Gateway به‌علاوه یک بسته کوچک سناریوی mock QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه مشاهده CPU ترکیبی
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌صورت پیش‌فرض فقط مشاهدات CPU داغ پایدار را پرچم‌گذاری می‌کند (`--cpu-core-warn`
    به‌علاوه `--hot-wall-warn-ms`)، بنابراین جهش‌های کوتاه شروع به‌عنوان معیار ثبت می‌شوند
    بدون اینکه شبیه رگرسیون چنددقیقه‌ای درگیرشدن Gateway به نظر برسند.
  - از آرتیفکت‌های ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime
    تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان QA suite را داخل یک VM لینوکسی یک‌بارمصرف Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مثل `qa suite` روی میزبان حفظ می‌کند.
  - همان پرچم‌های انتخاب ارائه‌دهنده/مدل را مثل `qa suite` دوباره استفاده می‌کند.
  - اجراهای زنده ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای مهمان عملی هستند forward می‌کنند:
    کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده زنده QA، و `CODEX_HOME`
    وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا مهمان بتواند از طریق workspace
    mount شده به عقب بنویسد.
  - گزارش و خلاصه عادی QA به‌علاوه لاگ‌های Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک operator شروع می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - یک tarball npm از checkout فعلی می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی کلید API OpenAI را اجرا می‌کند،
    به‌صورت پیش‌فرض Telegram را پیکربندی می‌کند، راستی‌آزمایی می‌کند runtime بسته‌بندی‌شده Plugin
    بدون ترمیم dependency هنگام شروع load می‌شود، doctor را اجرا می‌کند، و یک نوبت agent
    محلی را در برابر endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای اپ ساخته‌شده جهت transcriptهای زمینه runtime تعبیه‌شده اجرا می‌کند.
    راستی‌آزمایی می‌کند زمینه runtime پنهان OpenClaw به‌عنوان یک پیام سفارشی غیرنمایشی
    persist می‌شود نه اینکه به نوبت قابل‌مشاهده کاربر نشت کند، سپس یک session JSONL خراب
    تحت تأثیر را seed می‌کند و راستی‌آزمایی می‌کند
    `openclaw doctor --fix` آن را با یک backup به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک نامزد بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند،
    Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر زنده QA Telegram را با همان
    بسته نصب‌شده به‌عنوان Gateway سامانه تحت آزمون دوباره استفاده می‌کند.
  - wrapper فقط منبع harness مربوط به `qa-lab` را از checkout mount می‌کند؛
    بسته نصب‌شده مالک `dist`، `openclaw/plugin-sdk` و runtime افزونه bundled است،
    تا مسیر، plugins مربوط به checkout فعلی را با بسته تحت آزمون ترکیب نکند.
  - پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛
    برای آزمودن یک tarball محلی resolve شده به‌جای نصب از registry،
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - به‌صورت پیش‌فرض با `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` زمان‌بندی RTT تکرارشده را
    در `qa-evidence.json` منتشر می‌کند. برای تنظیم اجرای RTT،
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`،
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` یا
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` را override کنید.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` یک فهرست جداشده با کاما از شناسه‌های بررسی
    QA Telegram را برای نمونه‌گیری می‌پذیرد؛ وقتی تنظیم نشده باشد، بررسی پیش‌فرض
    سازگار با RTT برابر `telegram-mentioned-message-reply` است.
  - از همان credentials محیطی Telegram یا منبع credential Convex مثل
    `pnpm openclaw qa telegram` استفاده می‌کند. برای اتوماسیون CI/انتشار،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را به‌همراه
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک role secret تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک Convex role secret در CI حاضر باشند،
    wrapper مربوط به Docker به‌صورت خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install در Docker، محیط credential مربوط به Telegram یا Convex
    را روی میزبان validate می‌کند. فقط وقتی عمداً در حال debug کردن setup پیش از credential هستید
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` را تنظیم کنید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر،
    `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را override می‌کند. وقتی credentials مربوط به Convex
    انتخاب شده‌اند و هیچ نقشی تنظیم نشده، wrapper در CI از `ci` و بیرون از CI از
    `maintainer` استفاده می‌کند.
  - GitHub Actions این مسیر را به‌عنوان گردش‌کار دستی maintainer
    `NPM Telegram Beta E2E` ارائه می‌کند. روی merge اجرا نمی‌شود. این گردش‌کار از
    محیط `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول side-run
  در برابر یک بسته نامزد ارائه می‌کند. یک ref قابل‌اعتماد، spec منتشرشده npm،
  URL tarball از نوع HTTPS به‌همراه SHA-256، یا آرتیفکت tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` upload می‌کند، سپس
  scheduler موجود Docker E2E را با پروفایل‌های مسیر smoke، package، product، full یا custom
  اجرا می‌کند. برای اجرای گردش‌کار QA Telegram در برابر همان آرتیفکت `package-under-test`،
  `telegram_mode=mock-openai` یا `live-frontier` را تنظیم کنید.
  - تازه‌ترین اثبات محصول beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- اثبات URL دقیق tarball به digest نیاز دارد و از سیاست ایمنی URL عمومی استفاده می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- mirrorهای tarball سازمانی/خصوصی از یک سیاست explicit trusted-source استفاده می‌کنند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` فایل `.github/package-trusted-sources.json` را از ref مورد اعتماد گردش‌کار می‌خواند و credentials مربوط به URL یا bypass شبکه خصوصی از ورودی گردش‌کار را نمی‌پذیرد. اگر سیاست نام‌گذاری‌شده bearer auth را اعلام کند، secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` را پیکربندی کنید.

- اثبات آرتیفکت یک آرتیفکت tarball را از اجرای Actions دیگر download می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker pack و install می‌کند، Gateway را با OpenAI پیکربندی‌شده
    شروع می‌کند، سپس channel/pluginsهای bundled را از طریق ویرایش‌های config فعال می‌کند.
  - راستی‌آزمایی می‌کند setup discovery افزونه‌های downloadable پیکربندی‌نشده را غایب نگه می‌دارد،
    اولین ترمیم doctor پیکربندی‌شده هر plugin قابل‌دانلود گم‌شده را صراحتاً نصب می‌کند،
    و restart دوم ترمیم dependency پنهان را اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر شناخته‌شده npm را نصب می‌کند، پیش از اجرای
    `openclaw update --tag <candidate>`، Telegram را فعال می‌کند، و راستی‌آزمایی می‌کند
    doctor پس از update نامزد، بقایای dependency قدیمی plugin را بدون ترمیم postinstall سمت harness
    پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke به‌روزرسانی نصب بسته‌بندی‌شده native را روی مهمان‌های Parallels اجرا می‌کند. هر
    platform انتخاب‌شده ابتدا بسته baseline درخواست‌شده را نصب می‌کند، سپس دستور
    `openclaw update` نصب‌شده را در همان مهمان اجرا می‌کند و نسخه نصب‌شده،
    وضعیت update، آمادگی Gateway و یک نوبت agent محلی را راستی‌آزمایی می‌کند.
  - هنگام iteration روی یک مهمان، از `--platform macos`، `--platform windows` یا `--platform linux`
    استفاده کنید. برای مسیر آرتیفکت خلاصه و وضعیت هر مسیر از `--json` استفاده کنید.
  - مسیر OpenAI به‌صورت پیش‌فرض از `openai/gpt-5.5` برای اثبات نوبت agent زنده استفاده می‌کند.
    وقتی عمداً مدل OpenAI دیگری را validate می‌کنید، `--model <provider/model>` را pass کنید
    یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در یک timeout میزبان wrap کنید تا stallهای transport در Parallels
    نتوانند باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت لاگ‌های مسیر تو در تو را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از فرض کردن اینکه wrapper بیرونی hang شده است، `windows-update.log`، `macos-update.log`
    یا `linux-update.log` را inspect کنید.
  - update ویندوز می‌تواند روی یک مهمان سرد 10 تا 15 دقیقه را در کارهای doctor پس از update
    و update بسته صرف کند؛ وقتی لاگ debug مربوط به npm تو در تو در حال پیشروی است،
    این همچنان سالم است.
  - این wrapper تجمیعی را هم‌زمان با مسیرهای smoke مجزای Parallels macOS، Windows یا Linux
    اجرا نکنید. آن‌ها state مربوط به VM را به اشتراک می‌گذارند و می‌توانند روی restore snapshot،
    سرو کردن بسته، یا state مهمان Gateway برخورد کنند.
  - اثبات پس از update سطح عادی Plugin bundled را اجرا می‌کند، زیرا facadeهای capability مانند
    speech، image generation و media understanding از طریق APIهای runtime bundled بارگذاری می‌شوند،
    حتی وقتی خود نوبت agent فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای آزمون دود مستقیم پروتکل
    راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک homeserver یک‌بارمصرف Tuwunel با پشتوانه Docker اجرا می‌کند. فقط checkout منبع - نصب‌های بسته‌بندی‌شده `qa-lab` را ارائه نمی‌کنند.
  - CLI کامل، کاتالوگ پروفایل/سناریو، متغیرهای محیطی، و چیدمان artifact: [QA ماتریکس](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را در برابر یک گروه خصوصی واقعی، با استفاده از توکن‌های bot درایور و SUT از محیط، اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید شناسه عددی چت Telegram باشد.
  - از `--credential-source convex` برای اعتبارنامه‌های اشتراکی تجمیع‌شده پشتیبانی می‌کند. به‌صورت پیش‌فرض از حالت محیط استفاده کنید، یا برای ورود به اجاره‌های تجمیع‌شده `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - پیش‌فرض‌ها canary، gating اشاره، آدرس‌دهی فرمان، `/status`، پاسخ‌های اشاره‌شده bot-to-bot، و پاسخ‌های فرمان بومی هسته را پوشش می‌دهند. پیش‌فرض‌های `mock-openai` همچنین رگرسیون‌های زنجیره پاسخ قطعی و streaming پیام نهایی Telegram را پوشش می‌دهند. برای probeهای اختیاری مانند `session_status` از `--list-scenarios` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی
    artifactها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - به دو bot متمایز در همان گروه خصوصی نیاز دارد، در حالی که bot SUT یک نام کاربری Telegram ارائه کند.
  - برای مشاهده پایدار bot-to-bot، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو bot فعال کنید و مطمئن شوید bot درایور می‌تواند ترافیک bot گروه را مشاهده کند.
  - یک گزارش QA Telegram، خلاصه، و `qa-evidence.json` را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهنده شامل RTT از درخواست ارسال درایور تا پاسخ مشاهده‌شده SUT هستند.

`Mantis Telegram Live` پوشش‌دهنده شواهد PR پیرامون این مسیر است. ref نامزد را با اعتبارنامه‌های Telegram اجاره‌شده از Convex اجرا می‌کند، گزارش QA و بسته شواهد redacted را در مرورگر دسکتاپ Crabbox render می‌کند، شواهد MP4 ضبط می‌کند، یک GIF با motion-trim تولید می‌کند، بسته artifact را upload می‌کند، و وقتی `pr_number` تنظیم شده باشد شواهد inline PR را از طریق Mantis GitHub App پست می‌کند. نگه‌دارندگان می‌توانند آن را از Actions UI از طریق `Mantis Scenario` (`scenario_id:
telegram-live`) یا مستقیم از یک کامنت pull request شروع کنند:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` پوشش‌دهنده عاملی native Telegram Desktop
before/after برای اثبات بصری PR است. آن را از Actions UI با `instructions` آزاد، از طریق `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، یا از یک کامنت PR شروع کنید:

```text
@openclaw-mantis telegram desktop proof
```

عامل Mantis، PR را می‌خواند، تصمیم می‌گیرد چه رفتار قابل مشاهده در Telegram تغییر را اثبات می‌کند، مسیر اثبات real-user Crabbox Telegram Desktop را روی refهای baseline و نامزد اجرا می‌کند، تا زمانی که GIFهای native مفید شوند تکرار می‌کند، یک manifest جفت‌شده `motionPreview` می‌نویسد، و وقتی `pr_number` تنظیم شده باشد همان جدول GIF دو ستونه را از طریق Mantis GitHub App پست می‌کند.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - یک دسکتاپ Linux در Crabbox را اجاره یا بازاستفاده می‌کند، native Telegram Desktop را نصب می‌کند، OpenClaw را با یک توکن bot اجاره‌شده Telegram SUT پیکربندی می‌کند، gateway را شروع می‌کند، و از دسکتاپ قابل مشاهده VNC شواهد screenshot/MP4 ضبط می‌کند.
  - به‌صورت پیش‌فرض از `--credential-source convex` استفاده می‌کند تا workflowها فقط به secret کارگزار Convex نیاز داشته باشند. با همان متغیرهای `OPENCLAW_QA_TELEGRAM_*` مانند `pnpm openclaw qa telegram` از `--credential-source env` استفاده کنید.
  - Telegram Desktop همچنان به login/profile کاربر نیاز دارد. توکن bot فقط OpenClaw را پیکربندی می‌کند. برای آرشیو پروفایل `.tgz` با base64 از `--telegram-profile-archive-env <name>` استفاده کنید، یا از `--keep-lease` استفاده کنید و یک‌بار به‌صورت دستی از طریق VNC وارد شوید.
  - `mantis-telegram-desktop-builder-report.md`، `mantis-telegram-desktop-builder-summary.json`، `telegram-desktop-builder.png`، و `telegram-desktop-builder.mp4` را زیر دایرکتوری خروجی می‌نویسد.

مسیرهای transport زنده یک قرارداد استاندارد مشترک دارند تا transportهای جدید از هم منحرف نشوند؛ ماتریس پوشش هر مسیر در [نمای کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه گسترده synthetic است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای QA transport زنده فعال باشد، QA lab یک اجاره انحصاری از یک pool با پشتوانه Convex دریافت می‌کند، هنگام اجرای مسیر برای آن اجاره heartbeat می‌فرستد، و هنگام shutdown اجاره را آزاد می‌کند. نام این بخش پیش از پشتیبانی از Discord، Slack، و WhatsApp ایجاد شده است؛ قرارداد اجاره بین kindها مشترک است.

scaffold پروژه مرجع Convex:

- `qa/convex-credential-broker/`

متغیرهای محیطی لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض محیط: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci`، در غیر این صورت `maintainer`)

متغیرهای محیطی اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسه trace اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex با loopback `http://` برای توسعه فقط محلی اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` در عملیات عادی باید از `https://` استفاده کند.

فرمان‌های admin نگه‌دارنده (افزودن/حذف/فهرست pool) مشخصاً به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

helperهای CLI برای نگه‌دارندگان:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

قبل از اجراهای زنده از `doctor` استفاده کنید تا URL سایت Convex، secretهای broker، پیشوند endpoint، timeout HTTP، و دسترسی‌پذیری admin/list را بدون چاپ مقادیر secret بررسی کنید. برای خروجی machine-readable در scriptها و ابزارهای CI از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل تلاش مجدد: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - guard اجاره فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط secret نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

شکل payload برای kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید رشته شناسه عددی چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای malformed را رد می‌کند.

شکل payload برای kind کاربر واقعی Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`، `testerUserId`، و `telegramApiId` باید رشته‌های عددی باشند.
- `tdlibArchiveSha256` و `desktopTdataArchiveSha256` باید رشته‌های hex SHA-256 باشند.
- `kind: "telegram-user"` برای workflow اثبات Mantis Telegram Desktop رزرو شده است. مسیرهای عمومی QA Lab نباید آن را acquire کنند.

payloadهای چندکاناله اعتبارسنجی‌شده توسط broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

مسیرهای Slack نیز می‌توانند از pool اجاره بگیرند، اما اعتبارسنجی payloadهای Slack در حال حاضر به‌جای broker در runner QA مربوط به Slack قرار دارد. برای ردیف‌های Slack از
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
استفاده کنید.

### افزودن یک channel به QA

معماری و نام‌های scenario-helper برای adapterهای channel جدید در [نمای کلی QA → افزودن یک channel](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: runner transport را روی seam میزبان مشترک `qa-lab` پیاده‌سازی کنید، `qaRunners` را در manifest Plugin اعلام کنید، آن را به‌صورت `openclaw qa <runner>` mount کنید، و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی افزایشی» در نظر بگیرید (و flakiness/هزینه افزایشی):

### واحد / یکپارچه‌سازی (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون target از مجموعه shard با `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به configهای هر پروژه گسترش دهند
- فایل‌ها: inventoryهای هسته/واحد زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ آزمون‌های واحد UI در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرایندی (auth gateway، routing، tooling، parsing، config)
  - رگرسیون‌های قطعی برای bugهای شناخته‌شده
- انتظارها:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای کوچک تولیدشده Plugin اثبات کنند، نه
    APIهای source واقعی Pluginهای bundled. loadهای API واقعی Plugin به
    مجموعه‌های contract/integration متعلق به Plugin تعلق دارند.

سیاست dependency native:

- نصب‌های آزمون پیش‌فرض buildهای native اختیاری Discord opus را رد می‌کنند. Discord voice از `libopus-wasm` bundled استفاده می‌کند، و `@discordjs/opus` در `allowBuilds` غیرفعال می‌ماند تا آزمون‌های محلی و مسیرهای Testbox addon native را compile نکنند.
- عملکرد native opus را در repo benchmark مربوط به `libopus-wasm` مقایسه کنید، نه در حلقه‌های نصب/آزمون پیش‌فرض OpenClaw. `@discordjs/opus` را در `allowBuilds` پیش‌فرض روی `true` تنظیم نکنید؛ این باعث می‌شود حلقه‌های نامرتبط نصب/آزمون کد native را compile کنند.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند عظیم بومی برای پروژه ریشه، دوازده پیکربندی شارد کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و از گرسنه‌ماندن مجموعه‌های نامرتبط به‌خاطر کار auto-reply/افزونه جلوگیری می‌کند.
    - `pnpm test --watch` همچنان از گراف پروژه بومی ریشه در `vitest.config.ts` استفاده می‌کند، چون حلقه watch چندشاردی عملی نیست.
    - `pnpm test`، `pnpm test:watch`، و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیرهای دامنه‌مند عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه راه‌اندازی کامل پروژه ریشه را پرداخت نمی‌کند.
    - `pnpm test:changed` به‌صورت پیش‌فرض مسیرهای git تغییریافته را به مسیرهای دامنه‌مند کم‌هزینه گسترش می‌دهد: ویرایش‌های مستقیم تست، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح سورس، و وابستگان محلی گراف import. ویرایش‌های config/setup/package تست‌ها را گسترده اجرا نمی‌کنند مگر اینکه صراحتا از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه عادی بررسی هوشمند محلی برای کارهای محدود است. diff را به core، تست‌های core، افزونه‌ها، تست‌های افزونه، apps، docs، فراداده انتشار، ابزارهای Docker زنده، و tooling دسته‌بندی می‌کند، سپس دستورهای typecheck، lint، و guard متناظر را اجرا می‌کند. تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌هایی که فقط فراداده انتشار را تغییر می‌دهند، بررسی‌های هدفمند نسخه/config/وابستگی ریشه را اجرا می‌کنند، همراه با guardای که تغییرات package خارج از فیلد نسخه سطح بالا را رد می‌کند.
    - ویرایش‌های هارنس Docker ACP زنده بررسی‌های متمرکز اجرا می‌کنند: syntax پوسته برای اسکریپت‌های auth در Docker زنده و dry-run زمان‌بند Docker زنده. تغییرات `package.json` فقط وقتی وارد می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version، و سایر سطح‌های package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های واحد سبک از نظر import در agents، commands، plugins، helperهای auto-reply، `plugin-sdk`، و نواحی utility خالص مشابه از مسیر `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های stateful/سنگین از نظر runtime روی مسیرهای موجود باقی می‌مانند.
    - فایل‌های سورس helper منتخب در `plugin-sdk` و `commands` نیز اجراهای changed-mode را به تست‌های هم‌جوار صریح در همان مسیرهای سبک نگاشت می‌کنند، بنابراین ویرایش‌های helper از اجرای دوباره کل مجموعه سنگین آن دایرکتوری پرهیز می‌کنند.
    - `auto-reply` سطل‌های اختصاصی برای helperهای core سطح بالا، تست‌های یکپارچه‌سازی سطح بالای `reply.*`، و زیرشاخه `src/auto-reply/reply/**` دارد. CI زیرشاخه reply را بیشتر به شاردهای agent-runner، dispatch، و commands/state-routing تقسیم می‌کند تا یک سطل import-heavy مالک تمام دنباله Node نباشد.
    - CI عادی PR/main عمدا جاروب batch افزونه و شارد فقط-انتشار `agentic-plugins` را رد می‌کند. Full Release Validation برای آن مجموعه‌های سنگین plugin/افزونه روی release candidateها workflow فرزند جداگانه `Plugin Prerelease` را dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner توکار">

    - وقتی ورودی‌های کشف message-tool یا context زمان اجرای compaction را تغییر می‌دهید، هر دو سطح پوشش را نگه دارید.
    - برای مرزهای pure routing و normalization، رگرسیون‌های helper متمرکز اضافه کنید.
    - مجموعه‌های یکپارچه‌سازی runner توکار را سالم نگه دارید:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`،
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`، و
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - آن مجموعه‌ها تایید می‌کنند که شناسه‌های دامنه‌مند و رفتار Compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ تست‌های فقط-helper جایگزین کافی برای آن مسیرهای یکپارچه‌سازی نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایه Vitest به‌صورت پیش‌فرض `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و runner غیرایزوله را در پروژه‌های ریشه، e2e، و configهای زنده به‌کار می‌برد.
    - مسیر UI ریشه setup و optimizer مربوط به `jsdom` خود را نگه می‌دارد، اما آن هم روی runner مشترک غیرایزوله اجرا می‌شود.
    - هر شارد `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌صورت پیش‌فرض برای فرایندهای Node فرزند Vitest گزینه `--no-maglev` را اضافه می‌کند تا churn کامپایل V8 در اجراهای محلی بزرگ کاهش یابد. برای مقایسه با رفتار V8 استاندارد، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.
    - `scripts/run-vitest.mjs` اجراهای صریح غیر-watch مربوط به Vitest را پس از ۵ دقیقه بدون خروجی stdout یا stderr پایان می‌دهد. برای غیرفعال‌کردن watchdog در یک بررسی عمدا ساکت، `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام مسیرهای معماری را فعال می‌کند.
    - hook پیش از commit فقط formatting انجام می‌دهد. فایل‌های formatشده را دوباره stage می‌کند و lint، typecheck، یا تست‌ها را اجرا نمی‌کند.
    - وقتی به دروازه بررسی هوشمند محلی نیاز دارید، پیش از handoff یا push، `pnpm check:changed` را صریح اجرا کنید.
    - `pnpm test:changed` به‌صورت پیش‌فرض از مسیرهای دامنه‌مند کم‌هزینه عبور می‌کند. فقط وقتی agent تشخیص می‌دهد ویرایش harness، config، package، یا contract واقعا به پوشش گسترده‌تر Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار مسیریابی را نگه می‌دارند، فقط با سقف worker بالاتر.
    - مقیاس‌گذاری خودکار worker محلی عمدا محافظه‌کارانه است و وقتی میانگین بار host از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای همزمان Vitest به‌صورت پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای changed-mode وقتی سیم‌کشی تست تغییر می‌کند درست باقی بمانند.
    - config مقدار `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی hostهای پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک محل cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی کارایی">

    - `pnpm test:perf:imports` گزارش مدت import در Vitest را همراه با خروجی breakdown import فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌هایی محدود می‌کند که از `origin/main` تغییر کرده‌اند.
    - داده زمان‌بندی شارد در `.artifacts/vitest-shard-timings.json` نوشته می‌شود. اجراهای whole-config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ شاردهای CI با include-pattern نام شارد را اضافه می‌کنند تا شاردهای فیلترشده جداگانه قابل رهگیری باشند.
    - وقتی یک تست داغ همچنان بیشتر زمان خود را در importهای راه‌اندازی صرف می‌کند، وابستگی‌های سنگین را پشت یک seam محلی و محدود `*.runtime.ts` نگه دارید و همان seam را مستقیم mock کنید، به‌جای اینکه helperهای runtime را فقط برای عبوردادن از `vi.mock(...)` با deep-import وارد کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر `test:changed` مسیریابی‌شده را با مسیر بومی پروژه ریشه برای آن diff ثبت‌شده مقایسه می‌کند و wall time به‌همراه حداکثر RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبوردادن فهرست فایل‌های تغییریافته از `scripts/test-projects.mjs` و config ریشه Vitest benchmark می‌کند.
    - `pnpm test:perf:profile:main` برای overhead راه‌اندازی و transform در Vitest/Vite یک پروفایل CPU نخ اصلی می‌نویسد.
    - `pnpm test:perf:profile:runner` برای مجموعه unit، با غیرفعال‌بودن file parallelism، پروفایل‌های CPU+heap مربوط به runner را می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (gateway)

- دستور: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`، اجبارا با یک worker
- دامنه:
  - به‌صورت پیش‌فرض یک Gateway حلقه‌بازگشت واقعی را با diagnostics فعال راه‌اندازی می‌کند
  - churn مصنوعی پیام gateway، memory، و payload بزرگ را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق Gateway WS RPC پرس‌وجو می‌کند
  - helperهای persistence بسته diagnostic stability را پوشش می‌دهد
  - assert می‌کند recorder کران‌دار می‌ماند، نمونه‌های RSS مصنوعی زیر بودجه فشار باقی می‌مانند، و عمق صف هر session دوباره به صفر تخلیه می‌شود
- انتظارات:
  - مناسب CI و بدون نیاز به کلید
  - مسیر محدود برای پیگیری رگرسیون پایداری، نه جایگزین مجموعه کامل Gateway

### E2E (تجمیع repo)

- دستور: `pnpm test:e2e`
- دامنه:
  - مسیر E2E smoke مربوط به gateway را اجرا می‌کند
  - مسیر E2E مرورگر Control UI mockشده را اجرا می‌کند
- انتظارات:
  - مناسب CI و بدون نیاز به کلید
  - نیاز دارد Playwright Chromium نصب باشد

### E2E (gateway smoke)

- دستور: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E pluginهای bundled زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، مطابق با بقیه repo.
  - از workerهای adaptive استفاده می‌کند (CI: حداکثر ۲، محلی: به‌صورت پیش‌فرض ۱).
  - به‌صورت پیش‌فرض در حالت silent اجرا می‌شود تا overhead ورودی/خروجی console کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد worker (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌کردن دوباره خروجی verbose console.
- دامنه:
  - رفتار end-to-end مربوط به gateway چندنمونه‌ای
  - سطح‌های WebSocket/HTTP، جفت‌سازی گره، و networking سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به کلید واقعی نیاز ندارد
  - قطعات متحرک بیشتری نسبت به تست‌های unit دارد (ممکن است کندتر باشد)

### E2E (مرورگر mockشده Control UI)

- دستور: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- فایل‌ها: `ui/src/**/*.e2e.test.ts`
- دامنه:
  - Vite Control UI را راه‌اندازی می‌کند
  - یک صفحه Chromium واقعی را از طریق Playwright هدایت می‌کند
  - Gateway WebSocket را با mockهای deterministic درون‌مرورگر جایگزین می‌کند
- انتظارات:
  - به‌عنوان بخشی از `pnpm test:e2e` در CI اجرا می‌شود
  - به Gateway واقعی، agentها، یا کلیدهای provider نیاز ندارد
  - وابستگی مرورگر باید حاضر باشد (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke بک‌اند OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - از یک gateway محلی فعال OpenShell دوباره استفاده می‌کند
  - از یک Dockerfile محلی موقت sandbox می‌سازد
  - بک‌اند OpenShell در OpenClaw را روی `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار filesystem با canonical راه‌دور را از طریق پل sandbox fs تایید می‌کند
- انتظارات:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به CLI محلی `openshell` به‌همراه Docker daemon فعال نیاز دارد
  - به یک gateway محلی فعال OpenShell و منبع config آن نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس sandbox تست را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌کردن تست هنگام اجرای دستی مجموعه e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` برای نمایان‌کردن config ثبت‌شده gateway به تست ایزوله
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` برای override کردن IP مربوط به Docker gateway که fixture سیاست host استفاده می‌کند

### Live (providerهای واقعی + مدل‌های واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و تست‌های زنده Pluginهای بسته‌بندی‌شده زیر `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - تغییرات قالب ارائه‌دهنده، ویژگی‌های خاص فراخوانی ابزار، مشکلات احراز هویت، و رفتار محدودیت نرخ را تشخیص می‌دهد
- انتظارها:
  - بنا بر طراحی برای CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهنده، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده از کلیدهای API ازقبل exportشده و پروفایل‌های احراز هویت آماده‌شده استفاده می‌کنند.
- به‌صورت پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد پیکربندی/احراز هویت را در یک خانه تست موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- `OPENCLAW_LIVE_USE_REAL_HOME=1` را فقط زمانی تنظیم کنید که عمداً نیاز دارید تست‌های زنده از دایرکتوری خانه واقعی شما استفاده کنند.
- `pnpm test:live` به‌صورت پیش‌فرض در حالت کم‌صداتری اجرا می‌شود: خروجی پیشرفت `[live] ...` را نگه می‌دارد و لاگ‌های راه‌اندازی Gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر می‌خواهید لاگ‌های کامل راه‌اندازی برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (وابسته به ارائه‌دهنده): `*_API_KEYS` را با قالب کاما/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا بازنویسی اختصاصی هر اجرای زنده را از طریق `OPENCLAW_LIVE_*_KEY` انجام دهید؛ تست‌ها در پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خطوط پیشرفت را به stderr می‌فرستند تا فراخوانی‌های طولانی ارائه‌دهنده حتی وقتی capture کنسول Vitest ساکت است، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خطوط پیشرفت ارائه‌دهنده/Gateway در طول اجراهای زنده فوراً stream شوند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/کاوش را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را اجرا کنم؟

از این جدول تصمیم استفاده کنید:

- ویرایش منطق/تست‌ها: `pnpm test` را اجرا کنید (و اگر تغییر زیادی داده‌اید `pnpm test:coverage`)
- دست‌زدن به شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «بات من از کار افتاده» / خرابی‌های وابسته به ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## تست‌های زنده (درگیر با شبکه)

برای ماتریس مدل زنده، smokeهای backend مربوط به CLI، smokeهای ACP، harness سرور برنامه Codex،
و همه تست‌های زنده ارائه‌دهنده رسانه (Deepgram، BytePlus، ComfyUI، تصویر،
موسیقی، ویدئو، harness رسانه) - به‌همراه مدیریت اعتبارنامه برای اجراهای زنده - ببینید
[تست مجموعه‌های زنده](/fa/help/testing-live). برای چک‌لیست اختصاصی به‌روزرسانی و
اعتبارسنجی Plugin، ببینید
[تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins).

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زنده کلید-پروفایل متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و دایرکتوری پیکربندی محلی، workspace، و فایل env پروفایل اختیاری شما را mount می‌کنند. entrypointهای محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زنده Docker در صورت نیاز سقف‌های عملی خودشان را نگه می‌دارند:
  `test:docker:live-models` به‌صورت پیش‌فرض روی مجموعه گزینش‌شده، پشتیبانی‌شده، و پرسیگنال تنظیم است، و
  `test:docker:live-gateway` به‌صورت پیش‌فرض روی `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` تنظیم است. وقتی صراحتاً سقف کوچک‌تر یا اسکن بزرگ‌تری می‌خواهید،
  `OPENCLAW_LIVE_MAX_MODELS` یا متغیرهای env مربوط به Gateway را تنظیم کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار با `scripts/package-openclaw-for-docker.mjs` به‌صورت tarball npm بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/بازاستفاده می‌کند. تصویر خام فقط اجراکننده Node/Git برای laneهای نصب/به‌روزرسانی/وابستگی Plugin است؛ آن laneها tarball ازپیش‌ساخته را mount می‌کنند. تصویر عملکردی همان tarball را برای laneهای عملکرد برنامه ساخته‌شده در `/app` نصب می‌کند. تعریف‌های laneهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارند؛ منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` برنامه انتخاب‌شده را اجرا می‌کند. تجمیع از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای فرایند را کنترل می‌کند، درحالی‌که سقف‌های منابع مانع می‌شوند laneهای سنگین زنده، نصب npm، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک lane از سقف‌های فعال سنگین‌تر باشد، زمان‌بند هنوز می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا زمانی که ظرفیت دوباره در دسترس شود، آن را به‌تنهایی در حال اجرا نگه می‌دارد. پیش‌فرض‌ها ۱۰ slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را فقط زمانی تنظیم کنید که میزبان Docker headroom بیشتری دارد. اجراکننده به‌صورت پیش‌فرض یک preflight مربوط به Docker انجام می‌دهد، containerهای E2E کهنه OpenClaw را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی laneهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و از آن زمان‌بندی‌ها استفاده می‌کند تا در اجراهای بعدی laneهای طولانی‌تر را اول شروع کند. برای چاپ manifest وزن‌دار laneها بدون ساختن یا اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ برنامه CI برای laneهای انتخاب‌شده، نیازهای package/image، و اعتبارنامه‌ها از `node scripts/test-docker-all.mjs --plan-json` استفاده کنید.
- `Package Acceptance` دروازه package بومی GitHub برای «آیا این tarball قابل نصب به‌عنوان یک محصول کار می‌کند؟» است. یک package نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را با نام `package-under-test` upload می‌کند، سپس laneهای قابل استفاده مجدد Docker E2E را به‌جای بسته‌بندی دوباره ref انتخاب‌شده، علیه همان tarball دقیق اجرا می‌کند. پروفایل‌ها بر اساس گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد package/به‌روزرسانی/Plugin، ماتریس survivor ارتقای منتشرشده، پیش‌فرض‌های انتشار، و تریاژ خرابی، [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) را ببینید.
- بررسی‌های ساخت و انتشار پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. guard گراف ساخته‌شده ایستا را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر importهای راه‌اندازی پیش از dispatch وابستگی‌های package مانند Commander، prompt UI، undici، یا logging را قبل از dispatch فرمان وارد کنند، شکست می‌خورد؛ همچنین chunk اجرای Gateway بسته‌بندی‌شده را زیر بودجه نگه می‌دارد و importهای ایستای مسیرهای سرد شناخته‌شده Gateway را رد می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین help ریشه، help onboard، help doctor، status، schema پیکربندی، و یک فرمان فهرست مدل را پوشش می‌دهد.
- سازگاری legacy مربوط به Package Acceptance در `2026.4.25` سقف‌گذاری شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط gapهای metadata مربوط به packageهای منتشرشده را تحمل می‌کند: ورودی‌های حذف‌شده inventory خصوصی QA، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture گیت مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy رکورد نصب Plugin، نبود پایداری رکورد نصب marketplace، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای packageهای پس از `2026.4.25`، آن مسیرها شکست‌های سخت هستند.
- اجراکننده‌های smoke container: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:release-user-journey`، `test:docker:release-typed-onboarding`، `test:docker:release-media-memory`، `test:docker:release-upgrade-user-journey`، `test:docker:release-plugin-marketplace`، `test:docker:skill-install`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:agent-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح بالاتر را راستی‌آزمایی می‌کنند.
- laneهای Docker/Bash E2E که tarball بسته‌بندی‌شده OpenClaw را از طریق `scripts/lib/openclaw-e2e-instance.sh` نصب می‌کنند، `npm install` را در `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` سقف‌گذاری می‌کنند (پیش‌فرض `600s`؛ برای غیرفعال کردن wrapper هنگام اشکال‌زدایی، `0` را تنظیم کنید).

اجراکننده‌های Docker مدل زنده همچنین فقط خانه‌های احراز هویت CLI موردنیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده است، همه موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در خانه container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر دادن مخزن احراز هویت میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- smoke اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌صورت پیش‌فرض Claude، Codex، و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانه Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- smoke backend مربوط به CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- smoke harness سرور برنامه Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل dev: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- smokeهای مشاهده‌پذیری: `pnpm qa:otel:smoke`، `pnpm qa:prometheus:smoke`، و `pnpm qa:observability:smoke` laneهای private QA مربوط به checkout سورس هستند. آن‌ها عمداً بخشی از laneهای انتشار package Docker نیستند، چون tarball npm، QA Lab را حذف می‌کند.
- smoke زنده Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- ویزارد onboarding (TTY، scaffolding کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- smoke onboarding/channel/عامل مربوط به tarball npm: `pnpm test:docker:npm-onboard-channel-agent`، tarball بسته‌بندی‌شده OpenClaw را به‌صورت global در Docker نصب می‌کند، OpenAI را از طریق onboarding مبتنی بر env-ref و به‌صورت پیش‌فرض Telegram پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI mockشده را اجرا می‌کند. با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از tarball ازپیش‌ساخته بازاستفاده کنید، با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ساخت میزبان را رد کنید، یا با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` کانال را تغییر دهید.

- آزمون smoke مسیر کاربر انتشار: `pnpm test:docker:release-user-journey` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در یک home تمیز Docker نصب می‌کند، onboarding را اجرا می‌کند، یک ارائه‌دهنده OpenAI mock‌شده را پیکربندی می‌کند، یک نوبت agent را اجرا می‌کند، Pluginهای خارجی را نصب/حذف می‌کند، ClickClack را در برابر یک fixture محلی پیکربندی می‌کند، پیام‌رسانی خروجی/ورودی را تأیید می‌کند، Gateway را بازراه‌اندازی می‌کند، و doctor را اجرا می‌کند.
- آزمون smoke onboarding تایپ‌شده انتشار: `pnpm test:docker:release-typed-onboarding` تاربال بسته‌بندی‌شده را نصب می‌کند، `openclaw onboard` را از طریق یک TTY واقعی پیش می‌برد، OpenAI را به‌عنوان ارائه‌دهنده env-ref پیکربندی می‌کند، تأیید می‌کند که هیچ کلید خامی پایدار نمی‌شود، و یک نوبت agent mock‌شده را اجرا می‌کند.
- آزمون smoke رسانه/حافظه انتشار: `pnpm test:docker:release-media-memory` تاربال بسته‌بندی‌شده را نصب می‌کند، درک تصویر از یک پیوست PNG، خروجی تولید تصویر سازگار با OpenAI، بازیابی جست‌وجوی حافظه، و ماندگاری بازیابی پس از بازراه‌اندازی Gateway را تأیید می‌کند.
- آزمون smoke مسیر کاربر ارتقای انتشار: `pnpm test:docker:release-upgrade-user-journey` به‌صورت پیش‌فرض جدیدترین baseline منتشرشده قدیمی‌تر از تاربال نامزد را نصب می‌کند، وضعیت ارائه‌دهنده/Plugin/ClickClack را روی بسته منتشرشده پیکربندی می‌کند، به تاربال نامزد ارتقا می‌دهد، سپس مسیر اصلی agent/Plugin/channel را دوباره اجرا می‌کند. اگر baseline منتشرشده قدیمی‌تری وجود نداشته باشد، از نسخه نامزد دوباره استفاده می‌کند. baseline را با `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` override کنید.
- آزمون smoke بازار Plugin انتشار: `pnpm test:docker:release-plugin-marketplace` از یک بازار fixture محلی نصب می‌کند، Plugin نصب‌شده را به‌روزرسانی می‌کند، آن را حذف نصب می‌کند، و تأیید می‌کند که CLI Plugin همراه با هرس شدن metadata نصب ناپدید می‌شود.
- آزمون smoke نصب Skill: `pnpm test:docker:skill-install` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، نصب آرشیوهای بارگذاری‌شده را در config غیرفعال می‌کند، slug زنده فعلی Skill در ClawHub را از جست‌وجو resolve می‌کند، آن را با `openclaw skills install` نصب می‌کند، و Skill نصب‌شده به‌همراه metadata مبدأ/lock مربوط به `.clawhub` را تأیید می‌کند.
- آزمون smoke تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از package `stable` به git `dev` تغییر می‌دهد، کارکرد کانال پایدارشده و Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس دوباره به package `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون smoke بازمانده ارتقا: `pnpm test:docker:upgrade-survivor` تاربال بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمی آلوده، شامل agents، config کانال، allowlistهای Plugin، وضعیت stale وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. به‌روزرسانی package به‌همراه doctor غیرتعاملی را بدون کلیدهای ارائه‌دهنده یا کانال زنده اجرا می‌کند، سپس یک Gateway loopback را راه‌اندازی می‌کند و حفظ config/state به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- آزمون smoke بازمانده ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های کاربر موجود واقع‌گرایانه را seed می‌کند، آن baseline را با یک دستورالعمل فرمان baked پیکربندی می‌کند، config حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به تاربال نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway loopback را راه‌اندازی می‌کند و intentهای پیکربندی‌شده، حفظ state، startup، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک baseline را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` override کنید، از scheduler تجمیعی بخواهید baselineهای محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد، و fixtureهای issue-shaped را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این موارد را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` ارائه می‌کند، توکن‌های meta baseline مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند، و Full Release Validation گیت package مربوط به release-soak را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌همراه `reported-issues` گسترش می‌دهد.
- آزمون smoke context زمان اجرای session: `pnpm test:docker:session-runtime-context` پایداری transcript مخفی context زمان اجرا به‌همراه تعمیر doctor برای شاخه‌های prompt-rewrite تکراری تحت‌تأثیر را تأیید می‌کند.
- آزمون smoke نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک home ایزوله نصب می‌کند، و تأیید می‌کند که `openclaw infer image providers --json` به‌جای hang کردن، ارائه‌دهنده‌های تصویر bundled را برمی‌گرداند. از یک تاربال ازپیش‌ساخته با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، build میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک image ساخته‌شده Docker با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- آزمون smoke نصب‌کننده Docker: `bash scripts/test-install-sh-docker.sh` یک cache npm را میان containerهای root، update، و direct-npm خود به‌اشتراک می‌گذارد. آزمون smoke به‌روزرسانی به‌صورت پیش‌فرض پیش از ارتقا به تاربال نامزد، از npm `latest` به‌عنوان baseline پایدار استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` در workflow Install Smoke override کنید. بررسی‌های نصب‌کننده non-root یک cache npm ایزوله نگه می‌دارند تا ورودی‌های cache متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از cache root/update/direct-npm در rerunهای محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- Install Smoke CI به‌روزرسانی سراسری direct-npm تکراری را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، script را به‌صورت محلی بدون آن env اجرا کنید.
- آزمون smoke CLI حذف workspace مشترک توسط agents: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌صورت پیش‌فرض image ریشه Dockerfile را build می‌کند، دو agent را با یک workspace در یک container home ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را تأیید می‌کند. از image install-smoke با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو container، احراز هویت WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- آزمون smoke snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) image منبع E2E به‌همراه یک لایه Chromium را build می‌کند، Chromium را با CDP خام راه‌اندازی می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP شامل URLهای link، clickables ارتقایافته با cursor، refهای iframe، و metadata frame هستند.
- رگرسیون reasoning حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک server mock‌شده OpenAI را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema ارائه‌دهنده را force می‌کند و بررسی می‌کند detail خام در logهای Gateway ظاهر شود.
- پل channel MCP (Gateway seed‌شده + پل stdio + آزمون smoke notification-frame خام Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP bundle OpenClaw (server واقعی stdio MCP + آزمون smoke allow/deny پروفایل embedded OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP مربوط به Cron/subagent (Gateway واقعی + teardown فرزند stdio MCP پس از اجرای cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (آزمون smoke نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry npm با وابستگی‌های hoisted، metadata package npm بدشکل، refهای متحرک git، kitchen-sink در ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/inspect مربوط به Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub مقدار `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت package/runtime پیش‌فرض kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` override کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک server fixture محلی hermetic برای ClawHub استفاده می‌کند.
- آزمون smoke به‌روزرسانی بدون تغییر Plugin: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون smoke ماتریس چرخه عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix` تاربال بسته‌بندی‌شده OpenClaw را در یک container خام نصب می‌کند، یک Plugin npm را نصب می‌کند، enable/disable را تغییر می‌دهد، آن را از طریق یک registry محلی npm upgrade و downgrade می‌کند، code نصب‌شده را حذف می‌کند، سپس تأیید می‌کند uninstall همچنان state stale را حذف می‌کند و هم‌زمان metricهای RSS/CPU را برای هر فاز چرخه عمر log می‌کند.
- آزمون smoke metadata بارگذاری دوباره config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` آزمون smoke نصب/به‌روزرسانی برای مسیر محلی، `file:`، registry npm با وابستگی‌های hoisted، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های marketplace، و فعال‌سازی/inspect مربوط به Claude-bundle را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر را برای Pluginهای نصب‌شده پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب Plugin npm با ردیابی منابع، enable، disable، upgrade، downgrade، و uninstall در حالت missing-code را پوشش می‌دهد.

برای prebuild و استفاده دوباره دستی از image عملکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

overrideهای image مختص suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان هنگام تنظیم شدن اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک image مشترک remote اشاره می‌کند، اگر آن image از قبل محلی نباشد، scriptها آن را pull می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون به‌جای runtime مشترک built-app، رفتار package/install را اعتبارسنجی می‌کنند.

رانرهای Docker مدل زنده همچنین چک‌اوت فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و آن را داخل کانتینر در یک workdir موقت stage می‌کنند. این کار image زمان اجرا را سبک نگه می‌دارد، در حالی که Vitest همچنان روی دقیقاً همان سورس/پیکربندی محلی شما اجرا می‌شود.
مرحله staging از cacheهای بزرگ فقط‌محلی و خروجی‌های build برنامه مانند `.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلی برنامه یا Gradle عبور می‌کند تا اجراهای زنده Docker چند دقیقه را صرف کپی artifactهای مخصوص ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زنده Gateway، workerهای کانال واقعی Telegram/Discord/غیره را داخل کانتینر شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، بنابراین وقتی لازم است پوشش زنده Gateway را از آن lane Docker محدود یا مستثنی کنید، `OPENCLAW_LIVE_GATEWAY_*` را هم عبور دهید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک کانتینر Gateway متعلق به OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال شروع می‌کند، یک کانتینر Open WebUI پین‌شده را مقابل آن Gateway شروع می‌کند، از طریق Open WebUI وارد می‌شود، بررسی می‌کند که `/api/models` مدل `openclaw/default` را expose می‌کند، سپس یک درخواست chat واقعی را از طریق proxy `/api/chat/completions` در Open WebUI می‌فرستد.
برای بررسی‌های CI مسیر انتشار که باید بعد از ورود به Open WebUI و کشف مدل متوقف شوند، بدون انتظار برای تکمیل مدل زنده، `OPENWEBUI_SMOKE_MODE=models` را تنظیم کنید.
اجرای اول می‌تواند به‌طور محسوسی کندتر باشد، چون Docker ممکن است لازم باشد image مربوط به Open WebUI را pull کند و Open WebUI ممکن است لازم باشد راه‌اندازی سرد خودش را کامل کند.
این lane انتظار یک کلید مدل زنده قابل استفاده دارد. آن را از طریق محیط process، پروفایل‌های auth stage‌شده، یا یک `OPENCLAW_PROFILE_FILE` صریح فراهم کنید.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً deterministic است و به حساب واقعی Telegram، Discord یا iMessage نیاز ندارد. یک کانتینر Gateway seed‌شده را boot می‌کند، کانتینر دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس کشف مکالمه routed، خواندن transcript، metadata ضمیمه، رفتار صف رویداد زنده، routing ارسال خروجی، و اعلان‌های کانال + مجوز به سبک Claude را روی پل واقعی stdio MCP بررسی می‌کند. بررسی اعلان، frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke همان چیزی را اعتبارسنجی کند که پل واقعاً emit می‌کند، نه فقط چیزی را که یک SDK کلاینت خاص اتفاقاً surface می‌کند.
`test:docker:agent-bundle-mcp-tools` deterministic است و به کلید مدل زنده نیاز ندارد. image Docker مخزن را build می‌کند، یک سرور probe واقعی stdio MCP را داخل کانتینر شروع می‌کند، آن سرور را از طریق runtime داخلی bundle MCP در OpenClaw materialize می‌کند، tool را اجرا می‌کند، سپس بررسی می‌کند که `coding` و `messaging` toolهای `bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` deterministic است و به کلید مدل زنده نیاز ندارد. یک Gateway seed‌شده را با یک سرور probe واقعی stdio MCP شروع می‌کند، یک turn جداگانه cron و یک turn فرزند one-shot با `sessions_spawn` را اجرا می‌کند، سپس بررسی می‌کند که process فرزند MCP بعد از هر اجرا خارج می‌شود.

smoke دستی thread با زبان ساده ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routing threadهای ACP لازم شود، بنابراین آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که روی `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که روی `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` که قبل از اجرای تست‌ها mount و source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی فقط env varهایی که از `OPENCLAW_PROFILE_FILE` source شده‌اند، با استفاده از دایرکتوری‌های موقت config/workspace و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای نصب‌های cache‌شده CLI داخل Docker روی `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس قبل از شروع تست‌ها به `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای provider محدودشده فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنتاج شده‌اند mount می‌کنند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست comma مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدود کردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filter کردن providerها داخل کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده مجدد از یک image موجود `openclaw:local-live` برای اجرای دوباره‌هایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه creds از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای smoke Open WebUI expose می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای override کردن prompt بررسی nonce که توسط smoke Open WebUI استفاده می‌شود
- `OPENWEBUI_IMAGE=...` برای override کردن tag پین‌شده image مربوط به Open WebUI

## sanity مستندات

بعد از ویرایش‌های مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای درون صفحه هم نیاز دارید، اعتبارسنجی کامل anchorهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (امن برای CI)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- tool calling در Gateway (OpenAI mock، Gateway واقعی + loop عامل): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard در Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + enforce شدن auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## evalهای قابلیت اطمینان عامل (Skills)

ما از قبل چند تست امن برای CI داریم که شبیه «evalهای قابلیت اطمینان عامل» رفتار می‌کنند:

- tool-calling mock از طریق Gateway واقعی + loop عامل (`src/gateway/gateway.test.ts`).
- flowهای wizard انتهابه‌انتها که wiring session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

چیزی که هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skills در prompt فهرست شده‌اند، آیا عامل skill درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **انطباق:** آیا عامل قبل از استفاده `SKILL.md` را می‌خواند و مراحل/args لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای چند-turn که ترتیب tool، carryover تاریخچه session، و مرزهای sandbox را assert می‌کنند.

evalهای آینده باید اول deterministic بمانند:

- یک scenario runner با providerهای mock برای assert کردن tool callها + ترتیب، خواندن فایل skill، و wiring session.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر پرهیز، gating، prompt injection).
- evalهای زنده اختیاری (opt-in، env-gated) فقط بعد از آماده شدن suite امن برای CI.

## تست‌های قرارداد (شکل Plugin و کانال)

تست‌های قرارداد بررسی می‌کنند که هر Plugin و کانال ثبت‌شده با قرارداد interface خودش conform باشد. آن‌ها همه Pluginهای کشف‌شده را iterate می‌کنند و یک suite از assertionهای شکل و رفتار را اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً این فایل‌های مشترک seam و smoke را رد می‌کند؛ وقتی سطح‌های مشترک کانال یا provider را لمس می‌کنید، commandهای قرارداد را صریح اجرا کنید.

### Commandها

- همه قراردادها: `pnpm test:contracts`
- فقط قراردادهای کانال: `pnpm test:contracts:channels`
- فقط قراردادهای provider: `pnpm test:contracts:plugins`

### قراردادهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایه Plugin (id، name، capabilities)
- **setup** - قرارداد setup wizard
- **session-binding** - رفتار اتصال session
- **outbound-payload** - ساختار payload پیام
- **inbound** - مدیریت پیام inbound
- **actions** - handlerهای action کانال
- **threading** - مدیریت شناسه thread
- **directory** - API دایرکتوری/roster
- **group-policy** - اعمال policy گروه

### قراردادهای وضعیت provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای وضعیت کانال
- **registry** - شکل registry Plugin

### قراردادهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - قرارداد flow احراز هویت
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API کاتالوگ مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - runtime provider
- **shape** - شکل/interface Plugin
- **wizard** - setup wizard

### زمان اجرا

- بعد از تغییر exportها یا subpathهای plugin-sdk
- بعد از اضافه یا اصلاح یک Plugin کانال یا provider
- بعد از refactor کردن ثبت یا کشف Plugin

تست‌های قرارداد در CI اجرا می‌شوند و به کلیدهای واقعی API نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک مشکل provider/model را که در حالت زنده کشف شده fix می‌کنید:

- اگر ممکن است یک regression امن برای CI اضافه کنید (provider mock/stub، یا capture دقیق تبدیل شکل request)
- اگر ذاتاً فقط زنده است (rate limitها، policyهای auth)، تست زنده را محدود و از طریق env varها opt-in نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که bug را می‌گیرد:
  - bug تبدیل/replay درخواست provider → تست مستقیم models
  - bug pipeline session/history/tool در Gateway → smoke زنده Gateway یا تست mock امن برای CI در Gateway
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` از metadata registry (`listSecretTargetRegistryEntries()`) برای هر کلاس SecretRef یک target نمونه derive می‌کند، سپس assert می‌کند که exec idهای دارای segment پیمایش رد می‌شوند.
  - اگر یک خانواده target جدید SecretRef با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن تست به‌روزرسانی کنید. تست عمداً روی target idهای طبقه‌بندی‌نشده fail می‌شود تا کلاس‌های جدید نتوانند بی‌صدا نادیده گرفته شوند.

## مرتبط

- [تست زنده](/fa/help/testing-live)
- [تست به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
