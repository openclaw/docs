---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-12T00:56:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 852c15f48e414364303f77873b0c531d2b80478a99cb816719c00972c4ae2203
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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد، به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود با مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های محیطی:

- `CLAWHUB_SITE` (قدیمی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی `CLAWDHUB_WORKDIR`)

### پراکسی HTTP

CLI برای سیستم‌هایی که پشت پراکسی‌های سازمانی یا شبکه‌های محدود هستند، متغیرهای محیطی استاندارد پراکسی HTTP را رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق پراکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY` برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دور زدن پراکسی برای میزبان‌ها یا دامنه‌های خاص رعایت می‌شود.

این مورد در سیستم‌هایی لازم است که اتصال مستقیم خروجی در آن‌ها مسدود است (مثلاً کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی، یا دیوارهای آتش سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال مستقیم).

## فایل پیکربندی

توکن API و URL رجیستری کش‌شده شما را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback loopback تکمیل می‌شود.
- بدون محیط گرافیکی: `clawhub login --token clh_...`
- تعاملی از راه دور/بدون محیط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا شما آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک skill را به موارد برجسته شما اضافه یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جستجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- دانلودها یک پیش‌فرض کوچک برای محبوبیت هستند، نه تضمینی برای قرار گرفتن در رتبه‌های بالا.
- اگر یک skill باید نمایش داده شود اما نمی‌شود، در حالی که وارد شده‌اید `clawhub inspect <slug>` را اجرا کنید تا پیش از تغییر نام فراداده، تشخیص‌های تعدیل قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین skills را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (بر اساس `createdAt` به‌صورت نزولی مرتب شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل خواندن توسط ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه به 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- فراداده skill و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: بررسی یک نسخه خاص (پیش‌فرض: آخرین نسخه).
- `--tag <tag>`: بررسی یک نسخه برچسب‌گذاری‌شده (مثلاً `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: بیشترین تعداد نسخه‌ها برای فهرست کردن (1-200).
- `--files`: فهرست فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل خواندن توسط ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- فایل zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی skills پین‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`) را می‌خواند.
- کنار skills که با `clawhub pin` ثابت شده‌اند، `pinned` را نشان می‌دهد، شامل دلیل اختیاری.

### `pin <slug>`

- یک skill نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا skill ثابت شده است.
- skills پین‌شده توسط `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی تصادفی جایگزین نشوند.

### `unpin <slug>`

