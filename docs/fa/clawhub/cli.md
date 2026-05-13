---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-13T05:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33d1874fbb65602a7a3b19838a45b4715fa1edd4edc8873a3e4b53bd122e6774
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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ در صورت پیکربندی، به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود با مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال‌کردن اعلان‌ها

معادل‌های env:

- `CLAWHUB_SITE` (میراثی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (میراثی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (میراثی `CLAWDHUB_WORKDIR`)

### پراکسی HTTP

CLI به متغیرهای محیطی استاندارد پراکسی HTTP برای سیستم‌های پشت
پراکسی‌های سازمانی یا شبکه‌های محدود احترام می‌گذارد:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پراکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و
`HTTP_PROXY` برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای دورزدن پراکسی برای
میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این مورد در سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم در آن‌ها مسدود شده‌اند
(برای مثال کانتینرهای Docker، Hetzner VPS با اینترنت فقط از طریق پراکسی، فایروال‌های
سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار تغییری نمی‌کند (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما + URL کش‌شده رجیستری را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت میراثی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر میراثی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (میراثی `CLAWDHUB_CONFIG_PATH`)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق callback لوپ‌بک کامل می‌شود.
- بدون محیط گرافیکی: `clawhub login --token clh_...`
- تعاملی راه‌دور/بدون محیط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و تا زمانی که آن را در `<site>/cli/device` مجاز کنید منتظر می‌ماند.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک skill را به موارد برجسته شما اضافه یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو پیش از محبوبیت دانلود، به تطابق‌های دقیق توکن slug/نام اولویت می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- دانلودها یک پیش‌فرض محبوبیت کوچک هستند، نه تضمینی برای جایگاه برتر.
- اگر یک skill باید ظاهر شود اما نمی‌شود، هنگام ورود، `clawhub inspect <slug>` را اجرا کنید تا پیش از تغییر نام metadata، عیب‌یابی‌های moderation قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین Skills را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt` مرتب شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (summary به 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- بدون نصب، metadata و فایل‌های نسخه skill را واکشی می‌کند.
- `--version <version>`: بررسی یک نسخه مشخص (پیش‌فرض: latest).
- `--tag <tag>`: بررسی یک نسخه دارای برچسب (برای مثال `latest`).
- `--versions`: فهرست‌کردن تاریخچه نسخه‌ها (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌هایی که فهرست می‌شوند (1-200).
- `--files`: فهرست‌کردن فایل‌ها برای نسخه انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` resolve می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- آن را در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی Skills پین‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (میراثی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (میراثی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: برای تأیید سؤال می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- ‎`<workdir>/.clawhub/lock.json` را می‌خواند (`.clawdhub` قدیمی).
- کنار Skills که با `clawhub pin` منجمد شده‌اند، `pinned` را نشان می‌دهد، از جمله دلیل اختیاری.

### `pin <slug>`

- یک Skill نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` دلیل منجمد بودن Skill را ثبت می‌کند.
- Skills دارای pin توسط `update --all` نادیده گرفته می‌شوند و `update <slug>` مستقیم برای آن‌ها رد می‌شود.
- Skills دارای pin همچنین `install --force` را رد می‌کنند تا بایت‌های محلی به‌طور تصادفی جایگزین نشوند.

### `unpin <slug>`

- pin موجود در lockfile را از یک Skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- fingerprint را از فایل‌های محلی محاسبه می‌کند.
- اگر fingerprint با نسخه‌ای شناخته‌شده مطابقت داشته باشد: بدون prompt.
- اگر fingerprint مطابقت نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا prompt، اگر تعاملی باشد)
- Skills دارای pin هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای دارای pin سریعاً شکست می‌خورد و می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای دارای pin را نادیده می‌گیرد و خلاصه‌ای از مواردی که منجمد باقی مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که actor دسترسی publisher داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک Skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو publisher نیاز دارد.
- رفتار owner و review در `docs/publishing.md` توضیح داده شده است.
- انتشار یک Skill یعنی آن Skill تحت `MIT-0` روی ClawHub منتشر می‌شود.
- Skills منتشرشده برای استفاده، تغییر و بازتوزیع بدون attribution آزاد هستند.
- ClawHub از Skills پولی یا قیمت‌گذاری به‌ازای هر Skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan برای رفتاری که ممکن است در غیر این صورت غیرمعمول به نظر برسد، مانند دسترسی شبکه، دسترسی native host، یا credentials مخصوص provider، زمینه می‌دهد. یادداشت روی نسخه منتشرشده ذخیره می‌شود.
- alias قدیمی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک Skill را soft-delete می‌کند (owner، moderator، یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهای آغازشده توسط owner، slug را برای ۳۰ روز رزرو می‌کنند؛ دستور زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت moderation روی Skill و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` confirmation را نادیده می‌گیرد.

### `undelete <slug>`

- یک Skill پنهان را بازیابی می‌کند (owner، moderator، یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت moderation روی Skill و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` confirmation را نادیده می‌گیرد.

### `hide <slug>`

- یک Skill را پنهان می‌کند (owner، moderator، یا admin).
- alias برای `delete`.

### `unhide <slug>`

- یک Skill را از حالت پنهان خارج می‌کند (owner، moderator، یا admin).
- alias برای `undelete`.

### `skill rename <slug> <new-slug>`

- نام یک Skill تحت مالکیت را تغییر می‌دهد و slug قبلی را به‌عنوان redirect alias نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` confirmation را نادیده می‌گیرد.

### `skill merge <source-slug> <target-slug>`

- یک Skill تحت مالکیت را در Skill تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به redirect alias به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` confirmation را نادیده می‌گیرد.

### `transfer`

- workflow انتقال مالکیت.
- انتقال‌ها به handleهای کاربری یک درخواست در انتظار ایجاد می‌کنند که recipient آن را می‌پذیرد.
- انتقال‌ها به handleهای org/publisher فقط زمانی فوراً اعمال می‌شوند که actor به هر دو publisher مالک فعلی و مقصد دسترسی admin داشته باشد.
- زیر‌دستورها:
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

- catalog یکپارچه package را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و ورودی‌های دیگر package-family استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی Skill باقی می‌ماند.
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

- metadata package را بدون نصب واکشی می‌کند.
- از این برای metadata، سازگاری، verification، source، و بررسی version/file مربوط به Plugin استفاده کنید.
- `--version <version>`: یک نسخه مشخص را inspect می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه برچسب‌خورده را inspect می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌ها برای فهرست کردن (۱-۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را واکشی می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- یک نسخه package را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` متعلق به resolver دانلود می‌کند.
- ClawHub SHA-256 را برای همه artifacts بررسی می‌کند.
- برای artifacts از نوع ClawPack npm-pack، integrity مربوط به npm `sha512`، npm shasum، و name/version فایل `package.json` داخل tarball را نیز بررسی می‌کند.
- نسخه‌های ZIP قدیمی از طریق مسیر ZIP قدیمی دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا directory خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ClawHub SHA-256، integrity مربوط به npm `sha512`، و npm shasum را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، metadata مورد انتظار را از ClawHub resolve می‌کند و فایل محلی را با metadata artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون network lookup بررسی می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام package برای resolve کردن metadata مورد انتظار artifact.
  - `--version <version>` یا `--tag <tag>`: نسخه مورد انتظار package.
  - `--sha256 <hex>`: ClawHub SHA-256 مورد انتظار.
  - `--npm-integrity <sri>`: integrity مورد انتظار npm.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک package و همهٔ releaseهای آن را soft-delete می‌کند.
- به مالک package، مالک/ادمین publisher سازمانی، ناظر پلتفرم،
  یا ادمین پلتفرم نیاز دارد.
- Flagها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک package و releaseهای soft-deleted را بازیابی می‌کند.
- به مالک package، مالک/ادمین publisher سازمانی، ناظر پلتفرم،
  یا ادمین پلتفرم نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- Flagها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک package را به publisher دیگری منتقل می‌کند.
- به دسترسی ادمین به هر دو موردِ مالک فعلی package و publisher مقصد نیاز دارد،
  مگر اینکه توسط ادمین پلتفرم انجام شود.
- نام packageهای scoped باید به مالک scope مطابق منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- Flagها:
  - `--to <owner>`: handle مربوط به publisher مقصد.
  - `--reason <text>`: دلیل اختیاری برای audit.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احراز هویت‌شده برای گزارش یک package به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح package هستند، به‌صورت اختیاری به یک version گره می‌خورند،
  و برای بررسی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی packageها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- Flagها:
  - `--version <version>`: version اختیاری package برای پیوست به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی package در moderation.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی scan package، تعداد reportهای باز، آخرین وضعیت moderation دستی release،
  وضعیت مسدودسازی دانلود، و دلایل moderation را نشان می‌دهد.
- Flagها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک package برای مصرف آیندهٔ OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- blockerها را برای وضعیت رسمی، دسترس‌پذیری ClawPack، digest مصنوع،
  provenance منبع، سازگاری OpenClaw، targetهای host، metadata محیط،
  و وضعیت scan گزارش می‌کند.
- Flagها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت migration عملگرمحور را برای packageی نشان می‌دهد که ممکن است جایگزین یک
  plugin همراه OpenClaw شود.
- همان endpoint محاسبه‌شدهٔ readiness را مثل `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر migration، آخرین version، وضعیت official-package، checkها، و
  blockerها را چاپ می‌کند.
- Flagها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک code plugin یا bundle plugin را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشهٔ محلی: `./my-plugin`
  - tarball محلی ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - repo در GitHub: `owner/repo` یا `owner/repo@ref`
  - URL در GitHub: `https://github.com/owner/repo`
- Metadata به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  markerهای واقعی bundle در OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- sourceهای `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI بایت‌های دقیق npm-pack
  را upload می‌کند و از محتوای استخراج‌شدهٔ `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن metadata استفاده می‌کند.
- پوشه‌های code-plugin پیش از upload در یک tarball از نوع ClawPack npm بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند مصنوع دقیق را verify کنند. پوشه‌های bundle-plugin همچنان
  از مسیر publish فایل‌های استخراج‌شده استفاده می‌کنند.
- برای sourceهای GitHub، انتساب منبع به‌صورت خودکار از repo، commit resolve‌شده، ref، و subpath پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- code pluginهای خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صریح declare کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی publish استفاده نمی‌شود.
- `--dry-run` payload resolve‌شدهٔ publish را بدون upload پیش‌نمایش می‌دهد.
- `--json` خروجی قابل‌خواندن برای ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` وقتی actor دسترسی publisher داشته باشد، زیر handle یک publisher کاربر یا سازمان publish می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتارهایی context می‌دهد که ممکن است در غیر این صورت غیرمعمول به نظر برسند، مانند دسترسی شبکه،
  دسترسی host بومی، یا credentialهای خاص provider. یادداشت روی
  release منتشرشده ذخیره می‌شود.
- نام packageهای scoped باید با owner انتخاب‌شده مطابق باشند. `docs/publishing.md` را ببینید.
- flagهای موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- repoهای خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید metadata resolve‌شدهٔ package و
انتساب منبع را پیش از ساخت یک release زنده تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشهٔ محلی

برای code pluginها، publish پوشه یک مصنوع ClawPack را از
پوشهٔ package می‌سازد و upload می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

code pluginهای خارجی به مقدار کمی metadata مربوط به OpenClaw در
`package.json` نیاز دارند. این manifest حداقلی برای یک publish موفق کافی است:

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

- `package.json.version` نسخهٔ release package شماست، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` metadata اختیاری هستند.
  ClawHub ممکن است آن‌ها را در صورت وجود نمایش دهد، اما برای publish الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اختیاری اضافی هستند اگر بخواهید
  metadata سازگاری دقیق‌تری publish کنید.
- اگر از release قدیمی‌تر CLI مربوط به `clawhub` استفاده می‌کنید، پیش از publish آن را upgrade کنید تا
  checkهای preflight محلی پیش از upload اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow قابل‌استفادهٔ مجدد رسمی در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ddaad62cc7852eb8274022ae8a6d7527d169ae8/.github/workflows/package-publish.yml)
برای repoهای plugin ارائه می‌کند.

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

- workflow قابل‌استفادهٔ مجدد، `source` را به‌صورت پیش‌فرض روی repoی caller قرار می‌دهد.
- برای monorepoها، `source_path` را pass کنید تا workflow پوشهٔ package مربوط به plugin
  را publish کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفادهٔ مجدد را به یک tag پایدار یا commit SHA کامل pin کنید. publish release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI بدون آلودگی باقی بماند.
- publishهای واقعی باید به eventهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- publishing مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین publish، packageهای نامطمئن، یا publishهای اضطراری در دسترس نگه دارید.
- workflow نتیجهٔ JSON را به‌عنوان artifact upload می‌کند و آن را به‌عنوان خروجی‌های workflow در اختیار می‌گذارد.

### `sync`

- پوشه‌های skill محلی را scan می‌کند و موارد جدید/تغییریافته را publish می‌کند.
- rootها می‌توانند هر پوشه‌ای باشند: یک دایرکتوری skills یا یک پوشهٔ skill منفرد با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، rootهای skill مربوط به Clawdbot را به‌صورت خودکار اضافه می‌کند:
  - `agent.workspace/skills` (agent اصلی)
  - `routing.agents.*.workspace/skills` (برای هر agent)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (packهای مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- Flagها:
  - `--root <dir...>` rootهای scan اضافی
  - `--all` upload بدون prompt
  - `--dry-run` فقط نمایش plan
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

Telemetry:

- هنگام `sync` و در حالت login‌شده ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
