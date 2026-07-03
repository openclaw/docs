---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی یا انتشار
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی و رفتار فایل قفل.'
x-i18n:
    generated_at: "2026-07-03T17:30:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: دایرکتوری جاری؛ اگر پیکربندی شده باشد، به فضای کاری Clawdbot بازمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر دایرکتوری کاری (پیش‌فرض: `skills`)
- `--site <url>`: نشانی پایه برای ورود مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: نشانی پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های متغیر محیطی:

- `CLAWHUB_SITE` (قدیمی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی `CLAWDHUB_WORKDIR`)

### پروکسی HTTP

CLI متغیرهای محیطی استاندارد پروکسی HTTP را برای سیستم‌هایی که پشت
پروکسی‌های سازمانی یا شبکه‌های محدود هستند رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پروکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دور زدن پروکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این در سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم در آن‌ها مسدود شده‌اند
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

توکن API شما + نشانی رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback حلقه‌بازگشت کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی دوردست/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و در حالی که آن را در `<site>/cli/device` مجاز می‌کنید منتظر می‌ماند.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `token`

- توکن API ذخیره‌شده را در خروجی استاندارد چاپ می‌کند.
- برای لوله‌کردن توکن ورود محلی به فرمان‌های تنظیم secret در CI مفید است.

### `star <skill>` / `unstar <skill>`

- یک مهارت را به برجسته‌های شما اضافه یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- خروجی شامل اسلاگ مهارت، شناسه مالک، نام نمایشی، و امتیاز ارتباط است.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن اسلاگ/نام را ترجیح می‌دهد. یک توکن مستقل اسلاگ مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- محبوبیت یک پیش‌زمینه رتبه‌بندی کوچک است، نه تضمینی برای قرارگیری در جایگاه اول.
- اگر مهارتی باید ظاهر شود اما نمی‌شود، هنگام ورود، `clawhub inspect @owner/slug` را اجرا کنید تا پیش از تغییر نام فراداده، عیب‌یابی‌های نظارت قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt`).
- پرچم‌ها:
  - `--limit <n>` (۱ تا ۲۰۰، پیش‌فرض: ۲۵)
  - `--sort newest|updated|rating|downloads|trending` (پیش‌فرض: جدیدترین). نام‌های مستعار مرتب‌سازی نصب قدیمی همچنان برای سازگاری کار می‌کنند.
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه تا ۵۰ نویسه کوتاه می‌شود).

### `inspect @owner/slug`

- فراداده مهارت و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: آخرین).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (برای مثال `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه نخست).
- `--limit <n>`: بیشینه نسخه‌ها برای فهرست‌کردن (۱ تا ۲۰۰).
- `--files`: فهرست فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت ۲۰۰ کیلوبایت).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install @owner/slug`

- آخرین نسخه را برای مالک و مهارت نام‌گذاری‌شده حل می‌کند.
- فایل zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های سنجاق‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <skill>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- هنگام ورود، telemetry را به‌صورت best-effort ارسال می‌کند تا شمارش نصب‌های فعلی
  غیرفعال شود.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`) را می‌خواند.
- کنار مهارت‌هایی که با `clawhub pin` منجمد شده‌اند، شامل دلیل اختیاری، `pinned` را نشان می‌دهد.

### `pin <skill>`

- یک مهارت نصب‌شده را در lockfile به‌عنوان سنجاق‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا مهارت منجمد شده است.
- مهارت‌های سنجاق‌شده توسط `update --all` رد می‌شوند و توسط `update <skill>` مستقیم رد می‌شوند.
- مهارت‌های سنجاق‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی تصادفی جایگزین نشوند.

### `unpin <skill>`

- سنجاق lockfile را از یک مهارت نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [@owner/slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده تطابق داشته باشد: بدون اعلان.
- اگر اثرانگشت تطابق نداشته باشد:
  - به‌صورت پیش‌فرض خودداری می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با اعلان)
- مهارت‌های سنجاق‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <skill>` برای مهارت‌های سنجاق‌شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <skill>` را اجرا کنید.
- `update --all` اسلاگ‌های سنجاق‌شده را رد می‌کند و خلاصه‌ای از مواردی که منجمد ماندند چاپ می‌کند.

### `skill publish <path>`

- اثرانگشت بسته محلی را با ClawHub مقایسه می‌کند و وقتی
  محتوا از قبل منتشر شده باشد با موفقیت خارج می‌شود.
