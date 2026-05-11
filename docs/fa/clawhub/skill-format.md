---
read_when:
    - انتشار Skills
    - عیب‌یابی خطاهای انتشار/همگام‌سازی
summary: قالب پوشهٔ Skill، فایل‌های الزامی، انواع فایل مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-05-11T20:27:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# قالب Skill

## روی دیسک

یک Skill یک پوشه است.

ضروری:

- `SKILL.md` (یا `skill.md`)

اختیاری:

- هر فایل پشتیبان _متنی_ (بخش «فایل‌های مجاز» را ببینید)
- `.clawhubignore` (الگوهای نادیده‌گرفتن برای انتشار/همگام‌سازی، `.clawdhubignore` قدیمی)
- `.gitignore` (آن هم رعایت می‌شود)

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب در پوشه کاری (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه Skill در UI/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده Skill در frontmatter YAML در بالای `SKILL.md` شما تعریف می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید Skill شما برای اجرا به چه چیزهایی نیاز دارد.

### frontmatter پایه

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### فراداده زمان اجرا (`metadata.openclaw`)

نیازمندی‌های زمان اجرای Skill خود را زیر `metadata.openclaw` تعریف کنید (نام‌های مستعار: `metadata.clawdbot`، `metadata.clawdis`).

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

برای متغیرهای محیطی که پیش از اجرای Skill باید وجود داشته باشند، از `requires.env` استفاده کنید. وقتی برای هر متغیر به فراداده نیاز دارید، از جمله متغیرهای اختیاری با `required: false`، از `envVars` استفاده کنید.

### مرجع کامل فیلدها

| فیلد               | نوع        | توضیح                                                                                                                                   |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی ضروری که Skill شما انتظار دارد.                                                                                          |
| `requires.bins`    | `string[]` | باینری‌های CLI که همگی باید نصب شده باشند.                                                                                               |
| `requires.anyBins` | `string[]` | باینری‌های CLI که دست‌کم یکی از آن‌ها باید وجود داشته باشد.                                                                              |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که Skill شما می‌خواند.                                                                                             |
| `primaryEnv`       | `string`   | متغیر محیطی اصلی مربوط به اعتبارنامه برای Skill شما.                                                                                    |
| `envVars`          | `array`    | تعریف‌های متغیر محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری `required: false` را تنظیم کنید. |
| `always`           | `boolean`  | اگر `true` باشد، Skill همیشه فعال است (نیازی به نصب صریح نیست).                                                                          |
| `skillKey`         | `string`   | کلید فراخوانی Skill را بازنویسی می‌کند.                                                                                                  |
| `emoji`            | `string`   | ایموجی نمایشی برای Skill.                                                                                                                |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات Skill.                                                                                                          |
| `os`               | `string[]` | محدودیت‌های سیستم‌عامل (مثلاً `["macos"]`، `["linux"]`).                                                                                 |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین‌تر را ببینید).                                                                                        |
| `nix`              | `object`   | مشخصات Plugin برای Nix (README را ببینید).                                                                                               |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                             |

### مشخصات نصب

اگر Skill شما به نصب وابستگی‌ها نیاز دارد، آن‌ها را در آرایه `install` تعریف کنید:

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

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` تعریف کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، چون `requires.env` یعنی Skill بدون آن‌ها نمی‌تواند اجرا شود.

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

تحلیل امنیتی ClawHub بررسی می‌کند که آنچه Skill شما اعلام می‌کند با کاری که واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv` یا `envVars` تعریف نکرده باشد، تحلیل یک ناسازگاری فراداده را گزارش می‌کند. دقیق نگه‌داشتن تعریف‌ها کمک می‌کند Skill شما بازبینی را با موفقیت پشت سر بگذارد و به کاربران کمک می‌کند بفهمند چه چیزی را نصب می‌کنند.

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

- فهرست مجاز پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) است.
- فایل‌های اسکریپت پس از بارگذاری همچنان پویش می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1` و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوایی که با `text/` شروع می‌شوند به‌عنوان متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل بسته: 50MB.
- متن embedding شامل `SKILL.md` + تا حدود ۴۰ فایل غیر `.md` است (سقف به‌صورت بهترین تلاش).

## Slugها

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شود.
- باید حروف کوچک و مناسب URL باشد: `^[a-z0-9][a-z0-9-]*$`.

## نسخه‌بندی + برچسب‌ها

- هر انتشار یک نسخه جدید ایجاد می‌کند (semver).
- برچسب‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه Skills منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هر کسی می‌تواند از Skills منتشرشده استفاده کند، آن‌ها را تغییر دهد و بازتوزیع کند، از جمله به‌صورت تجاری.
- ذکر منبع لازم نیست.
- در `SKILL.md` شرایط مجوز متعارض اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر Skill پشتیبانی نمی‌کند.

## Skills پولی

- ClawHub از Skills پولی، قیمت‌گذاری برای هر Skill، paywall یا اشتراک درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ بخشی از قالب Skill نیست و یک Skill منتشرشده را پولی نمی‌کند.
- اگر Skill شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب موردنیاز را در دستورالعمل‌های Skill و تعریف‌های محیطی به‌روشنی مستند کنید (`requires.env` برای متغیرهای ضروری، یا `envVars` با `required: false` برای متغیرهای اختیاری).
