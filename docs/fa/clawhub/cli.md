---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی یا انتشار
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی و رفتار فایل قفل.'
x-i18n:
    generated_at: "2026-07-02T01:04:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8af3d4d7c689fd0dc774354f275dd75fa44ec723880e3895d980a755f81a7d
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

بسته CLI: `clawhub`، باینری: `clawhub`.

آن را به‌صورت سراسری با npm یا pnpm نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

سپس آن را بررسی کنید:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## پرچم‌های سراسری

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود از مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال‌کردن اعلان‌ها

معادل‌های محیطی:

- `CLAWHUB_SITE` (قدیمی: `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی: `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی: `CLAWDHUB_WORKDIR`)

### پروکسی HTTP

CLI به متغیرهای محیطی استاندارد پروکسی HTTP برای سیستم‌هایی که پشت
پروکسی‌های سازمانی یا شبکه‌های محدود هستند احترام می‌گذارد:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پروکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دورزدن پروکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این مورد روی سیستم‌هایی لازم است که اتصال مستقیم خروجی در آن‌ها مسدود شده است
(برای مثال کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پروکسی،
یا دیواره‌های آتش سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پروکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال مستقیم).

## فایل پیکربندی

توکن API شما و URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی: `CLAWDHUB_CONFIG_PATH`)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback در local loopback کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی از راه دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و تا زمانی که آن را در `<site>/cli/device` مجاز کنید منتظر می‌ماند.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `token`

- توکن API ذخیره‌شده را در stdout چاپ می‌کند.
- برای لوله‌کردن توکن ورود محلی به فرمان‌های راه‌اندازی secret در CI مفید است.

### `star <skill>` / `unstar <skill>`

- یک مهارت را به موارد برجسته شما اضافه یا از آن حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- خروجی شامل slug مهارت، handle مالک، نام نمایشی و امتیاز ارتباط است.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن مستقل slug مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطبیق می‌یابد.
- محبوبیت یک پیش‌فرض رتبه‌بندی کوچک است، نه تضمینی برای قرارگیری در رتبه نخست.
- اگر مهارتی باید ظاهر شود اما نمی‌شود، درحالی‌که وارد شده‌اید `clawhub inspect @owner/slug` را اجرا کنید تا پیش از تغییر نام فراداده، عیب‌یابی‌های moderation قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- تازه‌ترین Skills را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt` مرتب‌شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|rating|downloads|trending` (پیش‌فرض: newest). نام‌های مستعار قدیمی مرتب‌سازی نصب همچنان برای سازگاری کار می‌کنند.
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه تا 50 نویسه کوتاه می‌شود).

### `inspect @owner/slug`

- فراداده مهارت و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: latest).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (برای مثال `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌هایی که فهرست می‌شوند (1-200).
- `--files`: فهرست فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install @owner/slug`

- آخرین نسخه را برای مالک و مهارت نام‌برده resolve می‌کند.
- فایل zip را از طریق `/api/v1/download` دانلود می‌کند.
- آن را در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی Skills پین‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <skill>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی: `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی: `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- هنگام ورود، telemetry را به‌صورت best-effort ارسال می‌کند تا شمار نصب‌های فعلی
  غیرفعال شوند.
- تعاملی: تأیید می‌خواهد.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (قدیمی: `.clawdhub`) را می‌خواند.
- کنار Skills که با `clawhub pin` منجمد شده‌اند، `pinned` را نشان می‌دهد؛ شامل دلیل اختیاری.

### `pin <skill>`

- یک مهارت نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا مهارت منجمد شده است.
- Skills پین‌شده توسط `update --all` رد می‌شوند و با `update <skill>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی تصادفی جایگزین نشوند.

### `unpin <skill>`

- pin مربوط به lockfile را از یک مهارت نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [@owner/slug]` / `update --all`

- fingerprint را از فایل‌های محلی محاسبه می‌کند.
- اگر fingerprint با یک نسخه شناخته‌شده مطابق باشد: بدون اعلان.
- اگر fingerprint مطابق نباشد:
  - به‌صورت پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با اعلان)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <skill>` برای Skills پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <skill>` را اجرا کنید.
- `update --all` slugهای پین‌شده را رد می‌کند و خلاصه‌ای از مواردی که منجمد ماندند چاپ می‌کند.

### `skill publish <path>`

- fingerprint بسته محلی را با ClawHub مقایسه می‌کند و وقتی محتوا از قبل منتشر شده باشد
  با موفقیت خارج می‌شود.
