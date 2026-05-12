---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-12T23:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

بسته CLI: `clawhub`، bin: `clawhub`.

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
- `--site <url>`: URL پایه برای ورود با مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های Env:

- `CLAWHUB_SITE` (قدیمی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی `CLAWDHUB_WORKDIR`)

### پراکسی HTTP

CLI متغیرهای محیطی استاندارد پراکسی HTTP را برای سیستم‌هایی که پشت
پراکسی‌های سازمانی یا شبکه‌های محدود هستند رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پراکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS استفاده می‌شود، `HTTP_PROXY`
برای HTTP ساده. `NO_PROXY` / `no_proxy` برای دور زدن پراکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این روی سیستم‌هایی لازم است که اتصال مستقیم خروجی در آن‌ها مسدود شده است
(مثلاً کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی، دیوارهای آتش
سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال مستقیم).

## فایل پیکربندی

توکن API شما + URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback loopback کامل می‌شود.
- بدون محیط گرافیکی: `clawhub login --token clh_...`
- تعاملی از راه دور/بدون محیط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک مهارت را به برجسته‌های شما اضافه می‌کند یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو تطابق‌های دقیق توکن slug/name را پیش از محبوبیت دانلود ترجیح می‌دهد. یک توکن slug مستقل مثل `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- دانلودها یک پیش‌فرض کوچک محبوبیت هستند، نه تضمینی برای قرارگیری در رتبه‌های بالا.
- اگر مهارتی باید ظاهر شود اما نمی‌شود، هنگام ورود، `clawhub inspect <slug>` را اجرا کنید تا پیش از تغییر نام فراداده، عیب‌یابی‌های نظارتی قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (بر اساس `createdAt` به‌صورت نزولی مرتب‌شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه تا 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- فراداده مهارت و فایل‌های نسخه را بدون نصب واکشی می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: latest).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌ها برای فهرست کردن (1-200).
- `--files`: فهرست فایل‌های نسخه انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ سقف 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` resolve می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pin‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` را می‌خواند (`.clawdhub` قدیمی).
- کنار مهارت‌هایی که با `clawhub pin` ثابت شده‌اند، `pinned` را نشان می‌دهد، از جمله دلیل اختیاری.

### `pin <slug>`

- یک مهارت نصب‌شده را در lockfile به‌عنوان سنجاق‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا مهارت ثابت شده است.
- مهارت‌های سنجاق‌شده توسط `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- مهارت‌های سنجاق‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی تصادفی جایگزین نشوند.

### `unpin <slug>`

- سنجاق lockfile را از یک مهارت نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: هیچ اعلانی نمایش داده نمی‌شود.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا در حالت تعاملی، پس از اعلان)
- مهارت‌های سنجاق‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای سنجاق‌شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` از slugهای سنجاق‌شده عبور می‌کند و خلاصه‌ای از مواردی را که ثابت مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که عامل دسترسی ناشر داشته باشد، تحت handle ناشرِ org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار نسخه جدید، یک مهارت موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک مهارت یعنی آن مهارت تحت `MIT-0` در ClawHub منتشر می‌شود.
- مهارت‌های منتشرشده برای استفاده، تغییر و بازتوزیع بدون انتساب آزاد هستند.
- ClawHub از مهارت‌های پولی یا قیمت‌گذاری به‌ازای هر مهارت پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan برای رفتاری که ممکن است در غیر این صورت غیرعادی به نظر برسد زمینه می‌دهد، مانند دسترسی شبکه، دسترسی میزبان بومی، یا اعتبارنامه‌های مختص ارائه‌دهنده. یادداشت روی نسخه منتشرشده ذخیره می‌شود.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک مهارت را soft-delete می‌کند (مالک، ناظر، یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های soft آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی مهارت و audit log ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک مهارت پنهان را بازیابی می‌کند (مالک، ناظر، یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی مهارت و audit log ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک مهارت را پنهان می‌کند (مالک، ناظر، یا admin).
- نام مستعار برای `delete`.

### `unhide <slug>`

- یک مهارت را از حالت پنهان خارج می‌کند (مالک، ناظر، یا admin).
- نام مستعار برای `undelete`.

### `skill rename <slug> <new-slug>`

- نام یک مهارت تحت مالکیت را تغییر می‌دهد و slug قبلی را به‌عنوان نام مستعار تغییرمسیر نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک مهارت تحت مالکیت را در مهارت تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به handleهای کاربر یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای org/publisher تنها زمانی فوراً اعمال می‌شوند که عامل به هر دو ناشر مالک فعلی و مقصد دسترسی admin داشته باشد.
- زیرفرمان‌ها:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- endpointها:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- کاتالوگ یکپارچه بسته‌ها را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و ورودی‌های دیگر خانواده بسته استفاده کنید؛ `search` سطح‌بالا همچنان سطح جست‌وجوی مهارت باقی می‌ماند.
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
- از این برای فراداده plugin، سازگاری، راستی‌آزمایی، منبع، و بازرسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بازرسی می‌کند (پیش‌فرض: آخرین نسخه).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بازرسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌هایی که فهرست می‌شوند (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را دریافت می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل خواندن توسط ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` مربوط به resolver دانلود می‌کند.
- ClawHub SHA-256 را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین یکپارچگی `sha512` npm، shasum npm، و نام/نسخه `package.json` در tarball را راستی‌آزمایی می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا پوشه خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ClawHub SHA-256، یکپارچگی `sha512` npm، و shasum npm را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub resolve می‌کند و فایل محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون جست‌وجوی شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای resolve کردن فراداده مورد انتظار artifact.
  - `--version <version>` یا `--tag <tag>`: نسخه مورد انتظار بسته.
  - `--sha256 <hex>`: ClawHub SHA-256 مورد انتظار.
  - `--npm-integrity <sri>`: یکپارچگی npm مورد انتظار.
  - `--npm-shasum <sha1>`: shasum npm مورد انتظار.
  - `--json`: خروجی قابل خواندن توسط ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارهای آن را به‌صورت نرم‌حذف می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: از تأیید صرف‌نظر می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای نرم‌حذف‌شده را بازیابی می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: از تأیید صرف‌نظر می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیریتی به هر دو ناشر، یعنی مالک فعلی بسته و ناشر مقصد،
  نیاز دارد، مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته دارای scope باید به مالک scope منطبق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری برای audit.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه مرتبط شوند،
  و برای بررسی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌خودی‌خود بسته‌ها را پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی بسته در moderation.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت manual moderation آخرین انتشار،
  وضعیت مسدودسازی دانلود، و دلایل moderation را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌های وضعیت رسمی، در دسترس بودن ClawPack، digest artifact،
  منشأ source، سازگاری OpenClaw، هدف‌های میزبان، فراداده محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت migration با جهت‌گیری اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  plugin همراه OpenClaw شود.
