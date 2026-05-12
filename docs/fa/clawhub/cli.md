---
read_when:
    - استفاده از ClawHub CLI
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار، یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، فلگ‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-12T08:44:16Z"
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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود از مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایهٔ API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال‌کردن پرامپت‌ها

معادل‌های محیطی:

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
پراکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و
`HTTP_PROXY` برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دورزدن پراکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این روی سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم در آن‌ها مسدود شده است
(مثلاً کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی، دیواره‌های آتش
سازمانی).

نمونه:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما + URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسیر جایگزین قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback حلقهٔ محلی کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملیِ راه‌دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و منتظر می‌ماند تا آن را در `<site>/cli/device` تأیید کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک Skill را به برجسته‌های شما اضافه یا از آن حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو پیش از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن مستقل slug مانند `map` با `personal-map` قوی‌تر از زیررشتهٔ داخل `amap` تطابق دارد.
- دانلودها فقط یک پیش‌فرض کوچک برای محبوبیت هستند، نه تضمین جایگاه برتر.
- اگر یک Skill باید نمایش داده شود اما نمی‌شود، پیش از تغییر نام metadata، در حالت واردشده `clawhub inspect <slug>` را اجرا کنید تا عیب‌یابی‌های moderation قابل مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین Skills را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (مرتب‌شده بر اساس `createdAt` به‌صورت نزولی).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (summary به 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- metadata و فایل‌های نسخهٔ Skill را بدون نصب واکشی می‌کند.
- `--version <version>`: بررسی یک نسخهٔ مشخص (پیش‌فرض: latest).
- `--tag <tag>`: بررسی یک نسخهٔ برچسب‌خورده (مثلاً `latest`).
- `--versions`: فهرست تاریخچهٔ نسخه‌ها (صفحهٔ اول).
- `--limit <n>`: بیشینهٔ نسخه‌هایی که فهرست می‌شوند (1-200).
- `--files`: فهرست فایل‌ها برای نسخهٔ انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی Skills پین‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` را می‌خواند (`.clawdhub` قدیمی).
- کنار Skills منجمدشده با `clawhub pin`، از جمله دلیل اختیاری، `pinned` را نشان می‌دهد.

### `pin <slug>`

- یک Skill نصب‌شده را در lockfile به‌عنوان پین‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا Skill منجمد شده است.
- Skills پین‌شده در `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی تصادفی جایگزین نشوند.

### `unpin <slug>`

- پین lockfile را از یک Skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: بدون درخواست تأیید.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، پس از درخواست تأیید)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای پین‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی را چاپ می‌کند که منجمد باقی ماندند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که
  کنشگر دسترسی ناشر داشته باشد، زیر handle ناشرِ org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک Skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک Skill یعنی آن Skill در ClawHub تحت `MIT-0` منتشر می‌شود.
- Skills منتشرشده را می‌توان آزادانه بدون انتساب استفاده، تغییر و بازتوزیع کرد.
- ClawHub از Skills پولی یا قیمت‌گذاری برای هر Skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری زمینه می‌دهد که ممکن است در غیر این صورت غیرمعمول به نظر برسد، مانند دسترسی شبکه،
  دسترسی native host، یا credentials ویژه provider. یادداشت روی
  نسخه منتشرشده ذخیره می‌شود.
