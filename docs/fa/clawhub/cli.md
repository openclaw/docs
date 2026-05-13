---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، فایل قفل و رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-13T04:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98c1886f2df29dd9489d18d4813f0f7df6c365b47888035fe12d2b05871cdf17
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

بستهٔ CLI: `clawhub`، باینری: `clawhub`.

آن را به‌صورت سراسری با npm یا pnpm نصب کنید:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

سپس آن را تأیید کنید:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## پرچم‌های سراسری

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود با مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایهٔ API (پیش‌فرض: کشف‌شده، وگرنه `https://clawhub.ai`)
- `--no-input`: غیرفعال‌کردن اعلان‌ها

معادل‌های Env:

- `CLAWHUB_SITE` (قدیمی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی `CLAWDHUB_WORKDIR`)

### پراکسی HTTP

CLI به متغیرهای محیطی استاندارد پراکسی HTTP برای سامانه‌هایی که پشت
پراکسی‌های سازمانی یا شبکه‌های محدود هستند احترام می‌گذارد:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پراکسی مشخص‌شده هدایت می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دورزدن پراکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این در سامانه‌هایی لازم است که اتصال‌های خروجی مستقیم در آن‌ها مسدود شده‌اند
(مثلاً کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی، دیواره‌های آتش
سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار بدون تغییر است (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما + URL کش‌شدهٔ رجیستری را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسیر بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback حلقهٔ بازگشت کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملیِ دوردست/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا شما آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` تأیید می‌کند.

### `star <slug>` / `unstar <slug>`

- یک مهارت را به برجسته‌های شما اضافه یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشتهٔ داخل `amap` تطابق دارد.
- دانلودها یک پیشینهٔ محبوبیت کوچک هستند، نه تضمینی برای جایگاه برتر.
- اگر مهارتی باید ظاهر شود اما نمی‌شود، پیش از تغییر نام metadata، درحالی‌که وارد شده‌اید `clawhub inspect <slug>` را اجرا کنید تا عیب‌یابی‌های تعدیل قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (بر پایهٔ `createdAt` به‌صورت نزولی مرتب‌شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (summary تا 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- metadata و فایل‌های نسخهٔ مهارت را بدون نصب واکشی می‌کند.
- `--version <version>`: بازرسی یک نسخهٔ مشخص (پیش‌فرض: latest).
- `--tag <tag>`: بازرسی یک نسخهٔ برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچهٔ نسخه‌ها (صفحهٔ اول).
- `--limit <n>`: بیشینهٔ نسخه‌ها برای فهرست‌کردن (1-200).
- `--files`: فهرست فایل‌ها برای نسخهٔ انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pinned خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` را می‌خواند (`.clawdhub` قدیمی).
- `pinned` را کنار skills منجمدشده با `clawhub pin` نشان می‌دهد، از جمله دلیل اختیاری.

### `pin <slug>`

- یک skill نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا skill منجمد شده است.
- Skills پین‌شده توسط `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی به‌طور تصادفی جایگزین نشوند.

### `unpin <slug>`

- پین lockfile را از یک skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- fingerprint را از فایل‌های محلی محاسبه می‌کند.
- اگر fingerprint با یک نسخه شناخته‌شده مطابقت داشته باشد: پیامی برای تأیید نمایش داده نمی‌شود.
- اگر fingerprint مطابقت نداشته باشد:
  - به‌صورت پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا در حالت تعاملی، با تأیید کاربر)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای پین‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی که منجمد ماندند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` منتشر می‌کند (multipart).
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که actor دسترسی ناشر داشته باشد، تحت handle ناشرِ یک سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک skill یعنی آن skill تحت `MIT-0` روی ClawHub منتشر شده است.
- Skills منتشرشده را می‌توان آزادانه و بدون ذکر منبع استفاده، تغییر و بازتوزیع کرد.
- ClawHub از skills پولی یا قیمت‌گذاری جداگانه برای هر skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan برای رفتاری که ممکن است در غیر این صورت غیرمعمول به نظر برسد، زمینه می‌دهد؛ مانند دسترسی شبکه، دسترسی native host، یا credentials ویژه provider. یادداشت روی نسخه منتشرشده ذخیره می‌شود.
- alias قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک skill را soft-delete می‌کند (مالک، moderator، یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهای آغازشده توسط مالک، slug را به مدت ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت moderation روی skill و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک skill پنهان را بازیابی می‌کند (مالک، moderator، یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت moderation روی skill و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک skill را پنهان می‌کند (مالک، moderator، یا admin).
- alias برای `delete`.

### `unhide <slug>`

- یک skill را از حالت پنهان خارج می‌کند (مالک، moderator، یا admin).
- alias برای `undelete`.

### `skill rename <slug> <new-slug>`

- یک skill متعلق به خودتان را تغییرنام می‌دهد و slug قبلی را به‌عنوان alias تغییرمسیر نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک skill متعلق به خودتان را در یک skill متعلق به خودتان دیگر ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به alias تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال به handleهای کاربری یک درخواست در انتظار ایجاد می‌کند که گیرنده آن را می‌پذیرد.
- انتقال به handleهای سازمان/ناشر فقط زمانی فوراً اعمال می‌شود که actor به هر دو ناشرِ مالک فعلی و مقصد دسترسی admin داشته باشد.
- زیرفرمان‌ها:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpointها:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- کاتالوگ یکپارچه بسته‌ها را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و دیگر ورودی‌های خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی skill باقی می‌ماند.
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

- metadata بسته را بدون نصب واکشی می‌کند.
- از این برای metadata، سازگاری، verification، منبع، و بررسی نسخه/فایل Plugin استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بررسی می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه tag‌شده را بررسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه نخست).
- `--limit <n>`: بیشترین تعداد نسخه‌ها برای فهرست‌کردن (۱ تا ۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را واکشی می‌کند (فقط فایل‌های متنی؛ سقف ۲۰۰KB).
- `--json`: خروجی قابل خواندن توسط ماشین.

### `package download <name>`

- نسخه بسته را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` resolver دانلود می‌کند.
- ClawHub SHA-256 را برای همه artifactها بررسی می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین integrity مربوط به npm `sha512`، shasum مربوط به npm، و نام/نسخه `package.json` در tarball را بررسی می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخه tag‌شده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا پوشه خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ClawHub SHA-256، integrity مربوط به npm `sha512`، و shasum مربوط به npm را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، metadata مورد انتظار را از ClawHub resolve می‌کند و فایل محلی را با metadata artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون lookup شبکه بررسی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای resolve کردن metadata مورد انتظار artifact.
  - `--version <version>` یا `--tag <tag>`: نسخه مورد انتظار بسته.
  - `--sha256 <hex>`: ClawHub SHA-256 مورد انتظار.
  - `--npm-integrity <sri>`: integrity مورد انتظار npm.
  - `--npm-shasum <sha1>`: shasum مورد انتظار npm.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارهای آن را به‌صورت soft-delete حذف می‌کند.
- به مالک بسته، مالک/ادمین ناشر سازمانی، ناظر پلتفرم،
  یا ادمین پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای soft-deleted را بازیابی می‌کند.
- به مالک بسته، مالک/ادمین ناشر سازمانی، ناظر پلتفرم،
  یا ادمین پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی ادمین به مالک فعلی بسته و ناشر مقصد، هر دو، نیاز دارد،
  مگر اینکه توسط ادمین پلتفرم انجام شود.
- نام‌های بسته scoped باید به مالک scope متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری برای ممیزی.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه گره بخورند،
  و برای بازبینی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی بسته‌ها را به‌طور خودکار مخفی نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست کردن به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی نظارت بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت نظارت دستی آخرین انتشار،
  وضعیت مسدودسازی دانلود، و دلایل نظارت را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌های وضعیت رسمی، در دسترس بودن ClawPack، digest آرتیفکت،
  provenance منبع، سازگاری OpenClaw، هدف‌های میزبان، فراداده محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت متمرکز بر اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  plugin bundled در OpenClaw شود.
- همان endpoint آمادگی محاسبه‌شده مانند `package readiness` را فراخوانی می‌کند، اما وضعیت
  متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن توسط ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک code plugin یا bundle plugin را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - tarball محلی ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL گیت‌هاب: `https://github.com/owner/repo`
- فراداده به‌طور خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی bundle در OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` شناسایی می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI همان بایت‌های npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده استفاده می‌کند.
- پوشه‌های code-plugin قبل از بارگذاری در یک tarball npm مربوط به ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند آرتیفکت دقیق را تأیید کنند. پوشه‌های bundle-plugin همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، نسبت‌دهی منبع به‌طور خودکار از مخزن، commit resolve‌شده، ref، و subpath پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مربوط به origin به GitHub اشاره کند، نسبت‌دهی منبع به‌طور خودکار از git محلی شناسایی می‌شود.
- code pluginهای خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صراحتاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` محتوای انتشار resolve‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل خواندن توسط ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر شناسه ناشر کاربر یا سازمان منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری زمینه می‌دهد که ممکن است در غیر این صورت غیرعادی به نظر برسد، مانند دسترسی شبکه،
  دسترسی میزبان native، یا credentials ویژه ارائه‌دهنده. یادداشت روی
  انتشار منتشرشده ذخیره می‌شود.
- نام‌های بسته scoped باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد یک انتشار زنده،
فراداده resolve‌شده بسته و نسبت‌دهی منبع را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای code pluginها، انتشار پوشه یک آرتیفکت ClawPack را از
پوشه بسته می‌سازد و بارگذاری می‌کند:

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

نکته‌ها:

- `package.json.version` نسخه انتشار بسته شماست، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/بیلد OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند، اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI مربوط به `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow قابل استفاده مجدد رسمی را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f0a6789c31d5a1666d25173927356dd5be7738bc/.github/workflows/package-publish.yml)
برای مخازن plugin ارائه می‌کند.

چیدمان معمول caller:

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

- workflow قابل استفاده مجدد، مقدار پیش‌فرض `source` را مخزن caller قرار می‌دهد.
- برای monorepoها، `source_path` را پاس دهید تا workflow پوشه بسته plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل استفاده مجدد را به یک tag پایدار یا SHA کامل commit پین کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلوده نشود.
- انتشارهای واقعی باید به رویدادهای trusted مانند `workflow_dispatch` یا push تگ محدود شوند.
- انتشار trusted بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای تگ همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های untrusted، یا انتشارهای break-glass در دسترس نگه دارید.
- این workflow نتیجه JSON را به‌عنوان آرتیفکت بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در دسترس می‌گذارد.

### `sync`

- پوشه‌های Skills محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک دایرکتوری Skills یا یک پوشه skill تنها با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، ریشه‌های skill مربوط به Clawdbot را به‌طور خودکار اضافه می‌کند:
  - `agent.workspace/skills` (agent اصلی)
  - `routing.agents.*.workspace/skills` (برای هر agent)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (packهای مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` ریشه‌های اسکن اضافی
  - `--all` بارگذاری بدون درخواست تأیید
  - `--dry-run` فقط نمایش برنامه
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

Telemetry:

- هنگام `sync` و در صورت وارد بودن، ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (`CLAWDHUB_DISABLE_TELEMETRY=1` legacy).
- جزئیات: `docs/telemetry.md`.