- همان endpoint آمادگی محاسبه‌شده را مانند `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر migration، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک code plugin یا bundle plugin را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - tarball محلی ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL در GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی bundle در OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI بایت‌های دقیق npm-pack
  را آپلود می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پرکردن فراداده استفاده می‌کند.
- پوشه‌های code-plugin پیش از آپلود در یک tarball نوع ClawPack npm بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند artifact دقیق را تأیید کنند. پوشه‌های bundle-plugin همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب source به‌صورت خودکار از مخزن، commit resolve‌شده، ref، و subpath پر می‌شود.
- برای پوشه‌های محلی، وقتی remote با نام origin به GitHub اشاره کند، انتساب source به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- code pluginهای خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صریحاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` payload حل‌شده انتشار را بدون آپلود پیش‌نمایش می‌دهد.
- `--json` خروجی قابل‌خواندن برای ماشین را برای CI تولید می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، بسته را زیر شناسه یک ناشر کاربر یا سازمان منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری زمینه می‌دهد که ممکن است در غیر این صورت غیرمعمول به نظر برسد، مانند دسترسی شبکه،
  دسترسی native host، یا credentialهای خاص provider. این یادداشت روی
  انتشار منتشرشده ذخیره می‌شود.
- نام‌های بسته دارای scope باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد یک انتشار زنده،
فراداده حل‌شده بسته و انتساب source را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای code pluginها، انتشار پوشه یک artifact نوع ClawPack را از
پوشه بسته می‌سازد و آپلود می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

code pluginهای خارجی به مقدار کمی فراداده OpenClaw در
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

یادداشت‌ها:

- `package.json.version` نسخه انتشار بسته شماست، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود، آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار آن را ارتقا دهید تا
  بررسی‌های preflight محلی پیش از آپلود اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل‌استفاده‌مجدد در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
برای مخازن plugin ارائه می‌کند.

تنظیم معمول فراخوان:

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

یادداشت‌ها:

- workflow قابل‌استفاده‌مجدد به‌صورت پیش‌فرض `source` را روی مخزن فراخوان تنظیم می‌کند.
- برای monorepoها، `source_path` را پاس دهید تا workflow پوشه بسته plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفاده‌مجدد را به یک tag پایدار یا SHA کامل commit pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی بماند.
- انتشارهای واقعی باید به eventهای مورداعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورداعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های غیرمورداعتماد، یا انتشارهای break-glass در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان artifact آپلود می‌کند و آن را به‌عنوان خروجی‌های workflow ارائه می‌دهد.

### `sync`

- پوشه‌های skill محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک پوشه skills یا یک پوشه skill تکی دارای `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، ریشه‌های skill مربوط به Clawdbot را به‌صورت خودکار اضافه می‌کند:
  - `agent.workspace/skills` (agent اصلی)
  - `routing.agents.*.workspace/skills` (برای هر agent)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (بسته‌های مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` ریشه‌های اسکن اضافی
  - `--all` آپلود بدون پرسش
  - `--dry-run` فقط نمایش برنامه
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

Telemetry:

- در طول `sync` هنگام ورود به سیستم ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (قدیمی: `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
