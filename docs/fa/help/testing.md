---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن رگرسیون‌ها برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway و عامل
summary: 'کیت آزمایش: مجموعه‌های واحد/e2e/زنده، اجراکننده‌های Docker، و آنچه هر آزمایش پوشش می‌دهد'
title: آزمایش
x-i18n:
    generated_at: "2026-07-02T08:36:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw سه مجموعه آزمون Vitest دارد (واحد/یکپارچه‌سازی، سرتاسری، زنده) و مجموعه کوچکی
از اجراکننده‌های Docker. این سند راهنمای «ما چگونه آزمون می‌کنیم» است:

- هر مجموعه چه چیزهایی را پوشش می‌دهد (و عمدا چه چیزهایی را پوشش _نمی‌دهد_).
- برای گردش‌کارهای رایج کدام فرمان‌ها را اجرا کنید (محلی، پیش از پوش، اشکال‌زدایی).
- آزمون‌های زنده چگونه اعتبارنامه‌ها را پیدا می‌کنند و مدل‌ها/ارائه‌دهندگان را انتخاب می‌کنند.
- چگونه برای مشکلات واقعی مدل/ارائه‌دهنده رگرسیون اضافه کنید.

<Note>
**پشته QA (qa-lab، qa-channel، مسیرهای انتقال زنده)** جداگانه مستند شده است:

- [نمای کلی QA](/fa/concepts/qa-e2e-automation) - معماری، سطح فرمان، نگارش سناریو.
- [QA ماتریسی](/fa/concepts/qa-matrix) - مرجع برای `pnpm openclaw qa matrix`.
- [کارت امتیاز بلوغ](/fa/maturity/scorecard) - اینکه شواهد QA انتشار چگونه از تصمیم‌های پایداری و LTS پشتیبانی می‌کند.
- [کانال QA](/fa/channels/qa-channel) - Plugin انتقال مصنوعی که در سناریوهای پشتیبانی‌شده با مخزن استفاده می‌شود.

