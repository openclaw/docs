---
read_when:
    - استفاده از CLI در ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی یا انتشار
summary: 'مرجع CLI: فرمان‌ها، فلگ‌ها، پیکربندی، و رفتار فایل قفل.'
x-i18n:
    generated_at: "2026-06-28T20:40:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a20b288bab0e81c9ba63e054adc35b66c9013da1e0b310401b3f931c2d0b2a1
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

بسته CLI: `clawhub`، فایل اجرایی: `clawhub`.

آن را با npm یا pnpm به‌صورت سراسری نصب کنید:

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
- `--no-input`: غیرفعال کردن درخواست‌های تعاملی

معادل‌های محیطی:

- `CLAWHUB_SITE` (`CLAWDHUB_SITE` قدیمی)
- `CLAWHUB_REGISTRY` (`CLAWDHUB_REGISTRY` قدیمی)
- `CLAWHUB_WORKDIR` (`CLAWDHUB_WORKDIR` قدیمی)

### پراکسی HTTP

CLI متغیرهای محیطی استاندارد پراکسی HTTP را برای سیستم‌هایی که پشت
پراکسی‌های سازمانی یا شبکه‌های محدود هستند رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پراکسی مشخص‌شده هدایت می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دور زدن پراکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این کار در سیستم‌هایی لازم است که اتصال مستقیم خروجی در آن‌ها مسدود شده است
(برای مثال کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی،
فایروال‌های سازمانی).

نمونه:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال مستقیم).

## فایل پیکربندی

توکن API شما و URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- جایگزین قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` قدیمی)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback loopback تکمیل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی از راه دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `token`

- توکن API ذخیره‌شده را در stdout چاپ می‌کند.
- برای لوله‌کردن توکن ورود محلی به دستورهای تنظیم secret در CI مفید است.

### `star <skill>` / `unstar <skill>`

- یک Skill را به موارد برجسته شما اضافه یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- خروجی شامل slug مربوط به Skill، handle مالک، نام نمایشی و امتیاز ارتباط است.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/نام را ترجیح می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- محبوبیت یک پیش‌فرض رتبه‌بندی کوچک است، نه تضمینی برای قرارگیری در رتبه نخست.
- اگر یک Skill باید ظاهر شود اما نمی‌شود، هنگام ورود `clawhub inspect @owner/slug` را اجرا کنید تا پیش از تغییر نام فراداده، عیب‌یابی‌های moderation قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین Skills را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (بر اساس `createdAt` به‌صورت نزولی مرتب شده).
- پرچم‌ها:
  - `--limit <n>` (۱ تا ۲۰۰، پیش‌فرض: ۲۵)
  - `--sort newest|updated|rating|downloads|trending` (پیش‌فرض: newest). نام‌های مستعار قدیمی مرتب‌سازی نصب همچنان برای سازگاری کار می‌کنند.
  - `--json` (خروجی قابل خواندن توسط ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه تا ۵۰ نویسه کوتاه می‌شود).

### `inspect @owner/slug`

- فراداده Skill و فایل‌های نسخه را بدون نصب واکشی می‌کند.
- `--version <version>`: یک نسخه مشخص را بررسی می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه برچسب‌دار را بررسی می‌کند (برای مثال `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: بیشترین تعداد نسخه‌ها برای فهرست کردن (۱ تا ۲۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را واکشی می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل خواندن توسط ماشین.

### `install @owner/slug`

- آخرین نسخه را برای مالک و Skill نام‌برده resolve می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی Skills پین‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <skill>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- هنگام ورود، telemetry را با بهترین تلاش ارسال می‌کند تا شمارش نصب‌های فعلی
  غیرفعال شوند.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی) را می‌خواند.
- کنار Skills منجمدشده با `clawhub pin`، همراه با دلیل اختیاری، `pinned` را نشان می‌دهد.

### `pin <skill>`

- یک Skill نصب‌شده را در lockfile به‌عنوان پین‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا Skill منجمد شده است.
- Skills پین‌شده توسط `update --all` رد می‌شوند و توسط `update <skill>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا byteهای محلی به‌اشتباه جایگزین نشوند.

### `unpin <skill>`

- پین lockfile را از یک Skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [@owner/slug]` / `update --all`