- Skills جدید به‌صورت پیش‌فرض `1.0.0` هستند؛ Skills تغییریافته به‌صورت پیش‌فرض نسخه patch بعدی را
  می‌گیرند.
- `--version <version>` به‌طور صریح یک نسخه را انتخاب می‌کند و حتی وقتی محتوا با یک نسخه موجود
  مطابق باشد منتشر می‌کند.
- `--dry-run` انتشار را بدون بارگذاری resolve می‌کند؛ `--json` یک نتیجه
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--owner <handle>` زمانی که actor دسترسی ناشر داشته باشد، زیر handle ناشر سازمان/کاربر
  منتشر می‌کند.
- `--migrate-owner` یک مهارت موجود را هنگام انتشار یک نسخه جدید به `--owner` منتقل می‌کند.
  به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک مهارت یعنی آن مهارت در ClawHub تحت `MIT-0` منتشر می‌شود.
- Skills منتشرشده برای استفاده، تغییر و بازتوزیع بدون attribution آزاد هستند.
- ClawHub از Skills پولی یا قیمت‌گذاری برای هر مهارت پشتیبانی نمی‌کند.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow قابل‌استفاده‌مجدد ClawHub با نام
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
برای یک `skill_path`، یا برای هر پوشه مهارت مستقیم زیر `root` (پیش‌فرض: `skills`) فرمان `skill publish` را فراخوانی می‌کند. Skills بدون تغییر را رد می‌کند و از همان رفتار خودکار نسخه patch استفاده می‌کند.

برای پیش‌نمایش بدون توکن، `dry_run: true` را تنظیم کنید. انتشار واقعی به secret با نام
`clawhub_token` نیاز دارد.

### `sync`

- workdir فعلی، دایرکتوری Skills پیکربندی‌شده، و هر پوشه
  `--root <dir>` را برای پوشه‌های مهارت محلی که شامل `SKILL.md` یا
  `skill.md` هستند اسکن می‌کند.
- fingerprint هر مهارت محلی را با ClawHub مقایسه می‌کند و فقط Skills جدید یا
  تغییریافته را منتشر می‌کند.
- Skills جدید به‌صورت `1.0.0` منتشر می‌شوند؛ Skills تغییریافته به‌صورت پیش‌فرض نسخه patch بعدی
  را منتشر می‌کنند. برای دسته‌های به‌روزرسانی که باید با یک گام semver
  بزرگ‌تر جابه‌جا شوند از `--bump minor|major` استفاده کنید.
- `--dry-run` برنامه انتشار را بدون بارگذاری نشان می‌دهد؛ `--json` یک برنامه
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--all` هر مهارت جدید یا تغییریافته را بدون اعلان منتشر می‌کند. بدون
  `--all`، ترمینال‌های تعاملی اجازه می‌دهند Skills موردنظر برای انتشار را انتخاب کنید.
- `--owner <handle>` زمانی که actor دسترسی ناشر داشته باشد، زیر handle ناشر سازمان/کاربر
  منتشر می‌کند.
- `sync` فقط انتشار یک‌طرفه است. نصب، به‌روزرسانی، دانلود، یا
  گزارش telemetry نصب/دانلود انجام نمی‌دهد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- به `clawhub login` نیاز دارد.