این صفحه اجرای مجموعه‌های آزمون معمولی و اجراکننده‌های Docker/Parallels را پوشش می‌دهد. بخش اجراکننده‌های ویژه QA در پایین ([اجراکننده‌های ویژه QA](#qa-specific-runners)) فراخوانی‌های مشخص `qa` را فهرست می‌کند و به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

بیشتر روزها:

- گیت کامل (مورد انتظار پیش از پوش): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای سریع‌تر مجموعه کامل محلی روی دستگاهی با منابع کافی: `pnpm test:max`
- حلقه واچ مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل اکنون مسیرهای اکستنشن/کانال را هم مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- وقتی روی یک شکست منفرد تکرار می‌کنید، ابتدا اجراهای هدفمند را ترجیح دهید.
- سایت QA با پشتوانه Docker: `pnpm qa:lab:up`
- مسیر QA با پشتوانه ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

وقتی آزمون‌ها را لمس می‌کنید یا اطمینان بیشتری می‌خواهید:

- گیت پوشش: `pnpm test:coverage`
- مجموعه سرتاسری: `pnpm test:e2e`

## دایرکتوری‌های موقت آزمون

برای دایرکتوری‌های موقت متعلق به آزمون، کمک‌کننده‌های مشترک در `test/helpers/temp-dir.ts` را ترجیح دهید. آن‌ها مالکیت را صریح می‌کنند و پاک‌سازی را در همان چرخه‌عمر آزمون نگه می‌دارند:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` عمدا هیچ روش پاک‌سازی دستی‌ای آشکار نمی‌کند؛ Vitest
پس از هر آزمون مالک پاک‌سازی است. کمک‌کننده‌های سطح پایین موجود برای آزمون‌هایی که
هنوز منتقل نشده‌اند باقی می‌مانند، اما آزمون‌های جدید و منتقل‌شده باید از ردیاب
پاک‌سازی خودکار استفاده کنند. از کاربرد جدید `makeTempDir`، `cleanupTempDirs`، یا
`createTempDirTracker` دستی و نیز از فراخوانی‌های جدید و برهنه `fs.mkdtemp*` در آزمون‌ها
پرهیز کنید، مگر اینکه موردی صراحتا رفتار خام temp-dir را راستی‌آزمایی کند. وقتی یک آزمون عمدا به دایرکتوری موقت برهنه نیاز دارد، یک کامنت مجاز قابل ممیزی با دلیل مشخص اضافه کنید:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

برای دیدپذیری مهاجرت، `node scripts/report-test-temp-creations.mjs` ایجاد temp-dir برهنه جدید و کاربرد دستی جدید از کمک‌کننده مشترک را در خطوط اضافه‌شده diff گزارش می‌کند، بدون اینکه سبک‌های پاک‌سازی موجود را مسدود کند. دامنه فایل آن عمدا همان طبقه‌بندی مسیر آزمون را دنبال می‌کند که `scripts/changed-lanes.mjs` استفاده می‌کند، به جای اینکه یک قاعده اکتشافی جداگانه برای نام فایل کمک‌کننده آزمون نگه دارد، و در عین حال خود پیاده‌سازی کمک‌کننده مشترک را نادیده می‌گیرد. `check:changed` این گزارش را برای مسیرهای آزمون تغییرکرده به‌عنوان سیگنال CI فقط-هشدار اجرا می‌کند؛ یافته‌ها حاشیه‌نویسی‌های هشدار GitHub هستند، نه شکست.

هنگام اشکال‌زدایی ارائه‌دهندگان/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعه زنده (مدل‌ها + پروب‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌صدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های عملکرد زمان اجرا: `OpenClaw Performance` را با
  `live_openai_candidate=true` برای یک نوبت عامل واقعی `openai/gpt-5.5` یا
  `deep_profile=true` برای مصنوعات CPU/heap/trace مربوط به Kova dispatch کنید. اجراهای زمان‌بندی‌شده روزانه
  مصنوعات مسیر mock-provider، deep-profile، و GPT 5.5 را در
  `openclaw/clawgrit-reports` منتشر می‌کنند، وقتی `CLAWGRIT_REPORTS_TOKEN` پیکربندی شده باشد.
  گزارش mock-provider همچنین شامل اعداد بوت Gateway در سطح منبع، حافظه،
  فشار Plugin، حلقه hello-loop تکراری fake-model، و راه‌اندازی CLI است.
- جاروب مدل زنده Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده اکنون یک نوبت متن به‌علاوه یک پروب کوچک به سبک خواندن فایل اجرا می‌کند.
    مدل‌هایی که فراداده‌شان ورودی `image` را اعلام می‌کند، یک نوبت تصویر کوچک هم اجرا می‌کنند.
    هنگام ایزوله کردن شکست‌های ارائه‌دهنده، پروب‌های اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: هر دو اجرای روزانه `OpenClaw Scheduled Live And E2E Checks` و اجرای دستی
    `OpenClaw Release Checks` گردش‌کار قابل استفاده مجدد زنده/سرتاسری را با
    `include_live_suites: true` فراخوانی می‌کنند، که شامل jobهای ماتریسی جداگانه مدل زنده Docker
    است که بر اساس ارائه‌دهنده shard شده‌اند.
  - برای اجرای دوباره متمرکز در CI، `OpenClaw Live And E2E Checks (Reusable)` را
    با `include_live_suites: true` و `live_models_only: true` dispatch کنید.
  - رازهای ارائه‌دهنده جدید و پرسیگنال را به `scripts/ci-hydrate-live-auth.sh`
    به‌علاوه `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخواننده‌های
    زمان‌بندی‌شده/انتشار آن اضافه کنید.
- اسموک گفت‌وگوی bound بومی Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر app-server مربوط به Codex اجرا می‌کند، یک DM مصنوعی
    Slack را با `/codex bind` متصل می‌کند، `/codex fast` و
    `/codex permissions` را تمرین می‌کند، سپس یک پاسخ ساده و یک پیوست تصویر را
    از مسیر اتصال بومی Plugin به‌جای ACP راستی‌آزمایی می‌کند.
- اسموک هارنس app-server مربوط به Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق هارنس app-server مربوط به Codex که مالک آن Plugin است اجرا می‌کند،
    `/codex status` و `/codex models` را راستی‌آزمایی می‌کند، و به‌صورت پیش‌فرض پروب‌های تصویر،
    cron MCP، زیرعامل، و Guardian را تمرین می‌کند. هنگام ایزوله کردن شکست‌های دیگر
    app-server مربوط به Codex، پروب زیرعامل را با
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز زیرعامل، پروب‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این پس از پروب زیرعامل خارج می‌شود، مگر اینکه
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- اسموک نصب درخواستی Codex: `pnpm test:docker:codex-on-demand`
  - tarball بسته‌بندی‌شده OpenClaw را در Docker نصب می‌کند، onboarding با کلید OpenAI API را اجرا می‌کند،
    و راستی‌آزمایی می‌کند که Plugin مربوط به Codex به‌علاوه وابستگی `@openai/codex`
    هنگام نیاز در ریشه پروژه npm مدیریت‌شده دانلود شده‌اند.
- اسموک وابستگی ابزار Plugin زنده: `pnpm test:docker:live-plugin-tool`
  - یک Plugin فیکسچر با وابستگی واقعی `slugify` را بسته‌بندی می‌کند، آن را از طریق
    `npm-pack:` نصب می‌کند، وابستگی را زیر ریشه پروژه npm مدیریت‌شده راستی‌آزمایی می‌کند،
    سپس از یک مدل زنده OpenAI می‌خواهد ابزار Plugin را فراخوانی کند و slug پنهان را برگرداند.
- اسموک فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی opt-in و belt-and-suspenders برای سطح فرمان نجات کانال پیام.
    این `/crestodian status` را تمرین می‌کند، یک تغییر مدل پایدار را صف می‌کند،
    به `/crestodian yes` پاسخ می‌دهد، و مسیر نوشتن audit/config را راستی‌آزمایی می‌کند.
- اسموک Docker برنامه‌ریز Crestodian: `pnpm test:docker:crestodian-planner`
  - Crestodian را در یک کانتینر بدون پیکربندی با یک Claude CLI جعلی روی `PATH`
    اجرا می‌کند و راستی‌آزمایی می‌کند که fallback برنامه‌ریز fuzzy به نوشتن پیکربندی تایپ‌شده و ممیزی‌شده ترجمه می‌شود.
- اسموک Docker اجرای نخست Crestodian: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw شروع می‌کند، entrypoint مدرن onboard
    Crestodian را راستی‌آزمایی می‌کند، نوشتن‌های setup/model/agent/Discord plugin + SecretRef
    را اعمال می‌کند، پیکربندی را اعتبارسنجی می‌کند، و ورودی‌های audit را راستی‌آزمایی می‌کند. همان مسیر راه‌اندازی Ring 0
    در QA Lab نیز با
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` پوشش داده می‌شود.
- اسموک هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، اجرا کنید
  `openclaw models list --provider moonshot --json`، سپس یک اجرای ایزوله
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  را در برابر `moonshot/kimi-k2.6` اجرا کنید. راستی‌آزمایی کنید که JSON گزارش Moonshot/K2.6 می‌دهد و
  رونوشت دستیار `usage.cost` نرمال‌شده را ذخیره می‌کند.

<Tip>
وقتی فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده از طریق متغیرهای محیطی allowlist که در پایین توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراکننده‌های ویژه QA

وقتی به واقع‌گرایی QA-lab نیاز دارید، این فرمان‌ها کنار مجموعه‌های آزمون اصلی قرار می‌گیرند:

CI، QA Lab را در گردش‌کارهای اختصاصی اجرا می‌کند. برابری عامل‌محور زیر
`QA-Lab - All Lanes` و اعتبارسنجی انتشار تودرتو است، نه یک گردش‌کار مستقل PR.
اعتبارسنجی گسترده باید از `Full Release Validation` با
`rerun_group=qa-parity` یا گروه QA مربوط به release-checks استفاده کند. بررسی‌های انتشار پایدار/پیش‌فرض
soak جامع زنده/Docker را پشت `run_release_soak=true` نگه می‌دارند؛ پروفایل
`full`، soak را اجباری می‌کند. `QA-Lab - All Lanes`
هر شب روی `main` و از dispatch دستی با مسیر mock parity، مسیر Matrix زنده، مسیر Telegram زنده مدیریت‌شده با Convex، و مسیر Discord زنده مدیریت‌شده با Convex
به‌عنوان jobهای موازی اجرا می‌شود. QA زمان‌بندی‌شده و بررسی‌های انتشار، Matrix
`--profile fast` را صراحتا پاس می‌دهند، در حالی که ورودی پیش‌فرض Matrix CLI و گردش‌کار دستی
`all` باقی می‌ماند؛ dispatch دستی می‌تواند `all` را به jobهای `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, و `e2ee-cli` shard کند. `OpenClaw Release
Checks` پیش از تایید انتشار parity به‌علاوه مسیرهای Matrix سریع و Telegram را اجرا می‌کند،
و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.5` استفاده می‌کند تا قطعی بمانند
و از راه‌اندازی عادی provider-plugin پرهیز کنند. این Gatewayهای انتقال زنده
جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های QA parity
پوشش داده می‌شود.

شاردهای رسانه زنده انتشار کامل از
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند، که از قبل
`ffmpeg` و `ffprobe` را دارد. شاردهای مدل/بک‌اند زنده Docker از تصویر مشترک
`ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که یک‌بار برای commit انتخاب‌شده ساخته شده است،
سپس آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` pull می‌کنند، به‌جای اینکه داخل هر shard
دوباره بسازند.

- `pnpm openclaw qa suite`
  - سناریوهای QA مبتنی بر مخزن را مستقیما روی میزبان اجرا می‌کند.
  - آرتیفکت‌های سطح بالای `qa-evidence.json`، `qa-suite-summary.json` و
    `qa-suite-report.md` را برای مجموعه سناریوی انتخاب‌شده می‌نویسد، از جمله
    انتخاب‌های سناریوی جریان ترکیبی، Vitest و Playwright.
  - وقتی با `pnpm openclaw qa run --qa-profile <profile>` اجرا شود، کارت امتیازی
    پروفایل طبقه‌بندی انتخاب‌شده را در همان `qa-evidence.json` درج می‌کند.
    `smoke-ci` شواهد کم‌حجم می‌نویسد که `evidenceMode: "slim"` را تنظیم می‌کند و
    `execution` را برای هر ورودی حذف می‌کند. `release` بخش گزینش‌شده آمادگی انتشار را پوشش می‌دهد؛
    `all` همه دسته‌های بلوغ فعال را انتخاب می‌کند و برای اجرای صریح گردش‌کارهای
    شواهد پروفایل QA در زمانی در نظر گرفته شده که آرتیفکت کارت امتیازی کامل
    لازم است.
  - به‌طور پیش‌فرض چندین سناریوی انتخاب‌شده را به‌صورت موازی با کارگرهای
    Gateway ایزوله اجرا می‌کند. `qa-channel` به‌طور پیش‌فرض همزمانی ۴ دارد (محدود به
    تعداد سناریوهای انتخاب‌شده). از `--concurrency <count>` برای تنظیم تعداد
    کارگرها، یا از `--concurrency 1` برای مسیر سریال قدیمی‌تر استفاده کنید.
  - اگر هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. وقتی
    آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی
    fixture و mock پروتکل، بدون جایگزین کردن مسیر سناریوآگاه
    `mock-openai`، راه‌اندازی می‌کند.
- `pnpm openclaw qa coverage --match <query>`
  - شناسه‌های سناریو، عنوان‌ها، سطح‌ها، شناسه‌های پوشش، ارجاع‌های مستندات، ارجاع‌های کد،
    Pluginها و نیازمندی‌های ارائه‌دهنده را جست‌وجو می‌کند، سپس هدف‌های suite مطابق را چاپ می‌کند.
  - پیش از اجرای QA Lab زمانی از این استفاده کنید که رفتار یا مسیر فایل تغییریافته را می‌دانید
    اما کوچک‌ترین سناریو را نمی‌دانید. این فقط راهنماست؛ همچنان اثبات mock،
    live، Multipass، Matrix یا transport را بر اساس رفتاری که تغییر می‌کند انتخاب کنید.
- `pnpm test:plugins:kitchen-sink-live`
  - آزمون سخت live برای Plugin OpenAI Kitchen Sink را از طریق QA Lab اجرا می‌کند. این دستور
    بسته خارجی Kitchen Sink را نصب می‌کند، موجودی سطح plugin SDK را تأیید می‌کند،
    `/healthz` و `/readyz` را probe می‌کند، شواهد CPU/RSS مربوط به Gateway را ثبت می‌کند،
    یک نوبت live با OpenAI اجرا می‌کند و تشخیص‌های خصمانه را بررسی می‌کند.
    به احراز هویت live OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در نشست‌های Testbox
    هیدراته‌شده، وقتی helper مربوط به `openclaw-testbox-env` حاضر باشد، به‌طور خودکار
    پروفایل live-auth مربوط به Testbox را source می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - بنچ راه‌اندازی Gateway به‌علاوه یک بسته کوچک سناریوی QA Lab مبتنی بر mock
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) را اجرا می‌کند و یک خلاصه مشاهده CPU ترکیبی را
    زیر `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهده‌های CPU داغ پایدار را علامت‌گذاری می‌کند (`--cpu-core-warn`
    به‌علاوه `--hot-wall-warn-ms`)، بنابراین burstهای کوتاه راه‌اندازی به‌عنوان متریک ثبت می‌شوند
    بدون اینکه شبیه regression چنددقیقه‌ای peg شدن Gateway به نظر برسند.
  - از آرتیفکت‌های ساخته‌شده `dist` استفاده می‌کند؛ وقتی checkout از قبل خروجی runtime تازه ندارد،
    ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان QA suite را داخل یک VM لینوکسی یک‌بارمصرف Multipass اجرا می‌کند.
  - همان رفتار انتخاب سناریو را مانند `qa suite` روی میزبان حفظ می‌کند.
  - از همان پرچم‌های انتخاب ارائه‌دهنده/مدل مانند `qa suite` دوباره استفاده می‌کند.
  - اجراهای live ورودی‌های احراز هویت QA پشتیبانی‌شده‌ای را که برای مهمان عملی هستند forward می‌کنند:
    کلیدهای ارائه‌دهنده مبتنی بر env، مسیر پیکربندی ارائه‌دهنده live QA و `CODEX_HOME`
    وقتی حاضر باشد.
  - دایرکتوری‌های خروجی باید زیر ریشه مخزن بمانند تا مهمان بتواند از طریق
    workspace متصل‌شده دوباره بنویسد.
  - گزارش و خلاصه معمول QA به‌علاوه logهای Multipass را زیر
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک اپراتور راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball npm می‌سازد، آن را به‌صورت global در
    Docker نصب می‌کند، onboarding غیرتعاملی با کلید API OpenAI را اجرا می‌کند، به‌طور پیش‌فرض Telegram
    را پیکربندی می‌کند، تأیید می‌کند runtime بسته‌بندی‌شده Plugin بدون تعمیر dependency هنگام راه‌اندازی
    بارگذاری می‌شود، doctor را اجرا می‌کند و یک نوبت agent محلی را در برابر
    endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همان مسیر نصب بسته‌بندی‌شده با Discord از `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک smoke قطعی Docker برای اپ ساخته‌شده با transcriptهای زمینه runtime تعبیه‌شده اجرا می‌کند.
    تأیید می‌کند زمینه پنهان runtime مربوط به OpenClaw به‌عنوان پیام سفارشی غیرنمایشی
    persist می‌شود، به‌جای اینکه به نوبت کاربر قابل مشاهده نشت کند،
    سپس یک JSONL نشست خرابِ متاثر را seed می‌کند و تأیید می‌کند
    `openclaw doctor --fix` آن را با یک backup به branch فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک candidate بسته OpenClaw را در Docker نصب می‌کند، onboarding بسته نصب‌شده را اجرا می‌کند،
    Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند، سپس مسیر live Telegram QA را
    با آن بسته نصب‌شده به‌عنوان Gateway سامانه تحت آزمون دوباره استفاده می‌کند.
  - wrapper فقط منبع harness مربوط به `qa-lab` را از checkout mount می‌کند؛
    بسته نصب‌شده مالک `dist`، `openclaw/plugin-sdk` و runtime بسته‌بندی‌شده Plugin است
    تا مسیر، Pluginهای checkout فعلی را با بسته تحت آزمون مخلوط نکند.
  - پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛
    برای آزمودن یک tarball محلی resolve‌شده به‌جای نصب از registry،
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - به‌طور پیش‌فرض با `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` زمان‌بندی RTT تکرارشونده را در
    `qa-evidence.json` منتشر می‌کند. برای تنظیم اجرای RTT،
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`،
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` یا
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` را override کنید.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` یک فهرست جداشده با کاما از
    شناسه‌های بررسی Telegram QA را برای نمونه‌گیری می‌پذیرد؛ وقتی تنظیم نشده باشد، بررسی پیش‌فرض دارای قابلیت RTT
    `telegram-mentioned-message-reply` است.
  - از همان credentialهای env مربوط به Telegram یا منبع credential مربوط به Convex مانند
    `pnpm openclaw qa telegram` استفاده می‌کند. برای اتوماسیون CI/انتشار،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` به‌علاوه
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک role secret را تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک role secret مربوط به Convex در CI حاضر باشند،
    wrapper مربوط به Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - wrapper پیش از کار build/install در Docker، env مربوط به credentialهای Telegram یا Convex را روی میزبان
    اعتبارسنجی می‌کند. فقط زمانی `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    را تنظیم کنید که عمدا در حال اشکال‌زدایی setup پیش از credential هستید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر،
    `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را override می‌کند. وقتی credentialهای Convex
    انتخاب شده باشند و هیچ role تنظیم نشده باشد، wrapper در CI از `ci` و
    خارج از CI از `maintainer` استفاده می‌کند.
  - GitHub Actions این مسیر را به‌عنوان گردش‌کار دستی maintainer با نام
    `NPM Telegram Beta E2E` ارائه می‌کند. این مسیر هنگام merge اجرا نمی‌شود. گردش‌کار از
    محیط `qa-live-shared` و leaseهای credential مربوط به Convex CI استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات محصول side-run
  در برابر یک بسته candidate ارائه می‌کند. این یک ref مورد اعتماد، spec منتشرشده npm،
  URL tarball از نوع HTTPS به‌علاوه SHA-256، یا آرتیفکت tarball از اجرای دیگر را می‌پذیرد،
  `openclaw-current.tgz` نرمال‌شده را به‌عنوان `package-under-test` آپلود می‌کند، سپس
  scheduler موجود Docker E2E را با پروفایل‌های مسیر smoke، package، product، full یا custom
  اجرا می‌کند. برای اجرای گردش‌کار Telegram QA در برابر همان آرتیفکت `package-under-test`،
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

- mirrorهای tarball سازمانی/خصوصی از یک سیاست trusted-source صریح استفاده می‌کنند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` فایل `.github/package-trusted-sources.json` را از ref مورد اعتماد گردش‌کار می‌خواند و credentialهای URL یا bypass شبکه خصوصی از ورودی گردش‌کار را نمی‌پذیرد. اگر سیاست نام‌گذاری‌شده bearer auth اعلام کند، secret ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` را پیکربندی کنید.

- اثبات آرتیفکت یک آرتیفکت tarball را از اجرای Actions دیگر دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را
    با OpenAI پیکربندی‌شده راه‌اندازی می‌کند، سپس channel/Pluginهای bundled را از طریق ویرایش‌های config
    فعال می‌کند.
  - تأیید می‌کند discovery مربوط به setup باعث می‌شود Pluginهای قابل دانلود پیکربندی‌نشده غایب بمانند،
    نخستین تعمیر doctor پیکربندی‌شده هر Plugin قابل دانلودِ گمشده را به‌صراحت نصب می‌کند،
    و restart دوم تعمیر dependency پنهان اجرا نمی‌کند.
  - همچنین یک baseline قدیمی‌تر و شناخته‌شده npm را نصب می‌کند، پیش از اجرای
    `openclaw update --tag <candidate>` Telegram را فعال می‌کند و تأیید می‌کند doctor پس از update مربوط به
    candidate، debris قدیمی dependency مربوط به Plugin را بدون تعمیر postinstall سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - smoke مربوط به update نصب بسته‌بندی‌شده بومی را در میان مهمان‌های Parallels اجرا می‌کند. هر
    پلتفرم انتخاب‌شده ابتدا بسته baseline درخواستی را نصب می‌کند، سپس فرمان نصب‌شده
    `openclaw update` را در همان مهمان اجرا می‌کند و نسخه نصب‌شده،
    وضعیت update، آمادگی Gateway و یک نوبت agent محلی را تأیید می‌کند.
  - هنگام تکرار روی یک مهمان از `--platform macos`، `--platform windows` یا `--platform linux` استفاده کنید.
    برای مسیر آرتیفکت خلاصه و وضعیت هر مسیر از `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض برای اثبات نوبت live agent از `openai/gpt-5.5` استفاده می‌کند.
    وقتی عمدا در حال اعتبارسنجی مدل OpenAI دیگری هستید، `--model <provider/model>` را پاس دهید
    یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای محلی طولانی را در timeout میزبان wrap کنید تا stallهای transport مربوط به Parallels
    نتوانند باقی پنجره آزمون را مصرف کنند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت logهای nested مربوط به مسیر را زیر `/tmp/openclaw-parallels-npm-update.*` می‌نویسد.
    پیش از فرض کردن اینکه wrapper بیرونی گیر کرده است، `windows-update.log`، `macos-update.log` یا `linux-update.log`
    را بررسی کنید.
  - update ویندوز می‌تواند روی یک مهمان سرد ۱۰ تا ۱۵ دقیقه را در doctor پس از update و کار
    update بسته صرف کند؛ تا وقتی log debug مربوط به npm در سطح nested در حال پیشروی است،
    این همچنان سالم است.
  - این wrapper تجمیعی را موازی با مسیرهای smoke جداگانه macOS، Windows یا Linux
    مربوط به Parallels اجرا نکنید. آن‌ها وضعیت VM را به اشتراک می‌گذارند و ممکن است در
    restore کردن snapshot، سرو کردن package یا وضعیت Gateway مهمان با هم برخورد کنند.
  - اثبات پس از update سطح معمول bundled Plugin را اجرا می‌کند، چون
    facadeهای capability مانند گفتار، تولید تصویر و درک رسانه
    از طریق APIهای runtime bundled بارگذاری می‌شوند، حتی وقتی خود نوبت agent
    فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای آزمون دود مستقیم پروتکل
    راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک هوم‌سرور Tuwunel یک‌بارمصرف با پشتوانه Docker اجرا می‌کند. فقط برای checkout سورس - نصب‌های بسته‌بندی‌شده `qa-lab` را ارسال نمی‌کنند.
  - CLI کامل، کاتالوگ پروفایل/سناریو، متغیرهای env، و چیدمان آرتیفکت: [QA ماتریس](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را در برابر یک گروه خصوصی واقعی با استفاده از توکن‌های بات درایور و SUT از env اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`، `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`، و `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید شناسه عددی چت Telegram باشد.
  - از `--credential-source convex` برای اعتبارنامه‌های اشتراکی تجمیع‌شده پشتیبانی می‌کند. به‌صورت پیش‌فرض از حالت env استفاده کنید، یا برای انتخاب اجاره‌های تجمیع‌شده `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - پیش‌فرض‌ها canary، دروازه‌بانی mention، آدرس‌دهی فرمان، `/status`، پاسخ‌های mention‌شده بات-به-بات، و پاسخ‌های فرمان native هسته را پوشش می‌دهند. پیش‌فرض‌های `mock-openai` همچنین رگرسیون‌های deterministic زنجیره پاسخ و استریم پیام نهایی Telegram را پوشش می‌دهند. برای probeهای اختیاری مانند `session_status` از `--list-scenarios` استفاده کنید.
  - وقتی هر سناریویی شکست بخورد با کد غیرصفر خارج می‌شود. وقتی
    آرتیفکت‌ها را بدون کد خروج شکست‌خورده می‌خواهید از `--allow-failures` استفاده کنید.
  - به دو بات متمایز در یک گروه خصوصی نیاز دارد، در حالی که بات SUT یک نام کاربری Telegram ارائه می‌کند.
  - برای مشاهده پایدار بات-به-بات، Bot-to-Bot Communication Mode را در `@BotFather` برای هر دو بات فعال کنید و مطمئن شوید بات درایور می‌تواند ترافیک بات‌های گروه را مشاهده کند.
  - یک گزارش QA Telegram، خلاصه، و `qa-evidence.json` را زیر `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهی شامل RTT از درخواست ارسال درایور تا پاسخ مشاهده‌شده SUT هستند.

`Mantis Telegram Live` پوشش‌دهنده شواهد PR پیرامون این مسیر است. ref نامزد را با اعتبارنامه‌های Telegram اجاره‌شده از Convex اجرا می‌کند، بسته گزارش/شواهد QA ویرایش‌شده را در مرورگر دسکتاپ Crabbox رندر می‌کند، شواهد MP4 ضبط می‌کند، یک GIF کوتاه‌شده بر اساس حرکت تولید می‌کند، بسته آرتیفکت را بارگذاری می‌کند، و وقتی `pr_number` تنظیم شده باشد شواهد درون‌خطی PR را از طریق Mantis GitHub App ارسال می‌کند. نگه‌دارندگان می‌توانند آن را از UI اکشن‌ها از طریق `Mantis Scenario` (`scenario_id:
telegram-live`) یا مستقیما از یک کامنت pull request شروع کنند:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` پوشش‌دهنده agentic native Telegram Desktop
قبل/بعد برای اثبات بصری PR است. آن را از UI اکشن‌ها با
`instructions` آزاد، از طریق `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`)، یا از یک کامنت PR شروع کنید:

```text
@openclaw-mantis telegram desktop proof
```

عامل Mantis، PR را می‌خواند، تصمیم می‌گیرد کدام رفتار قابل مشاهده در Telegram تغییر را اثبات می‌کند، مسیر اثبات Telegram Desktop کاربر واقعی Crabbox را روی refهای baseline و نامزد اجرا می‌کند، تا زمانی که GIFهای native مفید شوند تکرار می‌کند، یک manifest جفت‌شده `motionPreview` می‌نویسد، و وقتی `pr_number` تنظیم شده باشد همان جدول GIF دو ستونه را از طریق Mantis GitHub App ارسال می‌کند.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - یک دسکتاپ Linux در Crabbox را اجاره یا بازاستفاده می‌کند، Telegram Desktop native را نصب می‌کند، OpenClaw را با یک توکن بات SUT اجاره‌شده Telegram پیکربندی می‌کند، gateway را راه‌اندازی می‌کند، و شواهد screenshot/MP4 را از دسکتاپ قابل مشاهده VNC ضبط می‌کند.
  - به‌صورت پیش‌فرض از `--credential-source convex` استفاده می‌کند تا workflowها فقط به secret کارگزار Convex نیاز داشته باشند. با همان متغیرهای `OPENCLAW_QA_TELEGRAM_*` مانند `pnpm openclaw qa telegram` از `--credential-source env` استفاده کنید.
  - Telegram Desktop همچنان به login/profile کاربر نیاز دارد. توکن بات فقط OpenClaw را پیکربندی می‌کند. برای یک آرشیو profile `.tgz` با base64 از `--telegram-profile-archive-env <name>` استفاده کنید، یا از `--keep-lease` استفاده کنید و یک‌بار به‌صورت دستی از طریق VNC وارد شوید.
  - `mantis-telegram-desktop-builder-report.md`، `mantis-telegram-desktop-builder-summary.json`، `telegram-desktop-builder.png`، و `telegram-desktop-builder.mp4` را زیر دایرکتوری خروجی می‌نویسد.

مسیرهای transport زنده یک قرارداد استاندارد مشترک دارند تا transportهای جدید از هم فاصله نگیرند؛ ماتریس پوشش هر مسیر در [نمای کلی QA → پوشش transport زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage) قرار دارد. `qa-channel` مجموعه synthetic گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (v1)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) برای
QA transport زنده فعال باشد، آزمایشگاه QA یک اجاره انحصاری از یک pool با پشتوانه Convex می‌گیرد، هنگام اجرای مسیر برای آن اجاره Heartbeat می‌فرستد، و در زمان shutdown اجاره را آزاد می‌کند. نام این بخش به قبل از پشتیبانی Discord، Slack، و WhatsApp برمی‌گردد؛ قرارداد اجاره بین انواع مختلف مشترک است.

