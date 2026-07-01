---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی یا انتشار
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، و رفتار lockfile.'
x-i18n:
    generated_at: "2026-07-01T08:16:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4467e589a4892d513e4ca715b73a81147abb59cb7706b0068a11af6c95ea08f9
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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد به فضای کاری Clawdbot بازمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
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
پراکسی مشخص‌شده هدایت می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS استفاده
می‌شود و `HTTP_PROXY` برای HTTP ساده. `NO_PROXY` / `no_proxy` برای دور زدن
پراکسی برای میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این مورد در سیستم‌هایی لازم است که اتصال مستقیم خروجی در آن‌ها مسدود شده است
(برای مثال کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی،
یا فایروال‌های سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار تغییر نمی‌کند (اتصال مستقیم).

## فایل پیکربندی

توکن API شما + URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (`CLAWDHUB_CONFIG_PATH` قدیمی)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را در `<site>/cli/auth` باز می‌کند و از طریق callback در local loopback کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی از راه دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و درحالی‌که شما آن را در `<site>/cli/device` مجاز می‌کنید منتظر می‌ماند.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `token`

- توکن API ذخیره‌شده را در stdout چاپ می‌کند.
- برای pipe کردن یک توکن ورود محلی به فرمان‌های راه‌اندازی secret در CI مفید است.

### `star <skill>` / `unstar <skill>`

- یک skill را به برجسته‌های شما اضافه می‌کند یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- خروجی شامل slug مهارت، handle مالک، نام نمایشی، و امتیاز ارتباط است.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق token برای slug/name را ترجیح می‌دهد. یک token مستقل slug مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- محبوبیت یک prior کوچک در رتبه‌بندی است، نه تضمینی برای جایگاه نخست.
- اگر skillی باید نمایش داده شود اما نمی‌شود، درحالی‌که وارد شده‌اید `clawhub inspect @owner/slug` را اجرا کنید تا پیش از تغییر نام metadata، diagnostics مدیریت محتوای قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین Skills را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt`).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|rating|downloads|trending` (پیش‌فرض: newest). aliasهای قدیمی مرتب‌سازی نصب همچنان برای سازگاری کار می‌کنند.
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (summary تا 50 نویسه کوتاه می‌شود).

### `inspect @owner/slug`

- metadata مهارت و فایل‌های نسخه را بدون نصب واکشی می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: آخرین نسخه).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (برای مثال `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌ها برای فهرست کردن (1-200).
- `--files`: فهرست فایل‌های نسخه انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install @owner/slug`

- آخرین نسخه را برای مالک و مهارت نام‌گذاری‌شده resolve می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی Skills پین‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <skill>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)
  - `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- درحالی‌که وارد شده‌اید، telemetry best-effort ارسال می‌کند تا شمار نصب‌های فعلی
  بتوانند غیرفعال شوند.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی) را می‌خواند.
- کنار Skillsی که با `clawhub pin` ثابت شده‌اند، `pinned` را نشان می‌دهد، شامل دلیل اختیاری.

### `pin <skill>`

- یک skill نصب‌شده را در lockfile به‌عنوان پین‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا skill ثابت شده است.
- Skills پین‌شده توسط `update --all` رد می‌شوند و توسط `update <skill>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا bytes محلی تصادفی جایگزین نشود.

### `unpin <skill>`

