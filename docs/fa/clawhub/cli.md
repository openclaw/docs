---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: دستورها، فلگ‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-11T20:24:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
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
- `--site <url>`: URL پایه برای ورود از مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های محیطی:

- `CLAWHUB_SITE` (قدیمی: `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی: `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی: `CLAWDHUB_WORKDIR`)

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

این کار در سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم در آن‌ها مسدود شده است
(برای مثال کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پروکسی،
فایروال‌های سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پروکسی تنظیم نشده باشد، رفتار بدون تغییر است (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما و URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی: `CLAWDHUB_CONFIG_PATH`)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback لوپ‌بک کامل می‌شود.
- بدون محیط گرافیکی: `clawhub login --token clh_...`
- تعاملی از راه دور/بدون محیط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا شما آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک مهارت را به موارد برجسته شما اضافه یا از آن حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- دانلودها یک پیش‌فرض کوچک برای محبوبیت هستند، نه تضمینی برای قرارگیری در رتبه اول.
- اگر یک مهارت باید نمایش داده شود اما نمی‌شود، پیش از تغییر نام فراداده، در حالت واردشده `clawhub inspect <slug>` را اجرا کنید تا عیب‌یابی‌های مدیریت قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt`).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن توسط ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه به 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- فراداده مهارت و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: latest).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: حداکثر تعداد نسخه‌ها برای فهرست کردن (1-200).
- `--files`: فهرست فایل‌های نسخه انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن توسط ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- فایل zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های سنجاق‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی: `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی: `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: تأیید می‌خواهد.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- فایل `<workdir>/.clawhub/lock.json` را می‌خواند (`.clawdhub` قدیمی).
- کنار Skills که با `clawhub pin` ثابت شده‌اند، `pinned` را نمایش می‌دهد، شامل دلیل اختیاری.

### `pin <slug>`

- یک Skills نصب‌شده را در lockfile به‌عنوان ثابت‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا Skills ثابت شده است.
- Skills ثابت‌شده توسط `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- Skills ثابت‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی به‌طور تصادفی جایگزین نشوند.

### `unpin <slug>`

- پین lockfile را از یک Skills نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: هیچ پرسشی نمایش داده نمی‌شود.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌صورت پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با پرسش)
- Skills ثابت‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای ثابت‌شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای ثابت‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی را چاپ می‌کند که ثابت باقی ماندند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (چندبخشی) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که عامل دسترسی ناشر داشته باشد، زیر handle ناشر سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار نسخه جدید، یک Skills موجود را به `--owner` منتقل می‌کند. به دسترسی مدیر/مالک در هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک Skills یعنی آن Skills تحت `MIT-0` در ClawHub منتشر شده است.
- Skills منتشرشده را می‌توان آزادانه بدون ذکر منبع استفاده، تغییر و بازتوزیع کرد.
- ClawHub از Skills پولی یا قیمت‌گذاری جداگانه برای هر Skills پشتیبانی نمی‌کند.
- نام مستعار قدیمی: `publish <path>`.

### `delete <slug>`

