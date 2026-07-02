---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی یا انتشار
summary: 'مرجع CLI: دستورها، پرچم‌ها، پیکربندی و رفتار lockfile.'
x-i18n:
    generated_at: "2026-07-02T17:41:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
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
- `--site <url>`: نشانی URL پایه برای ورود از مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: نشانی URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

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
پراکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و
`HTTP_PROXY` برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دور زدن
پراکسی در میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این کار در سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم مسدود شده‌اند
(برای مثال کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی،
یا دیواره‌های آتش سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما و URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسیر جایگزین قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` قدیمی)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را در `<site>/cli/auth` باز می‌کند و از طریق callback مربوط به local loopback کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی راه دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا آن را در `<site>/cli/device` تأیید کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `token`

- توکن API ذخیره‌شده را در stdout چاپ می‌کند.
- برای پایپ کردن توکن ورود محلی به دستورهای راه‌اندازی secret در CI مفید است.

### `star <skill>` / `unstar <skill>`

- یک مهارت را به موارد برجسته شما اضافه می‌کند یا از آن‌ها برمی‌دارد.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- خروجی شامل slug مهارت، handle مالک، نام نمایشی و امتیاز ارتباط است.
- جست‌وجو قبل از محبوبیت دانلود، تطابق‌های دقیق token در slug/name را ترجیح می‌دهد. یک token مستقل slug مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- محبوبیت یک prior رتبه‌بندی کوچک است، نه تضمینی برای جایگاه برتر.
- اگر مهارتی باید نمایش داده شود اما نمی‌شود، هنگام ورود، `clawhub inspect @owner/slug` را اجرا کنید تا پیش از تغییر نام metadata، diagnostics تعدیل قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt` مرتب‌شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|rating|downloads|trending` (پیش‌فرض: newest). نام‌های مستعار قدیمی مرتب‌سازی نصب همچنان برای سازگاری کار می‌کنند.
  - `--json` (خروجی قابل خواندن توسط ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه به 50 نویسه کوتاه می‌شود).

### `inspect @owner/slug`

- metadata مهارت و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: latest).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: حداکثر تعداد نسخه‌ها برای فهرست کردن (1-200).
- `--files`: فهرست فایل‌های نسخه انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل خواندن توسط ماشین.

### `install @owner/slug`

- جدیدترین نسخه را برای مالک و مهارت نام‌برده resolve می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pinned خودداری می‌کند؛ ابتدا `clawhub unpin <skill>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- هنگام ورود، telemetry را به‌صورت best-effort ارسال می‌کند تا شمارش نصب‌های فعلی بتواند
  غیرفعال شود.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی) را می‌خواند.
- کنار مهارت‌هایی که با `clawhub pin` منجمد شده‌اند، `pinned` را همراه با دلیل اختیاری نشان می‌دهد.

### `pin <skill>`

- یک مهارت نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا مهارت منجمد شده است.
- مهارت‌های pinned توسط `update --all` رد می‌شوند و توسط `update <skill>` مستقیم پذیرفته نمی‌شوند.
- مهارت‌های pinned همچنین `install --force` را رد می‌کنند تا bytes محلی تصادفی جایگزین نشوند.

### `unpin <skill>`