- fingerprint را از فایل‌های محلی محاسبه می‌کند.
- اگر fingerprint با یک نسخه شناخته‌شده مطابقت داشته باشد: درخواستی نمایش داده نمی‌شود.
- اگر fingerprint مطابقت نداشته باشد:
  - به‌طور پیش‌فرض خودداری می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، درخواست می‌دهد)
- Skills پین‌شده هرگز توسط `--force` به‌روزرسانی نمی‌شوند.
- `update <skill>` برای Skills پین‌شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <skill>` را اجرا کنید.
- `update --all` slugهای پین‌شده را رد می‌کند و خلاصه‌ای از مواردی که منجمد ماندند چاپ می‌کند.

### `skill publish <path>`

- fingerprint بسته محلی را با ClawHub مقایسه می‌کند و وقتی
  محتوا قبلاً منتشر شده باشد با موفقیت خارج می‌شود.
- Skills جدید به‌طور پیش‌فرض `1.0.0` می‌گیرند؛ Skills تغییریافته به‌طور پیش‌فرض نسخه patch بعدی
  را می‌گیرند.
- `--version <version>` صراحتاً یک نسخه را انتخاب می‌کند و حتی وقتی
  محتوا با یک نسخه موجود مطابقت دارد منتشر می‌کند.
- `--dry-run` انتشار را بدون آپلود resolve می‌کند؛ `--json` یک نتیجه
  قابل خواندن توسط ماشین چاپ می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک Skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک Skill یعنی آن Skill تحت `MIT-0` روی ClawHub منتشر می‌شود.
- Skills منتشرشده بدون نیاز به attribution برای استفاده، تغییر و بازتوزیع آزاد هستند.
- ClawHub از Skills پولی یا قیمت‌گذاری به‌ازای هر Skill پشتیبانی نمی‌کند.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow قابل استفاده مجدد ClawHub به نام
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
برای یک `skill_path`، یا برای هر پوشه Skill بلافاصله زیر `root` (پیش‌فرض: `skills`)
`skill publish` را فراخوانی می‌کند. Skills بدون تغییر را رد می‌کند و از همان
رفتار خودکار نسخه patch استفاده می‌کند.

برای پیش‌نمایش بدون توکن، `dry_run: true` را تنظیم کنید. انتشار واقعی به secret
`clawhub_token` نیاز دارد.

### `sync`

- workdir فعلی، دایرکتوری Skills پیکربندی‌شده و هر پوشه
  `--root <dir>` را برای پوشه‌های Skill محلی که شامل `SKILL.md` یا
  `skill.md` هستند پویش می‌کند.
- fingerprint هر Skill محلی را با ClawHub مقایسه می‌کند و فقط Skills جدید یا
  تغییریافته را منتشر می‌کند.
- Skills جدید به‌صورت `1.0.0` منتشر می‌شوند؛ Skills تغییریافته به‌طور پیش‌فرض نسخه patch بعدی
  را منتشر می‌کنند. برای دسته‌های به‌روزرسانی که باید با گام بزرگ‌تر semver
  حرکت کنند از `--bump minor|major` استفاده کنید.
- `--dry-run` طرح انتشار را بدون آپلود نشان می‌دهد؛ `--json` یک طرح
  قابل خواندن توسط ماشین چاپ می‌کند.
- `--all` هر Skill جدید یا تغییریافته را بدون درخواست منتشر می‌کند. بدون
  `--all`، ترمینال‌های تعاملی به شما اجازه می‌دهند Skills مورد نظر برای انتشار را انتخاب کنید.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر سازمان/کاربر منتشر می‌کند.
- `sync` فقط انتشار یک‌طرفه است. نصب، به‌روزرسانی، دانلود یا گزارش telemetry نصب/دانلود انجام نمی‌دهد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- به `clawhub login` نیاز دارد.
- ClawScan مربوط به ClawHub را از طریق `POST /api/v1/skills/-/scan` اجرا می‌کند، سپس تا زمانی که scan به وضعیت پایانی برسد poll می‌کند.
- scanها ناهمگام هستند و ممکن است تکمیل آن‌ها زمان ببرد. هنگام قرار داشتن در صف، spinner ترمینال موقعیت فعلی scan اولویت‌بندی‌شده و تعداد scanهای جلوتر را نشان می‌دهد.
- scanهای منتشرشده به مالکیت یا دسترسی مدیریت ناشر نیاز دارند. moderators/admins می‌توانند از همان backend از طریق `clawhub-admin` استفاده کنند.
- `--update` فقط با `--slug` معتبر است؛ نتایج موفق scan منتشرشده را به نسخه انتخاب‌شده می‌نویسد.
- `--output <file.zip>` آرشیو کامل گزارش را با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` دانلود می‌کند.
- `--json` پاسخ کامل poll را برای automation چاپ می‌کند.
- scan مسیر محلی دیگر پشتیبانی نمی‌شود. یک نسخه جدید آپلود کنید، سپس از `scan download` برای دریافت نتایج scan ذخیره‌شده برای همان نسخه ارسال‌شده استفاده کنید.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- به `clawhub login` نیاز دارد.
- ZIP گزارش scan ذخیره‌شده را برای نسخه ارسال‌شده یک Skill یا Plugin دانلود می‌کند، از جمله نسخه‌هایی که توسط بررسی‌های امنیتی ClawHub مسدود یا پنهان شده‌اند.
- دانلودهای Skill از slug مربوط به Skill استفاده می‌کنند و به‌طور پیش‌فرض `--kind skill` هستند.
- دانلودهای Plugin از نام بسته استفاده می‌کنند و به `--kind plugin` نیاز دارند.
- `--version` لازم است تا نویسندگان نسخه ارسال‌شده دقیقی را که ClawHub مسدود کرده بررسی کنند.
- `--output <file.zip>` مسیر مقصد را انتخاب می‌کند.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub یک workflow رسمی قابل استفاده مجدد را در
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/skill-publish.yml)
برای مخازن Skill و مخازن catalog ارائه می‌کند.

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

