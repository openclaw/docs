---
read_when:
    - استفاده از CLI ClawHub
    - اشکال‌زدایی نصب، به‌روزرسانی، انتشار یا همگام‌سازی
summary: 'مرجع CLI: فرمان‌ها، پرچم‌ها، پیکربندی، فایل قفل، رفتار همگام‌سازی.'
x-i18n:
    generated_at: "2026-05-12T04:09:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42231f76dee1ffc66585e72ce3d370658a362225ad858e7c72726f991287aa2
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

- `--workdir <dir>`: دایرکتوری کاری (پیش‌فرض: cwd؛ اگر پیکربندی شده باشد به فضای کاری Clawdbot برمی‌گردد)
- `--dir <dir>`: دایرکتوری نصب زیر workdir (پیش‌فرض: `skills`)
- `--site <url>`: URL پایه برای ورود با مرورگر (پیش‌فرض: `https://clawhub.ai`)
- `--registry <url>`: URL پایه API (پیش‌فرض: کشف‌شده، در غیر این صورت `https://clawhub.ai`)
- `--no-input`: غیرفعال کردن اعلان‌ها

معادل‌های متغیر محیطی:

- `CLAWHUB_SITE` (قدیمی `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قدیمی `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قدیمی `CLAWDHUB_WORKDIR`)

### پراکسی HTTP

CLI به متغیرهای محیطی استاندارد پراکسی HTTP برای سیستم‌هایی که پشت
پراکسی‌های سازمانی یا شبکه‌های محدود هستند احترام می‌گذارد:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

وقتی هر یک از این متغیرها تنظیم شده باشد، CLI درخواست‌های خروجی را از طریق
پراکسی مشخص‌شده مسیریابی می‌کند. `HTTPS_PROXY` برای درخواست‌های HTTPS و
`HTTP_PROXY` برای HTTP ساده استفاده می‌شود. `NO_PROXY` / `no_proxy` برای
دور زدن پراکسی برای میزبان‌ها یا دامنه‌های مشخص رعایت می‌شود.

این مورد در سیستم‌هایی لازم است که اتصال‌های خروجی مستقیم در آن‌ها مسدود شده‌اند
(مثلاً کانتینرهای Docker، Hetzner VPS با اینترنت فقط از طریق پراکسی، دیوارهای آتش
سازمانی).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

وقتی هیچ متغیر پراکسی تنظیم نشده باشد، رفتار تغییری نمی‌کند (اتصال‌های مستقیم).

## فایل پیکربندی

توکن API شما + URL رجیستری کش‌شده را ذخیره می‌کند.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` یا `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- بازگشت قدیمی: اگر `clawhub/config.json` هنوز وجود نداشته باشد اما `clawdhub/config.json` وجود داشته باشد، CLI از مسیر قدیمی دوباره استفاده می‌کند
- بازنویسی: `CLAWHUB_CONFIG_PATH` (قدیمی `CLAWDHUB_CONFIG_PATH`)

## دستورها

### `login` / `auth login`

- پیش‌فرض: مرورگر را به `<site>/cli/auth` باز می‌کند و از طریق بازفراخوانی loopback کامل می‌شود.
- بدون رابط گرافیکی: `clawhub login --token clh_...`
- تعاملی راه‌دور/بدون رابط گرافیکی: `clawhub login --device` یک کد چاپ می‌کند و تا زمانی که آن را در `<site>/cli/device` تأیید کنید منتظر می‌ماند.

### `whoami`

- توکن ذخیره‌شده را از طریق `/api/v1/whoami` بررسی می‌کند.

### `star <slug>` / `unstar <slug>`

