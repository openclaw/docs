---
read_when:
    - اجرای آزمون‌ها به‌صورت محلی یا در CI
    - افزودن آزمون‌های رگرسیون برای باگ‌های مدل/ارائه‌دهنده
    - اشکال‌زدایی رفتار Gateway و عامل
summary: 'کیت آزمون: مجموعه‌های واحد، سرتاسری و زنده، اجراکننده‌های Docker و موارد تحت پوشش هر آزمون'
title: آزمایش
x-i18n:
    generated_at: "2026-07-12T10:08:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw دارای سه مجموعه‌آزمون Vitest (واحد/یکپارچه‌سازی، سرتاسری و زنده) به‌همراه اجراگرهای Docker است. این صفحه توضیح می‌دهد هر مجموعه چه مواردی را پوشش می‌دهد، برای هر گردش‌کار چه فرمانی باید اجرا شود، آزمون‌های زنده چگونه اعتبارنامه‌ها را پیدا می‌کنند و چگونه می‌توان برای باگ‌های واقعی ارائه‌دهنده/مدل آزمون‌های رگرسیون افزود.

<Note>
**پشته تضمین کیفیت (qa-lab، qa-channel و مسیرهای انتقال زنده)** به‌طور جداگانه مستند شده است:

- [نمای کلی تضمین کیفیت](/fa/concepts/qa-e2e-automation) - معماری، سطح فرمان و نگارش سناریو.
- [تضمین کیفیت ماتریسی](/fa/concepts/qa-matrix) - مرجع `pnpm openclaw qa matrix`.
- [کارت امتیاز بلوغ](/fa/maturity/scorecard) - نحوه پشتیبانی شواهد تضمین کیفیت انتشار از تصمیم‌های پایداری و پشتیبانی بلندمدت.
- [کانال تضمین کیفیت](/fa/channels/qa-channel) - Plugin انتقال مصنوعی که سناریوهای متکی بر مخزن از آن استفاده می‌کنند.

