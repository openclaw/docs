---
read_when:
    - استفاده از ClawHub CLI
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، فلگ‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-12T12:48:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

بستهٔ CLI: `clawhub`، باینری: `clawhub`.

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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد، به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: نشانی پایه برای ورود در مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: نشانی پایهٔ API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال‌کردن اعلان‌ها

معادل‌های محیطی:

- `CLAWHUB_SITE` (قدیمی: `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی: `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی: `CLAWDHUB_WORKDIR`)

### پراکسی HTTP

CLI متغیرهای محیطی استاندارد پراکسی HTTP را برای سامانه‌هایی که پشت
پراکسی‌های سازمانی یا شبکه‌های محدود هستند رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پراکسی مشخص‌شده هدایت می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دورزدن پراکسی در
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این کار روی سامانه‌هایی لازم است که اتصال مستقیم خروجی در آن‌ها مسدود شده است
(مثلاً کانتینرهای Docker، سرورهای مجازی Hetzner با اینترنت فقط از طریق پراکسی،
یا دیواره‌های آتش سازمانی).

نمونه:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار تغییری نمی‌کند (اتصال مستقیم).

## فایل پیکربندی

توکن API شما و نشانی رجیستریِ کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسیر جایگزین قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی: `CLAWDHUB_CONFIG_PATH`)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق بازگشت‌تماس loopback تکمیل می‌شود.
- بدون رابط: `clawhub login --token clh_...`
- تعاملیِ راه‌دور/بدون رابط: `clawhub login --device` یک کد چاپ می‌کند و هنگام مجوزدادن شما در `<site>/cli/device` منتظر می‌ماند.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک مهارت را به برجسته‌های شما اضافه می‌کند یا از آن‌ها برمی‌دارد.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/نام را ترجیح می‌دهد. یک توکن مستقل slug مثل `map` با `personal-map` قوی‌تر از زیررشتهٔ داخل `amap` تطابق دارد.
- دانلودها فقط یک پیش‌فرض محبوبیت کوچک هستند، نه تضمینی برای جایگاه نخست.
- اگر مهارتی باید ظاهر شود اما نمی‌شود، پیش از تغییر نام فراداده، در حالت واردشده `clawhub inspect <slug>` را اجرا کنید تا عیب‌یابی‌های تعدیلِ قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (بر اساس `createdAt` به‌صورت نزولی مرتب‌شده).
- پرچم‌ها:
  - `--limit <n>` (۱ تا ۲۰۰، پیش‌فرض: ۲۵)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه به ۵۰ نویسه کوتاه می‌شود).

### `inspect <slug>`

- فرادادهٔ مهارت و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: بررسی یک نسخهٔ مشخص (پیش‌فرض: آخرین نسخه).
- `--tag <tag>`: بررسی یک نسخهٔ برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچهٔ نسخه‌ها (صفحهٔ نخست).
- `--limit <n>`: بیشینهٔ نسخه‌هایی که فهرست می‌شوند (۱ تا ۲۰۰).
- `--files`: فهرست فایل‌های نسخهٔ انتخاب‌شده.
- `--file <path>`: دریافت محتوای خام فایل (فقط فایل‌های متنی؛ سقف ۲۰۰ کیلوبایت).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- فایل zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های پین‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی: `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی: `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: برای تأیید سؤال می‌پرسد.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (قدیمی: `.clawdhub`) را می‌خواند.
- کنار Skills منجمدشده با `clawhub pin`، از جمله دلیل اختیاری، `pinned` را نشان می‌دهد.

### `pin <slug>`

- یک Skill نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا Skill منجمد شده است.
- Skills پین‌شده توسط `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی به‌اشتباه جایگزین نشوند.

### `unpin <slug>`

- پین lockfile را از یک Skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: هیچ promptای نمایش داده نمی‌شود.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا در صورت interactive بودن، با prompt)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای پین‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی را که منجمد باقی مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که actor دسترسی publisher داشته باشد، تحت handle ناشر org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار نسخه جدید، یک Skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو publisher نیاز دارد.
- رفتار مالک و review در `docs/publishing.md` توضیح داده شده است.
- انتشار یک Skill یعنی تحت `MIT-0` در ClawHub منتشر می‌شود.
- Skills منتشرشده آزادانه و بدون attribution قابل استفاده، تغییر و بازتوزیع هستند.
- ClawHub از Skills پولی یا قیمت‌گذاری برای هر Skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan زمینه‌ای درباره رفتاری می‌دهد که در غیر این صورت ممکن است غیرمعمول به نظر برسد، مانند دسترسی شبکه، دسترسی native host، یا credentials مخصوص provider. یادداشت روی نسخه منتشرشده ذخیره می‌شود.
- alias قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک Skill را soft-delete می‌کند (owner، moderator یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهای آغازشده توسط owner، slug را برای ۳۰ روز رزرو می‌کنند؛ دستور زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت moderation روی Skill و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` تأیید را نادیده می‌گیرد.

### `undelete <slug>`