- pin موجود در lockfile را از یک skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [@owner/slug]` / `update --all`

- fingerprint را از فایل‌های محلی محاسبه می‌کند.
- اگر fingerprint با یک نسخه شناخته‌شده تطابق داشته باشد: هیچ اعلان نشان داده نمی‌شود.
- اگر fingerprint تطابق نداشته باشد:
  - به‌طور پیش‌فرض خودداری می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با اعلان)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <skill>` برای Skills پین‌شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <skill>` را اجرا کنید.
- `update --all` slugهای پین‌شده را رد می‌کند و خلاصه‌ای از مواردی که ثابت ماندند چاپ می‌کند.

### `skill publish <path>`

- fingerprint بسته محلی را با ClawHub مقایسه می‌کند و وقتی محتوا قبلاً منتشر شده باشد
  با موفقیت خارج می‌شود.
- Skills جدید به‌طور پیش‌فرض `1.0.0` هستند؛ Skills تغییریافته به‌طور پیش‌فرض نسخه patch
  بعدی را می‌گیرند.
- `--version <version>` یک نسخه را صراحتاً انتخاب می‌کند و حتی وقتی محتوا با یک نسخه موجود
  تطابق دارد، منتشر می‌کند.
- `--dry-run` انتشار را بدون upload کردن resolve می‌کند؛ `--json` یک نتیجه
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک skill یعنی در ClawHub تحت `MIT-0` منتشر می‌شود.
- Skills منتشرشده برای استفاده، تغییر، و بازتوزیع بدون attribution آزاد هستند.
- ClawHub از Skills پولی یا قیمت‌گذاری برای هر skill پشتیبانی نمی‌کند.
- alias قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

workflow قابل‌استفاده مجدد ClawHub یعنی
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
برای یک `skill_path`، یا برای هر پوشه skill مستقیم زیر `root` (پیش‌فرض: `skills`) فرمان `skill publish` را فراخوانی می‌کند. Skills بدون تغییر را رد می‌کند و از همان رفتار خودکار نسخه patch استفاده می‌کند.

برای پیش‌نمایش بدون توکن، `dry_run: true` را تنظیم کنید. انتشار واقعی به secret
`clawhub_token` نیاز دارد.

### `sync`

- workdir فعلی، دایرکتوری Skills پیکربندی‌شده، و هر پوشه
  `--root <dir>` را برای پوشه‌های skill محلی که `SKILL.md` یا
  `skill.md` دارند اسکن می‌کند.
- fingerprint هر skill محلی را با ClawHub مقایسه می‌کند و فقط Skills جدید یا
  تغییریافته را منتشر می‌کند.
- Skills جدید به‌صورت `1.0.0` منتشر می‌شوند؛ Skills تغییریافته به‌طور پیش‌فرض نسخه patch بعدی
  را منتشر می‌کنند. برای دسته‌های به‌روزرسانی که باید با گام semver بزرگ‌تری حرکت کنند، از `--bump minor|major` استفاده کنید.
- `--dry-run` برنامه انتشار را بدون upload کردن نشان می‌دهد؛ `--json` یک برنامه
  قابل‌خواندن برای ماشین چاپ می‌کند.
- `--all` هر skill جدید یا تغییریافته را بدون اعلان منتشر می‌کند. بدون
  `--all`، ترمینال‌های تعاملی به شما اجازه می‌دهند Skills موردنظر برای انتشار را انتخاب کنید.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `sync` فقط انتشار یک‌طرفه است. نصب، به‌روزرسانی، دانلود، یا
  گزارش telemetry نصب/دانلود انجام نمی‌دهد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- به `clawhub login` نیاز دارد.
- ClawHub ClawScan را از طریق `POST /api/v1/skills/-/scan` اجرا می‌کند، سپس تا زمانی که scan نهایی شود polling می‌کند.
- scanها ناهمگام هستند و ممکن است تکمیل آن‌ها زمان ببرد. هنگام queued بودن، spinner ترمینال جایگاه فعلی scan اولویت‌بندی‌شده و تعداد scanهای جلوتر را نشان می‌دهد.
- scanهای منتشرشده به مالکیت یا دسترسی مدیریت ناشر نیاز دارند. moderators/admins می‌توانند از همان backend از طریق `clawhub-admin` استفاده کنند.
- `--update` فقط با `--slug` معتبر است؛ نتایج scan منتشرشده موفق را به نسخه انتخاب‌شده می‌نویسد.
- `--output <file.zip>` آرشیو کامل گزارش را با `manifest.json`، `clawscan.json`، `skillspector.json`، `static-analysis.json`، `virustotal.json`، و `README.md` دانلود می‌کند.
- `--json` پاسخ کامل polling را برای automation چاپ می‌کند.
- scan مسیر محلی دیگر پشتیبانی نمی‌شود. یک نسخه جدید upload کنید، سپس از `scan download` برای دریافت نتایج scan ذخیره‌شده برای آن نسخه ارسالی استفاده کنید.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- به `clawhub login` نیاز دارد.
- ZIP گزارش scan ذخیره‌شده را برای نسخه ارسالی یک skill یا Plugin دانلود می‌کند، شامل نسخه‌هایی که توسط بررسی‌های امنیتی ClawHub مسدود یا پنهان شده‌اند.
- دانلودهای skill از slug مهارت استفاده می‌کنند و پیش‌فرض آن‌ها `--kind skill` است.
- دانلودهای Plugin از نام بسته استفاده می‌کنند و به `--kind plugin` نیاز دارند.
- `--version` لازم است تا authors نسخه ارسالی دقیقی را که ClawHub مسدود کرده بررسی کنند.
- `--output <file.zip>` مسیر مقصد را انتخاب می‌کند.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub یک workflow رسمی قابل‌استفاده مجدد در
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/skill-publish.yml)
برای repoهای skill و repoهای catalog ارائه می‌کند.

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

یادداشت‌ها:

- مقدار پیش‌فرض `root` برای repoهای catalog برابر `skills` است.
- برای پردازش یک پوشه skill، `skill_path: skills/review-helper` را پاس بدهید.
- `owner` به پرچم CLI یعنی `--owner` نگاشت می‌شود؛ برای انتشار به‌عنوان کاربر احراز هویت‌شده، آن را حذف کنید.
- انتشار skill در V1 از `clawhub_token` استفاده می‌کند؛ انتشار مورداعتماد GitHub OIDC فعلاً فقط برای package است.

### `delete <skill>`

- بدون `--version`، یک مهارت را به‌صورت نرم حذف کنید (مالک، ناظر، یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم آغازشده توسط مالک، اسلاگ را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--version <version>` یک نسخه غیرآخرینِ متعلق به مالک را از طریق یک مسیر fail-closed و
  مختص نسخه، به‌طور دائمی حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار مجدد نیستند. پیش از حذف نسخه فعلیِ آخرین، یک جایگزین منتشر کنید.
  کارکنان پلتفرم در این جریان فقط-نسخه، مالکیت را دور نمی‌زنند.
