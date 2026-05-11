---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: دستورها، فلگ‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-11T22:19:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
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
- `--site <url>`: نشانی پایه برای ورود با مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: نشانی پایه API (پیش‌فرض: کشف‌شده، وگرنه `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های محیطی:

- `CLAWHUB_SITE` (قدیمی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی `CLAWDHUB_WORKDIR`)

### پروکسی HTTP

CLI به متغیرهای محیطی استاندارد پروکسی HTTP برای سیستم‌هایی که پشت
پروکسی‌های سازمانی یا شبکه‌های محدود هستند احترام می‌گذارد:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پروکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و `HTTP_PROXY`
برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دور زدن پروکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این در سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم در آن‌ها مسدود شده‌اند
(مثلاً کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پروکسی، دیوارهای آتش
سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پروکسی‌ای تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما + نشانی رجیستری ذخیره‌شده در کش را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسیر جایگزین قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق بازفراخوانی loopback کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی راه دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا شما آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک مهارت را به برجسته‌های شما اضافه می‌کند یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تایید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- دانلودها یک پیش‌فرض کوچک برای محبوبیت هستند، نه تضمینی برای جایگاه برتر.
- اگر مهارتی باید ظاهر شود اما نمی‌شود، هنگام ورود به سیستم `clawhub inspect <slug>` را اجرا کنید تا پیش از تغییر نام فراداده، تشخیص‌های نظارت محتوا که برای مالک قابل مشاهده‌اند بررسی شوند.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (بر اساس `createdAt` به‌صورت نزولی مرتب شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (خلاصه به 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- فراداده مهارت و فایل‌های نسخه را بدون نصب واکشی می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: آخرین نسخه).
- `--tag <tag>`: بررسی یک نسخه برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌ها برای فهرست کردن (1-200).
- `--files`: فهرست فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ سقف 200KB).
- `--json`: خروجی قابل خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pinشده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: درخواست تایید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (قدیمی: `.clawdhub`) را می‌خواند.
- کنار Skills که با `clawhub pin` ثابت شده‌اند، `pinned` را نشان می‌دهد، همراه با دلیل اختیاری.

### `pin <slug>`

- یک Skill نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا Skill ثابت شده است.
- Skills پین‌شده توسط `update --all` نادیده گرفته می‌شوند و در `update <slug>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی تصادفی جایگزین نشوند.

### `unpin <slug>`

- پین lockfile را از یک Skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثر انگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثر انگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: بدون اعلان.
- اگر اثر انگشت مطابقت نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا در صورت تعاملی بودن، با اعلان)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای پین‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی که ثابت مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (چندبخشی) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که کنشگر دسترسی ناشر داشته باشد، زیر handle ناشر سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک Skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک Skill یعنی آن تحت `MIT-0` روی ClawHub منتشر می‌شود.
- Skills منتشرشده برای استفاده، تغییر و بازتوزیع بدون انتساب آزاد هستند.
- ClawHub از Skills پولی یا قیمت‌گذاری برای هر Skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan زمینه‌ای برای رفتاری می‌دهد که در غیر این صورت ممکن است غیرمعمول به نظر برسد، مانند دسترسی شبکه، دسترسی میزبان بومی، یا اعتبارنامه‌های ویژه provider. یادداشت روی نسخه منتشرشده ذخیره می‌شود.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک Skill را به‌صورت نرم حذف می‌کند (مالک، ناظر، یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- حذف‌های نرم آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی Skill و لاگ audit ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک Skill پنهان را بازیابی می‌کند (مالک، ناظر، یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی Skill و لاگ audit ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک Skill را پنهان می‌کند (مالک، ناظر، یا admin).
- نام مستعار `delete`.

### `unhide <slug>`

- یک Skill را از حالت پنهان خارج می‌کند (مالک، ناظر، یا admin).
- نام مستعار `undelete`.

### `skill rename <slug> <new-slug>`

- یک Skill تحت مالکیت را تغییر نام می‌دهد و slug قبلی را به‌عنوان نام مستعار redirect نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک Skill تحت مالکیت را در Skill تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به یک نام مستعار redirect به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به handleهای کاربری یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای سازمان/ناشر فقط زمانی فوراً اعمال می‌شوند که کنشگر به هر دو ناشر مالک فعلی و مقصد دسترسی admin داشته باشد.
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

- کاتالوگ یکپارچه package را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جستجو می‌کند.
- از این برای plugins و دیگر ورودی‌های خانواده package استفاده کنید؛ `search` سطح بالا همچنان سطح جستجوی Skill باقی می‌ماند.
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

نمونه‌ها:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- فراداده package را بدون نصب دریافت می‌کند.
- از این برای فراداده Plugin، سازگاری، راستی‌آزمایی، منبع، و بازرسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بازرسی می‌کند (پیش‌فرض: آخرین).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بازرسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه را فهرست می‌کند (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌هایی که فهرست می‌شوند (۱ تا ۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را دریافت می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخه package را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` متعلق به resolver دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همه artifactها راستی‌آزمایی می‌کند.
- برای artifactهای ClawPack npm-pack، یکپارچگی `sha512` مربوط به npm، npm shasum، و نام/نسخه `package.json` در tarball را نیز راستی‌آزمایی می‌کند.
- نسخه‌های ZIP قدیمی از مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 مربوط به ClawHub، یکپارچگی `sha512` مربوط به npm، و npm shasum را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub resolve می‌کند و فایل محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون lookup شبکه راستی‌آزمایی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام package برای resolve کردن فراداده artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه package مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: یکپارچگی npm مورد انتظار.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارها را به‌صورت موقت حذف می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: تأیید را رد می‌کند.
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای حذف‌شده به‌صورت موقت را بازیابی می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: تأیید را رد می‌کند.
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی مدیر به مالک فعلی بسته و ناشر مقصد
  نیاز دارد، مگر اینکه توسط مدیر پلتفرم انجام شود.
- نام‌های بسته دارای محدوده باید به مالک محدوده مطابق منتقل شوند.
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

- فرمان احرازهویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه وابسته شوند، و برای بررسی
  در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل خواندن برای ماشین.

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
  - `--json`: خروجی قابل خواندن برای ماشین.

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
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت با جهت‌گیری اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان نقطه پایانی آمادگی محاسبه‌شده مثل `package readiness` را فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل خواندن برای ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - تاربال محلی ClawPack از نوع npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI بایت‌های دقیق npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پرکردن فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک تاربال npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند مصنوع دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، کامیت حل‌شده، ref، و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی ریموت origin به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را به‌صراحت اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان مقدار جایگزین برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` محتوای انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل خواندن برای ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` زمانی که عامل دسترسی ناشر داشته باشد، زیر شناسه ناشر کاربر یا سازمان منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری که ممکن است در غیر این صورت غیرمعمول به نظر برسد، مانند دسترسی شبکه،
  دسترسی میزبان بومی، یا اعتبارنامه‌های خاص ارائه‌دهنده، زمینه می‌دهد. یادداشت روی
  انتشار منتشرشده ذخیره می‌شود.
- نام‌های بسته دارای محدوده باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان بازنویسی کار می‌کنند.
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

برای Pluginهای کد، انتشار پوشه یک مصنوع ClawPack را از
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

یادداشت‌ها:

- `package.json.version` نسخه انتشار بسته شماست، اما به‌عنوان
  مقدار جایگزین برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است آن‌ها را هنگام وجود نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های پیش‌پرواز محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل استفاده مجدد در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
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

یادداشت‌ها:

- workflow قابل استفاده مجدد، `source` را به‌طور پیش‌فرض روی مخزن فراخوان می‌گذارد.
- برای monorepoها، `source_path` را پاس دهید تا workflow پوشه بسته Plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل استفاده مجدد را به یک برچسب پایدار یا SHA کامل کامیت pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی باقی بماند.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا push برچسب محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای برچسب همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های غیرقابل اعتماد، یا انتشارهای اضطراری در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان مصنوع بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در دسترس می‌گذارد.

### `sync`

- پوشه‌های Skills محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک دایرکتوری Skills یا یک پوشه Skill تکی با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، ریشه‌های Skill مربوط به Clawdbot را خودکار اضافه می‌کند:
  - `agent.workspace/skills` (عامل اصلی)
  - `routing.agents.*.workspace/skills` (برای هر عامل)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (بسته‌های مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` ریشه‌های اضافی اسکن
  - `--all` بارگذاری بدون پرسش
  - `--dry-run` فقط نمایش طرح
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

تله‌متری:

- هنگام `sync` و در حالت ورودشده ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` (قدیمی: `CLAWDHUB_DISABLE_TELEMETRY=1`) باشد.
- جزئیات: `docs/telemetry.md`.