- `root` برای مخازن catalog به‌طور پیش‌فرض `skills` است.
- برای پردازش یک پوشه Skill، `skill_path: skills/review-helper` را پاس بدهید.
- `owner` به پرچم CLI به نام `--owner` نگاشت می‌شود؛ برای انتشار به‌عنوان کاربر احراز هویت‌شده آن را حذف کنید.
- انتشار Skill در V1 از `clawhub_token` استفاده می‌کند؛ انتشار مورد اعتماد GitHub OIDC فعلاً فقط برای بسته‌هاست.

### `delete <skill>`

- بدون `--version`، یک مهارت را soft-delete کنید (مالک، ناظر، یا ادمین).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهایی که مالک آغاز می‌کند، slug را به‌مدت ۳۰ روز رزرو می‌کنند؛ دستور زمان انقضا را چاپ می‌کند.
- `--version <version>` یک نسخهٔ غیرآخرِ متعلق به مالک را از طریق یک مسیر fail-closed و
  مخصوص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخهٔ
  آخر فعلی، یک جایگزین منتشر کنید. کارکنان پلتفرم برای این جریان فقط-نسخه، مالکیت را دور نمی‌زنند.
- `--reason <text>` یک یادداشت نظارتی را روی soft-delete کل مهارت و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <skill>`

- یک مهارت پنهان را بازیابی کنید (مالک، ناظر، یا ادمین).
- undelete نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی را روی مهارت و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <skill>`

- یک مهارت را پنهان کنید (مالک، ناظر، یا ادمین).
- نام مستعار `delete` است.

### `unhide <skill>`

- یک مهارت را از حالت پنهان خارج کنید (مالک، ناظر، یا ادمین).
- نام مستعار `undelete` است.

### `skill rename <skill> <new-name>`