- `--reason <text>` یک یادداشت نظارتی را روی حذف نرم کل مهارت و گزارش ممیزی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تایید را رد می‌کند.

### `undelete <skill>`

- یک مهارت پنهان را بازیابی کنید (مالک، ناظر، یا مدیر).
- بازیابی نسخه وجود ندارد؛ نسخه‌های حذف‌شده دائمی قابل بازیابی نیستند.
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی را روی مهارت و گزارش ممیزی ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تایید را رد می‌کند.

### `hide <skill>`

- یک مهارت را پنهان کنید (مالک، ناظر، یا مدیر).
- نام مستعار `delete`.

### `unhide <skill>`

- یک مهارت را از حالت پنهان خارج کنید (مالک، ناظر، یا مدیر).
- نام مستعار `undelete`.

### `skill rename <skill> <new-name>`

- نام یک مهارت متعلق به مالک را تغییر دهید و اسلاگ قبلی را به‌عنوان نام مستعار تغییرمسیر نگه دارید.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تایید را رد می‌کند.

### `skill merge <source> <target>`

- یک مهارت متعلق به مالک را در مهارت متعلق به مالک دیگری ادغام کنید.
- اسلاگ مبدا دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تایید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به هندل‌های کاربری یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به هندل‌های سازمان/ناشر فقط زمانی بلافاصله اعمال می‌شوند که عامل
  به مالک فعلی و ناشر مقصد، هر دو، دسترسی مدیریتی داشته باشد.
