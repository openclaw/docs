---
read_when:
    - انتشار Skills
    - اشکال‌زدایی از شکست‌های انتشار/همگام‌سازی
summary: قالب پوشه Skill، فایل‌های الزامی، انواع فایل‌های مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-05-12T00:58:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# قالب مهارت

## روی دیسک

یک مهارت یک پوشه است.

ضروری:

- `SKILL.md` (یا `skill.md`)

اختیاری:

- هر فایل پشتیبان _مبتنی بر متن_ (بخش «فایل‌های مجاز» را ببینید)
- `.clawhubignore` (الگوهای نادیده‌گیری برای انتشار/همگام‌سازی، `.clawdhubignore` قدیمی)
- `.gitignore` (آن هم رعایت می‌شود)

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب workdir (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با YAML frontmatter اختیاری.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه مهارت در UI/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده مهارت در YAML frontmatter بالای `SKILL.md` شما اعلان می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید مهارت شما برای اجرا به چه چیزهایی نیاز دارد.

### frontmatter پایه

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### فراداده زمان اجرا (`metadata.openclaw`)

نیازمندی‌های زمان اجرای مهارت خود را زیر `metadata.openclaw` اعلان کنید (نام‌های مستعار: `metadata.clawdbot`، `metadata.clawdis`).

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

از `requires.env` برای متغیرهای محیطی استفاده کنید که باید پیش از اجرای مهارت وجود داشته باشند. وقتی به فراداده برای هر متغیر نیاز دارید، از جمله متغیرهای اختیاری با `required: false`، از `envVars` استفاده کنید.

### مرجع کامل فیلدها

| فیلد              | نوع       | توضیح                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی ضروری که مهارت شما انتظار دارد.                                                                                           |
| `requires.bins`    | `string[]` | باینری‌های CLI که همه آن‌ها باید نصب شده باشند.                                                                                                     |
| `requires.anyBins` | `string[]` | باینری‌های CLI که حداقل یکی از آن‌ها باید وجود داشته باشد.                                                                                                  |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که مهارت شما می‌خواند.                                                                                                          |
| `primaryEnv`       | `string`   | متغیر محیطی اصلیِ اعتبارنامه برای مهارت شما.                                                                                                  |
| `envVars`          | `array`    | اعلان‌های متغیر محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری، `required: false` را تنظیم کنید. |
| `always`           | `boolean`  | اگر `true` باشد، مهارت همیشه فعال است (نیازی به نصب صریح نیست).                                                                              |
| `skillKey`         | `string`   | کلید فراخوانی مهارت را بازنویسی کنید.                                                                                                         |
| `emoji`            | `string`   | ایموجی نمایشی برای مهارت.                                                                                                                 |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات مهارت.                                                                                                         |
| `os`               | `string[]` | محدودیت‌های OS (مثلاً `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین را ببینید).                                                                                                  |
| `nix`              | `object`   | مشخصات Nix plugin (README را ببینید).                                                                                                                |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                                           |

### مشخصات نصب

اگر مهارت شما نیاز دارد وابستگی‌هایی نصب شوند، آن‌ها را در آرایه `install` اعلان کنید:

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

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` اعلان کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، زیرا `requires.env` یعنی مهارت بدون آن‌ها نمی‌تواند اجرا شود.

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

تحلیل امنیتی ClawHub بررسی می‌کند که آنچه مهارت شما اعلان می‌کند با کاری که واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv`، یا `envVars` اعلان نکرده باشد، تحلیل یک ناهماهنگی فراداده را علامت‌گذاری می‌کند. دقیق نگه داشتن اعلان‌ها به مهارت شما کمک می‌کند بررسی را پشت سر بگذارد و به کاربران کمک می‌کند بفهمند چه چیزی را نصب می‌کنند.

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

فقط فایل‌های «مبتنی بر متن» برای انتشار پذیرفته می‌شوند.

- فهرست مجاز پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) است.
- فایل‌های اسکریپت همچنان پس از بارگذاری اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1` و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند، متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل بسته: 50MB.
- متن embedding شامل `SKILL.md` + حداکثر حدود ۴۰ فایل غیر `.md` است (سقف با بهترین تلاش).

## Slugها

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شوند.
- باید با حروف کوچک و برای URL ایمن باشند: `^[a-z0-9][a-z0-9-]*$`.

## نسخه‌بندی + برچسب‌ها

- هر انتشار یک نسخه جدید ایجاد می‌کند (semver).
- برچسب‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه مهارت‌های منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هر کسی می‌تواند از مهارت‌های منتشرشده استفاده کند، آن‌ها را تغییر دهد و بازتوزیع کند، از جمله برای مقاصد تجاری.
- ذکر منبع لازم نیست.
- شرایط مجوز ناسازگار را در `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر مهارت پشتیبانی نمی‌کند.

## مهارت‌های پولی

- ClawHub از مهارت‌های پولی، قیمت‌گذاری برای هر مهارت، paywall، یا اشتراک درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ این بخشی از قالب مهارت نیست و باعث نمی‌شود یک مهارت منتشرشده پولی شود.
- اگر مهارت شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب موردنیاز را به‌روشنی در دستورالعمل‌های مهارت و اعلان‌های env مستند کنید (`requires.env` برای متغیرهای ضروری، یا `envVars` با `required: false` برای متغیرهای اختیاری).
