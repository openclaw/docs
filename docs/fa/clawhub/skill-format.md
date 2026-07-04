---
read_when:
    - انتشار Skills
    - اشکال‌زدایی شکست‌های انتشار
summary: قالب پوشه Skill، فایل‌های الزامی، انواع فایل‌های مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-07-04T18:11:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# قالب Skill

## روی دیسک

یک Skill یک پوشه است.

ضروری:

- `SKILL.md` (یا `skill.md`؛ `skills.md` قدیمی نیز پذیرفته می‌شود)

اختیاری:

- هر فایل _متنی_ پشتیبان (بخش «فایل‌های مجاز» را ببینید)
- `.clawhubignore` (الگوهای نادیده‌گیری برای انتشار، `.clawdhubignore` قدیمی)
- `.gitignore` (آن هم رعایت می‌شود)

## وارد کردن از GitHub

واردکننده وب GitHub سخت‌گیرتر از انتشار/همگام‌سازی محلی است. فقط فایل‌های
`SKILL.md` یا `skills.md` قدیمی را در مخزن‌های عمومی، غیر fork و متعلق به
حساب GitHub واردشده کشف می‌کند. مخزن‌های خصوصی، forkها،
مخزن‌های آرشیوشده/غیرفعال، یا مخزن‌های عمومی شخص ثالث را وارد نمی‌کند.

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب workdir (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه skill در UI/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده Skill در frontmatter YAML در بالای `SKILL.md` شما تعریف می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید skill شما برای اجرا به چه چیزهایی نیاز دارد.

### frontmatter پایه

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### فراداده زمان اجرا (`metadata.openclaw`)

نیازمندی‌های زمان اجرای skill خود را زیر `metadata.openclaw` تعریف کنید (نام‌های مستعار: `metadata.clawdbot`، `metadata.clawdis`).

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

از `requires.env` برای متغیرهای محیطی استفاده کنید که باید پیش از اجرای skill وجود داشته باشند. وقتی به فراداده برای هر متغیر نیاز دارید، از جمله متغیرهای اختیاری با `required: false`، از `envVars` استفاده کنید.

### مرجع کامل فیلدها

| فیلد               | نوع        | توضیح                                                                                                                                                    |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی ضروری که skill شما انتظار دارد.                                                                                                          |
| `requires.bins`    | `string[]` | باینری‌های CLI که همه باید نصب شده باشند.                                                                                                                |
| `requires.anyBins` | `string[]` | باینری‌های CLI که حداقل یکی از آن‌ها باید وجود داشته باشد.                                                                                               |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که skill شما می‌خواند.                                                                                                             |
| `primaryEnv`       | `string`   | متغیر محیطی اعتبارنامه اصلی برای skill شما.                                                                                                              |
| `envVars`          | `array`    | تعریف‌های متغیر محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری، `required: false` را تنظیم کنید.             |
| `always`           | `boolean`  | اگر `true` باشد، skill همیشه فعال است (نیازی به نصب صریح ندارد).                                                                                        |
| `skillKey`         | `string`   | کلید فراخوانی skill را بازنویسی می‌کند.                                                                                                                   |
| `emoji`            | `string`   | ایموجی نمایش برای skill.                                                                                                                                  |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات skill.                                                                                                                          |
| `os`               | `string[]` | محدودیت‌های سیستم‌عامل (مثلاً `["macos"]`، `["linux"]`).                                                                                                |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین را ببینید).                                                                                                            |
| `nix`              | `object`   | مشخصات Nix plugin (README را ببینید).                                                                                                                     |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                                             |

### مشخصات نصب

اگر skill شما به نصب وابستگی‌ها نیاز دارد، آن‌ها را در آرایه `install` تعریف کنید:

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

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` تعریف کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، چون `requires.env` یعنی skill بدون آن‌ها نمی‌تواند اجرا شود.

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

تحلیل امنیتی ClawHub بررسی می‌کند که آنچه skill شما تعریف می‌کند با کاری که واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv`، یا `envVars` تعریف نکرده باشد، تحلیل یک عدم تطابق فراداده را علامت‌گذاری می‌کند. دقیق نگه داشتن تعریف‌ها به skill شما کمک می‌کند از بازبینی عبور کند و به کاربران کمک می‌کند بفهمند چه چیزی نصب می‌کنند.

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
- فایل‌های اسکریپت همچنان پس از بارگذاری اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1` و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند به‌عنوان متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل بسته: 50MB.
- متن جاسازی شامل `SKILL.md` + حداکثر حدود 40 فایل غیر `.md` است (سقف با بیشترین تلاش).

## Slugها

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شوند.
- scopeهای package باید دقیقاً با شناسه ناشر ClawHub مطابقت داشته باشند. شناسه‌های ناشر می‌توانند از حروف کوچک، اعداد، خط تیره، نقطه و زیرخط استفاده کنند؛ باید با یک حرف کوچک یا عدد شروع و تمام شوند.
- Slugهای package باید با حروف کوچک و برای npm ایمن باشند، برای مثال `@example.tools/demo-plugin` یا `demo-plugin`.

## نسخه‌بندی + برچسب‌ها

- هر انتشار یک نسخه جدید (semver) ایجاد می‌کند.
- برچسب‌ها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه skillهای منتشرشده در ClawHub تحت مجوز `MIT-0` هستند.
- هر کسی می‌تواند از skillهای منتشرشده استفاده کند، آن‌ها را تغییر دهد و دوباره توزیع کند، از جمله به‌صورت تجاری.
- ذکر منبع لازم نیست.
- شرایط مجوز متناقض را در `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر skill پشتیبانی نمی‌کند.

## skillهای پولی

- ClawHub از skillهای پولی، قیمت‌گذاری برای هر skill، paywallها یا اشتراک درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ این بخشی از قالب skill نیست و skill منتشرشده را پولی نمی‌کند.
- اگر skill شما با یک سرویس پولی شخص ثالث یکپارچه می‌شود، هزینه خارجی و حساب لازم را به‌روشنی در دستورالعمل‌های skill و تعریف‌های env مستند کنید (`requires.env` برای متغیرهای ضروری، یا `envVars` با `required: false` برای متغیرهای اختیاری).