- pin مربوط به lockfile را از یک مهارت نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [@owner/slug]` / `update --all`

- fingerprint را از فایل‌های محلی محاسبه می‌کند.
- اگر fingerprint با یک نسخه شناخته‌شده تطابق داشته باشد: اعلانی نمایش داده نمی‌شود.
- اگر fingerprint تطابق نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با اعلان)
- مهارت‌های pinned هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <skill>` برای مهارت‌های pinned سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <skill>` را اجرا کنید.
- `update --all` از slugهای pinned عبور می‌کند و خلاصه‌ای از مواردی که منجمد باقی ماندند چاپ می‌کند.

### `skill publish <path>`

- fingerprint بسته محلی را با ClawHub مقایسه می‌کند و وقتی
  محتوا از قبل منتشر شده باشد با موفقیت خارج می‌شود.
- مهارت‌های جدید به‌طور پیش‌فرض `1.0.0` هستند؛ مهارت‌های تغییریافته به‌طور پیش‌فرض نسخه patch
  بعدی را می‌گیرند.
- `--version <version>` یک نسخه را به‌صراحت انتخاب می‌کند و حتی وقتی
  محتوا با یک نسخه موجود تطابق داشته باشد، منتشر می‌کند.
- `--dry-run` انتشار را بدون upload کردن resolve می‌کند؛ `--json` یک نتیجه
  قابل خواندن توسط ماشین چاپ می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک مهارت موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و review در `docs/publishing.md` توضیح داده شده است.
- انتشار یک مهارت یعنی آن مهارت در ClawHub تحت `MIT-0` منتشر می‌شود.
- مهارت‌های منتشرشده را می‌توان آزادانه استفاده، تغییر و بازتوزیع کرد، بدون نیاز به attribution.
- ClawHub از مهارت‌های پولی یا قیمت‌گذاری جداگانه برای هر مهارت پشتیبانی نمی‌کند.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow قابل استفاده مجدد
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
در ClawHub، `skill publish` را برای یک `skill_path`، یا برای هر پوشه مهارت بی‌واسطه
زیر `root` (پیش‌فرض: `skills`) فراخوانی می‌کند. مهارت‌های بدون تغییر را رد می‌کند و از همان
رفتار خودکار نسخه patch استفاده می‌کند.

برای پیش‌نمایش بدون توکن، `dry_run: true` را تنظیم کنید. انتشار واقعی به secret
`clawhub_token` نیاز دارد.

### `sync`

- workdir فعلی، دایرکتوری skills پیکربندی‌شده و هر پوشه
  `--root <dir>` را برای پوشه‌های مهارت محلی که شامل `SKILL.md` یا
  `skill.md` هستند اسکن می‌کند.
- fingerprint هر مهارت محلی را با ClawHub مقایسه می‌کند و فقط مهارت‌های جدید یا
  تغییریافته را منتشر می‌کند.
- مهارت‌های جدید با `1.0.0` منتشر می‌شوند؛ مهارت‌های تغییریافته به‌طور پیش‌فرض نسخه patch بعدی
  را منتشر می‌کنند. برای batchهای به‌روزرسانی که باید با یک گام semver
  بزرگ‌تر حرکت کنند از `--bump minor|major` استفاده کنید.
- `--dry-run` برنامه انتشار را بدون upload کردن نشان می‌دهد؛ `--json` یک برنامه
  قابل خواندن توسط ماشین چاپ می‌کند.
- `--all` هر مهارت جدید یا تغییریافته را بدون اعلان منتشر می‌کند. بدون
  `--all`، ترمینال‌های تعاملی اجازه می‌دهند مهارت‌های مورد انتشار را انتخاب کنید.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `sync` فقط انتشار یک‌طرفه است. نصب، به‌روزرسانی، دانلود یا
  گزارش telemetry نصب/دانلود انجام نمی‌دهد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- به `clawhub login` نیاز دارد.
- ClawHub ClawScan را از طریق `POST /api/v1/skills/-/scan` اجرا می‌کند، سپس تا زمانی که scan terminal شود polling می‌کند.
- scanها ناهمگام هستند و ممکن است تکمیلشان زمان ببرد. هنگام قرار داشتن در صف، spinner ترمینال موقعیت اولویت‌دار فعلی scan و تعداد scanهای جلوتر را نشان می‌دهد.
- scanهای منتشرشده به مالکیت یا دسترسی مدیریت ناشر نیاز دارند. moderators/admins می‌توانند از همان backend از طریق `clawhub-admin` استفاده کنند.
- `--update` فقط با `--slug` معتبر است؛ نتایج موفق scan منتشرشده را دوباره در نسخه انتخاب‌شده می‌نویسد.
- `--output <file.zip>` آرشیو کامل گزارش را همراه با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json` و `README.md` دانلود می‌کند.
- `--json` پاسخ کامل poll را برای automation چاپ می‌کند.
- scan مسیر محلی دیگر پشتیبانی نمی‌شود. یک نسخه جدید upload کنید، سپس از `scan download` برای بازیابی نتایج scan ذخیره‌شده برای آن نسخه ارسالی استفاده کنید.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- به `clawhub login` نیاز دارد.
- گزارش ZIP ذخیره‌شده scan را برای یک نسخه ارسالی مهارت یا Plugin دانلود می‌کند، از جمله نسخه‌هایی که توسط بررسی‌های امنیتی ClawHub مسدود یا پنهان شده‌اند.
- دانلودهای مهارت از slug مهارت استفاده می‌کنند و به‌طور پیش‌فرض `--kind skill` هستند.
- دانلودهای Plugin از نام بسته استفاده می‌کنند و به `--kind plugin` نیاز دارند.
- `--version` لازم است تا authors نسخه ارسالی دقیق را که ClawHub مسدود کرده است بررسی کنند.
- `--output <file.zip>` مسیر مقصد را انتخاب می‌کند.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub یک workflow رسمی قابل استفاده مجدد را در
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
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