- مهارت‌های جدید به‌صورت پیش‌فرض `1.0.0` هستند؛ مهارت‌های تغییرکرده به‌صورت پیش‌فرض نسخه patch بعدی
  را می‌گیرند.
- `--version <version>` یک نسخه را صریحاً انتخاب می‌کند و حتی وقتی
  محتوا با یک نسخه موجود تطابق دارد منتشر می‌کند.
- `--dry-run` انتشار را بدون بارگذاری حل می‌کند؛ `--json` یک نتیجه
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر شناسه ناشر سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک مهارت موجود را به `--owner` منتقل می‌کند. به دسترسی مدیر/مالک روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک مهارت یعنی آن مهارت تحت `MIT-0` در ClawHub منتشر می‌شود.
- مهارت‌های منتشرشده برای استفاده، تغییر، و بازتوزیع بدون انتساب آزاد هستند.
- ClawHub از مهارت‌های پولی یا قیمت‌گذاری به‌ازای هر مهارت پشتیبانی نمی‌کند.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

گردش‌کار قابل‌استفاده مجدد ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
برای یک `skill_path` یا برای هر پوشه مهارت بی‌واسطه
زیر `root` (پیش‌فرض: `skills`) فرمان `skill publish` را فراخوانی می‌کند. مهارت‌های بدون تغییر را رد می‌کند و از همان
رفتار خودکار نسخه patch استفاده می‌کند.

برای پیش‌نمایش بدون توکن، `dry_run: true` را تنظیم کنید. انتشار واقعی به secret
`clawhub_token` نیاز دارد.

### `sync`

- دایرکتوری کاری فعلی، دایرکتوری مهارت‌های پیکربندی‌شده، و هر پوشه
  `--root <dir>` را برای پوشه‌های مهارت محلی که شامل `SKILL.md` یا
  `skill.md` هستند اسکن می‌کند.
- اثرانگشت هر مهارت محلی را با ClawHub مقایسه می‌کند و فقط مهارت‌های جدید یا
  تغییرکرده را منتشر می‌کند.
- مهارت‌های جدید به‌صورت `1.0.0` منتشر می‌شوند؛ مهارت‌های تغییرکرده به‌صورت پیش‌فرض
  نسخه patch بعدی را منتشر می‌کنند. برای دسته‌های به‌روزرسانی که باید با یک
  گام semver بزرگ‌تر حرکت کنند از `--bump minor|major` استفاده کنید.
- `--dry-run` طرح انتشار را بدون بارگذاری نشان می‌دهد؛ `--json` یک طرح
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--all` هر مهارت جدید یا تغییرکرده را بدون اعلان منتشر می‌کند. بدون
  `--all`، پایانه‌های تعاملی به شما اجازه می‌دهند مهارت‌ها را برای انتشار انتخاب کنید.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر شناسه ناشر سازمان/کاربر منتشر می‌کند.
- `sync` فقط انتشار یک‌طرفه است. نصب، به‌روزرسانی، دانلود، یا
  گزارش telemetry نصب/دانلود انجام نمی‌دهد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- به `clawhub login` نیاز دارد.
- ClawHub ClawScan را از طریق `POST /api/v1/skills/-/scan` اجرا می‌کند، سپس تا نهایی‌شدن اسکن polling می‌کند.
- اسکن‌ها ناهمگام هستند و ممکن است تکمیل آن‌ها زمان ببرد. هنگام قرارگرفتن در صف، spinner پایانه جایگاه اسکن اولویت‌دار فعلی و تعداد اسکن‌های جلوتر را نشان می‌دهد.
- اسکن‌های منتشرشده به مالکیت یا دسترسی مدیریت ناشر نیاز دارند. ناظران/مدیران می‌توانند از همان backend از طریق `clawhub-admin` استفاده کنند.
- `--update` فقط با `--slug` معتبر است؛ نتیجه‌های موفق اسکن منتشرشده را به نسخه انتخاب‌شده بازمی‌نویسد.
- `--output <file.zip>` بایگانی کامل گزارش را با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` دانلود می‌کند.
- `--json` پاسخ کامل polling را برای خودکارسازی چاپ می‌کند.
- اسکن‌های مسیر محلی دیگر پشتیبانی نمی‌شوند. یک نسخه جدید بارگذاری کنید، سپس از `scan download` برای بازیابی نتیجه‌های اسکن ذخیره‌شده برای آن نسخه ارسال‌شده استفاده کنید.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- به `clawhub login` نیاز دارد.
- ZIP گزارش اسکن ذخیره‌شده را برای نسخه مهارت یا Plugin ارسال‌شده دانلود می‌کند، شامل نسخه‌هایی که توسط بررسی‌های امنیتی ClawHub مسدود یا پنهان شده‌اند.
- دانلودهای مهارت از اسلاگ مهارت استفاده می‌کنند و پیش‌فرض آن‌ها `--kind skill` است.
- دانلودهای Plugin از نام بسته استفاده می‌کنند و به `--kind plugin` نیاز دارند.
- `--version` لازم است تا نویسندگان همان نسخه ارسال‌شده دقیقی را که ClawHub مسدود کرده است بررسی کنند.
- `--output <file.zip>` مسیر مقصد را انتخاب می‌کند.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub یک گردش‌کار رسمی قابل‌استفاده مجدد را در
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
برای مخزن‌های مهارت و مخزن‌های کاتالوگ ارائه می‌کند.