- یک skill را به موارد برجسته شما اضافه می‌کند یا از آن‌ها حذف می‌کند.
- `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `search <query...>`

- `/api/v1/search?q=...` را فراخوانی می‌کند.
- جست‌وجو قبل از محبوبیت دانلود، تطابق‌های دقیق توکن slug/name را ترجیح می‌دهد. یک توکن مستقل slug مانند `map` با `personal-map` قوی‌تر از زیررشته داخل `amap` تطابق دارد.
- دانلودها یک prior کوچک برای محبوبیت هستند، نه تضمین جایگاه برتر.
- اگر یک skill باید نمایش داده شود اما نمی‌شود، هنگام ورود، `clawhub inspect <slug>` را اجرا کنید تا پیش از تغییر نام فراداده، عیب‌یابی‌های تعدیل قابل‌مشاهده برای مالک را بررسی کنید.

### `explore`

- جدیدترین skills را از طریق `/api/v1/skills?limit=...&sort=createdAt` فهرست می‌کند (مرتب‌شده بر اساس `createdAt` به‌صورت نزولی).
- پرچم‌ها:
  - `--limit <n>` (1-200، پیش‌فرض: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (پیش‌فرض: newest)
  - `--json` (خروجی قابل‌خواندن توسط ماشین)
- خروجی: `<slug>  v<version>  <age>  <summary>` (summary به 50 نویسه کوتاه می‌شود).

### `inspect <slug>`

- فراداده skill و فایل‌های نسخه را بدون نصب دریافت می‌کند.
- `--version <version>`: یک نسخه مشخص را بررسی می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه برچسب‌خورده را بررسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌هایی که فهرست می‌شوند (1-200).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را دریافت می‌کند (فقط فایل‌های متنی؛ محدودیت 200KB).
- `--json`: خروجی قابل‌خواندن توسط ماشین.

### `install <slug>`

- آخرین نسخه را از طریق `/api/v1/skills/<slug>` حل می‌کند.
- zip را از طریق `/api/v1/download` دانلود می‌کند.
- در `<workdir>/<dir>/<slug>` استخراج می‌کند.
- از بازنویسی skills سنجاق‌شده خودداری می‌کند؛ ابتدا `clawhub unpin <slug>` را اجرا کنید.
- می‌نویسد:
  - `<workdir>/.clawhub/lock.json` (قدیمی `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قدیمی `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` را حذف می‌کند و ورودی lockfile را پاک می‌کند.
- تعاملی: درخواست تأیید می‌کند.
- غیرتعاملی (`--no-input`): به `--yes` نیاز دارد.

### `list`

- `<workdir>/.clawhub/lock.json` (میراثی `.clawdhub`) را می‌خواند.
- کنار skills که با `clawhub pin` ثابت شده‌اند، `pinned` را نمایش می‌دهد، همراه با دلیل اختیاری.

### `pin <slug>`

- یک skill نصب‌شده را در lockfile به‌عنوان pinned علامت‌گذاری می‌کند.
- `--reason <text>` ثبت می‌کند که چرا skill ثابت شده است.
- Skills پین‌شده توسط `update --all` نادیده گرفته می‌شوند و با `update <slug>` مستقیم رد می‌شوند.
- Skills پین‌شده همچنین `install --force` را رد می‌کنند تا بایت‌های محلی به‌طور تصادفی جایگزین نشوند.

### `unpin <slug>`

- پین lockfile را از یک skill نصب‌شده حذف می‌کند تا به‌روزرسانی‌های آینده بتوانند آن را تغییر دهند.

### `update [slug]` / `update --all`

- اثرانگشت را از فایل‌های محلی محاسبه می‌کند.
- اگر اثرانگشت با یک نسخه شناخته‌شده مطابقت داشته باشد: هیچ درخواستی نمایش داده نمی‌شود.
- اگر اثرانگشت مطابقت نداشته باشد:
  - به‌طور پیش‌فرض رد می‌کند
  - با `--force` بازنویسی می‌کند (یا اگر تعاملی باشد، پس از درخواست)
- Skills پین‌شده هرگز با `--force` به‌روزرسانی نمی‌شوند.
- `update <slug>` برای slugهای پین‌شده سریعاً شکست می‌خورد و به شما می‌گوید ابتدا `clawhub unpin <slug>` را اجرا کنید.
- `update --all` slugهای پین‌شده را نادیده می‌گیرد و خلاصه‌ای از مواردی که ثابت مانده‌اند چاپ می‌کند.

### `skill publish <path>`

