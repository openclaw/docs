---
read_when:
    - انتشار Skills
    - اشکال‌زدایی از خطاهای انتشار/همگام‌سازی
summary: قالب پوشه Skill، فایل‌های الزامی، انواع فایل مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-05-12T12:49:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# قالب مهارت

## روی دیسک

مهارت یک پوشه است.

ضروری:

- `SKILL.md` (یا `skill.md`)

اختیاری:

- هر فایل پشتیبان _متنی_ (بخش «فایل‌های مجاز» را ببینید)
- `.clawhubignore` (الگوهای نادیده‌گیری برای انتشار/همگام‌سازی، `.clawdhubignore` قدیمی)
- `.gitignore` (آن هم رعایت می‌شود)

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب دایرکتوری کاری (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه مهارت در رابط کاربری/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده مهارت در frontmatter YAML در ابتدای `SKILL.md` شما اعلام می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید مهارت شما برای اجرا به چه چیزهایی نیاز دارد.

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

از `requires.env` برای متغیرهای محیطی‌ای استفاده کنید که پیش از اجرای مهارت باید وجود داشته باشند. زمانی از `envVars` استفاده کنید که برای هر متغیر به فراداده نیاز دارید، از جمله متغیرهای اختیاری با `required: false`.

### مرجع کامل فیلدها

| فیلد               | نوع        | توضیح                                                                                                                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی ضروری که مهارت شما انتظار دارد.                                                                                       |
| `requires.bins`    | `string[]` | باینری‌های CLI که همگی باید نصب شده باشند.                                                                                           |
| `requires.anyBins` | `string[]` | باینری‌های CLI که حداقل یکی از آن‌ها باید وجود داشته باشد.                                                                            |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که مهارت شما می‌خواند.                                                                                         |
| `primaryEnv`       | `string`   | متغیر محیطی اعتبارنامه اصلی برای مهارت شما.                                                                                          |
| `envVars`          | `array`    | اعلام متغیرهای محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری `required: false` تنظیم کنید. |
| `always`           | `boolean`  | اگر `true` باشد، مهارت همیشه فعال است (نیازی به نصب صریح ندارد).                                                                     |
| `skillKey`         | `string`   | کلید فراخوانی مهارت را بازنویسی می‌کند.                                                                                              |
| `emoji`            | `string`   | ایموجی نمایشی برای مهارت.                                                                                                            |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات مهارت.                                                                                                      |
| `os`               | `string[]` | محدودیت‌های سیستم‌عامل (مثلاً `["macos"]`، `["linux"]`).                                                                             |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین‌تر را ببینید).                                                                                    |
| `nix`              | `object`   | مشخصات Plugin مربوط به Nix (README را ببینید).                                                                                       |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                         |

### مشخصات نصب

اگر مهارت شما به نصب وابستگی‌ها نیاز دارد، آن‌ها را در آرایه `install` اعلام کنید:

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

انواع نصب پشتیبانی‌شده: `brew`، `node`، `go`، `uv`.

### متغیرهای محیطی اختیاری

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` اعلام کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، چون `requires.env` یعنی مهارت بدون آن‌ها نمی‌تواند اجرا شود.

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

تحلیل امنیتی ClawHub بررسی می‌کند که آنچه مهارت شما اعلام می‌کند با کاری که واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv` یا `envVars` اعلام نکرده باشد، تحلیل یک ناسازگاری فراداده را علامت‌گذاری می‌کند. دقیق نگه‌داشتن اعلام‌ها کمک می‌کند مهارت شما بازبینی را با موفقیت بگذراند و به کاربران کمک می‌کند بفهمند چه چیزی را نصب می‌کنند.

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

فقط فایل‌های «متنی» توسط انتشار پذیرفته می‌شوند.

- فهرست مجاز پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) قرار دارد.
- فایل‌های اسکریپت پس از بارگذاری همچنان اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1` و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند به‌عنوان متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل بسته: 50MB.
- متن جاسازی‌شده شامل `SKILL.md` + حداکثر حدود ۴۰ فایل غیر `.md` است (سقف به‌صورت best-effort).

## Slugs

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شوند.
- باید حروف کوچک و امن برای URL باشند: `^[a-z0-9][a-z0-9-]*$`.

## نسخه‌بندی + تگ‌ها

- هر انتشار یک نسخه جدید ایجاد می‌کند (semver).
- تگ‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه مهارت‌های منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هر کسی می‌تواند از مهارت‌های منتشرشده استفاده کند، آن‌ها را تغییر دهد و بازتوزیع کند، از جمله به‌صورت تجاری.
- ذکر منبع لازم نیست.
- شروط مجوز متعارض را به `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر مهارت پشتیبانی نمی‌کند.

## مهارت‌های پولی

- ClawHub از مهارت‌های پولی، قیمت‌گذاری برای هر مهارت، paywall، یا اشتراک درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ این بخشی از قالب مهارت نیست و باعث نمی‌شود یک مهارت منتشرشده پولی شود.
- اگر مهارت شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب موردنیاز را به‌روشنی در دستورالعمل‌های مهارت و اعلام‌های env مستند کنید (`requires.env` برای متغیرهای ضروری، یا `envVars` با `required: false` برای متغیرهای اختیاری).