- ClawHub ClawScan را از طریق `POST /api/v1/skills/-/scan` اجرا می‌کند، سپس تا زمانی که اسکن terminal شود poll می‌کند.
- اسکن‌ها asynchronous هستند و ممکن است تکمیل آن‌ها زمان ببرد. هنگام queued بودن، spinner ترمینال موقعیت فعلی اولویت‌بندی‌شده اسکن و تعداد اسکن‌های جلوتر را نشان می‌دهد.
- اسکن‌های منتشرشده به مالکیت یا دسترسی مدیریت ناشر نیاز دارند. moderators/admins می‌توانند از همان backend از طریق `clawhub-admin` استفاده کنند.
- `--update` فقط با `--slug` معتبر است؛ نتایج موفق اسکن منتشرشده را به نسخه انتخاب‌شده بازمی‌نویسد.
- `--output <file.zip>` آرشیو کامل گزارش را با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` دانلود می‌کند.
- `--json` پاسخ کامل poll را برای automation چاپ می‌کند.
- اسکن‌های مسیر محلی دیگر پشتیبانی نمی‌شوند. یک نسخه جدید upload کنید، سپس از `scan download` برای بازیابی نتایج اسکن ذخیره‌شده برای آن نسخه ارسال‌شده استفاده کنید.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- به `clawhub login` نیاز دارد.
- ZIP گزارش اسکن ذخیره‌شده را برای یک نسخه مهارت یا Plugin ارسال‌شده دانلود می‌کند، شامل نسخه‌هایی که توسط بررسی‌های امنیتی ClawHub blocked یا hidden شده‌اند.
- دانلودهای مهارت از slug مهارت استفاده می‌کنند و به‌صورت پیش‌فرض `--kind skill` هستند.
- دانلودهای Plugin از نام بسته استفاده می‌کنند و به `--kind plugin` نیاز دارند.
- `--version` لازم است تا نویسندگان همان نسخه دقیق ارسال‌شده‌ای را که ClawHub blocked کرده است بررسی کنند.
- `--output <file.zip>` مسیر مقصد را انتخاب می‌کند.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub یک workflow رسمی قابل‌استفاده‌مجدد را در
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/2ef5aebc5d2f78630d6fc8fedb7d4e829cf83532/.github/workflows/skill-publish.yml)
برای repoهای مهارت و repoهای catalog ارائه می‌کند.

راه‌اندازی معمول catalog:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

نکته‌ها:

- `root` برای repoهای catalog به‌صورت پیش‌فرض `skills` است.
- برای پردازش یک پوشه مهارت، `skill_path: skills/review-helper` را پاس بدهید.
- `owner` به پرچم CLI با نام `--owner` نگاشت می‌شود؛ برای انتشار به‌عنوان کاربر احراز هویت‌شده آن را حذف کنید.
- انتشار مهارت V1 از `clawhub_token` استفاده می‌کند؛ انتشار مورد اعتماد GitHub OIDC فعلاً فقط برای بسته‌ها است.

### `delete <skill>`

- بدون `--version`، یک مهارت را به‌صورت حذف نرم حذف کنید (مالک، ناظر، یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--version <version>` یک نسخه غیرآخرینِ متعلق به شما را از طریق یک مسیر fail-closed و
  مخصوص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخه فعلیِ آخرین، یک جایگزین منتشر کنید.
  کارکنان پلتفرم برای این جریان فقط-نسخه‌ای مالکیت را دور نمی‌زنند.
- `--reason <text>` یک یادداشت نظارتی را روی حذف نرم کل مهارت و لاگ حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <skill>`

- یک مهارت پنهان را بازیابی کنید (مالک، ناظر، یا مدیر).
- بازیابی حذف برای نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی را روی مهارت و لاگ حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <skill>`

- یک مهارت را پنهان کنید (مالک، ناظر، یا مدیر).
- نام مستعار `delete`.

### `unhide <skill>`

- یک مهارت را از حالت پنهان خارج کنید (مالک، ناظر، یا مدیر).
- نام مستعار `undelete`.

### `skill rename <skill> <new-name>`

