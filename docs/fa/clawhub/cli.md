---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-12T15:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
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

سپس آن را بررسی کنید:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## پرچم‌های سراسری

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ در صورت پیکربندی، به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود از مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایهٔ API (پیش‌فرض: کشف‌شده، وگرنه `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های env:

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
پروکسی مشخص‌شده عبور می‌دهد. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دور زدن پروکسی در
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این مورد در سیستم‌هایی لازم است که اتصال مستقیم خروجی در آن‌ها مسدود شده است
(مثلاً کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پروکسی، دیواره‌های آتش
سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پروکسی تنظیم نشده باشد، رفتار بدون تغییر است (اتصال مستقیم).

## فایل پیکربندی

توکن API شما + URL کش‌شدهٔ رجیستری را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- fallback قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback حلقه‌بازگشتی کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملیِ راه‌دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک مهارت را به برجسته‌های شما اضافه می‌کند یا از آن‌ها برمی‌دارد.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن مستقل slug مثل `map` با `personal-map` قوی‌تر از زیررشتهٔ داخل `amap` تطبیق می‌یابد.
- دانلودها یک پیشینهٔ کوچک محبوبیت هستند، نه تضمینی برای جایگاه برتر.
- اگر مهارتی باید نمایش داده شود اما نمی‌شود، هنگام ورود، `clawhub inspect <slug>` را اجرا کنید تا پیش از تغییر نام metadata، عیب‌یابی‌های تعدیل قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (بر اساس `createdAt` به‌صورت نزولی مرتب‌شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه به 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- metadata مهارت و فایل‌های نسخه را بدون نصب واکشی می‌کند.
- `--version <version>`: یک نسخهٔ مشخص را بررسی کنید (پیش‌فرض: آخرین).
- `--tag <tag>`: یک نسخهٔ برچسب‌خورده را بررسی کنید (مثلاً `latest`).
- `--versions`: تاریخچهٔ نسخه‌ها را فهرست کنید (صفحهٔ اول).
- `--limit <n>`: بیشترین تعداد نسخه‌ها برای فهرست کردن (1-200).
- `--files`: فایل‌های نسخهٔ انتخاب‌شده را فهرست کنید.
- `--file <path>`: محتوای خام فایل را واکشی کنید (فقط فایل‌های متنی؛ سقف 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` resolve می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pinشده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: برای تأیید می‌پرسد.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (میراثی `.clawdhub`) را می‌خواند.
- کنار Skills که با `clawhub pin` منجمد شده‌اند، `pinned` را، همراه با دلیل اختیاری، نشان می‌دهد.

### `pin <slug>`

- یک Skill نصب‌شده را در lockfile به‌عنوان پین‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا Skill منجمد شده است.
- Skills پین‌شده توسط `update --all` نادیده گرفته می‌شوند و در `update <slug>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی به‌طور تصادفی جایگزین نشوند.

### `unpin <slug>`

- پین lockfile را از یک Skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: هیچ درخواستی نمایش داده نمی‌شود.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌صورت پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با درخواست تأیید)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` از slugهای پین‌شده عبور می‌کند و خلاصه‌ای از مواردی که منجمد باقی مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` وقتی عامل دسترسی ناشر دارد، زیر handle ناشر یک سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک Skill موجود را به `--owner` منتقل می‌کند. به دسترسی مدیر/مالک روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک Skill یعنی آن Skill تحت `MIT-0` روی ClawHub منتشر می‌شود.
- Skills منتشرشده را می‌توان آزادانه بدون ذکر انتساب استفاده، تغییر و بازتوزیع کرد.
- ClawHub از Skills پولی یا قیمت‌گذاری جداگانه برای هر Skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan برای رفتاری که در غیر این صورت ممکن است غیرمعمول به نظر برسد، مانند دسترسی شبکه، دسترسی میزبان بومی، یا اعتبارنامه‌های مخصوص ارائه‌دهنده، زمینه می‌دهد. یادداشت روی نسخه منتشرشده ذخیره می‌شود.
- نام مستعار میراثی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک Skill را نرم‌حذف می‌کند (مالک، ناظر، یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی Skill و گزارش حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک Skill پنهان را بازیابی می‌کند (مالک، ناظر، یا مدیر).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی Skill و گزارش حسابرسی ثبت می‌کند.
- `--note <text>` نام مستعاری برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک Skill را پنهان می‌کند (مالک، ناظر، یا مدیر).
- نام مستعار `delete`.

### `unhide <slug>`

- یک Skill را از حالت پنهان خارج می‌کند (مالک، ناظر، یا مدیر).
- نام مستعار `undelete`.

### `skill rename <slug> <new-slug>`

- یک Skill تحت مالکیت را تغییر نام می‌دهد و slug قبلی را به‌عنوان نام مستعار تغییرمسیر نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک Skill تحت مالکیت را در Skill تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به یک نام مستعار تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به handleهای کاربر، یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای سازمان/ناشر تنها وقتی فوراً اعمال می‌شوند که عامل به هر دو ناشر، یعنی مالک فعلی و مقصد، دسترسی مدیر داشته باشد.
- زیرفرمان‌ها:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- نقاط پایانی:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- کاتالوگ یکپارچه بسته را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و دیگر ورودی‌های خانواده بسته استفاده کنید؛ `search` سطح‌بالا همچنان سطح جست‌وجوی Skill باقی می‌ماند.
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

مثال‌ها:

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
- `--version <version>`: یک نسخه مشخص را بررسی می‌کند (پیش‌فرض: آخرین نسخه).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بررسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: حداکثر تعداد نسخه‌ها برای فهرست کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را واکشی می‌کند (فقط فایل‌های متنی؛ سقف ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن توسط ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` حل می‌کند.
- artifact را از `downloadUrl` حل‌کننده دانلود می‌کند.
- SHA-256 ClawHub را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین یکپارچگی `sha512` npm، shasum npm، و نام/نسخه `package.json` در tarball را راستی‌آزمایی می‌کند.
- نسخه‌های ZIP میراثی از طریق مسیر ZIP میراثی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 ClawHub، یکپارچگی `sha512` npm، و shasum npm را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub حل می‌کند و فایل محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون جست‌وجوی شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای حل فراداده artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه مورد انتظار بسته.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: یکپارچگی مورد انتظار npm.
  - `--npm-shasum <sha1>`: shasum مورد انتظار npm.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارهای آن را به‌صورت نرم‌حذف می‌کند.
- به مالک بسته، مالک/مدیر منتشرکننده سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته نرم‌حذف‌شده و انتشارهای آن را بازیابی می‌کند.
- به مالک بسته، مالک/مدیر منتشرکننده سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به منتشرکننده دیگری منتقل می‌کند.
- به دسترسی مدیر به هر دو موردِ مالک فعلی بسته و منتشرکننده مقصد
  نیاز دارد، مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته دارای scope باید به مالک scope متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه منتشرکننده مقصد.
  - `--reason <text>`: دلیل اختیاری برای حسابرسی.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احرازهویت‌شده برای گزارش دادن یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه پیوند بخورند،
  و برای بررسی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست کردن به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایش تعدیل بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت تعدیل دستی آخرین انتشار،
  وضعیت مسدودسازی دانلود، و دلایل تعدیل را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌ها را برای وضعیت رسمی، دسترس‌پذیری ClawPack، digest اثر،
  منشأ منبع، سازگاری OpenClaw، اهداف میزبان، فراداده محیط،
  و وضعیت اسکن گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرتِ مناسب اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان نقطه پایانی آمادگی محاسبه‌شده را مثل `package readiness` فراخوانی می‌کند، اما وضعیت
  متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال npm-pack محلی ClawPack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL ‏GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI دقیقاً همان بایت‌های npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  تکمیل اولیه فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک تاربال npm متعلق به ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند اثر دقیق را راستی‌آزمایی کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، commit حل‌شده، ref، و زیرمسیر تکمیل می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صراحتاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` محموله انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن توسط ماشین را برای CI صادر می‌کند.
- `--owner <handle>` زمانی که کنشگر دسترسی منتشرکننده داشته باشد، زیر شناسه منتشرکننده کاربر یا سازمان منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری که در غیر این صورت ممکن است غیرعادی به نظر برسد، مانند دسترسی شبکه،
  دسترسی میزبان native، یا اعتبارنامه‌های ویژه provider زمینه می‌دهد. یادداشت روی
  انتشار منتشرشده ذخیره می‌شود.
- نام‌های بسته دارای scope باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخزن‌های خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### روند محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد انتشار زنده، فراداده بسته حل‌شده و
انتساب منبع را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### روند پوشه محلی

برای Pluginهای کد، انتشار پوشه یک اثر ClawPack را از
پوشه بسته می‌سازد و بارگذاری می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` حداقلی برای `--family code-plugin`

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
  ClawHub ممکن است آن‌ها را در صورت وجود نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` موارد اضافی اختیاری هستند، اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از یک انتشار قدیمی‌تر CLI ‏`clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل‌استفاده‌مجدد را در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
برای مخزن‌های Plugin ارائه می‌کند.

تنظیم معمول caller:

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

- workflow قابل‌استفاده‌مجدد به‌صورت پیش‌فرض `source` را روی مخزن caller می‌گذارد.
- برای monorepoها، `source_path` را پاس دهید تا workflow پوشه بسته Plugin
  را منتشر کند؛ برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفاده‌مجدد را به یک برچسب پایدار یا SHA کامل commit pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی بماند.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های نامطمئن، یا انتشارهای break-glass در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow ارائه می‌دهد.

### `sync`

- پوشه‌های Skills محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک دایرکتوری Skills یا یک پوشه Skill منفرد با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، ریشه‌های Skill متعلق به Clawdbot را خودکار اضافه می‌کند:
  - `agent.workspace/skills` (عامل اصلی)
  - `routing.agents.*.workspace/skills` (برای هر عامل)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (بسته‌های مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` ریشه‌های اضافی اسکن
  - `--all` بارگذاری بدون پرسش
  - `--dry-run` فقط نمایش برنامه
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

تله‌متری:

- هنگام `sync` در صورت ورود به حساب ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (میراثی `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