- یک مهارت متعلق به مالک را تغییر نام دهید و slug قبلی را به‌عنوان نام مستعار redirect نگه دارید.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source> <target>`

- یک مهارت متعلق به مالک را در مهارت متعلق به مالک دیگری ادغام کنید.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار redirect به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به handleهای کاربری یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای org/publisher فقط زمانی فوراً اعمال می‌شوند که کنشگر
  دسترسی ادمین به هر دو publisher مالک فعلی و مقصد داشته باشد.
- زیردستورها:
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

- کاتالوگ یکپارچهٔ بسته را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جستجو می‌کند.
- از این برای pluginها و دیگر ورودی‌های خانوادهٔ بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جستجوی مهارت باقی می‌ماند.
- flagها:
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

- metadata بسته را بدون نصب واکشی می‌کند.
- از این برای metadata plugin، سازگاری، تأیید، منبع، و بازرسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخهٔ مشخص را بازرسی کنید (پیش‌فرض: آخرین).
- `--tag <tag>`: یک نسخهٔ tagشده را بازرسی کنید (مثلاً `latest`).
- `--versions`: تاریخچهٔ نسخه‌ها را فهرست کنید (صفحهٔ اول).
- `--limit <n>`: بیشینهٔ نسخه‌هایی که فهرست می‌شوند (۱-۱۰۰).
- `--files`: فایل‌های نسخهٔ انتخاب‌شده را فهرست کنید.
- `--file <path>`: محتوای خام فایل را واکشی کنید (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل خواندن توسط ماشین.

### `package download <name>`

- یک نسخهٔ بسته را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` متعلق به resolver دانلود می‌کند.
- ClawHub SHA-256 را برای همهٔ artifactها تأیید می‌کند.
- برای artifactهای ClawPack npm-pack، یکپارچگی `sha512` مربوط به npm،
  npm shasum، و نام/نسخهٔ `package.json` در tarball را نیز تأیید می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- flagها:
  - `--version <version>`: یک نسخهٔ مشخص را دانلود کنید.
  - `--tag <tag>`: یک نسخهٔ tagشده را دانلود کنید (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا پوشهٔ خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی کنید.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ClawHub SHA-256، یکپارچگی `sha512` مربوط به npm، و npm shasum را برای یک
  artifact محلی محاسبه می‌کند.
- با `--package`، metadata مورد انتظار را از ClawHub resolve می‌کند و فایل
  محلی را با metadata artifact منتشرشده مقایسه می‌کند.
- با flagهای digest مستقیم، بدون lookup شبکه تأیید می‌کند.
- flagها:
  - `--package <name>`: نام بسته برای resolve کردن metadata artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخهٔ بستهٔ مورد انتظار.
  - `--sha256 <hex>`: ClawHub SHA-256 مورد انتظار.
  - `--npm-integrity <sri>`: یکپارچگی npm مورد انتظار.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Plugin Inspector همراه ClawHub CLI را روی پوشهٔ بستهٔ plugin محلی
  اجرا می‌کند.
- پیش‌فرض آن اعتبارسنجی آفلاین/ایستا است، بدون مکان‌یابی یا import کردن checkout محلی
  OpenClaw.
- خطاهای سخت سازگاری با کد غیرصفر خارج می‌شوند. یافته‌هایی که فقط هشدار هستند چاپ می‌شوند اما
  با کد صفر خارج می‌شوند.
- flagها:
  - `--out <dir>`: گزارش‌های Plugin Inspector را در این پوشه بنویسید.
  - `--openclaw <path>`: در برابر یک checkout محلی صریح OpenClaw بازرسی کنید.
  - `--runtime`: ضبط runtime را فعال کنید؛ کد plugin را import می‌کند.
  - `--allow-execute`: ضبط runtime را در یک workspace ایزوله مجاز کنید.
  - `--no-mock-sdk`: OpenClaw SDK شبیه‌سازی‌شده را هنگام ضبط runtime غیرفعال کنید.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package validate ./example-plugin
```

اگر اعتبارسنجی یک یافتهٔ بسته، manifest، import مربوط به SDK، یا artifact گزارش کرد، به
[رفع‌های اعتبارسنجی Plugin](/fa/clawhub/plugin-validation-fixes) مراجعه کنید، سپس دستور را دوباره اجرا کنید.

### `package delete <name>`

- بدون `--version`، یک بسته و همهٔ releaseهای آن را soft-delete می‌کند.
- `--version <version>` یک release غیرآخرِ متعلق به مالک را از طریق یک مسیر fail-closed و
  مخصوص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار دوباره نیستند. پیش از حذف نسخهٔ
  آخر فعلی، یک جایگزین منتشر کنید. این جریان فقط-نسخه به مالک بسته یا ادمین publisher
  سازمانی نیاز دارد؛ کارکنان پلتفرم مالکیت بسته را دور نمی‌زنند.
- soft-delete کل بسته به مالک بسته، مالک/ادمین publisher سازمانی، ناظر
  پلتفرم، یا ادمین پلتفرم نیاز دارد.
- flagها:
  - `--version <version>`: یک نسخهٔ غیرآخر را برای همیشه حذف کنید.
  - `--yes`: تأیید را رد کنید.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- یک بسته و releaseهای soft-deleted را بازیابی می‌کند.
- undelete نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- به مالک بسته، مالک/ادمین publisher سازمانی، ناظر پلتفرم،
  یا ادمین پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- flagها:
  - `--yes`: تأیید را رد کنید.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به publisher دیگری منتقل می‌کند.
- به دسترسی ادمین به هر دو مالک فعلی بسته و publisher مقصد
  نیاز دارد، مگر اینکه توسط ادمین پلتفرم انجام شود.
- نام‌های بستهٔ scoped باید به مالک scope مطابق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- flagها:
  - `--to <owner>`: handle مربوط به publisher مقصد.
  - `--reason <text>`: دلیل اختیاری audit.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- دستور احراز هویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه پیوند بخورند، و برای
  بررسی در دسترس ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- flagها:
  - `--version <version>`: نسخهٔ اختیاری بسته برای پیوست کردن به گزارش.
  - `--reason <text>`: دلیل گزارش الزامی.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- دستور مالک برای بررسی قابلیت مشاهدهٔ نظارتی بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی scan بسته، تعداد گزارش‌های باز، وضعیت نظارت دستی آخرین release،
  وضعیت مسدود بودن دانلود، و دلایل نظارتی را نشان می‌دهد.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آیندهٔ OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- blockerهای وضعیت رسمی، دسترسی‌پذیری ClawPack، digest مربوط به artifact،
  منشأ منبع، سازگاری OpenClaw، targetهای میزبان، metadata محیط،
  و وضعیت scan را گزارش می‌کند.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت migration متمرکز بر اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  plugin همراه OpenClaw شود.
- همان endpoint آمادگی محاسبه‌شده را مثل `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر migration، آخرین نسخه، وضعیت بستهٔ رسمی، بررسی‌ها، و
  blockerها را چاپ می‌کند.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- یک publisher سازمانی متعلق به کاربر احراز هویت‌شده ایجاد می‌کند.
- handle به حروف کوچک نرمال‌سازی می‌شود و می‌تواند با یا بدون `@` داده شود.
- publisherهای سازمانی تازه ایجادشده به‌صورت پیش‌فرض trusted/official نیستند.
- اگر handle از قبل توسط یک publisher، کاربر، یا مسیر رزروشدهٔ موجود استفاده شده باشد، شکست می‌خورد.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` موارد زیر را می‌پذیرد:
  - مسیر پوشهٔ محلی: `./my-plugin`
  - تاربال npm-pack محلی ClawPack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی بستهٔ OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI همان بایت‌های npm-pack را
  بارگذاری می‌کند و از محتوای استخراج‌شدهٔ `package/` فقط برای اعتبارسنجی و
  تکمیل اولیهٔ فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک تاربال npm نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند همان artifact دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل‌های استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، کامیت resolve‌شده، ref و زیرمسیر تکمیل می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صریحاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` payload انتشار resolve‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن توسط ماشین را برای CI تولید می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر کاربر یا سازمان منتشر می‌کند.
- نام‌های package دارای scope باید با owner انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- flagهای موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد یک انتشار live،
فرادادهٔ package resolve‌شده و انتساب منبع را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشهٔ محلی

برای Pluginهای کد، انتشار پوشه یک artifact نوع ClawPack را از
پوشهٔ package می‌سازد و بارگذاری می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

Pluginهای کد خارجی به مقدار کمی فرادادهٔ OpenClaw در
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

- `package.json.version` نسخهٔ انتشار package شما است، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فرادادهٔ اختیاری هستند.
  ClawHub ممکن است آن‌ها را در صورت وجود نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند اگر می‌خواهید
  فرادادهٔ سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخهٔ قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.
- اگر اعتبارسنجی یک کد remediation گزارش کرد، به
  [رفع‌های اعتبارسنجی Plugin](/fa/clawhub/plugin-validation-fixes) مراجعه کنید.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل‌استفادهٔ مجدد را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/package-publish.yml)
