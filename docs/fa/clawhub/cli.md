---
read_when:
    - استفاده از CLI مربوط به ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی یا انتشار
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی و رفتار lockfile.'
x-i18n:
    generated_at: "2026-06-28T00:10:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

بسته CLI: `clawhub`، فایل اجرایی: `clawhub`.

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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد، به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال‌کردن اعلان‌ها

معادل‌های محیطی:

- `CLAWHUB_SITE` (`CLAWDHUB_SITE` قدیمی)
- `CLAWHUB_REGISTRY` (`CLAWDHUB_REGISTRY` قدیمی)
- `CLAWHUB_WORKDIR` (`CLAWDHUB_WORKDIR` قدیمی)

### پروکسی HTTP

CLI متغیرهای محیطی استاندارد پروکسی HTTP را برای سیستم‌هایی که پشت
پروکسی‌های سازمانی یا شبکه‌های محدود هستند رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پروکسی مشخص‌شده عبور می‌دهد. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دورزدن پروکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این مورد روی سیستم‌هایی لازم است که اتصال خروجی مستقیم در آن‌ها مسدود شده است
(برای مثال کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پروکسی،
فایروال‌های سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پروکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال مستقیم).

## فایل پیکربندی

توکن API شما + URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- جایگزین قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` قدیمی)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را روی `<site>/cli/auth` باز می‌کند و از طریق callback در local loopback کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی از راه دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `token`

- توکن API ذخیره‌شده را در stdout چاپ می‌کند.
- برای pipe کردن توکن ورود محلی به فرمان‌های راه‌اندازی secret در CI مفید است.

### `star <skill>` / `unstar <skill>`

- یک مهارت را به برجسته‌های شما اضافه می‌کند یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- خروجی شامل slug مهارت، handle مالک، نام نمایشی، و امتیاز ارتباط است.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق می‌یابد.
- محبوبیت یک پیش‌فرض رتبه‌بندی کوچک است، نه تضمین جایگاه اول.
- اگر مهارتی باید نمایش داده شود اما نمی‌شود، هنگام ورود، `clawhub inspect @owner/slug` را اجرا کنید تا پیش از تغییر نام metadata، عیب‌یابی‌های moderation قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (مرتب‌شده بر اساس `createdAt` نزولی).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|rating|downloads|trending` (پیش‌فرض: newest). aliasهای قدیمی مرتب‌سازی نصب همچنان برای سازگاری کار می‌کنند.
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (summary تا 50 نویسه کوتاه می‌شود).

### `inspect @owner/slug`

- metadata مهارت و فایل‌های نسخه را بدون نصب واکشی می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: آخرین).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (برای مثال `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌ها برای فهرست‌کردن (1-200).
- `--files`: فهرست فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install @owner/slug`

- آخرین نسخه را برای مالک و مهارت نام‌برده resolve می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pin شده خودداری می‌کند؛ ابتدا `clawhub unpin <skill>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- هنگام ورود، telemetry را به‌صورت best-effort ارسال می‌کند تا شمار نصب‌های فعلی
  غیرفعال شوند.
- تعاملی: تأیید می‌خواهد.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی) را می‌خواند.
- `pinned` را کنار مهارت‌هایی نشان می‌دهد که با `clawhub pin` ثابت شده‌اند، از جمله دلیل اختیاری.

### `pin <skill>`

- یک مهارت نصب‌شده را در lockfile به‌عنوان pin شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا مهارت ثابت شده است.
- مهارت‌های pin شده توسط `update --all` رد می‌شوند و توسط `update <skill>` مستقیم پذیرفته نمی‌شوند.
- مهارت‌های pin شده همچنین `install --force` را رد می‌کنند تا byteهای محلی تصادفی جایگزین نشوند.

### `unpin <skill>`

- pin مربوط به lockfile را از یک مهارت نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [@owner/slug]` / `update --all`

- fingerprint را از فایل‌های محلی محاسبه می‌کند.
- اگر fingerprint با یک نسخه شناخته‌شده تطابق داشته باشد: هیچ اعلان داده نمی‌شود.
- اگر fingerprint تطابق نداشته باشد:
  - به‌صورت پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، اعلان می‌دهد)
- مهارت‌های pin شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <skill>` برای مهارت‌های pin شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <skill>` را اجرا کنید.
- `update --all` از slugهای pin شده عبور می‌کند و خلاصه‌ای از مواردی که ثابت مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- fingerprint بسته محلی را با ClawHub مقایسه می‌کند و وقتی
  محتوا از قبل منتشر شده باشد با موفقیت خارج می‌شود.
