---
read_when:
    - انتشار Skills
    - اشکال‌زدایی خطاهای انتشار
summary: قالب پوشه Skill، فایل‌های الزامی، انواع فایل مجاز، محدودیت‌ها.
x-i18n:
    generated_at: "2026-07-02T14:07:42Z"
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

الزامی:

- `SKILL.md` (یا `skill.md`؛ `skills.md` قدیمی نیز پذیرفته می‌شود)

اختیاری:

- هر فایل پشتیبان _مبتنی بر متن_ (به «فایل‌های مجاز» مراجعه کنید)
- `.clawhubignore` (الگوهای نادیده‌گیری برای انتشار، `.clawdhubignore` قدیمی)
- `.gitignore` (نیز رعایت می‌شود)

## وارد کردن از GitHub

واردکننده وب GitHub سخت‌گیرتر از انتشار/همگام‌سازی محلی است. این ابزار فقط فایل‌های
`SKILL.md` یا `skills.md` قدیمی را در مخازن عمومی، غیر fork و متعلق به
حساب GitHub واردشده کشف می‌کند. مخازن خصوصی، forkها،
مخازن آرشیوشده/غیرفعال، یا مخازن عمومی شخص ثالث را وارد نمی‌کند.

فراداده نصب محلی (نوشته‌شده توسط CLI):

- `<skill>/.clawhub/origin.json` (`.clawdhub` قدیمی)

وضعیت نصب workdir (نوشته‌شده توسط CLI):

- `<workdir>/.clawhub/lock.json` (`.clawdhub` قدیمی)

## `SKILL.md`

- Markdown با frontmatter اختیاری YAML.
- سرور هنگام انتشار، فراداده را از frontmatter استخراج می‌کند.
- `description` به‌عنوان خلاصه Skill در UI/جست‌وجو استفاده می‌شود.

## فراداده frontmatter

فراداده Skill در frontmatter YAML در ابتدای `SKILL.md` شما اعلام می‌شود. این به رجیستری (و تحلیل امنیتی) می‌گوید Skill شما برای اجرا به چه چیزهایی نیاز دارد.

### frontmatter پایه

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### فراداده runtime (`metadata.openclaw`)

نیازمندی‌های runtime مربوط به Skill خود را زیر `metadata.openclaw` اعلام کنید (نام‌های مستعار: `metadata.clawdbot`، `metadata.clawdis`).

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

برای متغیرهای محیطی که پیش از اجرای Skill باید وجود داشته باشند، از `requires.env` استفاده کنید. وقتی به فراداده برای هر متغیر نیاز دارید، از جمله متغیرهای اختیاری با `required: false`، از `envVars` استفاده کنید.

### مرجع کامل فیلدها

| فیلد              | نوع       | توضیح                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | متغیرهای محیطی الزامی که Skill شما انتظار دارد.                                                                                           |
| `requires.bins`    | `string[]` | باینری‌های CLI که همگی باید نصب شده باشند.                                                                                                     |
| `requires.anyBins` | `string[]` | باینری‌های CLI که حداقل یکی از آن‌ها باید وجود داشته باشد.                                                                                                  |
| `requires.config`  | `string[]` | مسیرهای فایل پیکربندی که Skill شما می‌خواند.                                                                                                          |
| `primaryEnv`       | `string`   | متغیر محیطی اعتبارنامه اصلی برای Skill شما.                                                                                                  |
| `envVars`          | `array`    | اعلان‌های متغیر محیطی با `name`، `required` اختیاری، و `description` اختیاری. برای متغیرهای محیطی اختیاری، `required: false` را تنظیم کنید. |
| `always`           | `boolean`  | اگر `true` باشد، Skill همیشه فعال است (نیازی به نصب صریح نیست).                                                                              |
| `skillKey`         | `string`   | کلید فراخوانی Skill را بازنویسی می‌کند.                                                                                                         |
| `emoji`            | `string`   | ایموجی نمایشی برای Skill.                                                                                                                 |
| `homepage`         | `string`   | URL صفحه اصلی یا مستندات Skill.                                                                                                         |
| `os`               | `string[]` | محدودیت‌های OS (مثلاً `["macos"]`، `["linux"]`).                                                                                             |
| `install`          | `array`    | مشخصات نصب برای وابستگی‌ها (پایین را ببینید).                                                                                                  |
| `nix`              | `object`   | مشخصات Plugin مربوط به Nix (README را ببینید).                                                                                                                |
| `config`           | `object`   | مشخصات پیکربندی Clawdbot (README را ببینید).                                                                                                           |