برای مخازن Plugin ارائه می‌کند.

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

- workflow قابل‌استفادهٔ مجدد به‌صورت پیش‌فرض `source` را روی مخزن caller قرار می‌دهد.
- برای monorepoها، `source_path` را ارسال کنید تا workflow پوشهٔ package مربوط به Plugin را
  منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفادهٔ مجدد را به یک tag پایدار یا SHA کامل commit pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلوده‌کننده نباشد.
- انتشارهای واقعی باید به eventهای مورداعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورداعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، packageهای نامطمئن، یا انتشارهای break-glass در دسترس نگه دارید.
- workflow نتیجهٔ JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در دسترس می‌گذارد.

### `package trusted-publisher get <name>`

- پیکربندی ناشر مورداعتماد GitHub Actions را برای یک package نشان می‌دهد.
- پس از تنظیم پیکربندی از این استفاده کنید تا مخزن، نام فایل workflow،
  و pin اختیاری environment را تأیید کنید.
- flagها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- پیکربندی ناشر مورداعتماد GitHub Actions را برای یک package موجود
  متصل یا جایگزین می‌کند.
- package باید ابتدا از طریق `clawhub package publish` معمولیِ دستی یا احراز هویت‌شده با token
  ایجاد شده باشد.
- پس از تنظیم پیکربندی، انتشارهای پشتیبانی‌شدهٔ آینده از GitHub Actions می‌توانند از
  OIDC/انتشار مورداعتماد بدون token بلندمدت ClawHub استفاده کنند.