- از طریق `POST /api/v1/skills` (multipart) منتشر می‌کند.
- به semver نیاز دارد: `--version 1.2.3`.
- `--owner <handle>` زمانی که actor دسترسی ناشر داشته باشد، زیر handle ناشر org/user منتشر می‌کند.
- `--migrate-owner` هنگام انتشار نسخه جدید، یک skill موجود را به `--owner` منتقل می‌کند. به دسترسی admin/owner در هر دو ناشر نیاز دارد.
- رفتار مالک و بازبینی در `docs/publishing.md` توضیح داده شده است.
- انتشار یک skill یعنی آن skill تحت `MIT-0` در ClawHub منتشر می‌شود.
- Skills منتشرشده را می‌توان آزادانه بدون attribution استفاده، تغییر و بازتوزیع کرد.
- ClawHub از skills پولی یا قیمت‌گذاری جداگانه برای هر skill پشتیبانی نمی‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan زمینه‌ای درباره رفتاری می‌دهد که در غیر این صورت ممکن است غیرمعمول به نظر برسد، مانند دسترسی شبکه، دسترسی host بومی، یا اعتبارنامه‌های مخصوص provider. یادداشت روی نسخه منتشرشده ذخیره می‌شود.
- نام مستعار میراثی: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- یک skill را soft-delete می‌کند (مالک، ناظر یا مدیر).
- `DELETE /api/v1/skills/{slug}` را فراخوانی می‌کند.
- soft deleteهای آغازشده توسط مالک، slug را برای ۳۰ روز رزرو می‌کنند؛ فرمان زمان انقضا را چاپ می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `undelete <slug>`

- یک skill پنهان را بازیابی می‌کند (مالک، ناظر یا مدیر).
- `POST /api/v1/skills/{slug}/undelete` را فراخوانی می‌کند.
- `--reason <text>` یک یادداشت نظارتی روی skill و audit log ثبت می‌کند.
- `--note <text>` نام مستعار `--reason` است.
- `--yes` تأیید را رد می‌کند.

### `hide <slug>`

- یک skill را پنهان می‌کند (مالک، ناظر یا مدیر).
- نام مستعار `delete`.

### `unhide <slug>`

- یک skill را از حالت پنهان خارج می‌کند (مالک، ناظر یا مدیر).
- نام مستعار `undelete`.

### `skill rename <slug> <new-slug>`

- نام یک skill متعلق به شما را تغییر می‌دهد و slug قبلی را به‌عنوان نام مستعار redirect نگه می‌دارد.
- `POST /api/v1/skills/{slug}/rename` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `skill merge <source-slug> <target-slug>`

- یک skill متعلق به شما را در skill دیگری که متعلق به شماست ادغام می‌کند.
- slug مبدأ دیگر به‌صورت عمومی فهرست نمی‌شود و به یک نام مستعار redirect به مقصد تبدیل می‌شود.
- `POST /api/v1/skills/{sourceSlug}/merge` را فراخوانی می‌کند.
- `--yes` تأیید را رد می‌کند.

### `transfer`

- گردش‌کار انتقال مالکیت.
- انتقال‌ها به handleهای کاربر یک درخواست در انتظار ایجاد می‌کنند که گیرنده آن را می‌پذیرد.
- انتقال‌ها به handleهای org/publisher فقط زمانی فوراً اعمال می‌شوند که actor به هر دو ناشر مالک فعلی و مقصد دسترسی admin داشته باشد.
- زیر‌فرمان‌ها:
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
- از این برای plugins و دیگر ورودی‌های خانواده package استفاده کنید؛ `search` سطح بالا همچنان سطح جست‌وجوی skill باقی می‌ماند.
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
- از این برای metadata، سازگاری، verification، source، و بررسی version/file مربوط به plugin استفاده کنید.
- `--version <version>`: یک نسخه مشخص را بررسی می‌کند (پیش‌فرض: latest).
- `--tag <tag>`: یک نسخه tagشده را بررسی می‌کند (مثلاً `latest`).
- `--versions`: تاریخچه نسخه‌ها را فهرست می‌کند (صفحه اول).
- `--limit <n>`: حداکثر نسخه‌ها برای فهرست کردن (۱ تا ۱۰۰).
- `--files`: فایل‌های نسخه انتخاب‌شده را فهرست می‌کند.
- `--file <path>`: محتوای خام فایل را دریافت می‌کند (فقط فایل‌های متنی؛ محدودیت ۲۰۰KB).
- `--json`: خروجی قابل‌خواندن برای ماشین.