- یک Skills را به‌صورت نرم حذف می‌کند (مالک، ناظر، یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم آغازشده توسط مالک، slug را به‌مدت ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی Skills و گزارش حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک Skills پنهان را بازیابی می‌کند (مالک، ناظر، یا مدیر).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی Skills و گزارش حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک Skills را پنهان می‌کند (مالک، ناظر، یا مدیر).
- نام مستعار برای `delete`.

### `unhide <slug>`

- یک Skills را از حالت پنهان خارج می‌کند (مالک، ناظر، یا مدیر).
- نام مستعار برای `undelete`.

### `skill rename <slug> <new-slug>`

- نام یک Skills تحت مالکیت را تغییر می‌دهد و slug قبلی را به‌عنوان نام مستعار تغییرمسیر نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک Skills تحت مالکیت را در Skills تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill rescan <slug>`

- برای آخرین نسخه منتشرشده Skills درخواست اسکن مجدد امنیتی می‌دهد.
- مالکان و مدیران ناشر می‌توانند Skills خودشان را تا سقف بازیابی هر نسخه دوباره اسکن کنند.
- ناظران و مدیران پلتفرم می‌توانند هر Skills را دوباره اسکن کنند و توسط سقف بازیابی مالک مسدود نمی‌شوند، هرچند در هر زمان برای هر نسخه فقط یک اسکن مجدد می‌تواند اجرا شود.
- `POST /api/v1/skills/{slug}/rescan` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال به handleهای کاربر یک درخواست در انتظار ایجاد می‌کند که گیرنده آن را می‌پذیرد.
- انتقال به handleهای سازمان/ناشر فقط زمانی فوراً اعمال می‌شود که عامل به هر دو ناشر، یعنی مالک فعلی و مقصد، دسترسی مدیر داشته باشد.
- زیرفرمان‌ها:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- نقطه‌های پایانی:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- کاتالوگ یکپارچه بسته را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و دیگر ورودی‌های خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی Skills باقی می‌ماند.
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
  - `--limit <n>` (۱ تا ۱۰۰، پیش‌فرض: ۲۵)
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

- فراداده بسته را بدون نصب دریافت می‌کند.
- از این برای فراداده Plugin، سازگاری، راستی‌آزمایی، منبع، و بازرسی نسخه/فایل استفاده کنید.
- `--version <version>`: بازرسی یک نسخه مشخص (پیش‌فرض: آخرین نسخه).
- `--tag <tag>`: بازرسی یک نسخه برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌ها برای فهرست کردن (۱ تا ۱۰۰).
- `--files`: فهرست فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل خواندن توسط ماشین.

### `package download <name>`

- نسخه بسته را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` حل می‌کند.
- artifact را از `downloadUrl` حل‌کننده دانلود می‌کند.
- SHA-256 ClawHub را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، یکپارچگی npm `sha512`، npm shasum، و نام/نسخه `package.json` در tarball را نیز راستی‌آزمایی می‌کند.
- نسخه‌های ZIP قدیمی از مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: دانلود یک نسخه مشخص.
  - `--tag <tag>`: دانلود یک نسخه برچسب‌خورده (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا پوشه خروجی.
  - `--force`: بازنویسی یک فایل خروجی موجود.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 ClawHub، یکپارچگی npm `sha512`، و npm shasum را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub حل می‌کند و فایل محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های مستقیم digest، بدون جست‌وجوی شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای حل فراداده مورد انتظار artifact.
  - `--version <version>` یا `--tag <tag>`: نسخه بسته مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: یکپارچگی مورد انتظار npm.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمانی، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای نرم‌حذف‌شده را بازیابی می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمانی، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به هم مالک فعلی بسته و هم ناشر مقصد
  نیاز دارد، مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته دارای محدوده باید به مالک محدوده متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری برای ممیزی.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- درخواست اسکن امنیتی دوباره برای آخرین انتشار منتشرشده بسته.
- مالکان و مدیران ناشر می‌توانند بسته‌های خودشان را تا سقف بازیابی
  هر انتشار دوباره اسکن کنند.
- ناظران و مدیران پلتفرم می‌توانند هر بسته‌ای را دوباره اسکن کنند و
  با سقف بازیابی مالک مسدود نمی‌شوند، هرچند در هر انتشار فقط یک اسکن دوباره می‌تواند هم‌زمان اجرا شود.
- `POST /api/v1/packages/{name}/rescan` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- فرمان احرازهویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه پیوند بخورند، و
  برای بازبینی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌خودی‌خود بسته‌ها را پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- فرمان مالک/ناشر برای اعتراض به تعدیل انتشار.
- `POST /api/v1/packages/{name}/appeal` را فراخوانی می‌کند.
- اعتراض‌ها برای انتشارهای قرنطینه‌شده، لغوشده، مشکوک، یا مخرب
  پذیرفته می‌شوند.
- پرچم‌ها:
  - `--version <version>`: نسخه الزامی بسته.
  - `--message <text>`: پیام الزامی اعتراض.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی تعدیل بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت تعدیل دستی آخرین انتشار،
  وضعیت مسدودسازی دانلود، و دلایل تعدیل را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- بازدارنده‌های وضعیت رسمی، دسترس‌پذیری ClawPack، چکیده مصنوع،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فراداده محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت متمرکز بر اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان نقطه پایانی آمادگی محاسبه‌شده مانند `package readiness` را فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  بازدارنده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال محلی ClawPack ساخته‌شده با npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - نشانی GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI بایت‌های دقیق npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک تاربال npm مربوط به ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند مصنوع دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، کامیت حل‌شده، ref، و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی ریموت origin به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را به‌صراحت اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان جایگزین برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` بار مفید انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌دهد.
- `--json` خروجی قابل‌خواندن توسط ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی عامل به ناشر دسترسی دارد، زیر شناسه ناشر کاربر یا سازمان منتشر می‌کند.
- نام‌های بسته دارای محدوده باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخزن‌های خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید فراداده بسته حل‌شده و
انتساب منبع را پیش از ایجاد یک انتشار زنده تأیید کنید:

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
  جایگزین برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` افزوده‌های اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از انتشار قدیمی‌تر CLI مربوط به `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های پیش‌پرواز محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک گردش‌کار رسمی قابل‌استفاده‌مجدد را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
برای مخزن‌های Plugin ارائه می‌کند.

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

- گردش‌کار قابل‌استفاده‌مجدد به‌طور پیش‌فرض `source` را مخزن فراخواننده قرار می‌دهد.
- برای monorepoها، `source_path` را پاس دهید تا گردش‌کار پوشه بسته
  Plugin را منتشر کند، برای مثال `source_path: extensions/codex`.
- گردش‌کار قابل‌استفاده‌مجدد را به یک تگ پایدار یا SHA کامل کامیت pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلوده‌کننده نباشد.
- انتشارهای واقعی باید به رویدادهای مورداعتماد مانند `workflow_dispatch` یا push تگ محدود شوند.
- انتشار مورداعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای تگ همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای نخستین انتشار، بسته‌های غیرمورداعتماد، یا انتشارهای اضطراری در دسترس نگه دارید.
- گردش‌کار نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های گردش‌کار ارائه می‌دهد.

### `sync`

- پوشه‌های Skills محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک پوشه Skills یا یک پوشه Skills تکی با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، ریشه‌های Skills مربوط به Clawdbot را به‌صورت خودکار اضافه می‌کند:
  - `agent.workspace/skills` (عامل اصلی)
  - `routing.agents.*.workspace/skills` (برای هر عامل)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (بسته‌های مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` ریشه‌های اسکن اضافی
  - `--all` بارگذاری بدون درخواست
  - `--dry-run` فقط نمایش برنامه
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

تله‌متری:

- هنگام `sync` در صورت ورود به سیستم ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (قدیمی: `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