- `--repository <repo>` باید `owner/repo` باشد.
- `--workflow-filename <file>` باید با نام فایل workflow در
  `.github/workflows/` مطابقت داشته باشد.
- `--environment <name>` اختیاری است. وقتی پیکربندی شود، environment در GitHub Actions
  داخل claim مربوط به OIDC باید دقیقاً مطابقت داشته باشد.
- ClawHub هنگام اجرای این دستور مخزن پیکربندی‌شدهٔ GitHub را تأیید می‌کند.
  مخازن عمومی می‌توانند از طریق فرادادهٔ عمومی GitHub تأیید شوند. مخازن خصوصی
  نیاز دارند ClawHub به آن مخزن دسترسی GitHub داشته باشد، برای مثال از طریق
  نصب آیندهٔ GitHub App متعلق به ClawHub یا یک integration مجاز دیگر
  در GitHub.
- flagها:
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

- پیکربندی ناشر مورداعتماد را از یک package حذف می‌کند.
- اگر workflow، مخزن، یا pin مربوط به environment باید
  غیرفعال یا دوباره ایجاد شود، از این به‌عنوان rollback استفاده کنید.
- انتشارهای واقعی آینده تا زمانی که پیکربندی دوباره تنظیم شود باید از انتشار احراز هویت‌شدهٔ معمولی استفاده کنند.
- flagها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### تله‌متری نصب

- پس از `clawhub install <slug>` وقتی وارد شده باشید ارسال می‌شود، مگر اینکه
  `CLAWHUB_DISABLE_TELEMETRY=1` تنظیم شده باشد.
- گزارش‌دهی best-effort است. اگر تله‌متری در دسترس نباشد، دستورهای نصب
  fail نمی‌شوند.
- جزئیات: `docs/telemetry.md`.