- مهارت‌های جدید به‌صورت پیش‌فرض `1.0.0` هستند؛ مهارت‌های تغییریافته به‌صورت پیش‌فرض به نسخه patch بعدی
  می‌روند.
- `--version <version>` یک نسخه را صراحتاً انتخاب می‌کند و حتی وقتی
  محتوا با یک نسخه موجود تطابق داشته باشد منتشر می‌کند.
- `--dry-run` انتشار را بدون upload resolve می‌کند؛ `--json` یک نتیجه
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--owner <handle>` وقتی actor دسترسی publisher داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک مهارت موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو publisher نیاز دارد.
- رفتار مالک و review در `docs/publishing.md` توضیح داده شده است.
- انتشار یک مهارت یعنی آن مهارت تحت `MIT-0` در ClawHub منتشر می‌شود.
- مهارت‌های منتشرشده را می‌توان بدون attribution به‌صورت رایگان استفاده، تغییر، و بازتوزیع کرد.
- ClawHub از مهارت‌های پولی یا قیمت‌گذاری جداگانه برای هر مهارت پشتیبانی نمی‌کند.
- alias قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow قابل استفاده مجدد ClawHub با نام
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
برای یک `skill_path`، یا برای هر پوشه مهارت مستقیم
زیر `root` (پیش‌فرض: `skills`) فرمان `skill publish` را فراخوانی می‌کند. مهارت‌های بدون تغییر را رد می‌کند و از همان
رفتار خودکار نسخه patch استفاده می‌کند.

برای پیش‌نمایش بدون توکن، `dry_run: true` را تنظیم کنید. انتشار واقعی به
secret با نام `clawhub_token` نیاز دارد.

### `sync`

- workdir فعلی، دایرکتوری مهارت‌های پیکربندی‌شده، و هر پوشه
  `--root <dir>` را برای پوشه‌های مهارت محلی شامل `SKILL.md` یا
  `skill.md` اسکن می‌کند.
- fingerprint هر مهارت محلی را با ClawHub مقایسه می‌کند و فقط مهارت‌های جدید یا
  تغییریافته را منتشر می‌کند.
- مهارت‌های جدید به‌عنوان `1.0.0` منتشر می‌شوند؛ مهارت‌های تغییریافته به‌صورت پیش‌فرض نسخه patch بعدی
  را منتشر می‌کنند. برای batchهای به‌روزرسانی که باید با یک گام semver بزرگ‌تر حرکت کنند، از `--bump minor|major` استفاده کنید.
- `--dry-run` برنامه انتشار را بدون upload نشان می‌دهد؛ `--json` یک برنامه
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--all` هر مهارت جدید یا تغییریافته را بدون اعلان منتشر می‌کند. بدون
  `--all`، ترمینال‌های تعاملی اجازه می‌دهند مهارت‌های مورد انتشار را انتخاب کنید.
- `--owner <handle>` وقتی actor دسترسی publisher داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `sync` فقط انتشار یک‌طرفه است. نصب، به‌روزرسانی، دانلود، یا
  گزارش telemetry نصب/دانلود انجام نمی‌دهد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- به `clawhub login` نیاز دارد.