### `package download <name>`

- نسخه package را از طریق `GET /api/v1/packages/{name}/versions/{version}/artifact` resolve می‌کند.
- artifact را از `downloadUrl` مربوط به resolver دانلود می‌کند.
- SHA-256 مربوط به ClawHub را برای همه artifactها تأیید می‌کند.
- برای artifactهای ClawPack npm-pack، همچنین integrity `sha512` npm، npm shasum، و نام/نسخه `package.json` در tarball را تأیید می‌کند.
- نسخه‌های ZIP میراثی از مسیر ZIP میراثی دانلود می‌شوند.
- flagها:
  - `--version <version>`: یک نسخه مشخص را دانلود می‌کند.
  - `--tag <tag>`: یک نسخه tagشده را دانلود می‌کند (پیش‌فرض: `latest`).
  - `-o, --output <path>`: فایل یا directory خروجی.
  - `--force`: یک فایل خروجی موجود را بازنویسی می‌کند.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- SHA-256 مربوط به ClawHub، integrity `sha512` npm، و npm shasum را برای یک artifact محلی محاسبه می‌کند.
- با `--package`، metadata مورد انتظار را از ClawHub resolve می‌کند و فایل محلی را با metadata artifact منتشرشده مقایسه می‌کند.
- با flagهای digest مستقیم، بدون lookup شبکه تأیید می‌کند.
- flagها:
  - `--package <name>`: نام package برای resolve کردن metadata مورد انتظار artifact.
  - `--version <version>` یا `--tag <tag>`: نسخه package مورد انتظار.
  - `--sha256 <hex>`: SHA-256 مورد انتظار ClawHub.
  - `--npm-integrity <sri>`: integrity مورد انتظار npm.
  - `--npm-shasum <sha1>`: npm shasum مورد انتظار.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

نمونه‌ها:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- یک package و همهٔ releaseهای آن را به‌صورت نرم‌حذف می‌کند.
- به مالک package، مالک/ادمین ناشر org، ناظر platform،
  یا ادمین platform نیاز دارد.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- یک package و releaseهای نرم‌حذف‌شده را بازیابی می‌کند.
- به مالک package، مالک/ادمین ناشر org، ناظر platform،
  یا ادمین platform نیاز دارد.
- `POST /api/v1/packages/{name}/undelete` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--yes`: رد کردن تأیید.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- یک package را به ناشر دیگری منتقل می‌کند.
- به دسترسی ادمین به هر دو مورد، مالک فعلی package و ناشر مقصد،
  نیاز دارد؛ مگر اینکه توسط ادمین platform انجام شود.
- نام‌های package با scope باید به مالک scope متناظر منتقل شوند.
- `POST /api/v1/packages/{name}/transfer` را فراخوانی می‌کند.
- پرچم‌ها:
  - `--to <owner>`: handle ناشر مقصد.
  - `--reason <text>`: دلیل اختیاری audit.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- فرمان احرازهویت‌شده برای گزارش کردن یک package به ناظران.
- `POST /api/v1/packages/{name}/report` را فراخوانی می‌کند.
- گزارش‌ها در سطح package هستند، می‌توانند به‌صورت اختیاری به یک نسخه مرتبط شوند،
  و برای بررسی در اختیار ناظران قرار می‌گیرند.
- گزارش‌ها به‌تنهایی packageها را خودکار پنهان نمی‌کنند یا دانلودها را مسدود نمی‌کنند.
- پرچم‌ها:
  - `--version <version>`: نسخهٔ اختیاری package برای پیوست کردن به گزارش.
  - `--reason <text>`: دلیل الزامی گزارش.
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- فرمان مالک برای بررسی وضعیت نمایانی moderation package.
- `GET /api/v1/packages/{name}/moderation` را فراخوانی می‌کند.
- وضعیت فعلی scan package، تعداد گزارش‌های باز، آخرین وضعیت moderation دستی release،
  وضعیت مسدودسازی دانلود، و دلایل moderation را نشان می‌دهد.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- بررسی می‌کند که آیا یک package برای مصرف آیندهٔ OpenClaw آماده است یا نه.
- `GET /api/v1/packages/{name}/readiness` را فراخوانی می‌کند.
- مسدودکننده‌های وضعیت رسمی، دسترس‌پذیری ClawPack، digest artifact،
  provenance منبع، سازگاری OpenClaw، هدف‌های host، فرادادهٔ محیط،
  و وضعیت scan را گزارش می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- وضعیت migration با رویکرد operator را برای packageای نشان می‌دهد که ممکن است جایگزین یک
  Plugin همراه OpenClaw شود.
- همان endpoint محاسبه‌شدهٔ readiness را مانند `package readiness` فراخوانی می‌کند، اما
  وضعیت متمرکز بر migration، آخرین نسخه، وضعیت official-package، checkها، و
  مسدودکننده‌ها را چاپ می‌کند.
- پرچم‌ها:
  - `--json`: خروجی قابل‌خواندن برای ماشین.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- یک Plugin کدی یا Plugin بسته‌ای را از طریق `POST /api/v1/packages` منتشر می‌کند.
- `<source>` این موارد را می‌پذیرد:
  - مسیر پوشهٔ محلی: `./my-plugin`
  - tarball محلی ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مخزن GitHub: `owner/repo` یا `owner/repo@ref`
  - URL در GitHub: `https://github.com/owner/repo`