- pin مربوط به lockfile را از یک skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخهٔ شناخته‌شده مطابقت داشته باشد: هیچ درخواستی نشان داده نمی‌شود.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌صورت پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با درخواست تأیید)
- skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای پین‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی که ثابت مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که actor دسترسی publisher دارد، زیر handle ناشرِ سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار نسخهٔ جدید، یک skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو publisher نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک skill یعنی آن روی ClawHub تحت `MIT-0` منتشر می‌شود.
- skills منتشرشده برای استفاده، تغییر، و بازتوزیع بدون ذکر منبع آزاد هستند.
- ClawHub از skills پولی یا قیمت‌گذاری به‌ازای هر skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan برای رفتاری که ممکن است در غیر این صورت غیرمعمول به نظر برسد زمینه می‌دهد، مانند دسترسی شبکه، دسترسی native host، یا اعتبارنامه‌های اختصاصی provider. یادداشت روی نسخهٔ منتشرشده ذخیره می‌شود.
- نام مستعار legacy: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک skill را به‌صورت soft-delete حذف می‌کند (owner، moderator، یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم آغازشده توسط owner، slug را برای ۳۰ روز رزرو می‌کنند؛ دستور زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت moderation روی skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک skill پنهان را بازیابی می‌کند (owner، moderator، یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت moderation روی skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک skill را پنهان می‌کند (owner، moderator، یا admin).
- نام مستعار برای `delete`.

### `unhide <slug>`

- یک skill را از حالت پنهان خارج می‌کند (owner، moderator، یا admin).
- نام مستعار برای `undelete`.

### `skill rename <slug> <new-slug>`

- یک skill تحت مالکیت را تغییر نام می‌دهد و slug قبلی را به‌عنوان نام مستعار redirect نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک skill تحت مالکیت را در skill تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار redirect به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- جریان کاری انتقال مالکیت.
- انتقال‌ها به handleهای کاربری یک درخواست pending ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای org/publisher فقط زمانی فوراً اعمال می‌شوند که actor به هر دو publisher مالک فعلی و مقصد دسترسی admin داشته باشد.
- زیردستورها:
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

- کاتالوگ یکپارچهٔ package را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و دیگر ورودی‌های خانوادهٔ package استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی skill باقی می‌ماند.
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

- فرادادهٔ package را بدون نصب دریافت می‌کند.
- از این برای فرادادهٔ plugin، سازگاری، راستی‌آزمایی، منبع، و بازرسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخهٔ مشخص را بررسی می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخهٔ tagشده را بررسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچهٔ نسخه‌ها را فهرست می‌کند (صفحهٔ اول).
- `--limit <n>`: بیشترین تعداد نسخه برای فهرست‌کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخهٔ انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را دریافت می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخهٔ package را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` حل می‌کند.
- artifact را از `downloadUrl` مربوط به resolver دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همهٔ artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین integrity مربوط به npm `sha512`، shasum مربوط به npm، و نام/نسخهٔ `package.json` در tarball را راستی‌آزمایی می‌کند.
- نسخه‌های ZIP legacy از طریق مسیر ZIP legacy دانلود می‌شوند.
- flagها:
  - `--version <version>`: یک نسخهٔ مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخهٔ tagشده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 مربوط به ClawHub، integrity مربوط به npm `sha512`، و shasum مربوط به npm را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، فرادادهٔ مورد انتظار را از ClawHub حل می‌کند و فایل محلی را با فرادادهٔ artifact منتشرشده مقایسه می‌کند.
- با flagهای digest مستقیم، بدون lookup شبکه راستی‌آزمایی می‌کند.
- flagها:
  - `--package <name>`: نام package برای حل‌کردن فرادادهٔ artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخهٔ package مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: integrity مورد انتظار npm.
  - `--npm-shasum <sha1>`: shasum مورد انتظار npm.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارهای آن را به‌صورت نرم حذف می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای حذف‌شده به‌صورت نرم را بازیابی می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به هر دو مورد مالک فعلی بسته و ناشر مقصد
  نیاز دارد، مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته دارای دامنه باید به مالک دامنه منطبق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری برای حسابرسی.
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- دستور احراز هویت‌شده برای گزارش کردن یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه پیوند داده شوند، و برای
  بررسی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی بسته‌ها را به‌طور خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست کردن به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- دستور مالک برای بررسی وضعیت نمایانی نظارتی بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، آخرین وضعیت نظارت دستی انتشار،
  وضعیت مسدودسازی دانلود، و دلایل نظارت را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- موانع وضعیت رسمی، دسترس‌پذیری ClawPack، چکیده مصنوع،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فراداده محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت با تمرکز بر اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  plugin همراه OpenClaw شود.
- همان نقطه پایانی آمادگی محاسبه‌شده مانند `package readiness` را فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  موانع را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک plugin کدی یا plugin باندلی را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - آرشیو tarball محلی ClawPack با فرمت npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- فراداده به‌طور خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی باندل OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI بایت‌های دقیق npm-pack را
  بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده استفاده می‌کند.
- پوشه‌های plugin کدی پیش از بارگذاری در یک آرشیو tarball نوع ClawPack npm بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند مصنوع دقیق را تأیید کنند. پوشه‌های plugin باندلی همچنان
  از مسیر انتشار فایل‌های استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌طور خودکار از مخزن، کامیت حل‌شده، ref، و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدا به GitHub اشاره کند، انتساب منبع به‌طور خودکار از git محلی تشخیص داده می‌شود.
- pluginهای کدی خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را به‌صراحت اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان جایگزین برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` محموله انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل خواندن برای ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی کنشگر دسترسی ناشر دارد، تحت شناسه ناشر کاربر یا سازمان منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری که ممکن است در غیر این صورت غیرمعمول به نظر برسد، مانند دسترسی شبکه،
  دسترسی میزبان بومی، یا اعتبارنامه‌های ویژه ارائه‌دهنده، زمینه می‌دهد. یادداشت روی
  انتشار منتشرشده ذخیره می‌شود.
- نام‌های بسته دارای دامنه باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) همچنان به‌عنوان بازنویسی کار می‌کنند.
- مخزن‌های خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید فراداده بسته حل‌شده و
انتساب منبع را پیش از ایجاد یک انتشار زنده تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای pluginهای کدی، انتشار پوشه یک مصنوع ClawPack را از
پوشه بسته می‌سازد و بارگذاری می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

pluginهای کدی خارجی به مقدار کمی فراداده OpenClaw در
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

نکته‌ها:

- `package.json.version` نسخه انتشار بسته شماست، اما به‌عنوان
  جایگزین برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است وقتی حاضر باشند آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` موارد اضافه اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از یک نسخه قدیمی‌تر CLI با نام `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های اولیه محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow قابل استفاده مجدد رسمی در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/426a2a78792b7ebcf5aa2a08c595cc618a197c66/.github/workflows/package-publish.yml)
برای مخزن‌های plugin ارائه می‌کند.

پیکربندی معمول فراخوان:

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

- workflow قابل استفاده مجدد به‌طور پیش‌فرض `source` را روی مخزن فراخوان می‌گذارد.
- برای monorepoها، `source_path` را پاس دهید تا workflow پوشه بسته plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل استفاده مجدد را به یک تگ پایدار یا SHA کامل کامیت سنجاق کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلوده‌کننده نباشد.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا push تگ محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ push تگ همچنان به `clawhub_token` نیاز دارد.
- `clawhub_token` را برای اولین انتشار، بسته‌های نامطمئن، یا انتشارهای اضطراری در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان یک artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در اختیار می‌گذارد.

### `sync`

- پوشه‌های Skills محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک پوشه skills یا یک پوشه skill تنها با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` حاضر باشد، ریشه‌های skill مربوط به Clawdbot را به‌طور خودکار اضافه می‌کند:
  - `agent.workspace/skills` (عامل اصلی)
  - `routing.agents.*.workspace/skills` (برای هر عامل)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (بسته‌های مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` ریشه‌های اسکن اضافی
  - `--all` بارگذاری بدون درخواست تأیید
  - `--dry-run` فقط نمایش طرح
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

Telemetry:

- هنگام `sync` در صورت ورود به حساب ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (میراثی `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