- ClawHub ClawScan را از طریق `POST /api/v1/skills/-/scan` اجرا می‌کند، سپس تا terminal شدن اسکن poll می‌کند.
- اسکن‌ها ناهمگام هستند و ممکن است تکمیل آن‌ها زمان ببرد. در حالت queued، spinner ترمینال جایگاه فعلی اسکن اولویت‌بندی‌شده و تعداد اسکن‌های جلوتر را نشان می‌دهد.
- اسکن‌های منتشرشده به مالکیت یا دسترسی مدیریت publisher نیاز دارند. moderatorها/adminها می‌توانند از همان backend از طریق `clawhub-admin` استفاده کنند.
- `--update` فقط با `--slug` معتبر است؛ نتیجه‌های موفق اسکن منتشرشده را دوباره در نسخه انتخاب‌شده می‌نویسد.
- `--output <file.zip>` آرشیو کامل گزارش را با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` دانلود می‌کند.
- `--json` پاسخ کامل poll را برای automation چاپ می‌کند.
- اسکن مسیر محلی دیگر پشتیبانی نمی‌شود. یک نسخه جدید upload کنید، سپس از `scan download` برای دریافت نتیجه‌های اسکن ذخیره‌شده برای آن نسخه ارسالی استفاده کنید.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- به `clawhub login` نیاز دارد.
- گزارش اسکن ZIP ذخیره‌شده را برای نسخه ارسالی یک مهارت یا Plugin دانلود می‌کند، از جمله نسخه‌هایی که توسط بررسی‌های امنیتی ClawHub مسدود یا پنهان شده‌اند.
- دانلودهای مهارت از slug مهارت استفاده می‌کنند و به‌صورت پیش‌فرض `--kind skill` هستند.
- دانلودهای Plugin از نام بسته استفاده می‌کنند و به `--kind plugin` نیاز دارند.
- `--version` لازم است تا authors نسخه ارسالی دقیقی را که ClawHub مسدود کرده است بررسی کنند.
- `--output <file.zip>` مسیر مقصد را انتخاب می‌کند.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub یک workflow رسمی قابل استفاده مجدد را در
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
برای مخازن مهارت و مخازن catalog ارائه می‌کند.

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

- `root` برای مخازن catalog به‌صورت پیش‌فرض `skills` است.
- برای پردازش یک پوشه مهارت، `skill_path: skills/review-helper` را پاس دهید.
- `owner` به پرچم CLI با نام `--owner` نگاشت می‌شود؛ برای انتشار به‌عنوان کاربر احراز هویت‌شده آن را حذف کنید.
- انتشار مهارت V1 از `clawhub_token` استفاده می‌کند؛ انتشار trusted با GitHub OIDC فعلاً فقط برای بسته‌هاست.

### `delete <skill>`

- بدون `--version`، یک مهارت را soft-delete کنید (مالک، ناظر، یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--version <version>` یک نسخه غیرآخرینِ تحت مالکیت را از طریق یک مسیر fail-closed
  و مختص نسخه، به‌طور دائمی حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخه فعلیِ latest،
  یک جایگزین منتشر کنید. کارکنان پلتفرم برای این جریان فقط-نسخه، مالکیت را دور نمی‌زنند.
- `--reason <text>` یک یادداشت نظارتی را روی soft-delete کل مهارت و گزارش حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <skill>`

- یک مهارت پنهان را بازیابی کنید (مالک، ناظر، یا مدیر).
- undelete نسخه وجود ندارد؛ نسخه‌هایی که به‌طور دائمی حذف شده‌اند قابل بازیابی نیستند.
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی را روی مهارت و گزارش حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <skill>`

- یک مهارت را پنهان کنید (مالک، ناظر، یا مدیر).
- نام مستعار `delete` است.

### `unhide <skill>`

- یک مهارت را از حالت پنهان خارج کنید (مالک، ناظر، یا مدیر).
- نام مستعار `undelete` است.

### `skill rename <skill> <new-name>`