- یک Skill پنهان را بازیابی می‌کند (owner، moderator یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت moderation روی Skill و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` تأیید را نادیده می‌گیرد.

### `hide <slug>`

- یک Skill را پنهان می‌کند (owner، moderator یا admin).
- alias برای `delete`.

### `unhide <slug>`

- یک Skill را از حالت پنهان خارج می‌کند (owner، moderator یا admin).
- alias برای `undelete`.

### `skill rename <slug> <new-slug>`

- یک Skill تحت مالکیت را تغییر نام می‌دهد و slug قبلی را به‌عنوان alias تغییرمسیر نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را نادیده می‌گیرد.

### `skill merge <source-slug> <target-slug>`

- یک Skill تحت مالکیت را در Skill تحت مالکیت دیگری ادغام می‌کند.
- slug منبع دیگر به‌صورت عمومی فهرست نمی‌شود و به alias تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را نادیده می‌گیرد.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به handleهای کاربر یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای org/publisher فقط زمانی فوراً اعمال می‌شوند که actor دسترسی admin به هر دو publisher مالک فعلی و مقصد داشته باشد.
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

- کاتالوگ یکپارچه package را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای Pluginها و entryهای دیگر خانواده package استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی Skill باقی می‌ماند.
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
  - `--limit <n>` (۱ تا ۱۰۰، پیش‌فرض: ۲۵)
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

- metadata package را بدون نصب دریافت می‌کند.
- از این برای metadata، سازگاری، verification، source و بررسی version/file مربوط به Plugin استفاده کنید.
- `--version <version>`: یک نسخه مشخص را inspect می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه tagشده را inspect می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌ها برای فهرست‌کردن (۱ تا ۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را دریافت می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن توسط ماشین.

### `package download <name>`

- نسخه package را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` resolver دانلود می‌کند.
- SHA-256 متعلق به ClawHub را برای همه artifactها verify می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین integrity مربوط به npm `sha512`، shasum مربوط به npm، و نام/نسخه `package.json` tarball را verify می‌کند.
- نسخه‌های ZIP قدیمی از طریق route ZIP قدیمی دانلود می‌شوند.
- flagها:
  - `--version <version>`: یک نسخه مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخه tagشده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 متعلق به ClawHub، integrity مربوط به npm `sha512`، و shasum مربوط به npm را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، metadata مورد انتظار را از ClawHub resolve می‌کند و فایل محلی را با metadata artifact منتشرشده مقایسه می‌کند.
- با flagهای digest مستقیم، بدون lookup شبکه verify می‌کند.
- flagها:
  - `--package <name>`: نام package برای resolve کردن metadata artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه package مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: integrity مورد انتظار npm.
  - `--npm-shasum <sha1>`: shasum مورد انتظار npm.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

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
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای نرم‌حذف‌شده را بازیابی می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به مالک فعلی بسته و ناشر مقصد نیاز دارد،
  مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته دارای محدوده باید به مالک محدوده متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری برای ممیزی.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه متصل شوند،
  و برای بازبینی برای ناظران قابل مشاهده می‌شوند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای اتصال به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی نمایانی نظارت بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت دستی
  نظارت آخرین انتشار، وضعیت مسدودسازی دانلود، و دلایل نظارت را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌های وضعیت رسمی، دسترس‌پذیری ClawPack، چکیده مصنوع،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فراداده محیط،
  و وضعیت اسکن را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت با تمرکز بر اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان نقطه پایانی محاسبه‌شده آمادگی را مانند `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال محلی ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - نشانی GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`،‏ `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI همان بایت‌های دقیق npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پرکردن فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری به یک تاربال npm مربوط به ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند مصنوع دقیق را راستی‌آزمایی کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، commit حل‌شده، ref، و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدا به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صریح اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان جایگزین برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` محتوای انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن برای ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی کنشگر دسترسی ناشر داشته باشد، تحت شناسه ناشر کاربر یا سازمان منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری که ممکن است در غیر این صورت غیرمعمول به نظر برسد زمینه می‌دهد، مانند دسترسی شبکه،
  دسترسی میزبان بومی، یا اعتبارنامه‌های خاص ارائه‌دهنده. یادداشت روی
  انتشار منتشرشده ذخیره می‌شود.
- نام‌های بسته دارای محدوده باید با مالک انتخاب‌شده مطابق باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`،‏ `--name`،‏ `--version`،‏ `--source-repo`،‏ `--source-commit`،‏ `--source-ref`،‏ `--source-path`) همچنان به‌عنوان بازنویسی کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

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

نکته‌ها:

- `package.json.version` نسخه انتشار بسته شماست، اما به‌عنوان
  جایگزین برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است وقتی موجود باشند آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` موارد اضافه اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از یک انتشار قدیمی‌تر CLI مربوط به `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های پیش‌پرواز محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک گردش‌کار قابل‌استفاده مجدد رسمی در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
برای مخازن Plugin ارائه می‌کند.

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

نکته‌ها:

- گردش‌کار قابل‌استفاده مجدد مقدار پیش‌فرض `source` را مخزن فراخوان قرار می‌دهد.
- برای تک‌مخزن‌ها، `source_path` را پاس دهید تا گردش‌کار پوشه بسته
  Plugin را منتشر کند، برای مثال `source_path: extensions/codex`.
- گردش‌کار قابل‌استفاده مجدد را به یک تگ پایدار یا SHA کامل commit سنجاق کنید. انتشار نسخه را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلودگی ایجاد نکند.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا push تگ محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای تگ همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای نخستین انتشار، بسته‌های نامطمئن، یا انتشارهای اضطراری در دسترس نگه دارید.
- گردش‌کار نتیجه JSON را به‌عنوان مصنوع بارگذاری می‌کند و آن را به‌عنوان خروجی‌های گردش‌کار در معرض می‌گذارد.

### `sync`

- پوشه‌های Skills محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک دایرکتوری Skills یا یک پوشه Skill منفرد با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، ریشه‌های Skill مربوط به Clawdbot را به‌صورت خودکار اضافه می‌کند:
  - `agent.workspace/skills` (عامل اصلی)
  - `routing.agents.*.workspace/skills` (برای هر عامل)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (بسته‌های مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` ریشه‌های اسکن اضافی
  - `--all` بارگذاری بدون پرسش
  - `--dry-run` فقط نمایش طرح
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

تله‌متری:

- هنگام `sync` در صورت ورود ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (قدیمی: `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
