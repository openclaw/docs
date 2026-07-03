---
read_when:
    - استفاده از CLI مربوط به ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، یا انتشار
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، و رفتار فایل قفل.'
x-i18n:
    generated_at: "2026-07-03T09:45:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
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
- `--site <url>`: نشانی پایه برای ورود مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: نشانی پایه API (پیش‌فرض: کشف‌شده، وگرنه `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های متغیر محیطی:

- `CLAWHUB_SITE` (`CLAWDHUB_SITE` قدیمی)
- `CLAWHUB_REGISTRY` (`CLAWDHUB_REGISTRY` قدیمی)
- `CLAWHUB_WORKDIR` (`CLAWDHUB_WORKDIR` قدیمی)

### پروکسی HTTP

CLI برای سیستم‌هایی که پشت پروکسی‌های سازمانی یا شبکه‌های محدود هستند، متغیرهای محیطی استاندارد پروکسی HTTP را رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق پروکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY` برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دور زدن پروکسی برای میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این در سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم مسدود شده‌اند (برای مثال کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پروکسی، دیوارهای آتش سازمانی).

نمونه:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پروکسی تنظیم نشده باشد، رفتار تغییری نمی‌کند (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما + نشانی رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` قدیمی)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را در `<site>/cli/auth` باز می‌کند و از طریق callback حلقه بازگشتی کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی دوردست/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و تا وقتی آن را در `<site>/cli/device` مجاز کنید منتظر می‌ماند.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `token`

- توکن API ذخیره‌شده را در stdout چاپ می‌کند.
- برای لوله‌کردن یک توکن ورود محلی به فرمان‌های تنظیم secret در CI مفید است.

### `star <skill>` / `unstar <skill>`

- یک مهارت را به برجسته‌های شما اضافه می‌کند یا از آن‌ها برمی‌دارد.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- خروجی شامل اسلاگ مهارت، شناسه مالک، نام نمایشی، و امتیاز مرتبط‌بودن است.
- جست‌وجو تطابق‌های دقیق توکن اسلاگ/نام را پیش از محبوبیت دانلود ترجیح می‌دهد. یک توکن مستقل اسلاگ مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- محبوبیت فقط یک پیش‌فرض رتبه‌بندی کوچک است، نه تضمینی برای جایگاه اول.
- اگر مهارتی باید نمایش داده شود اما نمی‌شود، هنگام ورود، `clawhub inspect @owner/slug` را اجرا کنید تا پیش از تغییر نام فراداده، تشخیص‌های moderation قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt`).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|rating|downloads|trending` (پیش‌فرض: newest). نام‌های مستعار مرتب‌سازی نصب قدیمی هنوز برای سازگاری کار می‌کنند.
  - `--json` (خروجی خوانا برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه تا 50 نویسه کوتاه می‌شود).

### `inspect @owner/slug`

- فراداده مهارت و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: آخرین).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (برای مثال `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌هایی که فهرست می‌شوند (1-200).
- `--files`: فهرست فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی خوانا برای ماشین.

### `install @owner/slug`

- آخرین نسخه را برای مالک و مهارت نام‌گذاری‌شده حل می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pin‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <skill>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- هنگام ورود، telemetry را به‌صورت best-effort ارسال می‌کند تا شمارش نصب‌های فعلی بتوانند غیرفعال شوند.
- تعاملی: برای تأیید سؤال می‌پرسد.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی) را می‌خواند.
- کنار مهارت‌هایی که با `clawhub pin` منجمد شده‌اند، از جمله دلیل اختیاری، `pinned` را نشان می‌دهد.

### `pin <skill>`

- یک مهارت نصب‌شده را در lockfile به‌عنوان pin‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا مهارت منجمد شده است.
- مهارت‌های pin‌شده توسط `update --all` رد می‌شوند و توسط `update <skill>` مستقیم پذیرفته نمی‌شوند.
- مهارت‌های pin‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی تصادفی جایگزین نشوند.

### `unpin <skill>`

- pin موجود در lockfile را از یک مهارت نصب‌شده برمی‌دارد تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [@owner/slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابق باشد: اعلانی نمایش داده نمی‌شود.
- اگر اثرانگشت مطابق نباشد:
  - به‌صورت پیش‌فرض خودداری می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با اعلان)
- مهارت‌های pin‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <skill>` برای مهارت‌های pin‌شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <skill>` را اجرا کنید.
- `update --all` اسلاگ‌های pin‌شده را رد می‌کند و خلاصه‌ای از مواردی که منجمد باقی ماندند چاپ می‌کند.

