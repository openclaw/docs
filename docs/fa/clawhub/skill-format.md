---
read_when:
    - انتشار Skills
    - اشکال‌زدایی شکست‌های انتشار
summary: قالب پوشه Skill، فایل‌های الزامی، انواع فایل مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-07-02T17:43:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# قالب مهارت

## روی دیسک

یک مهارت یک پوشه است.

الزامی:

- `SKILL.md` (یا `skill.md`؛ قالب قدیمی `skills.md` نیز پذیرفته می‌شود)

اختیاری:

- هر فایل پشتیبان _متنی_ (به «فایل‌های مجاز» مراجعه کنید)
- `.clawhubignore` (الگوهای نادیده‌گرفتن برای انتشار، قالب قدیمی `.clawdhubignore`)
- `.gitignore` (این مورد نیز رعایت می‌شود)

## وارد کردن از GitHub

واردکننده وب GitHub از انتشار/همگام‌سازی محلی سخت‌گیرتر است. این ابزار فقط فایل‌های
`SKILL.md` یا قالب قدیمی `skills.md` را در مخازن عمومی و غیر فورک که متعلق به
حساب GitHub واردشده هستند کشف می‌کند. مخازن خصوصی، فورک‌ها،
مخازن آرشیوشده/غیرفعال، یا مخازن عمومی شخص ثالث را وارد نمی‌کند.

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (قالب قدیمی `.clawdhub`)

وضعیت نصب پوشه کاری (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (قالب قدیمی `.clawdhub`)

## `SKILL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه مهارت در UI/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده مهارت در frontmatter YAML بالای `SKILL.md` شما اعلام می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید مهارت شما برای اجرا به چه چیزهایی نیاز دارد.

### frontmatter پایه

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### فراداده زمان اجرا (`metadata.openclaw`)

نیازمندی‌های زمان اجرای مهارت خود را زیر `metadata.openclaw` اعلام کنید (نام‌های مستعار: `metadata.clawdbot`، `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

از `requires.env` برای متغیرهای محیطی استفاده کنید که باید پیش از اجرای مهارت حاضر باشند. زمانی از `envVars` استفاده کنید که به فراداده جداگانه برای هر متغیر نیاز دارید، از جمله متغیرهای اختیاری با `required: false`.

### مرجع کامل فیلدها

| فیلد               | نوع        | توضیح                                                                                                                                              |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی الزامی که مهارت شما انتظار دارد.                                                                                                   |
| `requires.bins`    | `string[]` | باینری‌های CLI که همگی باید نصب شده باشند.                                                                                                        |
| `requires.anyBins` | `string[]` | باینری‌های CLI که دست‌کم یکی از آن‌ها باید وجود داشته باشد.                                                                                       |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که مهارت شما می‌خواند.                                                                                                      |
| `primaryEnv`       | `string`   | متغیر محیطی اصلی اعتبارنامه برای مهارت شما.                                                                                                       |
| `envVars`          | `array`    | اعلان‌های متغیر محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری، `required: false` را تنظیم کنید.      |
| `always`           | `boolean`  | اگر `true` باشد، مهارت همیشه فعال است (نیازی به نصب صریح نیست).                                                                                  |
| `skillKey`         | `string`   | کلید فراخوانی مهارت را بازنویسی می‌کند.                                                                                                           |
| `emoji`            | `string`   | ایموجی نمایشی برای مهارت.                                                                                                                         |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات مهارت.                                                                                                                   |
| `os`               | `string[]` | محدودیت‌های سیستم‌عامل (مثلاً `["macos"]`، `["linux"]`).                                                                                         |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین را ببینید).                                                                                                    |
| `nix`              | `object`   | مشخصات Plugin برای Nix (README را ببینید).                                                                                                       |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                                     |

### مشخصات نصب

اگر مهارت شما نیاز دارد وابستگی‌هایی نصب شوند، آن‌ها را در آرایه `install` اعلام کنید:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

گونه‌های نصب پشتیبانی‌شده: `brew`، `node`، `go`، `uv`.

### متغیرهای محیطی اختیاری

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` اعلام کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، زیرا `requires.env` یعنی مهارت بدون آن‌ها نمی‌تواند اجرا شود.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### چرا این مهم است

تحلیل امنیتی ClawHub بررسی می‌کند که آنچه مهارت شما اعلام می‌کند با کاری که واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv`، یا `envVars` اعلام نکند، تحلیل یک ناسازگاری فراداده را علامت‌گذاری می‌کند. دقیق نگه داشتن اعلان‌ها کمک می‌کند مهارت شما بازبینی را پشت سر بگذارد و به کاربران کمک می‌کند بفهمند چه چیزی را نصب می‌کنند.

### مثال: frontmatter کامل

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## فایل‌های مجاز

انتشار فقط فایل‌های «متنی» را می‌پذیرد.

- فهرست مجاز پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) قرار دارد.
- فایل‌های اسکریپت همچنان پس از بارگذاری اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1`، و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند به‌عنوان متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل بسته: 50MB.
- متن embedding شامل `SKILL.md` + تا حدود ۴۰ فایل غیر `.md` است (سقف بر پایه بهترین تلاش).

## اسلاگ‌ها

- به‌صورت پیش‌فرض از نام پوشه مشتق می‌شوند.
- دامنه‌های بسته باید دقیقاً با شناسه ناشر ClawHub مطابقت داشته باشند. شناسه‌های ناشر می‌توانند از حروف کوچک، اعداد، خط تیره، نقطه، و زیرخط استفاده کنند؛ باید با حرف کوچک یا عدد شروع و تمام شوند.
- اسلاگ‌های بسته باید با حروف کوچک و برای npm امن باشند، برای مثال `@example.tools/demo-plugin` یا `demo-plugin`.

## نسخه‌بندی + برچسب‌ها

- هر انتشار یک نسخه جدید (semver) ایجاد می‌کند.
- برچسب‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه مهارت‌های منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هر کسی می‌تواند مهارت‌های منتشرشده را استفاده، تغییر، و بازتوزیع کند، از جمله به‌صورت تجاری.
- ذکر منبع الزامی نیست.
- شرایط مجوز متناقض را در `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر مهارت پشتیبانی نمی‌کند.

## مهارت‌های پولی

- ClawHub از مهارت‌های پولی، قیمت‌گذاری برای هر مهارت، paywall، یا تقسیم درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ این بخشی از قالب مهارت نیست و باعث پولی شدن یک مهارت منتشرشده نخواهد شد.
- اگر مهارت شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب موردنیاز را به‌روشنی در دستورالعمل‌های مهارت و اعلان‌های env مستند کنید (`requires.env` برای متغیرهای الزامی، یا `envVars` با `required: false` برای متغیرهای اختیاری).