- نام مستعار قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک Skill را soft-delete می‌کند (مالک، ناظر، یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهای آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ دستور زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت نظارت روی Skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را نادیده می‌گیرد.

### `undelete <slug>`

- یک Skill پنهان را بازیابی می‌کند (مالک، ناظر، یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارت روی Skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را نادیده می‌گیرد.

### `hide <slug>`

- یک Skill را پنهان می‌کند (مالک، ناظر، یا admin).
- نام مستعار `delete`.

### `unhide <slug>`

- یک Skill را از حالت پنهان خارج می‌کند (مالک، ناظر، یا admin).
- نام مستعار `undelete`.

### `skill rename <slug> <new-slug>`

- یک Skill متعلق به خود را تغییر نام می‌دهد و slug قبلی را به‌عنوان نام مستعار redirect نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را نادیده می‌گیرد.

### `skill merge <source-slug> <target-slug>`

- یک Skill متعلق به خود را در Skill متعلق به خود دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به نام مستعار redirect به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را نادیده می‌گیرد.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به handleهای کاربر، یک درخواست معلق ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای org/publisher فقط زمانی فوراً اعمال می‌شوند که کنشگر به هر دو
  مالک فعلی و ناشر مقصد دسترسی admin داشته باشد.
- زیر‌دستورها:
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

- کاتالوگ یکپارچه package را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جستجو می‌کند.
- از این برای plugins و سایر ورودی‌های خانواده package استفاده کنید؛ `search` سطح بالا همچنان سطح جستجوی Skill باقی می‌ماند.
- Flagها:
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

- فراداده package را بدون نصب دریافت می‌کند.
- از این برای فراداده plugin، سازگاری، تأیید، منبع، و بررسی نسخه/فایل استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بررسی می‌کند (پیش‌فرض: آخرین).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بررسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: بیشترین تعداد نسخه‌ها برای فهرست کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را دریافت می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخه package را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` resolver دانلود می‌کند.
- ClawHub SHA-256 را برای همه artifactها تأیید می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین یکپارچگی npm `sha512`،
  npm shasum، و نام/نسخه `package.json` در tarball را تأیید می‌کند.
- نسخه‌های ZIP قدیمی از مسیر ZIP قدیمی دانلود می‌شوند.
- Flagها:
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

- ClawHub SHA-256، یکپارچگی npm `sha512`، و npm shasum را برای یک
  artifact محلی محاسبه می‌کند.
- با `--package`، فراداده مورد انتظار را از ClawHub resolve می‌کند و
  فایل محلی را با فراداده artifact منتشرشده مقایسه می‌کند.
- با flagهای digest مستقیم، بدون lookup شبکه تأیید می‌کند.
- Flagها:
  - `--package <name>`: نام package برای resolve کردن فراداده artifact مورد انتظار.
  - `--version <version>` یا `--tag <tag>`: نسخه package مورد انتظار.
  - `--sha256 <hex>`: ClawHub SHA-256 مورد انتظار.
  - `--npm-integrity <sri>`: یکپارچگی npm مورد انتظار.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارهای آن را به‌صورت soft-delete حذف می‌کند.
- به مالک بسته، مالک/ادمین ناشر سازمانی، ناظر پلتفرم،
  یا ادمین پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: از تأیید صرف‌نظر می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک بسته و انتشارهای soft-deleted آن را بازیابی می‌کند.
- به مالک بسته، مالک/ادمین ناشر سازمانی، ناظر پلتفرم،
  یا ادمین پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: از تأیید صرف‌نظر می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک بسته را به ناشر دیگری منتقل می‌کند.
- به دسترسی ادمین به هر دو ناشر مالک فعلی بسته و ناشر مقصد نیاز دارد،
  مگر اینکه توسط ادمین پلتفرم انجام شود.
- نام‌های بسته scoped باید به مالک scope متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: شناسه ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری برای audit.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، به‌صورت اختیاری به یک نسخه متصل می‌شوند، و برای
  بازبینی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی بسته‌ها را به‌طور خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست‌کردن به گزارش.
  - `--reason <text>`: دلیل گزارش الزامی.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایش moderation بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت moderation دستی آخرین انتشار،
  وضعیت مسدودسازی دانلود، و دلایل moderation را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مانع‌ها را برای وضعیت رسمی، دسترس‌پذیری ClawPack، digest artifact،
  منشأ source، سازگاری OpenClaw، هدف‌های host، فراداده محیط،
  و وضعیت اسکن گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت migration اپراتورمحور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان endpoint آمادگی محاسبه‌شده `package readiness` را فراخوانی می‌کند، اما
  وضعیت متمرکز بر migration، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها، و
  مانع‌ها را چاپ می‌کند.
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
  - tarball محلی ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL در GitHub: `https://github.com/owner/repo`
- فراداده به‌طور خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` شناسایی می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI همان بایت‌های npm-pack
  را بارگذاری می‌کند و از محتوای استخراج‌شده `package/` فقط برای اعتبارسنجی و
  پیش‌پرکردن فراداده استفاده می‌کند.
- پوشه‌های Plugin کد پیش از بارگذاری در یک tarball npm مربوط به ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند artifact دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب source به‌طور خودکار از مخزن، commit resolve‌شده، ref، و subpath پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب source به‌طور خودکار از git محلی شناسایی می‌شود.
- Pluginهای کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صراحتاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` payload انتشار resolve‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن برای ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، زیر شناسه ناشر کاربر یا سازمان منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری که ممکن است در غیر این صورت غیرعادی به نظر برسد context می‌دهد، مانند دسترسی شبکه،
  دسترسی native host، یا credentials ویژه provider. یادداشت روی
  انتشار منتشرشده ذخیره می‌شود.
- نام‌های بسته scoped باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید فراداده بسته resolve‌شده و
انتساب source را پیش از ایجاد انتشار زنده تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای Pluginهای کد، انتشار پوشه یک artifact از نوع ClawPack را از
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
  fallback برای اعتبارسنجی سازگاری/build OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است در صورت وجود آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از یک انتشار قدیمی‌تر CLI مربوط به `clawhub` استفاده می‌کنید، پیش از انتشار upgrade کنید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی reusable در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
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

نکته‌ها:

- workflow قابل‌استفاده مجدد به‌طور پیش‌فرض `source` را روی مخزن caller می‌گذارد.
- برای monorepoها، `source_path` را پاس بدهید تا workflow پوشه بسته Plugin
  را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفاده مجدد را به یک tag پایدار یا SHA کامل commit pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلودگی ایجاد نکند.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های غیرقابل‌اعتماد، یا انتشارهای break-glass در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان artifact بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در دسترس می‌گذارد.

### `sync`

- پوشه‌های Skills محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک دایرکتوری skills یا یک پوشه skill منفرد با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` موجود باشد، ریشه‌های skill مربوط به Clawdbot را به‌طور خودکار اضافه می‌کند:
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

Telemetry:

- هنگام `sync` در صورت ورود به سیستم ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (قدیمی: `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