تنظیم معمول کاتالوگ:

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

- مقدار پیش‌فرض `root` برای مخزن‌های کاتالوگ `skills` است.
- برای پردازش یک پوشه مهارت، `skill_path: skills/review-helper` را ارسال کنید.
- `owner` به پرچم CLI `--owner` نگاشت می‌شود؛ برای انتشار به‌عنوان کاربر احرازهویت‌شده آن را حذف کنید.
- انتشار مهارت V1 از `clawhub_token` استفاده می‌کند؛ انتشار مورداعتماد GitHub OIDC فعلاً فقط برای بسته است.

### `delete <skill>`

- بدون `--version`، یک skill را به‌صورت soft-delete حذف می‌کند (مالک، ناظر یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های soft-delete آغازشده توسط مالک، slug را به‌مدت ۳۰ روز رزرو نگه می‌دارند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--version <version>` یک نسخهٔ غیرآخرینِ تحت مالکیت را از طریق یک مسیر fail-closed و
  مختص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخهٔ latest فعلی، یک جایگزین منتشر کنید. کارکنان پلتفرم در این جریانِ فقط نسخه‌ای، مالکیت را دور نمی‌زنند.
- `--reason <text>` یک یادداشت نظارتی را روی soft-delete کل skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <skill>`

- یک skill پنهان را بازیابی می‌کند (مالک، ناظر یا مدیر).
- undelete نسخه وجود ندارد؛ نسخه‌های حذف‌شده برای همیشه قابل بازیابی نیستند.
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی را روی skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <skill>`

- یک skill را پنهان می‌کند (مالک، ناظر یا مدیر).
- نام مستعار `delete`.

### `unhide <skill>`

- یک skill را از حالت پنهان خارج می‌کند (مالک، ناظر یا مدیر).
- نام مستعار `undelete`.

### `skill rename <skill> <new-name>`

- یک skill تحت مالکیت را تغییر نام می‌دهد و slug قبلی را به‌عنوان نام مستعار redirect نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source> <target>`

- یک skill تحت مالکیت را در skill تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به یک نام مستعار redirect به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال به handleهای کاربر، یک درخواست در انتظار ایجاد می‌کند که گیرنده آن را می‌پذیرد.
- انتقال به handleهای سازمان/ناشر فقط زمانی فوراً اعمال می‌شود که کنشگر به مالک فعلی و ناشر مقصد
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

- کاتالوگ یکپارچهٔ package را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و سایر مدخل‌های خانوادهٔ package استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی skill باقی می‌ماند.
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

- فرادادهٔ package را بدون نصب واکشی می‌کند.
- از این برای فرادادهٔ plugin، سازگاری، راستی‌آزمایی، منبع، و بررسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخهٔ مشخص را بررسی می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخهٔ برچسب‌خورده را بررسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچهٔ نسخه‌ها را فهرست می‌کند (صفحهٔ اول).
- `--limit <n>`: بیشینهٔ نسخه‌ها برای فهرست‌کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخهٔ انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را واکشی می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخهٔ package را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` مربوط به resolver دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همهٔ artifacts راستی‌آزمایی می‌کند.
- برای artifacts از نوع ClawPack npm-pack، درستی‌سنجی `sha512` مربوط به npm،
  shasum مربوط به npm، و نام/نسخهٔ `package.json` در tarball را هم راستی‌آزمایی می‌کند.
- نسخه‌های ZIP legacy از طریق مسیر ZIP legacy دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخهٔ مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخهٔ برچسب‌خورده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا پوشهٔ خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 مربوط به ClawHub، درستی‌سنجی `sha512` مربوط به npm، و shasum مربوط به npm را برای یک
  artifact محلی محاسبه می‌کند.
- با `--package`، فرادادهٔ مورد انتظار را از ClawHub resolve می‌کند و
  فایل محلی را با فرادادهٔ artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون lookup شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام package برای resolve کردن فرادادهٔ artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخهٔ package مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: درستی‌سنجی مورد انتظار npm.
  - `--npm-shasum <sha1>`: shasum مورد انتظار npm.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Plugin Inspector بسته‌بندی‌شدهٔ CLI مربوط به ClawHub را روی پوشهٔ package یک plugin محلی اجرا می‌کند.
- به‌صورت پیش‌فرض، بدون مکان‌یابی یا import کردن یک checkout محلی OpenClaw، اعتبارسنجی آفلاین/ایستا انجام می‌دهد.
- خطاهای سختِ سازگاری با کد غیرصفر خارج می‌شوند. یافته‌هایی که فقط هشدار هستند چاپ می‌شوند اما
  با کد صفر خارج می‌شوند.
- پرچم‌ها:
  - `--out <dir>`: گزارش‌های Plugin Inspector را در این پوشه می‌نویسد.
  - `--openclaw <path>`: در برابر یک checkout محلی صریح OpenClaw بررسی می‌کند.
  - `--runtime`: ضبط runtime را فعال می‌کند؛ کد plugin را import می‌کند.
  - `--allow-execute`: اجازهٔ ضبط runtime در یک فضای کاری ایزوله را می‌دهد.
  - `--no-mock-sdk`: SDK شبیه‌سازی‌شدهٔ OpenClaw را هنگام ضبط runtime غیرفعال می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package validate ./example-plugin
```

اگر اعتبارسنجی یک یافتهٔ مربوط به package، manifest، import از SDK، یا artifact گزارش کرد، به
[رفع‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید، سپس فرمان را دوباره اجرا کنید.

### `package delete <name>`

- بدون `--version`، یک package و همهٔ releaseهای آن را به‌صورت soft-delete حذف می‌کند.
- `--version <version>` یک release غیرآخرینِ تحت مالکیت را از طریق یک مسیر fail-closed و
  مختص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخهٔ latest فعلی، یک جایگزین منتشر کنید. این جریانِ فقط نسخه‌ای به مالک package یا مدیر ناشر سازمان نیاز دارد؛ کارکنان پلتفرم مالکیت package را دور نمی‌زنند.
- soft-delete کل package به مالک package، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--version <version>`: یک نسخهٔ غیرآخرین را برای همیشه حذف می‌کند.
  - `--yes`: تأیید را رد می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- یک package و releaseهای soft-deleted را بازیابی می‌کند.
- undelete نسخه وجود ندارد؛ نسخه‌های حذف‌شده برای همیشه قابل بازیابی نیستند.
- به مالک package، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: تأیید را رد می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک package را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به مالک فعلی package و ناشر مقصد، هر دو، نیاز دارد،
  مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های package دارای scope باید به مالک scope مطابق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: handle ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری audit.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش‌کردن یک package به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح package هستند، به‌صورت اختیاری به یک نسخه پیوند می‌خورند، و برای
  بررسی در برابر ناظران قابل مشاهده می‌شوند.
- گزارش‌ها به‌تنهایی packageها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخهٔ اختیاری package برای پیوست‌کردن به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی نمایانی نظارتی package.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن package، شمار گزارش‌های باز، وضعیت نظارت دستی آخرین release،
  وضعیت مسدودسازی دانلود، و دلایل نظارتی را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک package برای مصرف آیندهٔ OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌های وضعیت رسمی، دسترس‌پذیری ClawPack، digest مربوط به artifact،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فرادادهٔ محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرتِ معطوف به اپراتور را برای packageی نشان می‌دهد که ممکن است جایگزین یک
  plugin بسته‌بندی‌شدهٔ OpenClaw شود.
- همان نقطهٔ پایانی readiness محاسبه‌شده را مثل `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت package رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- یک ناشر سازمانی تحت مالکیت کاربر احراز هویت‌شده ایجاد می‌کند.
- handle به حروف کوچک نرمال‌سازی می‌شود و می‌تواند با `@` یا بدون آن پاس داده شود.
- ناشران سازمانی تازه ایجادشده به‌صورت پیش‌فرض trusted/official نیستند.
- اگر handle از قبل توسط یک ناشر، کاربر، یا مسیر رزروشدهٔ موجود استفاده شده باشد، شکست می‌خورد.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` موارد زیر را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - آرشیو tarball محلی ClawPack ساخته‌شده با npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL در GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json` و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json` و `.cursor-plugin/plugin.json` شناسایی می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI همان بایت‌های دقیق npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌تکمیل فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک آرشیو tarball npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند artifact دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، commit حل‌شده، ref و زیردامنه مسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی شناسایی می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را به‌صراحت اعلام کنند.
  مقدار سطح بالای `package.json.version` به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` محتوای انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن برای ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` زمانی که کنشگر دسترسی ناشر داشته باشد، انتشار را زیر handle ناشر یک کاربر یا سازمان انجام می‌دهد.
- نام‌های بسته دارای scope باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد یک انتشار واقعی،
فراداده بسته حل‌شده و انتساب منبع را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای Pluginهای کد، انتشار پوشه یک artifact از نوع ClawPack را از
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

نکته‌ها:

- `package.json.version` نسخه انتشار بسته شماست، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` افزونه‌های اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار آن را ارتقا دهید تا
  بررسی‌های مقدماتی محلی پیش از بارگذاری اجرا شوند.
- اگر اعتبارسنجی یک کد رفع مشکل گزارش کرد، به
  [رفع‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل‌استفاده‌مجدد را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
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

نکته‌ها:

- workflow قابل‌استفاده‌مجدد مقدار پیش‌فرض `source` را مخزن فراخوان قرار می‌دهد.
- برای monorepoها، `source_path` را ارسال کنید تا workflow پوشه بسته Plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفاده‌مجدد را به یک tag پایدار یا SHA کامل commit pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی باقی بماند.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های غیرقابل‌اعتماد یا انتشارهای اضطراری در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در دسترس قرار می‌دهد.

### `package trusted-publisher get <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک بسته نمایش می‌دهد.
- پس از تنظیم پیکربندی از این دستور استفاده کنید تا مخزن، نام فایل workflow
  و pin اختیاری environment را تأیید کنید.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک بسته موجود
  پیوست یا جایگزین می‌کند.
- بسته ابتدا باید از طریق انتشار عادی دستی یا دارای احراز هویت با token
  با `clawhub package publish` ایجاد شده باشد.
- پس از تنظیم پیکربندی، انتشارهای پشتیبانی‌شده آینده از GitHub Actions می‌توانند از
  OIDC/انتشار مورد اعتماد بدون token بلندمدت ClawHub استفاده کنند.
- `--repository <repo>` باید `owner/repo` باشد.
- `--workflow-filename <file>` باید با نام فایل workflow در
  `.github/workflows/` مطابقت داشته باشد.
- `--environment <name>` اختیاری است. وقتی پیکربندی شود، environment در GitHub Actions
  داخل claim مربوط به OIDC باید دقیقاً مطابقت داشته باشد.
- ClawHub هنگام اجرای این دستور مخزن GitHub پیکربندی‌شده را تأیید می‌کند.
  مخازن عمومی را می‌توان از طریق فراداده عمومی GitHub تأیید کرد. مخازن خصوصی
  به دسترسی ClawHub به آن مخزن در GitHub نیاز دارند، برای مثال از طریق نصب آینده
  ClawHub GitHub App یا یک یکپارچه‌سازی مجاز دیگر با GitHub.
- پرچم‌ها:
  - `--repository <repo>`: مخزن GitHub، برای مثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: نام فایل workflow، برای مثال `package-publish.yml`.
  - `--environment <name>`: environment اختیاری GitHub Actions با تطابق دقیق.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- پیکربندی ناشر مورد اعتماد را از یک بسته حذف می‌کند.
- اگر لازم است pin مربوط به workflow، مخزن یا environment غیرفعال یا دوباره ایجاد شود،
  از این مورد به‌عنوان rollback استفاده کنید.
- انتشارهای واقعی آینده باید تا زمانی که پیکربندی دوباره تنظیم شود
  از انتشار عادی احرازشده استفاده کنند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### تله‌متری نصب

- پس از `clawhub install <slug>` در صورت ورود به سیستم ارسال می‌شود، مگر اینکه
  `CLAWHUB_DISABLE_TELEMETRY=1` تنظیم شده باشد.
- گزارش‌دهی به‌صورت best-effort است. اگر تله‌متری در دسترس نباشد،
  دستورهای نصب شکست نمی‌خورند.
- جزئیات: `docs/telemetry.md`.