### `skill publish <path>`

- اثرانگشت بسته محلی را با ClawHub مقایسه می‌کند و وقتی محتوا از قبل منتشر شده باشد با موفقیت خارج می‌شود.
- مهارت‌های جدید به‌صورت پیش‌فرض `1.0.0` هستند؛ مهارت‌های تغییریافته به‌صورت پیش‌فرض نسخه patch بعدی را می‌گیرند.
- `--version <version>` صراحتاً یک نسخه را انتخاب می‌کند و حتی وقتی محتوا با یک نسخه موجود مطابق باشد منتشر می‌کند.
- `--dry-run` انتشار را بدون بارگذاری حل می‌کند؛ `--json` نتیجه‌ای خوانا برای ماشین چاپ می‌کند.
- `--owner <handle>` وقتی کنشگر دسترسی ناشر داشته باشد، زیر شناسه ناشر سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، مهارت موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک مهارت یعنی آن مهارت در ClawHub تحت `MIT-0` منتشر می‌شود.
- مهارت‌های منتشرشده برای استفاده، تغییر، و بازتوزیع بدون انتساب آزاد هستند.
- ClawHub از مهارت‌های پولی یا قیمت‌گذاری جداگانه برای هر مهارت پشتیبانی نمی‌کند.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

گردش‌کار قابل استفاده مجدد ClawHub یعنی
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
برای یک `skill_path`، یا برای هر پوشه مهارت فوری زیر `root` (پیش‌فرض: `skills`) فرمان `skill publish` را فراخوانی می‌کند. مهارت‌های بدون تغییر را رد می‌کند و از همان رفتار خودکار نسخه patch استفاده می‌کند.

برای پیش‌نمایش بدون توکن، `dry_run: true` را تنظیم کنید. انتشار واقعی به secret با نام `clawhub_token` نیاز دارد.

### `sync`

- workdir فعلی، دایرکتوری مهارت‌های پیکربندی‌شده، و هر پوشه `--root <dir>` را برای پوشه‌های مهارت محلی که شامل `SKILL.md` یا `skill.md` هستند اسکن می‌کند.
- اثرانگشت هر مهارت محلی را با ClawHub مقایسه می‌کند و فقط مهارت‌های جدید یا تغییریافته را منتشر می‌کند.
- مهارت‌های جدید به‌صورت `1.0.0` منتشر می‌شوند؛ مهارت‌های تغییریافته به‌صورت پیش‌فرض نسخه patch بعدی را منتشر می‌کنند. برای دسته‌های به‌روزرسانی که باید با گام semver بزرگ‌تری حرکت کنند، از `--bump minor|major` استفاده کنید.
- `--dry-run` برنامه انتشار را بدون بارگذاری نشان می‌دهد؛ `--json` برنامه‌ای خوانا برای ماشین چاپ می‌کند.
- `--all` هر مهارت جدید یا تغییریافته را بدون اعلان منتشر می‌کند. بدون `--all`، ترمینال‌های تعاملی اجازه می‌دهند مهارت‌های قابل انتشار را انتخاب کنید.
- `--owner <handle>` وقتی کنشگر دسترسی ناشر داشته باشد، زیر شناسه ناشر سازمان/کاربر منتشر می‌کند.
- `sync` فقط انتشار یک‌طرفه است. نصب، به‌روزرسانی، دانلود، یا گزارش telemetry نصب/دانلود انجام نمی‌دهد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- به `clawhub login` نیاز دارد.
- ClawScan متعلق به ClawHub را از طریق `POST /api/v1/skills/-/scan` اجرا می‌کند، سپس تا وقتی اسکن terminal شود poll می‌کند.
- اسکن‌ها ناهمگام هستند و ممکن است تکمیلشان زمان ببرد. هنگام قرار داشتن در صف، spinner ترمینال جایگاه فعلی اسکن در اولویت و تعداد اسکن‌های جلوتر را نشان می‌دهد.
- اسکن‌های منتشرشده به مالکیت یا دسترسی مدیریت ناشر نیاز دارند. moderators/admins می‌توانند از همان backend از طریق `clawhub-admin` استفاده کنند.
- `--update` فقط همراه `--slug` معتبر است؛ نتایج موفق اسکن منتشرشده را دوباره روی نسخه انتخاب‌شده می‌نویسد.
- `--output <file.zip>` آرشیو گزارش کامل را با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` دانلود می‌کند.
- `--json` پاسخ کامل poll را برای automation چاپ می‌کند.
- اسکن‌های مسیر محلی دیگر پشتیبانی نمی‌شوند. یک نسخه جدید بارگذاری کنید، سپس از `scan download` برای بازیابی نتایج اسکن ذخیره‌شده برای آن نسخه ارسال‌شده استفاده کنید.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- به `clawhub login` نیاز دارد.
- ZIP گزارش اسکن ذخیره‌شده را برای یک نسخه مهارت یا Plugin ارسال‌شده دانلود می‌کند، از جمله نسخه‌هایی که توسط بررسی‌های امنیتی ClawHub مسدود یا پنهان شده‌اند.
- دانلودهای مهارت از اسلاگ مهارت استفاده می‌کنند و به‌صورت پیش‌فرض `--kind skill` هستند.
- دانلودهای Plugin از نام بسته استفاده می‌کنند و به `--kind plugin` نیاز دارند.
- `--version` لازم است تا نویسندگان همان نسخه ارسال‌شده‌ای را بررسی کنند که ClawHub مسدود کرده است.
- `--output <file.zip>` مسیر مقصد را انتخاب می‌کند.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub یک گردش‌کار رسمی قابل استفاده مجدد را در
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
برای مخازن مهارت و مخازن کاتالوگ ارائه می‌کند.

راه‌اندازی معمول کاتالوگ:

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

یادداشت‌ها:

- `root` برای مخازن کاتالوگ به‌صورت پیش‌فرض `skills` است.
- برای پردازش یک پوشه مهارت، `skill_path: skills/review-helper` را ارسال کنید.
- `owner` به پرچم CLI یعنی `--owner` نگاشت می‌شود؛ برای انتشار به‌عنوان کاربر احراز هویت‌شده آن را حذف کنید.
- انتشار مهارت V1 از `clawhub_token` استفاده می‌کند؛ انتشار مورد اعتماد GitHub OIDC فعلاً فقط برای بسته‌ها است.

### `delete <skill>`

- بدون `--version`، یک skill را به‌صورت نرم‌حذف حذف کنید (مالک، ناظر، یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم به ابتکار مالک، slug را به مدت ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--version <version>` یک نسخه غیرآخر متعلق به شما را از طریق یک مسیر fail-closed و
  مختص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده را نمی‌توان بازیابی یا دوباره منتشر کرد. پیش از حذف نسخه فعلی latest،
  یک جایگزین منتشر کنید. کارکنان پلتفرم در این جریان فقط-نسخه، مالکیت را دور نمی‌زنند.