### مشخصات نصب

اگر Skill شما به نصب وابستگی‌ها نیاز دارد، آن‌ها را در آرایه `install` اعلام کنید:

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

متغیرهای محیطی اختیاری را زیر `metadata.openclaw.envVars` اعلام کنید و `required: false` را تنظیم کنید. ورودی‌های اختیاری را به `requires.env` اضافه نکنید، چون `requires.env` یعنی Skill بدون آن‌ها نمی‌تواند اجرا شود.

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

تحلیل امنیتی ClawHub بررسی می‌کند آنچه Skill شما اعلام می‌کند با آنچه واقعاً انجام می‌دهد مطابقت داشته باشد. اگر کد شما به `TODOIST_API_KEY` ارجاع دهد اما frontmatter شما آن را زیر `requires.env`، `primaryEnv`، یا `envVars` اعلام نکرده باشد، تحلیل یک عدم تطابق فراداده را علامت‌گذاری می‌کند. دقیق نگه داشتن اعلان‌ها به Skill شما کمک می‌کند از بازبینی عبور کند و به کاربران کمک می‌کند بفهمند چه چیزی را نصب می‌کنند.

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

فقط فایل‌های «مبتنی بر متن» توسط انتشار پذیرفته می‌شوند.

- فهرست مجاز پسوندها در `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) است.
- فایل‌های اسکریپت پس از بارگذاری همچنان اسکن می‌شوند؛ فایل‌های PowerShell با پسوندهای `.ps1`، `.psm1` و `.psd1` به‌عنوان متن پذیرفته می‌شوند.
- نوع‌های محتوا که با `text/` شروع می‌شوند به‌عنوان متن در نظر گرفته می‌شوند؛ به‌علاوه یک فهرست مجاز کوچک (JSON/YAML/TOML/JS/TS/Markdown/SVG).

محدودیت‌ها (سمت سرور):

- اندازه کل بسته: 50MB.
- متن embedding شامل `SKILL.md` + تا حدود ۴۰ فایل غیر `.md` است (سقف بر اساس بهترین تلاش).

## Slugها

- به‌طور پیش‌فرض از نام پوشه مشتق می‌شوند.
- scopeهای بسته باید دقیقاً با handle ناشر ClawHub مطابقت داشته باشند. handleهای ناشر می‌توانند از حروف کوچک، اعداد، خط تیره، نقطه و زیرخط استفاده کنند؛ باید با یک حرف کوچک یا عدد شروع و تمام شوند.
- slugهای بسته باید با حروف کوچک و برای npm امن باشند، برای مثال `@example.tools/demo-plugin` یا `demo-plugin`.

## نسخه‌بندی + tagها

- هر انتشار یک نسخه جدید (semver) ایجاد می‌کند.
- tagها اشاره‌گرهای رشته‌ای به یک نسخه هستند؛ `latest` معمولاً استفاده می‌شود.

## مجوز

- همه Skills منتشرشده در ClawHub تحت `MIT-0` مجوزدهی می‌شوند.
- هر کسی می‌تواند Skills منتشرشده را استفاده، تغییر و بازتوزیع کند، از جمله به‌صورت تجاری.
- ذکر منبع الزامی نیست.
- شرایط مجوز ناسازگار را به `SKILL.md` اضافه نکنید؛ ClawHub از بازنویسی مجوز برای هر Skill پشتیبانی نمی‌کند.

## Skills پولی

- ClawHub از Skills پولی، قیمت‌گذاری برای هر Skill، paywallها، یا تقسیم درآمد پشتیبانی نمی‌کند.
- فراداده قیمت‌گذاری را به `SKILL.md` اضافه نکنید؛ بخشی از قالب Skill نیست و یک Skill منتشرشده را پولی نمی‌کند.
- اگر Skill شما با یک سرویس شخص ثالث پولی یکپارچه می‌شود، هزینه خارجی و حساب موردنیاز را در دستورالعمل‌های Skill و اعلان‌های env به‌روشنی مستند کنید (`requires.env` برای متغیرهای الزامی، یا `envVars` با `required: false` برای متغیرهای اختیاری).