این صفحه مجموعه‌آزمون‌های عادی و اجراگرهای Docker/Parallels را پوشش می‌دهد. بخش [اجراگرهای ویژه تضمین کیفیت](#qa-specific-runners) در ادامه، فراخوانی‌های مشخص `qa` را فهرست می‌کند و به مراجع بالا ارجاع می‌دهد.
</Note>

## شروع سریع

برای بیشتر روزها:

- دروازه کامل (پیش از ارسال تغییرات انتظار می‌رود): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- اجرای محلی سریع‌تر کل مجموعه روی دستگاهی با منابع کافی: `pnpm test:max`
- چرخه نظارت مستقیم Vitest: `pnpm test:watch`
- هدف‌گیری مستقیم فایل، مسیرهای Plugin/کانال را نیز مسیریابی می‌کند: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- هنگام تکرار و اصلاح یک شکست، ابتدا اجراهای هدفمند را ترجیح دهید.
- محیط تضمین کیفیت متکی بر Docker: `pnpm qa:lab:up`
- مسیر تضمین کیفیت متکی بر ماشین مجازی Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

هنگامی که آزمون‌ها را تغییر می‌دهید یا به اطمینان بیشتری نیاز دارید:

- گزارش پوشش اطلاعاتی V8: `pnpm test:coverage`
- مجموعه سرتاسری: `pnpm test:e2e`

## دایرکتوری‌های موقت آزمون

برای دایرکتوری‌های موقتی که مالکیتشان با آزمون است، از ابزارهای کمکی مشترک در `test/helpers/temp-dir.ts` استفاده کنید تا مالکیت صریح باشد و پاک‌سازی در چرخه‌عمر آزمون باقی بماند:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` عمداً هیچ روش پاک‌سازی دستی ارائه نمی‌کند؛ Vitest پس از هر آزمون مالک پاک‌سازی است. ابزارهای کمکی سطح پایین‌تر و قدیمی‌تر (`makeTempDir`، `cleanupTempDirs` و `createTempDirTracker`) همچنان برای آزمون‌هایی که مهاجرت نکرده‌اند وجود دارند؛ از استفاده جدید آن‌ها و فراخوانی‌های مستقیم جدید `fs.mkdtemp*` خودداری کنید، مگر اینکه آزمونی صراحتاً رفتار خام دایرکتوری موقت را بررسی کند. هنگامی که واقعاً به یک دایرکتوری موقت مستقیم نیاز است، یک توضیح مجوز قابل‌ممیزی همراه با دلیل اضافه کنید:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` ایجاد دایرکتوری موقت مستقیم جدید و استفاده دستی جدید از ابزار کمکی مشترک را در خطوط افزوده‌شده تفاوت گزارش می‌کند، بدون آنکه سبک‌های پاک‌سازی موجود را مسدود کند. این ابزار از همان طبقه‌بندی مسیر آزمون در `scripts/changed-lanes.mjs` پیروی می‌کند و خود پیاده‌سازی ابزار کمکی مشترک را نادیده می‌گیرد. `check:changed` این گزارش را برای مسیرهای آزمون تغییرکرده به‌عنوان یک سیگنال صرفاً هشداردهنده CI اجرا می‌کند (حاشیه‌نویسی‌های هشدار GitHub، نه شکست).

## گردش‌کارهای زنده و Docker/Parallels

هنگام اشکال‌زدایی ارائه‌دهندگان/مدل‌های واقعی (نیازمند اعتبارنامه‌های واقعی):

- مجموعه زنده (مدل‌ها به‌همراه کاوش‌های ابزار/تصویر Gateway): `pnpm test:live`
- هدف‌گیری بی‌سروصدای یک فایل زنده: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- گزارش‌های کارایی زمان اجرا: `OpenClaw Performance` را با `live_openai_candidate=true` برای یک نوبت عامل واقعی `openai/gpt-5.6-luna` یا با `deep_profile=true` برای مصنوعات پردازنده/هیپ/ردیابی Kova اجرا کنید. اجراهای زمان‌بندی‌شده روزانه، گزارش‌های مسیر ارائه‌دهنده ساختگی، نمایه عمیق و GPT-5.6 Luna را از طریق یک کار انتشاردهنده جداگانه که مصنوعات را مصرف می‌کند، در `openclaw/clawgrit-reports` منتشر می‌کنند؛ نبود یا نامعتبر بودن احراز هویت انتشاردهنده باعث شکست اجراهای زمان‌بندی‌شده و اجراهای `profile=release` می‌شود. اجراهای دستی غیرانتشاری مصنوعات GitHub را نگه می‌دارند و انتشار گزارش را توصیه‌ای تلقی می‌کنند. گزارش ارائه‌دهنده ساختگی همچنین شامل اعداد راه‌اندازی Gateway در سطح منبع، حافظه، فشار Plugin، چرخه تکراری سلام مدل ساختگی و راه‌اندازی CLI است.
- پیمایش زنده مدل‌ها در Docker: `pnpm test:docker:live-models`
  - هر مدل انتخاب‌شده یک نوبت متنی به‌همراه یک کاوش کوچک مشابه خواندن فایل اجرا می‌کند. مدل‌هایی که فراداده آن‌ها ورودی `image` را اعلام می‌کند، یک نوبت تصویری کوچک نیز اجرا می‌کنند. هنگام جداسازی شکست‌های ارائه‌دهنده، کاوش‌های اضافی را با `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` یا `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` غیرفعال کنید.
  - پوشش CI: هر دو گردش‌کار روزانه `OpenClaw Scheduled Live And E2E Checks` و دستی `OpenClaw Release Checks` گردش‌کار زنده/سرتاسری قابل‌استفاده مجدد را با `include_live_suites: true` فراخوانی می‌کنند که شامل کارهای ماتریس زنده مدل‌های Docker با تقسیم‌بندی بر اساس ارائه‌دهنده است.
  - برای اجرای مجدد متمرکز CI، `OpenClaw Live And E2E Checks (Reusable)` را با `include_live_suites: true` و `live_models_only: true` اجرا کنید.
  - رازهای جدید و پرسیگنال ارائه‌دهنده را به `scripts/ci-hydrate-live-auth.sh`، همچنین `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` و فراخواننده‌های زمان‌بندی‌شده/انتشاری آن اضافه کنید.
- بررسی دود بومی گفت‌وگوی مقید Codex: `pnpm test:docker:live-codex-bind`
  - یک مسیر زنده Docker را در برابر مسیر سرور برنامه Codex اجرا می‌کند، یک پیام خصوصی مصنوعی Slack را با `/codex bind` مقید می‌کند، `/codex fast` و `/codex permissions` را به کار می‌گیرد و سپس تأیید می‌کند که یک پاسخ ساده و یک پیوست تصویری به‌جای ACP از طریق اتصال بومی Plugin مسیریابی می‌شوند.
- بررسی دود مهار سرور برنامه Codex: `pnpm test:docker:live-codex-harness`
  - نوبت‌های عامل Gateway را از طریق مهار سرور برنامه Codex متعلق به Plugin اجرا می‌کند، `/codex status` و `/codex models` را تأیید می‌کند و به‌طور پیش‌فرض کاوش‌های تصویر، Cron MCP، عامل فرعی و Guardian را به کار می‌گیرد. هنگام جداسازی شکست‌های دیگر، کاوش عامل فرعی را با `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` غیرفعال کنید. برای بررسی متمرکز عامل فرعی، کاوش‌های دیگر را غیرفعال کنید:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    این فرایند پس از کاوش عامل فرعی خارج می‌شود، مگر اینکه `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` تنظیم شده باشد.
- بررسی دود نصب درخواستی Codex: `pnpm test:docker:codex-on-demand`
  - بسته tar مربوط به OpenClaw را در Docker نصب می‌کند، راه‌اندازی اولیه کلید API مربوط به OpenAI را اجرا می‌کند و تأیید می‌کند که Plugin مربوط به Codex به‌همراه وابستگی `@openai/codex` در صورت نیاز در ریشه پروژه npm مدیریت‌شده بارگیری شده‌اند.
- بررسی دود زنده وابستگی ابزار Plugin: `pnpm test:docker:live-plugin-tool`
  - یک Plugin نمونه را با وابستگی واقعی `slugify` بسته‌بندی می‌کند، آن را از طریق `npm-pack:` نصب می‌کند، وابستگی را زیر ریشه پروژه npm مدیریت‌شده تأیید می‌کند و سپس از یک مدل زنده OpenAI می‌خواهد ابزار Plugin را فراخوانی کرده و نامک پنهان را برگرداند.
- بررسی دود فرمان نجات Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - بررسی اختیاری و چندلایه برای سطح فرمان نجات کانال پیام. `/crestodian status` را به کار می‌گیرد، یک تغییر پایدار مدل را در صف قرار می‌دهد، با `/crestodian yes` پاسخ می‌دهد و مسیر نوشتن ممیزی/پیکربندی را تأیید می‌کند.
- بررسی دود نخستین اجرای Crestodian در Docker: `pnpm test:docker:crestodian-first-run`
  - از یک دایرکتوری وضعیت خالی OpenClaw آغاز می‌کند و ابتدا ثابت می‌کند CLI بسته‌بندی‌شده `openclaw crestodian` بدون استنتاج به‌شکل بسته و امن شکست می‌خورد. سپس Claude ساختگی را از طریق ماژول فعال‌سازی بسته‌بندی‌شده آزمایش و فعال می‌کند. تنها پس از آن است که یک درخواست تقریبی CLI بسته‌بندی‌شده به برنامه‌ریز می‌رسد و به راه‌اندازی نوع‌دار تبدیل می‌شود و در ادامه عملیات یک‌مرحله‌ای مدل، عامل، Plugin مربوط به Discord و SecretRef انجام می‌شود. این فرایند ورودی‌های پیکربندی و ممیزی را اعتبارسنجی می‌کند. این شواهد پشتیبان دروازه/عملیات است، نه اثبات راه‌اندازی تعاملی یا عامل/ابزار/تأیید Crestodian. همین مسیر در آزمایشگاه تضمین کیفیت با `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` نیز در دسترس است.
- بررسی دود هزینه Moonshot/Kimi: با تنظیم `MOONSHOT_API_KEY`، ابتدا `openclaw models list --provider moonshot --json` را اجرا کنید، سپس یک `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` ایزوله را در برابر `moonshot/kimi-k2.6` اجرا کنید. تأیید کنید که JSON، ‏Moonshot/K2.6 را گزارش می‌کند و رونوشت دستیار مقدار نرمال‌شده `usage.cost` را ذخیره می‌کند.

<Tip>
هنگامی که فقط به یک مورد شکست‌خورده نیاز دارید، محدود کردن آزمون‌های زنده با متغیرهای محیطی فهرست مجاز که در ادامه توضیح داده شده‌اند را ترجیح دهید.
</Tip>

## اجراگرهای ویژه تضمین کیفیت

هنگامی که به واقع‌گرایی آزمایشگاه تضمین کیفیت نیاز دارید، این فرمان‌ها در کنار مجموعه‌آزمون‌های اصلی قرار می‌گیرند.

CI آزمایشگاه تضمین کیفیت را در گردش‌کارهای اختصاصی اجرا می‌کند. هم‌ارزی عامل‌محور زیرمجموعه `QA-Lab - All Lanes` و اعتبارسنجی انتشار است، نه یک گردش‌کار مستقل درخواست کشش. اعتبارسنجی گسترده باید از `Full Release Validation` با `rerun_group=qa-parity` یا گروه تضمین کیفیت بررسی‌های انتشار استفاده کند. بررسی‌های انتشار پایدار/پیش‌فرض، آزمون طولانی زنده/Docker را پشت `run_release_soak=true` نگه می‌دارند؛ نمایه `full` اجرای آزمون طولانی را اجباری می‌کند. `QA-Lab - All Lanes` هر شب روی `main` و از طریق اجرای دستی، مسیر هم‌ارزی ساختگی، مسیر زنده Matrix، مسیر زنده Telegram با مدیریت Convex و مسیر زنده Discord با مدیریت Convex را به‌صورت کارهای موازی اجرا می‌کند. تضمین کیفیت زمان‌بندی‌شده و بررسی‌های انتشار، `--profile fast` را برای Matrix صراحتاً ارسال می‌کنند، درحالی‌که مقدار پیش‌فرض CLI مربوط به Matrix و ورودی گردش‌کار دستی همچنان `all` است؛ اجرای دستی می‌تواند `all` را میان کارهای `transport`، `media`، `e2ee-smoke`، `e2ee-deep` و `e2ee-cli` تقسیم کند. `OpenClaw Release Checks` پیش از تأیید انتشار، هم‌ارزی به‌همراه مسیرهای سریع Matrix و Telegram را اجرا می‌کند و برای بررسی‌های انتقال انتشار از `mock-openai/gpt-5.6-luna` استفاده می‌کند تا قطعی باقی بمانند و از راه‌اندازی معمول Plugin ارائه‌دهنده اجتناب شود. این Gatewayهای انتقال زنده جست‌وجوی حافظه را غیرفعال می‌کنند؛ رفتار حافظه همچنان توسط مجموعه‌های هم‌ارزی تضمین کیفیت پوشش داده می‌شود.

بخش‌های زنده رسانه‌ای انتشار کامل از `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` استفاده می‌کنند که از پیش `ffmpeg` و `ffprobe` را دارد. بخش‌های زنده مدل/بک‌اند Docker از تصویر مشترک `ghcr.io/openclaw/openclaw-live-test:<sha>` استفاده می‌کنند که برای هر کامیت انتخاب‌شده یک‌بار ساخته می‌شود و سپس به‌جای ساخت مجدد در هر بخش، آن را با `OPENCLAW_SKIP_DOCKER_BUILD=1` دریافت می‌کنند.

- `pnpm openclaw qa suite`
  - سناریوهای QA متکی بر مخزن را مستقیماً روی میزبان اجرا می‌کند.
  - برای مجموعه سناریوهای انتخاب‌شده، مصنوعات سطح‌بالای `qa-evidence.json`، `qa-suite-summary.json` و
    `qa-suite-report.md` را می‌نویسد که شامل انتخاب سناریوهای جریان ترکیبی، Vitest و Playwright است.
  - وقتی از طریق `pnpm openclaw qa run --qa-profile <profile>` اجرا شود،
    کارت امتیاز پروفایل طبقه‌بندی انتخاب‌شده را در همان `qa-evidence.json` درج می‌کند.
    `smoke-ci` شواهد کم‌حجم می‌نویسد (`evidenceMode: "slim"`، بدون
    `execution` برای هر ورودی). `release` بخش گزینش‌شده آمادگی انتشار را پوشش می‌دهد؛ `all`
    همه دسته‌های بلوغ فعال را انتخاب می‌کند و هنگامی که مصنوع کامل کارت امتیاز لازم باشد،
    اجرای صریح گردش‌کار شواهد پروفایل QA را هدف قرار می‌دهد.
  - به‌طور پیش‌فرض چند سناریوی انتخاب‌شده را به‌صورت موازی و با workerهای
    Gateway ایزوله اجرا می‌کند. هم‌زمانی پیش‌فرض `qa-channel` برابر ۴ است (با محدودیت
    تعداد سناریوهای انتخاب‌شده). برای تنظیم تعداد workerها از `--concurrency <count>`
    یا برای مسیر سریال قدیمی‌تر از `--concurrency 1` استفاده کنید.
  - اگر هر سناریویی شکست بخورد، با کد خروج غیرصفر خاتمه می‌یابد. برای تولید مصنوعات
    بدون کد خروج شکست، از `--allow-failures` استفاده کنید.
  - از حالت‌های ارائه‌دهنده `live-frontier`، `mock-openai` و `aimock` پشتیبانی می‌کند.
    `aimock` یک سرور ارائه‌دهنده محلی مبتنی بر AIMock را برای پوشش آزمایشی
    fixture و شبیه‌سازی پروتکل راه‌اندازی می‌کند، بدون آنکه مسیر سناریومحور
    `mock-openai` را جایگزین کند.
- `pnpm openclaw qa coverage --match <query>`
  - شناسه‌ها و عنوان‌های سناریو، سطوح، شناسه‌های پوشش، ارجاعات مستندات، ارجاعات کد،
    Pluginها و الزامات ارائه‌دهنده را جست‌وجو می‌کند و سپس اهداف مجموعه منطبق را
    نمایش می‌دهد.
  - وقتی رفتار یا مسیر فایل تغییریافته را می‌دانید اما کوچک‌ترین سناریو را نمی‌شناسید،
    پیش از اجرای QA Lab از این دستور استفاده کنید. این فقط جنبه راهنمایی دارد؛ همچنان
    باید بر اساس رفتار در حال تغییر، شواهد شبیه‌سازی‌شده، زنده، Multipass، Matrix یا
    انتقال را انتخاب کنید.
- `pnpm test:plugins:kitchen-sink-live`
  - آزمون جامع و زنده Plugin موسوم به OpenAI Kitchen Sink را از طریق QA Lab اجرا می‌کند.
    بسته خارجی Kitchen Sink را نصب می‌کند، فهرست سطوح SDK مربوط به Plugin را تأیید
    می‌کند، `/healthz` و `/readyz` را می‌آزماید، شواهد CPU/RSS مربوط به Gateway را
    ثبت می‌کند، یک نوبت زنده OpenAI را اجرا می‌کند و تشخیص‌های خصمانه را بررسی می‌کند.
    به احراز هویت زنده OpenAI مانند `OPENAI_API_KEY` نیاز دارد. در نشست‌های آماده‌شده
    Testbox، وقتی ابزار کمکی `openclaw-testbox-env` موجود باشد، به‌طور خودکار پروفایل
    احراز هویت زنده Testbox را بارگذاری می‌کند.
- `pnpm test:gateway:cpu-scenarios`
  - سنجش راه‌اندازی Gateway را به‌همراه بسته کوچکی از سناریوهای شبیه‌سازی‌شده QA Lab
    (`channel-chat-baseline`، `memory-failure-fallback`،
    `gateway-restart-inflight-run`) اجرا می‌کند و خلاصه ترکیبی مشاهده CPU را در
    `.artifacts/gateway-cpu-scenarios/` می‌نویسد.
  - به‌طور پیش‌فرض فقط مشاهدات پایدار مصرف بالای CPU را علامت‌گذاری می‌کند
    (`--cpu-core-warn` با مقدار پیش‌فرض `0.9`؛ `--hot-wall-warn-ms` با مقدار پیش‌فرض
    `30000`)؛ بنابراین جهش‌های کوتاه راه‌اندازی به‌عنوان معیار ثبت می‌شوند، بدون
    اینکه شبیه پسرفت چنددقیقه‌ای درگیری مداوم Gateway به نظر برسند.
  - روی مصنوعات ساخته‌شده `dist` اجرا می‌شود؛ اگر checkout از قبل خروجی زمان‌اجرای
    تازه ندارد، ابتدا build را اجرا کنید.
- `pnpm openclaw qa suite --runner multipass`
  - همان مجموعه QA را درون یک ماشین مجازی یک‌بارمصرف Multipass Linux اجرا می‌کند و
    پرچم‌های انتخاب سناریو و ارائه‌دهنده/مدل را مانند `qa suite` حفظ می‌کند.
  - اجراهای زنده ورودی‌های احراز هویت QA قابل‌استفاده برای مهمان را ارسال می‌کنند:
    کلیدهای ارائه‌دهنده مبتنی بر متغیر محیطی، مسیر پیکربندی ارائه‌دهنده زنده QA و
    در صورت وجود `CODEX_HOME`.
  - پوشه‌های خروجی باید زیر ریشه مخزن باقی بمانند تا مهمان بتواند از طریق فضای کاری
    mountشده در آن‌ها بنویسد.
  - گزارش و خلاصه معمول QA را به‌همراه گزارش‌های Multipass در
    `.artifacts/qa-e2e/...` می‌نویسد.
- `pnpm qa:lab:up`
  - سایت QA مبتنی بر Docker را برای کار QA به سبک اپراتور راه‌اندازی می‌کند.
- `pnpm test:docker:npm-onboard-channel-agent`
  - از checkout فعلی یک tarball مربوط به npm می‌سازد، آن را به‌صورت سراسری در Docker
    نصب می‌کند، راه‌اندازی غیرتعاملی با کلید API مربوط به OpenAI را اجرا می‌کند،
    به‌طور پیش‌فرض Telegram را پیکربندی می‌کند، تأیید می‌کند زمان‌اجرای بسته‌بندی‌شده
    Plugin بدون ترمیم وابستگی هنگام راه‌اندازی بارگذاری می‌شود، doctor را اجرا می‌کند
    و یک نوبت عامل محلی را در برابر endpoint شبیه‌سازی‌شده OpenAI اجرا می‌کند.
  - برای اجرای همین مسیر نصب بسته‌بندی‌شده با Discord، از
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` استفاده کنید.
- `pnpm test:docker:session-runtime-context`
  - یک آزمون دود قطعی Docker روی برنامه ساخته‌شده برای رونوشت‌های زمینه زمان‌اجرای
    تعبیه‌شده اجرا می‌کند. تأیید می‌کند زمینه پنهان زمان‌اجرای OpenClaw به‌صورت یک
    پیام سفارشی غیرقابل‌نمایش باقی می‌ماند و به نوبت قابل‌مشاهده کاربر نشت نمی‌کند؛
    سپس یک JSONL مربوط به نشست خراب آسیب‌دیده را درج می‌کند و تأیید می‌کند
    `openclaw doctor --fix` آن را همراه با یک نسخه پشتیبان به شاخه فعال بازنویسی می‌کند.
- `pnpm test:docker:npm-telegram-live`
  - یک بسته نامزد OpenClaw را در Docker نصب می‌کند، راه‌اندازی بسته نصب‌شده را اجرا
    می‌کند، Telegram را از طریق CLI نصب‌شده پیکربندی می‌کند و سپس مسیر زنده QA مربوط
    به Telegram را با همان بسته نصب‌شده به‌عنوان Gateway سامانه تحت آزمون دوباره
    استفاده می‌کند.
  - پوشاننده فقط منبع harness مربوط به `qa-lab` را از checkout mount می‌کند؛ بسته
    نصب‌شده مالک `dist`، `openclaw/plugin-sdk` و زمان‌اجرای Plugin همراه است، بنابراین
    این مسیر Pluginهای checkout فعلی را با بسته تحت آزمون ترکیب نمی‌کند.
  - مقدار پیش‌فرض `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` است؛ برای آزمودن
    یک tarball محلی resolveشده به‌جای نصب از رجیستری، مقدار
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` یا
    `OPENCLAW_CURRENT_PACKAGE_TGZ` را تنظیم کنید.
  - به‌طور پیش‌فرض زمان‌بندی تکرارشونده RTT را با
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` در `qa-evidence.json` منتشر می‌کند. برای
    تنظیم اجرا، `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`،
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` یا
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` را بازنویسی کنید.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` فهرستی جداشده با ویرگول از شناسه‌های بررسی QA
    مربوط به Telegram را برای نمونه‌برداری می‌پذیرد؛ اگر تنظیم نشده باشد، بررسی
    پیش‌فرض دارای قابلیت RTT برابر `telegram-mentioned-message-reply` است.
  - از همان اطلاعات محرمانه محیطی Telegram یا منبع اطلاعات محرمانه Convex مانند
    `pnpm openclaw qa telegram` استفاده می‌کند. برای خودکارسازی CI/انتشار،
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` را همراه با
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک رمز نقش تنظیم کنید. اگر
    `OPENCLAW_QA_CONVEX_SITE_URL` و یک رمز نقش Convex در CI موجود باشند، پوشاننده
    Docker به‌طور خودکار Convex را انتخاب می‌کند.
  - پوشاننده پیش از کار build/install در Docker، متغیرهای محیطی اطلاعات محرمانه
    Telegram یا Convex را روی میزبان اعتبارسنجی می‌کند. فقط هنگام اشکال‌زدایی عمدی
    تنظیمات پیش از اطلاعات محرمانه، `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    را تنظیم کنید.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` فقط برای این مسیر،
    `OPENCLAW_QA_CREDENTIAL_ROLE` مشترک را بازنویسی می‌کند. وقتی اطلاعات محرمانه Convex
    انتخاب شده‌اند و نقشی تنظیم نشده است، پوشاننده در CI از `ci` و خارج از CI از
    `maintainer` استفاده می‌کند.
  - GitHub Actions این مسیر را به‌عنوان گردش‌کار دستی نگه‌دارنده
    `NPM Telegram Beta E2E` ارائه می‌کند. هنگام ادغام اجرا نمی‌شود. این گردش‌کار از
    محیط `qa-live-shared` و اجاره‌های اطلاعات محرمانه CI مربوط به Convex استفاده می‌کند.
- GitHub Actions همچنین `Package Acceptance` را برای اثبات جانبی محصول در برابر یک
  بسته نامزد ارائه می‌کند. این گردش‌کار یک ارجاع Git، مشخصه منتشرشده npm، نشانی tarball
  از نوع HTTPS به‌همراه SHA-256، خط‌مشی نشانی مورداعتماد یا مصنوع tarball از اجرای
  دیگری (`source=ref|npm|url|trusted-url|artifact`) را می‌پذیرد، فایل نرمال‌شده
  `openclaw-current.tgz` را با نام `package-under-test` بارگذاری می‌کند و سپس
  زمان‌بند Docker E2E موجود را با پروفایل‌های مسیر `smoke`، `package`، `product`،
  `full` یا `custom` اجرا می‌کند. برای اجرای گردش‌کار QA مربوط به Telegram در برابر
  همان مصنوع `package-under-test`، مقدار `telegram_mode=mock-openai` یا
  `live-frontier` را تنظیم کنید.
  - تازه‌ترین اثبات محصول بتا:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- اثبات با نشانی دقیق tarball به digest نیاز دارد و از خط‌مشی ایمنی نشانی عمومی استفاده می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- آینه‌های سازمانی/خصوصی tarball از یک خط‌مشی صریح منبع مورداعتماد استفاده می‌کنند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` فایل `.github/package-trusted-sources.json` را از ارجاع مورداعتماد گردش‌کار می‌خواند و اطلاعات محرمانه در نشانی یا دور زدن شبکه خصوصی از طریق ورودی گردش‌کار را نمی‌پذیرد. اگر خط‌مشی نام‌گذاری‌شده احراز هویت bearer را تعریف می‌کند، رمز ثابت `OPENCLAW_TRUSTED_PACKAGE_TOKEN` را پیکربندی کنید.

- اثبات مصنوع، یک مصنوع tarball را از اجرای دیگری در Actions دانلود می‌کند:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - build فعلی OpenClaw را در Docker بسته‌بندی و نصب می‌کند، Gateway را با OpenAI
    پیکربندی‌شده راه‌اندازی می‌کند و سپس کانال‌ها/Pluginهای همراه را از طریق ویرایش‌های
    پیکربندی فعال می‌کند.
  - تأیید می‌کند کشف هنگام تنظیم، Pluginهای دانلودشدنی پیکربندی‌نشده را نصب‌نشده
    باقی می‌گذارد، نخستین ترمیم پیکربندی‌شده doctor هر Plugin دانلودشدنی مفقود را
    به‌صراحت نصب می‌کند و راه‌اندازی مجدد دوم ترمیم پنهان وابستگی را اجرا نمی‌کند.
  - همچنین یک نسخه پایه قدیمی و شناخته‌شده npm را نصب می‌کند، پیش از اجرای
    `openclaw update --tag <candidate>`، Telegram را فعال می‌کند و تأیید می‌کند doctor
    پس از به‌روزرسانی نامزد، بقایای قدیمی وابستگی Plugin را بدون ترمیم postinstall
    در سمت harness پاک می‌کند.
- `pnpm test:parallels:npm-update`
  - آزمون دود بومی به‌روزرسانی نصب بسته‌بندی‌شده را در مهمان‌های Parallels اجرا
    می‌کند. هر پلتفرم انتخاب‌شده ابتدا بسته پایه درخواستی را نصب می‌کند، سپس فرمان
    نصب‌شده `openclaw update` را در همان مهمان اجرا می‌کند و نسخه نصب‌شده، وضعیت
    به‌روزرسانی، آمادگی Gateway و یک نوبت عامل محلی را تأیید می‌کند.
  - هنگام تکرار روی یک مهمان، از `--platform macos`، `--platform windows` یا
    `--platform linux` استفاده کنید. برای مسیر مصنوع خلاصه و وضعیت هر مسیر، از
    `--json` استفاده کنید.
  - مسیر OpenAI به‌طور پیش‌فرض از `openai/gpt-5.6-luna` برای اثبات زنده نوبت عامل
    استفاده می‌کند. برای اعتبارسنجی مدل دیگری از OpenAI، `--model <provider/model>`
    را ارسال کنید یا `OPENCLAW_PARALLELS_OPENAI_MODEL` را تنظیم کنید.
  - اجراهای طولانی محلی را در یک مهلت زمانی میزبان بپیچید تا توقف انتقال Parallels
    نتواند باقی پنجره آزمون را مصرف کند:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - اسکریپت گزارش‌های تودرتوی مسیر را در
    `/tmp/openclaw-parallels-npm-update.*` می‌نویسد. پیش از فرض‌کردن اینکه پوشاننده
    بیرونی گیر کرده است، `windows-update.log`، `macos-update.log` یا
    `linux-update.log` را بررسی کنید.
  - به‌روزرسانی Windows روی یک مهمان سرد ممکن است ۱۰ تا ۱۵ دقیقه صرف doctor پس از
    به‌روزرسانی و کار به‌روزرسانی بسته کند؛ تا زمانی که گزارش اشکال‌زدایی تودرتوی npm
    در حال پیشروی است، این وضعیت همچنان سالم است.
  - این پوشاننده تجمیعی را هم‌زمان با مسیرهای آزمون دود جداگانه Parallels برای macOS،
    Windows یا Linux اجرا نکنید. آن‌ها وضعیت ماشین مجازی مشترکی دارند و ممکن است در
    بازیابی snapshot، ارائه بسته یا وضعیت Gateway مهمان با یکدیگر تداخل کنند.
  - اثبات پس از به‌روزرسانی سطح معمول Pluginهای همراه را اجرا می‌کند، زیرا facadeهای
    قابلیت مانند گفتار، تولید تصویر و درک رسانه از طریق APIهای زمان‌اجرای همراه
    بارگذاری می‌شوند، حتی زمانی که خود نوبت عامل فقط یک پاسخ متنی ساده را بررسی می‌کند.

- `pnpm openclaw qa aimock`
  - فقط سرور ارائه‌دهنده محلی AIMock را برای آزمون دود پروتکل به‌صورت مستقیم راه‌اندازی می‌کند.
- `pnpm openclaw qa matrix`
  - مسیر QA زنده Matrix را در برابر یک سرور خانگی موقت Tuwunel با پشتیبانی Docker اجرا می‌کند. فقط برای وارسی کد منبع است؛ نصب‌های بسته‌بندی‌شده `qa-lab` را ارائه نمی‌کنند.
  - CLI کامل، کاتالوگ پروفایل/سناریو، متغیرهای محیطی و چیدمان مصنوعات:
    [QA ماتریس](/fa/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - مسیر QA زنده Telegram را در برابر یک گروه خصوصی واقعی، با استفاده از توکن‌های ربات راه‌انداز و سامانه تحت آزمون از محیط، اجرا می‌کند.
  - به `OPENCLAW_QA_TELEGRAM_GROUP_ID`،
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` نیاز دارد. شناسه گروه باید شناسه عددی گفت‌وگوی Telegram باشد.
  - از `--credential-source convex` برای اعتبارنامه‌های اشتراکیِ تجمیع‌شده پشتیبانی می‌کند.
    به‌طور پیش‌فرض از حالت محیط استفاده کنید، یا برای انتخاب اجاره‌های تجمیع‌شده
    `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` را تنظیم کنید.
  - مقادیر پیش‌فرض، قناری، محدودسازی بر پایه اشاره، خطاب‌دهی فرمان، `/status`،
    پاسخ‌های اشاره‌شده ربات‌به‌ربات و پاسخ‌های فرمان بومی هسته را پوشش می‌دهند.
    مقادیر پیش‌فرض `mock-openai` همچنین زنجیره پاسخ قطعی و پسرفت‌های
    پخش جریانی پیام نهایی Telegram را پوشش می‌دهند. برای وارسی‌های اختیاری
    مانند `session_status` از `--list-scenarios` استفاده کنید.
  - اگر هر سناریویی شکست بخورد، با کد غیرصفر خارج می‌شود. برای تولید مصنوعات بدون کد خروج ناموفق، از `--allow-failures` استفاده کنید.
  - به دو ربات متمایز در یک گروه خصوصی یکسان نیاز دارد و ربات سامانه تحت آزمون باید نام کاربری Telegram داشته باشد.
  - برای مشاهده پایدار ربات‌به‌ربات، حالت ارتباط ربات‌به‌ربات را در `@BotFather` برای هر دو ربات فعال کنید و مطمئن شوید ربات راه‌انداز می‌تواند ترافیک ربات‌های گروه را مشاهده کند.
  - گزارش QA مربوط به Telegram، خلاصه و `qa-evidence.json` را در
    `.artifacts/qa-e2e/...` می‌نویسد. سناریوهای پاسخ‌دهی، زمان رفت‌وبرگشت از درخواست ارسال راه‌انداز تا پاسخ مشاهده‌شده سامانه تحت آزمون را شامل می‌شوند.

`Mantis Telegram Live` پوشش شواهد درخواست کشش پیرامون این مسیر است. این پوشش،
مرجع نامزد را با اعتبارنامه‌های Telegram اجاره‌شده از Convex اجرا می‌کند، بسته
گزارش/شواهد QA سانسورشده را در مرورگر دسکتاپ Crabbox رندر می‌کند، شواهد MP4
ضبط می‌کند، یک GIF با بخش‌های بی‌حرکت حذف‌شده می‌سازد، بسته مصنوعات را بارگذاری
می‌کند و وقتی `pr_number` تنظیم شده باشد، از طریق برنامه GitHub متعلق به Mantis
شواهد درون‌خطی درخواست کشش را ارسال می‌کند. نگه‌دارندگان می‌توانند آن را از رابط
Actions و از طریق `Mantis Scenario` (`scenario_id: telegram-live`) یا مستقیماً
از یک دیدگاه درخواست کشش آغاز کنند:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` پوشش عاملیِ بومی Telegram Desktop برای شواهد
دیداری پیش/پس از درخواست کشش است. آن را از رابط Actions با `instructions`
آزاد، از طریق `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) یا از یک دیدگاه درخواست کشش آغاز کنید:

```text
@openclaw-mantis telegram desktop proof
```

عامل Mantis درخواست کشش را می‌خواند، تصمیم می‌گیرد چه رفتاری که در Telegram
قابل مشاهده است تغییر را اثبات می‌کند، مسیر اثبات واقعی کاربرِ Telegram Desktop
در Crabbox را روی مراجع خط مبنا و نامزد اجرا می‌کند، تا زمانی که GIFهای بومی
کاربردی شوند تکرار می‌کند، یک مانیفست جفت‌شده `motionPreview` می‌نویسد و وقتی
`pr_number` تنظیم شده باشد، همان جدول دو ستونه GIF را از طریق برنامه GitHub
متعلق به Mantis ارسال می‌کند.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - یک دسکتاپ Linux در Crabbox را اجاره می‌کند یا دوباره به کار می‌گیرد، Telegram
    Desktop بومی را نصب می‌کند، OpenClaw را با توکن اجاره‌شده ربات سامانه تحت آزمون
    Telegram پیکربندی می‌کند، Gateway را راه‌اندازی می‌کند و از دسکتاپ قابل مشاهده
    VNC شواهد تصویر صفحه/MP4 ضبط می‌کند.
  - مقدار پیش‌فرض `--credential-source convex` است تا گردش‌کارها فقط به راز
    کارگزار Convex نیاز داشته باشند. از `--credential-source env` با همان متغیرهای
    `OPENCLAW_QA_TELEGRAM_*` مربوط به `pnpm openclaw qa telegram` استفاده کنید.
  - Telegram Desktop همچنان به ورود/پروفایل کاربر نیاز دارد. توکن ربات فقط
    OpenClaw را پیکربندی می‌کند. برای بایگانی پروفایل `.tgz` با رمزگذاری base64
    از `--telegram-profile-archive-env <name>` استفاده کنید، یا `--keep-lease`
    را به کار ببرید و یک بار به‌صورت دستی از طریق VNC وارد شوید.
  - `mantis-telegram-desktop-builder-report.md`،
    `mantis-telegram-desktop-builder-summary.json`،
    `telegram-desktop-builder.png` و `telegram-desktop-builder.mp4`
    را در پوشه خروجی می‌نویسد.

مسیرهای انتقال زنده یک قرارداد استاندارد مشترک دارند تا انتقال‌های جدید دچار
واگرایی نشوند؛ ماتریس پوشش هر مسیر در
[نمای کلی QA - پوشش انتقال زنده](/fa/concepts/qa-e2e-automation#live-transport-coverage)
قرار دارد. `qa-channel` مجموعه مصنوعی گسترده است و بخشی از آن ماتریس نیست.

### اعتبارنامه‌های مشترک Telegram از طریق Convex (نسخه ۱)

وقتی `--credential-source convex` (یا `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
برای QA انتقال زنده فعال باشد، آزمایشگاه QA یک اجاره انحصاری از یک مخزن مبتنی
بر Convex دریافت می‌کند، تا زمانی که مسیر در حال اجرا است برای آن اجاره
Heartbeat می‌فرستد و هنگام خاموش‌شدن اجاره را آزاد می‌کند. نام این بخش به پیش
از پشتیبانی Discord، Slack و WhatsApp بازمی‌گردد؛ قرارداد اجاره میان انواع
مختلف مشترک است.

داربست مرجع پروژه Convex: `qa/convex-credential-broker/`

متغیرهای محیطی الزامی:

- `OPENCLAW_QA_CONVEX_SITE_URL` (برای نمونه `https://your-deployment.convex.site`)
- یک راز برای نقش انتخاب‌شده:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` برای `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` برای `ci`
- انتخاب نقش اعتبارنامه:
  - CLI: `--credential-role maintainer|ci`
  - پیش‌فرض محیط: `OPENCLAW_QA_CREDENTIAL_ROLE` (در CI به‌طور پیش‌فرض `ci` و در غیر این صورت `maintainer`)

متغیرهای محیطی اختیاری:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (پیش‌فرض `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (پیش‌فرض `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (پیش‌فرض `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (پیش‌فرض `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (پیش‌فرض `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (شناسه ردیابی اختیاری)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` به URLهای Convex با local loopback از نوع `http://` برای توسعه صرفاً محلی اجازه می‌دهد.

در عملکرد عادی، `OPENCLAW_QA_CONVEX_SITE_URL` باید از `https://` استفاده کند.

فرمان‌های مدیریتی نگه‌دارنده (افزودن/حذف/فهرست مخزن) مشخصاً به
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` نیاز دارند.

ابزارهای کمکی CLI برای نگه‌دارندگان:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

پیش از اجرای زنده، از `doctor` برای بررسی URL سایت Convex، رازهای کارگزار،
پیشوند نقطه پایانی، مهلت HTTP و دسترس‌پذیری مدیریت/فهرست، بدون چاپ مقادیر
محرمانه، استفاده کنید. برای خروجی قابل خواندن توسط ماشین در اسکریپت‌ها و
ابزارهای CI از `--json` استفاده کنید.

قرارداد پیش‌فرض نقطه پایانی (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
درخواست‌ها با سرآیند `Authorization: Bearer <role secret>` احراز هویت می‌شوند؛
بدنه‌های زیر آن سرآیند را حذف کرده‌اند:

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
- `POST /admin/add` (فقط راز نگه‌دارنده)
  - درخواست: `{ kind, actorId, payload, note?, status? }`
  - موفقیت: `{ status: "ok", credential }`
- `POST /admin/remove` (فقط راز نگه‌دارنده)
  - درخواست: `{ credentialId, actorId }`
  - موفقیت: `{ status: "ok", changed, credential }`
  - محافظ اجاره فعال: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (فقط راز نگه‌دارنده)
  - درخواست: `{ kind?, status?, includePayload?, limit? }`
  - موفقیت: `{ status: "ok", credentials, count }`

ساختار بار داده برای نوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` باید رشته شناسه عددی گفت‌وگوی Telegram باشد.
- `admin/add` این ساختار را برای `kind: "telegram"` اعتبارسنجی می‌کند و بارهای داده بدشکل را رد می‌کند.

ساختار بار داده برای نوع کاربر واقعی Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`، `testerUserId` و `telegramApiId` باید رشته‌های عددی باشند.
- `tdlibArchiveSha256` و `desktopTdataArchiveSha256` باید رشته‌های شانزده‌شانزدهی SHA-256 باشند.
- `kind: "telegram-user"` برای گردش‌کار اثبات Telegram Desktop متعلق به Mantis رزرو شده است. مسیرهای عمومی آزمایشگاه QA نباید آن را دریافت کنند.

بارهای داده چندکاناله اعتبارسنجی‌شده توسط کارگزار:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

مسیرهای Slack نیز می‌توانند از مخزن اجاره کنند، اما اعتبارسنجی بار داده Slack
در حال حاضر به‌جای کارگزار در اجراکننده QA مربوط به Slack قرار دارد. برای
ردیف‌های Slack از
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
استفاده کنید.

### افزودن کانال به QA

معماری و نام‌های ابزار کمکی سناریو برای سازگارکننده‌های کانال جدید در
[نمای کلی QA - افزودن کانال](/fa/concepts/qa-e2e-automation#adding-a-channel)
قرار دارند. حداقل الزامات: اجراکننده انتقال را روی درز میزبان مشترک `qa-lab`
پیاده‌سازی کنید، یک `adapterFactory` برای سناریوهای مشترک اضافه کنید، `qaRunners`
را در مانیفست Plugin اعلام کنید، آن را به‌شکل `openclaw qa <runner>` سوار کنید
و سناریوها را زیر `qa/scenarios/` بنویسید.

## مجموعه‌های آزمون (چه چیزی کجا اجرا می‌شود)

مجموعه‌ها را به‌صورت «واقع‌گرایی فزاینده» (و ناپایداری/هزینه فزاینده) در نظر بگیرید.

### واحد / یکپارچه‌سازی (پیش‌فرض)

- فرمان: `pnpm test`
- پیکربندی: اجراهای بدون هدف از مجموعه قطعه‌های `vitest.full-*.config.ts` استفاده می‌کنند و ممکن است برای زمان‌بندی موازی، قطعه‌های چندپروژه‌ای را به پیکربندی‌های جداگانه هر پروژه گسترش دهند
- فایل‌ها: فهرست‌های هسته/واحد زیر `src/**/*.test.ts`،
  `packages/**/*.test.ts` و `test/**/*.test.ts`؛ آزمون‌های واحد رابط کاربری در
  قطعه اختصاصی `unit-ui` اجرا می‌شوند
- دامنه:
  - آزمون‌های واحد خالص
  - آزمون‌های یکپارچه‌سازی درون‌فرایندی (احراز هویت Gateway، مسیریابی، ابزارها، تجزیه، پیکربندی)
  - آزمون‌های پسرفت قطعی برای اشکالات شناخته‌شده
- انتظارات:
  - در CI اجرا می‌شود
  - به کلید واقعی نیاز ندارد
  - باید سریع و پایدار باشد
  - آزمون‌های حل‌کننده و بارگذار سطح عمومی باید رفتار گسترده جایگزینی
    `api.js` و `runtime-api.js` را با فیکسچرهای کوچک تولیدشده برای Plugin اثبات
    کنند، نه APIهای واقعی کد منبع Pluginهای همراه. بارگذاری API واقعی Plugin
    به مجموعه‌های قرارداد/یکپارچه‌سازی تحت مالکیت Plugin تعلق دارد.

سیاست وابستگی بومی:

- نصب‌های آزمون پیش‌فرض، ساخت‌های اختیاری بومی opus متعلق به Discord را رد
  می‌کنند. صدای Discord از `libopus-wasm` همراه استفاده می‌کند و
  `@discordjs/opus` در `allowBuilds` غیرفعال می‌ماند تا آزمون‌های محلی و
  مسیرهای Testbox افزونه بومی را کامپایل نکنند.
- کارایی opus بومی را در مخزن سنجه `libopus-wasm` مقایسه کنید، نه در چرخه‌های
  پیش‌فرض نصب/آزمون OpenClaw. در `allowBuilds` پیش‌فرض، `@discordjs/opus` را
  روی `true` تنظیم نکنید؛ این کار باعث می‌شود چرخه‌های نامرتبط نصب/آزمون کد
  بومی را کامپایل کنند.

<AccordionGroup>
  <Accordion title="پروژه‌ها، قطعه‌ها و مسیرهای محدود">

    - اجرای بدون هدف مشخصِ `pnpm test` به‌جای یک فرایند عظیم بومیِ پروژهٔ ریشه، سیزده پیکربندی شارد کوچک‌تر (`core-unit-fast`، `core-unit-src`، `core-unit-security`، `core-unit-ui`، `core-unit-support`، `core-support-boundary`، `core-tooling`، `core-contracts`، `core-bundled`، `core-runtime`، `agentic`، `auto-reply`، `extensions`) را اجرا می‌کند. این کار اوج RSS را روی ماشین‌های پربار کاهش می‌دهد و مانع از آن می‌شود که کارهای پاسخ خودکار/Plugin، مجموعه‌آزمون‌های نامرتبط را از منابع محروم کنند.
    - `pnpm test --watch` همچنان از گراف پروژهٔ بومیِ ریشه در `vitest.config.ts` استفاده می‌کند، زیرا حلقهٔ پایش چندشارده عملی نیست.
    - `pnpm test`، `pnpm test:watch` و `pnpm test:perf:imports` ابتدا هدف‌های صریح فایل/دایرکتوری را از مسیر لاین‌های محدودشده هدایت می‌کنند؛ بنابراین `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` هزینهٔ کامل راه‌اندازی پروژهٔ ریشه را متحمل نمی‌شود.
    - `pnpm test:changed` به‌طور پیش‌فرض مسیرهای تغییریافتهٔ git را به لاین‌های محدودشده و کم‌هزینه گسترش می‌دهد: ویرایش مستقیم آزمون‌ها، فایل‌های هم‌جوار `*.test.ts`، نگاشت‌های صریح منبع و وابسته‌های محلیِ گراف import. ویرایش‌های پیکربندی/راه‌اندازی/بسته باعث اجرای گستردهٔ آزمون‌ها نمی‌شوند، مگر اینکه صراحتاً از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید.
    - `pnpm check:changed` دروازهٔ معمول و هوشمند بررسی محلی برای کارهای محدود است. این فرمان تفاوت‌ها را به هسته، آزمون‌های هسته، افزونه‌ها، آزمون‌های افزونه، برنامه‌ها، مستندات، فرادادهٔ انتشار، ابزارهای زندهٔ Docker و ابزارها دسته‌بندی می‌کند و سپس فرمان‌های بررسی نوع، lint و محافظ متناظر را اجرا می‌کند. این فرمان آزمون‌های Vitest را اجرا نمی‌کند؛ برای اثبات آزمون، `pnpm test:changed` یا `pnpm test <target>` صریح را فراخوانی کنید. افزایش نسخه‌هایی که فقط فرادادهٔ انتشار را تغییر می‌دهند، بررسی‌های هدفمند نسخه/پیکربندی/وابستگی‌های ریشه را اجرا می‌کنند و محافظی دارند که تغییرات بسته خارج از فیلد نسخهٔ سطح بالا را رد می‌کند.
    - ویرایش‌های هارنس زندهٔ Docker ACP بررسی‌های متمرکزی را اجرا می‌کنند: نحو پوسته برای اسکریپت‌های احراز هویت زندهٔ Docker و یک اجرای آزمایشی زمان‌بند زندهٔ Docker. تغییرات `package.json` فقط زمانی لحاظ می‌شوند که تفاوت به `scripts["test:docker:live-*"]` محدود باشد؛ ویرایش وابستگی، export، نسخه و دیگر سطوح بسته همچنان از محافظ‌های گسترده‌تر استفاده می‌کنند.
    - آزمون‌های واحد سبک از نظر import در عامل‌ها، فرمان‌ها، Pluginها، کمک‌کننده‌های پاسخ خودکار، `plugin-sdk` و حوزه‌های مشابهِ ابزارهای خالص، از لاین `unit-fast` عبور می‌کنند که `test/setup-openclaw-runtime.ts` را نادیده می‌گیرد؛ فایل‌های حالت‌مند/سنگین از نظر runtime در لاین‌های موجود باقی می‌مانند.
    - برخی فایل‌های منبعِ کمک‌کننده در `plugin-sdk` و `commands` نیز اجراهای حالت تغییر را به آزمون‌های هم‌جوار صریح در همان لاین‌های سبک نگاشت می‌کنند؛ بنابراین ویرایش کمک‌کننده‌ها باعث اجرای دوبارهٔ کل مجموعهٔ سنگین آن دایرکتوری نمی‌شود.
    - `auto-reply` باکت‌های اختصاصی برای کمک‌کننده‌های سطح بالای هسته، آزمون‌های یکپارچه‌سازی سطح بالای `reply.*` و زیر‌درخت `src/auto-reply/reply/**` دارد. CI همچنین زیر‌درخت پاسخ را به شاردهای اجراکنندهٔ عامل، توزیع و فرمان‌ها/مسیریابی حالت تقسیم می‌کند تا یک باکت سنگین از نظر import تمام دنبالهٔ Node را در اختیار نگیرد.
    - CI معمول PR/main عمداً پیمایش دسته‌ای Pluginهای همراه و شارد مخصوص انتشار `agentic-plugins` را نادیده می‌گیرد. اعتبارسنجی کامل انتشار، گردش‌کار فرزند جداگانهٔ `Plugin Prerelease` را برای آن مجموعه‌های سنگین از نظر Plugin روی نامزدهای انتشار اجرا می‌کند.

  </Accordion>

  <Accordion title="پوشش اجراکنندهٔ تعبیه‌شده">

    - هنگام تغییر ورودی‌های کشف ابزار پیام یا زمینهٔ runtime مربوط به Compaction،
      هر دو سطح پوشش را حفظ کنید.
    - برای مرزهای خالص مسیریابی و نرمال‌سازی، آزمون‌های رگرسیون متمرکزِ
      کمک‌کننده اضافه کنید.
    - سلامت مجموعه‌آزمون‌های یکپارچه‌سازی اجراکنندهٔ تعبیه‌شده را حفظ کنید:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`،
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` و
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - این مجموعه‌ها تأیید می‌کنند که شناسه‌های محدودشده و رفتار Compaction همچنان
      از مسیرهای واقعی `run.ts` / `compact.ts` عبور می‌کنند؛ آزمون‌های صرفاً
      کمک‌کننده جایگزین کافی برای آن مسیرهای یکپارچه‌سازی نیستند.

  </Accordion>

  <Accordion title="پیش‌فرض‌های مخزن پردازشی و جداسازی Vitest">

    - پیکربندی پایهٔ Vitest به‌طور پیش‌فرض از `threads` استفاده می‌کند.
    - پیکربندی مشترک Vitest مقدار `isolate: false` را تثبیت می‌کند و در پروژه‌های
      ریشه، پیکربندی‌های e2e و پیکربندی‌های زنده از اجراکنندهٔ غیرایزوله استفاده می‌کند.
    - لاین UI ریشه، راه‌اندازی `jsdom` و بهینه‌ساز خود را حفظ می‌کند، اما آن نیز
      روی اجراکنندهٔ غیرایزولهٔ مشترک اجرا می‌شود.
    - هر شارد `pnpm test` همان پیش‌فرض‌های `threads` + `isolate: false` را
      از پیکربندی مشترک Vitest به ارث می‌برد.
    - `scripts/run-vitest.mjs` به‌طور پیش‌فرض `--no-maglev` را برای فرایندهای فرزند
      Node در Vitest اضافه می‌کند تا نوسان کامپایل V8 هنگام اجراهای محلی بزرگ کاهش یابد.
      برای مقایسه با رفتار استاندارد V8، مقدار `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      را تنظیم کنید.
    - `scripts/run-vitest.mjs` اجراهای صریح و غیرپایشی Vitest را پس از ۵ دقیقه
      بدون خروجی stdout یا stderr خاتمه می‌دهد. برای غیرفعال‌کردن نگهبان در یک
      بررسی عمداً بی‌صدا، `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` را تنظیم کنید.

  </Accordion>

  <Accordion title="تکرار سریع محلی">

    - `pnpm changed:lanes` نشان می‌دهد یک تفاوت کدام لاین‌های معماری را فعال می‌کند.
    - هوک پیش از commit فقط قالب‌بندی را انجام می‌دهد. فایل‌های قالب‌بندی‌شده را
      دوباره stage می‌کند و lint، بررسی نوع یا آزمون‌ها را اجرا نمی‌کند.
    - هنگامی که به دروازهٔ هوشمند بررسی محلی نیاز دارید، پیش از تحویل یا push،
      `pnpm check:changed` را صراحتاً اجرا کنید.
    - `pnpm test:changed` به‌طور پیش‌فرض از لاین‌های محدودشده و کم‌هزینه عبور می‌کند.
      فقط زمانی از `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` استفاده کنید
      که عامل تشخیص دهد ویرایش هارنس، پیکربندی، بسته یا قرارداد واقعاً به پوشش
      گسترده‌تر Vitest نیاز دارد.
    - `pnpm test:max` و `pnpm test:changed:max` همان رفتار مسیریابی را حفظ می‌کنند،
      اما سقف worker بالاتری دارند.
    - مقیاس‌دهی خودکار worker محلی عمداً محافظه‌کارانه است و وقتی میانگین بار میزبان
      از قبل بالا باشد عقب‌نشینی می‌کند؛ بنابراین چند اجرای هم‌زمان Vitest به‌طور
      پیش‌فرض آسیب کمتری وارد می‌کنند.
    - پیکربندی پایهٔ Vitest، فایل‌های پروژه/پیکربندی را به‌عنوان
      `forceRerunTriggers` علامت‌گذاری می‌کند تا اجرای مجدد در حالت تغییر هنگام
      تغییر سیم‌کشی آزمون‌ها صحیح باقی بماند.
    - پیکربندی، `OPENCLAW_VITEST_FS_MODULE_CACHE` را روی میزبان‌های پشتیبانی‌شده
      فعال نگه می‌دارد؛ برای تعیین یک محل صریح کش جهت پروفایل‌گیری مستقیم،
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` را تنظیم کنید.

  </Accordion>

  <Accordion title="اشکال‌زدایی کارایی">

    - `pnpm test:perf:imports` گزارش مدت‌زمان import در Vitest و خروجی تفکیک‌شدهٔ
      importها را فعال می‌کند.
    - `pnpm test:perf:imports:changed` همان نمای پروفایل‌گیری را به فایل‌های
      تغییریافته از زمان `origin/main` محدود می‌کند.
    - داده‌های زمان‌بندی شارد در `.artifacts/vitest-shard-timings.json` نوشته می‌شوند.
      اجراهای کل پیکربندی از مسیر پیکربندی به‌عنوان کلید استفاده می‌کنند؛ شاردهای CI
      مبتنی بر الگوی شامل، نام شارد را اضافه می‌کنند تا شاردهای فیلترشده جداگانه
      قابل ردیابی باشند.
    - وقتی یک آزمون داغ همچنان بیشتر زمان خود را صرف importهای راه‌اندازی می‌کند،
      وابستگی‌های سنگین را پشت یک مرز محلی و محدود `*.runtime.ts` نگه دارید و
      به‌جای import عمیق کمک‌کننده‌های runtime فقط برای عبور دادن آن‌ها از
      `vi.mock(...)`، همان مرز را مستقیماً mock کنید.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` مسیر هدایت‌شدهٔ
      `test:changed` را برای آن تفاوت commit‌شده با مسیر بومی پروژهٔ ریشه مقایسه
      می‌کند و زمان سپری‌شده و حداکثر RSS در macOS را نمایش می‌دهد.
    - `pnpm test:perf:changed:bench -- --worktree` درخت کثیف فعلی را با هدایت
      فهرست فایل‌های تغییریافته از طریق `scripts/test-projects.mjs` و پیکربندی
      ریشهٔ Vitest بنچمارک می‌کند.
    - `pnpm test:perf:profile:main` یک پروفایل CPU از رشتهٔ اصلی برای سربار
      راه‌اندازی و تبدیل Vitest/Vite می‌نویسد.
    - `pnpm test:perf:profile:runner` با غیرفعال‌بودن هم‌زمانی فایل‌ها،
      پروفایل‌های CPU+heap اجراکننده را برای مجموعهٔ واحد می‌نویسد.

  </Accordion>
</AccordionGroup>

### پایداری (Gateway)

- فرمان: `pnpm test:stability:gateway`
- پیکربندی: `test/vitest/vitest.gateway.config.ts`، `test/vitest/vitest.logging.config.ts` و `test/vitest/vitest.infra.config.ts` که هرکدام به یک worker محدود شده‌اند
- دامنه:
  - یک Gateway واقعی روی local loopback راه‌اندازی می‌کند که قابلیت‌های تشخیصی آن به‌طور پیش‌فرض فعال است
  - نوسان مصنوعی پیام Gateway، حافظه و محموله‌های بزرگ را از مسیر رویداد تشخیصی عبور می‌دهد
  - `diagnostics.stability` را از طریق RPC مبتنی بر WS در Gateway پرس‌وجو می‌کند
  - کمک‌کننده‌های ماندگارسازی بستهٔ پایداری تشخیصی را پوشش می‌دهد
  - بررسی می‌کند که ضبط‌کننده محدود باقی بماند، نمونه‌های مصنوعی RSS زیر بودجهٔ فشار بمانند و عمق صف هر نشست دوباره به صفر تخلیه شود
- انتظارات:
  - برای CI ایمن است و به کلید نیاز ندارد
  - لاینی محدود برای پیگیری رگرسیون پایداری است، نه جایگزینی برای مجموعهٔ کامل Gateway

### E2E (تجمیع مخزن)

- فرمان: `pnpm test:e2e`
- دامنه:
  - لاین E2E آزمون دود Gateway را اجرا می‌کند
  - لاین E2E مرورگر mock‌شدهٔ رابط کنترل را اجرا می‌کند
- انتظارات:
  - برای CI ایمن است و به کلید نیاز ندارد
  - نیازمند نصب Playwright Chromium است

### E2E (آزمون دود Gateway)

- فرمان: `pnpm test:e2e:gateway`
- پیکربندی: `test/vitest/vitest.e2e.config.ts`
- فایل‌ها: `src/**/*.e2e.test.ts`، `test/**/*.e2e.test.ts` و آزمون‌های E2E مربوط به Pluginهای همراه در `extensions/`
- پیش‌فرض‌های runtime:
  - از `threads` در Vitest همراه با `isolate: false` استفاده می‌کند که با باقی مخزن مطابقت دارد.
  - از workerهای تطبیقی استفاده می‌کند (CI: حداکثر ۲، محلی: به‌طور پیش‌فرض ۱).
  - برای کاهش سربار ورودی/خروجی کنسول، به‌طور پیش‌فرض در حالت بی‌صدا اجرا می‌شود.
- جایگزین‌های مفید:
  - `OPENCLAW_E2E_WORKERS=<n>` برای تحمیل تعداد workerها (با سقف ۱۶).
  - `OPENCLAW_E2E_VERBOSE=1` برای فعال‌کردن دوبارهٔ خروجی تفصیلی کنسول.
- دامنه:
  - رفتار سرتاسری چندنمونه‌ای Gateway
  - سطوح WebSocket/HTTP، جفت‌سازی Node و شبکه‌سازی سنگین‌تر
- انتظارات:
  - در CI اجرا می‌شود (هنگامی که در خط لوله فعال باشد)
  - به کلید واقعی نیاز ندارد
  - اجزای متحرک بیشتری نسبت به آزمون‌های واحد دارد (ممکن است کندتر باشد)

### E2E (مرورگر mock‌شدهٔ رابط کنترل)

- فرمان: `pnpm test:ui:e2e`
- پیکربندی: `test/vitest/vitest.ui-e2e.config.ts`
- فایل‌ها: `ui/src/**/*.e2e.test.ts`
- دامنه:
  - رابط کنترل Vite را راه‌اندازی می‌کند
  - یک صفحهٔ واقعی Chromium را از طریق Playwright هدایت می‌کند
  - WebSocket مربوط به Gateway را با mockهای قطعی درون‌مرورگری جایگزین می‌کند
- انتظارات:
  - در CI به‌عنوان بخشی از `pnpm test:e2e` اجرا می‌شود
  - به Gateway واقعی، عامل‌ها یا کلیدهای ارائه‌دهنده نیاز ندارد
  - وابستگی مرورگر باید موجود باشد (`pnpm --dir ui exec playwright install chromium`)

### E2E: آزمون دود backend در OpenShell

- فرمان: `pnpm test:e2e:openshell`
- فایل: `extensions/openshell/src/backend.e2e.test.ts`
- دامنه:
  - از یک Gateway محلی و فعال OpenShell دوباره استفاده می‌کند
  - از یک Dockerfile محلی موقت، sandbox می‌سازد
  - backend مربوط به OpenShell در OpenClaw را از طریق `sandbox ssh-config` واقعی + اجرای SSH آزمایش می‌کند
  - رفتار سیستم فایل مرجعِ راه‌دور را از طریق پل fs در sandbox تأیید می‌کند
- انتظارات:
  - فقط به‌صورت اختیاری فعال می‌شود؛ بخشی از اجرای پیش‌فرض `pnpm test:e2e` نیست
  - نیازمند CLI محلی `openshell` و daemon فعال Docker است
  - نیازمند یک Gateway محلی و فعال OpenShell و منبع پیکربندی آن است
  - از `HOME` / `XDG_CONFIG_HOME` ایزوله استفاده می‌کند و سپس sandbox آزمون را نابود می‌کند
- جایگزین‌های مفید:
  - `OPENCLAW_E2E_OPENSHELL=1` برای فعال‌کردن آزمون هنگام اجرای دستی مجموعهٔ گسترده‌تر e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` برای اشاره به باینری CLI یا اسکریپت wrapper غیراستاندارد
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` برای در دسترس قرار دادن پیکربندی Gateway ثبت‌شده برای آزمون ایزوله
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` برای بازنویسی IP مربوط به Gateway در Docker که توسط fixture سیاست میزبان استفاده می‌شود

### زنده (ارائه‌دهندگان واقعی + مدل‌های واقعی)

- فرمان: `pnpm test:live`
- پیکربندی: `test/vitest/vitest.live.config.ts`
- فایل‌ها: `src/**/*.live.test.ts`،‏ `test/**/*.live.test.ts` و آزمون‌های زندهٔ Pluginهای همراه در `extensions/`
- پیش‌فرض: با `pnpm test:live` **فعال** است (`OPENCLAW_LIVE_TEST=1` را تنظیم می‌کند)
- دامنه:
  - «آیا این ارائه‌دهنده/مدل واقعاً _امروز_ با اطلاعات ورود واقعی کار می‌کند؟»
  - تشخیص تغییرات قالب ارائه‌دهنده، ویژگی‌های خاص فراخوانی ابزار، مشکلات احراز هویت و رفتار محدودیت نرخ
- انتظارات:
  - بنا بر طراحی، در CI پایدار نیست (شبکه‌های واقعی، سیاست‌های واقعی ارائه‌دهنده، سهمیه‌ها و قطعی‌ها)
  - هزینه دارد / از محدودیت نرخ استفاده می‌کند
  - اجرای زیرمجموعه‌های محدودشده را به‌جای «همه‌چیز» ترجیح دهید
- اجراهای زنده از کلیدهای API ازپیش‌صادرشده و پروفایل‌های احراز هویت آماده‌شده استفاده می‌کنند.
- اجراهای زنده به‌طور پیش‌فرض همچنان `HOME` را ایزوله می‌کنند و محتوای پیکربندی/احراز هویت را در یک پوشهٔ خانگی موقت آزمون کپی می‌کنند تا فیکسچرهای آزمون واحد نتوانند `~/.openclaw` واقعی شما را تغییر دهند.
- فقط زمانی `OPENCLAW_LIVE_USE_REAL_HOME=1` را تنظیم کنید که عمداً لازم است آزمون‌های زنده از پوشهٔ خانگی واقعی شما استفاده کنند.
- `pnpm test:live` به‌طور پیش‌فرض از حالت کم‌صداتری استفاده می‌کند: خروجی پیشرفت `[live] ...` را نگه می‌دارد و گزارش‌های راه‌اندازی Gateway/پیام‌های Bonjour را بی‌صدا می‌کند. اگر می‌خواهید گزارش‌های کامل راه‌اندازی دوباره نمایش داده شوند، `OPENCLAW_LIVE_TEST_QUIET=0` را تنظیم کنید.
- چرخش کلید API (مختص ارائه‌دهنده):‏ `*_API_KEYS` را با قالب جداشده با ویرگول/نقطه‌ویرگول یا `*_API_KEY_1`،‏ `*_API_KEY_2` تنظیم کنید (برای نمونه `OPENAI_API_KEYS`،‏ `ANTHROPIC_API_KEYS`،‏ `GEMINI_API_KEYS`) یا برای هر اجرای زنده از جایگزین `OPENCLAW_LIVE_*_KEY` استفاده کنید؛ آزمون‌ها در پاسخ‌های محدودیت نرخ دوباره تلاش می‌کنند.
- خروجی پیشرفت/Heartbeat:
  - مجموعه‌آزمون‌های زنده خطوط پیشرفت را در stderr منتشر می‌کنند تا فراخوانی‌های طولانی ارائه‌دهنده، حتی زمانی که ضبط کنسول Vitest بی‌صدا است، به‌وضوح فعال دیده شوند.
  - `test/vitest/vitest.live.config.ts` رهگیری کنسول Vitest را غیرفعال می‌کند تا خطوط پیشرفت ارائه‌دهنده/Gateway هنگام اجراهای زنده فوراً پخش شوند.
  - Heartbeatهای مدل مستقیم را با `OPENCLAW_LIVE_HEARTBEAT_MS` تنظیم کنید.
  - Heartbeatهای Gateway/کاوش را با `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` تنظیم کنید.

## کدام مجموعه‌آزمون را باید اجرا کنم؟

از این جدول تصمیم‌گیری استفاده کنید:

- ویرایش منطق/آزمون‌ها:‏ `pnpm test` را اجرا کنید (و اگر تغییرات زیادی داده‌اید، `pnpm test:coverage` را نیز اجرا کنید)
- دست‌کاری شبکهٔ Gateway / پروتکل WS / جفت‌سازی:‏ `pnpm test:e2e` را نیز اضافه کنید
- اشکال‌زدایی «ربات من از کار افتاده است» / خرابی‌های مختص ارائه‌دهنده / فراخوانی ابزار: یک `pnpm test:live` محدودشده اجرا کنید

## آزمون‌های زنده (دارای ارتباط شبکه‌ای)

برای ماتریس مدل زنده، بررسی‌های سریع بک‌اند CLI، بررسی‌های سریع ACP، چارچوب
app-server مربوط به Codex و همهٔ آزمون‌های زندهٔ ارائه‌دهندگان رسانه (Deepgram، BytePlus، ComfyUI،
تصویر، موسیقی، ویدئو، چارچوب رسانه) — به‌علاوهٔ مدیریت اطلاعات ورود برای اجراهای زنده

- به [آزمون مجموعه‌های زنده](/fa/help/testing-live) مراجعه کنید. برای چک‌لیست اختصاصی اعتبارسنجی به‌روزرسانی و
  Plugin، به
  [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.

## اجراکننده‌های Docker (بررسی‌های اختیاری «آیا در Linux کار می‌کند؟»)

این اجراکننده‌های Docker به دو دسته تقسیم می‌شوند:

- اجراکننده‌های مدل زنده:‏ `test:docker:live-models` و `test:docker:live-gateway` فقط فایل زندهٔ متناظر با کلید پروفایل خود را درون تصویر Docker مخزن اجرا می‌کنند (`src/agents/models.profiles.live.test.ts` و `src/gateway/gateway-models.profiles.live.test.ts`) و پوشهٔ پیکربندی محلی، فضای کاری و فایل محیطی اختیاری پروفایل شما را متصل می‌کنند. نقاط ورود محلی متناظر `test:live:models-profiles` و `test:live:gateway-profiles` هستند.
- اجراکننده‌های زندهٔ Docker در صورت نیاز محدودیت‌های عملی خود را حفظ می‌کنند:
  `test:docker:live-models` به‌طور پیش‌فرض از مجموعهٔ گزینش‌شده، پشتیبانی‌شده و با سیگنال بالا استفاده می‌کند و
  `test:docker:live-gateway` به‌طور پیش‌فرض از `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` استفاده می‌کند. هنگامی که صراحتاً محدودیت کوچک‌تر یا پیمایش گسترده‌تری می‌خواهید، `OPENCLAW_LIVE_MAX_MODELS`
  یا متغیرهای محیطی Gateway را تنظیم کنید.
- `test:docker:all` تصویر زندهٔ Docker را یک‌بار از طریق `test:docker:live-build` می‌سازد، OpenClaw را یک‌بار از طریق `scripts/package-openclaw-for-docker.mjs` به‌صورت آرشیو npm بسته‌بندی می‌کند و سپس دو تصویر `scripts/e2e/Dockerfile` را می‌سازد/دوباره استفاده می‌کند. تصویر پایه فقط اجراکنندهٔ Node/Git برای مسیرهای نصب/به‌روزرسانی/وابستگی Plugin است؛ این مسیرها آرشیو ازپیش‌ساخته‌شده را متصل می‌کنند. تصویر کاربردی همان آرشیو را برای مسیرهای کارکرد برنامهٔ ساخته‌شده در `/app` نصب می‌کند. تعریف مسیرهای Docker در `scripts/lib/docker-e2e-scenarios.mjs` قرار دارد؛ منطق برنامه‌ریز در `scripts/lib/docker-e2e-plan.mjs` قرار دارد؛ `scripts/test-docker-all.mjs` طرح انتخاب‌شده را اجرا می‌کند. اجرای تجمیعی از زمان‌بند محلی وزن‌دار استفاده می‌کند: `OPENCLAW_DOCKER_ALL_PARALLELISM` جایگاه‌های پردازش را کنترل می‌کند، درحالی‌که محدودیت‌های منابع مانع می‌شوند مسیرهای سنگین زنده، نصب npm و چندسرویسی همگی هم‌زمان شروع شوند. اگر یک مسیر منفرد از محدودیت‌های فعال سنگین‌تر باشد، زمان‌بند همچنان می‌تواند وقتی مخزن خالی است آن را آغاز کند و سپس تا زمانی که ظرفیت دوباره در دسترس شود، آن را به‌تنهایی در حال اجرا نگه می‌دارد. مقادیر پیش‌فرض ۱۰ جایگاه، `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`،‏ `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` و `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` هستند؛ فقط زمانی `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` یا `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (و دیگر جایگزین‌های `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) را تنظیم کنید که میزبان Docker ظرفیت آزاد بیشتری داشته باشد. اجراکننده به‌طور پیش‌فرض پیش‌بررسی Docker را انجام می‌دهد، کانتینرهای قدیمی E2E مربوط به OpenClaw را حذف می‌کند، هر ۳۰ ثانیه وضعیت را چاپ می‌کند، زمان‌بندی مسیرهای موفق را در `.artifacts/docker-tests/lane-timings.json` ذخیره می‌کند و در اجراهای بعدی از آن زمان‌بندی‌ها برای شروع زودتر مسیرهای طولانی‌تر استفاده می‌کند. برای چاپ مانیفست وزن‌دار مسیرها بدون ساخت یا اجرای Docker از `OPENCLAW_DOCKER_ALL_DRY_RUN=1` استفاده کنید، یا برای چاپ طرح CI مسیرهای انتخاب‌شده، نیازهای بسته/تصویر و اطلاعات ورود، `node scripts/test-docker-all.mjs --plan-json` را اجرا کنید.
- `Package Acceptance` دروازهٔ بومی GitHub برای پاسخ به این پرسش است که «آیا این آرشیو قابل‌نصب به‌عنوان یک محصول کار می‌کند؟» این دروازه یک بستهٔ نامزد را از `source=npm`،‏ `source=ref`،‏ `source=url`،‏ `source=trusted-url` یا `source=artifact` تفکیک می‌کند، آن را با نام `package-under-test` بارگذاری می‌کند و سپس مسیرهای قابل‌استفادهٔ مجدد Docker E2E را به‌جای بسته‌بندی مجدد ارجاع انتخاب‌شده، روی دقیقاً همان آرشیو اجرا می‌کند. پروفایل‌ها بر اساس گستردگی مرتب شده‌اند: `smoke`،‏ `package`،‏ `product` و `full` (به‌علاوهٔ `custom` برای فهرست صریح مسیرها). برای قرارداد بسته/به‌روزرسانی/Plugin، ماتریس بقای ارتقای نسخهٔ منتشرشده، پیش‌فرض‌های انتشار و عیب‌یابی خرابی‌ها، به [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins) مراجعه کنید.
- بررسی‌های ساخت و انتشار پس از tsdown،‏ `scripts/check-cli-bootstrap-imports.mjs` را اجرا می‌کنند. این محافظ گراف ایستای ساخته‌شده را از `dist/entry.js` و `dist/cli/run-main.js` پیمایش می‌کند و اگر آن گراف راه‌اندازی پیش از توزیع فرمان، قبل از توزیع فرمان هر بستهٔ خارجی را به‌صورت ایستا وارد کند (Commander، رابط کاربری اعلان، undici، گزارش‌گیری و وابستگی‌های سنگین مشابه هنگام راه‌اندازی همگی محاسبه می‌شوند)، شکست می‌خورد؛ همچنین اندازهٔ قطعهٔ همراه اجرای Gateway را به ۷۰ کیلوبایت محدود می‌کند و واردکردن ایستای مسیرهای سرد شناخته‌شدهٔ Gateway (`control-ui-assets`،‏ `diagnostic-stability-bundle`،‏ `onboard-helpers`،‏ `process-respawn`،‏ `restart-sentinel`،‏ `server-close`،‏ `server-reload-handlers`) از آن قطعه را رد می‌کند. `scripts/release-check.ts` به‌طور جداگانه CLI بسته‌بندی‌شده را با `--help`،‏ `onboard --help`،‏ `doctor --help`،‏ `status --json --timeout 1`،‏ `config schema` و `models list --provider openai` به‌صورت بررسی سریع آزمایش می‌کند.
- سازگاری قدیمی Package Acceptance به `2026.4.25` محدود شده است (`2026.4.25-beta.*` نیز شامل می‌شود). تا آن نقطهٔ قطع، چارچوب فقط شکاف‌های فراداده‌ای بسته‌های منتشرشده را تحمل می‌کند: ورودی‌های حذف‌شدهٔ فهرست خصوصی QA، نبود `gateway install --wrapper`، نبود فایل‌های وصله در فیکسچر Git مشتق‌شده از آرشیو، نبود `update.channel` ذخیره‌شده، مکان‌های قدیمی رکورد نصب Plugin، نبود ماندگاری رکورد نصب بازارچه و مهاجرت فرادادهٔ پیکربندی هنگام `plugins update`. برای بسته‌های پس از `2026.4.25`، این مسیرها خرابی قطعی محسوب می‌شوند.
- اجراکننده‌های بررسی سریع کانتینر:‏ `test:docker:openwebui`،‏ `test:docker:onboard`،‏ `test:docker:npm-onboard-channel-agent`،‏ `test:docker:release-user-journey`،‏ `test:docker:release-typed-onboarding`،‏ `test:docker:release-media-memory`،‏ `test:docker:release-upgrade-user-journey`،‏ `test:docker:release-plugin-marketplace`،‏ `test:docker:skill-install`،‏ `test:docker:update-channel-switch`،‏ `test:docker:upgrade-survivor`،‏ `test:docker:published-upgrade-survivor`،‏ `test:docker:session-runtime-context`،‏ `test:docker:agents-delete-shared-workspace`،‏ `test:docker:gateway-network`،‏ `test:docker:browser-cdp-snapshot`،‏ `test:docker:mcp-channels`،‏ `test:docker:agent-bundle-mcp-tools`،‏ `test:docker:cron-mcp-cleanup`،‏ `test:docker:plugins`،‏ `test:docker:plugin-update`،‏ `test:docker:plugin-lifecycle-matrix` و `test:docker:config-reload` یک یا چند کانتینر واقعی را راه‌اندازی می‌کنند و مسیرهای یکپارچه‌سازی سطح‌بالا را اعتبارسنجی می‌کنند.
- مسیرهای Docker/Bash E2E که آرشیو بسته‌بندی‌شدهٔ OpenClaw را از طریق `scripts/lib/openclaw-e2e-instance.sh` نصب می‌کنند، برای `npm install` محدودیت زمانی `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` را اعمال می‌کنند (پیش‌فرض `600s`؛ برای غیرفعال‌کردن پوشش‌دهنده هنگام اشکال‌زدایی، آن را روی `0` تنظیم کنید).

اجراکننده‌های Docker مدل زنده همچنین فقط پوشه‌های خانگی احراز هویت CLI موردنیاز
(یا همهٔ موارد پشتیبانی‌شده، وقتی اجرا محدود نشده باشد) را به‌صورت bind mount متصل می‌کنند و سپس پیش از اجرا آن‌ها را در پوشهٔ خانگی
کانتینر کپی می‌کنند تا OAuth مربوط به CLI خارجی بتواند توکن‌ها را
بدون تغییر مخزن احراز هویت میزبان تازه‌سازی کند:

- مدل‌های مستقیم:‏ `pnpm test:docker:live-models` (اسکریپت: `scripts/test-live-models-docker.sh`)
- بررسی سریع اتصال ACP:‏ `pnpm test:docker:live-acp-bind` (اسکریپت: `scripts/test-live-acp-bind-docker.sh`؛ به‌طور پیش‌فرض Claude، Codex و Gemini را پوشش می‌دهد و پوشش سخت‌گیرانهٔ Droid/OpenCode از طریق `pnpm test:docker:live-acp-bind:droid` و `pnpm test:docker:live-acp-bind:opencode` فراهم می‌شود)
- بررسی سریع بک‌اند CLI:‏ `pnpm test:docker:live-cli-backend` (اسکریپت: `scripts/test-live-cli-backend-docker.sh`)
- بررسی سریع چارچوب app-server مربوط به Codex:‏ `pnpm test:docker:live-codex-harness` (اسکریپت: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + عامل توسعه:‏ `pnpm test:docker:live-gateway` (اسکریپت: `scripts/test-live-gateway-models-docker.sh`)
- بررسی‌های سریع مشاهده‌پذیری:‏ `pnpm qa:otel:smoke`،‏ `pnpm qa:prometheus:smoke` و `pnpm qa:observability:smoke` مسیرهای خصوصی QA در نسخهٔ منبع هستند. این مسیرها عمداً بخشی از مسیرهای انتشار Docker بسته نیستند، زیرا آرشیو npm آزمایشگاه QA را حذف می‌کند.
- بررسی سریع زندهٔ Open WebUI:‏ `pnpm test:docker:openwebui` (اسکریپت: `scripts/e2e/openwebui-docker.sh`)
- جادوگر راه‌اندازی اولیه (TTY، داربست‌سازی کامل):‏ `pnpm test:docker:onboard` (اسکریپت: `scripts/e2e/onboard-docker.sh`)
- بررسی سریع راه‌اندازی اولیه/کانال/عامل با آرشیو npm:‏ `pnpm test:docker:npm-onboard-channel-agent` آرشیو بسته‌بندی‌شدهٔ OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، OpenAI را از طریق راه‌اندازی اولیه با ارجاع محیطی و Telegram را به‌طور پیش‌فرض پیکربندی می‌کند، doctor را اجرا می‌کند و یک نوبت عامل شبیه‌سازی‌شدهٔ OpenAI را اجرا می‌کند. برای استفادهٔ دوباره از آرشیو ازپیش‌ساخته‌شده، `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` را تنظیم کنید؛ برای ردکردن ساخت مجدد میزبان، `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` را تنظیم کنید؛ یا کانال را با `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` یا `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` تغییر دهید.

- آزمون سریع مسیر کاربر انتشار: `pnpm test:docker:release-user-journey` بستهٔ tar مربوط به OpenClaw را به‌صورت سراسری در یک محیط خانگی تمیز Docker نصب می‌کند، فرایند راه‌اندازی اولیه را اجرا می‌کند، یک ارائه‌دهندهٔ شبیه‌سازی‌شدهٔ OpenAI را پیکربندی می‌کند، یک نوبت عامل را اجرا می‌کند، پلاگین‌های خارجی را نصب/حذف می‌کند، ClickClack را برای یک فیکسچر محلی پیکربندی می‌کند، پیام‌رسانی خروجی/ورودی را راستی‌آزمایی می‌کند، Gateway را دوباره راه‌اندازی می‌کند و doctor را اجرا می‌کند.
- آزمون سریع راه‌اندازی نوع‌دار انتشار: `pnpm test:docker:release-typed-onboarding` بستهٔ tar را نصب می‌کند، `openclaw onboard` را از طریق یک TTY واقعی پیش می‌برد، OpenAI را به‌عنوان ارائه‌دهندهٔ مبتنی بر ارجاع محیطی پیکربندی می‌کند، تأیید می‌کند که کلید خام ذخیره نمی‌شود و یک نوبت عامل شبیه‌سازی‌شده را اجرا می‌کند.
- آزمون سریع رسانه/حافظهٔ انتشار: `pnpm test:docker:release-media-memory` بستهٔ tar را نصب می‌کند، درک تصویر از یک پیوست PNG، خروجی تولید تصویر سازگار با OpenAI، بازیابی جست‌وجوی حافظه و حفظ قابلیت بازیابی پس از راه‌اندازی مجدد Gateway را راستی‌آزمایی می‌کند.
- آزمون سریع مسیر کاربر ارتقای انتشار: `pnpm test:docker:release-upgrade-user-journey` به‌طور پیش‌فرض جدیدترین نسخهٔ پایهٔ منتشرشده‌ای را که از بستهٔ tar نامزد قدیمی‌تر است نصب می‌کند، وضعیت ارائه‌دهنده/پلاگین/ClickClack را روی بستهٔ منتشرشده پیکربندی می‌کند، آن را به بستهٔ tar نامزد ارتقا می‌دهد و سپس مسیر اصلی عامل/پلاگین/کانال را دوباره اجرا می‌کند. اگر نسخهٔ پایهٔ منتشرشدهٔ قدیمی‌تری وجود نداشته باشد، از نسخهٔ نامزد استفاده می‌کند. نسخهٔ پایه را با `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` بازنویسی کنید.
- آزمون سریع بازار پلاگین انتشار: `pnpm test:docker:release-plugin-marketplace` از یک بازار فیکسچر محلی نصب می‌کند، پلاگین نصب‌شده را به‌روزرسانی می‌کند، آن را حذف می‌کند و راستی‌آزمایی می‌کند که CLI پلاگین ناپدید شده و فرادادهٔ نصب پاک‌سازی شده است.
- آزمون سریع نصب Skill: `pnpm test:docker:skill-install` بستهٔ tar مربوط به OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، نصب بایگانی‌های بارگذاری‌شده را در پیکربندی غیرفعال می‌کند، شناسهٔ متنی Skill زندهٔ فعلی ClawHub را از جست‌وجو به‌دست می‌آورد، آن را با `openclaw skills install` نصب می‌کند و Skill نصب‌شده را همراه با فرادادهٔ مبدأ/قفل `.clawhub` راستی‌آزمایی می‌کند.
- آزمون سریع تغییر کانال به‌روزرسانی: `pnpm test:docker:update-channel-switch` بستهٔ tar مربوط به OpenClaw را به‌صورت سراسری در Docker نصب می‌کند، از بستهٔ `stable` به git `dev` تغییر می‌دهد، ماندگاری کانال و عملکرد پلاگین پس از به‌روزرسانی را راستی‌آزمایی می‌کند، سپس به بستهٔ `stable` بازمی‌گردد و وضعیت به‌روزرسانی را بررسی می‌کند.
- آزمون سریع بقای پس از ارتقا: `pnpm test:docker:upgrade-survivor` بستهٔ tar مربوط به OpenClaw را روی یک فیکسچر قدیمی و نامرتب کاربر شامل عامل‌ها، پیکربندی کانال، فهرست‌های مجاز پلاگین، وضعیت منسوخ وابستگی پلاگین و فایل‌های موجود فضای کاری/نشست نصب می‌کند. این آزمون، به‌روزرسانی بسته و doctor غیرتعاملی را بدون کلیدهای زندهٔ ارائه‌دهنده یا کانال اجرا می‌کند، سپس یک Gateway مبتنی بر local loopback راه می‌اندازد و حفظ پیکربندی/وضعیت و نیز بودجه‌های راه‌اندازی/وضعیت را بررسی می‌کند.
- آزمون سریع بقای پس از ارتقای نسخهٔ منتشرشده: `pnpm test:docker:published-upgrade-survivor` به‌طور پیش‌فرض `openclaw@latest` را نصب می‌کند، فایل‌های واقع‌گرایانهٔ کاربر موجود را ایجاد می‌کند، آن نسخهٔ پایه را با یک دستورالعمل فرمان تعبیه‌شده پیکربندی می‌کند، پیکربندی حاصل را اعتبارسنجی می‌کند، نصب منتشرشده را به بستهٔ tar نامزد به‌روزرسانی می‌کند، doctor غیرتعاملی را اجرا می‌کند، `.artifacts/upgrade-survivor/summary.json` را می‌نویسد، سپس یک Gateway مبتنی بر local loopback راه می‌اندازد و هدف‌های پیکربندی‌شده، حفظ وضعیت، راه‌اندازی، `/healthz`، `/readyz` و بودجه‌های وضعیت RPC را بررسی می‌کند. یک نسخهٔ پایه را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` بازنویسی کنید، از زمان‌بند تجمیعی بخواهید نسخه‌های پایهٔ محلی دقیق را با `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` مانند `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` گسترش دهد و فیکسچرهای مبتنی بر شکل مسئله را با `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` مانند `reported-issues` گسترش دهد؛ مجموعهٔ مسائل گزارش‌شده شامل `configured-plugin-installs` برای ترمیم خودکار نصب پلاگین‌های خارجی OpenClaw است. پذیرش بسته این موارد را با نام‌های `published_upgrade_survivor_baseline`، `published_upgrade_survivor_baselines` و `published_upgrade_survivor_scenarios` ارائه می‌کند، توکن‌های فراپایه‌ای مانند `last-stable-4` یا `all-since-2026.4.23` را حل می‌کند و اعتبارسنجی کامل انتشار، دروازهٔ بستهٔ آزمون ماندگاری انتشار را به `last-stable-4 2026.4.23 2026.5.2 2026.4.15` به‌علاوهٔ `reported-issues` گسترش می‌دهد.
- آزمون سریع زمینهٔ زمان اجرای نشست: `pnpm test:docker:session-runtime-context` ماندگاری رونوشت زمینهٔ پنهان زمان اجرا و ترمیم شاخه‌های تکراری بازنویسی پرامپت آسیب‌دیده توسط doctor را راستی‌آزمایی می‌کند.
- آزمون سریع نصب سراسری Bun: `bash scripts/e2e/bun-global-install-smoke.sh` درخت فعلی را بسته‌بندی می‌کند، آن را با `bun install -g` در یک محیط خانگی ایزوله نصب می‌کند و راستی‌آزمایی می‌کند که `openclaw infer image providers --json` به‌جای متوقف‌ماندن، ارائه‌دهندگان تصویر همراه بسته را برمی‌گرداند. با `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` از یک بستهٔ tar ازپیش‌ساخته‌شده دوباره استفاده کنید، با `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ساخت روی میزبان را نادیده بگیرید، یا با `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`، `dist/` را از یک تصویر Docker ساخته‌شده کپی کنید.
- آزمون سریع Docker نصب‌کننده: `bash scripts/test-install-sh-docker.sh` یک کش npm را میان کانتینرهای ریشه، به‌روزرسانی و npm مستقیم خود به اشتراک می‌گذارد. آزمون سریع به‌روزرسانی، پیش از ارتقا به بستهٔ tar نامزد، به‌طور پیش‌فرض از `latest` مربوط به npm به‌عنوان نسخهٔ پایهٔ پایدار استفاده می‌کند. در محیط محلی با `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` یا در GitHub با ورودی `update_baseline_version` گردش‌کار آزمون سریع نصب، آن را بازنویسی کنید. بررسی‌های نصب‌کنندهٔ غیرریشه یک کش npm ایزوله را حفظ می‌کنند تا ورودی‌های کش متعلق به ریشه، رفتار نصب محلی کاربر را پنهان نکنند. برای استفادهٔ مجدد از کش ریشه/به‌روزرسانی/npm مستقیم در اجرای مجدد محلی، `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` را تنظیم کنید.
- CI آزمون سریع نصب، به‌روزرسانی سراسری تکراری npm مستقیم را با `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` نادیده می‌گیرد؛ هنگامی که پوشش مستقیم `npm install -g` لازم است، اسکریپت را به‌صورت محلی و بدون آن متغیر محیطی اجرا کنید.
- آزمون سریع CLI حذف فضای کاری مشترک توسط عامل‌ها: `pnpm test:docker:agents-delete-shared-workspace` (اسکریپت: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) به‌طور پیش‌فرض تصویر Dockerfile ریشه را می‌سازد، دو عامل را با یک فضای کاری در محیط خانگی ایزولهٔ کانتینر ایجاد می‌کند، `agents delete --json` را اجرا می‌کند و JSON معتبر و رفتار حفظ فضای کاری را راستی‌آزمایی می‌کند. با `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` از تصویر آزمون سریع نصب دوباره استفاده کنید.
- شبکهٔ Gateway و چرخهٔ عمر میزبان: `pnpm test:docker:gateway-network` (اسکریپت: `scripts/e2e/gateway-network-docker.sh`) آزمون سریع احراز هویت/سلامت WebSocket شبکهٔ محلی دوکانتینری را حفظ می‌کند، سپس از HTTP مدیریتی مبتنی بر local loopback استفاده می‌کند تا حصارکشی آماده‌سازی، دسترسی کنترلی حفظ‌شده، بازیابی ازسرگیری و توقف/شروع آماده‌شده در همان کانتینر را اثبات کند. بررسی راه‌اندازی مجدد باید پیش از انقضای اجارهٔ اصلی پایان یابد، راستی‌آزمایی کند که وضعیت تعلیق مختص فرایند است، درحالی‌که پیکربندی ماندگار Gateway و هویت کانتینر حفظ می‌شوند، و JSON قابل‌خواندن برای ماشین از زمان‌بندی مرحله‌ها تولید کند.
- آزمون سریع عکس‌لحظه‌ای CDP مرورگر: `pnpm test:docker:browser-cdp-snapshot` (اسکریپت: `scripts/e2e/browser-cdp-snapshot-docker.sh`) تصویر E2E منبع را همراه با یک لایهٔ Chromium می‌سازد، Chromium را با CDP خام راه‌اندازی می‌کند، `browser doctor --deep` را اجرا می‌کند و راستی‌آزمایی می‌کند که عکس‌لحظه‌ای نقش‌های CDP، نشانی‌های اینترنتی پیوندها، عناصر قابل‌کلیک ارتقایافته با نشانگر، ارجاع‌های iframe و فرادادهٔ فریم را پوشش می‌دهد.
- پس‌رفت حداقل استدلال `web_search` در OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (اسکریپت: `scripts/e2e/openai-web-search-minimal-docker.sh`) یک سرور شبیه‌سازی‌شدهٔ OpenAI را از طریق Gateway اجرا می‌کند، راستی‌آزمایی می‌کند که `web_search` مقدار `reasoning.effort` را از `minimal` به `low` افزایش می‌دهد، سپس ردشدن طرح‌واره توسط ارائه‌دهنده را اجباری می‌کند و بررسی می‌کند که جزئیات خام در گزارش‌های Gateway ظاهر می‌شود.
- پل کانال MCP (Gateway مقداردهی‌شده + پل stdio + آزمون سریع قاب اعلان خام Claude): `pnpm test:docker:mcp-channels` (اسکریپت: `scripts/e2e/mcp-channels-docker.sh`)
- ابزارهای MCP بستهٔ OpenClaw (سرور واقعی MCP مبتنی بر stdio + آزمون سریع اجازه/رد نمایهٔ تعبیه‌شدهٔ OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (اسکریپت: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- پاک‌سازی MCP مربوط به Cron/زیرعامل (Gateway واقعی + خاتمهٔ فرزند MCP مبتنی بر stdio پس از اجرای Cron ایزوله و زیرعامل یک‌باره): `pnpm test:docker:cron-mcp-cleanup` (اسکریپت: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- پلاگین‌ها (آزمون سریع نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های بالاکشیده‌شده، فرادادهٔ نادرست بستهٔ npm، ارجاع‌های متحرک git، مجموعهٔ جامع ClawHub، به‌روزرسانی‌های بازار و فعال‌سازی/بازرسی بستهٔ Claude): `pnpm test:docker:plugins` (اسکریپت: `scripts/e2e/plugins-docker.sh`)
  برای نادیده‌گرفتن بخش ClawHub، `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` را تنظیم کنید، یا جفت پیش‌فرض بسته/زمان اجرای مجموعهٔ جامع را با `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` و `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` بازنویسی کنید. بدون `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`، آزمون از یک سرور فیکسچر محلی و خودبسندهٔ ClawHub استفاده می‌کند.
- آزمون سریع بدون تغییر به‌روزرسانی پلاگین: `pnpm test:docker:plugin-update` (اسکریپت: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- آزمون سریع ماتریس چرخهٔ عمر پلاگین: `pnpm test:docker:plugin-lifecycle-matrix` بستهٔ tar مربوط به OpenClaw را در یک کانتینر خالی نصب می‌کند، یک پلاگین npm را نصب می‌کند، فعال/غیرفعال‌سازی را تغییر می‌دهد، آن را از طریق یک رجیستری محلی npm ارتقا و تنزل می‌دهد، کد نصب‌شده را حذف می‌کند، سپس راستی‌آزمایی می‌کند که حذف نصب همچنان وضعیت منسوخ را پاک می‌کند و هم‌زمان معیارهای RSS/CPU را برای هر مرحلهٔ چرخهٔ عمر ثبت می‌کند.
- آزمون سریع فرادادهٔ بارگذاری مجدد پیکربندی: `pnpm test:docker:config-reload` (اسکریپت: `scripts/e2e/config-reload-source-docker.sh`)
- پلاگین‌ها: `pnpm test:docker:plugins` آزمون سریع نصب/به‌روزرسانی برای مسیر محلی، `file:`، رجیستری npm با وابستگی‌های بالاکشیده‌شده، ارجاع‌های متحرک git، فیکسچرهای ClawHub، به‌روزرسانی‌های بازار و فعال‌سازی/بازرسی بستهٔ Claude را پوشش می‌دهد. `pnpm test:docker:plugin-update` رفتار بدون تغییر به‌روزرسانی پلاگین‌های نصب‌شده را پوشش می‌دهد. `pnpm test:docker:plugin-lifecycle-matrix` نصب، فعال‌سازی، غیرفعال‌سازی، ارتقا، تنزل و حذف نصبِ کد مفقودِ پلاگین npm را با ردیابی منابع پوشش می‌دهد.

برای پیش‌ساخت و استفادهٔ مجدد دستی از تصویر کارکردی مشترک:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

بازنویسی‌های تصویر مختص مجموعه مانند `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` در صورت تنظیم همچنان اولویت دارند. هنگامی که `OPENCLAW_SKIP_DOCKER_BUILD=1` به یک تصویر مشترک راه‌دور اشاره می‌کند، اسکریپت‌ها اگر آن تصویر از قبل محلی نباشد، آن را دریافت می‌کنند. آزمون‌های Docker مربوط به QR و نصب‌کننده، Dockerfileهای خود را حفظ می‌کنند، زیرا رفتار بسته/نصب را اعتبارسنجی می‌کنند، نه زمان اجرای برنامهٔ ساخته‌شدهٔ مشترک را.

اجراکننده‌های Docker مدل زنده همچنین نسخهٔ فعلی کد را به‌صورت فقط‌خواندنی متصل می‌کنند
و آن را درون کانتینر به یک پوشهٔ کاری موقت منتقل می‌کنند. این کار تصویر
زمان اجرا را کم‌حجم نگه می‌دارد و درعین‌حال Vitest را دقیقاً روی
منبع/پیکربندی محلی شما اجرا می‌کند. مرحلهٔ انتقال، کش‌های بزرگ مختص محیط محلی و خروجی‌های
ساخت برنامه مانند `.pnpm-store`، `.worktrees`، `__openclaw_vitest__` و
پوشه‌های خروجی `.build` محلی برنامه یا Gradle را نادیده می‌گیرد تا اجرای زندهٔ Docker
دقایقی را صرف کپی‌کردن مصنوعات مختص دستگاه نکند. این اجراکننده‌ها همچنین
`OPENCLAW_SKIP_CHANNELS=1` را تنظیم می‌کنند تا کاوش‌های زندهٔ Gateway، پردازشگرهای واقعی کانال
Telegram/Discord/و غیره را درون کانتینر راه‌اندازی نکنند.
`test:docker:live-models` همچنان `pnpm test:live` را اجرا می‌کند؛ بنابراین هنگامی که لازم است
پوشش زندهٔ Gateway را در آن مسیر Docker محدود یا مستثنا کنید، متغیرهای
`OPENCLAW_LIVE_GATEWAY_*` را نیز عبور دهید.

`test:docker:openwebui` یک آزمون دود سازگاری در سطح بالاتر است: یک کانتینر Gateway از OpenClaw را با نقاط پایانی HTTP سازگار با OpenAI فعال راه‌اندازی می‌کند، یک کانتینر Open WebUI با نسخه تثبیت‌شده را در برابر آن Gateway اجرا می‌کند، از طریق Open WebUI وارد می‌شود، بررسی می‌کند که `/api/models` مقدار `openclaw/default` را ارائه دهد، و سپس یک درخواست واقعی گفت‌وگو را از طریق پراکسی `/api/chat/completions` متعلق به Open WebUI ارسال می‌کند. برای بررسی‌های CI مسیر انتشار که باید پس از ورود به Open WebUI و کشف مدل متوقف شوند و منتظر تکمیل زنده مدل نمانند، `OPENWEBUI_SMOKE_MODE=models` را تنظیم کنید. نخستین اجرا ممکن است به‌طور محسوسی کندتر باشد، زیرا Docker شاید لازم باشد تصویر Open WebUI را دریافت کند و Open WebUI نیز شاید نیاز داشته باشد راه‌اندازی اولیه سرد خود را تکمیل کند. این مسیر به یک کلید قابل‌استفاده برای مدل زنده نیاز دارد که از طریق محیط فرایند، پروفایل‌های احراز هویت آماده‌شده، یا یک `OPENCLAW_PROFILE_FILE` صریح فراهم می‌شود. اجراهای موفق، یک بار داده JSON کوچک مانند `{ "ok": true, "model": "openclaw/default", ... }` چاپ می‌کنند.

`test:docker:mcp-channels` عمداً قطعی است و به حساب واقعی Telegram، Discord یا iMessage نیاز ندارد. این آزمون یک کانتینر Gateway با داده‌های اولیه را راه‌اندازی می‌کند، کانتینر دومی را اجرا می‌کند که `openclaw mcp serve` را ایجاد می‌کند، و سپس کشف گفت‌وگوی مسیریابی‌شده، خواندن رونوشت، فراداده پیوست، رفتار صف رویداد زنده، مسیریابی ارسال خروجی، و اعلان‌های کانال و مجوز به سبک Claude را روی پل واقعی MCP مبتنی بر stdio بررسی می‌کند. بررسی اعلان، فریم‌های خام MCP مبتنی بر stdio را مستقیماً وارسی می‌کند تا آزمون دود آنچه پل واقعاً منتشر می‌کند را اعتبارسنجی کند، نه صرفاً آنچه یک SDK کارخواه خاص نمایش می‌دهد.

`test:docker:agent-bundle-mcp-tools` قطعی است و به کلید مدل زنده نیاز ندارد. این آزمون تصویر Docker مخزن را می‌سازد، یک کارساز واقعی کاوشگر MCP مبتنی بر stdio را داخل کانتینر راه‌اندازی می‌کند، آن کارساز را از طریق زمان‌اجرای MCP بسته تعبیه‌شده OpenClaw ایجاد می‌کند، ابزار را اجرا می‌کند، و سپس بررسی می‌کند که `coding` و `messaging` ابزارهای `bundle-mcp` را حفظ کنند، درحالی‌که `minimal` و `tools.deny: ["bundle-mcp"]` آن‌ها را پالایش می‌کنند.

`test:docker:cron-mcp-cleanup` قطعی است و به کلید مدل زنده نیاز ندارد. این آزمون یک Gateway با داده‌های اولیه و یک کارساز واقعی کاوشگر MCP مبتنی بر stdio را راه‌اندازی می‌کند، یک نوبت Cron ایزوله و یک نوبت فرزند یک‌باره `sessions_spawn` را اجرا می‌کند، و سپس بررسی می‌کند که فرایند فرزند MCP پس از هر اجرا خاتمه یابد.

آزمون دود دستی رشته ACP با زبان طبیعی (نه برای CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- این اسکریپت را برای گردش‌کارهای رگرسیون و اشکال‌زدایی نگه دارید. ممکن است دوباره برای اعتبارسنجی مسیریابی رشته ACP لازم شود؛ بنابراین آن را حذف نکنید.

متغیرهای محیطی مفید:

- `OPENCLAW_CONFIG_DIR=...` (پیش‌فرض: `~/.openclaw`) که در `/home/node/.openclaw` سوار می‌شود
- `OPENCLAW_WORKSPACE_DIR=...` (پیش‌فرض: `~/.openclaw/workspace`) که در `/home/node/.openclaw/workspace` سوار می‌شود
- `OPENCLAW_PROFILE_FILE=...` که پیش از اجرای آزمون‌ها سوار و بارگذاری می‌شود
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` برای بررسی صرفاً متغیرهای محیطی بارگذاری‌شده از `OPENCLAW_PROFILE_FILE`، با استفاده از پوشه‌های موقت پیکربندی و فضای کاری و بدون سوارکردن احراز هویت CLI خارجی
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (پیش‌فرض: `~/.cache/openclaw/docker-cli-tools`، مگر اینکه اجرا از قبل از یک پوشه اتصال CI یا مدیریت‌شده استفاده کند) که برای نصب‌های ذخیره‌شده CLI درون Docker در `/home/node/.npm-global` سوار می‌شود
- پوشه‌ها و فایل‌های احراز هویت CLI خارجی زیر `$HOME` به‌صورت فقط‌خواندنی زیر `/host-auth...` سوار می‌شوند و سپس پیش از شروع آزمون‌ها در `/home/node/...` کپی می‌شوند
  - پوشه‌های پیش‌فرض (هنگامی استفاده می‌شوند که اجرا به ارائه‌دهندگان خاص محدود نشده باشد): `.factory`، `.gemini`، `.minimax`
  - فایل‌های پیش‌فرض: `~/.codex/auth.json`، `~/.codex/config.toml`، `.claude.json`، `~/.claude/.credentials.json`، `~/.claude/settings.json`، `~/.claude/settings.local.json`
  - اجراهای محدودشده به ارائه‌دهنده فقط پوشه‌ها و فایل‌های لازم را که از `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` استنباط شده‌اند سوار می‌کنند
  - با `OPENCLAW_DOCKER_AUTH_DIRS=all`، `OPENCLAW_DOCKER_AUTH_DIRS=none`، یا فهرستی جداشده با ویرگول مانند `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` به‌صورت دستی بازنویسی کنید
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` برای محدودکردن اجرا
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` برای پالایش ارائه‌دهندگان داخل کانتینر
- `OPENCLAW_SKIP_DOCKER_BUILD=1` برای استفاده مجدد از تصویر موجود `openclaw:local-live` در اجراهای مجددی که به بازسازی نیاز ندارند
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` برای اطمینان از اینکه اطلاعات اعتبارسنجی از مخزن پروفایل می‌آیند، نه از محیط
- `OPENCLAW_OPENWEBUI_MODEL=...` برای انتخاب مدلی که Gateway برای آزمون دود Open WebUI ارائه می‌کند
- `OPENCLAW_OPENWEBUI_PROMPT=...` برای بازنویسی فرمان بررسی مقدار یک‌بارمصرف که آزمون دود Open WebUI استفاده می‌کند
- `OPENWEBUI_IMAGE=...` برای بازنویسی برچسب تصویر تثبیت‌شده Open WebUI

## بررسی سلامت مستندات

پس از ویرایش مستندات، بررسی‌های مستندات را اجرا کنید: `pnpm check:docs`.
هنگامی که بررسی عنوان‌های داخل صفحه نیز لازم است، اعتبارسنجی کامل لنگرهای Mintlify را اجرا کنید: `pnpm docs:check-links:anchors`.

## رگرسیون آفلاین (ایمن برای CI)

این‌ها رگرسیون‌های «خط لوله واقعی» بدون ارائه‌دهندگان واقعی هستند:

- فراخوانی ابزار Gateway ‏(OpenAI شبیه‌سازی‌شده، Gateway واقعی و حلقه عامل): `src/gateway/gateway.test.ts` (مورد: «فراخوانی ابزار شبیه‌سازی‌شده OpenAI را به‌صورت سرتاسری از طریق حلقه عامل Gateway اجرا می‌کند»)
- راهنمای گام‌به‌گام Gateway ‏(`wizard.start`/`wizard.next` در WS، نوشتن پیکربندی و اعمال احراز هویت): `src/gateway/gateway.test.ts` (مورد: «راهنمای گام‌به‌گام را روی ws اجرا می‌کند و پیکربندی توکن احراز هویت را می‌نویسد»)

## ارزیابی‌های قابلیت اطمینان عامل (Skills)

از قبل چند آزمون ایمن برای CI داریم که مانند «ارزیابی قابلیت اطمینان عامل» رفتار می‌کنند:

- فراخوانی ابزار شبیه‌سازی‌شده از طریق Gateway واقعی و حلقه عامل (`src/gateway/gateway.test.ts`).
- جریان‌های سرتاسری راهنمای گام‌به‌گام که اتصال نشست و اثرات پیکربندی را اعتبارسنجی می‌کنند (`src/gateway/gateway.test.ts`).

مواردی که هنوز برای Skills موجود نیستند (به [Skills](/fa/tools/skills) مراجعه کنید):

- **تصمیم‌گیری:** وقتی Skills در فرمان فهرست شده‌اند، آیا عامل Skill درست را انتخاب می‌کند یا از موارد نامرتبط اجتناب می‌کند؟
- **انطباق:** آیا عامل پیش از استفاده، `SKILL.md` را می‌خواند و مراحل و آرگومان‌های الزامی را رعایت می‌کند؟
- **قراردادهای گردش‌کار:** سناریوهای چندنوبتی که ترتیب ابزارها، انتقال تاریخچه نشست، و مرزهای محیط ایزوله را بررسی می‌کنند.

ارزیابی‌های آینده باید ابتدا قطعی باقی بمانند:

- یک اجراکننده سناریو با استفاده از ارائه‌دهندگان شبیه‌سازی‌شده برای بررسی فراخوانی و ترتیب ابزارها، خواندن فایل Skill و اتصال نشست.
- یک مجموعه کوچک از سناریوهای متمرکز بر Skill ‏(استفاده در برابر اجتناب، دروازه‌بندی، تزریق فرمان).
- ارزیابی‌های زنده اختیاری (با فعال‌سازی صریح و کنترل‌شده از طریق متغیرهای محیطی) فقط پس از آماده‌شدن مجموعه ایمن برای CI.

## آزمون‌های قرارداد (ساختار Plugin و کانال)

آزمون‌های قرارداد بررسی می‌کنند که هر Plugin و کانال ثبت‌شده با قرارداد رابط خود مطابقت داشته باشد. آن‌ها روی همه Pluginهای کشف‌شده پیمایش می‌کنند و مجموعه‌ای از بررسی‌های ساختار و رفتار را اجرا می‌کنند. مسیر پیش‌فرض آزمون واحد `pnpm test` عمداً از این فایل‌های مشترک مرزی و دود صرف‌نظر می‌کند؛ هنگامی که سطوح مشترک کانال یا ارائه‌دهنده را تغییر می‌دهید، فرمان‌های قرارداد را به‌صراحت اجرا کنید.

### فرمان‌ها

- همه قراردادها: `pnpm test:contracts`
- فقط قراردادهای کانال: `pnpm test:contracts:channels`
- فقط قراردادهای ارائه‌دهنده: `pnpm test:contracts:plugins`

### قراردادهای کانال

در `src/channels/plugins/contracts/*.contract.test.ts` قرار دارند. دسته‌های سطح‌بالای فعلی:

- **فهرست کانال** - فراداده ورودی فهرست کانال بسته‌شده یا رجیستری
- **Plugin** (مبتنی بر رجیستری و بخش‌بندی‌شده) - ساختار پایه ثبت Plugin
- **فقط سطوح** (مبتنی بر رجیستری و بخش‌بندی‌شده) - بررسی ساختار هر سطح برای `actions`، `setup`، `status`، `outbound`، `messaging`، `threading`، `directory` و `gateway`
- **اتصال نشست** (مبتنی بر رجیستری) - رفتار اتصال نشست
- **بار داده خروجی** - ساختار و عادی‌سازی بار داده پیام
- **سیاست گروه** (حالت جایگزین) - اعمال سیاست پیش‌فرض گروه برای هر کانال
- **رشته‌بندی** (مبتنی بر رجیستری و بخش‌بندی‌شده) - مدیریت شناسه رشته
- **فهرست راهنما** (مبتنی بر رجیستری و بخش‌بندی‌شده) - API فهرست راهنما و اعضا
- **رجیستری** و **هسته Pluginها.\*** - رجیستری Plugin کانال، بارگذار، و جزئیات داخلی مجوز نوشتن پیکربندی

کمک‌ابزارهای چارچوب ثبت ارسال ورودی و بار داده خروجی که این مجموعه‌ها استفاده می‌کنند، به‌صورت داخلی از طریق `src/plugin-sdk/channel-contract-testing.ts` ارائه می‌شوند (از npm مستثنا و نه یک زیرمسیر عمومی SDK)؛ فایل مستقلی با نام `inbound.contract.test.ts` در این پوشه وجود ندارد.

### قراردادهای ارائه‌دهنده

در `src/plugins/contracts/*.contract.test.ts` قرار دارند. دسته‌های فعلی شامل این موارد هستند:

- **ساختار** - ساختار مانیفست، API و خروجی‌های زمان‌اجرای Plugin
- **ثبت Plugin** (+ موازی) - موارد ثبت مانیفست
- **مانیفست بسته** - الزامات مانیفست بسته
- **بارگذار** - رفتار راه‌اندازی و جمع‌آوری بارگذار Plugin
- **رجیستری** - محتوا و جست‌وجوی رجیستری قرارداد Plugin
- **ارائه‌دهندگان** - رفتار مشترک ارائه‌دهنده در میان ارائه‌دهندگان بسته‌شده، به‌علاوه ارائه‌دهندگان جست‌وجوی وب
- **انتخاب احراز هویت** - فراداده انتخاب احراز هویت و رفتار راه‌اندازی
- **منسوخ‌سازی فهرست ارائه‌دهنده** - فراداده منسوخ‌شده فهرست ارائه‌دهنده
- **حل انتخاب راهنمای گام‌به‌گام**، **انتخاب‌گر مدل راهنمای گام‌به‌گام**، **گزینه‌های راه‌اندازی راهنمای گام‌به‌گام** - قراردادهای راهنمای گام‌به‌گام راه‌اندازی ارائه‌دهنده
- **ارائه‌دهنده تعبیه‌سازی**، **ارائه‌دهنده تعبیه‌سازی حافظه**، **ارائه‌دهنده واکشی وب**، **تبدیل متن به گفتار** - قراردادهای ارائه‌دهنده مختص قابلیت
- **کنش‌های نشست**، **پیوست‌های نشست**، **بازنمایی ورودی نشست** - قراردادهای وضعیت نشست متعلق به Plugin
- **نوبت‌های زمان‌بندی‌شده** - فراداده نوبت زمان‌بندی‌شده Plugin و کران‌های مُهر زمانی
- **قلاب‌های میزبان**، **چرخه‌عمر زمینه اجرا**، **اثرات جانبی درون‌ریزی زمان‌اجرا**، **مرزهای زمان‌اجرا** - قراردادهای چرخه‌عمر میزبان و زمان‌اجرای Plugin و مرزهای درون‌ریزی
- **وابستگی‌های زمان‌اجرای افزونه** - محل وابستگی‌های زمان‌اجرا برای افزونه‌ها

### زمان اجرا

- پس از تغییر خروجی‌ها یا زیرمسیرهای SDK مربوط به Plugin
- پس از افزودن یا تغییر یک Plugin کانال یا ارائه‌دهنده
- پس از بازآرایی ثبت یا کشف Plugin

آزمون‌های قرارداد در CI اجرا می‌شوند و به کلیدهای واقعی API نیاز ندارند.

## افزودن رگرسیون‌ها (راهنما)

هنگامی که یک مشکل ارائه‌دهنده یا مدل کشف‌شده در اجرای زنده را برطرف می‌کنید:

- در صورت امکان، یک رگرسیون ایمن برای CI اضافه کنید (ارائه‌دهنده شبیه‌سازی‌شده یا جایگزین، یا ثبت دقیق تبدیل ساختار درخواست)
- اگر مشکل ذاتاً فقط در اجرای زنده رخ می‌دهد (محدودیت نرخ، سیاست‌های احراز هویت)، آزمون زنده را محدود نگه دارید و فعال‌سازی صریح آن را از طریق متغیرهای محیطی انجام دهید
- ترجیحاً کوچک‌ترین لایه‌ای را هدف بگیرید که خطا را تشخیص می‌دهد:
  - خطای تبدیل یا بازپخش درخواست ارائه‌دهنده -> آزمون مستقیم مدل‌ها
  - خطای خط لوله نشست، تاریخچه یا ابزار Gateway -> آزمون دود زنده Gateway یا آزمون شبیه‌سازی‌شده Gateway و ایمن برای CI
- حفاظ پیمایش SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` برای هر کلاس SecretRef از فراداده رجیستری (`listSecretTargetRegistryEntries()`) یک هدف نمونه استخراج می‌کند و سپس بررسی می‌کند که شناسه‌های اجرای دارای بخش پیمایشی رد شوند.
  - اگر یک خانواده هدف SecretRef جدید با `includeInPlan` در `src/secrets/target-registry-data.ts` اضافه می‌کنید، `classifyTargetClass` را در آن آزمون به‌روزرسانی کنید. این آزمون عمداً برای شناسه‌های هدف طبقه‌بندی‌نشده شکست می‌خورد تا کلاس‌های جدید نتوانند بی‌سروصدا نادیده گرفته شوند.

## مرتبط

- [آزمون زنده](/fa/help/testing-live)
- [آزمون به‌روزرسانی‌ها و Pluginها](/fa/help/testing-updates-plugins)
- [CI](/fa/ci)