- فراداده به‌صورت خودکار از `package.json`، `openclaw.plugin.json`، و
  نشانگرهای واقعی bundle در OpenClaw مانند `.codex-plugin/plugin.json`،
  `.claude-plugin/plugin.json`، و `.cursor-plugin/plugin.json` شناسایی می‌شود.
- منابع `.tgz` به‌عنوان ClawPack در نظر گرفته می‌شوند. CLI دقیقاً همان byteهای npm-pack
  را آپلود می‌کند و از محتوای استخراج‌شدهٔ `package/` فقط برای اعتبارسنجی و
  پیش‌پر کردن فراداده استفاده می‌کند.
- پوشه‌های code-plugin قبل از آپلود در یک tarball npm از نوع ClawPack بسته‌بندی می‌شوند تا
  نصب‌های OpenClaw بتوانند artifact دقیق را تأیید کنند. پوشه‌های bundle-plugin همچنان
  از مسیر انتشار فایل استخراج‌شده استفاده می‌کنند.
- برای منابع GitHub، attribution منبع به‌صورت خودکار از مخزن، commit حل‌شده، ref، و subpath پر می‌شود.
- برای پوشه‌های محلی، attribution منبع زمانی که remote مبدأ git محلی به GitHub اشاره کند به‌صورت خودکار شناسایی می‌شود.
- Pluginهای کدی خارجی باید `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` را صراحتاً اعلام کنند.
  `package.json.version` سطح بالا به‌عنوان fallback برای اعتبارسنجی انتشار استفاده نمی‌شود.
- `--dry-run` payload حل‌شدهٔ انتشار را بدون آپلود پیش‌نمایش می‌کند.
- `--json` خروجی قابل‌خواندن برای ماشین را برای CI منتشر می‌کند.
- `--owner <handle>` زمانی که actor دسترسی publisher داشته باشد، زیر handle ناشر کاربر یا org منتشر می‌کند.
- `--clawscan-note <text>` یک یادداشت ClawScan اضافه می‌کند. این یادداشت به ClawScan
  برای رفتاری که در غیر این صورت ممکن است غیرمعمول به نظر برسد context می‌دهد، مانند دسترسی شبکه،
  دسترسی host بومی، یا credentials ویژهٔ provider. یادداشت روی
  release منتشرشده ذخیره می‌شود.
- نام‌های package با scope باید با مالک انتخاب‌شده مطابقت داشته باشند. `docs/publishing.md` را ببینید.
- پرچم‌های موجود (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) همچنان به‌عنوان override کار می‌کنند.
- مخزن‌های خصوصی GitHub به `GITHUB_TOKEN` نیاز دارند.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### جریان محلی پیشنهادی

ابتدا از `--dry-run` استفاده کنید تا بتوانید پیش از ایجاد یک release زنده،
فرادادهٔ package و attribution منبع حل‌شده را تأیید کنید:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### جریان پوشهٔ محلی