- `--reason <text>` یک یادداشت نظارتی را روی حذف نرم کل skill و لاگ حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <skill>`

- یک skill پنهان را بازیابی کنید (مالک، ناظر، یا مدیر).
- undelete نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی را روی skill و لاگ حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <skill>`

- یک skill را پنهان کنید (مالک، ناظر، یا مدیر).
- نام مستعار `delete`.

### `unhide <skill>`

- یک skill را از حالت پنهان خارج کنید (مالک، ناظر، یا مدیر).
- نام مستعار `undelete`.

### `skill rename <skill> <new-name>`

- نام یک skill متعلق به شما را تغییر دهید و slug قبلی را به‌عنوان نام مستعار تغییرمسیر نگه دارید.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source> <target>`

- یک skill متعلق به شما را در skill دیگری که متعلق به شماست ادغام کنید.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال به handleهای کاربر، یک درخواست در انتظار ایجاد می‌کند که گیرنده آن را می‌پذیرد.
- انتقال به handleهای سازمان/ناشر فقط زمانی فوراً اعمال می‌شود که عامل به
  هر دو ناشر مالک فعلی و مقصد دسترسی مدیر داشته باشد.
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

- کاتالوگ یکپارچه بسته‌ها را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جستجو می‌کند.
- از این برای pluginها و سایر ورودی‌های خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جستجوی skill باقی می‌ماند.
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

- فراداده بسته را بدون نصب دریافت می‌کند.
- از این برای فراداده plugin، سازگاری، راستی‌آزمایی، منبع، و بررسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بررسی کنید (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بررسی کنید (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست کنید (صفحه اول).
- `--limit <n>`: بیشینه تعداد نسخه‌ها برای فهرست‌کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست کنید.
- `--file <path>`: محتوای خام فایل را دریافت کنید (فقط فایل‌های متنی؛ سقف ۲۰۰KB).
- `--json`: خروجی قابل خواندن برای ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` حل می‌کند.
- artifact را از `downloadUrl` حل‌کننده دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین یکپارچگی `sha512` متعلق به npm،
  shasum متعلق به npm، و نام/نسخه `package.json` تاربال را راستی‌آزمایی می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود کنید.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود کنید (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی کنید.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 مربوط به ClawHub، یکپارچگی `sha512` متعلق به npm، و shasum متعلق به npm را برای یک
  artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub حل می‌کند و فایل
  محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های مستقیم digest، بدون جستجوی شبکه‌ای راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای حل فراداده artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه مورد انتظار بسته.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: یکپارچگی مورد انتظار npm.
  - `--npm-shasum <sha1>`: shasum مورد انتظار npm.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Plugin Inspector همراه CLI متعلق به ClawHub را روی پوشه بسته plugin محلی اجرا می‌کند.
- پیش‌فرض آن اعتبارسنجی آفلاین/ایستا است، بدون پیدا کردن یا import کردن یک checkout محلی
  OpenClaw.
- خطاهای سخت سازگاری با کد غیرصفر خارج می‌شوند. یافته‌های فقط-هشدار چاپ می‌شوند اما
  با کد صفر خارج می‌شوند.
- پرچم‌ها:
  - `--out <dir>`: گزارش‌های Plugin Inspector را در این دایرکتوری بنویسید.
  - `--openclaw <path>`: در برابر یک checkout محلی صریح OpenClaw بررسی کنید.
  - `--runtime`: ضبط runtime را فعال کنید؛ کد plugin را import می‌کند.
  - `--allow-execute`: اجازه ضبط runtime در یک فضای کاری ایزوله را بدهید.
  - `--no-mock-sdk`: SDK شبیه‌سازی‌شده OpenClaw را هنگام ضبط runtime غیرفعال کنید.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package validate ./example-plugin
```

اگر اعتبارسنجی یک یافته مربوط به بسته، manifest، import SDK، یا artifact گزارش کرد، به
[رفع اشکال‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید، سپس فرمان را دوباره اجرا کنید.

### `package delete <name>`

- بدون `--version`، یک بسته و همه releaseهای آن را به‌صورت نرم‌حذف حذف می‌کند.
- `--version <version>` یک release غیرآخر متعلق به شما را از طریق یک مسیر fail-closed و
  مختص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده را نمی‌توان بازیابی یا دوباره منتشر کرد. پیش از حذف نسخه فعلی latest،
  یک جایگزین منتشر کنید. این جریان فقط-نسخه به مالک بسته یا مدیر ناشر سازمان نیاز دارد؛
  کارکنان پلتفرم مالکیت بسته را دور نمی‌زنند.
- حذف نرم کل بسته به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--version <version>`: یک نسخه غیرآخر را برای همیشه حذف کنید.
  - `--yes`: تأیید را رد کنید.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- یک بسته و releaseهای نرم‌حذف‌شده را بازیابی می‌کند.
- undelete نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: تأیید را رد کنید.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به هر دو مالک فعلی بسته و ناشر مقصد نیاز دارد،
  مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته scoped باید به مالک scope متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: handle ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری حسابرسی.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش‌کردن یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، به‌صورت اختیاری به یک نسخه پیوند می‌خورند، و برای
  بازبینی برای ناظران قابل مشاهده می‌شوند.
- گزارش‌ها به‌خودی‌خود بسته‌ها را به‌طور خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست‌کردن به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی نظارتی بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت نظارت دستی آخرین release،
  وضعیت مسدودسازی دانلود، و دلایل نظارت را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌های وضعیت رسمی، دسترس‌پذیری ClawPack، digest artifact،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فراداده محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت با جهت‌گیری اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  plugin همراه OpenClaw شود.
- همان نقطه پایانی آمادگی محاسبه‌شده مانند `package readiness` را فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- یک ناشر سازمانی متعلق به کاربر احراز هویت‌شده ایجاد می‌کند.
- handle به حروف کوچک نرمال‌سازی می‌شود و می‌تواند با یا بدون `@` ارسال شود.
- ناشران سازمانی تازه ایجادشده به‌صورت پیش‌فرض قابل اعتماد/رسمی نیستند.
- اگر handle از قبل توسط یک ناشر، کاربر، یا مسیر رزروشده موجود استفاده شده باشد، شکست می‌خورد.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` موارد زیر را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال محلی ClawPack از نوع npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL مربوط به GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI دقیقاً همان بایت‌های npm-pack را بارگذاری می‌کند
  و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک تاربال npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند دقیقاً همان آرتیفکت را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، commit حل‌شده، ref، و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی origin remote به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را به‌صراحت اعلام کنند.
  `package.json.version` در سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` پیش‌نمایشی از payload حل‌شده انتشار را بدون بارگذاری نشان می‌دهد.
- `--json` خروجی قابل خواندن توسط ماشین را برای CI تولید می‌کند.
- `--owner <handle>` وقتی عامل به ناشر دسترسی دارد، انتشار را زیر شناسه ناشر کاربر یا سازمان انجام می‌دهد.
- نام‌های package دارای scope باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- flagهای موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد یک انتشار زنده، فراداده package حل‌شده و
انتساب منبع را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای Pluginهای کد، انتشار پوشه یک آرتیفکت ClawPack را از
پوشه package می‌سازد و بارگذاری می‌کند:

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

- `package.json.version` نسخه انتشار package شماست، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` موارد اضافی اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI مربوط به `clawhub` استفاده می‌کنید، پیش از انتشار آن را ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.
- اگر اعتبارسنجی یک کد اصلاح گزارش کرد، به
  [اصلاحات اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی و قابل استفاده مجدد در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
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

- workflow قابل استفاده مجدد، `source` را به‌صورت پیش‌فرض روی مخزن فراخوان تنظیم می‌کند.
- برای monorepoها، `source_path` را ارسال کنید تا workflow پوشه package مربوط به Plugin را منتشر کند؛
  برای مثال `source_path: extensions/codex`.
- workflow قابل استفاده مجدد را به یک tag پایدار یا SHA کامل commit پین کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلوده‌کننده نباشد.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، packageهای غیرمورداعتماد، یا انتشارهای اضطراری در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان آرتیفکت بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow ارائه می‌دهد.

### `package trusted-publisher get <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک package نشان می‌دهد.
- پس از تنظیم پیکربندی، از این استفاده کنید تا مخزن، نام فایل workflow،
  و pin اختیاری محیط را تأیید کنید.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک package موجود متصل یا جایگزین می‌کند.
- package باید ابتدا از طریق انتشار عادی دستی یا احراز هویت‌شده با token
  `clawhub package publish` ایجاد شده باشد.
- پس از تنظیم پیکربندی، انتشارهای پشتیبانی‌شده آینده از GitHub Actions می‌توانند از
  OIDC/انتشار مورد اعتماد بدون token بلندمدت ClawHub استفاده کنند.
- `--repository <repo>` باید `owner/repo` باشد.
- `--workflow-filename <file>` باید با نام فایل workflow در
  `.github/workflows/` مطابقت داشته باشد.
- `--environment <name>` اختیاری است. وقتی پیکربندی شود، محیط GitHub Actions
  در ادعای OIDC باید دقیقاً مطابقت داشته باشد.
- ClawHub هنگام اجرای این دستور، مخزن GitHub پیکربندی‌شده را تأیید می‌کند.
  مخازن عمومی می‌توانند از طریق فراداده عمومی GitHub تأیید شوند. مخازن خصوصی
  نیاز دارند ClawHub به آن مخزن GitHub دسترسی داشته باشد، برای
  مثال از طریق نصب آینده GitHub App مربوط به ClawHub یا یک ادغام مجاز دیگر
  با GitHub.
- flagها:
  - `--repository <repo>`: مخزن GitHub، برای مثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: نام فایل workflow، برای مثال `package-publish.yml`.
  - `--environment <name>`: محیط اختیاری GitHub Actions با تطابق دقیق.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- پیکربندی ناشر مورد اعتماد را از یک package حذف می‌کند.
- اگر pin مربوط به workflow، مخزن، یا محیط نیاز به غیرفعال‌سازی یا ایجاد دوباره دارد،
  از این به‌عنوان rollback استفاده کنید.
- انتشارهای واقعی آینده باید تا زمانی که پیکربندی دوباره تنظیم شود، از انتشار احراز هویت‌شده عادی استفاده کنند.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### دورسنجی نصب

- پس از `clawhub install <slug>` هنگام ورود، ارسال می‌شود، مگر اینکه
  `CLAWHUB_DISABLE_TELEMETRY=1` تنظیم شده باشد.
- گزارش‌دهی به‌صورت بهترین تلاش انجام می‌شود. اگر دورسنجی
  در دسترس نباشد، دستورهای نصب fail نمی‌شوند.
- جزئیات: `docs/telemetry.md`.