- زیرفرمان‌ها:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- نقاط پایانی:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- کاتالوگ یکپارچه بسته را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و ورودی‌های دیگر خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی مهارت است.
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
- از این برای فراداده Plugin، سازگاری، راستی‌آزمایی، منبع، و بررسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بررسی کنید (پیش‌فرض: آخرین).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بررسی کنید (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست کنید (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌ها برای فهرست‌کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست کنید.
- `--file <path>`: محتوای خام فایل را واکشی کنید (فقط فایل‌های متنی؛ سقف ۲۰۰ کیلوبایت).
- `--json`: خروجی قابل خواندن برای ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` حل می‌کند.
- آرتیفکت را از `downloadUrl` حل‌کننده دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همه آرتیفکت‌ها راستی‌آزمایی می‌کند.
- برای آرتیفکت‌های ClawPack npm-pack، یکپارچگی npm `sha512`،
  npm shasum، و نام/نسخه `package.json` تاربال را نیز راستی‌آزمایی می‌کند.
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

- SHA-256 مربوط به ClawHub، یکپارچگی npm `sha512`، و npm shasum را برای یک
  آرتیفکت محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub حل می‌کند و فایل
  محلی را با فراداده آرتیفکت منتشرشده مقایسه می‌کند.
- با پرچم‌های مستقیم digest، بدون جست‌وجوی شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای حل فراداده آرتیفکت مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه بسته مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: یکپارچگی مورد انتظار npm.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Plugin Inspector همراه CLI مربوط به ClawHub را روی پوشه بسته Plugin محلی
  اجرا می‌کند.
- پیش‌فرض، اعتبارسنجی آفلاین/ایستا است، بدون مکان‌یابی یا واردکردن یک checkout محلی
  OpenClaw.
- خطاهای سخت سازگاری با کد غیرصفر خارج می‌شوند. یافته‌های فقط-هشدار چاپ می‌شوند اما
  با کد صفر خارج می‌شوند.
- پرچم‌ها:
  - `--out <dir>`: گزارش‌های Plugin Inspector را در این دایرکتوری بنویسید.
  - `--openclaw <path>`: در برابر یک checkout محلی صریح OpenClaw بررسی کنید.
  - `--runtime`: ضبط زمان اجرا را فعال کنید؛ کد Plugin را وارد می‌کند.
  - `--allow-execute`: ضبط زمان اجرا را در یک فضای کاری ایزوله مجاز کنید.
  - `--no-mock-sdk`: SDK شبیه‌سازی‌شده OpenClaw را هنگام ضبط زمان اجرا غیرفعال کنید.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package validate ./example-plugin
```

اگر اعتبارسنجی، یافته‌ای درباره بسته، manifest، ایمپورت SDK، یا آرتیفکت گزارش کرد، به
[رفع‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید، سپس فرمان را دوباره اجرا کنید.

### `package delete <name>`

- بدون `--version`، یک بسته و همه انتشارها را به‌صورت نرم حذف می‌کند.
- `--version <version>` یک انتشار غیرآخرینِ متعلق به مالک را از طریق یک مسیر fail-closed و
  مختص نسخه، به‌طور دائمی حذف می‌کند.
  نسخه‌های حذف‌شده قابل بازیابی یا انتشار مجدد نیستند. پیش از حذف نسخه فعلیِ آخرین،
  یک جایگزین منتشر کنید. این جریان فقط-نسخه به مالک بسته یا یک مدیر ناشر سازمان نیاز دارد؛
  کارکنان پلتفرم مالکیت بسته را دور نمی‌زنند.
- حذف نرم کل بسته به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--version <version>`: یک نسخه غیرآخرین را به‌طور دائمی حذف کنید.
  - `--yes`: تایید را رد کنید.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای نرم‌حذف‌شده را بازیابی می‌کند.
- بازیابی نسخه وجود ندارد؛ نسخه‌های حذف‌شده دائمی قابل بازیابی نیستند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: تایید را رد کنید.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیریتی به مالک فعلی بسته و ناشر مقصد، هر دو،
  نیاز دارد، مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته scoped باید به مالک scope متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: هندل ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری ممیزی.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش‌دادن یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه پیوند بخورند، و برای بازبینی
  برای ناظران قابل مشاهده می‌شوند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست به گزارش.
  - `--reason <text>`: دلیل گزارش اجباری.
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی نظارتی بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت نظارت دستی آخرین انتشار،
  وضعیت مسدودسازی دانلود، و دلایل نظارتی را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌ها را برای وضعیت رسمی، دسترس‌پذیری ClawPack، digest آرتیفکت،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فراداده محیط،
  و وضعیت اسکن گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت اپراتورمحور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
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
- هندل به حروف کوچک نرمال‌سازی می‌شود و می‌تواند با یا بدون `@` ارسال شود.
- ناشران سازمانی تازه ایجادشده به‌طور پیش‌فرض مورد اعتماد/رسمی نیستند.
- اگر هندل از قبل توسط یک ناشر، کاربر، یا مسیر رزروشده موجود استفاده شده باشد، شکست می‌خورد.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال محلی ClawPack ساخته‌شده با npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL ‏GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`،‏ `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI دقیقاً همان بایت‌های npm-pack را
  بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک تاربال npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند همان آرتیفکت دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، کامیت resolve‌شده، ref، و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صراحتاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` بار مفید انتشار resolve‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل خواندن توسط ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر handle ناشر کاربر یا سازمان منتشر می‌کند.
- نام‌های بسته scoped باید با owner انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- flagهای موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد یک انتشار زنده،
فراداده package و انتساب منبع resolve‌شده را تأیید کنید:

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
  fallback برای اعتبارسنجی سازگاری/بیلد OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است آن‌ها را در صورت وجود نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند، اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI ‏`clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.
- اگر اعتبارسنجی یک کد اصلاح گزارش کرد، به
  [اصلاح‌های اعتبارسنجی Plugin](/clawhub/plugin-validation-fixes) مراجعه کنید.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل استفاده مجدد را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/package-publish.yml)
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

- workflow قابل استفاده مجدد، `source` را به‌صورت پیش‌فرض روی مخزن caller قرار می‌دهد.
- برای monorepoها، `source_path` را پاس دهید تا workflow پوشه package مربوط به Plugin را
  منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل استفاده مجدد را به یک tag پایدار یا SHA کامل کامیت pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی باقی بماند.
- انتشارهای واقعی باید به رویدادهای قابل اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار قابل اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، packageهای غیرقابل اعتماد، یا انتشارهای اضطراری در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow ارائه می‌دهد.

### `package trusted-publisher get <name>`

- پیکربندی ناشر قابل اعتماد GitHub Actions را برای یک package نشان می‌دهد.
- پس از تنظیم پیکربندی، از این دستور برای تأیید repository، نام فایل workflow،
  و pin اختیاری environment استفاده کنید.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- پیکربندی ناشر قابل اعتماد GitHub Actions را برای یک
  package موجود متصل یا جایگزین می‌کند.
- package باید ابتدا از طریق `clawhub package publish` عادی دستی یا احراز هویت‌شده با token
  ایجاد شده باشد.
- پس از تنظیم پیکربندی، انتشارهای پشتیبانی‌شده آینده GitHub Actions می‌توانند از
  OIDC/انتشار قابل اعتماد بدون token بلندمدت ClawHub استفاده کنند.
- `--repository <repo>` باید `owner/repo` باشد.
- `--workflow-filename <file>` باید با نام فایل workflow در
  `.github/workflows/` مطابقت داشته باشد.
- `--environment <name>` اختیاری است. وقتی پیکربندی شود، environment مربوط به GitHub Actions
  در claim ‏OIDC باید دقیقاً مطابقت داشته باشد.
- ClawHub هنگام اجرای این دستور، repository پیکربندی‌شده GitHub را تأیید می‌کند.
  repositoryهای عمومی را می‌توان از طریق فراداده عمومی GitHub تأیید کرد. repositoryهای خصوصی
  نیاز دارند ClawHub به آن repository در GitHub دسترسی داشته باشد، برای
  مثال از طریق نصب آینده GitHub App متعلق به ClawHub یا یک یکپارچه‌سازی مجاز دیگر
  با GitHub.
- flagها:
  - `--repository <repo>`: repository ‏GitHub، برای مثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: نام فایل workflow، برای مثال `package-publish.yml`.
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

- پیکربندی ناشر قابل اعتماد را از یک package حذف می‌کند.
- اگر pin مربوط به workflow، repository، یا environment نیاز به
  غیرفعال شدن یا ایجاد دوباره دارد، از این به‌عنوان rollback استفاده کنید.
- انتشارهای واقعی آینده باید تا زمانی که پیکربندی دوباره تنظیم شود، از انتشار عادی احراز هویت‌شده استفاده کنند.
- flagها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### تله‌متری نصب

- پس از `clawhub install <slug>` هنگام ورود به حساب ارسال می‌شود، مگر اینکه
  `CLAWHUB_DISABLE_TELEMETRY=1` تنظیم شده باشد.
- گزارش‌دهی best-effort است. اگر تله‌متری در دسترس نباشد،
  دستورهای install شکست نمی‌خورند.
- جزئیات: `docs/telemetry.md`.