نکات:

- `root` برای repoهای catalog به‌طور پیش‌فرض `skills` است.
- برای پردازش یک پوشه مهارت، `skill_path: skills/review-helper` را pass کنید.
- `owner` به پرچم CLI `--owner` نگاشت می‌شود؛ برای انتشار به‌عنوان کاربر احراز هویت‌شده، آن را حذف کنید.
- انتشار مهارت V1 از `clawhub_token` استفاده می‌کند؛ انتشار مورد اعتماد GitHub OIDC فعلاً فقط برای package است.

### `delete <skill>`

- بدون `--version`، یک skill را به‌صورت soft-delete حذف کنید (مالک، ناظر یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهایی که مالک آغاز می‌کند، slug را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--version <version>` یک نسخه غیرآخرینِ تحت مالکیت را از طریق یک مسیر fail-closed
  و مخصوص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار مجدد نیستند. پیش از حذف نسخه فعلی latest، یک جایگزین منتشر کنید.
  کارکنان پلتفرم برای این جریان فقط-نسخه، مالکیت را دور نمی‌زنند.
- `--reason <text>` یک یادداشت نظارتی را روی soft-delete کل skill و گزارش ممیزی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تایید را رد می‌کند.

### `undelete <skill>`

- یک skill پنهان را بازیابی کنید (مالک، ناظر یا مدیر).
- undelete نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی را روی skill و گزارش ممیزی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تایید را رد می‌کند.

### `hide <skill>`

- یک skill را پنهان کنید (مالک، ناظر یا مدیر).
- نام مستعار `delete`.

### `unhide <skill>`

- یک skill را از حالت پنهان خارج کنید (مالک، ناظر یا مدیر).
- نام مستعار `undelete`.

### `skill rename <skill> <new-name>`

- یک skill تحت مالکیت را تغییر نام دهید و slug قبلی را به‌عنوان نام مستعار تغییرمسیر نگه دارید.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تایید را رد می‌کند.

### `skill merge <source> <target>`

- یک skill تحت مالکیت را در skill تحت مالکیت دیگری ادغام کنید.
- slug مبدا دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تایید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال به handleهای کاربری یک درخواست معلق ایجاد می‌کند که گیرنده آن را می‌پذیرد.
- انتقال به handleهای سازمان/ناشر فقط زمانی بلافاصله اعمال می‌شود که عامل
  به هر دو مالک فعلی و ناشر مقصد دسترسی مدیر داشته باشد.
- زیر‌فرمان‌ها:
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

- کاتالوگ یکپارچه بسته را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جستجو می‌کند.
- از این برای pluginها و دیگر ورودی‌های خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جستجوی skill باقی می‌ماند.
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
- `--tag <tag>`: یک نسخه برچسب‌خورده را بررسی کنید (مثلا `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست کنید (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌هایی که فهرست می‌شوند (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست کنید.
- `--file <path>`: محتوای خام فایل را دریافت کنید (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` حل می‌کند.
- artifact را از `downloadUrl` مربوط به resolver دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، درستی npm `sha512`،
  shasum مربوط به npm، و نام/نسخه `package.json` مربوط به tarball را نیز راستی‌آزمایی می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود کنید.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود کنید (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا پوشه خروجی.
  - `--force`: فایل خروجی موجود را بازنویسی کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 مربوط به ClawHub، درستی npm `sha512`، و shasum مربوط به npm را برای یک
  artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub حل می‌کند و
  فایل محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون جستجوی شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای حل فراداده مورد انتظار artifact.
  - `--version <version>` یا `--tag <tag>`: نسخه بسته مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: درستی مورد انتظار npm.
  - `--npm-shasum <sha1>`: shasum مورد انتظار npm.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Plugin Inspector همراه CLI مربوط به ClawHub را روی پوشه بسته plugin محلی
  اجرا می‌کند.
- پیش‌فرض، اعتبارسنجی آفلاین/ایستا است، بدون پیدا کردن یا import کردن یک checkout محلی
  OpenClaw.
- خطاهای سخت سازگاری با کد غیرصفر خارج می‌شوند. یافته‌های فقط-هشدار چاپ می‌شوند اما
  با کد صفر خارج می‌شوند.
- پرچم‌ها:
  - `--out <dir>`: گزارش‌های Plugin Inspector را در این پوشه بنویسید.
  - `--openclaw <path>`: در برابر یک checkout محلی صریح OpenClaw بررسی کنید.
  - `--runtime`: ضبط runtime را فعال کنید؛ کد plugin را import می‌کند.
  - `--allow-execute`: ضبط runtime را در یک فضای کاری ایزوله مجاز کنید.
  - `--no-mock-sdk`: SDK شبیه‌سازی‌شده OpenClaw را هنگام ضبط runtime غیرفعال کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package validate ./example-plugin
```

اگر اعتبارسنجی یک یافته بسته، manifest، import از SDK، یا artifact گزارش کرد، به
[رفع‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید، سپس فرمان را دوباره اجرا کنید.

### `package delete <name>`

- بدون `--version`، یک بسته و همه انتشارها را به‌صورت soft-delete حذف می‌کند.
- `--version <version>` یک انتشار غیرآخرینِ تحت مالکیت را از طریق یک مسیر fail-closed
  و مخصوص نسخه، برای همیشه حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار مجدد نیستند. پیش از حذف نسخه فعلی latest، یک جایگزین منتشر کنید.
  این جریان فقط-نسخه به مالک بسته یا مدیر ناشر سازمان نیاز دارد؛ کارکنان پلتفرم مالکیت بسته را دور نمی‌زنند.
- soft-delete کل بسته به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--version <version>`: یک نسخه غیرآخرین را برای همیشه حذف کنید.
  - `--yes`: تایید را رد کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای soft-deleted را بازیابی می‌کند.
- undelete نسخه وجود ندارد؛ نسخه‌هایی که برای همیشه حذف شده‌اند قابل بازیابی نیستند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: تایید را رد کنید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به هر دو مالک فعلی بسته و ناشر مقصد نیاز دارد،
  مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته scoped باید به مالک scope مطابق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: handle ناشر مقصد.
  - `--reason <text>`: دلیل ممیزی اختیاری.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز‌هویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، به‌صورت اختیاری به یک نسخه گره می‌خورند، و برای بررسی
  برای ناظران قابل مشاهده می‌شوند.
- گزارش‌ها به‌خودی‌خود بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه بسته اختیاری برای پیوست به گزارش.
  - `--reason <text>`: دلیل گزارش الزامی.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی نمایانی نظارتی بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، شمار گزارش‌های باز، وضعیت نظارت دستی آخرین انتشار،
  وضعیت مسدودسازی دانلود، و دلایل نظارتی را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌ها را برای وضعیت رسمی، دسترس‌پذیری ClawPack، digest مربوط به artifact،
  provenance منبع، سازگاری OpenClaw، هدف‌های میزبان، فراداده محیط،
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
- همان endpoint readiness محاسبه‌شده را مانند `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- یک ناشر سازمانی متعلق به کاربر احراز‌هویت‌شده ایجاد می‌کند.
- handle به حروف کوچک نرمال‌سازی می‌شود و می‌تواند با یا بدون `@` داده شود.
- ناشران سازمانی تازه‌ایجادشده به‌صورت پیش‌فرض مورد اعتماد/رسمی نیستند.
- اگر handle قبلا توسط یک ناشر، کاربر، یا مسیر رزروشده موجود استفاده شده باشد، شکست می‌خورد.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- یک Code Plugin یا Bundle Plugin را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال محلی ClawPack ساخته‌شده با npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - نشانی GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json` و
  نشانگرهای واقعی Bundle در OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json` و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI همان بایت‌های دقیق npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده استفاده می‌کند.
- پوشه‌های Code Plugin پیش از بارگذاری در یک تاربال npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند آرتیفکت دقیق را تأیید کنند. پوشه‌های Bundle Plugin همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، کامیت حل‌شده، ref و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Code Pluginهای خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را به‌صراحت اعلام کنند.
  مقدار سطح بالای `package.json.version` به‌عنوان جایگزین برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` بار انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن توسط ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی کنشگر دسترسی ناشر داشته باشد، انتشار را زیر شناسه ناشر کاربر یا سازمان انجام می‌دهد.
- نام‌های پکیج scoped باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- فلگ‌های موجود (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید فراداده پکیج حل‌شده و
انتساب منبع را پیش از ایجاد یک انتشار واقعی تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای Code Pluginها، انتشار پوشه یک آرتیفکت ClawPack را از
پوشه پکیج می‌سازد و بارگذاری می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

Code Pluginهای خارجی به مقدار کمی فراداده OpenClaw در
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

- `package.json.version` نسخه انتشار پکیج شماست، اما به‌عنوان
  جایگزین برای اعتبارسنجی سازگاری/بیلد OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند، اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.
- اگر اعتبارسنجی یک کد اصلاح گزارش کرد، به
  [اصلاح‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی و قابل‌استفاده‌مجدد در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
برای مخازن Plugin ارائه می‌کند.

تنظیم معمول فراخواننده:

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

- workflow قابل‌استفاده‌مجدد، مقدار پیش‌فرض `source` را مخزن فراخواننده قرار می‌دهد.
- برای monorepoها، `source_path` را ارسال کنید تا workflow پوشه پکیج Plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفاده‌مجدد را به یک tag پایدار یا SHA کامل کامیت pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی باقی بماند.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای نخستین انتشار، پکیج‌های نامطمئن یا انتشارهای اضطراری در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow ارائه می‌دهد.

### `package trusted-publisher get <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک پکیج نشان می‌دهد.
- پس از تنظیم پیکربندی، از این دستور استفاده کنید تا مخزن، نام فایل workflow
  و pin اختیاری environment را تأیید کنید.
- فلگ‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- پیکربندی ناشر مورد اعتماد GitHub Actions را برای یک پکیج موجود
  متصل یا جایگزین می‌کند.
- پکیج باید ابتدا از طریق انتشار معمولی دستی یا احراز هویت‌شده با token
  `clawhub package publish` ایجاد شده باشد.
- پس از تنظیم پیکربندی، انتشارهای پشتیبانی‌شده آینده از GitHub Actions می‌توانند از
  OIDC/انتشار مورد اعتماد بدون token بلندمدت ClawHub استفاده کنند.
- `--repository <repo>` باید `owner/repo` باشد.
- `--workflow-filename <file>` باید با نام فایل workflow در
  `.github/workflows/` مطابقت داشته باشد.
- `--environment <name>` اختیاری است. وقتی پیکربندی شود، environment مربوط به GitHub Actions
  در claim مربوط به OIDC باید دقیقاً مطابقت داشته باشد.
- ClawHub هنگام اجرای این دستور مخزن GitHub پیکربندی‌شده را تأیید می‌کند.
  مخازن عمومی می‌توانند از طریق فراداده عمومی GitHub تأیید شوند. مخازن خصوصی
  نیاز دارند ClawHub به آن مخزن دسترسی GitHub داشته باشد، برای
  مثال از طریق نصب آینده GitHub App مربوط به ClawHub یا یک یکپارچه‌سازی مجاز دیگر
  با GitHub.
- فلگ‌ها:
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

- پیکربندی ناشر مورد اعتماد را از یک پکیج حذف می‌کند.
- اگر لازم است pin مربوط به workflow، مخزن یا environment
  غیرفعال یا دوباره ایجاد شود، از این به‌عنوان rollback استفاده کنید.
- انتشارهای واقعی آینده باید تا زمانی که پیکربندی دوباره تنظیم شود از انتشار احراز هویت‌شده معمولی استفاده کنند.
- فلگ‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### تله‌متری نصب

- پس از `clawhub install <slug>` در حالت واردشده ارسال می‌شود، مگر اینکه
  `CLAWHUB_DISABLE_TELEMETRY=1` تنظیم شده باشد.
- گزارش‌دهی بر پایه بهترین تلاش است. اگر تله‌متری در دسترس نباشد، دستورهای نصب
  شکست نمی‌خورند.
- جزئیات: `docs/telemetry.md`.