اسکفولد پروژه مرجع Convex:

- `qa/convex-credential-broker/`

متغیرهای env لازم:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای مثال `https://your-deployment.convex.site`)
- یک secret برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض env: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌صورت پیش‌فرض `ci` است، در غیر این صورت `maintainer`)

متغیرهای env اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسه trace اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex روی loopback با `http://` برای توسعه فقط محلی اجازه می‌دهد.

`OPENCLAW_QA_CONVEX_SITE_URL` باید در عملیات عادی از `https://` استفاده کند.

فرمان‌های ادمین نگه‌دارنده (pool add/remove/list) مشخصا به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

کمک‌کننده‌های CLI برای نگه‌دارندگان:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

از `doctor` پیش از اجراهای زنده استفاده کنید تا URL سایت Convex، secretهای کارگزار،
پیشوند endpoint، timeout HTTP، و دسترسی admin/list را بدون چاپ مقادیر
secret بررسی کنید. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و
ابزارهای CI از `--json` استفاده کنید.

قرارداد endpoint پیش‌فرض (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - درخواست: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - موفقیت: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - تمام‌شده/قابل تلاش دوباره: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

شکل payload برای نوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید رشته شناسه عددی چت Telegram باشد.
- `admin/add` این شکل را برای `kind: "telegram"` اعتبارسنجی می‌کند و payloadهای بدشکل را رد می‌کند.

شکل payload برای نوع کاربر واقعی Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`، `testerUserId`، و `telegramApiId` باید رشته‌های عددی باشند.
- `tdlibArchiveSha256` و `desktopTdataArchiveSha256` باید رشته‌های hex SHA-256 باشند.
- `kind: "telegram-user"` برای workflow اثبات Mantis Telegram Desktop رزرو شده است. مسیرهای عمومی QA Lab نباید آن را دریافت کنند.

payloadهای چندکاناله اعتبارسنجی‌شده توسط کارگزار:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

مسیرهای Slack نیز می‌توانند از pool اجاره کنند، اما اعتبارسنجی payload Slack در حال حاضر
به‌جای کارگزار در runner QA Slack قرار دارد. برای ردیف‌های Slack از
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
استفاده کنید.

### افزودن یک کانال به QA

نام‌های معماری و کمک‌کننده سناریو برای آداپتورهای کانال جدید در [نمای کلی QA → افزودن یک کانال](/fa/concepts/qa-e2e-automation#adding-a-channel) قرار دارند. حداقل معیار: پیاده‌سازی runner transport روی seam میزبان مشترک `qa-lab`، اعلام `qaRunners` در manifest پلاگین، mount به‌صورت `openclaw qa <runner>`، و نوشتن سناریوها زیر `qa/scenarios/`.

## مجموعه‌های تست (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «افزایش واقع‌گرایی» (و افزایش flakiness/هزینه) در نظر بگیرید:

### Unit / integration (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه shard `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است shardهای چندپروژه‌ای را برای زمان‌بندی موازی به پیکربندی‌های هر پروژه گسترش دهند
- فایل‌ها: inventoryهای core/unit زیر `src/**/*.test.ts`، `packages/**/*.test.ts`، و `test/**/*.test.ts`؛ تست‌های unit رابط کاربری در shard اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - تست‌های unit خالص
  - تست‌های integration درون‌فرایندی (احراز هویت gateway، مسیریابی، tooling، parsing، config)
  - رگرسیون‌های deterministic برای باگ‌های شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلیدهای واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - تست‌های resolver و loader سطح عمومی باید رفتار fallback گسترده `api.js` و
    `runtime-api.js` را با fixtureهای پلاگین کوچک تولیدشده اثبات کنند، نه
    APIهای سورس پلاگین‌های bundled واقعی. بارگذاری‌های API پلاگین واقعی به
    مجموعه‌های contract/integration متعلق به پلاگین تعلق دارند.

سیاست dependency بومی:

- نصب‌های تست پیش‌فرض buildهای optional native Discord opus را رد می‌کنند. صدای Discord از `libopus-wasm` bundled استفاده می‌کند، و `@discordjs/opus` در `allowBuilds` غیرفعال می‌ماند تا تست‌های محلی و مسیرهای Testbox addon بومی را compile نکنند.
- عملکرد native opus را در مخزن benchmark `libopus-wasm` مقایسه کنید، نه در حلقه‌های پیش‌فرض نصب/تست OpenClaw. `@discordjs/opus` را در `allowBuilds` پیش‌فرض روی `true` تنظیم نکنید؛ این کار باعث می‌شود حلقه‌های نصب/تست نامرتبط کد بومی را compile کنند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، shardها، و مسیرهای scoped">

    - اجرای بدون هدف `pnpm test` به‌جای یک فرایند عظیم بومی برای پروژه ریشه، دوازده پیکربندی شارد کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های تحت بار کاهش می‌دهد و مانع می‌شود کارهای auto-reply/extension مجموعه‌های نامرتبط را گرسنه نگه دارند.
    - `pnpm test --watch` همچنان از گراف پروژه ریشه بومی `vitest.config.ts` استفاده می‌کند، چون حلقه watch چندشاردی عملی نیست.
    - `pnpm test`، `pnpm test:watch` و `pnpm test:perf:imports` هدف‌های صریح فایل/دایرکتوری را ابتدا از مسیر laneهای محدوده‌دار عبور می‌دهند، بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینه کامل راه‌اندازی پروژه ریشه را پرداخت نمی‌کند.
    - `pnpm test:changed` به‌صورت پیش‌فرض مسیرهای تغییرکرده git را به laneهای محدوده‌دار ارزان گسترش می‌دهد: ویرایش مستقیم تست‌ها، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح منبع، و وابسته‌های محلی گراف import. ویرایش‌های config/setup/package باعث اجرای گسترده تست‌ها نمی‌شوند مگر اینکه صراحتاً از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازه عادی بررسی هوشمند محلی برای کارهای محدود است. این دستور diff را به core، تست‌های core، extensions، تست‌های extension، apps، docs، فراداده انتشار، ابزارهای live Docker و tooling طبقه‌بندی می‌کند، سپس دستورهای typecheck، lint و guard متناظر را اجرا می‌کند. تست‌های Vitest را اجرا نمی‌کند؛ برای اثبات تست از `pnpm test:changed` یا `pnpm test <target>` صریح استفاده کنید. افزایش نسخه‌ای که فقط فراداده انتشار را تغییر می‌دهد، بررسی‌های هدفمند version/config/root-dependency را اجرا می‌کند، همراه با guardی که تغییرات package خارج از فیلد نسخه سطح بالا را رد می‌کند.
    - ویرایش‌های harness مربوط به live Docker ACP بررسی‌های متمرکز اجرا می‌کنند: syntax شل برای اسکریپت‌های auth مربوط به live Docker و یک dry-run زمان‌بند live Docker. تغییرات `package.json` فقط وقتی لحاظ می‌شوند که diff به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش‌های dependency، export، version و دیگر سطح‌های package همچنان از guardهای گسترده‌تر استفاده می‌کنند.
    - تست‌های واحد سبک از نظر import از agents، commands، plugins، helperهای auto-reply، `plugin-sdk` و نواحی مشابه ابزارهای pure از مسیر lane `unit-fast` عبور می‌کنند، که `test/setup-openclaw-runtime.ts` را رد می‌کند؛ فایل‌های دارای state یا runtime سنگین روی laneهای موجود می‌مانند.
    - فایل‌های منبع helper منتخب در `plugin-sdk` و `commands` نیز اجراهای حالت changed را به تست‌های هم‌جوار صریح در همان laneهای سبک نگاشت می‌کنند، بنابراین ویرایش helperها از اجرای دوباره کل مجموعه سنگین آن دایرکتوری پرهیز می‌کند.
    - `auto-reply` bucketهای اختصاصی برای helperهای core سطح بالا، تست‌های integration سطح بالای `reply.*` و زیردرخت `src/auto-reply/reply/**` دارد. CI زیردرخت reply را بیشتر به شاردهای agent-runner، dispatch و commands/state-routing تقسیم می‌کند تا یک bucket سنگین از نظر import مالک کل دنباله Node نباشد.
    - CI عادی PR/main عمداً sweep دسته‌ای extension و شارد فقط-انتشار `agentic-plugins` را رد می‌کند. Full Release Validation گردش‌کار فرزند جداگانه `Plugin Prerelease` را برای آن مجموعه‌های سنگین از نظر plugin/extension روی release candidateها dispatch می‌کند.

  </Accordion>

  <Accordion title="پوشش runner تعبیه‌شده">

    - وقتی ورودی‌های کشف message-tool یا context زمان اجرای compaction را تغییر می‌دهید، هر دو سطح پوشش را حفظ کنید.
    - برای مرزهای pure routing و normalization، رگرسیون‌های helper متمرکز اضافه کنید.
    - مجموعه‌های integration مربوط به runner تعبیه‌شده را سالم نگه دارید:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`،
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`، و
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - این مجموعه‌ها تأیید می‌کنند که شناسه‌های محدوده‌دار و رفتار compaction همچنان از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ تست‌های فقط-helper جایگزین کافی برای آن مسیرهای integration نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های pool و isolation در Vitest">

    - پیکربندی پایه Vitest به‌صورت پیش‌فرض روی `threads` است.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را ثابت می‌کند و از runner غیرایزوله در پروژه‌های ریشه، پیکربندی‌های e2e و live استفاده می‌کند.
    - lane مربوط به UI ریشه setup و optimizer خود برای `jsdom` را حفظ می‌کند، اما آن هم روی runner مشترک غیرایزوله اجرا می‌شود.
    - هر شارد `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌صورت پیش‌فرض برای فرایندهای فرزند Node مربوط به Vitest گزینه `--no-maglev` را اضافه می‌کند تا churn کامپایل V8 هنگام اجراهای محلی بزرگ کاهش یابد. برای مقایسه با رفتار خام V8، `OPENCLAW_VITEST_ENABLE_MAGLEV=1` را تنظیم کنید.
    - `scripts/run-vitest.mjs` اجراهای صریح غیر-watch در Vitest را پس از ۵ دقیقه بدون خروجی stdout یا stderr خاتمه می‌دهد. برای غیرفعال‌کردن watchdog در یک بررسی عمداً بی‌صدا، `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک diff کدام laneهای معماری را فعال می‌کند.
    - hook پیش از commit فقط برای formatting است. فایل‌های formatشده را دوباره stage می‌کند و lint، typecheck یا تست‌ها را اجرا نمی‌کند.
    - وقتی به دروازه بررسی هوشمند محلی نیاز دارید، پیش از handoff یا push، `pnpm check:changed` را صریح اجرا کنید.
    - `pnpm test:changed` به‌صورت پیش‌فرض از مسیر laneهای محدوده‌دار ارزان عبور می‌کند. فقط وقتی agent تشخیص می‌دهد ویرایش harness، config، package یا contract واقعاً به پوشش گسترده‌تر Vitest نیاز دارد، از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار routing را حفظ می‌کنند، فقط با سقف بالاتر worker.
    - auto-scaling محلی worker عمداً محافظه‌کارانه است و وقتی میانگین بار host از قبل بالا باشد عقب‌نشینی می‌کند، بنابراین چند اجرای هم‌زمان Vitest به‌صورت پیش‌فرض آسیب کمتری می‌زنند.
    - پیکربندی پایه Vitest پروژه‌ها/فایل‌های config را به‌عنوان `forceRerunTriggers` علامت‌گذاری می‌کند تا rerunهای حالت changed هنگام تغییر wiring تست درست بمانند.
    - پیکربندی `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی hostهای پشتیبانی‌شده فعال نگه می‌دارد؛ اگر برای profiling مستقیم یک مکان cache صریح می‌خواهید، `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی عملکرد">

    - `pnpm test:perf:imports` گزارش مدت‌زمان import در Vitest به‌همراه خروجی breakdown import را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای profiling را به فایل‌های تغییرکرده از زمان `origin/main` محدود می‌کند.
    - داده زمان‌بندی شارد در `.artifacts/vitest-shard-timings.json` نوشته می‌شود. اجراهای کل config از مسیر config به‌عنوان کلید استفاده می‌کنند؛ شاردهای CI با include-pattern نام شارد را اضافه می‌کنند تا شاردهای filterشده جداگانه قابل ردیابی باشند.
    - وقتی یک تست داغ هنوز بیشتر زمان خود را در importهای startup صرف می‌کند، dependencyهای سنگین را پشت یک seam محلی محدود `*.runtime.ts` نگه دارید و به‌جای deep-import کردن helperهای runtime صرفاً برای عبور دادنشان از `vi.mock(...)`، همان seam را مستقیم mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر routed مربوط به `test:changed` را با مسیر بومی پروژه ریشه برای آن diff ثبت‌شده مقایسه می‌کند و زمان دیواری به‌همراه حداکثر RSS در macOS را چاپ می‌کند.
    - `pnpm test:perf:changed:bench -- --worktree` درخت dirty فعلی را با عبور دادن فهرست فایل‌های تغییرکرده از `scripts/test-projects.mjs` و پیکربندی Vitest ریشه benchmark می‌کند.
    - `pnpm test:perf:profile:main` یک profile پردازنده main-thread برای سربار startup و transform در Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` profileهای CPU+heap runner را برای مجموعه unit با parallelism فایل غیرفعال می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (gateway)

- دستور: `pnpm test:stability:gateway`
- پیکربندی: `vitest.gateway.config.ts`، اجبارشده به یک worker
- دامنه:
  - یک Gateway واقعی loopback را با diagnostics فعال به‌صورت پیش‌فرض شروع می‌کند
  - churn پیام Gateway مصنوعی، memory و payload بزرگ را از مسیر رویداد diagnostic عبور می‌دهد
  - `diagnostics.stability` را از طریق WS RPC مربوط به Gateway query می‌کند
  - helperهای persistence مربوط به bundle پایداری diagnostic را پوشش می‌دهد
  - assert می‌کند recorder محدود می‌ماند، نمونه‌های RSS مصنوعی زیر بودجه فشار باقی می‌مانند، و عمق صف هر session دوباره به صفر تخلیه می‌شود
- انتظارها:
  - برای CI امن و بدون کلید
  - lane محدود برای پیگیری رگرسیون پایداری، نه جایگزینی برای مجموعه کامل Gateway

### E2E (تجمیع repo)

- دستور: `pnpm test:e2e`
- دامنه:
  - lane مربوط به E2E smoke در gateway را اجرا می‌کند
  - lane مربوط به E2E مرورگر Control UI mockشده را اجرا می‌کند
- انتظارها:
  - برای CI امن و بدون کلید
  - نیاز دارد Playwright Chromium نصب باشد

### E2E (smoke در gateway)

- دستور: `pnpm test:e2e:gateway`
- پیکربندی: `vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts`، و تست‌های E2E مربوط به bundled-plugin زیر `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest با `isolate: false` استفاده می‌کند، همسو با بقیه repo.
  - از workerهای adaptive استفاده می‌کند (CI: حداکثر ۲، محلی: به‌صورت پیش‌فرض ۱).
  - به‌صورت پیش‌فرض در حالت silent اجرا می‌شود تا سربار I/O کنسول کاهش یابد.
- overrideهای مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای اجبار تعداد worker (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌سازی دوباره خروجی verbose کنسول.
- دامنه:
  - رفتار end-to-end در gateway چندنمونه‌ای
  - سطح‌های WebSocket/HTTP، جفت‌سازی node و شبکه‌سازی سنگین‌تر
- انتظارها:
  - در CI اجرا می‌شود (وقتی در pipeline فعال باشد)
  - به کلیدهای واقعی نیاز ندارد
  - نسبت به تست‌های unit قطعات متحرک بیشتری دارد (می‌تواند کندتر باشد)

### E2E (مرورگر mockشده Control UI)

- دستور: `pnpm test:ui:e2e`
- پیکربندی: `test/vitest/vitest.ui-e2e.config.ts`
- فایل‌ها: `ui/src/**/*.e2e.test.ts`
- دامنه:
  - Vite Control UI را شروع می‌کند
  - یک صفحه واقعی Chromium را از طریق Playwright هدایت می‌کند
  - WebSocket مربوط به Gateway را با mockهای قطعی درون مرورگر جایگزین می‌کند
- انتظارها:
  - به‌عنوان بخشی از `pnpm test:e2e` در CI اجرا می‌شود
  - به Gateway واقعی، agents یا کلیدهای provider نیاز ندارد
  - dependency مرورگر باید حاضر باشد (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke بک‌اند OpenShell

- دستور: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - از یک gateway محلی فعال OpenShell دوباره استفاده می‌کند
  - یک sandbox از Dockerfile محلی موقت می‌سازد
  - بک‌اند OpenShell در OpenClaw را روی `sandbox ssh-config` واقعی + اجرای SSH تمرین می‌دهد
  - رفتار filesystem با canonical راه دور را از طریق پل sandbox fs تأیید می‌کند
- انتظارها:
  - فقط opt-in؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - به یک CLI محلی `openshell` به‌همراه Docker daemon فعال نیاز دارد
  - به یک gateway محلی فعال OpenShell و منبع config آن نیاز دارد
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند، سپس sandbox تست را نابود می‌کند
- overrideهای مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌کردن تست هنگام اجرای دستی مجموعه e2e گسترده‌تر
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به binary یا wrapper script غیرپیش‌فرض CLI
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` برای آشکارکردن config مربوط به gateway ثبت‌شده برای تست ایزوله
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` برای override کردن IP مربوط به Docker gateway که fixture سیاست host استفاده می‌کند

### Live (providerهای واقعی + modelهای واقعی)

- دستور: `pnpm test:live`
- پیکربندی: `vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`، `test/**/*.live.test.ts`، و آزمون‌های زنده Pluginهای بسته‌بندی‌شده در `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اعتبارنامه‌های واقعی کار می‌کند؟»
  - تغییرات قالب ارائه‌دهنده، نکته‌های خاص فراخوانی ابزار، مشکلات احراز هویت، و رفتار محدودیت نرخ را تشخیص دهید
- انتظارها:
  - عمداً برای CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهنده، سهمیه‌ها، قطعی‌ها)
  - هزینه دارد / از محدودیت‌های نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده از کلیدهای API از پیش export شده و پروفایل‌های احراز هویت مرحله‌بندی‌شده استفاده می‌کنند.
- به‌طور پیش‌فرض، اجراهای زنده همچنان `HOME` را ایزوله می‌کنند و مواد پیکربندی/احراز هویت را در یک خانهٔ آزمون موقت کپی می‌کنند تا fixtureهای واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط زمانی `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید که عمداً نیاز دارید آزمون‌های زنده از دایرکتوری خانهٔ واقعی شما استفاده کنند.
- `pnpm test:live` به‌طور پیش‌فرض از حالت کم‌صداتری استفاده می‌کند: خروجی پیشرفت `[live] ...` را نگه می‌دارد و گزارش‌های راه‌اندازی Gateway/گفت‌وگوی Bonjour را بی‌صدا می‌کند. اگر می‌خواهید گزارش‌های کامل راه‌اندازی برگردند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (ویژهٔ ارائه‌دهنده): `*_API_KEYS` را با قالب کاما/نقطه‌ویرگول یا `*_API_KEY_1`، `*_API_KEY_2` تنظیم کنید (برای مثال `OPENAI_API_KEYS`، `ANTHROPIC_API_KEYS`، `GEMINI_API_KEYS`) یا بازنویسی ویژهٔ زنده را از طریق `OPENCLAW_LIVE_*_KEY` انجام دهید؛ آزمون‌ها هنگام پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌های زنده اکنون خط‌های پیشرفت را به stderr می‌نویسند تا فراخوانی‌های طولانی ارائه‌دهنده حتی وقتی ضبط کنسول Vitest ساکت است، به‌صورت قابل مشاهده فعال باشند.
  - `vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خط‌های پیشرفت ارائه‌دهنده/Gateway در طول اجراهای زنده فوراً stream شوند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/probe را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه را باید اجرا کنم؟

از این جدول تصمیم‌گیری استفاده کنید:

- ویرایش منطق/آزمون‌ها: `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید `pnpm test:coverage` را هم اجرا کنید)
- دست‌زدن به شبکه‌سازی Gateway / پروتکل WS / جفت‌سازی: `pnpm test:e2e` را اضافه کنید
- اشکال‌زدایی «ربات من از کار افتاده است» / خرابی‌های ویژهٔ ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (درگیر با شبکه)

برای ماتریس مدل زنده، اسموک‌های backend مربوط به CLI، اسموک‌های ACP، harness سرور برنامهٔ Codex،
و همهٔ آزمون‌های زندهٔ ارائه‌دهندهٔ رسانه (Deepgram، BytePlus، ComfyUI، تصویر،
موسیقی، ویدئو، harness رسانه) - به‌علاوهٔ مدیریت اعتبارنامه برای اجراهای زنده - به
[آزمودن مجموعه‌های زنده](/fa/help/testing-live) مراجعه کنید. برای چک‌لیست اختصاصی به‌روزرسانی و
اعتبارسنجی Plugin، به
[آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «در Linux کار می‌کند»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده: `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زندهٔ profile-key متناظر خود را داخل تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`)، در حالی که دایرکتوری پیکربندی محلی، workspace، و فایل env پروفایل اختیاری شما را mount می‌کنند. entrypointهای محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زندهٔ Docker در صورت نیاز سقف‌های عملی خودشان را نگه می‌دارند:
  `test:docker:live-models` به‌طور پیش‌فرض از مجموعهٔ گزینش‌شدهٔ پشتیبانی‌شده و پرسیگنال استفاده می‌کند، و
  `test:docker:live-gateway` به‌طور پیش‌فرض از `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` استفاده می‌کند. وقتی صراحتاً سقف کوچک‌تر یا پیمایش بزرگ‌تر می‌خواهید، `OPENCLAW_LIVE_MAX_MODELS`
  یا متغیرهای env مربوط به Gateway را تنظیم کنید.
- `test:docker:all` تصویر Docker زنده را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار به‌عنوان tarball مربوط به npm از طریق `scripts/package-openclaw-for-docker.mjs` بسته‌بندی می‌کند، سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر bare فقط اجراکنندهٔ Node/Git برای مسیرهای نصب/به‌روزرسانی/وابستگی Plugin است؛ آن مسیرها tarball از پیش ساخته‌شده را mount می‌کنند. تصویر عملکردی همان tarball را برای مسیرهای عملکرد برنامهٔ ساخته‌شده در `/app` نصب می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` طرح انتخاب‌شده را اجرا می‌کند. تجمیع‌کننده از یک زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` slotهای فرایند را کنترل می‌کند، در حالی که سقف‌های منبع مانع می‌شوند مسیرهای سنگین زنده، نصب npm، و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک مسیر منفرد از سقف‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی pool خالی است آن را شروع کند و سپس تا زمانی که ظرفیت دوباره در دسترس شود آن را تنها در حال اجرا نگه دارد. پیش‌فرض‌ها 10 slot، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`، `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`، و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط زمانی `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` را تنظیم کنید که میزبان Docker ظرفیت بیشتری دارد. اجراکننده به‌طور پیش‌فرض یک preflight مربوط به Docker انجام می‌دهد، containerهای E2E کهنهٔ OpenClaw را حذف می‌کند، هر 30 ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند، و از آن زمان‌بندی‌ها استفاده می‌کند تا در اجراهای بعدی مسیرهای طولانی‌تر را زودتر شروع کند. برای چاپ manifest مسیر وزن‌دار بدون ساختن یا اجرای Docker، از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ طرح CI برای مسیرهای انتخاب‌شده، نیازهای بسته/تصویر، و اعتبارنامه‌ها، `node scripts/test-docker-all.mjs --plan-json` را اجرا کنید.
- `Package Acceptance` دروازهٔ بستهٔ بومی GitHub برای این پرسش است که «آیا این tarball قابل نصب به‌عنوان محصول کار می‌کند؟» این دروازه یک بستهٔ نامزد را از `source=npm`، `source=ref`، `source=url`، یا `source=artifact` resolve می‌کند، آن را با نام `package-under-test` بارگذاری می‌کند، سپس مسیرهای Docker E2E قابل استفادهٔ مجدد را دقیقاً در برابر همان tarball اجرا می‌کند، نه اینکه ref انتخاب‌شده را دوباره بسته‌بندی کند. پروفایل‌ها بر اساس گستردگی مرتب شده‌اند: `smoke`، `package`، `product`، و `full`. برای قرارداد بسته/به‌روزرسانی/Plugin، ماتریس بازماندهٔ ارتقای منتشرشده، پیش‌فرض‌های انتشار، و تریاژ خرابی، به [آزمودن به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.
- بررسی‌های ساخت و انتشار پس از tsdown، `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. این guard گراف ساخته‌شدهٔ static را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر importهای راه‌اندازی پیش از dispatch وابستگی‌های بسته مانند Commander، رابط prompt، undici، یا logging را پیش از dispatch فرمان وارد کنند شکست می‌خورد؛ همچنین chunk اجرای Gateway بسته‌بندی‌شده را زیر بودجه نگه می‌دارد و importهای static مسیرهای cold شناخته‌شدهٔ Gateway را رد می‌کند. smoke مربوط به CLI بسته‌بندی‌شده همچنین help ریشه، help مربوط به onboard، help مربوط به doctor، status، schema پیکربندی، و یک فرمان model-list را پوشش می‌دهد.
- سازگاری legacy مربوط به Package Acceptance تا `2026.4.25` سقف‌گذاری شده است (`2026.4.25-beta.*` هم شامل می‌شود). تا آن cutoff، harness فقط شکاف‌های metadata بسته‌های منتشرشده را تحمل می‌کند: ورودی‌های حذف‌شدهٔ inventory خصوصی QA، نبود `gateway install --wrapper`، نبود فایل‌های patch در fixture مربوط به git مشتق‌شده از tarball، نبود `update.channel` پایدارشده، مکان‌های legacy مربوط به install-recordهای Plugin، نبود پایداری install-record مربوط به marketplace، و مهاجرت metadata پیکربندی هنگام `plugins update`. برای بسته‌های پس از `2026.4.25`، آن مسیرها خرابی سخت‌گیرانه هستند.
- اجراکننده‌های container smoke: `test:docker:openwebui`، `test:docker:onboard`، `test:docker:npm-onboard-channel-agent`، `test:docker:release-user-journey`، `test:docker:release-typed-onboarding`، `test:docker:release-media-memory`، `test:docker:release-upgrade-user-journey`، `test:docker:release-plugin-marketplace`، `test:docker:skill-install`، `test:docker:update-channel-switch`، `test:docker:upgrade-survivor`، `test:docker:published-upgrade-survivor`، `test:docker:session-runtime-context`، `test:docker:agents-delete-shared-workspace`، `test:docker:gateway-network`، `test:docker:browser-cdp-snapshot`، `test:docker:mcp-channels`، `test:docker:agent-bundle-mcp-tools`، `test:docker:cron-mcp-cleanup`، `test:docker:plugins`، `test:docker:plugin-update`، `test:docker:plugin-lifecycle-matrix`، و `test:docker:config-reload` یک یا چند container واقعی را boot می‌کنند و مسیرهای یکپارچه‌سازی سطح بالاتر را تأیید می‌کنند.
- مسیرهای Docker/Bash E2E که tarball بسته‌بندی‌شدهٔ OpenClaw را از طریق `scripts/lib/openclaw-e2e-instance.sh` نصب می‌کنند، `npm install` را به `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` محدود می‌کنند (پیش‌فرض `600s`؛ برای غیرفعال کردن wrapper هنگام اشکال‌زدایی، `0` را تنظیم کنید).

اجراکننده‌های Docker مدل زنده همچنین فقط خانه‌های احراز هویت CLI موردنیاز را bind-mount می‌کنند (یا وقتی اجرا محدود نشده است، همهٔ موارد پشتیبانی‌شده را)، سپس پیش از اجرا آن‌ها را در خانهٔ container کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند tokenها را بدون تغییر فروشگاه احراز هویت میزبان refresh کند:

- مدل‌های مستقیم: `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- smoke اتصال ACP: `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex، و Gemini را پوشش می‌دهد، با پوشش سخت‌گیرانهٔ Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode`)
- smoke مربوط به backend در CLI: `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- smoke مربوط به harness سرور برنامهٔ Codex: `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل dev: `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- اسموک‌های مشاهده‌پذیری: `pnpm qa:otel:smoke`، `pnpm qa:prometheus:smoke`، و `pnpm qa:observability:smoke` مسیرهای checkout منبع خصوصی QA هستند. آن‌ها عمداً بخشی از مسیرهای انتشار Docker بسته نیستند، زیرا tarball مربوط به npm شامل QA Lab نیست.
- smoke زندهٔ Open WebUI: `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر onboarding (TTY، scaffolding کامل): `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- smoke مربوط به onboarding/channel/agent با tarball مربوط به Npm: `pnpm test:docker:npm-onboard-channel-agent` tarball بسته‌بندی‌شدهٔ OpenClaw را به‌صورت global در Docker نصب می‌کند، OpenAI را از طریق onboarding مبتنی بر env-ref به‌علاوهٔ Telegram به‌طور پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند، و یک نوبت عامل OpenAI mock شده را اجرا می‌کند. یک tarball از پیش ساخته‌شده را با `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، rebuild میزبان را با `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` رد کنید، یا channel را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` تغییر دهید.

- دود تست سفر کاربر انتشار: `pnpm test:docker:release-user-journey` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در یک خانه Docker تمیز نصب می‌کند، فرایند راه‌اندازی اولیه را اجرا می‌کند، یک ارائه‌دهنده OpenAI شبیه‌سازی‌شده را پیکربندی می‌کند، یک نوبت عامل را اجرا می‌کند، Pluginهای خارجی را نصب/حذف نصب می‌کند، ClickClack را در برابر یک fixture محلی پیکربندی می‌کند، پیام‌رسانی خروجی/ورودی را تأیید می‌کند، Gateway را بازراه‌اندازی می‌کند و doctor را اجرا می‌کند.
- دود تست راه‌اندازی اولیه تایپ‌شده انتشار: `pnpm test:docker:release-typed-onboarding` تاربال بسته‌بندی‌شده را نصب می‌کند، `openclaw onboard` را از طریق یک TTY واقعی پیش می‌برد، OpenAI را به‌عنوان ارائه‌دهنده env-ref پیکربندی می‌کند، نبود ماندگاری کلید خام را تأیید می‌کند و یک نوبت عامل شبیه‌سازی‌شده را اجرا می‌کند.
- دود تست رسانه/حافظه انتشار: `pnpm test:docker:release-media-memory` تاربال بسته‌بندی‌شده را نصب می‌کند، درک تصویر از یک پیوست PNG، خروجی تولید تصویر سازگار با OpenAI، یادآوری جست‌وجوی حافظه، و دوام یادآوری در بازراه‌اندازی Gateway را تأیید می‌کند.
- دود تست سفر کاربر ارتقای انتشار: `pnpm test:docker:release-upgrade-user-journey` به‌صورت پیش‌فرض جدیدترین خط مبنای منتشرشده قدیمی‌تر از تاربال کاندید را نصب می‌کند، وضعیت ارائه‌دهنده/Plugin/ClickClack را روی بسته منتشرشده پیکربندی می‌کند، به تاربال کاندید ارتقا می‌دهد، سپس سفر اصلی عامل/Plugin/کانال را دوباره اجرا می‌کند. اگر خط مبنای منتشرشده قدیمی‌تری وجود نداشته باشد، از نسخه کاندید دوباره استفاده می‌کند. خط مبنا را با `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` بازنویسی کنید.
- دود تست بازار Plugin انتشار: `pnpm test:docker:release-plugin-marketplace` از یک بازار fixture محلی نصب می‌کند، Plugin نصب‌شده را به‌روزرسانی می‌کند، آن را حذف نصب می‌کند و تأیید می‌کند CLI مربوط به Plugin با هرس شدن فراداده نصب ناپدید می‌شود.
- دود تست نصب Skill: `pnpm test:docker:skill-install` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، نصب‌های آرشیو بارگذاری‌شده را در پیکربندی غیرفعال می‌کند، slug فعلی و زنده Skill در ClawHub را از جست‌وجو resolve می‌کند، آن را با `openclaw skills install` نصب می‌کند و Skill نصب‌شده به‌همراه فراداده مبدأ/قفل `.clawhub` را تأیید می‌کند.
- دود تست تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` تاربال بسته‌بندی‌شده OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بسته `stable` به git `dev` تغییر می‌دهد، کارکرد کانال ماندگارشده و Plugin پس از به‌روزرسانی را تأیید می‌کند، سپس به بسته `stable` برمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- دود تست بازمانده ارتقا: `pnpm test:docker:upgrade-survivor` تاربال بسته‌بندی‌شده OpenClaw را روی یک fixture کاربر قدیمیِ کثیف با عامل‌ها، پیکربندی کانال، allowlistهای Plugin، وضعیت قدیمی وابستگی Plugin، و فایل‌های workspace/session موجود نصب می‌کند. به‌روزرسانی بسته به‌همراه doctor غیرتعاملی را بدون ارائه‌دهنده زنده یا کلیدهای کانال اجرا می‌کند، سپس یک Gateway loopback را شروع می‌کند و حفظ پیکربندی/وضعیت به‌همراه بودجه‌های startup/status را بررسی می‌کند.
- دود تست بازمانده ارتقای منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌صورت پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانه کاربر موجود را seed می‌کند، آن خط مبنا را با یک دستور پخت baked پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، آن نصب منتشرشده را به تاربال کاندید به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway loopback را شروع می‌کند و intentهای پیکربندی‌شده، حفظ وضعیت، startup، `/healthz`، `/readyz`، و بودجه‌های وضعیت RPC را بررسی می‌کند. یک خط مبنا را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید خط مبناهای محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد، و fixtureهای issue-شکل را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهید؛ مجموعه reported-issues شامل `configured-plugin-installs` برای تعمیر خودکار نصب Plugin خارجی OpenClaw است. Package Acceptance این‌ها را به‌صورت `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines`، و `published_upgrade_survivor_scenarios` در معرض می‌گذارد، توکن‌های خط مبنای meta مانند `last-stable-4` یا `all-since-2026.4.23` را resolve می‌کند، و Full Release Validation گیت بسته release-soak را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌علاوه `reported-issues` گسترش می‌دهد.
- دود تست زمینه runtime نشست: `pnpm test:docker:session-runtime-context` ماندگاری رونوشت زمینه runtime پنهان به‌همراه تعمیر doctor برای شاخه‌های تکراری prompt-rewrite آسیب‌دیده را تأیید می‌کند.
- دود تست نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک خانه ایزوله نصب می‌کند، و تأیید می‌کند `openclaw infer image providers --json` به‌جای هنگ کردن، ارائه‌دهنده‌های تصویر bundled را برمی‌گرداند. از یک تاربال ازپیش‌ساخته با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` دوباره استفاده کنید، ساخت میزبان را با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` رد کنید، یا `dist/` را از یک تصویر Docker ساخته‌شده با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` کپی کنید.
- دود تست Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک کش npm را میان کانتینرهای root، update، و direct-npm خود به اشتراک می‌گذارد. دود تست به‌روزرسانی پیش از ارتقا به تاربال کاندید، به‌صورت پیش‌فرض از npm `latest` به‌عنوان خط مبنای stable استفاده می‌کند. به‌صورت محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`، یا در GitHub با ورودی `update_baseline_version` گردش‌کار Install Smoke بازنویسی کنید. بررسی‌های نصب‌کننده غیرroot یک کش npm ایزوله نگه می‌دارند تا ورودی‌های کش متعلق به root رفتار نصب user-local را پنهان نکنند. برای استفاده دوباره از کش root/update/direct-npm در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- CI مربوط به Install Smoke به‌روزرسانی تکراری direct-npm سراسری را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` رد می‌کند؛ وقتی پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی بدون آن env اجرا کنید.
- دود تست CLI حذف workspace مشترک عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌صورت پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک workspace در خانه کانتینر ایزوله seed می‌کند، `agents delete --json` را اجرا می‌کند، و JSON معتبر به‌همراه رفتار حفظ workspace را تأیید می‌کند. از تصویر install-smoke با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` دوباره استفاده کنید.
- شبکه‌سازی Gateway (دو کانتینر، احراز هویت WS + سلامت): `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`)
- دود تست snapshot مرورگر CDP: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع به‌همراه یک لایه Chromium را می‌سازد، Chromium را با CDP خام شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و تأیید می‌کند snapshotهای نقش CDP نشانی‌های URL پیوند، clickableهای ارتقایافته با نشانگر، refهای iframe، و فراداده frame را پوشش می‌دهند.
- رگرسیون استدلال حداقلی OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور OpenAI شبیه‌سازی‌شده را از طریق Gateway اجرا می‌کند، تأیید می‌کند `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس رد schema ارائه‌دهنده را اجبار می‌کند و بررسی می‌کند جزئیات خام در logهای Gateway ظاهر می‌شود.
- پل کانال MCP (Gateway seed‌شده + پل stdio + دود تست notification-frame خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بسته OpenClaw (سرور MCP واقعی stdio + دود تست اجازه/رد پروفایل OpenClaw embedded): `pnpm test:docker:agent-bundle-mcp-tools` (اسکریپت: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- پاک‌سازی Cron/subagent MCP (Gateway واقعی + teardown فرزند stdio MCP پس از اجراهای Cron ایزوله و subagent یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginها (دود تست نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoisted، فراداده خراب بسته npm، refهای متحرک git، kitchen-sink در ClawHub، به‌روزرسانی‌های بازار، و فعال‌سازی/بازرسی بسته Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای رد کردن بلوک ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض بسته/runtime مربوط به kitchen-sink را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، تست از یک سرور fixture محلی hermetic ClawHub استفاده می‌کند.
- دود تست به‌روزرسانی بدون تغییر Plugin: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- دود تست ماتریس چرخه عمر Plugin: `pnpm test:docker:plugin-lifecycle-matrix` تاربال بسته‌بندی‌شده OpenClaw را در یک کانتینر bare نصب می‌کند، یک Plugin npm را نصب می‌کند، فعال/غیرفعال را تغییر می‌دهد، آن را از طریق یک رجیستری npm محلی ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس تأیید می‌کند حذف نصب همچنان وضعیت stale را حذف می‌کند و در همین حال معیارهای RSS/CPU را برای هر مرحله چرخه عمر log می‌کند.
- دود تست فراداده بارگذاری مجدد پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginها: `pnpm test:docker:plugins` دود تست نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های hoisted، refهای متحرک git، fixtureهای ClawHub، به‌روزرسانی‌های بازار، و فعال‌سازی/بازرسی بسته Claude را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار به‌روزرسانی بدون تغییر برای Pluginهای نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب، فعال‌سازی، غیرفعال‌سازی، ارتقا، تنزل، و حذف نصب در نبود کد برای Plugin npm با ردیابی منابع را پوشش می‌دهد.

برای prebuild و استفاده دوباره دستی از تصویر functional مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر ویژه هر suite مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` همچنان در صورت تنظیم شدن اولویت دارند. وقتی `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک remote اشاره کند، اگر از قبل محلی نباشد، اسکریپت‌ها آن را pull می‌کنند. تست‌های Docker مربوط به QR و نصب‌کننده Dockerfileهای خودشان را نگه می‌دارند، چون رفتار بسته/نصب را اعتبارسنجی می‌کنند، نه runtime برنامه ساخته‌شده مشترک.

اجراکننده‌های Docker مدل زنده همچنین checkout فعلی را به‌صورت فقط‌خواندنی bind-mount می‌کنند و
آن را در یک workdir موقت داخل container مرحله‌بندی می‌کنند. این کار image زمان اجرا را
کم‌حجم نگه می‌دارد، در حالی که Vitest همچنان دقیقاً روی منبع/پیکربندی محلی شما اجرا می‌شود.
مرحلهٔ مرحله‌بندی cacheهای بزرگ فقط‌محلی و خروجی‌های build برنامه مانند
`.pnpm-store`، `.worktrees`، `__openclaw_vitest__`، و دایرکتوری‌های خروجی `.build` محلی برنامه یا
Gradle را رد می‌کند تا اجراهای زندهٔ Docker چند دقیقه را صرف کپی‌کردن
artifactهای مخصوص ماشین نکنند.
آن‌ها همچنین `OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا probeهای زندهٔ gateway
workerهای کانال واقعی Telegram/Discord/و غیره را داخل container شروع نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند، پس وقتی نیاز دارید پوشش زندهٔ gateway را
در آن lane Docker محدود یا مستثنی کنید، `OPENCLAW_LIVE_GATEWAY_*` را نیز عبور دهید.
`test:docker:openwebui` یک smoke سازگاری سطح‌بالاتر است: یک container
gateway OpenClaw را با endpointهای HTTP سازگار با OpenAI فعال شروع می‌کند،
یک container سنجاق‌شدهٔ Open WebUI را در برابر آن gateway شروع می‌کند، از طریق
Open WebUI وارد می‌شود، تأیید می‌کند که `/api/models` مقدار `openclaw/default` را نمایش می‌دهد، سپس یک
درخواست chat واقعی را از طریق proxy به نام `/api/chat/completions` در Open WebUI ارسال می‌کند.
برای بررسی‌های CI مسیر انتشار که باید پس از ورود به Open WebUI و کشف مدل متوقف شوند،
بدون انتظار برای تکمیل مدل زنده، `OPENWEBUI_SMOKE_MODE=models` را تنظیم کنید.
اجرای نخست می‌تواند به‌طور محسوسی کندتر باشد، زیرا Docker ممکن است لازم باشد image
Open WebUI را pull کند و Open WebUI ممکن است لازم باشد setup شروع سرد خودش را کامل کند.
این lane انتظار یک کلید مدل زندهٔ قابل‌استفاده دارد. آن را از طریق environment فرایند،
profileهای auth مرحله‌بندی‌شده، یا یک `OPENCLAW_PROFILE_FILE` صریح فراهم کنید.
اجراهای موفق یک payload کوچک JSON مانند `{ "ok": true, "model":
"openclaw/default", ... }` چاپ می‌کنند.
`test:docker:mcp-channels` عمداً قطعی است و به حساب واقعی
Telegram، Discord، یا iMessage نیاز ندارد. یک container مقداردهی‌شدهٔ Gateway را boot می‌کند،
container دومی را شروع می‌کند که `openclaw mcp serve` را spawn می‌کند، سپس
کشف مکالمهٔ routeشده، خواندن transcriptها، metadata پیوست،
رفتار queue رویداد زنده، routeکردن ارسال خروجی، و اعلان‌های کانال + مجوز به سبک Claude را
از طریق پل stdio MCP واقعی تأیید می‌کند. بررسی اعلان
frameهای خام stdio MCP را مستقیماً inspect می‌کند تا smoke آنچه را که
پل واقعاً emit می‌کند اعتبارسنجی کند، نه فقط آنچه یک SDK کلاینت خاص اتفاقاً surface می‌کند.
`test:docker:agent-bundle-mcp-tools` قطعی است و به کلید مدل زنده نیاز ندارد.
image Docker repo را build می‌کند، یک server probe واقعی stdio MCP را
داخل container شروع می‌کند، آن server را از طریق زمان اجرای MCP bundle تعبیه‌شدهٔ OpenClaw
materialize می‌کند، tool را اجرا می‌کند، سپس تأیید می‌کند `coding` و `messaging` ابزارهای
`bundle-mcp` را نگه می‌دارند، در حالی که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را filter می‌کنند.
`test:docker:cron-mcp-cleanup` قطعی است و به کلید مدل زنده نیاز ندارد.
یک Gateway مقداردهی‌شده را با یک server probe واقعی stdio MCP شروع می‌کند، یک turn
cron ایزوله و یک turn child یک‌بارهٔ `sessions_spawn` را اجرا می‌کند، سپس تأیید می‌کند
فرایند child MCP پس از هر اجرا خارج می‌شود.

smoke دستی thread زبان سادهٔ ACP (نه CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این script را برای workflowهای regression/debug نگه دارید. ممکن است دوباره برای اعتبارسنجی routeکردن thread در ACP لازم شود، پس آن را حذف نکنید.

env varهای مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که به `/home/node/.openclaw` mount می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که به `/home/node/.openclaw/workspace` mount می‌شود
- `OPENCLAW_PROFILE_FILE=...` که پیش از اجرای testها mount و source می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای تأیید فقط env varهای sourceشده از `OPENCLAW_PROFILE_FILE`، با استفاده از دایرکتوری‌های config/workspace موقت و بدون mountهای auth خارجی CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`) که برای نصب‌های cacheشدهٔ CLI داخل Docker به `/home/node/.npm-global` mount می‌شود
- دایرکتوری‌ها/فایل‌های auth خارجی CLI زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` mount می‌شوند، سپس پیش از شروع testها در `/home/node/...` کپی می‌شوند
  - دایرکتوری‌های پیش‌فرض: `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای محدودشده به provider فقط دایرکتوری‌ها/فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنباط شده‌اند mount می‌کنند
  - به‌صورت دستی با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا یک فهرست کامایی مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` override کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدودکردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای filterکردن providerها داخل container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفادهٔ دوباره از یک image موجود `openclaw:local-live` در rerunهایی که به rebuild نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه credentials از profile store می‌آیند (نه env)
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که gateway برای smoke Open WebUI نمایش می‌دهد
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای overrideکردن prompt بررسی nonce که smoke Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای overrideکردن tag image سنجاق‌شدهٔ Open WebUI

## sanity مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
وقتی به بررسی headingهای داخل صفحه هم نیاز دارید، اعتبارسنجی کامل anchor در Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## regression آفلاین (ایمن برای CI)

این‌ها regressionهای «pipeline واقعی» بدون providerهای واقعی هستند:

- فراخوانی tool در Gateway (OpenAI mock، gateway واقعی + loop agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- wizard در Gateway (WS `wizard.start`/`wizard.next`، نوشتن config + الزام auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## ارزیابی‌های قابلیت اطمینان agent (skills)

ما همین حالا چند test ایمن برای CI داریم که مانند «ارزیابی‌های قابلیت اطمینان agent» رفتار می‌کنند:

- فراخوانی tool به‌صورت mock از طریق gateway واقعی + loop agent (`src/gateway/gateway.test.ts`).
- flowهای wizard سرتاسری که wiring session و اثرات config را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

آنچه هنوز برای Skills کم است (ببینید [Skills](/fa/tools/skills)):

- **تصمیم‌گیری:** وقتی skills در prompt فهرست شده‌اند، آیا agent مهارت درست را انتخاب می‌کند (یا از موارد نامرتبط پرهیز می‌کند)؟
- **پایبندی:** آیا agent پیش از استفاده `SKILL.md` را می‌خواند و stepها/argهای لازم را دنبال می‌کند؟
- **قراردادهای workflow:** سناریوهای چند turn که ترتیب toolها، carryover تاریخچهٔ session، و مرزهای sandbox را assert می‌کنند.

ارزیابی‌های آینده باید ابتدا قطعی بمانند:

- یک scenario runner با استفاده از providerهای mock برای assertکردن tool callها + ترتیب، خواندن فایل skill، و wiring session.
- یک suite کوچک از سناریوهای متمرکز بر skill (استفاده در برابر پرهیز، gating، prompt injection).
- ارزیابی‌های زندهٔ اختیاری (opt-in، gateشده با env) فقط پس از اینکه suite ایمن برای CI برقرار شد.

## testهای contract (شکل Plugin و کانال)

testهای contract تأیید می‌کنند که هر Plugin و کانال ثبت‌شده با
contract رابط خودش مطابقت دارد. آن‌ها روی همهٔ Pluginهای کشف‌شده iterate می‌کنند و یک suite از
assertionهای شکل و رفتار را اجرا می‌کنند. lane واحد پیش‌فرض `pnpm test` عمداً
این فایل‌های shared seam و smoke را رد می‌کند؛ وقتی سطح‌های مشترک کانال یا provider را لمس می‌کنید،
دستورهای contract را صریح اجرا کنید.

### دستورها

- همهٔ contractها: `pnpm test:contracts`
- فقط contractهای کانال: `pnpm test:contracts:channels`
- فقط contractهای provider: `pnpm test:contracts:plugins`

### contractهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند:

- **plugin** - شکل پایهٔ Plugin (id، name، capabilities)
- **setup** - contract مربوط به setup wizard
- **session-binding** - رفتار session binding
- **outbound-payload** - ساختار payload پیام
- **inbound** - handling پیام ورودی
- **actions** - handlerهای action کانال
- **threading** - handling شناسهٔ thread
- **directory** - API دایرکتوری/roster
- **group-policy** - اجرای policy گروه

### contractهای وضعیت provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند.

- **status** - probeهای وضعیت کانال
- **registry** - شکل registry Plugin

### contractهای provider

در `src/plugins/contracts/*.contract.test.ts` قرار دارند:

- **auth** - contract مربوط به flow auth
- **auth-choice** - انتخاب/گزینش auth
- **catalog** - API کاتالوگ مدل
- **discovery** - کشف Plugin
- **loader** - بارگذاری Plugin
- **runtime** - زمان اجرای provider
- **shape** - شکل/رابط Plugin
- **wizard** - setup wizard

### زمان اجرا

- پس از تغییر exportها یا subpathهای plugin-sdk
- پس از افزودن یا اصلاح یک Plugin کانال یا provider
- پس از refactor کردن ثبت یا کشف Plugin

testهای contract در CI اجرا می‌شوند و به کلیدهای API واقعی نیاز ندارند.

## افزودن regressionها (راهنما)

وقتی یک مشکل provider/model کشف‌شده در live را رفع می‌کنید:

- اگر ممکن است یک regression ایمن برای CI اضافه کنید (provider mock/stub، یا captureکردن transformation دقیق request-shape)
- اگر ذاتاً فقط زنده است (rate limitها، policyهای auth)، test زنده را محدود و opt-in از طریق env varها نگه دارید
- ترجیح دهید کوچک‌ترین لایه‌ای را هدف بگیرید که bug را می‌گیرد:
  - bug تبدیل/replay درخواست provider → test مستقیم models
  - bug pipeline مربوط به session/history/tool در gateway → smoke زندهٔ gateway یا test mock gateway ایمن برای CI
- guardrail پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` یک target نمونه برای هر کلاس SecretRef را از metadata رجیستری (`listSecretTargetRegistryEntries()`) استخراج می‌کند، سپس assert می‌کند exec idهای دارای traversal-segment رد می‌شوند.
  - اگر یک family هدف SecretRef جدید با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن test به‌روزرسانی کنید. test عمداً روی target idهای طبقه‌بندی‌نشده fail می‌شود تا کلاس‌های جدید بی‌صدا رد نشوند.

## مرتبط

- [Testing live](/fa/help/testing-live)
- [Testing updates and plugins](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