- یک مهارت تحت مالکیت را تغییر نام دهید و slug قبلی را به‌عنوان نام مستعار تغییرمسیر نگه دارید.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source> <target>`

- یک مهارت تحت مالکیت را در مهارت تحت مالکیت دیگری ادغام کنید.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به شناسه‌های کاربری یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به شناسه‌های سازمان/ناشر فقط زمانی بلافاصله اعمال می‌شوند که عامل
  به مالک فعلی و ناشر مقصد هر دو دسترسی مدیر داشته باشد.
- زیرفرمان‌ها:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- endpointها:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- کاتالوگ یکپارچه بسته را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای pluginها و دیگر ورودی‌های خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی مهارت است.
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

نمونه‌ها:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- فراداده بسته را بدون نصب واکشی می‌کند.
- از این برای فراداده plugin، سازگاری، راستی‌آزمایی، منبع، و بازرسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بازرسی کنید (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بازرسی کنید (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست کنید (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌ها برای فهرست‌کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست کنید.
- `--file <path>`: محتوای خام فایل را واکشی کنید (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` مربوط به resolver دانلود می‌کند.
- ClawHub SHA-256 را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، یکپارچگی npm `sha512`،
  npm shasum، و نام/نسخه `package.json` در tarball را نیز راستی‌آزمایی می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود کنید.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود کنید (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ClawHub SHA-256، یکپارچگی npm `sha512`، و npm shasum را برای یک
  artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub resolve می‌کند و
  فایل محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون جست‌وجوی شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای resolve کردن فراداده artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه بسته مورد انتظار.
  - `--sha256 <hex>`: ClawHub SHA-256 مورد انتظار.
  - `--npm-integrity <sri>`: یکپارچگی npm مورد انتظار.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Plugin Inspector همراه ClawHub CLI را روی پوشه بسته plugin محلی
  اجرا می‌کند.
- به‌صورت پیش‌فرض، اعتبارسنجی آفلاین/ایستا انجام می‌دهد، بدون مکان‌یابی یا import کردن یک checkout محلی
  OpenClaw.
- خطاهای سخت سازگاری با کد خروج غیرصفر خارج می‌شوند. یافته‌های فقط-هشدار چاپ می‌شوند اما
  با کد صفر خارج می‌شوند.
- پرچم‌ها:
  - `--out <dir>`: گزارش‌های Plugin Inspector را در این دایرکتوری بنویسید.
  - `--openclaw <path>`: در برابر یک checkout محلی صریح OpenClaw بازرسی کنید.
  - `--runtime`: ضبط runtime را فعال کنید؛ کد plugin را import می‌کند.
  - `--allow-execute`: ضبط runtime را در یک فضای کاری ایزوله مجاز کنید.
  - `--no-mock-sdk`: SDK شبیه‌سازی‌شده OpenClaw را هنگام ضبط runtime غیرفعال کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package validate ./example-plugin
```

اگر اعتبارسنجی یک یافته بسته، manifest، import SDK، یا artifact گزارش کرد، به
[رفع‌های اعتبارسنجی Plugin](/fa/clawhub/plugin-validation-fixes) مراجعه کنید، سپس فرمان را دوباره اجرا کنید.

### `package delete <name>`

- بدون `--version`، یک بسته و همه releaseها را soft-delete می‌کند.
- `--version <version>` یک release غیرآخرینِ تحت مالکیت را از طریق یک مسیر fail-closed
  و مختص نسخه، به‌طور دائمی حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخه فعلیِ latest،
  یک جایگزین منتشر کنید. این جریان فقط-نسخه به مالک بسته یا مدیر ناشر سازمانی نیاز دارد؛
  کارکنان پلتفرم مالکیت بسته را دور نمی‌زنند.
- soft-delete کل بسته به مالک بسته، مالک/مدیر ناشر سازمانی، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--version <version>`: یک نسخه غیرآخرین را به‌طور دائمی حذف کنید.
  - `--yes`: تأیید را رد کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- یک بسته و releaseهای soft-deleted را بازیابی می‌کند.
- undelete نسخه وجود ندارد؛ نسخه‌هایی که به‌طور دائمی حذف شده‌اند قابل بازیابی نیستند.
- به مالک بسته، مالک/مدیر ناشر سازمانی، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: تأیید را رد کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به مالک فعلی بسته و ناشر مقصد هر دو نیاز دارد،
  مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته scoped باید به مالک scope مطابق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه ناشر مقصد.
  - `--reason <text>`: دلیل حسابرسی اختیاری.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احرازهویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند اختیاری به یک نسخه وابسته باشند، و برای
  ناظران جهت بررسی قابل مشاهده می‌شوند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست به گزارش.
  - `--reason <text>`: دلیل گزارش الزامی.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی نظارتی بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، شمار گزارش‌های باز، وضعیت نظارت دستی آخرین release،
  وضعیت مسدودی دانلود، و دلایل نظارتی را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌ها را برای وضعیت رسمی، در دسترس بودن ClawPack، digest artifact،
  منشأ منبع، سازگاری OpenClaw، هدف‌های میزبان، فراداده محیط،
  و وضعیت اسکن گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت اپراتورمحور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  plugin همراه OpenClaw شود.
- همان endpoint آمادگی محاسبه‌شده `package readiness` را فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- یک ناشر سازمانی تحت مالکیت کاربر احرازهویت‌شده ایجاد می‌کند.
- شناسه به حروف کوچک نرمال‌سازی می‌شود و می‌تواند با یا بدون `@` ارسال شود.
- ناشران سازمانی تازه‌ساخته‌شده به‌صورت پیش‌فرض trusted/official نیستند.
- اگر شناسه از قبل توسط یک ناشر، کاربر، یا مسیر رزرو‌شده موجود استفاده شده باشد، شکست می‌خورد.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - فایل tarball محلی ClawPack ساخته‌شده با npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL مربوط به GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json` و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json` و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI بایت‌های دقیق npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پرکردن فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری، به یک فایل tarball npm مربوط به ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند مصنوع دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل‌های استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، commit حل‌شده، ref و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صراحتاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` پیش‌نمایشی از بار انتشار حل‌شده را بدون بارگذاری نشان می‌دهد.
- `--json` خروجی قابل‌خواندن توسط ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` زمانی که عامل دسترسی ناشر داشته باشد، زیر handle ناشر کاربر یا سازمان منتشر می‌کند.
- نام‌های بسته scoped باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید فراداده بسته حل‌شده و
انتساب منبع را پیش از ایجاد یک انتشار واقعی تأیید کنید:

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
`package.json` نیاز دارند. این manifest حداقلی برای انتشار موفق کافی است:

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
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند، اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از یک نسخه قدیمی‌تر CLI مربوط به `clawhub` استفاده می‌کنید، پیش از انتشار آن را ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.
- اگر اعتبارسنجی یک کد اصلاح گزارش کرد، به
  [اصلاحات اعتبارسنجی Plugin](/fa/clawhub/plugin-validation-fixes) مراجعه کنید.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل‌استفاده مجدد را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
برای مخازن Plugin ارائه می‌کند.

راه‌اندازی معمول فراخوان:

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

- workflow قابل‌استفاده مجدد به‌صورت پیش‌فرض `source` را روی مخزن فراخوان تنظیم می‌کند.
- برای monorepoها، `source_path` را ارسال کنید تا workflow پوشه بسته Plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفاده مجدد را به یک tag پایدار یا SHA کامل commit ثابت کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI غیرآلوده باقی بماند.
- انتشارهای واقعی باید به رویدادهای قابل‌اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار قابل‌اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های غیرقابل‌اعتماد، یا انتشارهای اضطراری در دسترس نگه دارید.
- این workflow نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در معرض قرار می‌دهد.

### `package trusted-publisher get <name>`

- پیکربندی ناشر قابل‌اعتماد GitHub Actions را برای یک بسته نشان می‌دهد.
- پس از تنظیم پیکربندی از این استفاده کنید تا مخزن، نام فایل workflow
  و pin اختیاری environment را تأیید کنید.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- پیکربندی ناشر قابل‌اعتماد GitHub Actions را برای یک بسته موجود
  متصل یا جایگزین می‌کند.
- بسته باید ابتدا از طریق `clawhub package publish` عادی دستی یا احراز‌شده با token
  ایجاد شده باشد.
- پس از تنظیم پیکربندی، انتشارهای پشتیبانی‌شده آینده GitHub Actions می‌توانند از
  OIDC/انتشار قابل‌اعتماد بدون token بلندمدت ClawHub استفاده کنند.
- `--repository <repo>` باید `owner/repo` باشد.
- `--workflow-filename <file>` باید با نام فایل workflow در
  `.github/workflows/` مطابقت داشته باشد.
- `--environment <name>` اختیاری است. وقتی پیکربندی شود، environment مربوط به GitHub Actions
  در claim مربوط به OIDC باید دقیقاً مطابقت داشته باشد.
- ClawHub هنگام اجرای این فرمان، مخزن پیکربندی‌شده GitHub را تأیید می‌کند.
  مخازن عمومی را می‌توان از طریق فراداده عمومی GitHub تأیید کرد. مخازن خصوصی
  نیاز دارند ClawHub به آن مخزن دسترسی GitHub داشته باشد، برای
  مثال از طریق نصب آینده GitHub App مربوط به ClawHub یا یکپارچه‌سازی مجاز دیگر
  با GitHub.
- پرچم‌ها:
  - `--repository <repo>`: مخزن GitHub، برای مثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: نام فایل workflow، برای مثال `package-publish.yml`.
  - `--environment <name>`: environment اختیاری GitHub Actions با تطابق دقیق.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- پیکربندی ناشر قابل‌اعتماد را از یک بسته حذف می‌کند.
- اگر workflow، مخزن یا pin مربوط به environment نیاز به
  غیرفعال‌سازی یا ایجاد دوباره داشته باشد، از این به‌عنوان rollback استفاده کنید.
- انتشارهای واقعی آینده باید تا زمانی که پیکربندی دوباره تنظیم شود از انتشار احرازشده عادی استفاده کنند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### telemetry نصب

- پس از `clawhub install <slug>` هنگام ورود به سیستم ارسال می‌شود، مگر اینکه
  `CLAWHUB_DISABLE_TELEMETRY=1` تنظیم شده باشد.
- گزارش‌دهی به‌صورت best-effort است. اگر telemetry
  در دسترس نباشد، فرمان‌های نصب شکست نمی‌خورند.
- جزئیات: `docs/telemetry.md`.