برای Pluginهای کدی، انتشار پوشه یک artifact از نوع ClawPack را از
پوشهٔ package می‌سازد و آپلود می‌کند:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### حداقل `package.json` برای `--family code-plugin`

Pluginهای کدی خارجی به مقدار کمی فرادادهٔ OpenClaw در
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

- `package.json.version` نسخهٔ release مربوط به package شما است، اما به‌عنوان
  fallback برای اعتبارسنجی سازگاری/build در OpenClaw استفاده نمی‌شود.
- `openclaw.hostTargets` و `openclaw.environment` فرادادهٔ اختیاری هستند.
  ClawHub ممکن است در صورت وجود، آن‌ها را نمایش دهد، اما برای انتشار الزامی نیستند.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` گزینه‌های اضافی اختیاری هستند اگر بخواهید
  فرادادهٔ سازگاری مفصل‌تری منتشر کنید.
- اگر از release قدیمی‌تر CLI `clawhub` استفاده می‌کنید، پیش از انتشار آن را ارتقا دهید تا
  checkهای preflight محلی پیش از آپلود اجرا شوند.

#### GitHub Actions

ClawHub همچنین یک workflow رسمی قابل‌استفادهٔ مجدد در
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/53b64d1d911106dab570eb6260e6ee977e9eefcd/.github/workflows/package-publish.yml)
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

- workflow قابل‌استفادهٔ مجدد به‌صورت پیش‌فرض `source` را روی مخزن caller تنظیم می‌کند.
- برای monorepoها، `source_path` را پاس دهید تا workflow پوشهٔ package
  مربوط به Plugin را منتشر کند، برای مثال `source_path: extensions/codex`.
- workflow قابل‌استفادهٔ مجدد را به یک tag پایدار یا SHA کامل commit pin کنید. انتشار release را از `@main` اجرا نکنید.
- `pull_request` باید از `dry_run: true` استفاده کند تا CI آلوده‌کننده نباشد.
- انتشارهای واقعی باید به رویدادهای مورد اعتماد مانند `workflow_dispatch` یا pushهای tag محدود شوند.
- انتشار مورد اعتماد بدون secret فقط روی `workflow_dispatch` کار می‌کند؛ pushهای tag همچنان به `clawhub_token` نیاز دارند.
- `clawhub_token` را برای اولین انتشار، packageهای غیرمورداعتماد، یا انتشارهای break-glass در دسترس نگه دارید.
- workflow نتیجهٔ JSON را به‌عنوان artifact آپلود می‌کند و آن را به‌عنوان خروجی‌های workflow ارائه می‌دهد.

### `sync`

- پوشه‌های skill محلی را scan می‌کند و موارد جدید/تغییریافته را منتشر می‌کند.
- rootها می‌توانند هر پوشه‌ای باشند: یک دایرکتوری skills یا یک پوشهٔ skill واحد با `SKILL.md`.
- وقتی `~/.clawdbot/clawdbot.json` وجود داشته باشد، rootهای skill مربوط به Clawdbot را به‌صورت خودکار اضافه می‌کند:
  - `agent.workspace/skills` (agent اصلی)
  - `routing.agents.*.workspace/skills` (برای هر agent)
  - `~/.clawdbot/skills` (مشترک)
  - `skills.load.extraDirs` (packهای مشترک)
- به `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` احترام می‌گذارد.
- پرچم‌ها:
  - `--root <dir...>` rootهای scan اضافی
  - `--all` آپلود بدون prompt
  - `--dry-run` فقط نمایش plan
  - `--bump patch|minor|major` (پیش‌فرض: patch)
  - `--changelog <text>` (غیرتعاملی)
  - `--tags a,b,c` (پیش‌فرض: latest)
  - `--concurrency <n>` (پیش‌فرض: 4)

Telemetry:

- هنگام `sync` در صورت وارد بودن، ارسال می‌شود؛ مگر اینکه `CLAWHUB_DISABLE_TELEMETRY=1` باشد (legacy `CLAWDHUB_DISABLE_TELEMETRY=1`).
- جزئیات: `docs/telemetry.md`.
