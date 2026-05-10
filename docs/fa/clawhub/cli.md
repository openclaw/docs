---
read_when:
    - استفاده از ClawHub CLI
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: دستورات، پرچم‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-10T19:27:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
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

- `--workdir <dir>`: پوشهٔ کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد، به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: پوشهٔ نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود مرورگری (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایهٔ API (پیش‌فرض: کشف‌شده، وگرنه `https://clawhub.ai`)
- `--no-input`: غیرفعال‌کردن اعلان‌ها

معادل‌های محیطی:

- `CLAWHUB_SITE` (میراثی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (میراثی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (میراثی `CLAWDHUB_WORKDIR`)

### پراکسی HTTP

CLI متغیرهای محیطی استاندارد پراکسی HTTP را برای سیستم‌هایی که پشت
پراکسی‌های سازمانی یا شبکه‌های محدود هستند رعایت می‌کند:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هرکدام از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پراکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و
`HTTP_PROXY` برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای
دورزدن پراکسی برای میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این برای سیستم‌هایی لازم است که اتصال خروجی مستقیم در آن‌ها مسدود شده است
(مثلاً کانتینرهای Docker، VPSهای Hetzner با اینترنت فقط از طریق پراکسی،
فایروال‌های سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار بدون تغییر می‌ماند (اتصال مستقیم).

## فایل پیکربندی

توکن API شما + URL رجیستری ذخیره‌شده در کش را نگه می‌دارد.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت میراثی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر میراثی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (میراثی `CLAWDHUB_CONFIG_PATH`)

## فرمان‌ها

### `login` / `auth login`

- پیش‌فرض: مرورگر را روی `<site>/cli/auth` باز می‌کند و از طریق callback loopback تکمیل می‌شود.
- بدون محیط گرافیکی: `clawhub login --token clh_...`
- تعاملی راه‌دور/بدون محیط گرافیکی: `clawhub login --device` کدی را چاپ می‌کند و منتظر می‌ماند تا شما آن را در `<site>/cli/device` مجاز کنید.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- مهارتی را به برجسته‌های شما اضافه می‌کند یا از آن حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو، تطابق‌های دقیق توکن slug/name را پیش از محبوبیت دانلود ترجیح می‌دهد. یک توکن slug مستقل مانند `map` با `personal-map` قوی‌تر از زیررشتهٔ داخل `amap` تطبیق داده می‌شود.
- دانلودها یک پیش‌فرض کوچک برای محبوبیت هستند، نه تضمینی برای جایگاه نخست.
- اگر مهارتی باید ظاهر شود اما ظاهر نمی‌شود، هنگام ورود، `clawhub inspect <slug>` را اجرا کنید تا پیش از تغییر نام فراداده، تشخیص‌های تعدیل قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین مهارت‌ها را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (به‌ترتیب نزولی `createdAt` مرتب‌شده).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن برای ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (summary تا 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- فرادادهٔ مهارت و فایل‌های نسخه را بدون نصب واکشی می‌کند.
- `--version <version>`: بررسی یک نسخهٔ مشخص (پیش‌فرض: آخرین).
- `--tag <tag>`: بررسی یک نسخهٔ برچسب‌دار (مثلاً `latest`).
- `--versions`: فهرست تاریخچهٔ نسخه‌ها (صفحهٔ اول).
- `--limit <n>`: بیشینهٔ نسخه‌هایی که فهرست می‌شوند (1-200).
- `--files`: فهرست فایل‌های نسخهٔ انتخاب‌شده.
- `--file <path>`: واکشی محتوای خام فایل (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی مهارت‌های pin‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (میراثی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (میراثی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: برای تأیید می‌پرسد.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (میراثی `.clawdhub`) را می‌خواند.
- کنار مهارت‌هایی که با `clawhub pin` ثابت شده‌اند، از جمله دلیل اختیاری، `pinned` را نشان می‌دهد.

### `pin <slug>`

- یک مهارت نصب‌شده را در lockfile به‌عنوان سنجاق‌شده علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند چرا مهارت منجمد شده است.
- مهارت‌های سنجاق‌شده توسط `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- مهارت‌های سنجاق‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی به‌صورت تصادفی جایگزین نشوند.

### `unpin <slug>`

- سنجاق lockfile را از یک مهارت نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: درخواستی نمایش داده نمی‌شود.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، با درخواست تأیید)
- مهارت‌های سنجاق‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای سنجاق‌شده سریع شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای سنجاق‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی که منجمد باقی ماندند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` وقتی actor دسترسی ناشر داشته باشد، تحت handle ناشر یک سازمان/کاربر منتشر می‌کند.
- `--migrate-owner` هنگام انتشار یک نسخه جدید، یک مهارت موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner روی هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک مهارت یعنی آن مهارت تحت `MIT-0` در ClawHub منتشر شده است.
- مهارت‌های منتشرشده بدون نیاز به انتساب، رایگان برای استفاده، تغییر و بازتوزیع هستند.
- ClawHub از مهارت‌های پولی یا قیمت‌گذاری برای هر مهارت پشتیبانی نمی‌کند.
- alias قدیمی: `publish <path>`.

### `delete <slug>`

- یک مهارت را soft-delete می‌کند (مالک، moderator یا admin).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهای آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ دستور زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت moderation روی مهارت و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک مهارت مخفی را بازیابی می‌کند (مالک، moderator یا admin).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت moderation روی مهارت و audit log ثبت می‌کند.
- `--note <text>` یک alias برای `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک مهارت را مخفی می‌کند (مالک، moderator یا admin).
- alias برای `delete`.

### `unhide <slug>`

- یک مهارت را از حالت مخفی خارج می‌کند (مالک، moderator یا admin).
- alias برای `undelete`.

### `skill rename <slug> <new-slug>`

- یک مهارت تحت مالکیت را تغییر نام می‌دهد و slug قبلی را به‌عنوان alias تغییرمسیر نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک مهارت تحت مالکیت را در مهارت تحت مالکیت دیگری ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به alias تغییرمسیر به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill rescan <slug>`

- درخواست اسکن مجدد امنیتی برای آخرین نسخه منتشرشده مهارت می‌دهد.
- مالکان و adminهای ناشر می‌توانند مهارت‌های خودشان را تا سقف بازیابی هر نسخه دوباره اسکن کنند.
- moderatorها و adminهای پلتفرم می‌توانند هر مهارتی را دوباره اسکن کنند و توسط سقف بازیابی مالک مسدود نمی‌شوند، هرچند برای هر نسخه فقط یک اسکن مجدد می‌تواند هم‌زمان اجرا شود.
- `POST /api/v1/skills/{slug}/rescan` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: تأیید را رد کن.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- گردش‌کار انتقال مالکیت.
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

- کاتالوگ بسته یکپارچه را از طریق `GET /api/v1/packages` و `GET /api/v1/packages/search` مرور یا جست‌وجو می‌کند.
- از این برای plugins و سایر ورودی‌های خانواده بسته استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی مهارت باقی می‌ماند.
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

- metadata بسته را بدون نصب دریافت می‌کند.
- از این برای metadata مربوط به plugin، سازگاری، verification، source، و بررسی version/file استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بررسی کن (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بررسی کن (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست کن (صفحه اول).
- `--limit <n>`: بیشینه نسخه‌هایی که فهرست می‌شوند (۱ تا ۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست کن.
- `--file <path>`: محتوای خام فایل را دریافت کن (فقط فایل‌های متنی؛ سقف ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن توسط ماشین.

### `package download <name>`

- یک نسخه بسته را از طریق
  `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` متعلق به resolver دانلود می‌کند.
- ClawHub SHA-256 را برای همه artifactها تأیید می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین integrity مربوط به npm `sha512`، npm shasum، و نام/نسخه `package.json` داخل tarball را تأیید می‌کند.
- نسخه‌های Legacy ZIP از مسیر legacy ZIP دانلود می‌شوند.
- پرچم‌ها:
  - `--version <version>`: یک نسخه مشخص را دانلود کن.
  - `--tag <tag>`: یک نسخه برچسب‌خورده را دانلود کن (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا دایرکتوری خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی کن.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ClawHub SHA-256، integrity مربوط به npm `sha512`، و npm shasum را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، metadata مورد انتظار را از ClawHub resolve می‌کند و فایل محلی را با metadata مربوط به artifact منتشرشده مقایسه می‌کند.
- با پرچم‌های digest مستقیم، بدون lookup شبکه تأیید می‌کند.
- پرچم‌ها:
  - `--package <name>`: نام بسته برای resolve کردن metadata مورد انتظار artifact.
  - `--version <version>` یا `--tag <tag>`: نسخه بسته مورد انتظار.
  - `--sha256 <hex>`: ClawHub SHA-256 مورد انتظار.
  - `--npm-integrity <sri>`: integrity مورد انتظار npm.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل‌خواندن توسط ماشین.

مثال‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک بسته و همه انتشارهای آن را soft-delete می‌کند.
- به مالک بسته، مالک/مدیر ناشر سازمان، ناظر پلتفرم،
  یا مدیر پلتفرم نیاز دارد.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- درخواست اسکن امنیتی دوباره برای آخرین انتشار منتشرشده بسته.
- مالکان و مدیران ناشر می‌توانند بسته‌های خود را تا سقف بازیابی هر انتشار
  دوباره اسکن کنند.
- ناظران و مدیران پلتفرم می‌توانند هر بسته‌ای را دوباره اسکن کنند و محدودیت
  بازیابی مالک مانع آن‌ها نمی‌شود، هرچند در هر زمان برای هر انتشار فقط یک اسکن دوباره می‌تواند اجرا شود.
- `POST /api/v1/packages/{name}/rescan` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- دستور احراز هویت‌شده برای گزارش یک بسته به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح بسته هستند، می‌توانند به‌صورت اختیاری به یک نسخه گره بخورند،
  و برای بازبینی برای ناظران قابل مشاهده می‌شوند.
- گزارش‌ها به‌تنهایی بسته‌ها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخه اختیاری بسته برای پیوست کردن به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- دستور مالک/ناشر برای اعتراض به نظارت انتشار.
- `POST /api/v1/packages/{name}/appeal` را فراخوانی می‌کند.
- اعتراض‌ها برای انتشارهای قرنطینه‌شده، لغوشده، مشکوک یا مخرب
  پذیرفته می‌شوند.
- پرچم‌ها:
  - `--version <version>`: نسخه الزامی بسته.
  - `--message <text>`: پیام الزامی اعتراض.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- دستور مالک برای بررسی وضعیت نمایانی نظارت بسته.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی اسکن بسته، تعداد گزارش‌های باز، وضعیت آخرین نظارت دستی انتشار،
  وضعیت مسدودسازی دانلود، و دلایل نظارت را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک بسته برای مصرف آینده OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌ها را برای وضعیت رسمی، دسترس‌پذیری ClawPack، چکیده آرتیفکت،
  منشأ منبع، سازگاری OpenClaw، هدف‌های میزبان، فراداده محیط،
  و وضعیت اسکن گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت مهاجرت متمرکز بر اپراتور را برای بسته‌ای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان endpoint آمادگی محاسبه‌شده را مانند `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر مهاجرت، آخرین نسخه، وضعیت بسته رسمی، بررسی‌ها و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک Plugin کد یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` می‌پذیرد:
  - مسیر پوشه محلی: `./my-plugin`
  - tarball محلی ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - نشانی GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json` و
  نشانگرهای واقعی بسته OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json` و `.cursor-plugin/plugin.json` تشخیص داده می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI بایت‌های دقیق npm-pack را
  بارگذاری می‌کند و محتوای استخراج‌شده `package/` را فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده به کار می‌برد.
- پوشه‌های Plugin کد پیش از بارگذاری به یک tarball npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند آرتیفکت دقیق را تأیید کنند. پوشه‌های Plugin بسته‌ای همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، انتساب منبع به‌صورت خودکار از مخزن، commit حل‌شده، ref و زیرمسیر پر می‌شود.
- برای پوشه‌های محلی، وقتی remote مبدأ به GitHub اشاره کند، انتساب منبع به‌صورت خودکار از git محلی تشخیص داده می‌شود.
- Plugin‌های کد خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صریحاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` payload انتشار حل‌شده را بدون بارگذاری پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن برای ماشین را برای CI تولید می‌کند.
- `--owner <handle>` وقتی کنشگر دسترسی ناشر داشته باشد، زیر handle ناشر کاربر یا سازمان منتشر می‌کند.
- نام‌های بسته scoped باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخازن خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ساخت یک انتشار زنده، فراداده حل‌شده بسته و
انتساب منبع را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشه محلی

برای Plugin‌های کد، انتشار پوشه یک آرتیفکت ClawPack را از
پوشه بسته می‌سازد و بارگذاری می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

Plugin‌های کد خارجی به مقدار کمی فراداده OpenClaw در
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
  fallback برای اعتبارسنجی سازگاری/ساخت OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فراداده اختیاری هستند.
  ClawHub ممکن است آن‌ها را در صورت وجود نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند اگر بخواهید
  فراداده سازگاری دقیق‌تری منتشر کنید.
- اگر از نسخه قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار ارتقا دهید تا
  بررسی‌های preflight محلی پیش از بارگذاری اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل استفاده مجدد در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
برای مخازن Plugin ارائه می‌کند.

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

نکته‌ها:

- workflow قابل استفاده مجدد مقدار پیش‌فرض `source` را مخزن فراخوان قرار می‌دهد.
- برای monorepo‌ها، `source_path` را پاس دهید تا workflow پوشه بسته Plugin را منتشر کند،
  برای مثال `source_path: extensions/codex`.
- workflow قابل استفاده مجدد را به یک tag پایدار یا SHA کامل commit pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلودگی ایجاد نکند.
- انتشارهای واقعی باید به رویدادهای قابل اعتماد مانند `workflow_dispatch` یا push‌های tag محدود شوند.
- انتشار قابل اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ push‌های tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، بسته‌های نامطمئن، یا انتشارهای break-glass در دسترس نگه دارید.
- workflow نتیجه JSON را به‌عنوان آرتیفکت بارگذاری می‌کند و آن را به‌عنوان خروجی‌های workflow در معرض قرار می‌دهد.

### `sync`

- پوشه‌های skill محلی را اسکن می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- ریشه‌ها می‌توانند هر پوشه‌ای باشند: یک پوشه skills یا یک پوشه skill تکی با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، ریشه‌های skill مربوط به Clawdbot را خودکار اضافه می‌کند:
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

- هنگام `sync` در صورت وارد بودن ارسال می‌شود، مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (قدیمی: `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