- یک مهارت متعلق به خود را تغییر نام دهید و slug قبلی را به‌عنوان نام مستعار تغییرمسیر نگه دارید.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source> <target>`

- یک مهارت متعلق به خود را در مهارت متعلق به خود دیگری ادغام کنید.
- slug منبع دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال به handleهای کاربری یک درخواست در انتظار ایجاد می‌کند که گیرنده آن را می‌پذیرد.
- انتقال به handleهای org/publisher فقط وقتی فوراً اعمال می‌شود که عامل به هر دو ناشرِ مالک فعلی و مقصد
  دسترسی مدیر داشته باشد.
- زیرفرمان‌ها:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- نقطه‌های پایانی:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- کاتالوگ یکپارچه بسته را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای Pluginها و ورودی‌های دیگر خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی مهارت باقی می‌ماند.
- پرچم‌ها:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (۱-۱۰۰، پیش‌فرض: ۲۵)
  - `--json`

مثال‌ها:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- فراداده بسته را بدون نصب واکشی می‌کند.
- از این برای فراداده Plugin، سازگاری، راستی‌آزمایی، منبع، و بررسی نسخه/فایل استفاده کنید.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: آخرین).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌ها برای فهرست کردن (۱-۱۰۰).
- `--files`: فهرست فایل‌های نسخه انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` حل می‌کند.
- artifact را از `downloadUrl` حل‌کننده دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، یکپارچگی `sha512` مربوط به npm،
  shasum مربوط به npm، و نام/نسخه `package.json` در tarball را نیز راستی‌آزمایی می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: دانلود یک نسخه مشخص.
  - `--tag <tag>`: دانلود یک نسخه برچسب‌خورده (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: بازنویسی فایل خروجی موجود.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 مربوط به ClawHub، یکپارچگی `sha512` مربوط به npm، و shasum مربوط به npm را برای یک
  artifact محلی محاسبه می‌کند.
- با `--package`، فراداده موردانتظار را از ClawHub حل می‌کند و فایل
  محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون جست‌وجوی شبکه‌ای راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای حل فراداده artifact موردانتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه بسته موردانتظار.
  - `--sha256 <hex>`: SHA-256 موردانتظار ClawHub.
  - `--npm-integrity <sri>`: یکپارچگی موردانتظار npm.
  - `--npm-shasum <sha1>`: shasum موردانتظار npm.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Plugin Inspector همراه CLI مربوط به ClawHub را روی پوشه بسته Plugin محلی اجرا می‌کند.
- پیش‌فرض، اعتبارسنجی آفلاین/ایستا است، بدون یافتن یا import کردن checkout محلی
  OpenClaw.
- خطاهای سخت سازگاری با کد غیرصفر خارج می‌شوند. یافته‌های فقط-هشدار چاپ می‌شوند اما
  با کد صفر خارج می‌شوند.
- پرچم‌ها:
  - `--out <dir>`: گزارش‌های Plugin Inspector را در این دایرکتوری بنویسید.
  - `--openclaw <path>`: در برابر یک checkout محلی صریح OpenClaw بررسی کنید.
  - `--runtime`: ضبط runtime را فعال کنید؛ کد Plugin را import می‌کند.
  - `--allow-execute`: ضبط runtime را در یک فضای کاری ایزوله مجاز کنید.
  - `--no-mock-sdk`: OpenClaw SDK شبیه‌سازی‌شده را هنگام ضبط runtime غیرفعال کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package validate ./example-plugin
```

اگر اعتبارسنجی یک یافته مربوط به بسته، manifest، import SDK، یا artifact گزارش کرد، به
[رفع‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید، سپس فرمان را دوباره اجرا کنید.

### `package delete <name>`

- بدون `--version`، یک بسته و همه releaseهای آن را به‌صورت حذف نرم حذف می‌کند.
- `--version <version>` یک release غیرآخرینِ متعلق به شما را از طریق یک مسیر fail-closed و
  مخصوص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخه فعلیِ آخرین، یک جایگزین منتشر کنید.
  این جریان فقط-نسخه‌ای به مالک بسته یا مدیر ناشر org نیاز دارد؛ کارکنان پلتفرم مالکیت بسته را دور نمی‌زنند.
- حذف نرم کل بسته به مالک بسته، مالک/مدیر ناشر org، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--version <version>`: حذف دائمی یک نسخه غیرآخرین.
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- یک بسته و releaseهای حذف‌نرم‌شده را بازیابی می‌کند.
- بازیابی حذف برای نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- به مالک بسته، مالک/مدیر ناشر org، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به هر دو ناشرِ مالک فعلی بسته و مقصد نیاز دارد،
  مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته scoped باید به مالک scope مطابق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: handle ناشر مقصد.
  - `--reason <text>`: دلیل حسابرسی اختیاری.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احرازهویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه مرتبط شوند، و برای
  بازبینی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی نمایانی نظارتی بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت نظارت دستی آخرین release،
  وضعیت مسدودسازی دانلود، و دلایل نظارت را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌های وضعیت رسمی، دسترس‌پذیری ClawPack، digest مربوط به artifact،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فراداده محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت متمرکز بر اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان نقطه پایانی readiness محاسبه‌شده را مانند `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- یک ناشر org متعلق به کاربر احرازهویت‌شده ایجاد می‌کند.
- handle به حروف کوچک نرمال‌سازی می‌شود و می‌تواند با یا بدون `@` ارسال شود.
- ناشران org تازه‌ساخته‌شده به‌صورت پیش‌فرض trusted/official نیستند.
- اگر handle از قبل توسط یک ناشر، کاربر، یا مسیر رزروشده موجود استفاده شده باشد، شکست می‌خورد.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال محلی ClawPack از نوع npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL در GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI همان بایت‌های دقیق npm-pack
  را بارگذاری می‌کند و فقط برای اعتبارسنجی و پیش‌پر کردن فراداده از محتوای استخراج‌شده `package/`
  استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک تاربال npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند مصنوع دقیق را تأیید کنند. پوشه‌های Plugin بسته همچنان
  از مسیر انتشار فایل‌های استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، کامیت حل‌شده، ref، و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ git محلی به GitHub اشاره کند، انتساب منبع به‌صورت خودکار تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صراحتاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` محموله انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل خواندن توسط ماشین برای CI تولید می‌کند.
- `--owner <handle>` زمانی که کنشگر دسترسی ناشر داشته باشد، زیر شناسه ناشر کاربر یا سازمان منتشر می‌کند.
- نام‌های بسته scoped باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- flagهای موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخزن‌های خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ساختن یک انتشار زنده،
فراداده بسته حل‌شده و انتساب منبع را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای Pluginهای کد، انتشار پوشه یک مصنوع ClawPack را از
پوشه بسته می‌سازد و بارگذاری می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

Pluginهای کد خارجی به مقدار کمی فراداده OpenClaw در
`package.json` نیاز دارند. این manifest حداقلی برای یک انتشار موفق کافی است:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

فیلدهای الزامی:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

نکات:

- `package.json.version` نسخه انتشار بسته شماست، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` افزوده‌های اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار آن را ارتقا دهید تا
  بررسی‌های پیش‌پرواز محلی پیش از بارگذاری اجرا شوند.
- اگر اعتبارسنجی یک کد اصلاح گزارش کرد، به
  [اصلاحات اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید.

#### GitHub Actions

ClawHub همچنین یک گردش‌کار رسمی قابل استفاده مجدد را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ef5aebc5d2f78630d6fc8fedb7d4e829cf83532/.github/workflows/package-publish.yml)
برای مخزن‌های Plugin ارائه می‌کند.

راه‌اندازی معمول caller:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

نکات:

- گردش‌کار قابل استفاده مجدد به‌صورت پیش‌فرض `source` را روی مخزن caller می‌گذارد.
- برای monorepoها، `source_path` را پاس دهید تا گردش‌کار پوشه بسته Plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- گردش‌کار قابل استفاده مجدد را به یک tag پایدار یا SHA کامل کامیت pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی باقی بماند.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های غیرمورداعتماد، یا انتشارهای اضطراری در دسترس نگه دارید.
- گردش‌کار نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های گردش‌کار ارائه می‌دهد.

### `package trusted-publisher get <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک بسته نشان می‌دهد.
- پس از تنظیم پیکربندی از این استفاده کنید تا مخزن، نام فایل گردش‌کار،
  و pin اختیاری environment را تأیید کنید.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک بسته موجود
  متصل یا جایگزین می‌کند.
- بسته ابتدا باید از طریق `clawhub package publish` معمولی دستی یا احراز هویت‌شده با token
  ساخته شده باشد.
- پس از تنظیم پیکربندی، انتشارهای پشتیبانی‌شده بعدی از GitHub Actions می‌توانند از
  OIDC/انتشار مورد اعتماد بدون token بلندمدت ClawHub استفاده کنند.
- `--repository <repo>` باید `owner/repo` باشد.
- `--workflow-filename <file>` باید با نام فایل گردش‌کار در
  `.github/workflows/` مطابقت داشته باشد.
- `--environment <name>` اختیاری است. وقتی پیکربندی شود، environment در GitHub Actions
  در claim مربوط به OIDC باید دقیقاً مطابقت داشته باشد.
- ClawHub هنگام اجرای این دستور، مخزن GitHub پیکربندی‌شده را تأیید می‌کند.
  مخزن‌های عمومی را می‌توان از طریق فراداده عمومی GitHub تأیید کرد. مخزن‌های خصوصی
  نیاز دارند ClawHub به آن مخزن دسترسی GitHub داشته باشد، برای
  مثال از طریق نصب آینده ClawHub GitHub App یا یک یکپارچه‌سازی مجاز دیگر
  با GitHub.
- flagها:
  - `--repository <repo>`: مخزن GitHub، برای مثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: نام فایل گردش‌کار، برای مثال `package-publish.yml`.
  - `--environment <name>`: environment اختیاری GitHub Actions با تطابق دقیق.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- پیکربندی ناشر مورد اعتماد را از یک بسته حذف می‌کند.
- اگر لازم است pin گردش‌کار، مخزن، یا environment غیرفعال یا دوباره ایجاد شود، از این به‌عنوان rollback استفاده کنید.
- انتشارهای واقعی آینده باید تا زمانی که پیکربندی دوباره تنظیم شود، از انتشار احراز هویت‌شده معمولی استفاده کنند.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry نصب

- پس از `clawhub install <slug>` هنگام ورود به حساب ارسال می‌شود، مگر اینکه
  `CLAWHUB_DISABLE_TELEMETRY=1` تنظیم شده باشد.
- گزارش‌دهی بر اساس best-effort است. اگر telemetry
  در دسترس نباشد، دستورهای نصب fail نمی‌شوند.
- جزئیات: `docs/telemetry.md`.
